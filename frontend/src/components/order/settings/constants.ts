/* ── Shared Palette & Constants ── */
export const B = {
    900: '#1d1d1f', 800: '#424245', 700: '#6e6e73', 600: '#86868b',
    500: '#0071e3', 400: '#2997ff', 300: '#67AAEE',
    200: '#99C6F4', 100: '#d2d2d7', 50: '#f5f5f7',
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
