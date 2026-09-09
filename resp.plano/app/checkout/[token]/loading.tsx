import HeaderPublico from '@/app/components/HeaderPublico'

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-bg-page">
      <HeaderPublico />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="h-6 w-40 skeleton rounded-lg" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="h-5 w-48 skeleton rounded" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 skeleton rounded-xl" />
            ))}
            <div className="h-5 w-48 skeleton rounded" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-14 skeleton rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-40 skeleton rounded-2xl" />
            <div className="h-24 skeleton rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
