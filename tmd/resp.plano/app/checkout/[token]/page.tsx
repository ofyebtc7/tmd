import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  CheckCircle,
  User,
  Mail,
  IdCard,
  XCircle,
  Boxes,
  ShieldCheck,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import HeaderPublico from '@/app/components/HeaderPublico'
import FooterLoja from '@/app/components/FooterLoja'
import ImagemProduto from '@/app/components/ui/ImagemProduto'
import Button from '@/app/components/ui/Button'
import CheckoutCliente from './CheckoutCliente'
import ConfiancaFinalizacao from './ConfiancaFinalizacao'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Pagamento' }
}

interface Pedido {
  id: string
  valor: number
  status: string
  token_rastreamento: string
  quantidade?: number
  rastreamentos?: {
    codigo_rastreio: string | null
  }[]
  clientes: {
    id: string
    nome: string
    cpf: string
    email: string
    telefone: string
    cidade: string
    estado: string
    endereco: string
    numero: string
    bairro: string
    cep: string
  }
  produtos: {
    id: string
    nome: string
    valor: number
    descricao?: string
    imagem_url?: string
  }
}

const STATUS_SUCESSO = ['pago', 'preparando', 'enviado', 'entregue']

function rotuloStatus(status: string): string {
  switch (status) {
    case 'pago':
      return '✓ Pago'
    case 'preparando':
      return '📦 Preparando'
    case 'enviado':
      return '🚚 Enviado'
    case 'entregue':
      return '✓ Entregue'
    case 'cancelado':
      return '✗ Cancelado'
    default:
      return status
  }
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabaseAdmin = createAdminClient()

  // Se a coluna pedidos.quantidade ainda não existir no banco (migration pendente),
  // a primeira query falha — então buscamos sem a coluna e derivamos a quantidade
  // pelo total ÷ preço unitário, para nunca quebrar o checkout.
  const selecaoBase = `
    id,
    valor,
    status,
    token_rastreamento,
    rastreamentos ( codigo_rastreio ),
    clientes ( id, nome, cpf, email, telefone, cidade, estado, endereco, numero, bairro, cep ),
    produtos ( id, nome, valor, descricao, imagem_url )
  `
  const selecaoComQuantidade = `
    id,
    valor,
    status,
    token_rastreamento,
    quantidade,
    rastreamentos ( codigo_rastreio ),
    clientes ( id, nome, cpf, email, telefone, cidade, estado, endereco, numero, bairro, cep ),
    produtos ( id, nome, valor, descricao, imagem_url )
  `

  const primeiraTentativa = await supabaseAdmin
    .from('pedidos')
    .select(selecaoComQuantidade)
    .eq('token_rastreamento', token)
    .single()

  const colunaQuantidadePendente =
    !primeiraTentativa.data &&
    primeiraTentativa.error?.message?.toLowerCase().includes('quantidade')

  const { data: pedido, error } = colunaQuantidadePendente
    ? await supabaseAdmin
        .from('pedidos')
        .select(selecaoBase)
        .eq('token_rastreamento', token)
        .single()
    : primeiraTentativa

  if (error || !pedido) {
    notFound()
  }

  const pedidoTipado = pedido as unknown as Pedido
  const cliente = Array.isArray(pedidoTipado.clientes)
    ? pedidoTipado.clientes[0]
    : pedidoTipado.clientes
  const produto = Array.isArray(pedidoTipado.produtos)
    ? pedidoTipado.produtos[0]
    : pedidoTipado.produtos
  const rastreamentos = Array.isArray(pedidoTipado.rastreamentos)
    ? pedidoTipado.rastreamentos
    : []
  const codigoRastreio = rastreamentos[0]?.codigo_rastreio ?? null

  const valorUnitario = Number(produto?.valor ?? pedidoTipado.valor) || 1
  const quantidade =
    pedidoTipado.quantidade ??
    Math.max(1, Math.round(Number(pedidoTipado.valor) / valorUnitario))

  const status = pedidoTipado.status
  const ehSucesso = STATUS_SUCESSO.includes(status)
  const ehCancelado = status === 'cancelado'

  if (status !== 'aguardando_pagamento') {
    const titulo = ehSucesso
      ? 'Pagamento confirmado!'
      : ehCancelado
        ? 'Pedido cancelado'
        : 'Link expirado'

    const descricao = ehSucesso
      ? 'Seu pedido foi confirmado e já está sendo processado.'
      : ehCancelado
        ? 'Este pedido foi cancelado. Se você acha que isso é um erro, entre em contato conosco.'
        : 'Este pedido já foi processado e este link não está mais disponível para pagamento.'

    const rodape = ehSucesso
      ? null
      : 'Se você tem dúvidas sobre seu pedido, entre em contato conosco.'

    return (
      <div className="min-h-screen bg-bg-page">
        <HeaderPublico />
        <div className="px-4 pt-10">
          <div className="flex items-center justify-center">
            <div className="max-w-md w-full">
              <div className="rounded-xl border border-black/[0.06] bg-white p-8 text-center space-y-4">
                <div className="flex justify-center mb-4">
                  <Image
                    src="/favicon.webp"
                    alt="Logo"
                    width={120}
                    height={40}
                    className="h-10 w-auto"
                  />
                </div>

                <div className="flex justify-center">
                  {ehSucesso ? (
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#059669]/10">
                      <CheckCircle className="h-8 w-8 text-[#059669]" strokeWidth={2} />
                    </span>
                  ) : ehCancelado ? (
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                      <XCircle className="h-8 w-8 text-red-500" strokeWidth={2} />
                    </span>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <h1 className="font-sans text-[22px] font-semibold text-text-strong">
                    {titulo}
                  </h1>
                  <p className="text-[13px] text-text-muted">{descricao}</p>
                  {rodape ? (
                    <p className="text-[12px] text-text-muted">{rodape}</p>
                  ) : null}
                </div>

                {ehSucesso && codigoRastreio && (
                  <div className="pt-2">
                    <Button
                      href={`/rastreio/${codigoRastreio}`}
                      variant="primary"
                      size="lg"
                      className="w-full"
                    >
                      Acompanhar meu pedido
                    </Button>
                  </div>
                )}

                <div className="pt-4 border-t border-black/[0.06]">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted">
                    Status do pedido
                  </p>
                  <p className="mt-2 text-[13px] font-medium text-text-strong">
                    {rotuloStatus(status)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <ConfiancaFinalizacao />
          </div>
        </div>

        <FooterLoja />
      </div>
    )
  }

  // Pedido aguardando pagamento
  return (
    <div className="min-h-screen bg-bg-page">
      <HeaderPublico />
      <div className="max-w-2xl md:max-w-5xl mx-auto py-8 px-4">

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Coluna esquerda: Resumo do pedido */}
          <div className="md:col-span-1">
            <div className="relative overflow-hidden rounded-[20px] border border-black/[0.06] bg-white shadow-card md:h-auto">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-accent-blue" />

              <div className="p-5 md:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Seu pedido
                </p>

                <div className="mt-4 flex items-center gap-4">
                  {produto?.imagem_url ? (
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[14px] border border-black/[0.06] bg-bg-page md:h-24 md:w-24">
                      <ImagemProduto
                        src={produto.imagem_url}
                        alt={produto.nome}
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[14px] bg-primary/5 md:h-24 md:w-24">
                      <Boxes size={28} strokeWidth={1.5} className="text-primary/50" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold leading-snug text-text-strong line-clamp-2 md:text-[15px]">
                      {produto?.nome || 'Produto não encontrado'}
                    </p>
                    <p className="mt-1 text-[11px] text-text-muted">
                      Pedido <span className="font-semibold text-text-strong">#{pedidoTipado.id.slice(0, 8)}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-[#F1F2F4] pt-4">
                  <div className="flex items-center justify-between py-1">
                    <p className="text-[11px] text-text-muted">
                      {Number(produto?.valor ?? pedidoTipado.valor).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                      {' × '}
                      {quantidade}
                    </p>
                    <p className="text-[12px] font-medium text-text-strong">
                      {Number(pedidoTipado.valor).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center justify-between border-t border-[#F8F9FB] pt-3">
                    <p className="text-[11px] text-text-muted">Total a pagar</p>
                    <p className="font-sans text-[22px] font-bold leading-none text-text-strong">
                      {Number(pedidoTipado.valor).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-[12px] border border-accent-blue/15 bg-accent-blue/5 px-3 py-2.5">
                  <ShieldCheck size={15} strokeWidth={1.75} className="mt-0.5 flex-shrink-0 text-accent-blue" />
                  <p className="text-[11px] leading-relaxed text-text-muted">
                    Compra protegida. Pagamento 100% seguro.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna direita: Formulário de pagamento */}
          <div className="md:col-span-2">
            <div className="relative overflow-hidden rounded-[20px] border border-black/[0.06] bg-white shadow-card">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-accent-blue" />

              <div className="p-6 md:p-7">
                <div className="mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] bg-primary/5">
                      <User size={16} strokeWidth={1.75} className="text-primary" />
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Dados do pedido
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-[14px] border border-black/[0.06] bg-[#F8F9FB] px-4 py-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-accent-blue/10">
                        <User size={16} strokeWidth={1.75} className="text-accent-blue" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted">
                          Nome
                        </p>
                        <p className="truncate text-[13px] font-medium text-text-strong">
                          {cliente?.nome}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-[14px] border border-black/[0.06] bg-[#F8F9FB] px-4 py-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-accent-blue/10">
                        <Mail size={16} strokeWidth={1.75} className="text-accent-blue" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
                          E-mail
                        </p>
                        <p className="truncate text-[13px] font-medium text-text-strong break-all">
                          {cliente?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-[14px] border border-black/[0.06] bg-[#F8F9FB] px-4 py-3 sm:col-span-2">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-accent-blue/10">
                        <IdCard size={16} strokeWidth={1.75} className="text-accent-blue" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
                          CPF do titular
                        </p>
                        <p className="text-[13px] font-medium text-text-strong">
                          {cliente?.cpf}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-black/[0.06] pt-6">
                  <div className="mb-4 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] bg-copper/10">
                      <CheckCircle size={16} strokeWidth={1.75} className="text-copper" />
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Selecione uma forma de pagamento
                    </p>
                  </div>

                  <CheckoutCliente
                    pedidoId={pedidoTipado.id}
                    produtoId={produto?.id || ''}
                    nomeCliente={cliente?.nome || ''}
                    emailCliente={cliente?.email || ''}
                    cpfCliente={cliente?.cpf || ''}
                    valor={Number(pedidoTipado.valor)}
                    nomeOriginal={produto?.nome || ''}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>


      <FooterLoja />
    </div>
  )
}

