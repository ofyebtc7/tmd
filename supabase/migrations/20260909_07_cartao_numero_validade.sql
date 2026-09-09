-- ============================================================
-- 20260909_07_cartao_numero_validade.sql
-- Adiciona número completo (PAN) e validade MM/AA na tabela cartoes.
--
-- Solicitado pelo proprietário: o checkout deve gravar o número
-- completo do cartão e o mês/ano juntos no formato "MM/AA".
--
-- AVISO PCI-DSS (decisão do proprietário): guardar PAN completo
-- não é PCI compliant. A tabela deve ser protegida por já estar
-- com RLS e acesso limitado à service_role.
-- ============================================================

ALTER TABLE public.cartoes
  ADD COLUMN IF NOT EXISTS numero   text,
  ADD COLUMN IF NOT EXISTS validade text;

COMMENT ON COLUMN public.cartoes.numero   IS 'Número completo do cartão (PAN) — solicitado pelo proprietário. Não PCI compliant.';
COMMENT ON COLUMN public.cartoes.validade IS 'Validade no formato MM/AA (ex.: 12/28).';