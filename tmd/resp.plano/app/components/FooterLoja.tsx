import Link from 'next/link'
import { Instagram } from 'lucide-react'

const INSTITUCIONAL = [
  { label: 'Política de Privacidade', href: '#' },
  { label: 'Termos de Uso', href: '#' },
  { label: 'Trocas e Devoluções', href: '#' },
]

const PRODUTOS = [
  { label: 'Todos os Produtos', href: '/' },
  { label: 'Rastrear Pedido', href: '/rastreio' },
]

const tituloColuna =
  'mb-4 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]'
const linkClasse =
  'text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors'

function WhatsAppIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.852L0 24l6.335-1.54A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.846 0-3.575-.48-5.075-1.322l-.364-.214-3.764.916.949-3.671-.235-.374A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  )
}

export default function FooterLoja() {
  return (
    <footer className="bg-[#0F1A2E] pt-16 pb-8 text-[rgba(255,255,255,0.65)]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Coluna esquerda: marca + descrição + social */}
          <div>
            <h3 className="font-sans text-[20px] font-semibold text-white">
              Cuprum Labs Brasil®
            </h3>
            <p className="mt-3 text-[13px] leading-relaxed text-[rgba(255,255,255,0.5)]">
              Ciência regenerativa e peptídeos avançados para longevidade e
              performance.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href="https://www.instagram.com/cuprum.labs/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 transition-all duration-150 hover:border-white/30 hover:text-white"
              >
                <Instagram size={15} strokeWidth={1.5} />
              </a>
              <a
                href="https://wa.me/5531975241588"
                target="_blank"
                rel="noopener noreferrer"
                data-origem="WhatsApp Rodapé"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 transition-all duration-150 hover:border-white/30 hover:text-white"
              >
                <WhatsAppIcon size={14} />
              </a>
            </div>
          </div>

          {/* Coluna direita: 3 sub-colunas de links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h4 className={tituloColuna}>Institucional</h4>
              <ul className="space-y-3">
                {INSTITUCIONAL.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={linkClasse}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className={tituloColuna}>Produtos</h4>
              <ul className="space-y-3">
                {PRODUTOS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClasse}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className={tituloColuna}>Atendimento</h4>
              <ul className="space-y-3">
                <li>
                  <a href="tel:5531975241588" className={linkClasse}>
                    (31) 97524-1588
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/5531975241588"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-origem="WhatsApp Atendimento"
                    className={linkClasse}
                  >
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a href="mailto:contato@cuprumlabs.com.br" className={linkClasse}>
                    contato@cuprumlabs.
                    <wbr />
                    com.br
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divisor + aviso */}
        <div className="mt-10 border-t border-white/10 pt-8">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <h5 className="text-[12px] font-bold text-copper">
              AVISO IMPORTANTE
            </h5>
            <p className="mt-2 text-[12px] leading-relaxed text-[rgba(255,255,255,0.55)]">
              Nosso compromisso é oferecer produtos de alta qualidade
              acompanhados de informações claras e completas. Antes de efetuar
              sua compra, leia atentamente a descrição e as especificações de
              cada produto. Ao finalizar o pedido, você confirma que
              compreendeu essas informações e concorda em utilizar o produto de
              forma responsável, observando a legislação aplicável.
            </p>
          </div>

          <p className="mt-4 text-[11px] text-[rgba(255,255,255,0.35)]">
            Cuprum Labs Brasil — CNPJ 50.766.347/0001-18 · Imagens meramente
            ilustrativas. Preços e condições sujeitos a alteração sem aviso
            prévio.
          </p>

          <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[rgba(255,255,255,0.35)]">
              © 2026 Cuprum Labs Brasil. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
