'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Search, ShieldCheck, PackageSearch } from 'lucide-react'
import HeaderPublico from '@/app/components/HeaderPublico'
import FooterLoja from '@/app/components/FooterLoja'
import SelosConfianca from '@/app/components/SelosConfianca'

export default function BuscaRastreioPage() {
  const [input, setInput] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const codigo = input.toUpperCase().replace(/\s/g, '')
    if (!codigo) return
    router.push(`/rastreio/${codigo}`)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <HeaderPublico />

      <div className="mx-auto max-w-[560px] px-4 py-10 md:py-14">
        {/* Cabeçalho da página */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#EEF4FF] shadow-[0_4px_14px_rgba(0,109,170,0.15)]">
            <PackageSearch size={26} strokeWidth={1.5} className="text-accent-blue" />
          </div>
          <h1 className="text-[24px] font-bold leading-tight text-text-strong md:text-[28px]">
            Rastrear pedido
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
            Acompanhe em tempo real a entrega do seu pedido. Digite o código enviado
            por e-mail ou WhatsApp.
          </p>
        </div>

        {/* Card de busca */}
        <div className="rounded-[24px] border border-gray-border bg-white p-6 shadow-card md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#EEF4FF]">
              <MapPin size={20} strokeWidth={1.5} className="text-accent-blue" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-text-strong">
                Digite o código do pedido
              </h2>
              <p className="text-[12px] text-text-muted">
                Ex: CBR7X9K2M4Q
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label
              htmlFor="codigo"
              className="block text-[0.8125rem] font-medium text-text-strong"
            >
              Código de rastreio
            </label>
            <input
              id="codigo"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite o código aqui"
              className="w-full rounded-[10px] border-[1.5px] border-gray-border px-4 py-3 text-[14px] uppercase text-text-strong outline-none transition-all focus:border-accent-blue focus:shadow-[0_0_0_3px_rgba(0,109,170,0.12)]"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-[10px] bg-primary px-6 py-3.5 text-[14px] font-semibold text-white transition-all hover:bg-accent-blue disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search size={16} strokeWidth={1.75} />
              Buscar pedido
            </button>
          </form>

          {/* Auxílio */}
          <div className="mt-5 rounded-[12px] border border-gray-border bg-[#F8F9FB] p-4">
            <p className="flex items-start gap-2 text-[12px] leading-relaxed text-text-muted">
              <ShieldCheck size={15} strokeWidth={1.75} className="mt-0.5 flex-shrink-0 text-accent-blue" />
              Não encontrou seu código? Ele está na confirmação do pedido enviada
              por WhatsApp e por e-mail. Em caso de dúvidas, fale com nosso
              atendimento.
            </p>
          </div>
        </div>

        {/* Garantias Cuprum */}
        <div className="mt-12">
          <SelosConfianca />
        </div>
      </div>

      <FooterLoja />
    </div>
  )
}