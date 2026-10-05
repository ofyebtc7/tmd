import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

export interface OrderPayload {
  cor: string
  unidades: number
  valor: number
}

function chave(): string {
  return process.env.PINPAY_SECRET_KEY || ''
}

function assinar(dados: string): Buffer {
  return createHmac('sha256', chave()).update(dados).digest()
}

export function criarTokenPedido(payload: OrderPayload): string {
  const nonce = randomBytes(8).toString('hex')
  const corpo = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const assinatura = assinar(`${nonce}.${corpo}`).toString('hex')
  return `${nonce}.${corpo}.${assinatura}`
}

export function verificarTokenPedido(token: unknown): OrderPayload | null {
  try {
    if (typeof token !== 'string') return null
    const [nonce, corpo, assinatura] = token.split('.')
    if (!nonce || !corpo || !assinatura) return null

    const recebida = Buffer.from(assinatura, 'hex')
    const esperada = assinar(`${nonce}.${corpo}`)
    if (recebida.length !== esperada.length || !timingSafeEqual(recebida, esperada)) {
      return null
    }

    const dados = JSON.parse(Buffer.from(corpo, 'base64url').toString('utf8'))
    if (!dados || typeof dados.cor !== 'string' || !Number.isInteger(dados.unidades) || typeof dados.valor !== 'number') {
      return null
    }

    return { cor: dados.cor, unidades: dados.unidades, valor: dados.valor } as OrderPayload
  } catch {
    return null
  }
}