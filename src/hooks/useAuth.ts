import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

function callbackFailed() {
  const query = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.slice(1))
  return query.has('error') || hash.has('error') || query.has('error_description') || hash.has('error_description')
}

function cleanCallbackUrl() {
  const url = new URL(window.location.href)
  for (const name of ['code', 'error', 'error_code', 'error_description']) url.searchParams.delete(name)
  if (/error=|error_description=|access_token=|refresh_token=/.test(url.hash)) url.hash = ''
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [action, setAction] = useState<'signin' | 'signout' | null>(null)
  const [message, setMessage] = useState('')
  const busy = useRef(false)

  useEffect(() => {
    function resume(event: PageTransitionEvent) {
      if (!event.persisted) return
      busy.current = false
      setAction(null)
    }
    window.addEventListener('pageshow', resume)
    return () => window.removeEventListener('pageshow', resume)
  }, [])

  useEffect(() => {
    const client = supabase
    if (!client) return
    let active = true
    let receivedEvent = false
    const failed = callbackFailed()
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
      if (!active) return
      receivedEvent = true
      setSession(next)
      setLoading(false)
    })
    client.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (!receivedEvent) setSession(data.session)
      setLoading(false)
      if (failed || error) setMessage('Sign-in could not be completed. Please try Google sign-in again.')
      cleanCallbackUrl()
    }).catch(() => {
      if (!active) return
      setLoading(false)
      setMessage('We could not restore your session. Please try signing in again.')
      cleanCallbackUrl()
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  async function signIn() {
    if (!supabase || busy.current) return
    busy.current = true
    setAction('signin')
    setMessage('')
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/`, skipBrowserRedirect: true },
      })
      if (error || !data.url) throw new Error('Sign-in unavailable')
      window.location.assign(data.url)
    } catch {
      setMessage('Google sign-in is unavailable right now. Check your connection and try again.')
      setAction(null)
      busy.current = false
    }
  }

  async function signOut() {
    if (!supabase || busy.current) return
    busy.current = true
    setAction('signout')
    setMessage('')
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) throw error
      setSession(null)
      setMessage('You have signed out of this browser.')
    } catch {
      setMessage('We could not sign you out. Check your connection and try again.')
    } finally {
      busy.current = false
      setAction(null)
    }
  }
  return { session, loading, action, message, configured: Boolean(supabase), signIn, signOut }
}

export type AuthState = ReturnType<typeof useAuth>
