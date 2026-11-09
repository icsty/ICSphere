import type { IncomingMessage, ServerResponse } from 'node:http';
import { createClient } from '@supabase/supabase-js';
import { validateInstitutionalEmail } from '../src/lib/registrationValidation.ts';
export const config = { maxDuration: 60 };
export type RegistrationRequest = IncomingMessage & {
    body?: unknown;
};
const projectUrl = 'https://crzgazzspwarsbjvtfsl.supabase.co';
const bucket = 'registration-documents';
class RequestError extends Error {
    status: number;
    constructor(status: number, message: string) { super(message); this.status = status; }
}
async function body(request: RegistrationRequest): Promise<Record<string, unknown>> {
    if (Number(request.headers['content-length']) > 4300000)
        throw new RequestError(413, 'Choose a document up to 3 MB.');
    let value = request.body;
    if (value === undefined) {
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of request) {
            size += Buffer.byteLength(chunk);
            if (size > 4300000)
                throw new RequestError(413, 'Choose a document up to 3 MB.');
            chunks.push(Buffer.from(chunk));
        }
        value = Buffer.concat(chunks).toString('utf8');
    }
    if (typeof value === 'string') {
        try {
            value = JSON.parse(value);
        }
        catch {
            throw new RequestError(400, 'Invalid request.');
        }
    }
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new RequestError(400, 'Invalid request.');
    return value as Record<string, unknown>;
}
export default async function handler(request: RegistrationRequest, response: ServerResponse) {
    response.setHeader('Cache-Control', 'no-store, private');
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status: number, result: unknown) => { response.statusCode = status; response.end(JSON.stringify(result)); };
    try {
        if (!['GET', 'POST'].includes(request.method || '')) {
            response.setHeader('Allow', 'GET, POST');
            throw new RequestError(405, 'Method not allowed.');
        }
        const authorization = request.headers.authorization;
        if (!authorization?.startsWith('Bearer ') || authorization.length > 8192)
            throw new RequestError(401, 'Sign in with your RTU account to continue.');
        const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (process.env.SUPABASE_URL !== projectUrl || !secret)
            throw new RequestError(503, 'Registration is temporarily unavailable. Please try again later.');
        const database = createClient(projectUrl, secret, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(12000) }) } });
        const { data: identity, error: authError } = await database.auth.getUser(authorization.slice(7));
        if (authError || !identity.user?.email || !identity.user.email_confirmed_at)
            throw new RequestError(401, 'Your session could not be verified. Sign in again.');
        const user = identity.user;
        const email = user.email!;
        const { data: account, error: accountError } = await database.from('users').select('id,role,status').eq('auth_user_id', user.id).maybeSingle();
        if (accountError)
            throw new RequestError(503, 'Your account status could not be checked. Please try again.');
        const admin = account?.role === 'ADMIN' && account.status === 'ACTIVE';
        if (!admin && (validateInstitutionalEmail(email).error || !user.identities?.some(item => item.provider === 'google')))
            throw new RequestError(403, 'Use your official RTU student Google account to register.');
        if (request.method === 'GET') {
            const application = await database.from('registration_applications').select('id,status,version,personal,academic,original,submitted_at,reviewed_at,review_reason').eq('auth_user_id', user.id).maybeSingle();
            if (application.error) throw new RequestError(503, 'Registration could not be loaded. Please try again later.');
            const result = application.data;
            if (result?.status === 'approved' && account?.status !== 'ACTIVE') result.status = 'deactivated';
            return send(200, { role: admin ? 'ADMIN' : 'STUDENT', application: result });
        }
        if (!/^application\/json(?:;|$)/i.test(request.headers['content-type'] || ''))
            throw new RequestError(415, 'Send a JSON request.');
        const input = await body(request);
        if (input.action === 'screen' || input.action === 'submit') {
            throw new RequestError(409, 'New registration submissions are paused while document processing is updated. Existing applications can still be reviewed.');
        }
        if (['queue', 'detail', 'review'].includes(String(input.action))) {
            if (!admin || !account)
                throw new RequestError(403, 'Administrator access is required.');
            if (input.action === 'queue') {
                if (!['pending', 'approved', 'rejected', 'deactivated'].includes(String(input.status)) || !Number.isInteger(input.offset) || Number(input.offset) < 0 || Number(input.offset) > 100000)
                    throw new RequestError(400, 'Choose a valid application page.');
                const offset = Number(input.offset);
                const result = await database.from('registration_applications').select('id,status,version,personal,submitted_at,reviewed_at,review_reason').eq('status', input.status).order('submitted_at', { ascending: true }).order('id').range(offset, offset + 50);
                if (result.error)
                    throw new RequestError(503, 'Applications could not be loaded.');
                return send(200, { applications: result.data.slice(0, 50), more: result.data.length > 50 });
            }
            if (typeof input.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(input.id))
                throw new RequestError(400, 'Choose a valid application.');
            if (input.action === 'detail') {
                const result = await database.from('registration_applications').select('*').eq('id', input.id).single();
                if (result.error)
                    throw new RequestError(404, 'Application not found.');
                const document = await database.storage.from(bucket).createSignedUrl(result.data.document_path, 120);
                if (document.error)
                    throw new RequestError(503, 'The registration document could not be opened.');
                return send(200, { application: result.data, documentUrl: document.data.signedUrl });
            }
            if (!['approved', 'rejected', 'deactivated'].includes(String(input.decision)) || !Number.isInteger(input.version))
                throw new RequestError(400, 'Choose a valid review decision.');
            const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
            // oxlint-disable-next-line no-control-regex -- Reject hidden control characters in review text.
            if (reason.length > 1000 || /[<>\u0000-\u001f]/u.test(reason) || (input.decision !== 'approved' && reason.length < 5))
                throw new RequestError(400, 'Provide a clear reason (5–1000 characters) for rejection or deactivation.');
            if (input.decision === 'approved') {
                const application = await database.from('registration_applications').select('document_path').eq('id', input.id).single();
                if (application.error)
                    throw new RequestError(404, 'Application not found.');
                const document = await database.storage.from(bucket).download(application.data.document_path);
                if (document.error || !document.data?.size)
                    throw new RequestError(503, 'Approval requires an accessible original registration document.');
            }
            const result = await database.rpc('registration_review', { p_admin: user.id, p_id: input.id, p_version: input.version, p_decision: input.decision, p_reason: reason || null });
            if (result.error)
                throw new RequestError(409, 'The application changed or cannot receive this decision. Reload it before reviewing again.');
            return send(200, { application: result.data });
        }
        throw new RequestError(400, 'Unknown registration action.');
    }
    catch (error) {
        if (error instanceof RequestError)
            return send(error.status, { error: error.message });
        return send(503, { error: 'Registration could not be completed. Please try again. Your access has not changed.' });
    }
}
