-- Aplicações do dia: um pedido sem resposta do worker deixa de contar ao fim de 3 minutos (antes: 10 min a pendente).
--
-- A ficha dá o pedido por perdido aos 3 min e volta a deixar carregar em «Gerar». Se o servidor ainda reaproveitasse o
-- pedido pendente durante 10 min, esse novo clique devolvia o mesmo pedido já «perdido» e a ficha ficava sem forma de
-- tentar de novo. Passa a haver o mesmo prazo nos dois lados: o pedido antigo vai para erro e cria-se um novo.

CREATE OR REPLACE FUNCTION public.pedir_aplicacoes_dia(p_data date)
RETURNS public.pedidos_aplicacoes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_p public.pedidos_aplicacoes;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF p_data IS NULL THEN
    RAISE EXCEPTION 'Data em falta';
  END IF;

  -- O que ficou preso (worker desligado, sem rede, ou a meio) passa a erro, para não bloquear novos pedidos.
  UPDATE public.pedidos_aplicacoes
     SET estado = 'erro', concluido_em = now(),
         erro = 'O worker não respondeu a tempo (não está a correr ou não chega à app).'
   WHERE (estado = 'pendente' AND pedido_em < now() - interval '3 minutes')
      OR (estado = 'a-correr' AND coalesce(iniciado_em, pedido_em) < now() - interval '3 minutes');

  SELECT * INTO v_p FROM public.pedidos_aplicacoes
   WHERE estado IN ('pendente', 'a-correr') AND data = p_data
   ORDER BY pedido_em DESC LIMIT 1;
  IF FOUND THEN
    RETURN v_p;
  END IF;

  INSERT INTO public.pedidos_aplicacoes (data, pedido_por, pedido_por_nome)
  VALUES (p_data, auth.uid(), public.nome_operador_atual())
  RETURNING * INTO v_p;
  RETURN v_p;
END;
$$;

-- Pedidos que já estavam presos (de antes desta correção) vão para erro; idempotente.
UPDATE public.pedidos_aplicacoes
   SET estado = 'erro', concluido_em = now(),
       erro = 'O worker não respondeu a tempo (não está a correr ou não chega à app).'
 WHERE estado IN ('pendente', 'a-correr')
   AND coalesce(iniciado_em, pedido_em) < now() - interval '3 minutes';

REVOKE ALL ON FUNCTION public.pedir_aplicacoes_dia(date) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.pedir_aplicacoes_dia(date) TO authenticated;


-- O worker só apanha pedidos recentes: se arrancar (ou voltar da rede) depois de o pedido ter sido dado por perdido,
-- não corre uma leitura ao core que ninguém está à espera. Os antigos passam a erro.
CREATE OR REPLACE FUNCTION public.worker_reclamar_pedido(p_token text)
RETURNS public.pedidos_aplicacoes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_p public.pedidos_aplicacoes;
BEGIN
  IF public.token_worker_valido(p_token) IS NULL THEN
    RAISE EXCEPTION 'Token inválido';
  END IF;

  UPDATE public.pedidos_aplicacoes
     SET estado = 'erro', concluido_em = now(),
         erro = 'O worker não respondeu a tempo (não está a correr ou não chega à app).'
   WHERE estado = 'pendente' AND pedido_em < now() - interval '3 minutes';

  UPDATE public.pedidos_aplicacoes
     SET estado = 'a-correr', iniciado_em = now()
   WHERE id = (SELECT id FROM public.pedidos_aplicacoes WHERE estado = 'pendente' ORDER BY pedido_em LIMIT 1 FOR UPDATE SKIP LOCKED)
   RETURNING * INTO v_p;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  RETURN v_p;
END;
$$;

REVOKE ALL ON FUNCTION public.worker_reclamar_pedido(text) FROM public;
GRANT EXECUTE ON FUNCTION public.worker_reclamar_pedido(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
