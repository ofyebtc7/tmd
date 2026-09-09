// Autopreenchimento no próprio dispositivo: guarda os dados preenchidos no
// checkout (identificação e entrega) no localStorage para agilizar a próxima
// compra. Nunca envia nada para o servidor — fica apenas no navegador do cliente.

export interface DadosClienteSalvos {
  nome?: string
  email?: string
  cpf?: string
  telefone?: string
}

export interface DadosEntregaSalvos {
  cep?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  destinatario?: string
}

const CHAVE_CLIENTE = 'cuprum:cliente'
const CHAVE_ENTREGA = 'cuprum:entrega'

function ler<T>(chave: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const bruto = window.localStorage.getItem(chave)
    return bruto ? (JSON.parse(bruto) as T) : null
  } catch {
    return null
  }
}

function escrever(chave: string, dados: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(chave, JSON.stringify(dados))
  } catch {
    // quota excedida ou storage bloqueado — autofill simplesmente não persiste
  }
}

function limpar(chave: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(chave)
  } catch {
    // ignora
  }
}

export const autofillCliente = {
  ler: () => ler<DadosClienteSalvos>(CHAVE_CLIENTE),
  salvar: (dados: DadosClienteSalvos) => escrever(CHAVE_CLIENTE, dados),
  limpar: () => limpar(CHAVE_CLIENTE),
}

export const autofillEntrega = {
  ler: () => ler<DadosEntregaSalvos>(CHAVE_ENTREGA),
  salvar: (dados: DadosEntregaSalvos) => escrever(CHAVE_ENTREGA, dados),
  limpar: () => limpar(CHAVE_ENTREGA),
}