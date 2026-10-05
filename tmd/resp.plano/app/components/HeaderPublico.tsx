'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Package, ShieldCheck, CreditCard, MessageCircle, Search, User, ShoppingBag, X } from 'lucide-react'
import { CATEGORIA_LABELS } from '@/lib/categorias'
import { trackSearch } from '@/lib/pixel'

const NAV_ITEMS = [
  { href: '/#produtos', label: 'Produtos' },
  { href: '/rastreio', label: 'Rastrear Pedido' },
]

const CATALOGOS = [
  { key: 'P1', href: '/?categoria=P1#produtos' },
  { key: 'P2', href: '/?categoria=P2#produtos' },
  { key: 'P3', href: '/?categoria=P3#produtos' },
]

const TOPBAR_ITEMS = [
  { icon: Package, label: 'Frete Grátis para todo Brasil' },
  { icon: ShieldCheck, label: 'Compra 100% Segura' },
  { icon: CreditCard, label: 'Parcele em até 10x' },
  { icon: MessageCircle, label: 'WhatsApp: (31) 97524-1588' },
]

export default function HeaderPublico() {
  const [menuAberto, setMenuAberto] = useState(false)
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [termoBusca, setTermoBusca] = useState('')
  const pathname = usePathname()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (buscaAberta && inputRef.current) {
      inputRef.current.focus()
    }
  }, [buscaAberta])

  function handleBusca(e: React.FormEvent) {
    e.preventDefault()
    const termo = termoBusca.trim()
    if (!termo) return
    setBuscaAberta(false)
    setTermoBusca('')
    trackSearch(termo)
    router.push(`/?busca=${encodeURIComponent(termo)}`)
  }

  function abrirBusca() {
    setBuscaAberta(true)
  }

  function fecharBusca() {
    setBuscaAberta(false)
    setTermoBusca('')
  }

  return (
    <>
      {/* TOPBAR */}
      <div className="bg-[#002C68] h-[36px] flex items-center overflow-hidden">
        <div className="animate-marquee flex w-max items-center whitespace-nowrap hover:[animation-play-state:paused]">
          {[0, 1].map((metade) => (
            <div
              key={metade}
              aria-hidden={metade === 1}
              className="flex flex-shrink-0 items-center gap-10 pr-10"
            >
              {TOPBAR_ITEMS.map((item) => (
                <span key={item.label} className="flex items-center gap-1.5 whitespace-nowrap text-white/75 text-[11px]">
                  <item.icon size={13} className="text-white/60" strokeWidth={1.75} />
                  {item.label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* HEADER PRINCIPAL */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-border shadow-sm">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 h-[60px] md:h-[72px]">
          {/* MOBILE LEFT — Menu + Logo */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="p-2 rounded-[8px] text-[#374151] hover:text-[#002C68] hover:bg-[#EEF4FF] transition-all duration-150"
              aria-label="Abrir menu"
            >
              {menuAberto ? <X size={21} strokeWidth={1.75} /> : <Menu size={21} strokeWidth={1.75} />}
            </button>
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="relative w-9 h-9 shrink-0">
                <Image
                  src="/favicon.webp"
                  alt="Cuprum Labs Brasil"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[14px] font-bold text-[#002C68] tracking-tight whitespace-nowrap">
                  Cuprum Labs
                </span>
                <span className="text-[10px] font-medium text-[#006DAA] tracking-[0.08em] uppercase whitespace-nowrap">
                  Brasil
                </span>
              </div>
            </Link>
          </div>

          {/* LOGO + NOME DA EMPRESA (desktop) */}
          <Link href="/" className="hidden md:flex items-center gap-2.5 md:gap-3 shrink-0">
            <div className="relative w-9 h-9 md:w-11 md:h-11 shrink-0">
              <Image
                src="/favicon.webp"
                alt="Cuprum Labs Brasil"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[14px] md:text-[16px] font-bold text-[#002C68] tracking-tight whitespace-nowrap">
                Cuprum Labs
              </span>
              <span className="text-[10px] font-medium text-[#006DAA] tracking-[0.08em] uppercase whitespace-nowrap">
                Brasil
              </span>
            </div>
          </Link>

          {/* NAV DESKTOP */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href.split('#')[0]
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[13.5px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'text-[#002C68] font-semibold border-b-2 border-[#006DAA] pb-0.5'
                      : 'text-[#374151] hover:text-[#002C68] hover:border-b-2 hover:border-[#006DAA] pb-0.5'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* ACTIONS DESKTOP */}
          <div className="hidden md:flex items-center gap-4">
            <button onClick={abrirBusca} aria-label="Buscar" className="p-2 rounded-[8px] text-[#374151] hover:text-[#002C68] hover:bg-[#EEF4FF] transition-all duration-150">
              <Search size={20} strokeWidth={1.75} />
            </button>
            <div className="p-2 rounded-[8px] text-[#374151] opacity-60 cursor-not-allowed">
              <User size={20} strokeWidth={1.75} />
            </div>
            <button aria-label="Carrinho" className="relative p-2 rounded-[8px] text-[#374151] hover:text-[#002C68] hover:bg-[#EEF4FF] transition-all duration-150">
              <ShoppingBag size={20} strokeWidth={1.75} />
              <span className="absolute top-0.5 right-0.5 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-[#002C68] rounded-full">0</span>
            </button>
          </div>

          {/* MOBILE — Busca + Carrinho */}
          <div className="flex md:hidden items-center gap-1">
            <button onClick={abrirBusca} aria-label="Buscar" className="p-2 rounded-[8px] text-[#374151] hover:text-[#002C68] hover:bg-[#EEF4FF] transition-all duration-150">
              <Search size={19} strokeWidth={1.75} />
            </button>
            <button aria-label="Carrinho" className="relative p-2 rounded-[8px] text-[#374151] hover:text-[#002C68] hover:bg-[#EEF4FF] transition-all duration-150">
              <ShoppingBag size={19} strokeWidth={1.75} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#002C68] text-white text-[9px] font-bold rounded-full flex items-center justify-center">0</span>
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        {buscaAberta && (
          <div className="border-t border-[#E5E7EB] bg-white">
            <form onSubmit={handleBusca} className="mx-auto flex max-w-[1280px] items-center gap-2 px-4 py-3">
              <Search size={18} strokeWidth={1.75} className="text-[#6B7280] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Buscar produtos..."
                className="flex-1 text-[14px] text-[#0F1A2E] outline-none placeholder:text-[#9CA3AF]"
              />
              <button
                type="button"
                onClick={fecharBusca}
                className="flex h-10 w-10 items-center justify-center rounded-[8px] text-[#6B7280] hover:text-[#0F1A2E] hover:bg-[#F3F4F6] transition-all duration-150"
                aria-label="Fechar busca"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </form>
          </div>
        )}

        {/* MOBILE DRAWER */}
        <div
          className={`fixed top-0 right-0 z-50 h-full w-[280px] bg-white shadow-lg transform transition-transform duration-250 md:hidden ${
            menuAberto ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
            <span className="text-[13px] font-medium text-[#0F1A2E]">Menu</span>
            <button
              onClick={() => setMenuAberto(false)}
              aria-label="Fechar menu"
              className="p-2 rounded-[8px] text-[#374151] hover:text-[#002C68] hover:bg-[#EEF4FF] transition-all duration-150"
            >
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>
          <nav className="flex flex-col px-5 py-6 gap-2">
            <Link
              href="/#produtos"
              onClick={() => setMenuAberto(false)}
              className={`py-3 text-[14px] font-medium border-b border-[#F2F2F2] transition-colors ${
                pathname === '/'
                  ? 'text-[#002C68] font-semibold'
                  : 'text-[#374151] hover:text-[#002C68]'
              }`}
            >
              Todos Produtos
            </Link>

            <div className="flex flex-col pl-3 py-1">
              {CATALOGOS.map((catalogo) => (
                <Link
                  key={catalogo.key}
                  href={catalogo.href}
                  onClick={() => setMenuAberto(false)}
                  className="py-2 text-[13px] text-[#6B7280] transition-colors hover:text-[#002C68]"
                >
                  {CATEGORIA_LABELS[catalogo.key]}
                </Link>
              ))}
            </div>

            <Link
              href="/rastreio"
              onClick={() => setMenuAberto(false)}
              className={`py-3 text-[14px] font-medium border-b border-[#F2F2F2] transition-colors ${
                pathname === '/rastreio'
                  ? 'text-[#002C68] font-semibold'
                  : 'text-[#374151] hover:text-[#002C68]'
              }`}
            >
              Rastrear Pedido
            </Link>
          </nav>
          <div className="px-5 mt-4">
            <div className="flex items-center gap-3 py-3 text-[14px] font-medium text-[#374151] opacity-60 cursor-not-allowed">
              <User size={18} strokeWidth={1.75} />
              Minha Conta
            </div>
          </div>
        </div>

        {/* OVERLAY */}
        {menuAberto && (
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setMenuAberto(false)}
          />
        )}
      </header>
    </>
  )
}
