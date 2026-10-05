import HeaderPublico from '@/app/components/HeaderPublico'
import FooterLoja from '@/app/components/FooterLoja'
import Button from '@/app/components/ui/Button'

export default function RastreioNaoEncontrado() {
  return (
    <div className="min-h-screen bg-bg-page">
      <HeaderPublico />
      <div className="flex items-center justify-center px-4 pt-10">
        <div className="w-full max-w-md">
          <div className="space-y-4 rounded-xl border border-black/[0.06] bg-white p-8 text-center">
            <h1 className="font-sans text-[22px] font-semibold text-text-strong">
              Código não encontrado
            </h1>
            <p className="text-[13px] text-text-muted">
              O código de rastreio informado não foi encontrado. Verifique o código e tente novamente.
            </p>
            <div className="pt-2">
              <Button href="/rastreio" variant="secondary" size="lg" className="w-full">
                Voltar para busca
              </Button>
            </div>
          </div>
        </div>
      </div>
      <FooterLoja />
    </div>
  )
}

