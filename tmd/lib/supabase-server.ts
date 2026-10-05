import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const isConfigured =
  url.startsWith('http') && key.length > 0 && !key.startsWith('[')

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    isConfigured ? url : 'http://localhost:54321',
    isConfigured ? key : 'placeholder',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Pode ser ignorado se houver middleware atualizando as sessões.
          }
        },
      },
    }
  )
}