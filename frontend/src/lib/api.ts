export function getApiBase() {
    const fromEnv = (process.env.NEXT_PUBLIC_API_URL || '').trim();
    const normalize = (u: string) => u.replace(/\/$/, '');
    
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
