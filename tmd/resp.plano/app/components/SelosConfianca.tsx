import { ShieldCheck, Star } from 'lucide-react'

const ITENS_PADRAO = [
  {
    icone: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 18H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v11" />
        <path d="M14 9h4l4 4v4a1 1 0 0 1-1 1h-2" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    ),
    texto: 'Frete Grátis',
    sub: 'Envio rápido via Correios',
  },
  {
    icone: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    texto: 'Pedido monitorado',
    sub: 'Rastreamento em tempo real',
  },
  {
    icone: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    texto: 'Atendimento humano',
    sub: 'Suporte pelo WhatsApp',
  },
  {
    icone: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    texto: 'Compra segura',
    sub: 'Dados protegidos SSL',
  },
]

interface SelosConfiancaProps {
  titulo?: string
  itens?: typeof ITENS_PADRAO
  rodape?: string
}

export default function SelosConfianca({
  titulo = 'Garantias Cuprum',
  itens = ITENS_PADRAO,
  rodape = 'Mais de 2.500 clientes atendidos em todo o Brasil',
}: SelosConfiancaProps) {
  return (
    <section className="relative overflow-hidden rounded-[20px] border border-gray-border bg-white shadow-card">
      {/* Glow decorativo superior */}
      <div aria-hidden className="pointer-events-none absolute -top-20 left-1/2 h-40 w-3/4 -translate-x-1/2 rounded-full bg-[#006DAA]/10 blur-3xl" />

      {/* Cabeçalho da faixa */}
      <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-[#002C68] via-[#004B9E] to-[#006DAA] px-4 py-3">
        <ShieldCheck size={15} strokeWidth={2} className="text-white/90" />
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-white">
          {titulo}
        </span>
        <span className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
      </div>

      {/* Itens */}
      <div className="relative grid grid-cols-2 gap-0 p-4 sm:grid-cols-4 sm:p-5">
        {itens.map((item, index) => (
          <div
            key={item.texto}
            className={`group flex flex-col items-center gap-3 px-2 py-4 text-center transition-colors duration-150 ${
              index > 0 ? 'sm:border-l sm:border-[#F2F2F2]' : ''
            } ${index % 2 === 1 ? 'border-l border-[#F2F2F2] sm:border-l-0' : ''} ${
              index > 1 ? 'border-t border-[#F2F2F2] sm:border-t-0' : ''
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#006DAA] to-[#004B9E] text-white shadow-[0_4px_12px_rgba(0,44,104,0.18)] transition-transform duration-200 group-hover:scale-110">
              {item.icone}
            </div>
            <div>
              <p className="text-[13px] font-semibold leading-snug text-[#0F1A2E]">
                {item.texto}
              </p>
              <p className="mt-0.5 text-[11px] text-text-muted">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé */}
      {rodape && (
        <div className="flex items-center justify-center gap-1.5 border-t border-[#F2F2F2] bg-[#F8F9FB] px-4 py-2.5">
          <Star size={12} fill="#F59E0B" className="text-[#F59E0B]" strokeWidth={1.5} />
          <span className="text-[11px] text-text-muted">{rodape}</span>
        </div>
      )}
    </section>
  )
}
