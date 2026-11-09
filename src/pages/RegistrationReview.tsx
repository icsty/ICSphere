import { useEffect, useState } from 'react';
import type { AuthState } from '../hooks/useAuth';
import { registrationRequest, type Application, type AccountStatus } from '../lib/registration';
export default function RegistrationReview({ auth }: {
    auth: AuthState;
}) {
    const token = auth.session?.access_token || '';
    const [status, setStatus] = useState<AccountStatus>('pending');
    const [applications, setApplications] = useState<Application[]>([]);
    const [selected, setSelected] = useState<Application | null>(null);
    const [documentUrl, setDocumentUrl] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [revision, setRevision] = useState(0);
    const [offset, setOffset] = useState(0);
    const [more, setMore] = useState(false);
    /* oxlint-disable react/set-state-in-effect -- Synchronize selection and loading with a new server queue query. */
    useEffect(() => {
        // Synchronize loading/selection with a new remote queue query.
        const controller = new AbortController();
        setBusy(true);
        setError('');
        setApplications([]);
        setSelected(null);
        setDocumentUrl('');
        registrationRequest<{
            applications: Application[];
            more: boolean;
        }>(token, { action: 'queue', status, offset }, controller.signal).then(result => { setApplications(result.applications); setMore(result.more); }).catch(failure => { if (!controller.signal.aborted)
            setError(failure instanceof Error ? failure.message : 'Applications could not be loaded.'); }).finally(() => { if (!controller.signal.aborted)
            setBusy(false); });
        return () => controller.abort();
    }, [token, status, offset, revision]);
    /* oxlint-enable react/set-state-in-effect */
    async function open(id: string) { setBusy(true); setError(''); setSelected(null); setDocumentUrl(''); setReason(''); try {
        const result = await registrationRequest<{
            application: Application;
            documentUrl: string;
        }>(token, { action: 'detail', id });
        setSelected(result.application);
        setDocumentUrl(result.documentUrl);
    }
    catch (failure) {
        setError(failure instanceof Error ? failure.message : 'Application could not be opened.');
    }
    finally {
        setBusy(false);
    } }
    async function review(decision: 'approved' | 'rejected' | 'deactivated') {
        if (!selected || busy)
            return;
        if (decision !== 'approved' && reason.trim().length < 5) {
            setError('Provide a clear reason for this decision.');
            return;
        }
        setBusy(true);
        setError('');
        try {
            await registrationRequest(token, { action: 'review', id: selected.id, version: selected.version, decision, reason });
            setSelected(null);
            setDocumentUrl('');
            setRevision(value => value + 1);
        }
        catch (failure) {
            setError(failure instanceof Error ? failure.message : 'The decision could not be saved.');
        }
        finally {
            setBusy(false);
        }
    }
    return <><header className="applicant-heading"><h1>Review student applications</h1><p>Compare the original form with the submitted details before deciding.</p></header>
    <div className="registration-review-toolbar"><label>Application status<select value={status} disabled={busy} onChange={event => { setStatus(event.target.value as AccountStatus); setOffset(0); }}>{(['pending', 'approved', 'rejected', 'deactivated'] as const).map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label><button className="secondary-button" disabled={busy} onClick={() => setRevision(value => value + 1)}>Refresh applications</button></div>
    {error && <p role="alert" className="registration-feedback">{error}</p>}{busy && <p role="status">Loading…</p>}
    <ul className="registration-review-list">{applications.map(application => <li key={application.id}><div><strong>{application.personal.lastName}, {application.personal.firstName}</strong><p className="font-mono">{application.personal.studentNumber}</p><span className="muted">Submitted {new Date(application.submitted_at).toLocaleString()}</span></div><button className="secondary-button" disabled={busy} onClick={() => void open(application.id)}>Review application</button></li>)}</ul>
    {!busy && !error && applications.length === 0 && <p>No {status} applications.</p>}
    <div className="registration-actions"><button className="text-button" disabled={busy || offset === 0} onClick={() => setOffset(value => Math.max(0, value - 50))}>Previous page</button><button className="text-button" disabled={busy || !more} onClick={() => setOffset(value => value + 50)}>Next page</button></div>
    {selected && <section className="registration-panel" aria-labelledby="review-heading"><h2 id="review-heading">{selected.personal.lastName}, {selected.personal.firstName} {selected.personal.middleName} {selected.personal.suffix}</h2><p className="font-mono">{selected.personal.studentNumber}</p><p>Status: {selected.status}</p><a className="secondary-button" href={documentUrl} target="_blank" rel="noopener noreferrer">Open original registration form</a><p className="muted">Document links expire after two minutes. Reopen this application to refresh the link.</p>
      <h3>Submitted academic details</h3><p>{selected.academic.schoolYearSemester} · {selected.academic.section} · {selected.academic.totalUnits} units</p><div className="table-scroll"><table><thead><tr><th>Subject</th><th>Units</th><th>Section</th><th>Schedule</th><th>Classroom</th></tr></thead><tbody>{selected.academic.subjects.map((subject, index) => <tr key={index}><th scope="row">{subject.code}<br />{subject.description}</th><td>{subject.units}</td><td>{subject.section}</td><td>{subject.schedule}</td><td>{subject.classroom}</td></tr>)}</tbody></table></div>
      <details className="registration-original"><summary>Original submitted document data</summary><pre>{JSON.stringify(selected.original, null, 2)}</pre></details>
      {(selected.status === 'pending' || selected.status === 'approved') && <><label className="registration-reason">Decision reason{selected.status === 'pending' && <span className="muted">Required when rejecting</span>}<textarea rows={3} value={reason} maxLength={1000} disabled={busy} onChange={event => setReason(event.target.value)}/></label><div className="registration-actions">{selected.status === 'pending' ? <><button className="secondary-button" disabled={busy} onClick={() => void review('rejected')}>Reject application</button><button className="primary-button" disabled={busy} onClick={() => void review('approved')}>Approve student account</button></> : <button className="secondary-button" disabled={busy} onClick={() => void review('deactivated')}>Deactivate student account</button>}</div></>}
      {selected.review_reason && <p>Decision reason: {selected.review_reason}</p>}
    </section>}
  </>;
}
