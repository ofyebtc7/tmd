import HeaderPublico from '@/app/components/HeaderPublico'

export default function RastreioCodigoLoading() {
  return (
    <div className="min-h-screen bg-bg-page">
      <HeaderPublico />
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="h-7 w-56 skeleton rounded-lg" />
        <div className="mt-6 rounded-2xl border border-gray-border bg-white p-6 shadow-card">
          <div className="h-4 w-40 skeleton rounded" />
          <div className="mt-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 shrink-0 skeleton rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 skeleton rounded" />
                  <div className="h-3 w-1/2 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
