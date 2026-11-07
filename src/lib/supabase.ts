import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

function createConfiguredClient() {
  if (!url || !key) return null
  try {
    if (new URL(url).hostname !== 'crzgazzspwarsbjvtfsl.supabase.co') return null
    return createClient(url, key, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  } catch {
    return null
  }
}

export const supabase = createConfiguredClient()
