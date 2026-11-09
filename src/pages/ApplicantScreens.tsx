import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react'
import type { AuthState } from '../hooks/useAuth'
import { useRegistrationAccount, type RegistrationState } from '../hooks/useRegistrationAccount'
import { validatePersonal, type PersonalDetails } from '../lib/registration'
import { RTU_PROGRAM_CODE, RTU_PROGRAM_NAME, validateInstitutionalEmail } from '../lib/registrationValidation'

const nameLabels = { lastName: 'Last name', firstName: 'First name', middleName: 'Middle name', suffix: 'Suffix' } as const

export function Onboarding({auth, preview, registration}: {auth: AuthState; preview: boolean; registration?: RegistrationState}) {
  const local = useRegistrationAccount(auth, !registration && !preview)
  const state = registration || local
  const application = state.data?.application
  const account = validateInstitutionalEmail(auth.session?.user.email)
  const [personal, setPersonal] = useState<PersonalDetails>(() => application?.personal || {
    lastName: '', firstName: '', middleName: '', suffix: '', studentNumber: account.error ? '' : account.value.split('@')[0],
  })
  const [errors, setErrors] = useState<Partial<Record<keyof PersonalDetails, string>>>({})
  const [documentStep, setDocumentStep] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)

  if (auth.session && account.error) return <>
    <header className="applicant-heading"><h1>Use your RTU student account</h1><p>Sign out and choose your institutional Google account.</p></header>
    <div className="notice" role="alert">{account.error}</div>
  </>
  if (application && application.status !== 'rejected') return <Verification preview={preview} auth={auth} registration={state}/>

  function continueRegistration(event: FormEvent) {
    event.preventDefault()
    const result = validatePersonal(personal, account.value)
    setPersonal(result.value)
    setErrors(result.errors)
    if (result.valid) {
      setDocumentStep(true)
      requestAnimationFrame(() => heading.current?.focus())
    } else requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
  }

  return <>
    <header className="applicant-heading"><h1>Complete your student registration</h1><p>Your institutional account and registration details.</p></header>
    <ol className="registration-steps" aria-label="Registration progress">
      <li aria-current={!documentStep ? 'step' : undefined}><span aria-hidden="true">1</span><span>Personal details</span></li>
      <li aria-current={documentStep ? 'step' : undefined}><span aria-hidden="true">2</span><span>Registration form</span></li>
    </ol>
    {application?.status === 'rejected' && <div className="registration-feedback"><strong>Administrator’s reason</strong><p>{application.review_reason}</p></div>}
    <section className="registration-panel">
      <div className="registration-section-heading"><h2 ref={heading} tabIndex={-1}>{documentStep ? 'Registration form' : 'Personal details'}</h2><p>{documentStep ? 'Your registration document must be reviewed before student access is granted.' : 'Use the name printed on your official registration form.'}</p></div>
      {documentStep ? <>
        <div className="registration-feedback" role="status"><strong>New submissions are paused</strong><p>The document submission workflow is being updated. Your entries have not been uploaded or submitted.</p></div>
        <button className="text-button" onClick={() => setDocumentStep(false)}><ArrowLeft className="ui-icon" aria-hidden="true"/>Back to personal details</button>
      </> : <form onSubmit={continueRegistration} noValidate>
        <dl className="registration-identity">
          <div><dt>Google account</dt><dd>{auth.session?.user.email || 'Sign in with your RTU account'}</dd></div>
          <div><dt>Student number</dt><dd id="student-number" className="font-mono">{personal.studentNumber || 'From your RTU email'}</dd></div>
          <div className="registration-program"><dt>Program</dt><dd>{RTU_PROGRAM_NAME} <span className="font-mono">({RTU_PROGRAM_CODE})</span></dd></div>
        </dl>
        <div className="registration-name-grid">{(Object.keys(nameLabels) as (keyof typeof nameLabels)[]).map(key => <label key={key} htmlFor={`student-${key}`}>
          {nameLabels[key]}{(key === 'middleName' || key === 'suffix') && <span className="field-optional">Optional</span>}
          <input id={`student-${key}`} autoComplete={key === 'lastName' ? 'family-name' : key === 'firstName' ? 'given-name' : key === 'middleName' ? 'additional-name' : 'honorific-suffix'} value={personal[key]} required={key === 'lastName' || key === 'firstName'} maxLength={key === 'suffix' ? 20 : 80} placeholder={key === 'suffix' ? 'Jr., III' : undefined} onChange={event => {setPersonal({...personal, [key]: event.target.value}); setErrors({...errors, [key]: undefined})}} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${key}-error` : undefined}/>
          {errors[key] && <span className="field-error" id={`${key}-error`}>{errors[key]}</span>}
        </label>)}</div>
        <div className="registration-actions"><span className="muted">Your entries remain on this page until submission is available.</span><button className="primary-button" type="submit">Continue<ArrowRight className="ui-icon" aria-hidden="true"/></button></div>
      </form>}
      {state.error && !preview && <div className="registration-feedback" role="alert"><p>{state.error}</p><button className="text-button" disabled={state.loading} onClick={state.refresh}>Retry connection</button></div>}
    </section>
    <p className="registration-contact">Need help? <a href="mailto:2024-201182@rtu.edu.ph">Contact ICSphere</a></p>
  </>
}
export function Verification({ preview, auth, registration }: {
    preview: boolean;
    auth?: AuthState;
    registration?: RegistrationState;
}) {
    const local = useRegistrationAccount(auth || { session: null } as AuthState, !registration && !preview);
    const state = registration || local;
    const application = state.data?.application;
    const status = application?.status;
    const copy = { pending: ['Pending administrator review', 'Your application has been submitted.', 'An administrator will review your details and registration form. Student access is locked until approval.'], approved: ['Approved', 'Your student account is approved.', 'You can now access your academic workspace.'], rejected: ['Rejected', 'Your application needs correction.', 'Review the reason below, then update your application and submit a corrected form.'], deactivated: ['Deactivated', 'Your student access is deactivated.', 'Contact ICSphere if you need help with this decision.'] } as const;
    return <><header className="applicant-heading"><h1>Application status</h1><p>Track your registration and administrator decision.</p></header><section className="registration-panel status-summary" aria-busy={state.loading}>
    {state.error ? <><h2>Your status could not be loaded</h2><p role="alert">{state.error}</p></> : state.loading && !state.data ? <><h2>Checking your application…</h2><p role="status">Retrieving your saved registration status.</p></> : application && status ? <><span className={`registration-status registration-status--${status}`}>{copy[status][0]}</span><h2>{copy[status][1]}</h2><p>{copy[status][2]}</p>{application.review_reason && <div className="registration-feedback"><strong>Administrator’s reason</strong><p>{application.review_reason}</p></div>}<dl className="registration-identity"><div><dt>Submitted</dt><dd>{new Date(application.submitted_at).toLocaleString()}</dd></div><div><dt>Student number</dt><dd className="font-mono">{application.personal.studentNumber}</dd></div></dl>{status === 'approved' && <a className="primary-button" href="/dashboard">Open dashboard</a>}{status === 'rejected' && <a className="primary-button" href="/onboarding">Update application</a>}</> : <><span className="status-label">No application submitted</span><h2>Your registration has not been submitted.</h2><p>Your account has no submitted application. New submissions are paused while the document submission workflow is updated.</p><a className="primary-button" href={`${preview ? '/preview' : ''}/onboarding`}>Continue registration</a></>}
    {!preview && <button className="text-button" disabled={state.loading} onClick={state.refresh}><RefreshCw className="ui-icon" aria-hidden="true"/>{state.loading ? 'Refreshing…' : 'Refresh status'}</button>}
    </section><p className="registration-contact">Questions about your application? <a href="mailto:2024-201182@rtu.edu.ph">Contact ICSphere</a></p></>;
}
