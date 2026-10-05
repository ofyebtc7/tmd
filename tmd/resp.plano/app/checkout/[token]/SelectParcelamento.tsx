'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  valor: number
  parcelas: number | null
  onSelecionar: (parcelas: number) => void
}

const MAX_PARCELAS = 10

function formatarValor(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatarOpcao(n: number, valor: number): string {
  return `${n}x de ${formatarValor(valor / n)} sem juros`
}

export default function SelectParcelamento({
  valor,
  parcelas,
  onSelecionar,
}: Props) {
  const [aberto, setAberto] = useState(false)
  const [destaque, setDestaque] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const opcoes = Array.from({ length: MAX_PARCELAS }, (_, i) => i + 1)

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setAberto(false)
      }
    }

    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [])

  function abrirComDestaqueInicial() {
    setDestaque(parcelas ? parcelas - 1 : 0)
    setAberto(true)
  }

  function aoTecla(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setAberto(false)
      return
    }

    if (!aberto) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        setDestaque(
          parcelas
            ? parcelas - 1
            : e.key === 'ArrowUp'
              ? opcoes.length - 1
              : 0
        )
        setAberto(true)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setDestaque((d) => Math.min(d + 1, opcoes.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setDestaque((d) => Math.max(d - 1, 0))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelecionar(opcoes[destaque])
      setAberto(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        role="combobox"
        aria-label="Parcelamento"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={listId}
        onClick={() => {
          if (!aberto) {
            abrirComDestaqueInicial()
          } else {
            setAberto(false)
          }
        }}
        onKeyDown={aoTecla}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-border bg-white px-3.5 py-2.5 text-left text-[14px] text-text-strong outline-none transition-colors focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/15"
      >
        <span
          className={
            parcelas === null ? 'text-text-muted/50' : 'truncate font-medium'
          }
        >
          {parcelas === null
            ? 'Selecione o número de parcelas'
            : formatarOpcao(parcelas, valor)}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-text-muted transition-transform duration-150 ${
            aberto ? 'rotate-180' : ''
          }`}
        />
      </button>

      {aberto && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-1.5 max-h-[240px] overflow-y-auto rounded-lg border border-gray-border bg-white py-1 shadow-lg"
        >
          {opcoes.map((n, i) => {
            const selecionada = parcelas === n
            return (
              <li key={n} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={selecionada}
                  onMouseEnter={() => setDestaque(i)}
                  onClick={() => {
                    onSelecionar(n)
                    setAberto(false)
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-[14px] transition-colors ${
                    selecionada
                      ? 'bg-accent-blue/10 font-medium text-accent-blue'
                      : i === destaque
                        ? 'bg-bg-page text-text-strong'
                        : 'text-text-strong'
                  }`}
                >
                  <span className="truncate">
                    {n}x de {formatarValor(valor / n)}
                  </span>
                  <span className="shrink-0 text-[11px] text-text-muted">
                    sem juros
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
