-- Mensagens de início/término do fecho para o Teams.
-- O endereço do webhook e o registo dos envios só são lidos/escritos pela função
-- notificar-fecho (chave de serviço): sem políticas = nenhum acesso pelo browser.

CREATE TABLE IF NOT EXISTS public.notificacoes_config (
  chave          text PRIMARY KEY,
  valor          text NOT NULL,
  atualizado_em  timestamptz NOT NULL DEFAULT now(),
  atualizado_por text
);
ALTER TABLE public.notificacoes_config ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notificacoes_fecho (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data      date NOT NULL,
  tipo      text NOT NULL CHECK (tipo IN ('inicio', 'termino')),
  hora      text,
  operador  text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  -- um evento por dia e tipo: dois postos a marcar o mesmo evento só enviam uma mensagem
  UNIQUE (data, tipo)
);
ALTER TABLE public.notificacoes_fecho ENABLE ROW LEVEL SECURITY;
