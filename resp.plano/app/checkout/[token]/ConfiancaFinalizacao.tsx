import { BadgeCheck, Lock, MessageCircle, Truck } from 'lucide-react'
import {
  bandeirasAceitas,
  IconeBandeira,
} from '@/app/components/ui/BandeirasPagamento'

const itensSuporte = [
  { icon: MessageCircle, texto: 'Suporte via WhatsApp' },
  { icon: Truck, texto: 'Pedido rastreável' },
  { icon: BadgeCheck, texto: 'Compra garantida' },
]

export default function ConfiancaFinalizacao() {
  return (
    <div className="border-t border-black/[0.06] pt-6">
      <div className="flex flex-col items-center gap-8 md:grid md:grid-cols-3 md:items-start md:gap-10">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 shrink-0 text-[#006DAA]" />
          <span className="text-[12px] font-medium text-[#374151]">
            Ambiente 100% seguro e criptografado
          </span>
        </div>

        <div className="flex flex-col items-center gap-2.5">
          <p className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
            Formas de pagamento
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 md:flex-nowrap">
            {bandeirasAceitas.map((b) => (
              <IconeBandeira key={b} bandeira={b} className="h-5 w-8" />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          {itensSuporte.map((item) => (
            <div key={item.texto} className="flex items-center gap-2">
              <item.icon className="h-3.5 w-3.5 shrink-0 text-[#006DAA]" />
              <span className="text-[12px] text-[#374151] md:whitespace-nowrap">{item.texto}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
