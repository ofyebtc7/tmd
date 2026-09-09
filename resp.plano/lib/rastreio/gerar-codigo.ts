import { createAdminClient } from '@/lib/supabase-admin'

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PREFIXO = 'CBR'
const TAMANHO_CODIGO = 9
const MAX_TENTATIVAS = 5

function gerarCodigo(): string {
  let resultado = PREFIXO
  for (let i = 0; i < TAMANHO_CODIGO; i++) {
    resultado += ALFABETO[Math.floor(Math.random() * ALFABETO.length)]
  }
  return resultado
}

export async function gerarCodigoRastreio(): Promise<string> {
  const supabaseAdmin = createAdminClient()

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    const codigo = gerarCodigo()

    const { data, error } = await supabaseAdmin
      .from('rastreamentos')
      .select('id')
      .eq('codigo_rastreio', codigo)
      .maybeSingle()

    if (error) {
      console.error('erro_verificar_codigo_rastreio', { error: error.message, tentativa })
      continue
    }

    if (!data) {
      return codigo
    }

    console.warn('codigo_rastreio_colidiu', { codigo, tentativa })
  }

  throw new Error('Nao foi possivel gerar um codigo de rastreio unico apos 5 tentativas')
}
