-- =====================================================
-- Retornos de Cobranças — fecha a RLS, força o autor real, evita duplicados
-- =====================================================
-- Achados de auditoria de segurança:
--
-- 1. A política de UPDATE era `USING (true) WITH CHECK (true)` — qualquer
--    autenticado podia reescrever QUALQUER coluna de QUALQUER linha da
--    equipa, não só "marcar enviado" ou "mudar prazo" (as duas únicas
--    ações que a app expõe). Incluía poder forjar `data_retorno_alterada_por`
--    com o id de outra pessoa.
--
-- 2. `data_retorno_enviado` vinha do relógio do browser do operador
--    (`new Date()`), não do servidor — um relógio mal acertado grava uma
--    data de envio errada.
--
-- Corrige movendo as duas escritas legítimas (marcar enviado, mudar prazo)
-- para funções SECURITY DEFINER — `data_retorno_alterada_por` passa a vir
-- sempre de auth.uid() no servidor, nunca de um parâmetro do cliente, e
-- `data_retorno_enviado` passa a vir de CURRENT_DATE do servidor. A
-- política de UPDATE genérica é removida — só as funções abaixo escrevem.
--
-- 3. Sem UNIQUE em (ficheiro_nome, data_aplicacao): guardar a mesma linha
--    "Cobranças" duas vezes criava dois registos de rastreio. Acrescenta
--    a constraint; createCobrancaRetorno trata o conflito como "já existe"
--    (tal como já acontece em file_processes), sem quebrar o fluxo.
-- =====================================================

-- Remove duplicados existentes antes de impor a constraint (mantém a
-- linha mais antiga de cada par, apaga as repetidas).
DELETE FROM public.cobrancas_retornos a
USING public.cobrancas_retornos b
WHERE a.ficheiro_nome = b.ficheiro_nome
  AND a.data_aplicacao = b.data_aplicacao
  AND a.created_at > b.created_at;

DO $$ BEGIN
  ALTER TABLE public.cobrancas_retornos
    ADD CONSTRAINT cobrancas_retornos_ficheiro_data_unique
    UNIQUE (ficheiro_nome, data_aplicacao);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP POLICY IF EXISTS "Collection returns are updatable by the team" ON public.cobrancas_retornos;
-- Sem política de UPDATE: só através das funções abaixo.

CREATE OR REPLACE FUNCTION public.marcar_retornos_enviados(p_ids uuid[], p_observacoes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF p_ids IS NULL OR array_length(p_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.cobrancas_retornos
     SET retorno_enviado = true,
         data_retorno_enviado = CURRENT_DATE,
         observacoes = COALESCE(NULLIF(trim(p_observacoes), ''), observacoes)
   WHERE id = ANY(p_ids);
END;
$$;

CREATE OR REPLACE FUNCTION public.alterar_prazo_retorno(p_id uuid, p_nova_data date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF p_nova_data IS NULL THEN
    RAISE EXCEPTION 'Data inválida';
  END IF;

  UPDATE public.cobrancas_retornos
     SET data_retorno_esperada = p_nova_data,
         data_retorno_alterada_por = auth.uid(),
         data_retorno_alterada_em = now()
   WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Retorno não encontrado';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.marcar_retornos_enviados(uuid[], text) FROM public, anon;
REVOKE ALL ON FUNCTION public.alterar_prazo_retorno(uuid, date) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.marcar_retornos_enviados(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.alterar_prazo_retorno(uuid, date) TO authenticated;

NOTIFY pgrst, 'reload schema';
