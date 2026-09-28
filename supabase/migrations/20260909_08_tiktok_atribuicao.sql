-- ============================================================
-- 20260909_08_tiktok_atribuicao.sql
-- Guarda a atribuição do TikTok no pedido para que o webhook do
-- gateway consiga enviar o CompletePayment vinculado ao clique original.
--
-- O que é armazenado: apenas os tokens de campanha do TikTok
--   - tiktok.ttclid → TikTok Click ID (parâmetro da URL do anúncio)
--   - tiktok.ttp    → cookie _ttp gravado pelo próprio TikTok Pixel
--
-- O que NÃO é armazenado: IP, user-agent, nome, CPF, cartão ou
-- qualquer outro dado pessoal do cliente. Os identificadores pessoais
-- usados no tracking (e-mail/telefone) são hasheados em tempo de envio.
--
-- A aplicação funciona sem esta coluna: o /api/comprar detecta a
-- ausência e cria o pedido sem atribuição (fallback 42703/PGRST204).
-- ============================================================

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS atribuicao jsonb;

COMMENT ON COLUMN public.pedidos.atribuicao IS
  'Atribuição de campanhas (TikTok: ttclid/ttp). Sem IP, user-agent ou dados pessoais.';
