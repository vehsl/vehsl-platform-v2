export function getApiBase() {
    const fromEnv = (process.env.NEXT_PUBLIC_API_URL || '').trim();
    const fromServerEnv = (process.env.NEXT_SERVER_API_URL || '').trim();
    const normalize = (u: string) => u.replace(/\/$/, '');

    if (typeof window === 'undefined') {
        if (fromServerEnv && /^https?:\/\//.test(fromServerEnv)) {
            return normalize(fromServerEnv);
        }
        if (fromEnv && /^https?:\/\//.test(fromEnv)) {
            return normalize(fromEnv);
        }
        return 'http://localhost:8000';
    }
    
    // If NEXT_PUBLIC_API_URL is set and not pointing to internal docker network
    if (fromEnv && /^https?:\/\//.test(fromEnv) && !/\/\/backend(?=[:/]|$)/.test(fromEnv)) {
        return normalize(fromEnv);
    }
    
    // Fallback to browser location
    if (typeof window !== 'undefined') {
        const host = (window.location.hostname === '0.0.0.0' || window.location.hostname === '') 
            ? 'localhost' 
            : window.location.hostname;
        return normalize(`${window.location.protocol}//${host}:8000`);
    }
    
    return 'http://localhost:8000';
}

function readAuthTokens() {
    try {
        return {
            access: window.localStorage.getItem('vehsl.access') || '',
            refresh: window.localStorage.getItem('vehsl.refresh') || '',
        };
    } catch {
        return { access: '', refresh: '' };
    }
}

function writeAccessToken(access: string) {
    try {
        if (!access) return;
        window.localStorage.setItem('vehsl.access', access);
    } catch {}
}

function clearAuthTokens() {
    try {
        window.localStorage.removeItem('vehsl.access');
        window.localStorage.removeItem('vehsl.refresh');
        window.localStorage.removeItem('vehsl.user');
    } catch {}
}

async function refreshAccessToken(base: string, refresh: string) {
    if (!refresh) return '';
    try {
        const res = await fetch(`${base}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
        });
        const data = await res.json().catch(() => null);
        const nextAccess = (data?.access || '').toString();
        if (!res.ok || !nextAccess) return '';
        writeAccessToken(nextAccess);
        return nextAccess;
    } catch {
        return '';
    }
}

export async function authedFetch(input: RequestInfo | URL, init?: RequestInit) {
    const base = getApiBase();
    const url = typeof input === 'string' && !input.toString().startsWith('http') ? `${base}${input}` : input;

    const doFetch = (access: string) => {
        const headers = new Headers(init?.headers || undefined);
        if (access) headers.set('Authorization', `Bearer ${access}`);
        const body = init?.body as any;
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        if (!isFormData && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }
        return fetch(url, { ...init, headers });
    };

    const { access, refresh } = typeof window !== 'undefined' ? readAuthTokens() : { access: '', refresh: '' };
    let res = await doFetch(access);
    if (res.status !== 401) return res;

    const nextAccess = typeof window !== 'undefined' ? await refreshAccessToken(base, refresh) : '';
    if (!nextAccess) {
        if (typeof window !== 'undefined') {
            clearAuthTokens();
            try {
                window.location.assign('/?signin=1');
            } catch {}
        }
        return res;
    }

    res = await doFetch(nextAccess);
    return res;
}

export async function fetchJsonAuthed(path: string, init?: RequestInit) {
    const res = await authedFetch(path, init);
    if (res.status === 401) {
        if (typeof window !== 'undefined') {
            try {
                window.location.assign('/?signin=1');
            } catch {}
        }
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const isJson = ct.includes('application/json');
    const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);
    if (!res.ok) {
        const pickMsg = (x: any): string => {
            if (!x) return '';
            if (typeof x === 'string') return x;
            if (typeof x?.detail === 'string') return x.detail;
            if (typeof x?.error === 'string') return x.error;
            if (typeof x === 'object') {
                for (const k of Object.keys(x)) {
                    const v = (x as any)[k];
                    if (typeof v === 'string' && v.trim()) return v;
                    if (Array.isArray(v) && v.length && typeof v[0] === 'string') return v[0];
                }
            }
            return '';
        };
        const raw = pickMsg(data) || '';
        const looksLikeHtml =
            typeof raw === 'string' &&
            (raw.trim().toLowerCase().startsWith('<!doctype') || raw.trim().toLowerCase().startsWith('<html'));
        const msg = !raw || looksLikeHtml ? `Request failed (${res.status})` : raw;
        throw new Error(msg);
    }
    return data;
}
