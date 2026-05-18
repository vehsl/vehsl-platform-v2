/* ── Shared Palette & Constants ── */
export const B = {
    900: '#18191A', 800: '#3F3F46', 700: '#52525B', 600: '#71717A',
    500: '#0171E3', 400: '#348DE9', 300: '#67AAEE',
    200: '#99C6F4', 100: '#D4D4D8', 50: '#F4F4F5',
} as const;

export const C = {
    text: B[900], accent: B[500], accentH: B[400],
    surface: 'rgba(255,255,255,0.92)', danger: '#ff3b30',
    success: '#34c759', green: '#34c759',
} as const;

export const W = {
    text: C.text, accent: C.accent, accentSoft: C.accentH,
    danger: C.danger, surface: C.surface,
    surfaceHover: 'rgba(0,0,0,0.04)',
    divider: 'rgba(0,0,0,0.06)', blue: C.accent, green: C.green,
} as const;

export const T = { primary: 'E8', secondary: '99', tertiary: '66', ghost: '1A' } as const;
export const O = { max: T.primary, high: T.primary, solid: 'CC', body: T.secondary, mid: T.tertiary, soft: T.tertiary, faint: '55', ghost: T.ghost, bg3: '0A', bg2: '07', bg1: '04' } as const;
export const FONT = "'Urbanist', sans-serif";
