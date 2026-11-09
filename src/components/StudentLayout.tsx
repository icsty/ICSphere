import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import type { AuthState } from '../hooks/useAuth'
import { studentPages } from '../lib/navigation'
import { LayoutDashboard, CalendarDays, Megaphone, BookOpenText, Library, UserRound, ClipboardList, ShieldCheck, LogOut, Home } from 'lucide-react'

const navigationIcons = { '/dashboard': LayoutDashboard, '/schedule': CalendarDays, '/announcements': Megaphone, '/enrollment': BookOpenText, '/resources': Library, '/profile': UserRound }

export function StudentLayout({ auth, path, preview, children }: { auth: AuthState; path: string; preview: boolean; children: ReactNode }) {
  const href = (target: string) => `${preview ? '/preview' : ''}${target}`
  const navigation = useRef<HTMLElement>(null)
  useEffect(() => {
    const nav = navigation.current
    if (!nav) return
    function revealCurrentPage() {
      const active = nav?.querySelector<HTMLElement>('[aria-current="page"]')
      if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return
      nav.scrollLeft += active.getBoundingClientRect().left - nav.getBoundingClientRect().left - (nav.clientWidth - active.clientWidth) / 2
    }
    const observer = new ResizeObserver(revealCurrentPage)
    observer.observe(nav)
    revealCurrentPage()
    return () => observer.disconnect()
  }, [path])
  return (
    <div className="workspace">
      <button className="skip-link" onClick={() => document.getElementById('workspace-main')?.focus()}>Skip to content</button>
      <aside className="workspace-sidebar">
        <a className="wordmark" href="/">ICSphere<span className="brand-period">.</span></a>
        <p className="sidebar-institution">Institute of Computer Studies<br />Rizal Technological University</p>
        <nav ref={navigation} className="workspace-nav" aria-label="Student navigation">
          <p className="nav-group-label">Your account</p>
          {[{ path: '/onboarding', label: 'Registration', Icon: ClipboardList }, { path: '/verification', label: 'Application status', Icon: ShieldCheck }].map(({ Icon, ...page }) => <a key={page.path} href={href(page.path)} aria-current={path === page.path ? 'page' : undefined}><Icon className="ui-icon" aria-hidden="true" /><span>{page.label}</span></a>)}
          <p className="nav-group-label">Academic workspace</p>
          {studentPages.map(page => { const Icon = navigationIcons[page.path]; return <a key={page.path} href={href(page.path)} aria-current={path === page.path ? 'page' : undefined}><Icon className="ui-icon" aria-hidden="true" /><span>{page.label}</span></a> })}
        </nav>
        <div className="sidebar-footer">
          <span>{preview ? 'Student screen preview' : 'Approved student account'}</span>
          <a href="/">Back to landing page</a>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-topbar">
          <span>{preview ? 'Local development preview · No student data' : 'Student account'}</span>
          {auth.session ? <button className="text-button workspace-account-action" disabled={Boolean(auth.action)} onClick={() => void auth.signOut()}><LogOut className="ui-icon" aria-hidden="true" /><span>{auth.action === 'signout' ? 'Signing out…' : 'Sign out'}</span></button> : <a className="workspace-account-action" href="/"><Home className="ui-icon" aria-hidden="true" /><span>Back to ICSphere</span></a>}
        </header>
        <main className="workspace-main" id="workspace-main" tabIndex={-1}>
          {preview && <div className="notice preview-notice">Design preview. All records are empty; no approval, upload, or account change is performed.</div>}
          {children}
          <p className="auth-message" role="status">{auth.message}</p>
        </main>
        <footer className="workspace-footer">ICSphere · Academic information for RTU ICS BSIT students</footer>
      </div>
    </div>
  )
}
