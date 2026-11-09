import { validateStudentName, validateStudentNumber } from './registrationValidation.ts';
export type PersonalDetails = {
    lastName: string;
    firstName: string;
    middleName: string;
    suffix: string;
    studentNumber: string;
};
export type Subject = {
    code: string;
    description: string;
    units: string;
    section: string;
    schedule: string;
    classroom: string;
};
export type AcademicDetails = {
    schoolYearSemester: string;
    courseNumber: string;
    section: string;
    totalUnits: string;
    subjects: Subject[];
};
export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'deactivated';
export type Application = {
    id: string;
    status: AccountStatus;
    version: number;
    personal: PersonalDetails;
    academic: AcademicDetails;
    original: Record<string, unknown>;
    submitted_at: string;
    reviewed_at: string | null;
    review_reason: string | null;
    document_path?: string;
};
export type RegistrationAccount = {
    role: 'STUDENT' | 'ADMIN';
    application: Application | null;
};
export function validatePersonal(input: unknown, email: string) {
    const source = input && typeof input === 'object' ? input as Record<string, unknown> : {};
    const errors: Partial<Record<keyof PersonalDetails, string>> = {};
    const value = {} as PersonalDetails;
    for (const key of ['lastName', 'firstName', 'middleName', 'suffix'] as const) {
        const raw = source[key];
        if ((key === 'middleName' || key === 'suffix') && (typeof raw === 'string' && !raw.trim() || raw === undefined)) {
            value[key] = '';
            continue;
        }
        const result = validateStudentName(raw);
        value[key] = result.value;
        if (result.error)
            errors[key] = `Enter a valid ${key === 'lastName' ? 'last name' : key === 'firstName' ? 'first name' : key === 'middleName' ? 'middle name' : 'suffix'}.`;
        if (result.value.length > (key === 'suffix' ? 20 : 80))
            errors[key] = `Use no more than ${key === 'suffix' ? 20 : 80} characters.`;
    }
    const number = validateStudentNumber(source.studentNumber, email);
    value.studentNumber = number.value;
    if (number.error)
        errors.studentNumber = number.error;
    return { value, errors, valid: Object.keys(errors).length === 0 };
}
function text(value: unknown, maximum: number): string {
    // Reject hidden controls instead of silently changing academic evidence.
    // oxlint-disable-next-line no-control-regex
    if (typeof value !== 'string' || value.length > maximum || /[<>\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(value))
        throw new Error('Check the academic fields for unsupported characters or excessive length.');
    return value.normalize('NFC').trim();
}
export function validateAcademic(input: unknown): AcademicDetails {
    if (!input || typeof input !== 'object')
        throw new Error('Review your academic information.');
    const source = input as Record<string, unknown>;
    const schoolYearSemester = text(source.schoolYearSemester, 40);
    if (!schoolYearSemester)
        throw new Error('Enter the school year and semester shown on your form.');
    const totalUnits = text(source.totalUnits, 8);
    if (!/^\d{1,2}(\.\d{1,2})?$/.test(totalUnits) || Number(totalUnits) <= 0 || Number(totalUnits) > 60)
        throw new Error('Total units must be greater than 0 and no more than 60.');
    if (!Array.isArray(source.subjects) || source.subjects.length < 1 || source.subjects.length > 40)
        throw new Error('Include between 1 and 40 enrolled subjects.');
    const subjects = source.subjects.map((row: unknown) => {
        if (!row || typeof row !== 'object')
            throw new Error('Check each subject row.');
        const item = row as Record<string, unknown>;
        const subject: Subject = { code: text(item.code, 40), description: text(item.description, 160), units: text(item.units, 8), section: text(item.section, 40), schedule: text(item.schedule, 200), classroom: text(item.classroom, 80) };
        if (!subject.code || !subject.description || !/^\d{1,2}(\.\d{1,2})?$/.test(subject.units) || Number(subject.units) > 20)
            throw new Error('Each subject needs a code, description, and valid units (0–20).');
        return subject;
    });
    const sum = subjects.reduce((total, row) => total + Number(row.units), 0);
    if (Math.abs(sum - Number(totalUnits)) > 0.01)
        throw new Error('Subject units must add up to the total units on your form.');
    return { schoolYearSemester, totalUnits, courseNumber: text(source.courseNumber, 40), section: text(source.section, 40), subjects };
}
export async function registrationRequest<T>(token: string, action?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
    const timeout = AbortSignal.timeout(65000);
    const response = await fetch('/api/registration', { method: action ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, ...(action ? { 'Content-Type': 'application/json' } : {}) }, body: action ? JSON.stringify(action) : undefined, signal: signal ? AbortSignal.any([signal, timeout]) : timeout, cache: 'no-store' });
    let result: T & {
        error?: string;
    };
    try {
        result = await response.json() as T & {
            error?: string;
        };
        if (!result || typeof result !== 'object')
            throw new Error();
    }
    catch {
        throw new Error('The registration service could not be reached. Please try again.');
    }
    if (!response.ok)
        throw new Error(result.error || 'The request could not be completed. Please try again.');
    return result;
}
