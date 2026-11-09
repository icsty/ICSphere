import { useCallback, useEffect, useState } from 'react';
import type { AuthState } from './useAuth';
import { registrationRequest, type RegistrationAccount } from '../lib/registration';
export function useRegistrationAccount(auth: AuthState, enabled = true) {
    const token = auth.session?.access_token;
    const [state, setState] = useState<{
        token?: string;
        revision: number;
        data: RegistrationAccount | null;
        error: string;
    }>({ revision: -1, data: null, error: '' });
    const [revision, setRevision] = useState(0);
    const refresh = useCallback(() => setRevision(value => value + 1), []);
    useEffect(() => {
        if (!token || !enabled)
            return;
        const controller = new AbortController();
        registrationRequest<RegistrationAccount>(token, undefined, controller.signal).then(data => { if (!controller.signal.aborted)
            setState({ token, revision, data, error: '' }); }).catch(error => { if (!controller.signal.aborted)
            setState({ token, revision, data: null, error: error instanceof Error ? error.message : 'Your application could not be loaded.' }); });
        return () => controller.abort();
    }, [token, revision, enabled]);
    useEffect(() => {
        if (!token || !enabled)
            return;
        const resume = () => { if (!document.hidden)
            refresh(); };
        document.addEventListener('visibilitychange', resume);
        window.addEventListener('online', resume);
        const interval = window.setInterval(resume, 30000);
        return () => { document.removeEventListener('visibilitychange', resume); window.removeEventListener('online', resume); window.clearInterval(interval); };
    }, [token, enabled, refresh]);
    const current = Boolean(token && state.token === token);
    return { data: current ? state.data : null, error: current ? state.error : '', loading: Boolean(token && enabled && (!current || state.revision !== revision)), refresh };
}
export type RegistrationState = ReturnType<typeof useRegistrationAccount>;
