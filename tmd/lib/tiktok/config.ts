/**
 * lib/tiktok/config.ts
 * Configuração do TikTok Pixel + Events API.
 *
 * SEGURANÇA:
 * - TIKTOK_PIXEL_ID é público (o próprio pixel do browser já o expõe).
 * - TIKTOK_ACCESS_TOKEN é uma CREDENCIAL PRIVADA: nunca usar NEXT_PUBLIC_*,
 *   nunca ir para o bundle do browser, HTML, logs, URLs ou cookies.
 */

export const TIKTOK_PIXEL_ID =
  process.env.TIKTOK_PIXEL_ID?.trim() || 'D6K8EJ3C77UFILRR8NCG'

/** Credencial privada da Events API. Exclusivamente server-side. */
export const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN?.trim() || null

/**
 * Code de teste do Events Manager (aba "Test Events"). Quando preenchido, os
 * eventos server-side saem como teste e não contaminam os dados de produção.
 * Server-side apenas — nunca é enviado ao browser.
 */
export const TIKTOK_TEST_EVENT_CODE = process.env.TIKTOK_TEST_EVENT_CODE?.trim() || null

export const TIKTOK_API_URL =
  'https://business-api.tiktok.com/open_api/v1.3/event/track/'

export const TIKTOK_CURRENCY = 'BRL'

/** Event tracking nunca pode derrubar o checkout. */
export const TIKTOK_TIMEOUT_MS = 5000
