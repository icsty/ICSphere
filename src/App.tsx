import { useEffect, useRef, useState } from 'react'
import { StudentLayout } from './components/StudentLayout'
import { useAuth } from './hooks/useAuth'
import { navigate, readRoute, resolveScreen } from './lib/navigation'
import LandingPage from './pages/LandingPage'
import { StudentScreen } from './pages/StudentScreens'
import { ThemeSelect } from './components/ThemeSelect'

function App() {
  const auth = useAuth()
  const [route, setRoute] = useState(() => readRoute(window.location.pathname))
  const previousSession = useRef(false)

  useEffect(() => { window.dispatchEvent(new Event('icsphere:ready')) }, [])

  useEffect(() => {
    function onPopState() { setRoute(readRoute(window.location.pathname)) }
    function onLinkClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = event.target instanceof Element ? event.target.closest('a') : null
      if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return
      const url = new URL(link.href)
      if (url.origin !== window.location.origin || url.hash) return
      event.preventDefault()
      navigate(`${url.pathname}${url.search}`)
      window.scrollTo(0, 0)
    }
    window.addEventListener('popstate', onPopState)
    document.addEventListener('click', onLinkClick)
    return () => {
      window.removeEventListener('popstate', onPopState)
      document.removeEventListener('click', onLinkClick)
    }
  }, [])

  useEffect(() => {
    if (auth.loading) return
    const signedIn = Boolean(auth.session)
    if (signedIn && !previousSession.current && readRoute(window.location.pathname) === '/') {
      navigate('/onboarding', true)
    }
    if (!signedIn && previousSession.current) navigate('/', true)
    previousSession.current = signedIn
  }, [auth.session, auth.loading])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (route === '/') {
        document.title = 'ICSphere — Student portal'
        return
      }
      const heading = document.querySelector<HTMLElement>('.workspace-main h1, .route-message h1')
      document.title = `${heading?.textContent || 'Student account'} — ICSphere`
      heading?.setAttribute('tabindex', '-1')
      heading?.focus({ preventScroll: true })
      window.scrollTo(0, 0)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [route, auth.loading, auth.session])

  if (route === '/') return <LandingPage auth={auth} />

  const screen = resolveScreen(route, import.meta.env.DEV, Boolean(auth.session))
  if (auth.loading) return <main className="route-message"><ThemeSelect /><h1>Checking your session…</h1><p role="status">Please wait while your account session is restored.</p></main>

  if (screen.access !== 'screen') {
    const missing = screen.access === 'missing'
    const signIn = screen.access === 'signin'
    return <main className="route-message">
      <ThemeSelect />
      <a className="wordmark" href="/">ICSphere<span className="brand-period">.</span></a>
      <h1>{missing ? 'Page not found.' : signIn ? 'Sign in to continue.' : 'Student access requires approval.'}</h1>
      <p>{missing ? 'This page is not available. Return to ICSphere to continue.' : signIn ? 'Use your Google account to begin your registration.' : 'Your account is signed in, but student approval has not been confirmed. Registration and verification are the next steps.'}</p>
      {signIn ? <button className="primary-button" disabled={!auth.configured || Boolean(auth.action)} onClick={() => void auth.signIn()}>{auth.action === 'signin' ? 'Opening Google…' : 'Continue with Google'}</button> : <a className="primary-button" href={missing ? '/' : '/onboarding'}>{missing ? 'Back to ICSphere' : 'Go to registration'}</a>}
      {signIn && !auth.configured && <p>Google sign-in is unavailable in this environment.</p>}
      <p className="auth-message" role="status">{auth.message}</p>
    </main>
  }

  return <StudentLayout auth={auth} path={screen.path} preview={screen.preview}>
    <StudentScreen key={screen.path} path={screen.path} auth={auth} preview={screen.preview} />
  </StudentLayout>
}

export default App
