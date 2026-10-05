-- ============================================================
-- 20260909_01_criar_tabelas_nucleo.sql
-- Tabelas núcleo: clientes, produtos, pedidos, pagamentos
-- Padrão: Plugmax (checkout + rastreio)
-- ============================================================

-- ------------------------------------------------------------
-- clientes — dados do cliente (cadastro + entrega na mesma linha)
-- ------------------------------------------------------------
CREATE TABLE public.clientes (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  nome         text        NOT NULL,
  email        text,
  cpf          text,
  telefone     text,
  cep          text,
  endereco     text,
  numero       text,
  complemento  text,
  bairro       text,
  cidade       text,
  estado       text,
  status       text        NOT NULL DEFAULT 'ativo',
  observacoes  text,
  origem       text,
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT clientes_pk PRIMARY KEY (id)
);

CREATE INDEX clientes_email_idx ON public.clientes (email);
CREATE INDEX clientes_cpf_idx  ON public.clientes (cpf);

-- ------------------------------------------------------------
-- produtos — catálogo (Plugmax: tomada inteligente)
-- ------------------------------------------------------------
CREATE TABLE public.produtos (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  nome         text        NOT NULL,
  descricao    text,
  valor        numeric     NOT NULL,
  imagem_url   text,
  imagem_url_2 text,
  imagem_url_3 text,
  categoria    text        NOT NULL DEFAULT 'P1',
  ativo        boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT produtos_pk PRIMARY KEY (id),
  CONSTRAINT produtos_categoria_check CHECK (categoria IN ('P1', 'P2', 'P3'))
);

INSERT INTO public.produtos (nome, descricao, valor, imagem_url, categoria, ativo) VALUES
  ('Tomada Inteligente Plugmax - Preto',
   'Tomada inteligente com USB, USB-C e 2 cabos retráteis. Frete grátis para todo o Brasil.',
   89.90, NULL, 'P1', true),
  ('Tomada Inteligente Plugmax - Branco',
   'Tomada inteligente com USB, USB-C e 2 cabos retráteis. Frete grátis para todo o Brasil.',
   89.90, NULL, 'P1', true);

-- ------------------------------------------------------------
-- pedidos — pedido do checkout
-- ------------------------------------------------------------
CREATE TABLE public.pedidos (
  id                    uuid        NOT NULL DEFAULT gen_random_uuid(),
  numero_pedido         serial,
  cliente_id            uuid        NOT NULL,
  produto_id            uuid        NOT NULL,
  valor                 numeric     NOT NULL,
  quantidade            integer     NOT NULL DEFAULT 1,
  status                text        NOT NULL,
  canal_venda           text,
  atendente             text,
  observacao            text,
  token_rastreamento    uuid        NOT NULL DEFAULT gen_random_uuid(),
  previsao_entrega_inicio timestamptz,
  previsao_entrega_fim  timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pedidos_pk PRIMARY KEY (id),
  CONSTRAINT pedidos_cliente_fk FOREIGN KEY (cliente_id)
    REFERENCES public.clientes (id),
  CONSTRAINT pedidos_produto_fk FOREIGN KEY (produto_id)
    REFERENCES public.produtos (id),
  CONSTRAINT pedidos_status_check CHECK (
    status IN ('aguardando_pagamento', 'pago', 'preparando', 'enviado', 'entregue', 'cancelado')
  )
);

CREATE INDEX pedidos_cliente_idx ON public.pedidos (cliente_id);
CREATE INDEX pedidos_produto_idx ON public.pedidos (produto_id);
CREATE INDEX pedidos_status_idx   ON public.pedidos (status);
CREATE UNIQUE INDEX pedidos_token_rastreamento_uniq
  ON public.pedidos (token_rastreamento);

-- ------------------------------------------------------------
-- pagamentos — pagamento PIX (1 pedido / N tentativas)
-- ------------------------------------------------------------
CREATE TABLE public.pagamentos (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
  pedido_id           uuid        NOT NULL,
  gateway             text,
  gateway_payment_id  text,
  pix_code            text,
  pix_qrcode          text,
  status              text        NOT NULL,
  valor               numeric,
  data_pagamento      timestamptz,
  resposta_gateway    jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pagamentos_pk PRIMARY KEY (id),
  CONSTRAINT pagamentos_pedido_fk FOREIGN KEY (pedido_id)
    REFERENCES public.pedidos (id) ON DELETE CASCADE,
  CONSTRAINT pagamentos_status_check CHECK (
    status IN ('pendente', 'pago', 'cancelado', 'expirado', 'estornado')
  )
);

CREATE INDEX pagamentos_pedido_idx        ON public.pagamentos (pedido_id);
CREATE INDEX pagamentos_gateway_id_idx    ON public.pagamentos (gateway_payment_id);
CREATE INDEX pagamentos_status_idx        ON public.pagamentos (status);