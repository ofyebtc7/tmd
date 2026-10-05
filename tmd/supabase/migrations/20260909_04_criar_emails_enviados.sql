-- ============================================================
-- 20260909_04_criar_emails_enviados.sql
-- ============================================================
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