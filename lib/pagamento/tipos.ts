export type ClienteParaPagamento = {
  nome: string
  email: string
  cpf: string
}

export type CriarPixInput = {
  pedidoId: string
  tokenCheckout: string
  valorEmReais: number
  descricao: string
  cliente: ClienteParaPagamento
}

export type CriarPixResultado = {
  idExterno: string
  qrCode: string
  qrCodeUrl: string
  expiraEm: string | null
}