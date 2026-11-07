import type { AuthState } from '../hooks/useAuth'
import { ThemeSelect } from '../components/ThemeSelect'

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
      <a className="wordmark" href="/" aria-label="ICSphere home">ICSphere</a>
      <nav className="landing-navigation" aria-label="Landing navigation"><button onClick={() => scrollToSection('academic-tools')}>Academics</button><button onClick={() => scrollToSection('student-access')}>Student access</button></nav>
      <ThemeSelect />
      {auth.session ? <a className="entrance-account-link" href="/onboarding">Your account</a> : <button className="entrance-account-link" disabled={disabled} onClick={() => void auth.signIn()}>{opening ? 'Opening Google...' : 'Sign in'}</button>}
    </div></header>

    <main id="entrance-main" className="landing-main" tabIndex={-1}>
      <section className="editorial-opening entrance-width" aria-labelledby="hero-title">
        <div className="editorial-attribution"><p>Institute of Computer Studies</p><p>Rizal Technological University</p></div>
        <h1 id="hero-title">Classes, updates,<br />and the semester ahead.</h1>
        <div className="editorial-opening-bottom">
          <p className="editorial-deck">An academic home for RTU BS Information Technology students. ICSphere is being developed to bring your class schedule, department updates, enrollment guidance, and subject resources together.</p>
          <div className="editorial-entry">
            {auth.session ? <a className="entrance-primary" href="/onboarding">Continue to registration</a> : <button className="entrance-primary" disabled={disabled} onClick={() => void auth.signIn()}>{auth.loading ? 'Checking session...' : opening ? 'Opening Google...' : 'Continue with Google'}</button>}
            <p>Google sign-in is available now.<br />Document submissions and academic tools are not open yet.</p>
          </div>
        </div>
        <p className="entrance-feedback" role="status" aria-live="polite" aria-atomic="true">{auth.message || (!auth.configured ? 'Google sign-in is unavailable in this environment. The project maintainer needs to check the sign-in configuration.' : '')}</p>
        {auth.session && <div className="hero-signed-in"><span>{auth.session.user.email || 'Your Google account is signed in.'}</span><button className="entrance-signout" disabled={Boolean(auth.action)} onClick={() => void auth.signOut()}>{auth.action === 'signout' ? 'Signing out...' : 'Sign out'}</button></div>}
      </section>

      <section className="editorial-academics" id="academic-tools" tabIndex={-1} aria-labelledby="academics-title"><div className="entrance-width">
        <div className="editorial-section-heading"><h2 id="academics-title">The semester, in focus.</h2><p>Four academic tools being built for your student workspace. These features are not available yet.</p></div>
        <div className="editorial-feature-spread">
          <article className="editorial-schedule" aria-labelledby="schedule-title">
            <h3 id="schedule-title">My Schedule</h3><p className="editorial-feature-line">Start with the shape<br />of your week.</p>
            <p>Find class times, rooms, and subjects in a schedule-first workspace. Your next class should be easy to find, and the rest of your week easy to understand.</p>
            <dl className="editorial-schedule-notes"><div><dt>Review the original</dt><dd>Keep extracted registration-form values distinguishable from your corrections.</dd></div><div><dt>See conflicts clearly</dt><dd>Review overlap warnings before acknowledging classes that share a time.</dd></div></dl>
          </article>
          <article className="editorial-announcements" aria-labelledby="announcements-title"><h3 id="announcements-title">Announcements</h3><p className="editorial-article-line">Keep the important<br />updates in view.</p><p>Department announcements organized by priority, with published academic updates in one place.</p><p>Administrator-managed publishing and a basic revision history will help students follow changes to published information.</p><p className="editorial-article-note">Planned: priority updates, attachments, and published revisions.</p></article>
        </div>
      </div></section>

      <section className="editorial-reference entrance-width" aria-labelledby="reference-title"><div className="editorial-reference-intro"><h2 id="reference-title">For the next step.<br />And the work along the way.</h2><p>Guidance for enrollment and materials for your subjects are part of the same academic routine.</p></div>
        <div className="editorial-reference-articles">
          <article aria-labelledby="enrollment-title"><h3 id="enrollment-title">Enrollment Information</h3><p>Procedures, requirements, and guides organized by academic term, so you can prepare for enrollment with the relevant information at hand.</p><p className="editorial-article-note">Informational guidance only. University enrollment transactions remain with official university channels.</p></article>
          <article aria-labelledby="resources-title"><h3 id="resources-title">Academic Resources</h3><p>An administrator-managed library for your studies. Browse materials connected to your enrolled subjects, or explore the full resource collection.</p><p className="editorial-article-note">Planned collections: My Subjects and All Resources.</p></article>
        </div>
      </section>

      <section className="editorial-access entrance-width" id="student-access" tabIndex={-1} aria-labelledby="access-title">
        <div><h2 id="access-title">A student account.<br />A verified place in ICS.</h2><p>Academic access is intended for RTU ICS BSIT students. Google sign-in establishes your account; it does not confirm eligibility.</p><p className="editorial-article-note">You can sign in now. Document submissions and academic tools are not open yet.</p></div>
        <ol className="editorial-access-steps">
          <li><h3>Sign in with Google</h3><p>Open your account and registration screen.</p><span>Available now</span></li>
          <li><h3>Submit your registration form</h3><p>When submissions open, your registration or assessment form will be screened for BSIT eligibility.</p><span>Not open yet</span></li>
          <li><h3>Wait for administrator approval</h3><p>An administrator must review your application before academic access is granted. Document screening alone does not activate your account.</p><span>After document screening</span></li>
        </ol>
      </section>

      <section className="editorial-closing"><div className="entrance-width"><div><h2>Your account starts here.</h2><p>{auth.session ? 'Continue to your registration screen to review your next steps.' : 'Use your Google account to begin. Student access follows verification and approval.'}</p></div>{auth.session ? <a className="entrance-primary" href="/onboarding">Continue to registration</a> : <button className="entrance-primary" disabled={disabled} onClick={() => void auth.signIn()}>{auth.loading ? 'Checking session...' : opening ? 'Opening Google...' : 'Sign in with Google'}</button>}</div></section>
    </main>
    <footer className="entrance-footer"><div className="entrance-width"><p>ICSphere <span>A student-developed academic portal</span></p><p>Rizal Technological University<br />Institute of Computer Studies</p></div></footer>
  </div>
}

export default LandingPage
