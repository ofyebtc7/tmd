'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'whatsapp' | 'ghost' | 'copper'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant?: Variant
  size?: Size
  loading?: boolean
  disabled?: boolean
  href?: string
  type?: 'button' | 'submit' | 'reset'
  className?: string
  children: ReactNode
  onClick?: () => void
  target?: string
  rel?: string
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-[#002C68] text-white hover:bg-[#006DAA] hover:-translate-y-0.5',
  secondary: 'bg-accent-blue text-white hover:bg-accent-blue-hover',
  outline: 'bg-white text-accent-blue border border-accent-blue hover:bg-accent-blue/5',
  whatsapp:
    'border border-[#25D366] bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20',
  ghost: 'bg-transparent border border-[#E5E7EB] text-[#374151] hover:border-[#002C68] hover:text-[#002C68]',
  copper: 'bg-copper text-primary hover:bg-copper-hover',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[12px]',
  md: 'px-4 py-2 text-[13px] min-h-[40px]',
  lg: 'px-6 py-3.5 text-[15px] font-semibold min-h-[44px]',
}

export default function Button({
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  href,
  type = 'button',
  className = '',
  children,
  onClick,
  target,
  rel,
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2.5 rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed'
  const classes = `${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim()

  const isExternal =
    href?.startsWith('http://') ||
    href?.startsWith('https://') ||
    href?.startsWith('mailto:') ||
    href?.startsWith('tel:')

  const isDisabled = disabled || loading

  const content = (
    <>
      {loading && (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </>
  )

  if (href) {
    if (isExternal) {
      return (
        <a
          href={href}
          target={target}
          rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)}
          className={classes}
        >
          {content}
        </a>
      )
    }
    return (
      <Link href={href} target={target} rel={rel} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={classes}
    >
      {content}
    </button>
  )
}
