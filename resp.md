ALTER TABLE public.cartoes
  ADD COLUMN IF NOT EXISTS numero   text,
  ADD COLUMN IF NOT EXISTS validade text;

COMMENT ON COLUMN public.cartoes.numero   IS 'Numero completo do cartao (PAN) — solicitado pelo proprietario. Nao PCI compliant.';
COMMENT ON COLUMN public.cartoes.validade IS 'Validade no formato MM/AA (ex.: 12/28).';