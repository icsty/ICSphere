import type { ReactNode } from 'react'
import type { AuthState } from '../hooks/useAuth'
import { studentPages } from '../lib/navigation'
import { ThemeSelect } from './ThemeSelect'

export function StudentLayout({ auth, path, preview, children }: { auth: AuthState; path: string; preview: boolean; children: ReactNode }) {
  const href = (target: string) => `${preview ? '/preview' : ''}${target}`
  return (
    <div className="workspace">
      <button className="skip-link" onClick={() => document.getElementById('workspace-main')?.focus()}>Skip to content</button>
      <aside className="workspace-sidebar">
        <a className="wordmark" href="/">ICSphere<span className="brand-period">.</span></a>
        <p className="sidebar-institution">Institute of Computer Studies<br />Rizal Technological University</p>
        <nav className="workspace-nav" aria-label="Student navigation">
          <p className="nav-group-label">Your account</p>
          {[{ path: '/onboarding', label: 'Registration' }, { path: '/verification', label: 'Verification status' }].map(page => <a key={page.path} href={href(page.path)} aria-current={path === page.path ? 'page' : undefined}>{page.label}</a>)}
          <p className="nav-group-label">Academic workspace</p>
          {studentPages.map(page => <a key={page.path} href={href(page.path)} aria-current={path === page.path ? 'page' : undefined}>{page.label}</a>)}
        </nav>
        <div className="sidebar-footer">
          <span>{preview ? 'Student screen preview' : 'Student access requires approval'}</span>
          <a href="/">Back to landing page</a>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-topbar">
          <span>{preview ? 'Local development preview · No student data' : 'Student account'}</span>
          <ThemeSelect />
          {auth.session ? <button className="text-button" disabled={Boolean(auth.action)} onClick={() => void auth.signOut()}>{auth.action === 'signout' ? 'Signing out…' : 'Sign out'}</button> : <a href="/">Back to ICSphere</a>}
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
