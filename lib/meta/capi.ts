// Stub de integração Meta CAPI (Conversions API).
// O webhook pode disparar compras para o pixel do anunciante, mas a falta
// de credenciais não pode derrubar o fluxo de pagamento/rastreio.
export async function enviarEventoPurchase(_dados: {
  pedidoId: string
  valor: number
  email: string | null
}): Promise<void> {
  // sem credenciais configuradas: no-op
  return
}