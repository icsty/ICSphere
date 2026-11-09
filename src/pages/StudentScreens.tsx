import { useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthState } from '../hooks/useAuth'
import { Onboarding, Verification } from './ApplicantScreens'

function PageHeading({ title, description }: { title: string; description: string }) {
  return <header className="page-heading"><p className="section-kicker">Student workspace</p><h1>{title}</h1><p>{description}</p></header>
}

function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="empty-state"><h3>{title}</h3><p>{children}</p></div>
}

function Dashboard() {
  return <><PageHeading title="Your academic day" description="Classes first, followed by the academic updates that need your attention." />
    <div className="dashboard-grid"><section className="schedule-overview"><div className="section-title-row"><h2>Today’s classes</h2><a className="text-link" href="/preview/schedule">My schedule</a></div><EmptyState title="Your schedule starts here.">No class schedule is connected. After verification and schedule extraction are available, your classes will appear here.</EmptyState><div className="week-strip" aria-label="Weekday overview">{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => <div key={day}><span>{day}</span><p>No entries</p></div>)}</div></section>
    <aside className="dashboard-aside"><h2>Academic updates</h2><EmptyState title="No announcements to show">Published department updates will appear here when the content service is connected.</EmptyState><a className="text-link" href="/preview/announcements">View announcements</a></aside></div>
    <section className="quick-links"><h2>Plan ahead</h2><a href="/preview/enrollment"><strong>Enrollment information</strong><span>Procedures and requirements by academic term</span></a><a href="/preview/resources"><strong>Academic resources</strong><span>Materials organized around your subjects</span></a></section>
  </>
}

function Schedule() {
  const [view, setView] = useState('Week')
  return <><PageHeading title="My schedule" description="Review your classes and keep extracted details distinguishable from your corrections." />
    <div className="screen-toolbar"><div className="segmented-control" role="group" aria-label="Schedule view">{['Week', 'List'].map(item => <button key={item} aria-pressed={view === item} onClick={() => setView(item)}>{item}</button>)}</div><span className="muted">No academic term connected</span></div>
    <section className="schedule-board" aria-label={`${view} schedule`}>
      {view === 'Week' && <div className="schedule-weekdays" aria-hidden="true">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}</div>}
      <EmptyState title="No classes to display">Your extracted schedule will appear here. Original document values will be retained when corrections become available.</EmptyState>
    </section><p className="screen-footnote">Schedule corrections and overlap acknowledgment will be available when schedule data is connected.</p>
  </>
}

function Announcements() {
  const [filter, setFilter] = useState('All priorities')
  const [search, setSearch] = useState('')
  return <><PageHeading title="Announcements" description="Department updates, ordered so important academic information stays in view." />
    <div className="screen-toolbar"><label className="search-field">Search announcements<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by title or topic" /></label><label className="filter-field">Priority<select value={filter} onChange={event => setFilter(event.target.value)}><option>All priorities</option><option>High priority</option><option>Regular</option></select></label></div>
    <EmptyState title={search || filter !== 'All priorities' ? 'No connected announcements match these filters' : 'No announcements to display'}>The announcement service is not connected yet. Only administrator-published updates will be shown here.</EmptyState>
    {(search || filter !== 'All priorities') && <button className="text-button" onClick={() => { setSearch(''); setFilter('All priorities') }}>Clear filters</button>}
  </>
}

function Enrollment() {
  return <><PageHeading title="Enrollment information" description="Find procedures, requirements, and guidance for your academic term." />
    <div className="screen-columns"><section><h2>Academic term guides</h2><EmptyState title="No enrollment guides available">Published term guides will appear here when administrator-managed enrollment content is connected.</EmptyState></section><aside className="context-panel"><h2>Prepare for enrollment</h2><p>Check published guidance for the applicable term and confirm requirements through official university channels.</p><p>ICSphere provides information only. Enrollment transactions are handled through the university’s official processes.</p></aside></div>
  </>
}

function Resources() {
  const [tab, setTab] = useState('My subjects')
  const [search, setSearch] = useState('')
  return <><PageHeading title="Academic resources" description="Browse subject materials and the administrator-managed resource library." />
    <div className="screen-toolbar"><div className="segmented-control" role="group" aria-label="Resource collection">{['My subjects', 'All resources'].map(item => <button key={item} aria-pressed={tab === item} onClick={() => setTab(item)}>{item}</button>)}</div><label className="search-field">Search resources<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Subject, title, or keyword" /></label></div>
    <EmptyState title={search ? 'No connected resources match your search' : tab === 'My subjects' ? 'Your subject resources will appear here' : 'The resource library is not connected yet'}>{tab === 'My subjects' ? 'Resources can be matched to your enrolled subjects after your schedule and the resource library are connected.' : 'Administrator-published resources will be available to browse here.'}</EmptyState>
    {search && <button className="text-button" onClick={() => setSearch('')}>Clear search</button>}
  </>
}

function Profile({ auth }: { auth: AuthState }) {
  return <><PageHeading title="My profile" description="Your account identity and academic information, kept in one place." />
    <div className="screen-columns"><section className="form-panel"><h2>Account details</h2><dl className="profile-details"><div><dt>Google account</dt><dd>{auth.session?.user.email || 'No account connected in preview'}</dd></div><div><dt>Student name</dt><dd>Not verified</dd></div><div><dt>Student number</dt><dd>Not verified</dd></div><div><dt>Program</dt><dd>Awaiting academic verification</dd></div><div><dt>Academic term</dt><dd>Not connected</dd></div></dl></section><aside className="context-panel"><h2>Your information</h2><p>Academic details will come from your verified registration. Profile changes and photo uploads are not available yet.</p><p>This preview does not save preferences or change your account.</p></aside></div>
  </>
}

export function StudentScreen({ path, auth, preview }: { path: string; auth: AuthState; preview: boolean }) {
  switch (path) {
    case '/onboarding': return <Onboarding auth={auth} preview={preview} />
    case '/verification': return <Verification preview={preview} />
    case '/dashboard': return <Dashboard />
    case '/schedule': return <Schedule />
    case '/announcements': return <Announcements />
    case '/enrollment': return <Enrollment />
    case '/resources': return <Resources />
    case '/profile': return <Profile auth={auth} />
    default: return null
  }
}
