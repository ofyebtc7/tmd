import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const isConfigured = url.startsWith('http') && serviceKey.length > 0 && !serviceKey.startsWith('[')

// Client com privilégios totais (ignora RLS).
// Uso EXCLUSIVO em código de servidor: webhook do gateway e
// página pública de checkout. NUNCA importar em Client Components.
export function createAdminClient() {
  return createClient(
    isConfigured ? url : 'http://localhost:54321',
    isConfigured ? serviceKey : 'placeholder'
  )
}