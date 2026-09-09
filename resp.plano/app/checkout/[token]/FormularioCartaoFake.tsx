'use client'

import { useState } from 'react'
import cardValidator from 'card-validator'
import { CreditCard, Lock, Nfc, ShieldCheck } from 'lucide-react'
import Button from '@/app/components/ui/Button'
import {
  Bandeira,
  bandeirasAceitas,
  IconeBandeira,
} from '@/app/components/ui/BandeirasPagamento'
import SelectParcelamento from './SelectParcelamento'

interface Props {
  onTrocarParaPix: () => void
  pedidoId: string
  valor: number
}

const labelClasse =
  'block text-[12px] font-medium text-text-muted mb-1.5'
const inputClasse =
  'w-full rounded-lg border border-gray-border bg-white px-3.5 py-2.5 text-[14px] text-text-strong outline-none transition-colors placeholder:text-text-muted/50 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/15'

function detectarBandeira(digitos: string): Bandeira {
  const tipo = cardValidator.number(digitos).card?.type
  switch (tipo) {
    case 'visa':
      return 'visa'
    case 'mastercard':
      return 'mastercard'
    case 'american-express':
      return 'amex'
    case 'elo':
      return 'elo'
    case 'hipercard':
      return 'hipercard'
    case 'diners-club':
      return 'diners'
    case 'discover':
      return 'discover'
    default:
      return 'desconhecida'
  }
}

function maxDigitosNumero(bandeira: Bandeira): number {
  if (bandeira === 'amex') return 15
  if (bandeira === 'diners') return 14
  return 16
}

function maxDigitosCvv(bandeira: Bandeira): number {
  return bandeira === 'amex' ? 4 : 3
}

function formatarNumeroCartao(digitos: string, bandeira: Bandeira): string {
  if (bandeira === 'amex') {
    return [digitos.slice(0, 4), digitos.slice(4, 10), digitos.slice(10, 15)]
      .filter((grupo) => grupo.length > 0)
      .join(' ')
  }
  const grupos: string[] = []
  for (let i = 0; i < digitos.length; i += 4) {
    grupos.push(digitos.slice(i, i + 4))
  }
  return grupos.join(' ')
}

function numeroMascarado(digitos: string, bandeira: Bandeira): string {
  const maxLen = maxDigitosNumero(bandeira)
  const reais = digitos.slice(0, maxLen)
  const base = Array.from({ length: maxLen }, () => '•')
  const quantosReais = Math.min(4, reais.length)
  for (let i = 0; i < quantosReais; i++) {
    base[maxLen - 1 - i] = reais[reais.length - 1 - i]
  }
  return formatarNumeroCartao(base.join(''), bandeira)
}

export default function FormularioCartaoFake({
  onTrocarParaPix,
  pedidoId,
  valor,
}: Props) {
  const [cpf, setCpf] = useState('')
  const [nomeCartao, setNomeCartao] = useState('')
  const [numeroCartao, setNumeroCartao] = useState('')
  const [validade, setValidade] = useState('')
  const [cvv, setCvv] = useState('')
  const [parcelas, setParcelas] = useState<number | null>(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const bandeira = detectarBandeira(numeroCartao)
  const numeroExibido = formatarNumeroCartao(numeroCartao, bandeira)
  const numeroValido = cardValidator.number(numeroCartao)

  async function handleFinalizarPagamento() {
    setProcessando(true)
    setErro(null)

    try {
      // Segurança: NUNCA envia número/validade/CVV do cartão ao servidor.
      // O formulário é ilustrativo e o pagamento real é via PIX.
      const resposta = await fetch('/api/pagar-cartao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoId,
          nomeCartao,
          cpf,
        }),
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(dados.erro || 'Erro ao processar pagamento.')
      }

      setNomeCartao('')
      setNumeroCartao('')
      setValidade('')
      setCvv('')
      setCpf('')

      setErro(
        'No momento, pagamentos com cartão estão temporariamente indisponíveis. Por favor, finalize seu pedido via PIX — é rápido e seguro.'
      )
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Ocorreu um erro ao processar o cartão.'
      )
    } finally {
      setProcessando(false)
    }
  }

  if (erro) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-copper/30 bg-copper/5 p-4">
          <p className="text-[13px] text-text-muted">{erro}</p>
        </div>
        <Button
          onClick={onTrocarParaPix}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          Voltar para PIX
        </Button>
      </div>
    )
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleFinalizarPagamento()
        }}
        className="space-y-5"
      >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-sans text-[20px] font-semibold text-text-strong">
            Pagamento
          </h2>
          <p className="mt-1 text-[12px] text-text-muted">
            Finalize com os dados do cartão abaixo
          </p>
        </div>
        <span className="rounded-full bg-accent-blue/10 px-3 py-1 text-[11px] font-semibold text-accent-blue">
          3 de 3
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {bandeirasAceitas
          .filter((b) => b !== 'pix')
          .map((b) => (
            <div
              key={b}
              title={b}
              className={`flex h-[28px] w-[44px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[5px] border bg-white transition-all duration-200 ${
                bandeira === b
                  ? 'border-[#E5E7EB] opacity-100 scale-105'
                  : bandeira === 'desconhecida'
                    ? 'border-[#E5E7EB] bg-white/80 opacity-70'
                    : 'border-[#E5E7EB]/50 bg-white/30 opacity-30'
              }`}
            >
              <IconeBandeira
                bandeira={b}
                className="h-[18px] w-auto object-contain"
              />
            </div>
          ))}
      </div>

      <div className="relative mx-auto w-full max-w-[360px]">
        <div className="relative aspect-[1.586/1] w-full overflow-hidden rounded-[16px] bg-gradient-to-br from-primary via-[#004D8F] to-accent-blue text-white shadow-[0_12px_40px_-8px_rgba(0,44,104,0.45)]">
          <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-14 h-48 w-48 rounded-full bg-accent-blue/50 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-1/3 h-24 w-24 rounded-full bg-white/[0.06] blur-xl" />

          <div className="relative flex h-full flex-col justify-between p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-12 flex-col justify-between rounded-[6px] border border-yellow-200/60 bg-gradient-to-br from-yellow-200 via-yellow-400/90 to-yellow-500/80 p-[6px] shadow-inner">
                  <div className="h-[1px] bg-yellow-900/50" />
                  <div className="flex gap-1">
                    <div className="h-3.5 flex-1 rounded-sm bg-yellow-900/30" />
                    <div className="h-3.5 w-3.5 rounded-sm bg-yellow-900/30" />
                  </div>
                </div>
                <Nfc className="h-5 w-5 text-white/60" />
              </div>

              <div className="flex items-center gap-1.5">
                {bandeira !== 'desconhecida' ? (
                  <div className="flex h-[28px] w-[44px] items-center justify-center overflow-hidden rounded-[5px] bg-white/15 backdrop-blur-sm">
                    <IconeBandeira
                      bandeira={bandeira}
                      className="h-[18px] w-auto object-contain"
                    />
                  </div>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                    Cuprum
                  </span>
                )}
              </div>
            </div>

            <div className="relative font-mono text-[18px] font-medium tracking-[0.14em] text-white sm:text-[19px]">
              {numeroMascarado(numeroCartao, bandeira)}
            </div>

            <div className="relative flex items-end justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[8px] uppercase tracking-[0.16em] text-white/50">
                  Nome do titular
                </p>
                <p className="mt-0.5 truncate text-[12px] font-semibold text-white">
                  {nomeCartao
                    ? nomeCartao.toUpperCase()
                    : 'NOME DO TITULAR'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] uppercase tracking-[0.16em] text-white/50">
                  Validade
                </p>
                <p className="mt-0.5 text-[12px] font-semibold text-white">
                  {validade || 'MM/AA'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-gray-border pt-5">
        <div>
          <label className={labelClasse}>Número do cartão</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={numeroExibido}
              onChange={(e) => {
                const digitos = e.target.value.replace(/\D/g, '')
                const proximaBandeira = detectarBandeira(digitos)
                const proximoNumero = digitos.slice(
                  0,
                  maxDigitosNumero(proximaBandeira)
                )
                if (cardValidator.number(proximoNumero).isPotentiallyValid) {
                  setNumeroCartao(proximoNumero)
                }
              }}
              placeholder="0000 0000 0000 0000"
              className={`${inputClasse} pr-12`}
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {bandeira !== 'desconhecida' ? (
                <IconeBandeira
                  bandeira={bandeira}
                  className="h-5 w-8 rounded-[3px]"
                />
              ) : (
                <CreditCard className="h-4 w-4 text-text-muted/50" />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
          <div>
            <label className={labelClasse}>Validade (MM/AA)</label>
            <input
              type="text"
              inputMode="numeric"
              value={validade}
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, '').slice(0, 4)
                if (val.length >= 2) {
                  val = val.slice(0, 2) + '/' + val.slice(2)
                }
                setValidade(val)
              }}
              placeholder="MM/AA"
              className={inputClasse}
              required
            />
          </div>
          <div>
            <label className={labelClasse}>Código de Segurança (CVV)</label>
            <input
              type="text"
              inputMode="numeric"
              value={cvv}
              onChange={(e) =>
                setCvv(
                  e.target.value
                    .replace(/\D/g, '')
                    .slice(0, maxDigitosCvv(bandeira))
                )
              }
              placeholder={bandeira === 'amex' ? '0000' : '000'}
              className={inputClasse}
              required
            />
          </div>
        </div>

        <div>
          <label className={labelClasse}>Nome do titular</label>
          <input
            type="text"
            value={nomeCartao}
            onChange={(e) => setNomeCartao(e.target.value)}
            placeholder="Como está impresso no cartão"
            className={inputClasse}
            required
          />
        </div>

        <div>
          <label className={labelClasse}>CPF do titular</label>
          <input
            type="text"
            inputMode="numeric"
            value={cpf}
            onChange={(e) =>
              setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))
            }
            placeholder="000.000.000-00"
            className={inputClasse}
            required
          />
        </div>

        <div>
          <label className={labelClasse}>Parcelamento</label>
          <SelectParcelamento
            valor={valor}
            parcelas={parcelas}
            onSelecionar={setParcelas}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-text-muted">
        <Lock className="h-3.5 w-3.5 shrink-0 text-accent-blue" />
        <span>
          Ambiente seguro e ilustrativo. Nenhum dado de cartão é enviado ou
          armazenado.
        </span>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={
          !cpf ||
          !nomeCartao ||
          !numeroValido.isPotentiallyValid ||
          !validade ||
          !cvv ||
          !parcelas
        }
        loading={processando}
        className="w-full"
      >
        {processando ? 'Processando...' : 'Finalizar pagamento'}
      </Button>
      </form>

      <div className="rounded-lg border border-black/[0.06] bg-[#F2F2F2] p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-[#006DAA]" />
            <p className="text-[12px] leading-snug text-text-muted">
              Ambiente seguro. Seus dados são criptografados e protegidos em
              todas as etapas do pagamento.
            </p>
          </div>

          <div className="border-t border-black/[0.06] pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5B6B7C]">
              Formas de pagamento
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {bandeirasAceitas.map((b) => (
                <div
                  key={b}
                  className="flex h-7 w-11 items-center justify-center rounded-[5px] bg-white"
                  title={b}
                >
                  <IconeBandeira bandeira={b} className="h-full w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
