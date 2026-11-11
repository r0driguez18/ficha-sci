-- Passagem de turno: corrigir uma nota escrita errada.
--
-- Só quem deixou a nota a pode editar, e só enquanto não está arquivada. A 1.ª edição guarda o texto original
-- (texto_original) e todas marcam editada_em; a nota mostra o selo «Editada». As leituras já confirmadas ficam como estão.
-- (A auditoria geral — registo_alteracoes — já regista cada UPDATE com o antes e o depois.)

ALTER TABLE public.handover_entries
  ADD COLUMN IF NOT EXISTS texto_original text,
  ADD COLUMN IF NOT EXISTS editada_em timestamptz;

CREATE OR REPLACE FUNCTION public.editar_entrada_passagem_turno(p_id uuid, p_texto text)
RETURNS public.handover_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_e public.handover_entries;
  v_texto text := btrim(coalesce(p_texto, ''));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF v_texto = '' THEN
    RAISE EXCEPTION 'A nota está vazia';
  END IF;
  IF char_length(v_texto) > 4000 THEN
    RAISE EXCEPTION 'A nota excede 4000 caracteres';
  END IF;

  SELECT * INTO v_e FROM public.handover_entries WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nota não encontrada';
  END IF;
  IF v_e.autor_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Só quem deixou a nota a pode editar';
  END IF;
  IF v_e.arquivada_em IS NOT NULL THEN
    RAISE EXCEPTION 'Uma nota arquivada não se edita';
  END IF;
  IF v_texto = v_e.texto THEN
    RETURN v_e; -- nada mudou
  END IF;

  UPDATE public.handover_entries
     SET texto_original = coalesce(texto_original, texto),
         texto = v_texto,
         editada_em = now()
   WHERE id = p_id
   RETURNING * INTO v_e;
  RETURN v_e;
END;
$$;

REVOKE ALL ON FUNCTION public.editar_entrada_passagem_turno(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.editar_entrada_passagem_turno(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
