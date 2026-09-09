-- ============================================================
-- 20260909_02_criar_cartoes_rastreamento.sql
-- cartoes (dados SEGUROS do cartão — PCI conform), rastreamentos
-- e eventos_rastreamento. Origem: Praia Grande/SP.
--
-- ATENÇÃO PCI-DSS: nunca gravar número completo (PAN) nem CVV.
-- Esta tabela guarda apenas: titular, bandeira, últimos 4 dígitos,
-- mês/ano de validade e token do gateway (se houver). O checkout
-- ilustrativo é finalizado via PIX.
-- ============================================================

-- ------------------------------------------------------------
-- cartoes — dados do cartão em formato seguro (SEM PAN/CVV)
-- ------------------------------------------------------------
CREATE TABLE public.cartoes (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  cliente_id      uuid        NOT NULL,
  pedido_id       uuid,
  titular         text        NOT NULL,
  bandeira        text,
  ultimos_digitos text,
  validade_mes    text,
  validade_ano    text,
  token_gateway   text,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT cartoes_pk PRIMARY KEY (id),
  CONSTRAINT cartoes_cliente_fk FOREIGN KEY (cliente_id)
    REFERENCES public.clientes (id),
  CONSTRAINT cartoes_pedido_fk FOREIGN KEY (pedido_id)
    REFERENCES public.pedidos (id) ON DELETE CASCADE
);

CREATE INDEX cartoes_cliente_idx ON public.cartoes (cliente_id);
CREATE INDEX cartoes_pedido_idx  ON public.cartoes (pedido_id);

-- ------------------------------------------------------------
-- rastreamentos — 1 por pedido pago
-- ------------------------------------------------------------
CREATE TABLE public.rastreamentos (
  id             uuid        NOT NULL DEFAULT gen_random_uuid(),
  pedido_id      uuid        NOT NULL,
  codigo_rastreio text       NOT NULL,
  status         text        NOT NULL,
  previsao_inicio timestamptz,
  previsao_fim   timestamptz,
  liberado_em    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT rastreamentos_pk PRIMARY KEY (id),
  CONSTRAINT rastreamentos_pedido_fk FOREIGN KEY (pedido_id)
    REFERENCES public.pedidos (id),
  CONSTRAINT rastreamentos_status_check CHECK (
    status IN ('preparando', 'em_transito', 'entregue')
  )
);

CREATE INDEX rastreamentos_pedido_idx         ON public.rastreamentos (pedido_id);
CREATE UNIQUE INDEX rastreamentos_codigo_uniq ON public.rastreamentos (codigo_rastreio);

-- ------------------------------------------------------------
-- eventos_rastreamento — timeline do envio
-- ------------------------------------------------------------
CREATE TABLE public.eventos_rastreamento (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  rastreamento_id uuid        NOT NULL,
  titulo          text        NOT NULL,
  descricao       text,
  cidade          text,
  estado          text,
  status          text        NOT NULL DEFAULT 'concluido',
  data_evento     timestamptz NOT NULL,

  CONSTRAINT eventos_rastreamento_pk PRIMARY KEY (id),
  CONSTRAINT eventos_rastreamento_rastreamento_fk FOREIGN KEY (rastreamento_id)
    REFERENCES public.rastreamentos (id) ON DELETE CASCADE
);

CREATE INDEX eventos_rastreamento_tracking_idx
  ON public.eventos_rastreamento (rastreamento_id, data_evento);