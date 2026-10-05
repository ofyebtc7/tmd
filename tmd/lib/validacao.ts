export function validarNome(nome: string): boolean {
  const palavras = nome.trim().split(/\s+/)
  return palavras.length >= 2 && palavras.every((p) => p.length >= 2)
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

export function validarCPF(cpf: string): boolean {
  const digitos = cpf.replace(/\D/g, '')
  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) return false

  function calcularDigito(base: number): number {
    let soma = 0
    for (let i = 0; i < base; i++) {
      soma += Number(digitos[i]) * (base + 1 - i)
    }
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  return (
    calcularDigito(9) === Number(digitos[9]) &&
    calcularDigito(10) === Number(digitos[10])
  )
}

export function validarTelefone(telefone: string): boolean {
  const digitos = telefone.replace(/\D/g, '')
  return (
    digitos.length >= 10 &&
    digitos.length <= 11 &&
    /^[1-9]\d/.test(digitos)
  )
}

export function validarCEP(cep: string): boolean {
  return /^\d{8}$/.test(cep.replace(/\D/g, ''))
}