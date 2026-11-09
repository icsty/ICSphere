import type { Application } from '../lib/registration';
import { RTU_PROGRAM_NAME } from '../lib/registrationValidation';

export function ApprovedProfile({application,email}:{application:Application;email?:string}) {
    const {personal,academic}=application;
    return <><header className="page-heading"><h1>My profile</h1><p>Your approved registration details.</p></header><dl className="registration-identity">
      <div><dt>Last name</dt><dd>{personal.lastName}</dd></div><div><dt>First name</dt><dd>{personal.firstName}</dd></div><div><dt>Middle name</dt><dd>{personal.middleName || '—'}</dd></div><div><dt>Suffix</dt><dd>{personal.suffix || '—'}</dd></div>
      <div><dt>Google account</dt><dd>{email}</dd></div><div><dt>Student number</dt><dd className="font-mono">{personal.studentNumber}</dd></div><div><dt>Program</dt><dd>{RTU_PROGRAM_NAME}</dd></div><div><dt>School year / semester</dt><dd>{academic.schoolYearSemester}</dd></div><div><dt>Block / section</dt><dd>{academic.section || '—'}</dd></div>
    </dl><a className="text-link" href="/verification">View application status</a></>;
}
export function ApprovedSchedule({ application, dashboard }: {
    application: Application;
    dashboard: boolean;
}) {
    const { academic } = application;
    return <><header className="page-heading"><h1>{dashboard ? 'Your academic schedule' : 'My schedule'}</h1><p>{academic.schoolYearSemester}{academic.section ? ` · ${academic.section}` : ''} · {academic.totalUnits} units</p></header>
    <p className="muted">From your approved registration. Schedule and classroom values are shown as submitted.</p>
    <div className="table-scroll"><table><caption className="sr-only">Approved enrolled subjects</caption><thead><tr><th scope="col">Subject</th><th scope="col">Units</th><th scope="col">Section</th><th scope="col">Schedule</th><th scope="col">Classroom</th></tr></thead><tbody>{academic.subjects.map((subject, index) => <tr key={index}><th scope="row"><span className="font-mono">{subject.code}</span><br />{subject.description}</th><td>{subject.units}</td><td>{subject.section || '—'}</td><td>{subject.schedule || '—'}</td><td>{subject.classroom || '—'}</td></tr>)}</tbody></table></div>
  </>;
}
