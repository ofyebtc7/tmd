'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'

const IMG_BASE = '/img/'

const PRODUTOS: Record<string, { nome: string; img: string }> = {
  Preto: { nome: 'Tomada Inteligente Plugmax - Preto', img: 'https://assetsglobalbr.com/u/testimony/3b899b99.webp' },
  Branco: { nome: 'Tomada Inteligente Plugmax - Branco', img: 'produto-branco.webp' },
}

const COR_PRINCIPAL = '#13BF8C'
const COR_FOOTER = '#1e6be6'
const COR_BG = '#FFFFFF'

type MetodoPagamento = 'pix' | 'cartao'
type Bandeira = 'visa' | 'mastercard' | 'amex' | 'elo' | 'hipercard' | 'diners' | 'discover' | null

function detectarBandeira(num: string): Bandeira {
  const n = num.replace(/\D/g, '')
  if (/^4/.test(n)) return 'visa'
  if (/^5[1-5]/.test(n) || /^2(2[2-9][1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  if (/^(636368|438935|504175|451416|636297|5067|4576|4011|506699)/.test(n)) return 'elo'
  if (/^(606282|3841)/.test(n)) return 'hipercard'
  if (/^3(?:0[0-5]|[68])/.test(n)) return 'diners'
  if (/^6(?:011|5)/.test(n)) return 'discover'
  return null
}

function validarCPF(cpfStr: string): boolean {
  const cpf = cpfStr.replace(/\D/g, '')
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(cpf[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(cpf[10])
}

function validarEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())
}

function mascaraCPF(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3}\.(\d{3}))(\d)/, '$1.$3')
    .replace(/(\.\d{3})(\d)/, '$1-$2')
}

function mascaraTel(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
}

function mascaraCartao(v: string, bandeira: Bandeira) {
  const d = v.replace(/\D/g, '')
  if (bandeira === 'amex') {
    return d.slice(0, 15).replace(/(\d{4})(\d{6})(\d{0,5})/, '$1 $2 $3').trim()
  }
  return d.slice(0, 16).replace(/(\d{4})/g, '$1 ').trim()
}

function mascaraValidade(v: string) {
  return v.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2')
}

function mascaraCEP(v: string) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
}

const BandeiraLogo = ({ bandeira, size = 32 }: { bandeira: Bandeira, size?: number }) => {
  if (!bandeira) return null
  const logos: Record<string, string> = {
    visa: '/img/transferir (3).svg',
    mastercard: '/img/transferir (5).svg',
    amex: '/img/transferir (7).svg',
    elo: '/img/transferir.svg',
    hipercard: '/img/transferir (6).svg',
    diners: '/img/transferir (2).svg',
    discover: '/img/transferir (4).svg',
  }
  return <img src={logos[bandeira]} alt={bandeira} style={{ height: size, objectFit: 'contain', borderRadius: 4 }} />
}

const CheckIcon = () => (
  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#13BF8C', fontWeight: 700, fontSize: 16 }}>✓</span>
)

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p style={{ color: '#EF4444', fontSize: 11, margin: '4px 0 0', fontWeight: 500 }}>{msg}</p> : null

function CheckoutInner() {
  const params = useSearchParams()
  const cor = params.get('cor') || 'Preto'
  const unInicial = Number(params.get('un')) || 1
  const valorInicial = Number(params.get('valor')) || 89.9
  const valorUnitario = valorInicial / Math.max(unInicial, 1)

  const produto = PRODUTOS[cor] || PRODUTOS.Preto

  const [qtd, setQtd] = useState(unInicial)

  const un = qtd
  const valor = valorUnitario * qtd

  const [passo, setPasso] = useState(1)
  const [metodo, setMetodo] = useState<MetodoPagamento>('pix')

  // Identificação
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [tel, setTel] = useState('')
  const [cpfValido, setCpfValido] = useState<boolean | null>(null)
  const [emailValido, setEmailValido] = useState<boolean | null>(null)

  // Entrega
  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [entrega, setEntrega] = useState('pac')
  const [cepValido, setCepValido] = useState<boolean | null>(null)

  // PIX
  const [pixCode, setPixCode] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  // Cartão
  const [nomeCartao, setNomeCartao] = useState('')
  const [numeroCartao, setNumeroCartao] = useState('')
  const [validade, setValidade] = useState('')
  const [cvv, setCvv] = useState('')
  const [cpfCartao, setCpfCartao] = useState('')
  const [cpfCartaoValido, setCpfCartaoValido] = useState<boolean | null>(null)
  const [parcelas, setParcelas] = useState(1)
  const [bandeira, setBandeira] = useState<Bandeira>(null)
  const [errosCartao, setErrosCartao] = useState<Record<string, string>>({})
  const [tentouSubmitCartao, setTentouSubmitCartao] = useState(false)

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 1024)
  const [resumoAberto, setResumoAberto] = useState(true)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const dadosIdentOk =
    nome.trim().length >= 3 &&
    emailValido === true &&
    cpfValido === true &&
    tel.replace(/\D/g, '').length >= 10

  const dadosEntregaOk =
    cepValido === true &&
    endereco.trim().length > 0 &&
    numero.trim().length > 0 &&
    bairro.trim().length > 0 &&
    cidade.trim().length > 0 &&
    uf.trim().length === 2

  // Valor total com frete
  const valorFrete = entrega === 'sedex' ? 14.9 : entrega === 'full' ? 21.9 : 0
  const valorTotal = valor + valorFrete

  // Parcelas (1x a 12x)
  const opcoesParcelas = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1
    const v = valorTotal / n
    return { n, v, label: `${n}x de R$ ${v.toFixed(2).replace('.', ',')}${n === 1 ? ' sem juros' : ''}` }
  })

  const cartaoNumLimpo = numeroCartao.replace(/\D/g, '')
  const cartaoOk =
    nomeCartao.trim().length >= 3 &&
    (cartaoNumLimpo.length === 16 || (bandeira === 'amex' && cartaoNumLimpo.length === 15)) &&
    validade.length === 5 &&
    cvv.length >= 3 &&
    cpfCartaoValido === true

  // Validate CPF on blur
  const handleCpfBlur = useCallback(() => {
    setCpfValido(validarCPF(cpf))
  }, [cpf])

  const handleEmailBlur = useCallback(() => {
    setEmailValido(validarEmail(email))
  }, [email])

  const handleCpfCartaoBlur = useCallback(() => {
    setCpfCartaoValido(validarCPF(cpfCartao))
  }, [cpfCartao])

  async function buscarCep(c: string) {
    const clean = c.replace(/\D/g, '')
    setCepValido(null)
    if (clean.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setEndereco(data.logradouro || '')
        setBairro(data.bairro || '')
        setCidade(data.localidade || '')
        setUf(data.uf || '')
        setCepValido(true)
      } else {
        setCepValido(false)
      }
    } catch { setCepValido(false) }
  }

  async function gerarPix() {
    setCarregando(true)
    setErro(null)
    try {
      const res = await fetch('/api/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor,
          descricao: `${produto.nome} × ${un}`,
          pedidoId: `plugmax-${cor}-${un}-${Date.now()}`,
          cliente: { nome: nome.trim(), email: email.trim(), cpf: cpf.replace(/\D/g, '') },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erro || 'Erro ao gerar PIX')

      setPixCode(data.pixCode)
      const url = await QRCode.toDataURL(data.pixCode, {
        errorCorrectionLevel: 'M',
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
      setQrDataUrl(url)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado')
    } finally {
      setCarregando(false)
    }
  }

  async function copiarCodigo() {
    if (!pixCode) return
    try {
      await navigator.clipboard.writeText(pixCode)
    } catch {
      const el = document.createElement('textarea')
      el.value = pixCode
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

  const inputStyle = {
    width: '100%',
    height: 44,
    border: '1px solid #D1D5DB',
    borderRadius: '0.5rem',
    padding: '0 12px',
    fontSize: 13,
    color: '#111827',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
    display: 'block' as const,
  }

  const btnPrimario = {
    width: '100%',
    height: 50,
    background: COR_PRINCIPAL,
    color: '#fff',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '16px'
  }

  const boxStyle = {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: '0.5rem',
    padding: isMobile ? '16px' : '24px',
    marginBottom: isMobile ? '0' : '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  }

  const titleStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 16px',
  }

  const stepIndicator = (num: number, max: number) => (
    <span style={{ fontSize: 13, fontWeight: 500, color: '#6B7280' }}>
      {num} de {max}
    </span>
  )

  const stars = (
    <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
      ))}
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        body { margin: 0; padding: 0; background-color: #FFFFFF; }
        @media (max-width: 1023px) {
          .checkout-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .checkout-grid > div:nth-child(1) { order: 1 !important; }
          .checkout-grid > div:nth-child(2) { order: 2 !important; }
          .checkout-grid > div:nth-child(3) { order: 0 !important; }
          .checkout-main { padding: 16px 16px 32px !important; }
        }
        @media (max-width: 480px) {
          .field-row-2fr, .field-row-half { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ minHeight: '100vh', background: COR_BG, fontFamily: "'Poppins', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="https://assetsglobalbr.com/u/checkout/f871c3e2.png" alt="Plugmax" style={{ height: 32, objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: '#111827' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <strong style={{ fontSize: 12 }}>PAGAMENTO</strong>
              <span style={{ fontSize: 11, color: '#6B7280' }}>100% SEGURO</span>
            </div>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div style={{ background: COR_FOOTER, color: '#fff', textAlign: 'center', padding: '12px 16px', fontSize: 14 }}>
        <p style={{ margin: 0 }}>🚚 Você ganhou <strong style={{ color: '#FCD34D' }}>FRETE GRÁTIS</strong> + <u>Brinde exclusivo</u> hoje!</p>
      </div>

      {/* Main Content - 3 Columns Desktop */}
      <div className="checkout-main" style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 16px 32px' : '32px 20px', width: '100%', flex: 1 }}>
        <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 16 : 24, alignItems: 'start' }}>
          
          {/* Column 1: Identificação & Entrega */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, order: isMobile ? 1 : 0 }}>
            {/* Step 1: Identificação */}
            <div style={passo === 1 ? boxStyle : { ...boxStyle, border: '1px solid #13BF8C', padding: '16px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 18, fontWeight: 700, color: '#111827', margin: passo === 1 ? '0 0 16px' : '0 0 12px' }}>
                <span>Identificação</span>
                {passo === 1 ? stepIndicator(1, 3) : (
                  <button onClick={() => setPasso(1)} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Editar
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                )}
              </div>
              {passo === 1 ? (
                <>
                  <p style={{ fontSize: 12, color: '#4B5563', margin: '0 0 20px' }}>Preencha seus dados para envio do pedido.</p>
                  
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Nome completo</label>
                      <div style={{ position: 'relative' }}>
                        <input style={{...inputStyle, borderColor: nome.length >= 3 ? '#13BF8C' : '#E5E7EB'}} value={nome} onChange={e => setNome(e.target.value)} placeholder="Digite seu nome completo" />
                        {nome.length >= 3 && <CheckIcon />}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>E-mail</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          style={{...inputStyle, borderColor: emailValido === true ? '#13BF8C' : emailValido === false ? '#EF4444' : '#E5E7EB', background: emailValido === true ? '#F7FFFA' : '#fff'}}
                          type="email" value={email}
                          onChange={e => { setEmail(e.target.value); setEmailValido(null) }}
                          onBlur={handleEmailBlur}
                          placeholder="Digite seu e-mail" />
                        {emailValido === true && <CheckIcon />}
                      </div>
                      {emailValido === false && <FieldError msg="E-mail inválido" />}
                    </div>
                    <div>
                      <label style={labelStyle}>CPF</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          style={{...inputStyle, borderColor: cpfValido === true ? '#13BF8C' : cpfValido === false ? '#EF4444' : '#E5E7EB', background: cpfValido === true ? '#F7FFFA' : '#fff'}}
                          value={cpf}
                          onChange={e => { setCpf(mascaraCPF(e.target.value)); setCpfValido(null) }}
                          onBlur={handleCpfBlur}
                          placeholder="000.000.000-00" maxLength={14} />
                        {cpfValido === true && <CheckIcon />}
                      </div>
                      {cpfValido === false && <FieldError msg="CPF inválido. Verifique os dados." />}
                    </div>
                    <div>
                      <label style={labelStyle}>Celular/Whatsapp</label>
                      <div style={{ display: 'flex', position: 'relative' }}>
                        <span style={{ ...inputStyle, width: 'auto', borderRadius: '0.375rem 0 0 0.375rem', borderRight: 0, display: 'flex', alignItems: 'center', color: '#6B7280', background: '#F9FAFB', flexShrink: 0 }}>+55</span>
                        <input style={{ ...inputStyle, borderRadius: '0 0.375rem 0.375rem 0', borderColor: tel.replace(/\D/g, '').length >= 10 ? '#13BF8C' : '#E5E7EB', background: tel.replace(/\D/g, '').length >= 10 ? '#F7FFFA' : '#fff' }} value={tel} onChange={e => setTel(mascaraTel(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} />
                        {tel.replace(/\D/g, '').length >= 10 && <CheckIcon />}
                      </div>
                    </div>
                    <button onClick={() => setPasso(2)} disabled={!dadosIdentOk} style={{ ...btnPrimario, opacity: dadosIdentOk ? 1 : 0.7, cursor: dadosIdentOk ? 'pointer' : 'not-allowed' }}>
                      Ir Para Entrega
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>{nome || 'Nome Completo'}</p>
                  <p style={{ margin: 0 }}>{email || 'email@exemplo.com'}</p>
                  <p style={{ margin: 0 }}>{tel || '(00) 00000-0000'}</p>
                </div>
              )}
            </div>

            {/* Step 2: Entrega */}
            {passo >= 2 && (
            <div style={passo === 2 ? boxStyle : { ...boxStyle, border: '1px solid #13BF8C', padding: '16px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 18, fontWeight: 700, color: '#111827', margin: passo === 2 ? '0 0 16px' : '0 0 12px' }}>
                <span>{passo > 2 ? 'Enviar para' : 'Entrega'}</span>
                {passo === 2 ? stepIndicator(2, 3) : (
                  <button onClick={() => setPasso(2)} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Editar
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                )}
              </div>
              
              {passo === 2 ? (
                <>
                  <p style={{ fontSize: 12, color: '#4B5563', margin: '0 0 20px' }}>Informe o endereço de entrega</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <label style={labelStyle}>CEP</label>
                        <input
                          style={{ ...inputStyle, borderColor: cepValido === true ? '#13BF8C' : cepValido === false ? '#EF4444' : '#E5E7EB', background: cepValido === true ? '#F7FFFA' : '#fff' }}
                          value={cep}
                          onChange={e => { const v = mascaraCEP(e.target.value); setCep(v); buscarCep(v) }}
                          placeholder="00000-000" maxLength={9} />
                        {cepValido === true && <CheckIcon />}
                      </div>
                      {cidade && uf && (
                        <div style={{ flex: 2, fontSize: 11, color: '#6B7280', paddingBottom: 12 }}>
                          📍 {cidade} - {uf}
                        </div>
                      )}
                    </div>
                    {cepValido === false && <FieldError msg="CEP não encontrado. Verifique e tente novamente." />}
                    <div>
                      <label style={labelStyle}>Endereço</label>
                      <div style={{ position: 'relative' }}>
                        <input style={{...inputStyle, borderColor: endereco.length > 3 ? '#13BF8C' : '#DCEEE5', background: endereco.length > 3 ? '#F7FFFA' : '#fff'}} value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, Avenida..." />
                        {endereco.length > 3 && <CheckIcon />}
                      </div>
                    </div>
                    <div className="field-row-2fr" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Nº *</label>
                        <div style={{ position: 'relative' }}>
                          <input style={{...inputStyle, borderColor: numero.length > 0 ? '#13BF8C' : '#DCEEE5', background: numero.length > 0 ? '#F7FFFA' : '#fff'}} value={numero} onChange={e => setNumero(e.target.value)} placeholder="Número" />
                          {numero.length > 0 && <CheckIcon />}
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Bairro</label>
                        <div style={{ position: 'relative' }}>
                          <input style={{...inputStyle, borderColor: bairro.length > 2 ? '#13BF8C' : '#DCEEE5', background: bairro.length > 2 ? '#F7FFFA' : '#fff'}} value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro" />
                          {bairro.length > 2 && <CheckIcon />}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Complemento (opcional)</label>
                      <input style={inputStyle} placeholder="" />
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 12px' }}>Escolha o frete:</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* PAC */}
                        <div onClick={() => setEntrega('pac')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: entrega === 'pac' ? '1px solid #13BF8C' : '1px solid #E5E7EB', borderRadius: 8, background: entrega === 'pac' ? '#F0FDF4' : '#fff', cursor: 'pointer' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input type="radio" checked={entrega === 'pac'} readOnly style={{ accentColor: '#13BF8C', width: 16, height: 16 }} />
                            <img src="/img/seguro/correios.png" alt="Correios" style={{ height: 22, width: 'auto', objectFit: 'contain' }} />
                            <div>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>PAC - Correios</p>
                              <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>5 a 15 dias 📦</p>
                            </div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Grátis</span>
                        </div>
                        {/* SEDEX */}
                        <div onClick={() => setEntrega('sedex')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: entrega === 'sedex' ? '1px solid #13BF8C' : '1px solid #E5E7EB', borderRadius: 8, background: entrega === 'sedex' ? '#F0FDF4' : '#fff', cursor: 'pointer' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input type="radio" checked={entrega === 'sedex'} readOnly style={{ accentColor: '#13BF8C', width: 16, height: 16 }} />
                            <img src="/img/seguro/sedex.png" alt="Sedex" style={{ height: 22, width: 'auto', objectFit: 'contain' }} />
                            <div>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>Sedex - Correios</p>
                              <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>3 a 5 dias <span style={{background: '#FCD34D', padding: '1px 4px', borderRadius: 4, fontSize: 9, fontWeight: 800, color: '#000'}}>SEDEX</span></p>
                            </div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>R$ 14,90</span>
                        </div>
                        {/* FULL */}
                        <div onClick={() => setEntrega('full')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: entrega === 'full' ? '1px solid #13BF8C' : '1px solid #E5E7EB', borderRadius: 8, background: entrega === 'full' ? '#F0FDF4' : '#fff', cursor: 'pointer' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input type="radio" checked={entrega === 'full'} readOnly style={{ accentColor: '#13BF8C', width: 16, height: 16 }} />
                            <img src="/img/seguro/full.svg" alt="Envio FULL" style={{ height: 22, width: 'auto', objectFit: 'contain' }} />
                            <div>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>Envio FULL</p>
                              <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>Entrega garantida <span style={{color: '#10B981', fontWeight: 800}}>⚡ FULL</span></p>
                            </div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>R$ 21,90</span>
                        </div>
                      </div>
                    </div>

                    <button onClick={() => setPasso(3)} disabled={!dadosEntregaOk} style={{ ...btnPrimario, opacity: dadosEntregaOk ? 1 : 0.7, cursor: dadosEntregaOk ? 'pointer' : 'not-allowed', marginTop: 8 }}>
                      Ir Para Pagamento
                    </button>
                  </div>
                </>
              ) : passo > 2 ? (
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                  <p style={{ margin: 0 }}>{endereco}, {numero}</p>
                  <p style={{ margin: 0 }}>{bairro}, {cidade} de {uf}</p>
                  <p style={{ margin: 0 }}>{cep}</p>
                  <p style={{ margin: '8px 0 0', fontWeight: 600 }}>Frete selecionado:</p>
                  <p style={{ margin: 0 }}>{entrega === 'pac' ? 'PAC - Correios - Grátis' : entrega === 'sedex' ? 'Sedex - Correios - R$ 14,90' : 'Envio FULL - R$ 21,90'}</p>
                </div>
              ) : null}
            </div>
            )}
          </div>

          {/* Column 2: Pagamento */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, order: isMobile ? 2 : 0 }}>
            {passo >= 3 && (
            <div style={boxStyle}>
              <div style={titleStyle}>
                <span>Pagamento</span>
                {stepIndicator(3, 3)}
              </div>
              <p style={{ fontSize: 12, color: '#4B5563', margin: '0 0 20px' }}>Todas as transações são seguras e criptografadas.</p>
              
              {passo === 3 && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                    <div onClick={() => setMetodo('pix')} style={{ border: `1px solid ${metodo === 'pix' ? '#13BF8C' : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', background: '#fff' }}>
                      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: metodo === 'pix' ? '1px solid #E5E7EB' : 'none' }}>
                        <input type="radio" checked={metodo === 'pix'} readOnly style={{ accentColor: '#13BF8C', width: 16, height: 16 }} />
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 12L12 6L18 12L12 18L6 12Z" fill="#13BF8C"/><path d="M12 10.5L13.5 12L12 13.5L10.5 12L12 10.5Z" fill="#fff"/></svg>
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>PIX</span>
                      </div>
                      {metodo === 'pix' && (
                        <div style={{ padding: '24px 16px', textAlign: 'center', background: '#F9FAFB', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                          <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.5 }}>
                            O código Pix expira em 30 minutos<br/>após finalizar a compra.
                          </p>
                          <p style={{ fontSize: 14, color: '#111827', margin: '0 0 24px' }}>
                            Valor no Pix: <span style={{ fontWeight: 700, color: '#13BF8C' }}>R$ {(valor + (entrega === 'sedex' ? 14.9 : entrega === 'full' ? 21.9 : 0)).toFixed(2).replace('.', ',')}</span>
                          </p>
                          
                          {!pixCode ? (
                            <button onClick={gerarPix} disabled={carregando} style={{ ...btnPrimario, background: carregando ? '#D1D5DB' : COR_PRINCIPAL, margin: 0 }}>
                              {carregando ? 'Processando...' : 'Finalizar Compra'}
                            </button>
                          ) : (
                            <div>
                              <h3 style={{ fontSize: 16, color: COR_PRINCIPAL, margin: '0 0 16px', fontWeight: 700 }}>Pedido gerado!</h3>
                              {qrDataUrl && <img src={qrDataUrl} alt="QR Code PIX" width={200} height={200} style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 8, background: '#fff', margin: '0 auto' }} />}
                              <div style={{ marginTop: 24, textAlign: 'left' }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Código copia-e-cola:</p>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <input readOnly value={pixCode} style={{ ...inputStyle, flex: 1 }} />
                                  <button onClick={copiarCodigo} style={{ background: copiado ? COR_PRINCIPAL : COR_FOOTER, color: '#fff', border: 'none', borderRadius: '0.375rem', padding: '0 16px', fontWeight: 600, cursor: 'pointer' }}>
                                    Copiar
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div onClick={() => setMetodo('cartao')} style={{ border: `1px solid ${metodo === 'cartao' ? '#13BF8C' : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', background: '#fff' }}>
                      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: metodo === 'cartao' ? '1px solid #E5E7EB' : 'none' }}>
                        <input type="radio" checked={metodo === 'cartao'} readOnly style={{ accentColor: '#13BF8C', width: 16, height: 16 }} />
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>Cartão de crédito</span>
                      </div>
                      {metodo === 'cartao' && (
                        <div style={{ padding: '24px 16px', background: '#F9FAFB', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                          {/* Cartão 3D animado */}
                          <div style={{ perspective: 1000, marginBottom: 20 }}>
                            <div style={{
                              position: 'relative', aspectRatio: '1.586 / 1', maxWidth: 340, width: '100%',
                              margin: '0 auto', background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
                              borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                              transform: 'rotateY(-6deg) rotateX(2deg)', transformStyle: 'preserve-3d',
                              overflow: 'hidden',
                            }}>
                              {/* chip */}
                              <div style={{ position: 'absolute', top: 18, left: 20, width: 42, height: 32, borderRadius: 6, background: 'linear-gradient(135deg, #f5d76e, #c9a227)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)' }} />
                              {/* contactless */}
                              <div style={{ position: 'absolute', top: 22, left: 72, width: 18, height: 24, opacity: 0.8 }}>
                                <svg viewBox="0 0 24 24" width="18" height="24" fill="none" stroke="#d4d4d8" strokeWidth="1.5"><path d="M7 8a6 6 0 0 1 0 8M10 5a10 10 0 0 1 0 14M4 11a2 2 0 0 1 0 2" /></svg>
                              </div>
                              {/* bandeira no canto */}
                              <div style={{ position: 'absolute', top: 18, right: 20 }}>
                                {bandeira ? <BandeiraLogo bandeira={bandeira} size={26} /> : (
                                  <svg width="26" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                                )}
                              </div>
                              {/* número mascarado */}
                              <div style={{ position: 'absolute', bottom: 56, left: 20, right: 20, fontSize: 19, letterSpacing: '0.1em', color: '#fff', fontFamily: "'Courier New', monospace", fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                {bandeira === 'amex'
                                  ? (numeroCartao || '•••• •••••• •••••').slice(0, 20)
                                  : (numeroCartao || '•••• •••• •••• ••••')}
                              </div>
                              {/* nome + validade */}
                              <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                  <p style={{ margin: 0, fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Titular</p>
                                  <p style={{ margin: 0, fontSize: 12, color: '#fff', textTransform: 'uppercase', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {nomeCartao || 'SEU NOME'}
                                  </p>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <p style={{ margin: 0, fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Validade</p>
                                  <p style={{ margin: 0, fontSize: 12, color: '#fff', fontWeight: 600 }}>{validade || 'MM/AA'}</p>
                                </div>
                              </div>
                              {/* brilho */}
                              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 40%)', pointerEvents: 'none' }} />
                            </div>
                          </div>

                          {/* Grade de bandeiras */}
                          <div style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Bandeiras aceitas</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(56px, 1fr))', gap: 8 }}>
                              {(['visa', 'mastercard', 'amex', 'elo', 'hipercard', 'diners', 'discover'] as Bandeira[]).map(b => (
                                <div key={b} style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', height: 40,
                                  border: `1px solid ${bandeira === b ? '#13BF8C' : '#E5E7EB'}`,
                                  borderRadius: 8, background: bandeira === b ? '#F0FDF9' : '#fff',
                                  opacity: bandeira && bandeira !== b ? 0.35 : 1,
                                  padding: '0 6px',
                                }}>
                                  <BandeiraLogo bandeira={b} size={24} />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                            <div>
                              <label style={labelStyle}>Nome no cartão</label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  style={{...inputStyle, background: '#fff', borderColor: tentouSubmitCartao && nomeCartao.trim().length < 3 ? '#EF4444' : nomeCartao.trim().length >= 3 ? '#13BF8C' : '#E5E7EB'}}
                                  value={nomeCartao}
                                  onChange={e => setNomeCartao(e.target.value.toUpperCase())}
                                  placeholder="Nome impresso no cartão" />
                                {nomeCartao.trim().length >= 3 && <CheckIcon />}
                              </div>
                              {tentouSubmitCartao && nomeCartao.trim().length < 3 && <FieldError msg="Digite o nome como está no cartão" />}
                            </div>

                            <div>
                              <label style={labelStyle}>Número do cartão</label>
                              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                  style={{...inputStyle, background: '#fff', paddingRight: bandeira ? 48 : 12, letterSpacing: '0.05em', borderColor: tentouSubmitCartao && cartaoNumLimpo.length < 15 ? '#EF4444' : cartaoNumLimpo.length >= 15 ? '#13BF8C' : '#E5E7EB'}}
                                  value={numeroCartao}
                                  onChange={e => {
                                    const novo = mascaraCartao(e.target.value, bandeira)
                                    setNumeroCartao(novo)
                                    setBandeira(detectarBandeira(novo))
                                  }}
                                  placeholder="1234 1234 1234 1234"
                                  maxLength={bandeira === 'amex' ? 17 : 19}
                                  inputMode="numeric" />
                                {bandeira && (
                                  <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                    <BandeiraLogo bandeira={bandeira} size={28} />
                                  </div>
                                )}
                              </div>
                              {tentouSubmitCartao && cartaoNumLimpo.length < 15 && <FieldError msg="Número do cartão inválido" />}
                            </div>

                            <div className="field-row-half" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <div>
                                <label style={labelStyle}>Data de validade</label>
                                <input
                                  style={{...inputStyle, background: '#fff', borderColor: tentouSubmitCartao && validade.length < 5 ? '#EF4444' : validade.length === 5 ? '#13BF8C' : '#E5E7EB'}}
                                  value={validade}
                                  onChange={e => setValidade(mascaraValidade(e.target.value))}
                                  placeholder="MM / AA" maxLength={5} inputMode="numeric" />
                                {tentouSubmitCartao && validade.length < 5 && <FieldError msg="Validade inválida" />}
                              </div>
                              <div>
                                <label style={labelStyle}>CVV</label>
                                <input style={inputStyle} placeholder="123" />
                              </div>
                            </div>

                            {/* SelectParcelamento */}
                            <div>
                              <label style={labelStyle}>Parcelamento</label>
                              <div style={{ position: 'relative' }}>
                                <select
                                  value={parcelas}
                                  onChange={e => setParcelas(Number(e.target.value))}
                                  style={{ ...inputStyle, background: '#fff', appearance: 'none', paddingRight: 40, cursor: 'pointer' }}
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => {
                                    const v = valorTotal / n
                                    return (
                                      <option key={n} value={n}>
                                        {n}x de R$ {v.toFixed(2).replace('.', ',')}{n === 1 ? ' sem juros' : ' sem juros'}
                                      </option>
                                    )
                                  })}
                                </select>
                                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280', fontSize: 12 }}>
                                  ▾
                                </span>
                              </div>
                            </div>

                            <button onClick={() => setErro('Por favor, utilize o pagamento via PIX no momento.')} style={btnPrimario}>
                              Finalizar Compra · {parcelas}x de R$ {(valorTotal / parcelas).toFixed(2).replace('.', ',')}
                            </button>
                            {erro && <p style={{ color: '#EF4444', fontSize: 13, margin: '8px 0 0', textAlign: 'center' }}>{erro}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  </>
                )}
            </div>
            )}
          </div>

          {/* Column 3: Resumo do Pedido & Trust Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={boxStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Resumo do pedido</h2>
                <button onClick={() => setResumoAberto(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }} aria-label={resumoAberto ? 'Ocultar resumo' : 'Exibir resumo'}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: resumoAberto ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              </div>

              {resumoAberto && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#4B5563', marginBottom: 12 }}>
                    <span>Produtos ({un}x)</span>
                    <span>R$ {valor.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#111827', paddingBottom: 16, borderBottom: '1px solid #E5E7EB', marginBottom: 16 }}>
                    <span>Total</span>
                    <span>R$ {valorTotal.toFixed(2).replace('.', ',')}</span>
                  </div>

                  {/* Brinde */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px dashed #A4DFC1', background: '#F7FFFA', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                      <img src="https://assetsglobalbr.com/u/testimony/c8125484.webp" alt="Brinde" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', margin: 0 }}>Chave de fenda</p>
                      <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>Chave de fenda</p>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 16, border: '1px solid #6EE7B7', padding: '2px 10px', fontSize: 11, fontWeight: 600, background: '#fff', color: '#10B981' }}>
                      Brinde
                    </span>
                  </div>

                  {/* Product */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 0, border: '1px solid #E5E7EB', borderRadius: 8, padding: 12 }}>
                    <div style={{ width: 48, height: 48, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={produto.img.startsWith('http') ? produto.img : IMG_BASE + produto.img} alt={produto.nome} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: '#111827', margin: '0 0 8px', lineHeight: 1.4 }}>{produto.nome} ({un} {un === 1 ? 'unidade' : 'unidades'})</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#111827' }}>R$ {valor.toFixed(2).replace('.', ',')}</span>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                          <button onClick={() => setQtd(v => Math.max(1, v - 1))} style={{ padding: '2px 8px', background: '#F9FAFB', color: '#9CA3AF', fontSize: 14, border: 'none', cursor: 'pointer', lineHeight: 1 }}>-</button>
                          <span style={{ padding: '2px 12px', fontSize: 12, color: '#111827', borderLeft: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB', minWidth: 20, textAlign: 'center' }}>{un}</span>
                          <button onClick={() => setQtd(v => Math.min(12, v + 1))} style={{ padding: '2px 8px', background: '#F9FAFB', color: '#9CA3AF', fontSize: 14, border: 'none', cursor: 'pointer', lineHeight: 1 }}>+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 16px 32px' : '0 20px 32px', width: '100%' }}>
        <div style={boxStyle}>
          {/* Badge 1 */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src="https://assetsglobalbr.com/u/testimonies/e5a51126.png" alt="Correios" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            <div>
              {stars}
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Envio Com Código De Rastreio</h4>
              <p style={{ fontSize: 11, color: '#4B5563', margin: 0, lineHeight: 1.4 }}>Acompanhe sua entrega em cada etapa até a chegada.</p>
            </div>
          </div>
          <hr style={{ border: 0, borderTop: '1px dashed #E5E7EB', margin: '0 0 20px' }} />

          {/* Badge 2 */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src="https://assetsglobalbr.com/u/testimonies/5a6e9783.png" alt="Devolução" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            <div>
              {stars}
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Devolução Facilitada</h4>
              <p style={{ fontSize: 11, color: '#4B5563', margin: 0, lineHeight: 1.4 }}>30 dias para troca ou devolução de forma simples, rápida e segura.</p>
            </div>
          </div>
          <hr style={{ border: 0, borderTop: '1px dashed #E5E7EB', margin: '0 0 20px' }} />

          {/* Badge 3 */}
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src="https://assetsglobalbr.com/u/testimonies/5a719e6c.png" alt="Seguro" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            <div>
              {stars}
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Compra 100% Segura</h4>
              <p style={{ fontSize: 11, color: '#4B5563', margin: 0, lineHeight: 1.4 }}>Seus dados protegidos durante toda a finalização da compra.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: COR_FOOTER, padding: '40px 20px', marginTop: 'auto' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>Plugmax | Todos os direitos reservados</p>
          <p style={{ color: '#fff', fontSize: 12, margin: '0 0 4px' }}>Rua Colômbia, 875 - Guilhermina Praia Grande - SP</p>
          <p style={{ color: '#fff', fontSize: 12, margin: '0 0 8px' }}>© 2026 Plugmax</p>
          <p style={{ color: '#fff', fontSize: 12, margin: '0 0 24px' }}>E-mail: onlinesuportebr@proton.me</p>
          
          <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>Formas de pagamento:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
            {['', ' (1)', ' (2)', ' (3)', ' (4)', ' (5)', ' (6)', ' (7)'].map((num, idx) => (
              <img key={idx} src={`/img/transferir${num}.svg`} alt="Bandeira de pagamento" style={{ height: 26, objectFit: 'contain' }} />
            ))}
          </div>
        </div>
      </footer>

    </div>
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: COR_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #E5E7EB', borderTopColor: COR_FOOTER, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  )
}

