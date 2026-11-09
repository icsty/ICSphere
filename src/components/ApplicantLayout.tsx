import type { ReactNode } from 'react'
import { LogOut } from 'lucide-react'
import type { AuthState } from '../hooks/useAuth'

export function ApplicantLayout({ auth, path, preview, children }: { auth: AuthState; path: string; preview: boolean; children: ReactNode }) {
  const prefix = preview ? '/preview' : ''
  return <div className="applicant-layout">
    <button className="skip-link" onClick={() => document.getElementById('applicant-main')?.focus()}>Skip to registration</button>
    <header className="applicant-header"><div>
      <a className="wordmark" href="/">ICSphere</a>
      <span className="applicant-header-label">{path.startsWith('/admin') ? 'Registration administration' : 'Student registration'}</span>
      {auth.session && <button className="text-button workspace-account-action" disabled={Boolean(auth.action)} onClick={() => void auth.signOut()}><LogOut className="ui-icon" aria-hidden="true" /><span>{auth.action === 'signout' ? 'Signing out...' : 'Sign out'}</span></button>}
    </div></header>
    <main id="applicant-main" className="applicant-main" tabIndex={-1}>
      {preview && <p className="applicant-preview-note">Local design preview. No registration has been submitted.</p>}
      <nav className="applicant-navigation" aria-label="Registration navigation">
        {path.startsWith('/admin') ? <a href="/admin/registrations" aria-current="page">Application review</a> : <>
        <a href={`${prefix}/onboarding`} aria-current={path === '/onboarding' ? 'page' : undefined}>Registration</a>
        <a href={`${prefix}/verification`} aria-current={path === '/verification' ? 'page' : undefined}>Application status</a>
        </>}
      </nav>
      {children}
      <p className="auth-message" role="status">{auth.message}</p>
    </main>
    <footer className="applicant-footer">Institute of Computer Studies, Rizal Technological University</footer>
  </div>
}
