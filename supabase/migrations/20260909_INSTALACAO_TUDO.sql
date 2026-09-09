-- ============================================================
-- Plugmax — INSTALACAO COMPLETA DO BANCO (1 comando)
-- Rode este arquivo inteiro no SQL Editor do Supabase.
-- Ele cria: clientes, produtos, pedidos, pagamentos, cartoes,
-- rastreamentos, eventos_rastreamento, cidades_rota,
-- emails_enviados + RPCs de rastreio + fechamento de acesso (RLS).
-- ============================================================

-- ------------------------------------------------------------
-- 01) clientes — dados do cliente (cadastro + entrega na mesma linha)
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
-- 02) produtos — catalogo (Plugmax: tomada inteligente)
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
-- 03) pedidos — pedido do checkout
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
-- 04) pagamentos — pagamento PIX (1 pedido / N tentativas)
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

-- ------------------------------------------------------------
-- 05) cartoes — dados do cartao em formato SEGURO (SEM PAN/CVV - PCI)
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
-- 06) rastreamentos — 1 por pedido pago
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
-- 07) eventos_rastreamento — timeline do envio
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

-- ------------------------------------------------------------
-- 08) cidades_rota — hubs: ORIGEM Praia Grande/SP (CTCE-PG) + capitais
-- ------------------------------------------------------------
CREATE TABLE public.cidades_rota (
  id         uuid    NOT NULL DEFAULT gen_random_uuid(),
  nome       text    NOT NULL,
  uf         text    NOT NULL,
  regiao     text    NOT NULL,
  nome_local text,
  latitude   double precision NOT NULL,
  longitude  double precision NOT NULL,

  CONSTRAINT cidades_rota_pk PRIMARY KEY (id),
  CONSTRAINT cidades_rota_nome_uf_uniq UNIQUE (nome, uf)
);

INSERT INTO public.cidades_rota (nome, uf, regiao, nome_local, latitude, longitude) VALUES
  ('Praia Grande',          'SP', 'Sudeste',     'CTCE-PG',  -24.0058, -46.4028),
  ('Sao Paulo',             'SP', 'Sudeste',     NULL,       -23.5505, -46.6333),
  ('Rio de Janeiro',        'RJ', 'Sudeste',     NULL,       -22.9068, -43.1729),
  ('Vitoria',               'ES', 'Sudeste',     NULL,       -20.2976, -40.2958),
  ('Belo Horizonte',        'MG', 'Sudeste',     NULL,       -19.9167, -43.9333),
  ('Brasilia',              'DF', 'Centro-Oeste',NULL,       -15.7975, -47.8919),
  ('Goiania',               'GO', 'Centro-Oeste',NULL,       -16.6864, -49.2643),
  ('Campo Grande',          'MS', 'Centro-Oeste',NULL,       -20.4697, -54.6201),
  ('Cuiaba',                'MT', 'Centro-Oeste',NULL,       -15.6010, -56.0974),
  ('Curitiba',              'PR', 'Sul',         NULL,       -25.4290, -49.2671),
  ('Florianopolis',         'SC', 'Sul',         NULL,       -27.5969, -48.5495),
  ('Porto Alegre',          'RS', 'Sul',         NULL,       -30.0346, -51.2177),
  ('Salvador',              'BA', 'Nordeste',    NULL,       -12.9704, -38.5124),
  ('Recife',                'PE', 'Nordeste',    NULL,       -8.0476,  -34.8770),
  ('Fortaleza',             'CE', 'Nordeste',    NULL,       -3.7172,  -38.5433),
  ('Sao Luis',              'MA', 'Nordeste',    NULL,       -2.5307,  -44.3068),
  ('Natal',                 'RN', 'Nordeste',    NULL,       -5.7939,  -35.2108),
  ('Joao Pessoa',           'PB', 'Nordeste',    NULL,       -7.1150,  -34.8640),
  ('Maceio',                'AL', 'Nordeste',    NULL,       -9.6663,  -35.7354),
  ('Aracaju',               'SE', 'Nordeste',    NULL,       -10.9472, -37.0731),
  ('Teresina',              'PI', 'Nordeste',    NULL,       -5.0920,  -42.8038),
  ('Belem',                 'PA', 'Norte',       NULL,       -1.4558,  -48.5044),
  ('Manaus',                'AM', 'Norte',       NULL,       -3.1190,  -60.0217),
  ('Porto Velho',           'RO', 'Norte',       NULL,       -8.7608,  -63.9020),
  ('Palmas',                'TO', 'Norte',       NULL,       -10.1653, -48.3469),
  ('Macapa',                'AP', 'Norte',       NULL,       0.0349,   -51.0694),
  ('Boa Vista',             'RR', 'Norte',       NULL,       2.8195,   -60.6733),
  ('Rio Branco',            'AC', 'Norte',       NULL,       -9.9795,  -67.8230);

-- ------------------------------------------------------------
-- 09) emails_enviados
-- ------------------------------------------------------------
CREATE TABLE public.emails_enviados (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  pedido_id    uuid        NOT NULL,
  tipo         text        NOT NULL,
  destinatario text        NOT NULL,
  status       text        NOT NULL DEFAULT 'enviado',
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT emails_enviados_pk PRIMARY KEY (id),
  CONSTRAINT emails_enviados_pedido_fk FOREIGN KEY (pedido_id)
    REFERENCES public.pedidos (id) ON DELETE CASCADE,
  CONSTRAINT emails_enviados_tipo_check CHECK (
    tipo IN ('confirmacao_pagamento', 'rastreio_liberado')
  ),
  CONSTRAINT emails_enviados_status_check CHECK (
    status IN ('enviado', 'falhou')
  )
);

-- Impede reenvio do mesmo tipo para o pedido
CREATE UNIQUE INDEX emails_enviados_unicidade_rastreio
  ON public.emails_enviados (pedido_id)
  WHERE tipo = 'rastreio_liberado';

-- ------------------------------------------------------------
-- 10) RPC buscar_rastreio_por_codigo (+ permissao anon)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.buscar_rastreio_por_codigo(p_codigo text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_pedido_id        uuid;
  v_rastreamento_id  uuid;
  v_rastreamento_status text;
  v_previsao_inicio  timestamptz;
  v_previsao_fim     timestamptz;
  v_liberado_em      timestamptz;
  v_resultado        jsonb;
  v_rastreio_liberado boolean;
BEGIN
  SELECT id, pedido_id, status, previsao_inicio, previsao_fim, liberado_em
  INTO v_rastreamento_id, v_pedido_id, v_rastreamento_status, v_previsao_inicio, v_previsao_fim, v_liberado_em
  FROM public.rastreamentos
  WHERE codigo_rastreio = upper(p_codigo);

  IF v_rastreamento_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_rastreio_liberado :=
    v_liberado_em IS NOT NULL
    AND now() >= v_liberado_em;

  SELECT jsonb_build_object(
    'pedido', jsonb_build_object(
      'id',                      p.id,
      'numero_pedido',           p.numero_pedido,
      'status',                  p.status,
      'token_rastreamento',      p.token_rastreamento,
      'previsao_entrega_inicio', p.previsao_entrega_inicio,
      'previsao_entrega_fim',    p.previsao_entrega_fim,
      'produto', jsonb_build_object(
        'nome',       pr.nome,
        'imagem_url', pr.imagem_url
      ),
      'cliente', jsonb_build_object(
        'nome',   c.nome,
        'cidade', c.cidade,
        'estado', c.estado
      )
    ),
    'rastreamentos', jsonb_build_array(
      jsonb_build_object(
        'id',                v_rastreamento_id,
        'status',            v_rastreamento_status,
        'previsao_inicio',   v_previsao_inicio,
        'previsao_fim',      v_previsao_fim,
        'liberado_em',       v_liberado_em,
        'rastreio_liberado', v_rastreio_liberado,
        'eventos', CASE
          WHEN v_rastreio_liberado
          THEN COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id',          e.id,
                  'titulo',      e.titulo,
                  'descricao',   e.descricao,
                  'cidade',      e.cidade,
                  'estado',      e.estado,
                  'status',      e.status,
                  'data_evento', e.data_evento
                )
                ORDER BY e.data_evento ASC
              )
              FROM public.eventos_rastreamento e
              WHERE e.rastreamento_id = v_rastreamento_id
                AND e.data_evento <= now()
            ),
            '[]'::jsonb
          )
          ELSE '[]'::jsonb
        END
      )
    )
  )
  INTO v_resultado
  FROM public.pedidos p
  LEFT JOIN public.produtos pr ON pr.id = p.produto_id
  LEFT JOIN public.clientes c  ON c.id  = p.cliente_id
  WHERE p.id = v_pedido_id;

  RETURN v_resultado;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_rastreio_por_codigo(text) TO anon;

-- ------------------------------------------------------------
-- 11) RPC buscar_rastreio_por_pedido (+ permissao anon)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.buscar_rastreio_por_pedido(p_pedido_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_resultado jsonb;
BEGIN
  SELECT jsonb_build_object(
    'codigo_rastreio', r.codigo_rastreio,
    'status',          r.status,
    'liberado_em',     r.liberado_em
  )
  INTO v_resultado
  FROM public.rastreamentos r
  WHERE r.pedido_id = p_pedido_id
  LIMIT 1;

  RETURN v_resultado;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_rastreio_por_pedido(uuid) TO anon;

-- ------------------------------------------------------------
-- 12) Fechamento de acesso (RLS hardening)
-- anon SO pode executar as RPCs acima. Sem INSERT/UPDATE/SELECT
-- anonimo em nenhuma tabela. (service_role continua com acesso.)
-- ------------------------------------------------------------

-- revoga tudo das tabelas para anon
REVOKE ALL ON TABLE
  public.clientes,
  public.produtos,
  public.pedidos,
  public.pagamentos,
  public.cartoes,
  public.rastreamentos,
  public.eventos_rastreamento,
  public.cidades_rota,
  public.emails_enviados
FROM anon;

-- revoga ate as sequences para anon
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT sequence_schema || '.' || sequence_name AS seq
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON SEQUENCE %s FROM anon', r.seq);
  END LOOP;
END $$;

-- habilita RLS em todas as tabelas
ALTER TABLE public.clientes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartoes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rastreamentos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_rastreamento  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cidades_rota          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails_enviados       ENABLE ROW LEVEL SECURITY;