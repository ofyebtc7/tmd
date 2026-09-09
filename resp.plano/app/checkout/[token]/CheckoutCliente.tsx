'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { CheckCircle, Copy, CreditCard, QrCode } from 'lucide-react'
import Button from '@/app/components/ui/Button'
import { bandeirasAceitas, IconeBandeira } from '@/app/components/ui/BandeirasPagamento'
import FormularioCartaoFake from './FormularioCartaoFake'
import ConfiancaFinalizacao from './ConfiancaFinalizacao'
import {
  trackAddPaymentInfo,
  trackPixCopiado,
} from '@/lib/pixel'

const INTERVALO_POLLING_MS = 5000
const MAXIMO_TENTATIVAS = 120

type MetodoPagamento = 'pix' | 'cartao'

interface Props {
  pedidoId: string
  produtoId: string
  nomeCliente: string
  emailCliente: string
  cpfCliente: string
  valor: number
  nomeOriginal: string
}

function RadioCard({
  id,
  nome,
  metodo,
  selecionado,
  onSelecionar,
  icone,
  children,
}: {
  id: string
  nome: string
  metodo: MetodoPagamento
  selecionado: boolean
  onSelecionar: (metodo: MetodoPagamento) => void
  icone: ReactNode
  children?: ReactNode
}) {
  return (
    <div
      className={`rounded-xl border-2 bg-white p-4 transition-all duration-200 ${
        selecionado
          ? 'border-primary shadow-md'
          : 'border-gray-border hover:border-black/25'
      }`}
    >
      <input
        type="radio"
        id={id}
        name="metodo-pagamento"
        value={metodo}
        checked={selecionado}
        onChange={() => onSelecionar(metodo)}
        className="peer sr-only"
      />

      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-4 outline-none rounded-lg peer-focus-visible:ring-4 peer-focus-visible:ring-accent-blue/20"
      >
        <span
          aria-hidden="true"
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
            selecionado ? 'border-primary' : 'border-gray-border'
          }`}
        >
          {selecionado && (
            <span className="h-2.5 w-2.5 rounded-full bg-primary transition-all duration-200" />
          )}
        </span>

        <span className="flex items-center gap-2.5 text-[15px] font-medium text-text-strong">
          {icone}
          {nome}
        </span>
      </label>

      {children}
    </div>
  )
}

export default function CheckoutCliente({
  pedidoId,
  produtoId,
  nomeCliente,
  emailCliente,
  cpfCliente,
  valor,
  nomeOriginal,
}: Props) {
  const [metodoSelecionado, setMetodoSelecionado] =
    useState<MetodoPagamento>('pix')
  const [carregandoPix, setCarregandoPix] = useState(false)
  const [erroPix, setErroPix] = useState<string | null>(null)
  const [pagamento, setPagamento] = useState<{
    pix_code: string
    pix_qrcode: string
  } | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false)
  const [tempoExcedido, setTempoExcedido] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const codigo = pagamento?.pix_code
    if (!codigo) return

    let ativo = true

    QRCode.toDataURL(codigo, {
      errorCorrectionLevel: 'M',
      width: 512,
      margin: 2,
      color: {
        dark: '#0F1A2E',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (ativo) setQrDataUrl(url)
      })
      .catch((erro) => {
        console.error('erro_gerar_qrcode', erro)
        if (ativo) setQrDataUrl(null)
      })

    return () => {
      ativo = false
    }
  }, [pagamento?.pix_code])

  useEffect(() => {
    if (!pagamento || !aguardandoConfirmacao) return

    let cancelado = false
    let tentativas = 0
    let timer: ReturnType<typeof setTimeout> | null = null

    async function verificarStatus() {
      if (cancelado) return

      try {
        const response = await fetch(`/api/status-pedido/${pedidoId}`, { cache: 'no-store' })

        if (!response.ok) {
          throw new Error(`Falha ao consultar status: ${response.status}`)
        }

        const dados = (await response.json()) as { status?: string }

        if (dados.status && dados.status !== 'aguardando_pagamento') {
          setAguardandoConfirmacao(false)
          router.refresh()
          return
        }
      } catch (erro) {
        console.error('erro_polling_status', erro)
      }

      tentativas += 1

      if (tentativas >= MAXIMO_TENTATIVAS) {
        setAguardandoConfirmacao(false)
        setTempoExcedido(true)
        return
      }

      timer = setTimeout(verificarStatus, INTERVALO_POLLING_MS)
    }

    timer = setTimeout(verificarStatus, INTERVALO_POLLING_MS)

    return () => {
      cancelado = true
      if (timer) clearTimeout(timer)
    }
  }, [pagamento, aguardandoConfirmacao, pedidoId, router])

  async function handleGerarPix() {
    setCarregandoPix(true)
    setErroPix(null)
    setTempoExcedido(false)

    const dadosProduto = { id: produtoId, nome: nomeOriginal, preco: valor }

    // resp.md — 5.3: AddPaymentInfo ao clicar em "Gerar PIX"
    trackAddPaymentInfo(dadosProduto)

    try {
      const response = await fetch('/api/gerar-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId }),
      })

      const dados = await response.json()

      if (!response.ok) {
        throw new Error(dados.erro || 'Erro ao gerar PIX')
      }

      setPagamento({
        pix_code: dados.pagamento.pix_code,
        pix_qrcode: dados.pagamento.pix_qrcode,
      })
      setAguardandoConfirmacao(true)

      // Purchase NÃO é disparado no frontend (resp.md): o evento de conversão
      // agora é enviado server-side via Meta Conversions API (CAPI), no webhook
      // do PinPay, apenas quando o pagamento é confirmado como "pago".
    } catch (e) {
      setErroPix(e instanceof Error ? e.message : 'Erro inesperado')
    } finally {
      setCarregandoPix(false)
    }
  }

  async function copiarCodigo() {
    const codigo = pagamento?.pix_code
    if (!codigo) return

    // resp.md — 5.6: evento customizado PixCopiado
    trackPixCopiado({ id: produtoId, nome: nomeOriginal, preco: valor })

    try {
      await navigator.clipboard.writeText(codigo)
    } catch {
      // Fallback para mobile/Safari
      const el = document.createElement('textarea')
      el.value = codigo
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.focus()
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }

    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Métodos de pagamento */}
      <div className="space-y-3">
        <RadioCard
          id="metodo-cartao"
          nome="Cartão de Crédito"
          metodo="cartao"
          selecionado={metodoSelecionado === 'cartao'}
          onSelecionar={(m) => {
            setMetodoSelecionado(m)
            setErroPix(null)
          }}
          icone={<CreditCard className="h-5 w-5 text-primary" />}
        >
          <div className="mt-3 flex flex-nowrap items-center gap-1.5 overflow-x-auto pl-9">
            {bandeirasAceitas
              .filter((b) => b !== 'pix')
              .map((b) => (
              <span
                key={b}
                className="flex h-5 w-8 shrink-0 items-center justify-center rounded-[5px]"
                title={b}
              >
                <IconeBandeira bandeira={b} className="h-full w-full" />
              </span>
            ))}
          </div>
        </RadioCard>

        <RadioCard
          id="metodo-pix"
          nome="PIX"
          metodo="pix"
          selecionado={metodoSelecionado === 'pix'}
          onSelecionar={(m) => {
            setMetodoSelecionado(m)
            setErroPix(null)
          }}
          icone={<QrCode className="h-5 w-5 text-[#32BCAD]" />}
        />
      </div>

      {/* Conteúdo do método selecionado */}
      <div className="mt-4">
        {metodoSelecionado === 'pix' ? (
          <div className="space-y-4">
            {!pagamento && (
              <Button
                onClick={handleGerarPix}
                variant="primary"
                size="lg"
                disabled={carregandoPix}
                loading={carregandoPix}
                className="w-full"
              >
                {carregandoPix
                  ? 'Gerando cobrança PIX...'
                  : 'Gerar cobrança PIX'}
              </Button>
            )}

            {erroPix && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-[13px] text-red-700">{erroPix}</p>
              </div>
            )}

            {pagamento && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 rounded-lg bg-black/5 p-4">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Code PIX"
                      width={200}
                      height={200}
                      className="h-48 w-48 rounded-[12px] border border-[#E5E7EB] bg-white object-contain"
                    />
                  ) : (
                    <div className="flex h-48 w-48 items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white">
                      <p className="px-4 text-center text-[12px] text-text-muted">
                        Gerando QR Code...
                      </p>
                    </div>
                  )}
                  <p className="text-[11px] text-text-muted">
                    Escaneie com o app do seu banco
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[12px] font-medium text-text-muted">
                    Instruções:
                  </p>
                  <ol className="text-[13px] text-[#5B6B7C] space-y-1 list-decimal list-inside">
                    <li>Abra o app do seu banco</li>
                    <li>Escolha pagar via PIX</li>
                    <li>Escaneie o QR Code ao lado</li>
                    <li>Ou use o código copia-e-cola abaixo</li>
                  </ol>
                </div>

                <div>
                  <p className="text-[12px] font-medium text-text-muted mb-2">
                    Código copia-e-cola:
                  </p>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
                    <code className="flex-1 truncate rounded-lg bg-black/5 px-3 py-2 text-[12px] font-mono text-text-strong border border-black/[0.06]">
                      {pagamento.pix_code}
                    </code>
                    <button
                      onClick={copiarCodigo}
                      className={`flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-[12px] px-4 py-2 text-[13px] font-semibold transition-colors duration-150 md:w-auto ${
                        copiado
                          ? 'bg-[#059669] text-white'
                          : 'bg-[#002C68] text-white hover:bg-[#006DAA]'
                      }`}
                    >
                      {copiado ? (
                        <>
                          <CheckCircle size={16} strokeWidth={2} /> Código copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={16} strokeWidth={1.75} /> Copiar código PIX
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-copper/20 bg-copper/5 p-3">
                  <p className="text-[12px] text-text-muted">
                    💡 Após realizar o pagamento, sua compra será processada
                    automaticamente. Você receberá confirmação por e-mail.
                  </p>
                </div>

                {aguardandoConfirmacao && (
                  <div className="flex items-start gap-3 rounded-lg border border-accent-blue/20 bg-accent-blue/5 p-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-accent-blue border-t-transparent"
                    />
                    <p className="text-[12px] text-text-muted">
                      Aguardando confirmação do pagamento. A tela será atualizada
                      automaticamente em até alguns instantes.
                    </p>
                  </div>
                )}

                {tempoExcedido && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-[12px] text-[#92400E]">
                      Ainda não identificamos seu pagamento. Se você já pagou,
                      aguarde alguns instantes ou recarregue a página.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <FormularioCartaoFake
            onTrocarParaPix={() => setMetodoSelecionado('pix')}
            pedidoId={pedidoId}
            valor={valor}
          />
        )}
      </div>

      {metodoSelecionado === 'pix' && <ConfiancaFinalizacao />}
    </div>
  )
}
