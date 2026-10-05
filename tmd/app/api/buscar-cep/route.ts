import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const cep = request.nextUrl.searchParams.get('cep')?.replace(/\D/g, '') ?? ''

  if (!/^\d{8}$/.test(cep)) {
    return NextResponse.json(
      { erro: 'CEP deve ter 8 dígitos' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)

    if (!response.ok) {
      return NextResponse.json(
        { erro: 'Falha ao consultar ViaCEP' },
        { status: 502 }
      )
    }

    const data = await response.json()

    if (data.erro) {
      return NextResponse.json(
        { erro: 'CEP não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      cep: String(data.cep ?? cep),
      logradouro: data.logradouro ?? '',
      bairro: data.bairro ?? '',
      cidade: data.localidade ?? '',
      uf: data.uf ?? '',
    })
  } catch {
    return NextResponse.json(
      { erro: 'Erro ao consultar CEP' },
      { status: 500 }
    )
  }
}