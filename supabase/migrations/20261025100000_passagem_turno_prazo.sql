-- Passagem de turno: a nota sai das ativas 24 h depois da 2.ª confirmação.
--
-- Uma nota deixada por um turno é vista por todos (os dois turnos seguintes). Cada pessoa, que não quem a deixou,
-- confirma a leitura; podem ser mais de duas. Quando a 2.ª pessoa confirma, começa a contar 24 h: passado esse prazo
-- a nota deixa de aparecer nas "ativas" e fica só no histórico (arquivada automaticamente). Quem deixou a nota não
-- pode confirmar a leitura da própria nota (não conta).
--
-- Não há tarefa agendada: `arquivar_apos` guarda o instante, e as consultas "ativas" ignoram as notas cujo prazo
-- já passou. Nada se apaga.

ALTER TABLE public.handover_entries
  ADD COLUMN IF NOT EXISTS arquivar_apos timestamptz;

CREATE INDEX IF NOT EXISTS idx_handover_entries_arquivar_apos
  ON public.handover_entries (arquivar_apos) WHERE arquivar_apos IS NOT NULL;

-- Notas que já tinham 2 leituras (de pessoas que não o autor): o prazo conta a partir da 2.ª. Idempotente.
UPDATE public.handover_entries e
   SET arquivar_apos = s.segunda + interval '24 hours'
  FROM (
    SELECT r.entry_id, (array_agg(r.lida_em ORDER BY r.lida_em))[2] AS segunda
      FROM public.handover_reads r
      JOIN public.handover_entries x ON x.id = r.entry_id
     WHERE r.user_id IS DISTINCT FROM x.autor_user_id
     GROUP BY r.entry_id
    HAVING count(*) >= 2
  ) s
 WHERE e.id = s.entry_id
   AND e.arquivar_apos IS NULL
   AND e.arquivada_em IS NULL;

CREATE OR REPLACE FUNCTION public.confirmar_leitura_entrada_passagem_turno(p_entry_id uuid)
RETURNS public.handover_reads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_entrada public.handover_entries;
  v_leitura public.handover_reads;
  v_segunda timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_entrada FROM public.handover_entries WHERE id = p_entry_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nota não encontrada';
  END IF;
  IF v_entrada.autor_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Quem deixou a nota não confirma a leitura da própria nota';
  END IF;

  INSERT INTO public.handover_reads (entry_id, user_id, user_nome)
  VALUES (p_entry_id, auth.uid(), public.nome_operador_atual())
  ON CONFLICT (entry_id, user_id) DO NOTHING;

  -- 2.ª leitura de alguém que não o autor: começa o prazo de 24 h.
  IF v_entrada.arquivar_apos IS NULL AND v_entrada.arquivada_em IS NULL THEN
    SELECT x.lida_em INTO v_segunda
      FROM (
        SELECT r.lida_em
          FROM public.handover_reads r
         WHERE r.entry_id = p_entry_id AND r.user_id IS DISTINCT FROM v_entrada.autor_user_id
         ORDER BY r.lida_em
         OFFSET 1 LIMIT 1
      ) x;
    IF v_segunda IS NOT NULL THEN
      UPDATE public.handover_entries SET arquivar_apos = v_segunda + interval '24 hours' WHERE id = p_entry_id;
    END IF;
  END IF;

  SELECT * INTO v_leitura FROM public.handover_reads
   WHERE entry_id = p_entry_id AND user_id = auth.uid();
  RETURN v_leitura;
END;
$$;

REVOKE ALL ON FUNCTION public.confirmar_leitura_entrada_passagem_turno(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.confirmar_leitura_entrada_passagem_turno(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
