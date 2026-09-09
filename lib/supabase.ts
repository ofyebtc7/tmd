import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const isConfigured =
  url.startsWith('http') && key.length > 0 && !key.startsWith('[')

export const supabase = createClient(
  isConfigured ? url : 'http://localhost:54321',
  isConfigured ? key : 'placeholder'
)