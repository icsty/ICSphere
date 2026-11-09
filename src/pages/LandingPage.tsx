import type { AuthState } from '../hooks/useAuth'

import { ArrowUp, BookOpenText, CalendarDays, Library, Mail, Megaphone } from 'lucide-react'
import { LandingMobileNavigation } from '../components/LandingMobileNavigation'

const copyrightYear = new Date().getFullYear()
const landingSections = [
  { id: 'about-icsphere', label: 'About' },
  { id: 'features', label: 'Features' },
  { id: 'student-access', label: 'Registration' },
  { id: 'contact-us', label: 'Contact us' },
]

function LandingWordmark() {
  return <span className="icsphere-wordmark" aria-hidden="true"><img src="/brand/icsphere-wordmark.png" alt="" width={2048} height={683} /></span>
}

function LandingPage({ auth }: { auth: AuthState }) {
  const disabled = auth.loading || Boolean(auth.action) || !auth.configured
  const opening = auth.action === 'signin'

  function scrollToSection(id: string) {
    const section = document.getElementById(id)
    section?.scrollIntoView({ block: 'start' })
    section?.focus({ preventScroll: true })
  }

  return <div className="portal-entrance">
    <button className="skip-link" onClick={() => document.getElementById('entrance-main')?.focus()}>Skip to content</button>
    <header className="entrance-header"><div className="entrance-width entrance-header-inner">
      <div className="landing-brand">
        <a className="wordmark landing-wordmark-link" href="/" aria-label="ICSphere home"><LandingWordmark /></a>
        <div className="landing-brand-institution"><p>Institute of Computer Studies</p><p>Rizal Technological University</p></div>
      </div>
      <nav className="landing-navigation" aria-label="Landing navigation">
        {landingSections.map(section => <button key={section.id} onClick={() => scrollToSection(section.id)}>{section.label}</button>)}
      </nav>
      <div className="landing-header-actions">
        {auth.session ? <a className="entrance-primary header-sign-in" href="/onboarding">Account</a> : <button className="entrance-primary header-sign-in" aria-label="Sign in with Google" disabled={disabled} onClick={() => void auth.signIn()}>{opening ? 'Opening...' : 'Sign in'}</button>}
        <LandingMobileNavigation onNavigate={scrollToSection} sections={landingSections} />
      </div>
    </div></header>

    <main id="entrance-main" className="landing-main" tabIndex={-1}>
      <section className="editorial-opening" aria-labelledby="hero-title">
        <div className="entrance-width entrance-hero-content">
        <p className="entrance-hero-intro">Welcome to</p>
        <h1 id="hero-title" className="landing-hero-wordmark"><span className="sr-only">ICSphere</span><LandingWordmark /></h1>
        <p className="entrance-hero-description">Class schedules, department updates, enrollment guidance, and subject resources, organized around your studies.</p>
        <div className="editorial-opening-bottom">
          <div className="editorial-entry">
            {auth.session ? <a className="entrance-primary" href="/onboarding">Continue to registration</a> : <button className="entrance-primary" disabled={disabled} onClick={() => void auth.signIn()}>{auth.loading ? 'Checking session...' : opening ? 'Opening Google...' : 'Continue with Google'}</button>}
          </div>
        </div>
        <p className="entrance-feedback" role="status" aria-live="polite" aria-atomic="true">{auth.message || (!auth.configured ? 'Google sign-in is unavailable in this environment. The project maintainer needs to check the sign-in configuration.' : '')}</p>
        {auth.session && <div className="hero-signed-in"><span>{auth.session.user.email || 'Your Google account is signed in.'}</span><button className="entrance-signout" disabled={Boolean(auth.action)} onClick={() => void auth.signOut()}>{auth.action === 'signout' ? 'Signing out...' : 'Sign out'}</button></div>}
        </div>
      </section>

      <section className="editorial-about entrance-width" id="about-icsphere" tabIndex={-1} aria-labelledby="about-title">
        <h2 id="about-title">About ICSphere</h2>
        <div><p>ICSphere is an academic information portal for BS Information Technology students at the Institute of Computer Studies, Rizal Technological University.</p><p>Its focus is the information students need throughout the semester: class schedules, department announcements, enrollment guidance, and subject resources.</p></div>
      </section>

      <section className="editorial-academics" id="features" tabIndex={-1} aria-labelledby="academics-title"><div className="entrance-width">
        <div className="editorial-section-heading"><h2 id="academics-title">Academic features</h2><p>Class details and department updates, organized around your semester.</p></div>
        <div className="editorial-feature-spread">
          <article className="editorial-schedule" aria-labelledby="schedule-title">
            <h3 id="schedule-title"><CalendarDays className="ui-icon" aria-hidden="true" />My Schedule</h3><p className="editorial-feature-line">Class times, rooms,<br />and subjects.</p>
            <p>A weekly schedule based on your registration form, with subjects, class times, and room details.</p>
            <dl className="editorial-schedule-notes"><div><dt>Registration details</dt><dd>Your registration form is the reference for your class schedule.</dd></div><div><dt>Schedule conflicts</dt><dd>Classes that share a time require review before you plan your week.</dd></div></dl>
          </article>
          <article className="editorial-announcements" aria-labelledby="announcements-title"><h3 id="announcements-title"><Megaphone className="ui-icon" aria-hidden="true" />Announcements</h3><p className="editorial-article-line">Department updates.</p><p>Administrator-published notices about academic activities, deadlines, and other department information.</p><p>Priority levels distinguish urgent notices from regular updates.</p></article>
        </div>
      </div></section>

      <section className="editorial-reference entrance-width" aria-labelledby="reference-title"><div className="editorial-reference-intro"><h2 id="reference-title">Enrollment and<br />academic resources</h2><p>Requirements for enrollment and reference materials for your subjects.</p></div>
        <div className="editorial-reference-articles">
          <article aria-labelledby="enrollment-title"><BookOpenText className="editorial-reference-icon" aria-hidden="true" /><h3 id="enrollment-title">Enrollment Information</h3><p>Enrollment procedures, requirements, and guides for the applicable academic term.</p><p className="editorial-article-note">Enrollment transactions remain with official university channels.</p></article>
          <article aria-labelledby="resources-title"><Library className="editorial-reference-icon" aria-hidden="true" /><h3 id="resources-title">Academic Resources</h3><p>Administrator-managed reference materials organized by subject, alongside the broader resource collection.</p></article>
        </div>
      </section>

      <section className="editorial-access entrance-width" id="student-access" tabIndex={-1} aria-labelledby="access-title">
        <div><h2 id="access-title">Registration and<br />student access</h2><p>Academic access is for RTU ICS BSIT students and requires administrator verification and approval.</p></div>
        <ol className="editorial-access-steps">
          <li><h3>Sign in with Google</h3><p>Open the registration screen using your Google account.</p></li>
          <li><h3>Registration document</h3><p>Your registration or assessment form is required to check BSIT eligibility.</p></li>
          <li><h3>Administrator review</h3><p>An administrator must review your application before academic access can be granted. Google sign-in alone does not approve an account.</p></li>
        </ol>
      </section>

      <section className="editorial-closing"><div className="entrance-width"><div><h2>Sign in to ICSphere</h2><p>{auth.session ? 'Continue to your student registration.' : 'Use your Google account to open student registration.'}</p></div>{auth.session ? <a className="entrance-primary" href="/onboarding">Continue to registration</a> : <button className="entrance-primary" disabled={disabled} onClick={() => void auth.signIn()}>{auth.loading ? 'Checking session...' : opening ? 'Opening Google...' : 'Sign in with Google'}</button>}</div></section>
    </main>
    <footer className="entrance-footer" id="contact-us" tabIndex={-1} aria-labelledby="footer-contact-title">
      <div className="entrance-width">
        <div className="entrance-footer-grid">
          <div className="entrance-footer-brand">
            <a className="wordmark landing-wordmark-link" href="/" aria-label="ICSphere home"><LandingWordmark /></a>
            <p>A student-developed academic information portal for RTU ICS BSIT students.</p>
            <p className="entrance-footer-institution">Institute of Computer Studies<br />Rizal Technological University</p>
          </div>
          <div className="entrance-footer-explore">
            <h2>Explore</h2>
            <nav aria-label="Footer navigation">
              <button onClick={() => scrollToSection('about-icsphere')}>About ICSphere</button>
              <button onClick={() => scrollToSection('features')}>Features</button>
              <button onClick={() => scrollToSection('student-access')}>Registration</button>
            </nav>
          </div>
          <div className="entrance-footer-contact">
            <h2 id="footer-contact-title">Contact us</h2>
            <p>For questions or feedback about ICSphere, email:</p>
            <a className="entrance-footer-email" href="mailto:2024-201182@rtu.edu.ph"><Mail className="ui-icon" aria-hidden="true" /><span>2024-201182@rtu.edu.ph</span></a>
          </div>
        </div>
        <div className="entrance-footer-bottom">
          <p>&copy; {copyrightYear} ICSphere</p>
          <button onClick={() => scrollToSection('entrance-main')}>Back to top<ArrowUp className="ui-icon" aria-hidden="true" /></button>
        </div>
      </div>
    </footer>
  </div>
}

export default LandingPage
