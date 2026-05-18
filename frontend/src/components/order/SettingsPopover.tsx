// @ts-nocheck -- legacy port; tighten incrementally
"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import svgPaths from './imports/svg-dpw9w9ae05';
import { HelpTab } from './settings/HelpTab';
import { SellerBusinessTab } from './settings/SellerBusinessTab';
import { SellerSecurityTab } from './settings/SellerSecurityTab';
import { SellerHelpTab } from './settings/SellerHelpTab';
import { SellerFulfillmentTab } from './settings/SellerFulfillmentTab';
import { SellerAlertsTab } from './settings/SellerAlertsTab';
import { getPinInputStyle, getAmbientPoolStyle, getInputHaloStyle } from './settings/pinInputStyles';
import { useRole } from './RoleContext';
import {
    Bell, Moon, Sun, Globe, Shield, Lock,
    ChevronRight, CreditCard,
    TrendingDown, Archive, Monitor, HelpCircle, MessageCircle,
    X, Volume2, Mail, Smartphone, Clock,
    Truck, FileText, User, Building2, Upload, CheckCircle2,
    AlertCircle, Briefcase, Hash, MapPin, UserCheck, Files,
    Wallet, Languages, MailCheck, MailX, Plus, Check, ChevronDown,
    Pencil, Trash2, Home, Package, Ship, Warehouse,
    UserPlus, Phone, AlertTriangle, DollarSign, Receipt,
    Share2, BellOff, Calendar, MessageSquare, Thermometer,
    Key, Fingerprint, QrCode, Copy, ShieldCheck,
    ExternalLink, Laptop, Eye, Printer, Wifi, Tablet,
    Factory, Gauge, ClipboardCheck, Timer, Boxes, BadgeCheck,
    TrendingUp, BarChart3, Zap, Settings, Tag, RotateCcw,
    ShieldAlert, Layers, CircleDollarSign
} from 'lucide-react';

/* ── Palette ── */
const B = {
    900: '#1d1d1f', 800: '#424245', 700: '#6e6e73', 600: '#86868b',
    500: '#0071e3', 400: '#2997ff', 300: '#67AAEE',
    200: '#99C6F4', 100: '#d2d2d7', 50: '#f5f5f7',
};
const C = {
    text: B[900], accent: B[500], accentH: B[400],
    surface: 'rgba(255,255,255,0.92)', danger: '#ff3b30',
    success: '#34c759', green: '#34c759',
};
const W = {
    text: C.text, accent: C.accent, accentSoft: C.accentH,
    danger: C.danger, surface: C.surface,
    surfaceHover: 'rgba(0,0,0,0.04)',
    divider: 'rgba(0,0,0,0.06)', blue: C.accent, green: C.green,
};
const T = { primary: 'E8', secondary: '99', tertiary: '66', ghost: '1A' };
const O = { max: T.primary, high: T.primary, solid: 'CC', body: T.secondary, mid: T.tertiary, soft: T.tertiary, faint: '55', ghost: T.ghost, bg3: '0A', bg2: '07', bg1: '04' };
const FONT = "'Urbanist', sans-serif";

function readVehslUser() {
    try {
        const raw = window.localStorage.getItem('vehsl.user');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function apiBase() {
    const fromEnv = (process.env.NEXT_PUBLIC_API_URL || '').trim();
    const normalize = (u: string) => u.replace(/\/$/, '');
    if (fromEnv && /^https?:\/\//.test(fromEnv) && !/\/\/backend(?=[:/]|$)/.test(fromEnv)) return normalize(fromEnv);
    return normalize(`${window.location.protocol}//${window.location.hostname}:8000`);
}

function readAuthTokens() {
    try {
        const access = window.localStorage.getItem('vehsl.access') || '';
        const refresh = window.localStorage.getItem('vehsl.refresh') || '';
        return { access, refresh };
    } catch {
        return { access: '', refresh: '' };
    }
}

function getUserDisplay(user: any) {
    const first = (user?.first_name || '').toString().trim();
    const last = (user?.last_name || '').toString().trim();
    const full = `${first} ${last}`.trim();
    const secondary = ((user?.email || user?.phone) || '').toString().trim();
    const name = full || secondary || 'Account';
    const shownSecondary = full ? secondary : '';
    const initialFrom = (full || secondary || 'A').trim();
    const initial = (initialFrom[0] || 'A').toUpperCase();
    const accountType = (user?.account_type || '').toString().trim().toLowerCase();
    return { name, secondary: shownSecondary, initial, accountType };
}

function buildHistoryGroups(notifications: any[]) {
    const now = Date.now();
    const buckets: Record<string, any[]> = { Today: [], Yesterday: [], 'Last week': [], Earlier: [] };
    for (const n of notifications || []) {
        const createdAt = n?.created_at ? new Date(n.created_at).getTime() : 0;
        const days = createdAt ? (now - createdAt) / 86400000 : 999;
        const period = days < 1 ? 'Today' : days < 2 ? 'Yesterday' : days < 7 ? 'Last week' : 'Earlier';
        const eventType = ((n?.event_type || '') as string).toLowerCase();
        const payload = (n?.payload && typeof n.payload === 'object') ? n.payload : {};
        const sentence = (payload.title || payload.headline || payload.body || payload.detail || '').toString().trim()
            || (n?.event_type || '').toString().replace(/[_-]+/g, ' ').trim()
            || 'Update';
        const moment = (payload.moment || payload.meta || '').toString().trim()
            || (createdAt ? new Date(createdAt).toLocaleString() : '');

        let kind: 'shipping' | 'message' | 'deal' = 'deal';
        let tint = '#ff9500';
        let icon = '✨';
        if (eventType.includes('order') || eventType.includes('shipment')) {
            kind = 'shipping';
            tint = '#34c759';
            icon = '📦';
        } else if (eventType.includes('message') || eventType.includes('chat')) {
            kind = 'message';
            tint = '#0071e3';
            icon = '💬';
        }

        buckets[period].push({ id: `n-${n?.id || sentence}`, rawId: n?.id, kind, sentence, moment, tint, icon });
    }

    const out: any[] = [];
    for (const key of ['Today', 'Yesterday', 'Last week', 'Earlier']) {
        if (buckets[key].length) out.push({ period: key, items: buckets[key] });
    }
    return out;
}

/* ── Figma SVG icons ── */
function IconOrders({ color = '#494B4D', size = 18 }: { color?: string; size?: number }) {
    return (<svg width={size} height={size} viewBox="0 0 18.9 17.4" fill="none" className="flex-shrink-0"><path d={svgPaths.p36665644} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" /><path d={svgPaths.p38e07a60} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.58" /><path d={svgPaths.p2a9763d8} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.58" /><path d={svgPaths.p3d94c100} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.58" /></svg>);
}
function IconWishlist({ color = '#494B4D', size = 17 }: { color?: string; size?: number }) {
    return (<svg width={size} height={size * 0.88} viewBox="0 0 17.2 15.1" fill="none" className="flex-shrink-0"><path d={svgPaths.p33df99f0} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" /></svg>);
}
function IconSeller({ color = '#494B4D', size = 18 }: { color?: string; size?: number }) {
    return (<svg width={size} height={size} viewBox="0 0 17.8 17.4" fill="none" className="flex-shrink-0"><path d={svgPaths.p36665644} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" /><path d={svgPaths.p39c58b00} fill={color} /></svg>);
}
function IconMessages({ color = '#494B4D', size = 16 }: { color?: string; size?: number }) {
    return (<svg width={size} height={size * 0.7} viewBox="0 0 16 11.24" fill="none" className="flex-shrink-0"><path d={svgPaths.p240127f2} fill={color} /><path d={svgPaths.p14df4530} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" /></svg>);
}
function IconSettings({ color = '#494B4D', size = 17 }: { color?: string; size?: number }) {
    return (<svg width={size} height={size} viewBox="0 0 17.2 17.2" fill="none" className="flex-shrink-0"><path d={svgPaths.p31b65f70} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" /><path d={svgPaths.pec1d600} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" /></svg>);
}
function IconHelp({ color = '#494B4D', size = 17 }: { color?: string; size?: number }) {
    return (<svg width={size} height={size} viewBox="0 0 17.2 17.2" fill="none" className="flex-shrink-0"><path d={svgPaths.p31bbb900} stroke={color} strokeMiterlimit="10" strokeWidth="1.2" /><path d={svgPaths.p256fcc00} stroke={color} strokeMiterlimit="10" strokeWidth="1.2" /><path d={svgPaths.p7221900} fill={color} /><path d={svgPaths.p890ac00} stroke={color} strokeMiterlimit="10" strokeWidth="1.2" /><circle cx="8.6" cy="8.47" fill={color} r="0.645" /><circle cx="10.92" cy="8.47" fill={color} r="0.645" /><path d={svgPaths.p3cf1e180} stroke={color} strokeMiterlimit="10" strokeWidth="1.2" /><circle cx="6.41" cy="8.47" fill={color} r="0.645" /></svg>);
}
function IconLogout({ color = '#ff3b30', size = 14 }: { color?: string; size?: number }) {
    return (<svg width={size} height={size * 1.25} viewBox="0 0 14.45 18" fill="none" className="flex-shrink-0"><path d={svgPaths.p1662ea00} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" /><path d={svgPaths.p1e9ae80} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" /></svg>);
}

/* ── Glass ── */
function Glass({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`backdrop-blur-2xl border border-black/[0.04] ${className}`}
            style={{
                boxShadow: `
                    0 0 0 0.5px rgba(0,0,0,0.03),
                    0 2px 4px rgba(0,0,0,0.02),
                    0 12px 32px -8px rgba(0,0,0,0.08),
                    0 40px 80px -24px rgba(0,0,0,0.12)
                `,
            }}>
            {children}
        </div>
    );
}

/* Toggle — iOS 26 squircle style, matched to Figma */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button role="switch" aria-checked={checked}
            onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
            className="w-[51px] h-[31px] relative flex-shrink-0 transition-all duration-300"
            style={{
                borderRadius: 100,
                backgroundColor: checked ? C.success : 'rgba(60,60,67,0.3)',
                boxShadow: checked
                    ? 'inset 0 0 0 0.5px rgba(0,0,0,0.04), inset 0 1px 4px rgba(0,0,0,0.06)'
                    : 'inset 0 0 0 0.5px rgba(0,0,0,0.06), inset 0 2px 4px rgba(0,0,0,0.06)',
            }}>
            <motion.div
                layout
                transition={{ type: 'spring', stiffness: 440, damping: 28, mass: 0.85 }}
                className="absolute top-[2px] w-[27px] h-[27px]"
                style={{
                    borderRadius: 100,
                    left: checked ? 22 : 2,
                    background: 'linear-gradient(180deg, #fff 0%, #f5f5f7 100%)',
                    boxShadow: `
                        0 0 0 0.5px rgba(0,0,0,0.04),
                        0 3px 8px rgba(0,0,0,0.12),
                        0 1px 2px rgba(0,0,0,0.08),
                        0 6px 16px -4px rgba(0,0,0,0.06)
                    `,
                }} />
        </button>
    );
}


/* ══════════════════════════════════════════
   BOUNCE CASCADE — popover only
   ══════════════════════════════════════════ */
function triggerCascade(
    containerRef: React.RefObject<HTMLElement | null>,
    clickedIndex: number,
    momentum: number,
) {
    const container = containerRef.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    const amp = 0.4 + momentum * 0.6;
    children.forEach((child, i) => {
        const distance = Math.abs(i - clickedIndex);
        if (distance === 0) return;
        const falloff = Math.max(0, 1 - distance * 0.3);
        if (falloff <= 0) return;
        const pushY = 2.5 * amp * falloff;
        child.animate([
            { transform: 'translateY(0) scale(1)', offset: 0 },
            { transform: `translateY(${i < clickedIndex ? -pushY : pushY}px) scale(${1 - 0.008 * amp * falloff})`, offset: 0.25 },
            { transform: `translateY(${(i < clickedIndex ? pushY : -pushY) * 0.15}px) scale(${1 + 0.003 * amp * falloff})`, offset: 0.6 },
            { transform: 'translateY(0) scale(1)', offset: 1 },
        ], { duration: 350 + momentum * 80, delay: distance * 35, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
    });
}


/* ══════════════════════════════════════════
   POPOVER
   ══════════════════════════════════════════ */
/* ── Notifications — each one a moment of care ── */
type NotifType = {
    id: string; kind: 'shipping' | 'message' | 'deal';
    headline: string; detail: string; meta: string;
    tint: string; action: string;
    progress?: number; stages?: string[];
    personInitial?: string; personColor?: string;
    savings?: string;
};
const NOTIFICATIONS: NotifType[] = [
    {
        id: 'n1', kind: 'shipping',
        headline: 'On its way to you',
        detail: 'Arriving Thursday',
        meta: 'Just now',
        tint: '#34c759',
        action: 'orders',
        progress: 0.72,
        stages: ['Packed', 'Shipped', 'Delivered'],
    },
    {
        id: 'n2', kind: 'message',
        headline: 'Priya replied to you',
        detail: 'About your delivery',
        meta: '2h',
        tint: '#0071e3',
        action: 'messages',
        personInitial: 'P',
        personColor: '#0071e3',
    },
    {
        id: 'n3', kind: 'deal',
        headline: 'Merino Crew Neck',
        detail: 'Price dropped on your wishlist',
        meta: 'Today',
        tint: '#ff9500',
        action: 'wishlist',
        savings: '$24',
    },
];

const SELLER_NOTIFICATIONS: NotifType[] = [
    {
        id: 'sn1', kind: 'shipping',
        headline: 'Inspector visit scheduled',
        detail: 'Tomorrow at 9:00 AM',
        meta: '2h ago',
        tint: '#0071e3',
        action: 'orders',
        progress: 1,
        stages: ['Scheduled', 'Arriving', 'Complete'],
    },
    {
        id: 'sn2', kind: 'deal',
        headline: 'Payment deposited',
        detail: 'Order #7RKT441P cleared',
        meta: '5h ago',
        tint: '#34c759',
        action: 'orders',
        savings: '$12,912',
    },
    {
        id: 'sn3', kind: 'message',
        headline: 'Export certificate expiring',
        detail: 'Ceramic Vase HS 6913.10',
        meta: '3d ago',
        tint: '#ff9500',
        action: 'settings',
        personInitial: '!',
        personColor: '#ff9500',
    },
];

const NOTIF_HISTORY_GROUPS = [
    {
        period: 'Yesterday',
        items: [
            { id: 'h1', kind: 'shipping' as const, sentence: 'Your wool cardigan arrived safely', moment: 'Left at front door · 4:12pm', tint: '#34c759', icon: '📦' },
        ],
    },
    {
        period: 'A few days ago',
        items: [
            { id: 'h2', kind: 'deal' as const, sentence: 'You saved $18 on the linen shirt', moment: 'Flash sale · applied automatically', tint: '#ff9500', icon: '✨' },
            { id: 'h3', kind: 'message' as const, sentence: 'Support approved return #4082', moment: 'Refund processed · 2 business days', tint: '#0071e3', icon: '💬' },
        ],
    },
    {
        period: 'Last week',
        items: [
            { id: 'h4', kind: 'shipping' as const, sentence: 'Canvas tote picked up by USPS', moment: 'Tracking confirmed', tint: '#34c759', icon: '📦' },
            { id: 'h5', kind: 'deal' as const, sentence: '15% weekend deal applied at checkout', moment: 'Saved $12.50', tint: '#ff9500', icon: '✨' },
        ],
    },
    {
        period: 'Earlier',
        items: [
            { id: 'h6', kind: 'message' as const, sentence: 'Your 5-star review is live', moment: 'Merino Crew Neck · helping others decide', tint: '#0071e3', icon: '💬' },
            { id: 'h7', kind: 'shipping' as const, sentence: 'Silk scarf signed and delivered', moment: 'Signed by Noah W.', tint: '#34c759', icon: '📦' },
        ],
    },
];

const SELLER_HISTORY_GROUPS = [
    {
        period: 'Yesterday',
        items: [
            { id: 'sh1', kind: 'deal' as const, sentence: 'Payment of $6,456 cleared', moment: 'Order #4KNW280R · deposited to account', tint: '#34c759', icon: '💰' },
        ],
    },
    {
        period: 'A few days ago',
        items: [
            { id: 'sh2', kind: 'shipping' as const, sentence: 'Listing approved: Laptop Stand', moment: 'Now live on marketplace', tint: '#34c759', icon: '✅' },
            { id: 'sh3', kind: 'shipping' as const, sentence: 'Order #2VNR883K shipped', moment: '300 units · Berlin, DE', tint: '#0071e3', icon: '🚢' },
        ],
    },
    {
        period: 'Last week',
        items: [
            { id: 'sh4', kind: 'message' as const, sentence: 'Inspector passed warehouse audit', moment: 'All items compliant · no issues', tint: '#34c759', icon: '🕵️' },
            { id: 'sh5', kind: 'deal' as const, sentence: 'Payment of $4,320 deposited', moment: 'Order #1MXQ992 · 48x USB C Wire', tint: '#34c759', icon: '💰' },
        ],
    },
    {
        period: 'Earlier',
        items: [
            { id: 'sh6', kind: 'message' as const, sentence: 'Buyer left 5-star review', moment: 'Wireless NC Headphones · "Excellent quality"', tint: '#ff9500', icon: '⭐' },
            { id: 'sh7', kind: 'shipping' as const, sentence: 'Sample approved by Ahmed Khan', moment: 'USB C Wire — Green · production started', tint: '#0071e3', icon: '📋' },
        ],
    },
];

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
}

const MENU_ITEMS = [
    { key: 'orders', label: 'My orders', icon: IconOrders, action: 'navigate', badge: 0 },
    { key: 'wishlist', label: 'Wishlist', icon: IconWishlist, action: 'navigate', badge: 0 },
    { key: 'seller', label: 'Become seller', icon: IconSeller, action: 'navigate', badge: 0 },
    { key: 'messages', label: 'Messages', icon: IconMessages, action: 'navigate', badge: 2 },
    { key: 'settings', label: 'Settings', icon: IconSettings, action: 'settings', badge: 0 },
    { key: 'help', label: 'Help', icon: IconHelp, action: 'navigate', badge: 0 },
] as const;

function MenuItem({
    item, index, momentum, onPress, containerRef,
}: {
    item: typeof MENU_ITEMS[number]; index: number; momentum: number;
    onPress: () => void; containerRef: React.RefObject<HTMLElement | null>;
}) {
    const rowRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState(false);
    const Icon = item.icon;
    const handleClick = () => {
        const el = rowRef.current;
        if (el) {
            const amp = 0.4 + momentum * 0.6;
            el.animate([
                { transform: 'translateX(3px) scale(1.008)', offset: 0 },
                { transform: `translateX(${2 + amp * 2}px) scale(${1 - 0.015 * amp})`, offset: 0.2 },
                { transform: `translateX(${4 + amp}px) scale(${1 + 0.006 * amp})`, offset: 0.55 },
                { transform: 'translateX(0) scale(1)', offset: 1 },
            ], { duration: 340 + momentum * 70, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
        }
        triggerCascade(containerRef, index, momentum);
        onPress();
    };
    return (
        <motion.div ref={rowRef}
            initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 + index * 0.035, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            className="relative flex items-center gap-3.5 px-3 py-3 rounded-[12px] cursor-pointer transition-all duration-200"
            style={{ background: hovered ? 'rgba(0,0,0,0.04)' : 'transparent' }}>
            <div className="w-[20px] flex items-center justify-center flex-shrink-0 transition-opacity duration-200"
                style={{ opacity: hovered ? 0.9 : 0.45 }}>
                <Icon size={16} color={hovered ? C.accent : C.text} />
            </div>
            <span className="text-[14px] font-medium transition-colors duration-200 flex-1"
                style={{ color: hovered ? C.text : `${C.text}CC` }}>
                {item.label}
            </span>
            {item.badge > 0 && (
                <span className="text-[10px] font-semibold rounded-full w-[18px] h-[18px] flex items-center justify-center"
                    style={{ backgroundColor: C.accent, color: 'white' }}>
                    {item.badge}
                </span>
            )}
        </motion.div>
    );
}

/* NotificationItem removed — notifications now render inline in ProfilePopover */

function ProfilePopover({
    anchorRect, onClose, onOpenSettings, momentumRef,
}: {
    anchorRect: DOMRect | null; onClose: () => void; onOpenSettings: () => void;
    momentumRef: React.MutableRefObject<{ value: number }>;
}) {
    const top = anchorRect ? anchorRect.bottom + 10 : 60;
    const right = anchorRect ? window.innerWidth - anchorRect.right : 24;
    const menuRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const [expandedNotif, setExpandedNotif] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const { isSeller, setIsSeller } = useRole();
    const [authUser, setAuthUser] = useState<any | null>(null);
    const [menuSummary, setMenuSummary] = useState<any | null>(null);
    const [historyNotifications, setHistoryNotifications] = useState<any[] | null>(null);
    const [markingHistoryRead, setMarkingHistoryRead] = useState(false);

    useEffect(() => {
        setAuthUser(readVehslUser());
    }, []);

    const userDisplay = useMemo(() => getUserDisplay(authUser), [authUser]);
    const allowedAccountTypes = useMemo(() => {
        const raw = menuSummary?.allowed_account_types;
        return Array.isArray(raw) ? raw.filter((x: any) => x === 'buyer' || x === 'seller') : [];
    }, [menuSummary]);
    const lockedRole = allowedAccountTypes.length === 1 ? allowedAccountTypes[0] : null;

    useEffect(() => {
        if (menuSummary?.active_account_type === 'buyer' || menuSummary?.active_account_type === 'seller') {
            setIsSeller(menuSummary.active_account_type === 'seller');
        } else if (lockedRole) {
            setIsSeller(lockedRole === 'seller');
        }
    }, [lockedRole, menuSummary, setIsSeller]);

    const fetchMenuSummary = useCallback(async () => {
        const { access } = readAuthTokens();
        if (!access) return;
        try {
            const res = await fetch(`${apiBase()}/api/v1/me/menu`, {
                headers: { Authorization: `Bearer ${access}` },
            });
            if (res.status === 401) return;
            const data = await res.json().catch(() => null);
            if (!res.ok) return;
            setMenuSummary(data);
            if (data?.user) {
                setAuthUser(data.user);
                try {
                    window.localStorage.setItem('vehsl.user', JSON.stringify(data.user));
                } catch { }
            }
        } catch { }
    }, []);

    const switchAccountType = useCallback(async (nextType: 'buyer' | 'seller') => {
        const { access } = readAuthTokens();
        if (!access) return false;
        try {
            const res = await fetch(`${apiBase()}/api/v1/me/switch-account-type`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ account_type: nextType }),
            });
            if (res.status === 401) return false;
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                const msg = (data && (data.detail || data.error)) || 'Could not switch role.';
                toast.error(typeof msg === 'string' ? msg : 'Could not switch role.');
                return false;
            }
            setAuthUser(data);
            try {
                window.localStorage.setItem('vehsl.user', JSON.stringify(data));
            } catch { }
            await fetchMenuSummary();
            return true;
        } catch {
            toast.error('Network error.');
            return false;
        }
    }, [fetchMenuSummary]);

    useEffect(() => {
        fetchMenuSummary();
    }, [fetchMenuSummary]);

    useEffect(() => {
        if (!showHistory) return;
        const { access } = readAuthTokens();
        if (!access) return;
        (async () => {
            try {
                const res = await fetch(`${apiBase()}/api/v1/notifications`, {
                    headers: { Authorization: `Bearer ${access}` },
                });
                if (res.status === 401) return;
                const data = await res.json().catch(() => null);
                if (!res.ok) return;
                const list = Array.isArray(data) ? data.slice(0, 40) : [];
                setHistoryNotifications(list);
            } catch { }
        })();
    }, [showHistory]);

    const currentNotifs: NotifType[] = useMemo(() => {
        const updates = menuSummary?.updates;
        const list = Array.isArray(updates) ? updates : null;
        if (!list || list.length === 0) return isSeller ? SELLER_NOTIFICATIONS : NOTIFICATIONS;

        const ids = isSeller ? ['sn1', 'sn2', 'sn3'] : ['n1', 'n2', 'n3'];
        return list.slice(0, 3).map((u: any, idx: number) => ({
            id: ids[idx] || `u-${idx}`,
            kind: (u?.kind === 'shipping' || u?.kind === 'message' || u?.kind === 'deal') ? u.kind : 'deal',
            headline: (u?.headline || 'Update').toString(),
            detail: (u?.detail || '').toString(),
            meta: (u?.meta || '').toString(),
            tint: (u?.tint || '#0071e3').toString(),
            action: (u?.action || 'settings').toString(),
            progress: typeof u?.progress === 'number' ? u.progress : undefined,
            stages: Array.isArray(u?.stages) ? u.stages : undefined,
            personInitial: (u?.personInitial || '').toString() || undefined,
            personColor: (u?.personColor || '').toString() || undefined,
            savings: (u?.savings || '').toString() || undefined,
        }));
    }, [isSeller, menuSummary]);

    const menuItems = useMemo(() => {
        const counts = menuSummary?.counts || {};
        return MENU_ITEMS.map((it) => {
            if (it.key === 'orders') return { ...it, badge: Number(counts.orders_on_the_way || 0) };
            if (it.key === 'messages') return { ...it, badge: Number(counts.unread_messages || 0) };
            if (it.key === 'wishlist') return { ...it, badge: Number(counts.wishlist_items || 0) };
            return it;
        });
    }, [menuSummary]);

    const historyGroups = useMemo(() => {
        const built = historyNotifications ? buildHistoryGroups(historyNotifications) : [];
        if (built && built.length) return built;
        return isSeller ? SELLER_HISTORY_GROUPS : NOTIF_HISTORY_GROUPS;
    }, [historyNotifications, isSeller]);

    const historyNotificationIds = useMemo(() => {
        const ids: any[] = [];
        for (const g of historyGroups || []) {
            for (const it of (g?.items || [])) {
                if (it?.rawId) ids.push(it.rawId);
            }
        }
        return ids;
    }, [historyGroups]);

    const clearAllHistory = useCallback(async () => {
        if (!historyNotificationIds.length) {
            setShowHistory(false);
            return;
        }
        const { access } = readAuthTokens();
        if (!access) {
            setShowHistory(false);
            return;
        }
        if (markingHistoryRead) return;
        try {
            setMarkingHistoryRead(true);
            await fetch(`${apiBase()}/api/v1/notifications/mark-read/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: historyNotificationIds }),
            });
        } catch { }
        setShowHistory(false);
        setHistoryNotifications(null);
        await fetchMenuSummary();
        setMarkingHistoryRead(false);
    }, [fetchMenuSummary, historyNotificationIds, markingHistoryRead]);

    const handleNotifPress = (notif: NotifType, index: number) => {
        momentumRef.current.value = Math.min(1, momentumRef.current.value + 0.12);
        const card = cardRef.current;
        if (card) {
            const m = momentumRef.current.value;
            card.animate([
                { transform: 'scale(1)' }, { transform: `scale(${1 - 0.003 * m})` },
                { transform: `scale(${1 + 0.002 * m})` }, { transform: 'scale(1)' },
            ], { duration: 340, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
        }
        toast(notif.headline, { description: notif.detail });
    };

    const handleItemPress = (item: typeof MENU_ITEMS[number], index: number) => {
        momentumRef.current.value = Math.min(1, momentumRef.current.value + 0.15);
        const card = cardRef.current;
        if (card) {
            const m = momentumRef.current.value;
            card.animate([
                { transform: 'scale(1)' }, { transform: `scale(${1 - 0.004 * m})` },
                { transform: `scale(${1 + 0.002 * m})` }, { transform: 'scale(1)' },
            ], { duration: 360, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
        }
        if (item.key === 'orders') {
            onClose();
            window.location.href = '/orders';
            return;
        }
        if (item.key === 'wishlist') {
            onClose();
            window.location.href = '/wishlist';
            return;
        }
        if (item.key === 'messages') {
            onClose();
            window.location.href = '/messages';
            return;
        }
        if (item.action === 'settings') onOpenSettings();
        else toast(`Opening ${item.label}...`, { description: 'Coming soon.' });
    };
    const handleLogout = async () => {
        momentumRef.current.value = Math.min(1, momentumRef.current.value + 0.25);
        const { access, refresh } = readAuthTokens();
        if (access) {
            try {
                await fetch(`${apiBase()}/api/v1/auth/logout`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh }),
                });
            } catch { }
        }
        try {
            window.localStorage.removeItem('vehsl.access');
            window.localStorage.removeItem('vehsl.refresh');
            window.localStorage.removeItem('vehsl.user');
        } catch { }
        setIsSeller(false);
        toast('Signed out successfully');
        onClose();
        window.location.href = '/';
    };

    return createPortal(
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[9998]" style={{ background: 'rgba(0,0,0,0.06)' }}
                onClick={onClose} />
            <motion.div ref={cardRef}
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ type: 'spring', damping: 28, stiffness: 340, mass: 0.7 }}
                className="fixed z-[9999]" style={{ top, right }}>
                <Glass className="rounded-[20px] overflow-hidden w-[300px]"
                    style={{ background: C.surface, fontFamily: FONT } as React.CSSProperties}>
                    <div className="relative px-5 pt-7 pb-4">
                        {/* ═══ THE CONCIERGE — with expandable detail ═══ */}

                        {/* ── Identity — centered, intimate ── */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.03, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="flex flex-col items-center mb-5">
                            <div className="relative mb-3">
                                {currentNotifs.length > 0 && (
                                    <motion.div
                                        className="absolute rounded-full"
                                        style={{
                                            inset: -4,
                                            background: 'conic-gradient(from 0deg, rgba(52,199,89,0.4), rgba(0,113,227,0.4), rgba(255,149,0,0.4), rgba(52,199,89,0.4))',
                                            filter: 'blur(5px)',
                                        }}
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                    />
                                )}
                                <div className="absolute rounded-full z-[5]" style={{ inset: -2, background: 'white' }} />
                                <div className="relative w-[56px] h-[56px] rounded-full flex items-center justify-center text-[20px] font-semibold z-10"
                                    style={{
                                        background: 'linear-gradient(135deg, #E8ECF4 0%, #D5DCE8 100%)',
                                        color: B[800], fontFamily: FONT,
                                    }}>{userDisplay.initial}</div>
                            </div>
                            <p className="text-[16px] font-semibold leading-tight"
                                style={{ color: C.text, fontFamily: FONT, letterSpacing: '-0.01em' }}>{userDisplay.name}</p>
                            <p className="text-[11px] font-normal leading-tight mt-1"
                                style={{ color: B[600], fontFamily: FONT }}>{userDisplay.secondary || ' '}</p>

                            {/* ── Buyer / Seller toggle — identity level ── */}
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.12, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                                className="mt-3">
                                <div className="flex items-center gap-[3px] rounded-full p-[3px]"
                                    style={{ background: 'rgba(26,26,26,0.04)' }}>
                                    {([
                                        { id: 'buyer', label: 'Buyer', Icon: IconOrders },
                                        { id: 'seller', label: 'Seller', Icon: IconSeller },
                                    ] as const).map((tab) => {
                                        const active = tab.id === 'seller' ? isSeller : !isSeller;
                                        return (
                                            <button key={tab.id}
                                                onClick={async (e) => {
                                                    if (active) return;
                                                    if (lockedRole) {
                                                        e.stopPropagation();
                                                        toast('Role is fixed for this account');
                                                        return;
                                                    }
                                                    e.stopPropagation();
                                                    setExpandedNotif(null);
                                                    setShowHistory(false);
                                                    if (!allowedAccountTypes.includes(tab.id)) {
                                                        toast('Role is not available for this account');
                                                        return;
                                                    }
                                                    const ok = await switchAccountType(tab.id);
                                                    if (!ok) return;
                                                    setIsSeller(tab.id === 'seller');
                                                    const m = momentumRef.current.value;
                                                    e.currentTarget.parentElement?.animate([
                                                        { transform: 'scale(1)' },
                                                        { transform: `scale(${1 - 0.012 * (m + 0.3)})` },
                                                        { transform: `scale(${1 + 0.005 * (m + 0.3)})` },
                                                        { transform: 'scale(1)' },
                                                    ], { duration: 400, easing: 'cubic-bezier(0.34,1.56,0.64,1)' });
                                                    triggerCascade(menuRef, 0, m);
                                                    momentumRef.current.value = Math.min(1, m + 0.15);
                                                    toast(tab.id === 'seller' ? 'Now selling' : 'Now shopping', {
                                                        description: tab.id === 'seller' ? 'Manage your store' : 'Browse & discover',
                                                    });
                                                }}
                                                className="relative flex-1 flex items-center justify-center gap-[6px] rounded-full border-none cursor-pointer"
                                                style={{ padding: '7px 14px', background: 'transparent', fontFamily: FONT }}>
                                                {active && (
                                                    <motion.div layoutId="role-pill"
                                                        className="absolute inset-0 rounded-full"
                                                        style={{
                                                            background: 'rgba(255,255,255,0.7)',
                                                            boxShadow: '0 1.5px 5px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(255,255,255,0.9)',
                                                        }}
                                                        transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.8 }}
                                                    />
                                                )}
                                                <div className="relative z-10 transition-opacity duration-300"
                                                    style={{ opacity: active ? 0.8 : 0.35 }}>
                                                    <tab.Icon size={14} color="#1a1a1a" />
                                                </div>
                                                <span className="relative z-10 text-[12px] font-semibold transition-opacity duration-300 whitespace-nowrap"
                                                    style={{ color: '#1a1a1a', opacity: active ? 0.8 : 0.35 }}>
                                                    {tab.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* ── The Sentence + expandable detail ── */}
                        {currentNotifs.length > 0 && (
                            <motion.div
                                ref={notifRef as React.RefObject<HTMLDivElement>}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                                className="mb-4">
                                <p className="text-center px-2"
                                    style={{ color: B[600], fontFamily: FONT, fontSize: '13.5px', lineHeight: 1.55 }}>
                                    {currentNotifs.map((n, idx) => (
                                        <span key={n.id}>
                                            <motion.span
                                                id={`hero-${n.id}`}
                                                className="font-semibold cursor-pointer inline-block"
                                                style={{
                                                    color: n.tint,
                                                    textShadow: `0 0 18px ${n.tint}22`,
                                                    transition: 'text-shadow 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                                                    borderBottom: expandedNotif === n.id ? `1.5px solid ${n.tint}55` : '1.5px solid transparent',
                                                }}
                                                onClick={() => {
                                                    setExpandedNotif(expandedNotif === n.id ? null : n.id);
                                                    document.getElementById(`hero-${n.id}`)?.animate(
                                                        [{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }],
                                                        { duration: 450, easing: 'cubic-bezier(0.34,1.56,0.64,1)' }
                                                    );
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.textShadow = `0 0 28px ${n.tint}55, 0 0 56px ${n.tint}22`; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.textShadow = `0 0 18px ${n.tint}22`; }}
                                            >
                                                {n.headline}
                                            </motion.span>
                                            {idx < currentNotifs.length - 1 ? '. ' : ''}
                                        </span>
                                    ))}
                                </p>

                                <AnimatePresence mode="wait">
                                    {(() => {
                                        const n = currentNotifs.find(x => x.id === expandedNotif);
                                        if (!n) return null;
                                        const bg = `${n.tint}0A`;
                                        const soft = `${n.tint}14`;
                                        const primary = n.tint;
                                        const label =
                                            n.action === 'orders' ? 'Open orders' :
                                            n.action === 'messages' ? 'Open messages' :
                                            n.action === 'wishlist' ? 'Open wishlist' :
                                            n.action === 'settings' ? 'Open settings' : 'Open';
                                        const onAction = (e: any) => {
                                            e.stopPropagation();
                                            if (n.action === 'orders') window.location.href = '/orders';
                                            else if (n.action === 'settings') onOpenSettings();
                                            else toast(`Opening ${n.action}...`, { description: 'Coming soon.' });
                                        };
                                        return (
                                            <motion.div
                                                key={`d-${n.id}`}
                                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                                                className="overflow-hidden rounded-[14px] px-4 py-3.5"
                                                style={{ background: bg }}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[13px] font-semibold" style={{ color: C.text, fontFamily: FONT }}>{n.headline}</span>
                                                    <span className="text-[10px]" style={{ color: B[600], fontFamily: FONT }}>{n.meta}</span>
                                                </div>
                                                {n.kind === 'shipping' && typeof n.progress === 'number' && (
                                                    <>
                                                        <div className="w-full h-[6px] rounded-full overflow-hidden mb-3"
                                                            style={{ background: soft }}>
                                                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round(n.progress * 100)}%` }}
                                                                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                                                                className="h-full rounded-full"
                                                                style={{ background: primary }} />
                                                        </div>
                                                        {Array.isArray(n.stages) && n.stages.length >= 2 && (
                                                            <div className="flex items-center justify-between text-[10px] mb-3"
                                                                style={{ color: B[600], fontFamily: FONT }}>
                                                                {n.stages.slice(0, 3).map((s) => <span key={s}>{s}</span>)}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                <p className="text-[11.5px] mb-3" style={{ color: B[600], fontFamily: FONT }}>
                                                    {n.detail || '—'}
                                                </p>
                                                <button
                                                    className="w-full text-[11.5px] font-semibold py-2 rounded-[10px] cursor-pointer border-none"
                                                    style={{ background: primary, color: 'white', fontFamily: FONT, transition: 'opacity 0.2s' }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                                                    onClick={onAction}
                                                >
                                                    {label}
                                                </button>
                                            </motion.div>
                                        );
                                    })()}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {/* ── See all / History toggle ── */}
                        {currentNotifs.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.3 }}
                                className="flex items-center justify-center mb-3 -mt-1">
                                <button
                                    className="text-[11px] font-medium cursor-pointer border-none bg-transparent flex items-center gap-1 py-1 px-2 rounded-[8px]"
                                    style={{
                                        color: C.accent,
                                        fontFamily: FONT,
                                        transition: 'background 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,113,227,0.06)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                    onClick={() => { setShowHistory(!showHistory); setExpandedNotif(null); }}>
                                    {showHistory ? 'Back to now' : 'See all updates'}
                                    <ChevronRight size={11} strokeWidth={2.5}
                                        style={{
                                            color: C.accent,
                                            transform: showHistory ? 'rotate(180deg)' : 'rotate(90deg)',
                                            transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                                        }} />
                                </button>
                            </motion.div>
                        )}

                        {/* ── Notification history panel ── */}
                        <AnimatePresence>
                            {showHistory && (
                                <motion.div
                                    key="history-panel"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    className="overflow-hidden mb-3">
                                    <div className="relative">
                                        {/* Scrollable memory stream */}
                                        <div className="max-h-[280px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                                            {historyGroups.map((group, gi) => {
                                                const histGroups = historyGroups;
                                                let itemCounter = 0;
                                                for (let g = 0; g < gi; g++) itemCounter += histGroups[g].items.length;
                                                return (
                                                    <motion.div key={group.period}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: gi * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                                                        className="mb-3 last:mb-0">
                                                        {/* Period label — whispered, not shouted */}
                                                        <div className="flex items-center gap-2.5 mb-2 px-1">
                                                            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)` }} />
                                                            <span className="text-[9.5px] font-medium tracking-[0.3px] flex-shrink-0"
                                                                style={{ color: B[100], fontFamily: FONT }}>{group.period}</span>
                                                            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)` }} />
                                                        </div>
                                                        {/* Memory cards */}
                                                        <div className="flex flex-col gap-1.5">
                                                            {group.items.map((item, ii) => {
                                                                const globalIndex = itemCounter + ii;
                                                                return (
                                                                    <motion.div key={item.id}
                                                                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                        transition={{ delay: 0.06 + globalIndex * 0.045, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                                                                        className="group relative rounded-[14px] px-3.5 py-3 cursor-pointer overflow-hidden"
                                                                        style={{ transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease' }}
                                                                        onMouseEnter={(e) => {
                                                                            e.currentTarget.style.transform = 'scale(1.018) translateY(-1px)';
                                                                            e.currentTarget.style.boxShadow = `0 4px 20px ${item.tint}18, 0 1px 6px ${item.tint}10, 0 0 0 1px ${item.tint}12`;
                                                                            const glow = e.currentTarget.querySelector('[data-glow]') as HTMLElement;
                                                                            if (glow) glow.style.opacity = '1';
                                                                            const orb = e.currentTarget.querySelector('[data-orb]') as HTMLElement;
                                                                            if (orb) { orb.style.transform = 'scale(1.1)'; orb.style.boxShadow = `0 0 12px ${item.tint}25, inset 0 0 0 0.5px ${item.tint}20`; }
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                                                            e.currentTarget.style.boxShadow = 'none';
                                                                            const glow = e.currentTarget.querySelector('[data-glow]') as HTMLElement;
                                                                            if (glow) glow.style.opacity = '0';
                                                                            const orb = e.currentTarget.querySelector('[data-orb]') as HTMLElement;
                                                                            if (orb) { orb.style.transform = 'scale(1)'; orb.style.boxShadow = `inset 0 0 0 0.5px ${item.tint}15`; }
                                                                        }}
                                                                        onClick={(e) => {
                                                                            const el = e.currentTarget;
                                                                            el.animate([
                                                                                { transform: 'scale(1) translateY(0)' },
                                                                                { transform: 'scale(0.94) translateY(1px)' },
                                                                                { transform: 'scale(1.025) translateY(-2px)' },
                                                                                { transform: 'scale(1) translateY(0)' },
                                                                            ], { duration: 500, easing: 'cubic-bezier(0.34,1.56,0.64,1)' });
                                                                            const orb = el.querySelector('[data-orb]') as HTMLElement;
                                                                            if (orb) orb.animate([
                                                                                { transform: 'scale(1)' }, { transform: 'scale(0.8)' },
                                                                                { transform: 'scale(1.2)' }, { transform: 'scale(1)' },
                                                                            ], { duration: 450, easing: 'cubic-bezier(0.34,1.56,0.64,1)' });
                                                                            toast(item.sentence, { description: item.moment });
                                                                        }}>
                                                                        {/* Ambient glow — breathes on hover */}
                                                                        <div data-glow className="absolute inset-0 rounded-[14px] pointer-events-none"
                                                                            style={{
                                                                                background: `radial-gradient(ellipse at 20% 50%, ${item.tint}12 0%, transparent 70%)`,
                                                                                opacity: 0, transition: 'opacity 0.5s ease',
                                                                            }} />
                                                                        {/* Background */}
                                                                        <div className="absolute inset-0 rounded-[14px] pointer-events-none"
                                                                            style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)' }} />
                                                                        {/* Content */}
                                                                        <div className="relative flex items-start gap-3">
                                                                            {/* Tinted icon orb */}
                                                                            <div data-orb className="w-[28px] h-[28px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                                                                                style={{
                                                                                    background: `${item.tint}12`,
                                                                                    boxShadow: `inset 0 0 0 0.5px ${item.tint}18, 0 1px 3px ${item.tint}08`,
                                                                                    transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease, background 0.3s ease',
                                                                                }}>
                                                                                {(() => {
                                                                                    const iconMap: Record<string, React.ReactNode> = {
                                                                                        '📦': <Package size={13} strokeWidth={1.8} style={{ color: item.tint }} />,
                                                                                        '✨': <TrendingDown size={13} strokeWidth={1.8} style={{ color: item.tint }} />,
                                                                                        '💬': <MessageSquare size={13} strokeWidth={1.8} style={{ color: item.tint }} />,
                                                                                        '💰': <DollarSign size={13} strokeWidth={1.8} style={{ color: item.tint }} />,
                                                                                        '✅': <CheckCircle2 size={13} strokeWidth={1.8} style={{ color: item.tint }} />,
                                                                                        '🚢': <Ship size={13} strokeWidth={1.8} style={{ color: item.tint }} />,
                                                                                        '⚠️': <AlertTriangle size={13} strokeWidth={1.8} style={{ color: item.tint }} />,
                                                                                        '📋': <FileText size={13} strokeWidth={1.8} style={{ color: item.tint }} />,
                                                                                        '🏭': <Warehouse size={13} strokeWidth={1.8} style={{ color: item.tint }} />,
                                                                                        '📊': <Receipt size={13} strokeWidth={1.8} style={{ color: item.tint }} />,
                                                                                    };
                                                                                    return iconMap[item.icon as string] || (
                                                                                        item.kind === 'shipping' ? <Truck size={13} strokeWidth={1.8} style={{ color: item.tint }} /> :
                                                                                        item.kind === 'message' ? <MessageCircle size={13} strokeWidth={1.8} style={{ color: item.tint }} /> :
                                                                                        item.kind === 'deal' ? <DollarSign size={13} strokeWidth={1.8} style={{ color: item.tint }} /> :
                                                                                        <Bell size={13} strokeWidth={1.8} style={{ color: item.tint }} />
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0 pt-[1px]">
                                                                                <p className="text-[12.5px] font-semibold leading-snug"
                                                                                    style={{ color: '#1d1d1f', fontFamily: FONT }}>{item.sentence}</p>
                                                                                <p className="text-[10.5px] font-normal leading-tight mt-1"
                                                                                    style={{ color: 'rgba(0,0,0,0.38)', fontFamily: FONT }}>{item.moment}</p>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                        {/* Fade-out at bottom of scroll */}
                                        <div className="absolute bottom-0 left-0 right-0 h-[24px] pointer-events-none"
                                            style={{ background: 'linear-gradient(transparent, rgba(255,255,255,0.6))' }} />
                                        {/* Gentle footer */}
                                        <div className="flex justify-center pt-3 pb-1 rounded-b-[14px]"
                                            style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px) saturate(1.4)', WebkitBackdropFilter: 'blur(12px) saturate(1.4)' }}>
                                            <button className="text-[10px] font-medium cursor-pointer border-none bg-transparent py-1.5 px-3 rounded-[8px] flex items-center gap-1.5"
                                                style={{ color: B[600], fontFamily: FONT, transition: 'all 0.25s ease' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; e.currentTarget.style.color = C.text; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = B[600]; }}
                                                onClick={clearAllHistory}>
                                                <span style={{ fontSize: '9px', opacity: 0.5 }}>{'×'}</span>
                                                Clear all history
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="h-px mb-1 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }} />
                        <div ref={menuRef as React.RefObject<HTMLDivElement>}>
                            {menuItems.filter(item => item.key !== 'seller').map((item, i) => (
                                    <MenuItem key={item.key} item={item} index={i}
                                        momentum={momentumRef.current.value}
                                        onPress={() => handleItemPress(item, i)}
                                        containerRef={menuRef} />
                            ))}
                        </div>
                        <div className="h-px my-1.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }} />
                        <LogoutRow onPress={handleLogout} />
                    </div>
                </Glass>
            </motion.div>
        </>,
        document.body
    );
}

function LogoutRow({ onPress }: { onPress: () => void }) {
    const [hovered, setHovered] = useState(false);
    return (
        <motion.div initial={{ opacity: 0, x: -3 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.25 }}
            onClick={onPress}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            className="flex items-center gap-3.5 px-3 py-3 rounded-[12px] cursor-pointer transition-colors duration-200"
            style={{ background: hovered ? 'rgba(255,59,48,0.06)' : 'transparent' }}>
            <div className="w-[20px] flex items-center justify-center flex-shrink-0"
                style={{ opacity: hovered ? 0.9 : 0.5 }}>
                <IconLogout size={13} />
            </div>
            <span className="text-[14px] font-medium transition-colors duration-200"
                style={{ color: hovered ? C.danger : `${C.danger}BB` }}>Sign Out</span>
        </motion.div>
    );
}


/* ══════════════════════════════════════════
   FULL SETTINGS MODAL — Apple-level white space
   ══════════════════════════════════════════ */

type SettingsTab = 'profile' | 'alerts' | 'orders' | 'security' | 'help';
const BUYER_TABS: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'alerts', label: 'Notifications', icon: Bell },
    { key: 'orders', label: 'Orders', icon: CreditCard },
    { key: 'security', label: 'Security', icon: Lock },
    { key: 'help', label: 'Help', icon: HelpCircle },
];
const SELLER_TABS: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
    { key: 'profile', label: 'Business', icon: Building2 },
    { key: 'alerts', label: 'Notifications', icon: Bell },
    { key: 'orders', label: 'Fulfillment', icon: Factory },
    { key: 'security', label: 'Security', icon: Lock },
    { key: 'help', label: 'Help', icon: HelpCircle },
];

/* ── Setting Row — stripped to essence ── */
function SettingRow({
    icon: Icon, label, description, right, onClick, danger = false,
}: {
    icon: React.ElementType; label: string; description?: string;
    right?: React.ReactNode; onClick?: () => void; danger?: boolean;
}) {
    const [hovered, setHovered] = useState(false);
    const interactive = !!onClick;
    return (
        <div onClick={interactive ? onClick : undefined}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined}
            onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); } : undefined}
            className={`w-full flex items-center gap-4 py-4 text-left transition-opacity duration-150 ${interactive ? 'cursor-pointer' : ''}`}
            style={{ opacity: interactive && hovered ? 1 : interactive ? 0.88 : 1 }}>

            <Icon size={18} strokeWidth={1.5}
                className="flex-shrink-0"
                style={{ color: danger ? C.danger : B[600] }} />

            <div className="flex-1 min-w-0">
                <span className="text-[14px] font-medium block"
                    style={{ color: danger ? C.danger : C.text }}>
                    {label}
                </span>
                {description && (
                    <span className="text-[13px] block mt-0.5"
                        style={{ color: B[600] }}>
                        {description}
                    </span>
                )}
            </div>

            <div className="flex-shrink-0">
                {right || (interactive
                    ? <ChevronRight size={16} strokeWidth={1.5} style={{ color: B[100] }} />
                    : null
                )}
            </div>
        </div>
    );
}

/* ── Tab Button — icon + text, sober like Apple ── */
function TabButton({ icon: Icon, label, active, onClick }: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) {
    const [hovered, setHovered] = useState(false);
    const spanRef = useRef<HTMLSpanElement>(null);
    const [barPos, setBarPos] = useState<{ left: number; width: number } | null>(null);

    useEffect(() => {
        if (spanRef.current) {
            const span = spanRef.current;
            const button = span.closest('button');
            if (button) {
                const spanRect = span.getBoundingClientRect();
                const btnRect = button.getBoundingClientRect();
                setBarPos({
                    left: spanRect.left - btnRect.left - 3,
                    width: spanRect.width + 6,
                });
            }
        }
    }, [active, label]);

    return (
        <button onClick={onClick}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            className="relative flex flex-col items-center px-5 py-3.5 pb-[14px] text-[13px] transition-colors duration-200"
            style={{ color: active ? C.accent : hovered ? C.text : B[600], fontWeight: active ? 600 : 500 }}>
            <span ref={spanRef} className="flex items-center gap-2">
                <Icon size={14} strokeWidth={active ? 2.2 : 1.5} />
                {label}
            </span>
            {active && barPos && (
                <motion.div layoutId="stab"
                    className="absolute bottom-0 h-[3px] rounded-full"
                    style={{ backgroundColor: C.accent, left: barPos.left, width: barPos.width, transform: 'translateY(1.5px)' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 320 }} />
            )}
        </button>
    );
}

/* ── Tab Bar — horizontal tab strip with animated indicator ── */
function SettingsTabBar({ activeTab, onTabChange }: { activeTab: SettingsTab; onTabChange: (tab: SettingsTab) => void }) {
    const { isSeller } = useRole();
    const TABS = isSeller ? SELLER_TABS : BUYER_TABS;
    return (
        <div className="flex items-center gap-0 mt-8 -mx-10 px-10 border-b border-black/[0.06]">
            {TABS.map(t => (
                <TabButton key={t.key} icon={t.icon} label={t.label} active={activeTab === t.key} onClick={() => onTabChange(t.key)} />
            ))}
        </div>
    );
}

/* ── Sidebar — quiet, helpful, lots of air ── */
function ContextualSidebar({ tab }: { tab: SettingsTab }) {
    const { isSeller } = useRole();
    return (
        <AnimatePresence mode="wait">
            <motion.div key={tab}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col justify-between">

                <div>
                    {tab === 'profile' && (
                        <SidebarContent
                            title={isSeller ? "Your business" : "Your account"}
                            lines={isSeller ? [
                                { label: 'Plan', value: 'Seller Pro' },
                                { label: 'Factory', value: 'Acme Manufacturing' },
                                { label: 'Certifications', value: '3 of 5' },
                                { label: 'Rating', value: '4.8 / 5.0' },
                            ] : [
                                { label: 'Plan', value: 'Enterprise B2B' },
                                { label: 'Company', value: 'Acme Distribution' },
                                { label: 'Docs verified', value: '2 of 4' },
                                { label: 'Member since', value: 'Sep 2024' },
                            ]}
                        />
                    )}
                    {tab === 'alerts' && (
                        <SidebarContent
                            title={isSeller ? "Alert summary" : "Alert summary"}
                            lines={isSeller ? [
                                { label: 'Unread', value: '4' },
                                { label: 'New orders', value: '2 pending' },
                                { label: 'QC flags', value: '1' },
                                { label: 'Channels', value: '3 of 4' },
                            ] : [
                                { label: 'Unread', value: '7' },
                                { label: 'Today', value: '12 alerts' },
                                { label: 'Urgent', value: '3' },
                                { label: 'Handlers', value: '1 active' },
                                { label: 'Channels', value: '2 of 4' },
                            ]}
                        />
                    )}
                    {tab === 'orders' && (
                        <SidebarContent
                            title={isSeller ? "Fulfillment" : "This month"}
                            lines={isSeller ? [
                                { label: 'In production', value: '8 orders' },
                                { label: 'Ready to ship', value: '3' },
                                { label: 'Shipped', value: '14' },
                                { label: 'Revenue', value: '$48,200' },
                            ] : [
                                { label: 'Pending', value: '5' },
                                { label: 'Shipped', value: '18' },
                                { label: 'Delivered', value: '24' },
                            ]}
                        />
                    )}
                    {tab === 'security' && (
                        <SidebarContent
                            title="Active sessions"
                            lines={[
                                { label: 'iPhone 13', value: 'Active now' },
                                { label: 'MacBook Air', value: '3 min ago' },
                                { label: 'Android Tablet', value: '5 months ago' },
                            ]}
                        />
                    )}
                    {tab === 'help' && (
                        <SidebarContent
                            title="Support"
                            lines={[
                                { label: 'Status', value: 'All systems go' },
                                { label: 'Response time', value: 'Under 2 hours' },
                                { label: 'Email', value: 'support@acme.store' },
                            ]}
                        />
                    )}
                </div>

                <div className="mt-auto pt-8">
                    <p className="text-[12px]" style={{ color: B[100] }}>
                        Version 2.4.1
                    </p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function SidebarContent({ title, lines }: { title: string; lines: { label: string; value: string }[] }) {
    return (
        <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-6" style={{ color: B[600] }}>{title}</p>
            <div className="space-y-5">
                {lines.map((line, i) => (
                    <div key={i}>
                        <p className="text-[12px] mb-0.5" style={{ color: B[600] }}>{line.label}</p>
                        <p className="text-[15px] font-medium" style={{ color: C.text }}>{line.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Full Settings Modal ── */
function FullSettingsModal({ onClose }: { onClose: () => void }) {
    const { isSeller } = useRole();
    const [tab, setTab] = useState<SettingsTab>('profile');
    const [loaded, setLoaded] = useState(false);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [notifications, setNotifications] = useState({
        /* Order lifecycle */
        orderConfirmed: true, orderProcessing: true, orderModified: true,
        orderCancelled: true, paymentConfirmed: true,
        /* Shipping & delivery */
        shipmentDispatched: true, containerTracking: true,
        deliveryScheduleChanges: true, partialDeliveries: true,
        proofOfDelivery: true, customsClearance: false,
        /* Storage & warehouse */
        goodsReceived: true, storageCapacity: true,
        demurrageWarnings: true, conditionMonitoring: false,
        /* Handler */
        notifyHandler: true, handlerConfirmation: true,
        shareTrackingWithHandler: true,
        /* Financial */
        paymentDueReminders: true, creditLimitAlerts: true,
        priceChangeAlerts: false, invoiceGenerated: true,
        /* Channels */
        emailNotifications: true, pushNotifications: true,
        smsNotifications: false, whatsappNotifications: false,
        sound: true,
        /* Quiet hours */
        quietHours: false,
        quietFrom: '22:00',
        quietTo: '07:00',
        quietDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    });
    const [display, setDisplay] = useState({
        compactView: false, theme: 'system' as 'light' | 'dark' | 'system',
        currency: 'USD' as 'USD' | 'EUR' | 'GBP',
    });
    const [business, setBusiness] = useState<any>({ activeBizId: 'default', businesses: [] });
    const [orderSettings, setOrderSettings] = useState({
        defaultSort: 'newest' as 'newest' | 'oldest' | 'amount',
        autoArchive: true, autoArchiveDays: 30,
        compactOrderCards: false,
        // Tracking
        trackingUpdates: 'realtime' as 'realtime' | 'hourly' | 'daily',
        shareTrackingLink: false,
        // Payment
        defaultCurrency: 'USD' as 'USD' | 'EUR' | 'GBP',
        emailReceipts: true,
    });
    const [privacy, setPrivacy] = useState({
        twoFactor: false, sessionTimeout: '30min' as '15min' | '30min' | '1hr' | 'never',
        smsEnabled: true,
        authAppEnabled: false,
        recoveryGenerated: false,
        payoutPinEnabled: true,
        listingLockEnabled: true,
        cancelVerifyEnabled: true,
        payoutPinSet: false,
    });

    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const trackRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const [scrollThumb, setScrollThumb] = useState({ y: 0, h: 0, progress: 0, visible: false, isHovering: false });

    const updateScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const scrollable = scrollHeight - clientHeight;
        if (scrollable <= 0) {
            setScrollThumb(prev => ({ ...prev, visible: false }));
            return;
        }
        const progress = scrollTop / scrollable;
        const thumbRatio = Math.max(clientHeight / scrollHeight, 0.15);
        const trackH = clientHeight - 24;
        const thumbH = thumbRatio * trackH;
        const thumbY = progress * (trackH - thumbH) + 12;
        setScrollThumb(prev => ({ ...prev, y: thumbY, h: thumbH, progress, visible: true }));
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
            setScrollThumb(prev => ({ ...prev, visible: prev.isHovering ? true : false }));
        }, 1200);
    }, []);

    useEffect(() => {
        const timer = setTimeout(updateScroll, 200);
        return () => clearTimeout(timer);
    }, [tab, updateScroll]);

    /* ── Custom scrollbar drag handling ── */
    const handleTrackClick = useCallback((e: React.MouseEvent) => {
        const el = scrollRef.current;
        const track = trackRef.current;
        if (!el || !track) return;
        const rect = track.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const trackH = rect.height;
        const ratio = clickY / trackH;
        el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
    }, []);

    const handleThumbDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isDraggingRef.current = true;
        const el = scrollRef.current;
        const track = trackRef.current;
        if (!el || !track) return;
        const startY = e.clientY;
        const startScroll = el.scrollTop;
        const trackH = track.getBoundingClientRect().height - 24; // account for padding
        const scrollable = el.scrollHeight - el.clientHeight;

        const onMove = (ev: MouseEvent) => {
            if (!isDraggingRef.current) return;
            const delta = ev.clientY - startY;
            const thumbH = scrollThumb.h;
            const scrollDelta = (delta / (trackH - thumbH)) * scrollable;
            el.scrollTop = Math.max(0, Math.min(scrollable, startScroll + scrollDelta));
        };
        const onUp = () => {
            isDraggingRef.current = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [scrollThumb.h]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const refreshAccess = useCallback(async () => {
        const { refresh } = readAuthTokens();
        if (!refresh) return '';
        try {
            const res = await fetch(`${apiBase()}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh }),
            });
            const data = await res.json().catch(() => null);
            const nextAccess = (data?.access || '').toString();
            if (!res.ok || !nextAccess) return '';
            try { window.localStorage.setItem('vehsl.access', nextAccess); } catch { }
            return nextAccess;
        } catch {
            return '';
        }
    }, []);

    const authedFetch = useCallback(async (path: string, init?: RequestInit) => {
        const doFetch = async (access: string) => fetch(`${apiBase()}${path}`, {
            ...init,
            headers: {
                ...(init?.headers || {}),
                ...(access ? { Authorization: `Bearer ${access}` } : {}),
            },
            cache: 'no-store',
        });

        let access = readAuthTokens().access;
        let res = await doFetch(access);
        if (res.status !== 401) return res;

        const nextAccess = await refreshAccess();
        if (!nextAccess) {
            try {
                window.localStorage.removeItem('vehsl.access');
                window.localStorage.removeItem('vehsl.refresh');
                window.localStorage.removeItem('vehsl.user');
            } catch { }
            try { window.location.assign('/?signin=1'); } catch { }
            return res;
        }

        access = nextAccess;
        res = await doFetch(access);
        return res;
    }, [refreshAccess]);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await authedFetch('/api/v1/settings/me');
                if (!alive) return;
                if (!res.ok) { setLoaded(true); return; }
                const data = await res.json().catch(() => null);
                const s = data?.settings || {};
                if (s?.notifications && typeof s.notifications === 'object') setNotifications((p: any) => ({ ...p, ...(s.notifications || {}) }));
                if (s?.display && typeof s.display === 'object') setDisplay((p: any) => ({ ...p, ...(s.display || {}) }));
                if (s?.order_settings && typeof s.order_settings === 'object') setOrderSettings((p: any) => ({ ...p, ...(s.order_settings || {}) }));
                if (s?.security && typeof s.security === 'object') setPrivacy((p: any) => ({ ...p, ...(s.security || {}) }));
                if (s?.business && typeof s.business === 'object') setBusiness((p: any) => ({ ...p, ...(s.business || {}) }));
            } catch { }
            if (alive) setLoaded(true);
        })();
        return () => { alive = false; };
    }, [authedFetch]);

    useEffect(() => {
        if (!loaded) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            const body = {
                display,
                notifications,
                order_settings: orderSettings,
                security: privacy,
                business,
            };
            void authedFetch('/api/v1/settings/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        }, 650);
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [loaded, display, notifications, orderSettings, privacy, business, authedFetch]);

    return createPortal(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10000] flex items-start justify-center pt-[5vh] pb-6 px-4 overflow-y-auto"
            style={{ scrollbarWidth: 'none' }}>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="fixed inset-0"
                style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(12px)' }}
                onClick={onClose} />

            <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 10, opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.7 }}
                className="relative w-full max-w-[640px] z-10 font-urbanist"
                style={{ fontFamily: "'Urbanist', sans-serif" }}>

                <Glass className="rounded-[20px] overflow-hidden"
                    style={{ background: '#ffffff' } as React.CSSProperties}>

                    <div className="relative">
                        {/* Header — minimal */}
                        <div className="px-10 pt-10 pb-0">
                            <div className="flex items-center justify-between">
                                <div className="w-[28px] h-[28px]" />
                                <h2 className="text-[22px] font-semibold tracking-[-0.02em]"
                                    style={{ color: C.text }}>Settings</h2>
                                <button onClick={onClose}
                                    className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06] active:scale-95"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: B[600] }}>
                                    <X size={12} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Tabs */}
                            <SettingsTabBar activeTab={tab} onTabChange={setTab} />
                        </div>

                        {/* Body — full width, no sidebar for clarity */}
                        <div className="min-h-[520px]">
                            <div className="relative">
                                <div
                                    ref={scrollRef}
                                    onScroll={updateScroll}
                                    className="px-12 py-12 pr-10 overflow-y-auto settings-scroll-area"
                                    style={{ maxHeight: '600px' }}>
                                    <style>{`
                                        .settings-scroll-area::-webkit-scrollbar { width: 0px; display: none; }
                                        .settings-scroll-area { scrollbar-width: none; -ms-overflow-style: none; }
                                        /* ── Smoother inner elements ── */
                                        .settings-scroll-area input,
                                        .settings-scroll-area textarea { border-radius: 14px !important; }
                                        /* ── Interactive hover, active & focus-visible ── */
                                        .settings-scroll-area div[role="button"]:hover,
                                        .settings-scroll-area div.cursor-pointer:hover {
                                            filter: brightness(0.97);
                                        }
                                        .settings-scroll-area div[role="button"]:active,
                                        .settings-scroll-area div.cursor-pointer:active {
                                            filter: brightness(0.94);
                                            transform: scale(0.997);
                                        }
                                        .settings-scroll-area button:not([role="switch"]):hover {
                                            filter: brightness(1.08);
                                        }
                                        .settings-scroll-area button:not([role="switch"]):active {
                                            filter: brightness(0.94);
                                        }
                                        .settings-scroll-area [role="button"]:focus-visible,
                                        .settings-scroll-area button:focus-visible {
                                            outline: 2.5px solid rgba(0,113,227,0.4);
                                            outline-offset: 2px;
                                        }
                                    `}</style>
                                    <AnimatePresence mode="wait">
                                        <motion.div key={tab}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.15 }}>
                                            {tab === 'profile' && (isSeller
                                                ? <SellerBusinessTab display={display} setDisplay={setDisplay} business={business} setBusiness={setBusiness} />
                                                : <ProfileTab display={display} setDisplay={setDisplay} />
                                            )}
                                            {tab === 'alerts' && (isSeller
                                                ? <SellerAlertsTab notifications={notifications} setNotifications={setNotifications} />
                                                : <AlertsTab notifications={notifications} setNotifications={setNotifications} />
                                            )}
                                            {tab === 'orders' && (isSeller
                                                ? <SellerFulfillmentTab orderSettings={orderSettings} setOrderSettings={setOrderSettings} />
                                                : <OrdersTab orderSettings={orderSettings} setOrderSettings={setOrderSettings} />
                                            )}
                                            {tab === 'security' && (isSeller
                                                ? <SellerSecurityTab privacy={privacy} setPrivacy={setPrivacy} />
                                                : <SecurityTab privacy={privacy} setPrivacy={setPrivacy} />
                                            )}
                                            {tab === 'help' && (isSeller
                                                ? <SellerHelpTab openSupportChat={async () => {
                                                    try {
                                                        const res = await authedFetch('/api/v1/chat/threads/support/', { method: 'POST' });
                                                        const data = await res.json().catch(() => null);
                                                        const id = Number(data?.id || 0);
                                                        if (id) window.location.href = `/messages?thread=${id}`;
                                                        else window.location.href = '/messages';
                                                    } catch {
                                                        window.location.href = '/messages';
                                                    }
                                                }} />
                                                : <HelpTab openSupportChat={async () => {
                                                    try {
                                                        const res = await authedFetch('/api/v1/chat/threads/support/', { method: 'POST' });
                                                        const data = await res.json().catch(() => null);
                                                        const id = Number(data?.id || 0);
                                                        if (id) window.location.href = `/messages?thread=${id}`;
                                                        else window.location.href = '/messages';
                                                    } catch {
                                                        window.location.href = '/messages';
                                                    }
                                                }} />
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>


                                {/* Bottom scroll fade */}
                                <div className="absolute bottom-0 left-0 right-0 h-[40px] pointer-events-none"
                                    style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.95), transparent)' }} />

                                {/* ── Frosted glass custom scrollbar ── */}
                                <motion.div
                                    ref={trackRef}
                                    initial={false}
                                    animate={{ opacity: scrollThumb.visible || scrollThumb.isHovering ? 1 : 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="absolute top-3 bottom-3 right-[5px] w-[14px] z-10"
                                    style={{ pointerEvents: scrollThumb.visible || scrollThumb.isHovering ? 'auto' : 'none' }}
                                    onClick={handleTrackClick}
                                    onMouseEnter={() => setScrollThumb(prev => ({ ...prev, isHovering: true, visible: true }))}
                                    onMouseLeave={() => setScrollThumb(prev => ({ ...prev, isHovering: false, visible: false }))}>
                                    {/* Track — frosted glass capsule */}
                                    <div className="absolute inset-0 rounded-[50px] overflow-hidden"
                                        style={{
                                            backdropFilter: 'blur(12px)',
                                            WebkitBackdropFilter: 'blur(12px)',
                                            background: 'rgba(147,150,153,0.14)',
                                        }} />
                                    {/* Elevator / thumb */}
                                    <motion.div
                                        initial={false}
                                        animate={{ y: scrollThumb.y, height: scrollThumb.h }}
                                        transition={isDraggingRef.current
                                            ? { type: 'tween', duration: 0 }
                                            : { type: 'spring', stiffness: 400, damping: 35, mass: 0.8 }}
                                        className="absolute left-[1px] right-[1px] cursor-grab active:cursor-grabbing"
                                        onMouseDown={handleThumbDragStart}
                                        style={{ minHeight: 28 }}>
                                        <div className="w-full h-full rounded-[50px]"
                                            style={{
                                                backgroundColor: scrollThumb.isHovering ? '#6e6e73' : '#86868b',
                                                transition: 'background-color 0.2s ease',
                                            }} />
                                    </motion.div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </Glass>
            </motion.div>
        </motion.div>,
        document.body
    );
}

/* ══════════════════════════════════════════
   TAB CONTENT — Apple white space
   ═══════════════════════════════��══════════ */

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] mt-10 mb-2 first:mt-0"
            style={{ color: B[600] }}>
            {children}
        </h3>
    );
}

function Sep() {
    return <div className="h-px my-1" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />;
}

/* ── Mock businesses ── */
const BUSINESSES_INIT = [
    {
        id: 'acme', name: 'Acme Distribution Ltd.', regNo: 'RC-2019/048271', vat: 'VAT-8827104562',
        address: '42 Commerce Street, Suite 200, London EC2A 4NE', rep: 'Noah Wilson — CPO',
        email: 'procurement@acme-distribution.com', emailVerified: true, payAccount: '••••4821',
        bankName: 'First National Bank',
        bankAccounts: [
            { id: 'ab1', bankName: 'First National Bank', accountNo: '••••4821', isDefault: true },
        ],
        storageAddress: '12 Docklands Way, Warehouse B3, London E14 9GE',
        docs: {
            boardResolution: { name: 'Board_Resolution_2024.pdf', status: 'verified' as const },
            incorporation: { name: 'Certificate_of_Inc.pdf', status: 'verified' as const },
            ownership: { name: 'Shareholding_Structure.pdf', status: 'pending' as const },
            taxCert: { name: '', status: 'none' as const },
        },
    },
    {
        id: 'globex', name: 'Globex Trading Co.', regNo: 'RC-2021/091734', vat: 'VAT-3301982744',
        address: '8 King Abdullah Road, Riyadh 12271', rep: 'Noah Wilson — Director',
        email: 'ops@globex-trading.com', emailVerified: false, payAccount: '••••7603',
        bankName: 'Al Rajhi Bank',
        bankAccounts: [
            { id: 'gb1', bankName: 'Al Rajhi Bank', accountNo: '••••7603', isDefault: true },
        ],
        storageAddress: '',
        docs: {
            boardResolution: { name: 'Board_Res_Globex.pdf', status: 'pending' as const },
            incorporation: { name: '', status: 'none' as const },
            ownership: { name: '', status: 'none' as const },
            taxCert: { name: '', status: 'none' as const },
        },
    },
];

function ProfileTab({ display, setDisplay }: { display: any; setDisplay: any }) {
    const [txMode, setTxMode] = useState<'company' | 'individual'>('company');
    const [businesses, setBusinesses] = useState(BUSINESSES_INIT);
    const [activeBizId, setActiveBizId] = useState('acme');
    const [langOpen, setLangOpen] = useState(false);
    const [currOpen, setCurrOpen] = useState(false);
    const [authUser, setAuthUser] = useState<any | null>(null);

    useEffect(() => {
        setAuthUser(readVehslUser());
    }, []);

    const userDisplay = useMemo(() => getUserDisplay(authUser), [authUser]);

    /* ── Individual mode state ── */
    const [personalAddress, setPersonalAddress] = useState('15 Maple Avenue, Apt 4B, Brooklyn, NY 11201');
    const [editingAddress, setEditingAddress] = useState(false);
    const [addressDraft, setAddressDraft] = useState(personalAddress);

    const [bankAccounts, setBankAccounts] = useState([
        { id: '1', bankName: 'Chase Bank', accountNo: '••••3847', isDefault: true },
    ]);
    const [editingBankId, setEditingBankId] = useState<string | null>(null);
    const [bankDraft, setBankDraft] = useState({ bankName: '', accountNo: '' });
    const [addingBank, setAddingBank] = useState(false);

    const [storageAddress, setStorageAddress] = useState('');
    const [editingStorage, setEditingStorage] = useState(false);
    const [storageDraft, setStorageDraft] = useState('');

    const saveAddress = () => {
        if (addressDraft.trim()) { setPersonalAddress(addressDraft.trim()); setEditingAddress(false); toast('Address updated'); }
    };
    const saveStorage = () => {
        setStorageAddress(storageDraft.trim()); setEditingStorage(false);
        toast(storageDraft.trim() ? 'Storage address saved' : 'Storage address removed');
    };
    const saveBank = (id: string) => {
        if (!bankDraft.bankName.trim() || !bankDraft.accountNo.trim()) return;
        setBankAccounts(prev => prev.map(a => a.id === id ? { ...a, bankName: bankDraft.bankName.trim(), accountNo: bankDraft.accountNo.trim() } : a));
        setEditingBankId(null); toast('Bank account updated');
    };
    const addBank = () => {
        if (!bankDraft.bankName.trim() || !bankDraft.accountNo.trim()) return;
        const newId = Date.now().toString();
        setBankAccounts(prev => [...prev, { id: newId, bankName: bankDraft.bankName.trim(), accountNo: bankDraft.accountNo.trim(), isDefault: prev.length === 0 }]);
        setAddingBank(false); setBankDraft({ bankName: '', accountNo: '' }); toast('Bank account added');
    };
    const deleteBank = (id: string) => {
        setBankAccounts(prev => { const next = prev.filter(a => a.id !== id); if (next.length && !next.some(a => a.isDefault)) next[0].isDefault = true; return next; });
        toast('Bank account removed');
    };
    const setDefaultBank = (id: string) => {
        setBankAccounts(prev => prev.map(a => ({ ...a, isDefault: a.id === id }))); toast('Default account updated');
    };

    /* ── Company bank account & storage state ── */
    const [editingBizBankId, setEditingBizBankId] = useState<string | null>(null);
    const [bizBankDraft, setBizBankDraft] = useState({ bankName: '', accountNo: '' });
    const [addingBizBank, setAddingBizBank] = useState(false);
    const [editingBizStorage, setEditingBizStorage] = useState(false);
    const [bizStorageDraft, setBizStorageDraft] = useState('');

    const saveBizBank = (bizId: string, bankId: string) => {
        if (!bizBankDraft.bankName.trim() || !bizBankDraft.accountNo.trim()) return;
        setBusinesses(prev => prev.map(b => b.id === bizId
            ? { ...b, bankAccounts: b.bankAccounts.map(a => a.id === bankId ? { ...a, bankName: bizBankDraft.bankName.trim(), accountNo: bizBankDraft.accountNo.trim() } : a) }
            : b));
        setEditingBizBankId(null); toast('Bank account updated');
    };
    const addBizBank = (bizId: string) => {
        if (!bizBankDraft.bankName.trim() || !bizBankDraft.accountNo.trim()) return;
        const newId = 'bb' + Date.now();
        setBusinesses(prev => prev.map(b => b.id === bizId
            ? { ...b, bankAccounts: [...b.bankAccounts, { id: newId, bankName: bizBankDraft.bankName.trim(), accountNo: bizBankDraft.accountNo.trim(), isDefault: b.bankAccounts.length === 0 }] }
            : b));
        setAddingBizBank(false); setBizBankDraft({ bankName: '', accountNo: '' }); toast('Bank account added');
    };
    const deleteBizBank = (bizId: string, bankId: string) => {
        setBusinesses(prev => prev.map(b => {
            if (b.id !== bizId) return b;
            const next = b.bankAccounts.filter(a => a.id !== bankId);
            if (next.length && !next.some(a => a.isDefault)) next[0].isDefault = true;
            return { ...b, bankAccounts: next };
        }));
        toast('Bank account removed');
    };
    const setDefaultBizBank = (bizId: string, bankId: string) => {
        setBusinesses(prev => prev.map(b => b.id === bizId
            ? { ...b, bankAccounts: b.bankAccounts.map(a => ({ ...a, isDefault: a.id === bankId })) }
            : b));
        toast('Default account updated');
    };
    const saveBizStorage = (bizId: string) => {
        setBusinesses(prev => prev.map(b => b.id === bizId ? { ...b, storageAddress: bizStorageDraft.trim() } : b));
        setEditingBizStorage(false);
        toast(bizStorageDraft.trim() ? 'Storage address saved' : 'Storage address removed');
    };

    const activeBiz = businesses.find(b => b.id === activeBizId) || businesses[0];

    const handleUpload = (bizId: string, docKey: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.jpg,.jpeg,.png';
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
                setBusinesses(prev => prev.map(b =>
                    b.id === bizId
                        ? { ...b, docs: { ...b.docs, [docKey]: { name: file.name, status: 'pending' as const } } }
                        : b
                ));
                toast('Document uploaded', { description: 'We will review it within 24–48 hours.' });
            }
        };
        input.click();
    };

    const docsVerified = Object.values(activeBiz.docs).filter(d => d.status === 'verified').length;
    const docsTotal = Object.values(activeBiz.docs).length;

    return (
        <div>
            {/* ── You ── */}
            <div className="flex items-center gap-5 mb-10">
                <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center text-[24px] font-semibold flex-shrink-0"
                    style={{ backgroundColor: B[50], color: C.text }}>
                    {userDisplay.initial}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                        <p className="text-[20px] font-semibold tracking-[-0.01em]" style={{ color: C.text }}>{userDisplay.name}</p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{ backgroundColor: 'rgba(52,199,89,0.1)', color: C.success }}>
                            <UserCheck size={10} strokeWidth={2} />
                            Verified
                        </span>
                    </div>
                    <p className="text-[14px] mt-1" style={{ color: B[600] }}>{userDisplay.secondary || ' '}</p>
                </div>
            </div>

            {/* ── Who is buying? ── */}
            <SectionTitle>Who is buying?</SectionTitle>

            <div className="flex gap-2.5 mt-3">
                {([
                    { key: 'company' as const, label: 'Company', Icon: Building2 },
                    { key: 'individual' as const, label: 'Individual', Icon: User },
                ]).map(({ key, label, Icon }) => {
                    const active = txMode === key;
                    return (
                        <div key={key}
                            role="button" tabIndex={0}
                            onClick={() => { setTxMode(key); toast(key === 'company' ? 'Buying as company' : 'Buying as yourself'); }}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTxMode(key); toast(key === 'company' ? 'Buying as company' : 'Buying as yourself'); } }}
                            className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-[20px] text-left transition-all duration-200 cursor-pointer outline-none"
                            style={{
                                backgroundColor: active ? 'rgba(52,199,89,0.06)' : 'rgba(0,0,0,0.025)',
                                boxShadow: active ? 'inset 0 0 0 1.5px rgba(52,199,89,0.3)' : 'none',
                            }}>
                            <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center flex-shrink-0"
                                style={{
                                    backgroundColor: active ? C.success : 'rgba(0,0,0,0.06)',
                                }}>
                                {active && <Check size={12} strokeWidth={3} color="white" />}
                            </div>
                            <Icon size={16} strokeWidth={1.4} style={{ color: active ? C.text : B[600] }} />
                            <span className="text-[14px] font-medium" style={{ color: active ? C.text : B[600] }}>{label}</span>
                        </div>
                    );
                })}
            </div>
            <div className="flex items-center gap-2 mt-3 px-1">
                <Wallet size={12} strokeWidth={1.5} style={{ color: B[600] }} />
                <p className="text-[12px]" style={{ color: B[600] }}>
                    Payment must be from the {txMode === 'company' ? 'company' : 'personal'} account
                </p>
            </div>

            {/* ── Select a business (company mode) ── */}
            {txMode === 'company' && (
                <>
                    <SectionTitle>Select a business</SectionTitle>
                    <p className="text-[12px] mb-4" style={{ color: B[600] }}>
                        Tap the business you want to buy for. You can add more than one.
                    </p>

                    <div className="space-y-2.5">
                        {businesses.map(biz => {
                            const selected = activeBizId === biz.id;
                            const verified = Object.values(biz.docs).filter(d => d.status === 'verified').length;
                            const total = Object.values(biz.docs).length;
                            return (
                                <div key={biz.id}
                                    role="button" tabIndex={0}
                                    onClick={() => { setActiveBizId(biz.id); setEditingBizBankId(null); setAddingBizBank(false); setEditingBizStorage(false); toast(`Selected: ${biz.name}`); }}
                                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveBizId(biz.id); setEditingBizBankId(null); setAddingBizBank(false); setEditingBizStorage(false); toast(`Selected: ${biz.name}`); } }}
                                    className="w-full flex items-center gap-4 p-4 rounded-[20px] text-left transition-all duration-200 cursor-pointer outline-none"
                                    style={{
                                        backgroundColor: selected ? 'rgba(52,199,89,0.06)' : 'rgba(0,0,0,0.025)',
                                        boxShadow: selected ? 'inset 0 0 0 1.5px rgba(52,199,89,0.3)' : 'none',
                                    }}>
                                    <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{
                                            backgroundColor: selected ? C.success : 'rgba(0,0,0,0.06)',
                                        }}>
                                        {selected && <Check size={13} strokeWidth={3} color="white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-medium" style={{ color: selected ? C.text : B[600] }}>{biz.name}</p>
                                        <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>{verified}/{total} docs verified</p>
                                    </div>
                                    {!biz.emailVerified && (
                                        <span className="text-[10px] font-semibold tracking-[0.02em] px-2 py-[3px] rounded-full flex-shrink-0 inline-flex items-center gap-1"
                                            style={{ backgroundColor: 'rgba(255,59,48,0.07)', color: '#D42A2A' }}>
                                            <MailX size={10} strokeWidth={2.2} />
                                            Verify
                                        </span>
                                    )}
                                </div>
                            );
                        })}

                        {/* Add business */}
                        <div role="button" tabIndex={0}
                            onClick={() => toast('Add a new business', { description: 'Business registration form coming soon.' })}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toast('Add a new business', { description: 'Business registration form coming soon.' }); } }}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-[20px] text-[13px] font-medium transition-colors duration-150 hover:bg-black/[0.04] cursor-pointer outline-none"
                            style={{ backgroundColor: 'rgba(0,0,0,0.02)', color: B[600] }}>
                            <Plus size={15} strokeWidth={1.8} />
                            Add a business
                        </div>
                    </div>

                    {/* ── Selected business details ── */}
                    <SectionTitle>Business details</SectionTitle>
                    <p className="text-[12px] mt-1 mb-4" style={{ color: B[600] }}>
                        To change company details, contact us via Help.
                    </p>

                    <div className="space-y-3">
                        {/* Company identity card */}
                        <div className="rounded-[20px] p-4" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                            <div className="flex items-start gap-3.5">
                                <Building2 size={18} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: B[600] }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-medium" style={{ color: C.text }}>{activeBiz.name}</p>
                                    <p className="text-[12px] mt-1" style={{ color: B[600] }}>{activeBiz.regNo}</p>
                                    <div className="flex items-start gap-1.5 mt-2.5 pt-2.5 border-t border-black/5">
                                        <MapPin size={13} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: B[600] }} />
                                        <p className="text-[12px]" style={{ color: B[600] }}>{activeBiz.address}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tax ID card */}
                        <div className="rounded-[20px] p-4" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                            <div className="flex items-start gap-3.5">
                                <FileText size={18} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: B[600] }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-medium" style={{ color: C.text }}>Tax ID / VAT</p>
                                    <p className="text-[12px] mt-1" style={{ color: B[600] }}>{activeBiz.vat}</p>
                                </div>
                            </div>
                        </div>

                        {/* Business email row */}
                        <div className="rounded-[20px] p-4 cursor-pointer transition-colors duration-150 hover:bg-black/[0.03]"
                            style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                            onClick={() => toast('Edit business email')}>
                            <div className="flex items-center gap-3.5">
                                <MailCheck size={18} strokeWidth={1.5} className="flex-shrink-0" style={{ color: B[600] }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-medium" style={{ color: C.text }}>Business email</p>
                                    <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>{activeBiz.email}</p>
                                </div>
                                {activeBiz.emailVerified
                                    ? <span className="text-[12px] font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(52,199,89,0.08)', color: C.success }}>Verified</span>
                                    : <button className="text-[12px] font-medium px-3 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: C.accent, color: 'white' }} onClick={(e) => { e.stopPropagation(); toast('Verification email sent to ' + activeBiz.email); }}>Verify</button>
                                }
                            </div>
                        </div>
                    </div>

                    {/* ── Bank accounts for selected business ── */}
                    <SectionTitle>Bank accounts — {activeBiz.name.split(' ')[0]}</SectionTitle>
                    <p className="text-[12px] mt-1 mb-4" style={{ color: B[600] }}>
                        Company payment accounts. Tap to set default.
                    </p>

                    <div className="space-y-2.5">
                        {activeBiz.bankAccounts.map(acct => (
                            <div key={acct.id}>
                                {editingBizBankId === acct.id ? (
                                    <div className="rounded-[20px] p-4 space-y-3" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                            <p className="text-[13px] font-medium" style={{ color: C.text }}>Edit account</p>
                                        </div>
                                        <input
                                            value={bizBankDraft.bankName}
                                            onChange={e => setBizBankDraft(d => ({ ...d, bankName: e.target.value }))}
                                            placeholder="Bank name"
                                            className="w-full text-[13px] rounded-[12px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                            style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" }}
                                            autoFocus
                                        />
                                        <input
                                            value={bizBankDraft.accountNo}
                                            onChange={e => setBizBankDraft(d => ({ ...d, accountNo: e.target.value }))}
                                            placeholder="Account number"
                                            className="w-full text-[13px] rounded-[12px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                            style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" }}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingBizBankId(null)}
                                                className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 hover:bg-black/[0.06]"
                                                style={{ color: B[600] }}>Cancel</button>
                                            <button onClick={() => saveBizBank(activeBiz.id, acct.id)}
                                                className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150"
                                                style={{ backgroundColor: C.accent, color: 'white' }}>Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setDefaultBizBank(activeBiz.id, acct.id)}
                                        className="w-full rounded-[20px] p-4 text-left transition-all duration-200 cursor-pointer"
                                        style={{
                                            backgroundColor: acct.isDefault ? 'rgba(52,199,89,0.06)' : 'rgba(0,0,0,0.02)',
                                            boxShadow: acct.isDefault ? 'inset 0 0 0 1.5px rgba(52,199,89,0.3)' : 'none',
                                        }}>
                                        <div className="flex items-start gap-3.5">
                                            <CreditCard size={18} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: B[600] }} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[14px] font-medium" style={{ color: C.text }}>{acct.bankName}</p>
                                                    {acct.isDefault && (
                                                        <span className="text-[10px] font-semibold tracking-[0.02em] px-2 py-[3px] rounded-full"
                                                            style={{ backgroundColor: 'rgba(52,199,89,0.1)', color: C.success }}>
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>Account ending {acct.accountNo}</p>
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                                <button onClick={(e) => { e.stopPropagation(); setBizBankDraft({ bankName: acct.bankName, accountNo: acct.accountNo }); setEditingBizBankId(acct.id); }}
                                                    className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06]"
                                                    style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                                                    <Pencil size={12} strokeWidth={2} style={{ color: B[600] }} />
                                                </button>
                                                {activeBiz.bankAccounts.length > 1 && (
                                                    <button onClick={(e) => { e.stopPropagation(); deleteBizBank(activeBiz.id, acct.id); }}
                                                        className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06]"
                                                        style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                                                        <Trash2 size={12} strokeWidth={2} style={{ color: C.danger }} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Add company bank account */}
                        {addingBizBank ? (
                            <div className="rounded-[20px] p-4 space-y-3" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                <div className="flex items-center gap-2">
                                    <CreditCard size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                    <p className="text-[13px] font-medium" style={{ color: C.text }}>New bank account</p>
                                </div>
                                <input
                                    value={bizBankDraft.bankName}
                                    onChange={e => setBizBankDraft(d => ({ ...d, bankName: e.target.value }))}
                                    placeholder="Bank name"
                                    className="w-full text-[13px] rounded-[12px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                    style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" }}
                                    autoFocus
                                />
                                <input
                                    value={bizBankDraft.accountNo}
                                    onChange={e => setBizBankDraft(d => ({ ...d, accountNo: e.target.value }))}
                                    placeholder="Account number"
                                    className="w-full text-[13px] rounded-[12px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                    style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" }}
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => { setAddingBizBank(false); setBizBankDraft({ bankName: '', accountNo: '' }); }}
                                        className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 hover:bg-black/[0.06]"
                                        style={{ color: B[600] }}>Cancel</button>
                                    <button onClick={() => addBizBank(activeBiz.id)}
                                        className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150"
                                        style={{ backgroundColor: C.accent, color: 'white' }}>Add</button>
                                </div>
                            </div>
                        ) : (
                            <div role="button" tabIndex={0}
                                onClick={() => { setBizBankDraft({ bankName: '', accountNo: '' }); setAddingBizBank(true); }}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setBizBankDraft({ bankName: '', accountNo: '' }); setAddingBizBank(true); } }}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-[20px] text-[13px] font-medium transition-colors duration-150 hover:bg-black/[0.04] cursor-pointer outline-none"
                                style={{ backgroundColor: 'rgba(0,0,0,0.02)', color: B[600] }}>
                                <Plus size={15} strokeWidth={1.8} />
                                Add bank account
                            </div>
                        )}
                    </div>

                    {/* ── Storage address for selected business ── */}
                    <SectionTitle>Storage address — {activeBiz.name.split(' ')[0]}</SectionTitle>
                    <p className="text-[12px] mt-1 mb-4" style={{ color: B[600] }}>
                        Optional — a warehouse or storage location for this company's deliveries.
                    </p>

                    <div className="rounded-[20px] p-4" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                        {!editingBizStorage && !activeBiz.storageAddress ? (
                            <div role="button" tabIndex={0}
                                onClick={() => { setBizStorageDraft(''); setEditingBizStorage(true); }}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setBizStorageDraft(''); setEditingBizStorage(true); } }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-[13px] font-medium transition-colors duration-150 hover:bg-black/[0.04] cursor-pointer outline-none"
                                style={{ color: B[600] }}>
                                <Plus size={15} strokeWidth={1.8} />
                                Add storage address
                            </div>
                        ) : !editingBizStorage && activeBiz.storageAddress ? (
                            <div className="flex items-start gap-3.5">
                                <Truck size={18} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: B[600] }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-medium" style={{ color: C.text }}>Storage / Warehouse</p>
                                    <p className="text-[12px] mt-1" style={{ color: B[600] }}>{activeBiz.storageAddress}</p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                    <button onClick={() => { setBizStorageDraft(activeBiz.storageAddress); setEditingBizStorage(true); }}
                                        className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06]"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                                        <Pencil size={12} strokeWidth={2} style={{ color: B[600] }} />
                                    </button>
                                    <button onClick={() => { setBusinesses(prev => prev.map(b => b.id === activeBiz.id ? { ...b, storageAddress: '' } : b)); toast('Storage address removed'); }}
                                        className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06]"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                                        <Trash2 size={12} strokeWidth={2} style={{ color: C.danger }} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Truck size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                    <p className="text-[13px] font-medium" style={{ color: C.text }}>{activeBiz.storageAddress ? 'Edit storage address' : 'New storage address'}</p>
                                </div>
                                <textarea
                                    value={bizStorageDraft}
                                    onChange={e => setBizStorageDraft(e.target.value)}
                                    rows={2}
                                    placeholder="Warehouse name, street, city, postal code…"
                                    className="w-full text-[13px] rounded-[12px] px-3.5 py-2.5 outline-none resize-none transition-all duration-200"
                                    style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" }}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingBizStorage(false)}
                                        className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 hover:bg-black/[0.06]"
                                        style={{ color: B[600] }}>Cancel</button>
                                    <button onClick={() => saveBizStorage(activeBiz.id)}
                                        className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150"
                                        style={{ backgroundColor: C.accent, color: 'white' }}>Save</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Documents for selected business ── */}
                    <SectionTitle>Documents — {activeBiz.name.split(' ')[0]}</SectionTitle>
                    <p className="text-[12px] mt-1 mb-4" style={{ color: B[600] }}>
                        {docsVerified}/{docsTotal} verified. We check these before you can buy for this company.
                    </p>

                    <div className="space-y-3">
                        <DocumentRow label="Board Resolution" description="Lets you buy on behalf of the company"
                            doc={activeBiz.docs.boardResolution} onUpload={() => handleUpload(activeBiz.id, 'boardResolution')} required />
                        <DocumentRow label="Certificate of Incorporation" description="Proves the company exists"
                            doc={activeBiz.docs.incorporation} onUpload={() => handleUpload(activeBiz.id, 'incorporation')} required />
                        <DocumentRow label="Ownership & Shareholding" description="Shows who owns the company"
                            doc={activeBiz.docs.ownership} onUpload={() => handleUpload(activeBiz.id, 'ownership')} required />
                        <DocumentRow label="Tax Registration" description="Shows the company pays taxes"
                            doc={activeBiz.docs.taxCert} onUpload={() => handleUpload(activeBiz.id, 'taxCert')} />
                    </div>
                </>
            )}

            {/* ── Individual mode ── */}
            {txMode === 'individual' && (
                <>
                    {/* ── Your address ── */}
                    <SectionTitle>Your address</SectionTitle>
                    <p className="text-[12px] mt-1 mb-4" style={{ color: B[600] }}>
                        Your billing and delivery address for personal orders.
                    </p>

                    <div className="rounded-[20px] p-4" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                        {!editingAddress ? (
                            <div className="flex items-start gap-3.5">
                                <Home size={18} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: B[600] }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-medium" style={{ color: C.text }}>Home address</p>
                                    <p className="text-[12px] mt-1" style={{ color: B[600] }}>{personalAddress}</p>
                                </div>
                                <button onClick={() => { setAddressDraft(personalAddress); setEditingAddress(true); }}
                                    className="flex-shrink-0 w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06]"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                                    <Pencil size={12} strokeWidth={2} style={{ color: B[600] }} />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Home size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                    <p className="text-[13px] font-medium" style={{ color: C.text }}>Edit address</p>
                                </div>
                                <textarea
                                    value={addressDraft}
                                    onChange={e => setAddressDraft(e.target.value)}
                                    rows={2}
                                    className="w-full text-[13px] rounded-[12px] px-3.5 py-2.5 outline-none resize-none transition-all duration-200"
                                    style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" }}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingAddress(false)}
                                        className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 hover:bg-black/[0.06]"
                                        style={{ color: B[600] }}>Cancel</button>
                                    <button onClick={saveAddress}
                                        className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150"
                                        style={{ backgroundColor: C.accent, color: 'white' }}>Save</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Storage address ── */}
                    <SectionTitle>Storage address</SectionTitle>
                    <p className="text-[12px] mt-1 mb-4" style={{ color: B[600] }}>
                        Optional — add a warehouse or storage location for deliveries.
                    </p>

                    <div className="rounded-[20px] p-4" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                        {!editingStorage && !storageAddress ? (
                            <div role="button" tabIndex={0}
                                onClick={() => { setStorageDraft(''); setEditingStorage(true); }}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStorageDraft(''); setEditingStorage(true); } }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-[13px] font-medium transition-colors duration-150 hover:bg-black/[0.04] cursor-pointer outline-none"
                                style={{ color: B[600] }}>
                                <Plus size={15} strokeWidth={1.8} />
                                Add storage address
                            </div>
                        ) : !editingStorage && storageAddress ? (
                            <div className="flex items-start gap-3.5">
                                <Truck size={18} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: B[600] }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-medium" style={{ color: C.text }}>Storage / Warehouse</p>
                                    <p className="text-[12px] mt-1" style={{ color: B[600] }}>{storageAddress}</p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                    <button onClick={() => { setStorageDraft(storageAddress); setEditingStorage(true); }}
                                        className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06]"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                                        <Pencil size={12} strokeWidth={2} style={{ color: B[600] }} />
                                    </button>
                                    <button onClick={() => { setStorageAddress(''); toast('Storage address removed'); }}
                                        className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06]"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                                        <Trash2 size={12} strokeWidth={2} style={{ color: C.danger }} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Truck size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                    <p className="text-[13px] font-medium" style={{ color: C.text }}>{storageAddress ? 'Edit storage address' : 'New storage address'}</p>
                                </div>
                                <textarea
                                    value={storageDraft}
                                    onChange={e => setStorageDraft(e.target.value)}
                                    rows={2}
                                    placeholder="Warehouse name, street, city, postal code…"
                                    className="w-full text-[13px] rounded-[12px] px-3.5 py-2.5 outline-none resize-none transition-all duration-200"
                                    style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" }}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingStorage(false)}
                                        className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 hover:bg-black/[0.06]"
                                        style={{ color: B[600] }}>Cancel</button>
                                    <button onClick={saveStorage}
                                        className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150"
                                        style={{ backgroundColor: C.accent, color: 'white' }}>Save</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Bank accounts ── */}
                    <SectionTitle>Bank accounts</SectionTitle>
                    <p className="text-[12px] mt-1 mb-4" style={{ color: B[600] }}>
                        Personal accounts used for payment. Tap to set default.
                    </p>

                    <div className="space-y-2.5">
                        {bankAccounts.map(acct => (
                            <div key={acct.id}>
                                {editingBankId === acct.id ? (
                                    <div className="rounded-[20px] p-4 space-y-3" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                            <p className="text-[13px] font-medium" style={{ color: C.text }}>Edit account</p>
                                        </div>
                                        <input
                                            value={bankDraft.bankName}
                                            onChange={e => setBankDraft(d => ({ ...d, bankName: e.target.value }))}
                                            placeholder="Bank name"
                                            className="w-full text-[13px] rounded-[12px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                            style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" }}
                                            autoFocus
                                        />
                                        <input
                                            value={bankDraft.accountNo}
                                            onChange={e => setBankDraft(d => ({ ...d, accountNo: e.target.value }))}
                                            placeholder="Account number"
                                            className="w-full text-[13px] rounded-[12px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                            style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" }}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingBankId(null)}
                                                className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 hover:bg-black/[0.06]"
                                                style={{ color: B[600] }}>Cancel</button>
                                            <button onClick={() => saveBank(acct.id)}
                                                className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150"
                                                style={{ backgroundColor: C.accent, color: 'white' }}>Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setDefaultBank(acct.id)}
                                        className="w-full rounded-[20px] p-4 text-left transition-all duration-200 cursor-pointer"
                                        style={{
                                            backgroundColor: acct.isDefault ? 'rgba(52,199,89,0.06)' : 'rgba(0,0,0,0.02)',
                                            boxShadow: acct.isDefault ? 'inset 0 0 0 1.5px rgba(52,199,89,0.3)' : 'none',
                                        }}>
                                        <div className="flex items-start gap-3.5">
                                            <CreditCard size={18} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: B[600] }} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[14px] font-medium" style={{ color: C.text }}>{acct.bankName}</p>
                                                    {acct.isDefault && (
                                                        <span className="text-[10px] font-semibold tracking-[0.02em] px-2 py-[3px] rounded-full"
                                                            style={{ backgroundColor: 'rgba(52,199,89,0.1)', color: C.success }}>
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>Account ending {acct.accountNo}</p>
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                                <button onClick={(e) => { e.stopPropagation(); setBankDraft({ bankName: acct.bankName, accountNo: acct.accountNo }); setEditingBankId(acct.id); }}
                                                    className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06]"
                                                    style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                                                    <Pencil size={12} strokeWidth={2} style={{ color: B[600] }} />
                                                </button>
                                                {bankAccounts.length > 1 && (
                                                    <button onClick={(e) => { e.stopPropagation(); deleteBank(acct.id); }}
                                                        className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06]"
                                                        style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                                                        <Trash2 size={12} strokeWidth={2} style={{ color: C.danger }} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Add bank account */}
                        {addingBank ? (
                            <div className="rounded-[20px] p-4 space-y-3" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                <div className="flex items-center gap-2">
                                    <CreditCard size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                    <p className="text-[13px] font-medium" style={{ color: C.text }}>New bank account</p>
                                </div>
                                <input
                                    value={bankDraft.bankName}
                                    onChange={e => setBankDraft(d => ({ ...d, bankName: e.target.value }))}
                                    placeholder="Bank name"
                                    className="w-full text-[13px] rounded-[12px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                    style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" }}
                                    autoFocus
                                />
                                <input
                                    value={bankDraft.accountNo}
                                    onChange={e => setBankDraft(d => ({ ...d, accountNo: e.target.value }))}
                                    placeholder="Account number"
                                    className="w-full text-[13px] rounded-[12px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                    style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" }}
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => { setAddingBank(false); setBankDraft({ bankName: '', accountNo: '' }); }}
                                        className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 hover:bg-black/[0.06]"
                                        style={{ color: B[600] }}>Cancel</button>
                                    <button onClick={addBank}
                                        className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150"
                                        style={{ backgroundColor: C.accent, color: 'white' }}>Add</button>
                                </div>
                            </div>
                        ) : (
                            <div role="button" tabIndex={0}
                                onClick={() => { setBankDraft({ bankName: '', accountNo: '' }); setAddingBank(true); }}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setBankDraft({ bankName: '', accountNo: '' }); setAddingBank(true); } }}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-[20px] text-[13px] font-medium transition-colors duration-150 hover:bg-black/[0.04] cursor-pointer outline-none"
                                style={{ backgroundColor: 'rgba(0,0,0,0.02)', color: B[600] }}>
                                <Plus size={15} strokeWidth={1.8} />
                                Add bank account
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── Appearance ── */}
            <SectionTitle>Appearance</SectionTitle>
            <div className="py-4">
                <div className="flex gap-3">
                    {([
                        { key: 'light', label: 'Light', icon: Sun },
                        { key: 'dark', label: 'Dark', icon: Moon },
                        { key: 'system', label: 'Auto', icon: Monitor },
                    ] as const).map(opt => {
                        const active = display.theme === opt.key;
                        const Icon = opt.icon;
                        return (
                            <div key={opt.key}
                                role="button" tabIndex={0}
                                onClick={() => { setDisplay((p: any) => ({ ...p, theme: opt.key })); toast(`Appearance: ${opt.label}`); }}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDisplay((p: any) => ({ ...p, theme: opt.key })); toast(`Appearance: ${opt.label}`); } }}
                                className={`appearance-${opt.key} group flex-1 flex flex-col items-center gap-3 py-6 rounded-[20px] transition-all duration-300 cursor-pointer outline-none relative overflow-hidden`}
                                style={{
                                    backgroundColor: active ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.015)',
                                    boxShadow: active ? 'inset 0 0 0 1.5px rgba(0,0,0,0.08)' : 'none',
                                }}>
                                {/* Hover CSS — injected once from the first card */}
                                {opt.key === 'light' && <style>{`
                                    .appearance-light:hover {
                                        background-color: rgba(255,248,230,0.55) !important;
                                        box-shadow:
                                            0 0 0 1px rgba(255,180,50,0.18),
                                            0 4px 20px -2px rgba(255,160,0,0.22),
                                            0 8px 40px -4px rgba(255,140,0,0.16),
                                            0 0 80px -8px rgba(255,160,0,0.2) !important;
                                    }
                                    .appearance-light:hover .theme-icon {
                                        filter:
                                            drop-shadow(0 0 4px rgba(255,160,0,1))
                                            drop-shadow(0 0 14px rgba(255,140,0,0.85))
                                            drop-shadow(0 0 32px rgba(255,120,0,0.55))
                                            drop-shadow(0 0 56px rgba(255,100,0,0.3));
                                        color: #FF8C00 !important;
                                        transform: scale(1.18) rotate(18deg);
                                    }
                                    .appearance-light:hover .theme-label { color: #D97706 !important; }

                                    .appearance-dark:hover {
                                        background-color: rgba(230,235,255,0.45) !important;
                                        box-shadow:
                                            0 0 0 1px rgba(130,150,255,0.15),
                                            0 4px 20px -2px rgba(120,140,255,0.2),
                                            0 8px 40px -4px rgba(100,110,255,0.14),
                                            0 0 80px -8px rgba(120,140,255,0.18) !important;
                                    }
                                    .appearance-dark:hover .theme-icon {
                                        filter:
                                            drop-shadow(0 0 4px rgba(160,175,255,1))
                                            drop-shadow(0 0 14px rgba(140,155,255,0.8))
                                            drop-shadow(0 0 32px rgba(110,120,255,0.5))
                                            drop-shadow(0 0 56px rgba(90,95,255,0.28));
                                        color: #A5B4FC !important;
                                        transform: scale(1.18) rotate(-15deg);
                                    }
                                    .appearance-dark:hover .theme-label { color: #818CF8 !important; }

                                    .appearance-system:hover {
                                        background-color: rgba(240,240,250,0.35) !important;
                                        box-shadow: 0 0 0 1px rgba(140,140,200,0.1), 0 4px 20px -4px rgba(140,140,200,0.14) !important;
                                    }
                                    .appearance-system:hover .theme-icon {
                                        filter: drop-shadow(0 0 8px rgba(140,140,200,0.55)) drop-shadow(0 0 24px rgba(120,120,180,0.3));
                                        transform: scale(1.1);
                                    }
                                `}</style>}
                                {/* Ambient radial glow — full card wash */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out pointer-events-none"
                                    style={{
                                        background: opt.key === 'light'
                                            ? 'radial-gradient(circle at 50% 20%, rgba(255,210,100,0.25) 0%, rgba(255,180,60,0.08) 35%, transparent 65%)'
                                            : opt.key === 'dark'
                                            ? 'radial-gradient(circle at 50% 20%, rgba(130,160,255,0.22) 0%, rgba(100,120,255,0.06) 35%, transparent 65%)'
                                            : 'radial-gradient(circle at 50% 20%, rgba(180,180,200,0.12) 0%, rgba(160,160,190,0.04) 30%, transparent 60%)',
                                    }} />
                                {/* Icon halo — concentrated glow behind icon */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[72%] w-[52px] h-[52px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-xl"
                                    style={{
                                        background: opt.key === 'light'
                                            ? 'rgba(255,170,0,0.5)'
                                            : opt.key === 'dark'
                                            ? 'rgba(140,155,255,0.4)'
                                            : 'rgba(140,140,200,0.2)',
                                    }} />
                                <Icon size={22} strokeWidth={1.4}
                                    className="theme-icon relative z-[1] transition-all duration-300"
                                    style={{ color: active ? C.text : B[600] }} />
                                <span className="text-[12px] font-medium relative z-[1] theme-label transition-all duration-300"
                                    style={{ color: active ? C.text : B[600] }}>{opt.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <SectionTitle>Display</SectionTitle>

            {/* Language picker */}
            <div className="mt-3">
                <div role="button" tabIndex={0}
                    onClick={() => { setLangOpen(!langOpen); setCurrOpen(false); }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLangOpen(!langOpen); setCurrOpen(false); } }}
                    className="w-full flex items-center gap-4 py-3.5 text-left cursor-pointer transition-opacity duration-150 hover:opacity-100 outline-none"
                    style={{ opacity: 0.88 }}>
                    <Languages size={18} strokeWidth={1.5} style={{ color: B[600] }} />
                    <span className="flex-1 text-[14px] font-medium" style={{ color: C.text }}>Language</span>
                    <span className="text-[13px] font-medium" style={{ color: B[600] }}>{display.language || 'English'}</span>
                    <ChevronDown size={14} strokeWidth={1.5}
                        className="transition-transform duration-200"
                        style={{ color: B[600], transform: langOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </div>
                {langOpen && (
                    <div className="rounded-[20px] overflow-hidden mb-2" style={{ backgroundColor: 'rgba(0,0,0,0.025)' }}>
                        {(['English', 'French', 'Spanish', 'German', 'Arabic', 'Chinese'] as const).map(lang => {
                            const active = (display.language || 'English') === lang;
                            return (
                                <div key={lang}
                                    role="button" tabIndex={0}
                                    onClick={() => { setDisplay((p: any) => ({ ...p, language: lang })); setLangOpen(false); toast(`Language: ${lang}`); }}
                                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDisplay((p: any) => ({ ...p, language: lang })); setLangOpen(false); toast(`Language: ${lang}`); } }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-100 hover:bg-black/[0.03] cursor-pointer outline-none">
                                    <span className="text-[13px] flex-1" style={{ color: active ? C.text : B[600] }}>{lang}</span>
                                    {active && <Check size={14} strokeWidth={2.5} style={{ color: C.success }} />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Sep />

            {/* Currency picker */}
            <div>
                <div role="button" tabIndex={0}
                    onClick={() => { setCurrOpen(!currOpen); setLangOpen(false); }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurrOpen(!currOpen); setLangOpen(false); } }}
                    className="w-full flex items-center gap-4 py-3.5 text-left cursor-pointer transition-opacity duration-150 hover:opacity-100 outline-none"
                    style={{ opacity: 0.88 }}>
                    <Globe size={18} strokeWidth={1.5} style={{ color: B[600] }} />
                    <span className="flex-1 text-[14px] font-medium" style={{ color: C.text }}>Currency</span>
                    <span className="text-[13px] font-medium" style={{ color: B[600] }}>{display.currency}</span>
                    <ChevronDown size={14} strokeWidth={1.5}
                        className="transition-transform duration-200"
                        style={{ color: B[600], transform: currOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </div>
                {currOpen && (
                    <div className="rounded-[20px] overflow-hidden mb-2" style={{ backgroundColor: 'rgba(0,0,0,0.025)' }}>
                        {([
                            { code: 'USD', label: 'US Dollar', symbol: '$' },
                            { code: 'EUR', label: 'Euro', symbol: '€' },
                            { code: 'GBP', label: 'British Pound', symbol: '£' },
                        ] as const).map(cur => {
                            const active = display.currency === cur.code;
                            return (
                                <div key={cur.code}
                                    role="button" tabIndex={0}
                                    onClick={() => { setDisplay((p: any) => ({ ...p, currency: cur.code })); setCurrOpen(false); toast(`Currency: ${cur.code}`); }}
                                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDisplay((p: any) => ({ ...p, currency: cur.code })); setCurrOpen(false); toast(`Currency: ${cur.code}`); } }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-100 hover:bg-black/[0.03] cursor-pointer outline-none">
                                    <span className="text-[15px] w-[20px] text-center" style={{ color: active ? C.text : B[600] }}>{cur.symbol}</span>
                                    <span className="text-[13px] flex-1" style={{ color: active ? C.text : B[600] }}>{cur.label}</span>
                                    <span className="text-[12px]" style={{ color: B[600] }}>{cur.code}</span>
                                    {active && <Check size={14} strokeWidth={2.5} style={{ color: C.success }} />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Document upload row ── */
function DocumentRow({ label, description, doc, onUpload, required }: {
    label: string; description: string;
    doc: { name: string; status: 'verified' | 'pending' | 'rejected' | 'none' };
    onUpload: () => void; required?: boolean;
}) {
    const [hovered, setHovered] = useState(false);
    const statusConfig = {
        verified: { icon: CheckCircle2, color: C.success, bg: 'rgba(52,199,89,0.08)', label: 'Verified' },
        pending: { icon: Clock, color: '#FF9500', bg: 'rgba(255,149,0,0.08)', label: 'Pending review' },
        rejected: { icon: AlertCircle, color: C.danger, bg: 'rgba(255,59,48,0.08)', label: 'Resubmit' },
        none: { icon: Upload, color: B[600], bg: 'transparent', label: '' },
    };
    const s = statusConfig[doc.status];
    const StatusIcon = s.icon;

    return (
        <div
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            className="flex items-center gap-4 p-4 rounded-[20px] transition-colors duration-150 cursor-pointer"
            style={{ backgroundColor: hovered ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.015)' }}
            onClick={onUpload}>
            <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: doc.status === 'none' ? 'rgba(0,0,0,0.03)' : s.bg }}>
                {doc.status === 'none'
                    ? <Files size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                    : <StatusIcon size={16} strokeWidth={1.5} style={{ color: s.color }} />
                }
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium" style={{ color: C.text }}>{label}</span>
                    {required && <span className="text-[10px] font-medium" style={{ color: C.danger }}>Required</span>}
                </div>
                <span className="text-[12px] block mt-0.5 truncate" style={{ color: B[600] }}>
                    {doc.name || description}
                </span>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
                {doc.status === 'verified' && (
                    <CheckCircle2 size={18} strokeWidth={1.8} style={{ color: C.success }} />
                )}
                {doc.status === 'pending' && (
                    <span className="text-[11px] font-medium" style={{ color: '#FF9500' }}>Pending</span>
                )}
                {doc.status === 'rejected' && (
                    <span className="text-[11px] font-medium" style={{ color: C.danger }}>Resubmit</span>
                )}
                {doc.status === 'none' ? (
                    <button className="text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors duration-150"
                        style={{ backgroundColor: C.accent, color: 'white' }}
                        onClick={(e) => { e.stopPropagation(); onUpload(); }}>
                        Upload
                    </button>
                ) : (
                    <button className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors duration-150 hover:bg-black/[0.04]"
                        style={{ color: C.accent }}
                        onClick={(e) => { e.stopPropagation(); onUpload(); }}>
                        Replace
                    </button>
                )}
            </div>
        </div>
    );
}

function AlertsTab({ notifications, setNotifications }: { notifications: any; setNotifications: any }) {
    const t = (k: string) => setNotifications((p: any) => ({ ...p, [k]: !p[k] }));

    /* ── Handler contacts state ── */
    const [handlers, setHandlers] = useState([
        { id: '1', name: 'James Mitchell', phone: '+44 7700 900123', email: 'james@acme-warehouse.com', role: 'Warehouse Manager' },
    ]);
    const [addingHandler, setAddingHandler] = useState(false);
    const [handlerDraft, setHandlerDraft] = useState({ name: '', phone: '', email: '', role: '' });
    const [editingHandlerId, setEditingHandlerId] = useState<string | null>(null);

    const addHandler = () => {
        if (!handlerDraft.name.trim() || !handlerDraft.phone.trim()) return;
        setHandlers(prev => [...prev, { id: Date.now().toString(), ...handlerDraft }]);
        setHandlerDraft({ name: '', phone: '', email: '', role: '' });
        setAddingHandler(false);
        toast('Handler added');
    };
    const saveHandler = (id: string) => {
        if (!handlerDraft.name.trim() || !handlerDraft.phone.trim()) return;
        setHandlers(prev => prev.map(h => h.id === id ? { ...h, ...handlerDraft } : h));
        setEditingHandlerId(null);
        toast('Handler updated');
    };
    const deleteHandler = (id: string) => {
        setHandlers(prev => prev.filter(h => h.id !== id));
        toast('Handler removed');
    };

    /* ── Quiet hours state ── */
    const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
    const [quietFrom, setQuietFrom] = useState('22:00');
    const [quietTo, setQuietTo] = useState('07:00');
    const [quietDays, setQuietDays] = useState<string[]>([...ALL_DAYS]);
    const [editingQuietHours, setEditingQuietHours] = useState(false);
    const [quietDraft, setQuietDraft] = useState({ from: '22:00', to: '07:00', days: [...ALL_DAYS] as string[] });

    const formatTime12 = (t24: string) => {
        const [h, m] = t24.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
    };
    const quietDaysSummary = (days: string[]) => {
        if (days.length === 7) return 'Every day';
        if (days.length === 5 && !days.includes('Sat') && !days.includes('Sun')) return 'Weekdays';
        if (days.length === 2 && days.includes('Sat') && days.includes('Sun')) return 'Weekends';
        return days.join(', ');
    };
    const toggleQuietDay = (day: string) => {
        setQuietDraft(prev => ({
            ...prev,
            days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day],
        }));
    };
    const saveQuietHours = () => {
        if (quietDraft.days.length === 0) { toast('Select at least one day'); return; }
        setQuietFrom(quietDraft.from);
        setQuietTo(quietDraft.to);
        setQuietDays([...quietDraft.days]);
        setEditingQuietHours(false);
        toast('Quiet hours updated');
    };

    const inputStyle = { backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" };

    return (
        <div>
            {/* ═══ Order Lifecycle ═══ */}
            <SectionTitle>Order lifecycle</SectionTitle>
            <p className="text-[12px] mt-1 mb-3" style={{ color: B[600] }}>
                Get notified at each stage of your order — from confirmation through fulfilment.
            </p>
            <Sep />
            <SettingRow icon={Package} label="Order confirmed" description="When an order is placed and accepted"
                right={<Toggle checked={notifications.orderConfirmed} onChange={() => t('orderConfirmed')} />}
                onClick={() => t('orderConfirmed')} />
            <Sep />
            <SettingRow icon={Clock} label="Order processing" description="Preparation, packing & quality checks"
                right={<Toggle checked={notifications.orderProcessing} onChange={() => t('orderProcessing')} />}
                onClick={() => t('orderProcessing')} />
            <Sep />
            <SettingRow icon={Pencil} label="Order modifications" description="Changes, amendments or quantity adjustments"
                right={<Toggle checked={notifications.orderModified} onChange={() => t('orderModified')} />}
                onClick={() => t('orderModified')} />
            <Sep />
            <SettingRow icon={AlertCircle} label="Order cancelled" description="Cancellation by you, seller or system"
                right={<Toggle checked={notifications.orderCancelled} onChange={() => t('orderCancelled')} />}
                onClick={() => t('orderCancelled')} />
            <Sep />
            <SettingRow icon={CheckCircle2} label="Payment confirmed" description="Successful payment processing"
                right={<Toggle checked={notifications.paymentConfirmed} onChange={() => t('paymentConfirmed')} />}
                onClick={() => t('paymentConfirmed')} />

            {/* ═══ Shipping & Delivery ═══ */}
            <SectionTitle>Shipping & delivery</SectionTitle>
            <p className="text-[12px] mt-1 mb-3" style={{ color: B[600] }}>
                Track shipments, containers, and delivery status in real time.
            </p>
            <Sep />
            <SettingRow icon={Truck} label="Shipment dispatched" description="When goods leave the origin warehouse"
                right={<Toggle checked={notifications.shipmentDispatched} onChange={() => t('shipmentDispatched')} />}
                onClick={() => t('shipmentDispatched')} />
            <Sep />
            <SettingRow icon={Ship} label="Container tracking" description="Real-time updates per container / pallet"
                right={<Toggle checked={notifications.containerTracking} onChange={() => t('containerTracking')} />}
                onClick={() => t('containerTracking')} />
            <Sep />
            <SettingRow icon={Calendar} label="Delivery schedule changes" description="ETA updates, delays & reschedules"
                right={<Toggle checked={notifications.deliveryScheduleChanges} onChange={() => t('deliveryScheduleChanges')} />}
                onClick={() => t('deliveryScheduleChanges')} />
            <Sep />
            <SettingRow icon={Archive} label="Partial deliveries" description="When multi-container orders ship separately"
                right={<Toggle checked={notifications.partialDeliveries} onChange={() => t('partialDeliveries')} />}
                onClick={() => t('partialDeliveries')} />
            <Sep />
            <SettingRow icon={CheckCircle2} label="Proof of delivery" description="Confirmation photos & signed receipts"
                right={<Toggle checked={notifications.proofOfDelivery} onChange={() => t('proofOfDelivery')} />}
                onClick={() => t('proofOfDelivery')} />
            <Sep />
            <SettingRow icon={Globe} label="Customs & clearance" description="International shipment status updates"
                right={<Toggle checked={notifications.customsClearance} onChange={() => t('customsClearance')} />}
                onClick={() => t('customsClearance')} />

            {/* ═══ Storage & Warehouse ═══ */}
            <SectionTitle>Storage & warehouse</SectionTitle>
            <p className="text-[12px] mt-1 mb-3" style={{ color: B[600] }}>
                Monitor your goods once they arrive at storage or warehouse facilities.
            </p>
            <Sep />
            <SettingRow icon={Warehouse} label="Goods received" description="When items arrive at your warehouse"
                right={<Toggle checked={notifications.goodsReceived} onChange={() => t('goodsReceived')} />}
                onClick={() => t('goodsReceived')} />
            <Sep />
            <SettingRow icon={AlertTriangle} label="Storage capacity" description="Alerts when storage is near capacity"
                right={<Toggle checked={notifications.storageCapacity} onChange={() => t('storageCapacity')} />}
                onClick={() => t('storageCapacity')} />
            <Sep />
            <SettingRow icon={DollarSign} label="Demurrage warnings" description="Storage duration & fee alerts"
                right={<Toggle checked={notifications.demurrageWarnings} onChange={() => t('demurrageWarnings')} />}
                onClick={() => t('demurrageWarnings')} />
            <Sep />
            <SettingRow icon={Thermometer} label="Condition monitoring" description="Temperature, humidity & environment alerts"
                right={<Toggle checked={notifications.conditionMonitoring} onChange={() => t('conditionMonitoring')} />}
                onClick={() => t('conditionMonitoring')} />

            {/* ═══ Delivery Handler ═══ */}
            <SectionTitle>Delivery handler</SectionTitle>
            <p className="text-[12px] mt-1 mb-3" style={{ color: B[600] }}>
                Add someone to receive orders on your behalf. They'll get delivery notifications alongside you.
            </p>

            {/* Handler contacts list */}
            <div className="space-y-2.5 mb-4">
                {handlers.map(handler => (
                    <div key={handler.id}>
                        {editingHandlerId === handler.id ? (
                            <div className="rounded-[20px] p-4 space-y-3" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                <div className="flex items-center gap-2">
                                    <UserPlus size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                    <p className="text-[13px] font-medium" style={{ color: C.text }}>Edit handler</p>
                                </div>
                                <input value={handlerDraft.name} onChange={e => setHandlerDraft(d => ({ ...d, name: e.target.value }))}
                                    placeholder="Full name *" className="w-full text-[13px] rounded-[14px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                    style={inputStyle} autoFocus />
                                <input value={handlerDraft.phone} onChange={e => setHandlerDraft(d => ({ ...d, phone: e.target.value }))}
                                    placeholder="Phone number *" className="w-full text-[13px] rounded-[14px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                    style={inputStyle} />
                                <input value={handlerDraft.email} onChange={e => setHandlerDraft(d => ({ ...d, email: e.target.value }))}
                                    placeholder="Email address (optional)" className="w-full text-[13px] rounded-[14px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                    style={inputStyle} />
                                <input value={handlerDraft.role} onChange={e => setHandlerDraft(d => ({ ...d, role: e.target.value }))}
                                    placeholder="Role — e.g. Warehouse Manager" className="w-full text-[13px] rounded-[14px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                    style={inputStyle} />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingHandlerId(null)}
                                        className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 hover:bg-black/[0.06]"
                                        style={{ color: B[600] }}>Cancel</button>
                                    <button onClick={() => saveHandler(handler.id)}
                                        className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150"
                                        style={{ backgroundColor: C.accent, color: 'white' }}>Save</button>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-[20px] p-4 transition-colors duration-150"
                                style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                <div className="flex items-start gap-3.5">
                                    <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                        style={{ backgroundColor: 'rgba(0,113,227,0.08)' }}>
                                        <User size={16} strokeWidth={1.5} style={{ color: C.accent }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[14px] font-medium" style={{ color: C.text }}>{handler.name}</p>
                                            {handler.role && (
                                                <span className="text-[10px] font-semibold tracking-[0.02em] px-2 py-[3px] rounded-full"
                                                    style={{ backgroundColor: 'rgba(0,113,227,0.08)', color: C.accent }}>
                                                    {handler.role}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <div className="flex items-center gap-1">
                                                <Phone size={11} strokeWidth={1.5} style={{ color: B[600] }} />
                                                <span className="text-[12px]" style={{ color: B[600] }}>{handler.phone}</span>
                                            </div>
                                            {handler.email && (
                                                <div className="flex items-center gap-1">
                                                    <Mail size={11} strokeWidth={1.5} style={{ color: B[600] }} />
                                                    <span className="text-[12px] truncate" style={{ color: B[600] }}>{handler.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <button onClick={() => { setHandlerDraft({ name: handler.name, phone: handler.phone, email: handler.email, role: handler.role }); setEditingHandlerId(handler.id); }}
                                            className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06]"
                                            style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                                            <Pencil size={12} strokeWidth={2} style={{ color: B[600] }} />
                                        </button>
                                        <button onClick={() => deleteHandler(handler.id)}
                                            className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06]"
                                            style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                                            <Trash2 size={12} strokeWidth={2} style={{ color: C.danger }} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Add handler form */}
                {addingHandler ? (
                    <div className="rounded-[20px] p-4 space-y-3" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                        <div className="flex items-center gap-2">
                            <UserPlus size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                            <p className="text-[13px] font-medium" style={{ color: C.text }}>New handler contact</p>
                        </div>
                        <input value={handlerDraft.name} onChange={e => setHandlerDraft(d => ({ ...d, name: e.target.value }))}
                            placeholder="Full name *" className="w-full text-[13px] rounded-[14px] px-3.5 py-2.5 outline-none transition-all duration-200"
                            style={inputStyle} autoFocus />
                        <input value={handlerDraft.phone} onChange={e => setHandlerDraft(d => ({ ...d, phone: e.target.value }))}
                            placeholder="Phone number *" className="w-full text-[13px] rounded-[14px] px-3.5 py-2.5 outline-none transition-all duration-200"
                            style={inputStyle} />
                        <input value={handlerDraft.email} onChange={e => setHandlerDraft(d => ({ ...d, email: e.target.value }))}
                            placeholder="Email address (optional)" className="w-full text-[13px] rounded-[14px] px-3.5 py-2.5 outline-none transition-all duration-200"
                            style={inputStyle} />
                        <input value={handlerDraft.role} onChange={e => setHandlerDraft(d => ({ ...d, role: e.target.value }))}
                            placeholder="Role — e.g. Receiving Agent, Forklift Operator" className="w-full text-[13px] rounded-[14px] px-3.5 py-2.5 outline-none transition-all duration-200"
                            style={inputStyle} />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setAddingHandler(false); setHandlerDraft({ name: '', phone: '', email: '', role: '' }); }}
                                className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 hover:bg-black/[0.06]"
                                style={{ color: B[600] }}>Cancel</button>
                            <button onClick={addHandler}
                                className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150"
                                style={{ backgroundColor: C.accent, color: 'white' }}>Add</button>
                        </div>
                    </div>
                ) : (
                    <div role="button" tabIndex={0}
                        onClick={() => { setHandlerDraft({ name: '', phone: '', email: '', role: '' }); setAddingHandler(true); }}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setHandlerDraft({ name: '', phone: '', email: '', role: '' }); setAddingHandler(true); } }}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-[20px] text-[13px] font-medium transition-colors duration-150 hover:bg-black/[0.04] cursor-pointer outline-none"
                        style={{ backgroundColor: 'rgba(0,0,0,0.02)', color: B[600] }}>
                        <Plus size={15} strokeWidth={1.8} />
                        Add a handler
                    </div>
                )}
            </div>

            {/* Handler notification toggles */}
            <Sep />
            <SettingRow icon={Bell} label="Notify handler" description="Send delivery alerts to all handlers"
                right={<Toggle checked={notifications.notifyHandler} onChange={() => t('notifyHandler')} />}
                onClick={() => t('notifyHandler')} />
            <Sep />
            <SettingRow icon={CheckCircle2} label="Handler confirmation" description="Require handler to confirm receipt"
                right={<Toggle checked={notifications.handlerConfirmation} onChange={() => t('handlerConfirmation')} />}
                onClick={() => t('handlerConfirmation')} />
            <Sep />
            <SettingRow icon={Share2} label="Share tracking" description="Auto-share live tracking link with handlers"
                right={<Toggle checked={notifications.shareTrackingWithHandler} onChange={() => t('shareTrackingWithHandler')} />}
                onClick={() => t('shareTrackingWithHandler')} />

            {/* ═══ Financial Alerts ═══ */}
            <SectionTitle>Financial alerts</SectionTitle>
            <p className="text-[12px] mt-1 mb-3" style={{ color: B[600] }}>
                Stay on top of payments, invoices and credit limits.
            </p>
            <Sep />
            <SettingRow icon={Clock} label="Payment due reminders" description="Upcoming and overdue payment alerts"
                right={<Toggle checked={notifications.paymentDueReminders} onChange={() => t('paymentDueReminders')} />}
                onClick={() => t('paymentDueReminders')} />
            <Sep />
            <SettingRow icon={AlertTriangle} label="Credit limit alerts" description="When credit usage exceeds thresholds"
                right={<Toggle checked={notifications.creditLimitAlerts} onChange={() => t('creditLimitAlerts')} />}
                onClick={() => t('creditLimitAlerts')} />
            <Sep />
            <SettingRow icon={TrendingDown} label="Price change alerts" description="Supplier price drops or increases"
                right={<Toggle checked={notifications.priceChangeAlerts} onChange={() => t('priceChangeAlerts')} />}
                onClick={() => t('priceChangeAlerts')} />
            <Sep />
            <SettingRow icon={Receipt} label="Invoice generated" description="When new invoices are ready to download"
                right={<Toggle checked={notifications.invoiceGenerated} onChange={() => t('invoiceGenerated')} />}
                onClick={() => t('invoiceGenerated')} />

            {/* ═══ Notification Channels ═══ */}
            <SectionTitle>Notification channels</SectionTitle>
            <p className="text-[12px] mt-1 mb-3" style={{ color: B[600] }}>
                Choose how you'd like to receive notifications.
            </p>
            <Sep />
            <SettingRow icon={Mail} label="Email" description="Summaries and detailed reports"
                right={<Toggle checked={notifications.emailNotifications} onChange={() => t('emailNotifications')} />}
                onClick={() => t('emailNotifications')} />
            <Sep />
            <SettingRow icon={Smartphone} label="Push notifications" description="Real-time alerts on your device"
                right={<Toggle checked={notifications.pushNotifications} onChange={() => t('pushNotifications')} />}
                onClick={() => t('pushNotifications')} />
            <Sep />
            <SettingRow icon={MessageSquare} label="SMS" description="Text messages for critical updates"
                right={<Toggle checked={notifications.smsNotifications} onChange={() => t('smsNotifications')} />}
                onClick={() => t('smsNotifications')} />
            <Sep />
            <SettingRow icon={MessageCircle} label="WhatsApp" description="Rich messages with tracking links"
                right={<Toggle checked={notifications.whatsappNotifications} onChange={() => t('whatsappNotifications')} />}
                onClick={() => t('whatsappNotifications')} />
            <Sep />
            <SettingRow icon={Volume2} label="Sound" description="Notification chime"
                right={<Toggle checked={notifications.sound} onChange={v => { setNotifications((p: any) => ({ ...p, sound: v })); toast(v ? 'Sound on' : 'Muted'); }} />}
                onClick={() => { const n = !notifications.sound; setNotifications((p: any) => ({ ...p, sound: n })); toast(n ? 'Sound on' : 'Muted'); }} />

            {/* ═══ Quiet Hours ═══ */}
            <SectionTitle>Quiet hours</SectionTitle>
            <p className="text-[12px] mt-1 mb-3" style={{ color: B[600] }}>
                Pause non-urgent notifications during set hours. Critical alerts will still come through.
            </p>
            <Sep />
            <SettingRow icon={BellOff} label="Enable quiet hours" description="Silence non-urgent alerts"
                right={<Toggle checked={notifications.quietHours} onChange={() => t('quietHours')} />}
                onClick={() => t('quietHours')} />
            {notifications.quietHours && !editingQuietHours && (
                <div className="rounded-[20px] p-4 mt-3" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <div className="flex items-center gap-3.5">
                        <Clock size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium" style={{ color: C.text }}>
                                {formatTime12(quietFrom)} — {formatTime12(quietTo)}
                            </p>
                            <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>
                                {quietDaysSummary(quietDays)}
                            </p>
                        </div>
                        <button onClick={() => { setQuietDraft({ from: quietFrom, to: quietTo, days: [...quietDays] }); setEditingQuietHours(true); }}
                            className="text-[12px] font-medium px-3 py-1 rounded-full transition-colors duration-150 hover:bg-black/[0.04]"
                            style={{ color: C.accent }}>
                            Edit
                        </button>
                    </div>
                </div>
            )}
            {notifications.quietHours && editingQuietHours && (
                <div className="rounded-[20px] p-5 mt-3 space-y-4" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <div className="flex items-center gap-2">
                        <BellOff size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                        <p className="text-[13px] font-medium" style={{ color: C.text }}>Edit quiet hours</p>
                    </div>

                    {/* Time pickers */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <label className="text-[11px] font-medium block mb-1.5" style={{ color: B[600] }}>From</label>
                            <input type="time" value={quietDraft.from}
                                onChange={e => setQuietDraft(d => ({ ...d, from: e.target.value }))}
                                className="w-full text-[13px] rounded-[14px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                style={inputStyle} />
                        </div>
                        <span className="text-[13px] mt-5" style={{ color: B[600] }}>—</span>
                        <div className="flex-1">
                            <label className="text-[11px] font-medium block mb-1.5" style={{ color: B[600] }}>To</label>
                            <input type="time" value={quietDraft.to}
                                onChange={e => setQuietDraft(d => ({ ...d, to: e.target.value }))}
                                className="w-full text-[13px] rounded-[14px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                style={inputStyle} />
                        </div>
                    </div>

                    {/* Day selector */}
                    <div>
                        <label className="text-[11px] font-medium block mb-2" style={{ color: B[600] }}>Active days</label>
                        <div className="flex gap-1.5">
                            {ALL_DAYS.map(day => {
                                const active = quietDraft.days.includes(day);
                                return (
                                    <button key={day} onClick={() => toggleQuietDay(day)}
                                        className="flex-1 py-2 rounded-[10px] text-[11px] font-semibold transition-all duration-200"
                                        style={{
                                            backgroundColor: active ? 'rgba(0,113,227,0.1)' : 'rgba(0,0,0,0.03)',
                                            color: active ? C.accent : B[600],
                                            boxShadow: active ? `inset 0 0 0 1.5px rgba(0,113,227,0.25)` : 'none',
                                        }}>
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick presets */}
                    <div className="flex gap-2">
                        {([
                            { label: 'Every day', days: [...ALL_DAYS] },
                            { label: 'Weekdays', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
                            { label: 'Weekends', days: ['Sat', 'Sun'] },
                        ] as const).map(preset => (
                            <button key={preset.label}
                                onClick={() => setQuietDraft(d => ({ ...d, days: [...preset.days] }))}
                                className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors duration-150 hover:bg-black/[0.04]"
                                style={{ backgroundColor: 'rgba(0,0,0,0.03)', color: B[600] }}>
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-1">
                        <button onClick={() => setEditingQuietHours(false)}
                            className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 hover:bg-black/[0.06]"
                            style={{ color: B[600] }}>Cancel</button>
                        <button onClick={saveQuietHours}
                            className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150"
                            style={{ backgroundColor: C.accent, color: 'white' }}>Save</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function OrdersTab({ orderSettings, setOrderSettings }: { orderSettings: any; setOrderSettings: any }) {
    const set = (k: string, v: any) => setOrderSettings((p: any) => ({ ...p, [k]: v }));
    const tog = (k: string, onMsg: string, offMsg: string) => { const n = !orderSettings[k]; set(k, n); toast(n ? onMsg : offMsg); };

    const trackingLabels: Record<string, string> = { realtime: 'Real-time', hourly: 'Every hour', daily: 'Once a day' };

    return (
        <div>
            {/* ═══ Your Orders ═══ */}
            <SectionTitle>Your orders</SectionTitle>
            <p className="text-[12px] mt-1 mb-3" style={{ color: B[600] }}>
                How your orders appear in the dashboard.
            </p>
            <Sep />
            <SettingRow icon={Clock} label="Sort by" description="Default order when you open the list"
                right={<span className="text-[13px] font-medium capitalize" style={{ color: B[600] }}>{orderSettings.defaultSort}</span>}
                onClick={() => {
                    const s = ['newest', 'oldest', 'amount'] as const;
                    const n = s[(s.indexOf(orderSettings.defaultSort) + 1) % s.length];
                    set('defaultSort', n);
                    toast(`Sorted by ${n}`);
                }} />
            <Sep />
            <SettingRow icon={Archive} label="Auto-archive" description={`Hide completed orders after ${orderSettings.autoArchiveDays} days`}
                right={<Toggle checked={orderSettings.autoArchive} onChange={v => { set('autoArchive', v); toast(v ? 'Auto-archive on' : 'Auto-archive off'); }} />}
                onClick={() => tog('autoArchive', 'Auto-archive on', 'Auto-archive off')} />
            <Sep />
            <SettingRow icon={Monitor} label="Compact view" description="Show smaller order cards to see more at once"
                right={<Toggle checked={orderSettings.compactOrderCards} onChange={v => { set('compactOrderCards', v); toast(v ? 'Compact view' : 'Normal view'); }} />}
                onClick={() => tog('compactOrderCards', 'Compact view', 'Normal view')} />

            {/* ═══ Live Tracking ═══ */}
            <SectionTitle>Live tracking</SectionTitle>
            <p className="text-[12px] mt-1 mb-3" style={{ color: B[600] }}>
                Follow your deliveries from warehouse to your door.
            </p>
            <Sep />
            <SettingRow icon={Truck} label="Tracking updates" description="How often we refresh your delivery status"
                right={<span className="text-[13px] font-medium" style={{ color: B[600] }}>{trackingLabels[orderSettings.trackingUpdates]}</span>}
                onClick={() => {
                    const s = ['realtime', 'hourly', 'daily'] as const;
                    const n = s[(s.indexOf(orderSettings.trackingUpdates) + 1) % s.length];
                    set('trackingUpdates', n);
                    toast(`Updates: ${trackingLabels[n]}`);
                }} />
            <Sep />
            <SettingRow icon={Share2} label="Share tracking link" description="Let others follow your delivery with a link"
                right={<Toggle checked={orderSettings.shareTrackingLink} onChange={v => { set('shareTrackingLink', v); toast(v ? 'Sharing enabled' : 'Sharing disabled'); }} />}
                onClick={() => tog('shareTrackingLink', 'Sharing enabled', 'Sharing disabled')} />

            {/* ═══ Payment ═══ */}
            <SectionTitle>Payment</SectionTitle>
            <p className="text-[12px] mt-1 mb-3" style={{ color: B[600] }}>
                You pay when the delivery arrives — no upfront charges.
            </p>
            <Sep />
            <SettingRow icon={CreditCard} label="Payment methods" description="Manage your saved cards and accounts" onClick={() => toast('Opening payment methods...')} />
            <Sep />
            <SettingRow icon={DollarSign} label="Currency" description="Prices and receipts shown in this currency"
                right={<span className="text-[13px] font-medium" style={{ color: B[600] }}>{orderSettings.defaultCurrency}</span>}
                onClick={() => {
                    const s = ['USD', 'EUR', 'GBP'] as const;
                    const n = s[(s.indexOf(orderSettings.defaultCurrency) + 1) % s.length];
                    set('defaultCurrency', n);
                    toast(`Currency: ${n}`);
                }} />
            <Sep />
            <SettingRow icon={Mail} label="Email receipts" description="Get a receipt in your inbox after every delivery"
                right={<Toggle checked={orderSettings.emailReceipts} onChange={v => { set('emailReceipts', v); toast(v ? 'Receipts on' : 'Receipts off'); }} />}
                onClick={() => tog('emailReceipts', 'Receipts on', 'Receipts off')} />

            {/* ═══ Delivery Address ═══ */}
            <SectionTitle>Delivery</SectionTitle>
            <Sep />
            <SettingRow icon={MapPin} label="Delivery addresses" description="Where we bring your containers" onClick={() => toast('Opening addresses...')} />
            <Sep />
            <SettingRow icon={FileText} label="Past receipts" description="Download receipts from previous deliveries" onClick={() => toast('Opening receipts...')} />
        </div>
    );
}

/* SellerFulfillmentTab — extracted to ./settings/SellerFulfillmentTab.tsx */

/* SellerAlertsTab — extracted to ./settings/SellerAlertsTab.tsx */

/* ── 2FA Method Row ── */
function TwoFAMethodRow({
    icon: Icon, title, description, enabled, onAction, actionLabel, index,
}: {
    icon: React.ElementType; title: string; description: string;
    enabled: boolean; onAction: () => void; actionLabel?: string; index: number;
}) {
    const rowRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState(false);
    const handleClick = () => {
        const el = rowRef.current;
        if (el) {
            el.animate([
                { transform: 'scale(1)', offset: 0 },
                { transform: 'scale(0.985)', offset: 0.15 },
                { transform: 'scale(1.004)', offset: 0.5 },
                { transform: 'scale(1)', offset: 1 },
            ], { duration: 380, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
        }
        onAction();
    };
    const label = actionLabel || (enabled ? 'Active' : 'Set up');
    return (
        <motion.div ref={rowRef}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + index * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            className="flex items-center gap-4 px-5 py-[18px] cursor-pointer transition-colors duration-200"
            style={{ backgroundColor: hovered ? 'rgba(0,0,0,0.025)' : 'transparent' }}>
            <div className="w-[36px] h-[36px] rounded-[11px] flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{
                    backgroundColor: enabled ? 'rgba(52,199,89,0.1)' : `rgba(0,0,0,0.04)`,
                }}>
                <Icon size={17} strokeWidth={1.6}
                    style={{ color: enabled ? C.success : B[600] }} />
            </div>
            <div className="flex-1 min-w-0">
                <span className="text-[14px] font-medium block" style={{ color: C.text }}>{title}</span>
                <span className="text-[12.5px] block mt-0.5" style={{ color: B[600] }}>{description}</span>
            </div>
            <div className="flex-shrink-0">
                {enabled && !actionLabel ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: 'rgba(52,199,89,0.1)' }}>
                        <Check size={12} strokeWidth={2.5} style={{ color: C.success }} />
                        <span className="text-[11.5px] font-semibold" style={{ color: C.success }}>Active</span>
                    </motion.div>
                ) : (
                    <span className="text-[12.5px] font-semibold transition-colors duration-150"
                        style={{ color: hovered ? C.accent : B[600] }}>
                        {label} <ChevronRight size={11} strokeWidth={2.5} className="inline-block ml-0.5" style={{ verticalAlign: 'middle' }} />
                    </span>
                )}
            </div>
        </motion.div>
    );
}

/* ── Protection Score Ring ── */
function ProtectionScoreRing({ score }: { score: number }) {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? C.success : score >= 50 ? '#FF9500' : C.danger;
    return (
        <div className="relative w-[68px] h-[68px] flex items-center justify-center flex-shrink-0">
            <svg width="68" height="68" viewBox="0 0 68 68" className="absolute inset-0 -rotate-90">
                <circle cx="34" cy="34" r={radius} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="5" />
                <motion.circle cx="34" cy="34" r={radius} fill="none" stroke={color} strokeWidth="5"
                    strokeLinecap="round" strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ type: 'spring', damping: 20, stiffness: 80, delay: 0.2 }} />
            </svg>
            <span className="text-[17px] font-bold" style={{ color }}>{score}%</span>
        </div>
    );
}

/* ── SMS Setup Panel — phone already verified at registration ── */
function SMSSetupPanel({ onNumberChanged, onClose }: {
    onNumberChanged: (phone: string) => void; onClose: () => void;
}) {
    const REGISTERED_PHONE = '+1 (555) •••-4829';
    const [step, setStep] = useState<'view' | 'auth' | 'newNumber' | 'verify'>('view');
    const [password, setPassword] = useState('');
    const [pin, setPin] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [authError, setAuthError] = useState('');

    /* Step 1: View current number */
    if (step === 'view') {
        return (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                className="mt-3 rounded-[14px] p-5"
                style={{ backgroundColor: 'rgba(52,199,89,0.04)', border: '1px solid rgba(52,199,89,0.1)' }}>
                <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 size={16} strokeWidth={2} style={{ color: C.success }} />
                    <span className="text-[13px] font-semibold" style={{ color: C.success }}>Phone verified</span>
                </div>
                <p className="text-[12.5px] mb-1" style={{ color: B[600] }}>Registered number</p>
                <p className="text-[15px] font-semibold mb-4" style={{ color: C.text }}>{REGISTERED_PHONE}</p>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setStep('auth')}
                        className="text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] transition-all duration-150 active:scale-[0.97]"
                        style={{ color: C.accent, backgroundColor: 'rgba(0,113,227,0.06)' }}>
                        Change number
                    </button>
                    <button onClick={onClose}
                        className="text-[12.5px] font-medium px-3.5 py-2 rounded-[9px]"
                        style={{ color: B[600] }}>Done</button>
                </div>
            </motion.div>
        );
    }

    /* Step 2: Authenticate — password + transaction PIN */
    if (step === 'auth') {
        return (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                className="mt-3 rounded-[14px] p-5"
                style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div className="flex items-center gap-2.5 mb-1">
                    <Lock size={15} strokeWidth={1.8} style={{ color: C.text }} />
                    <p className="text-[13px] font-semibold" style={{ color: C.text }}>Identity verification required</p>
                </div>
                <p className="text-[12px] mb-5" style={{ color: B[600] }}>
                    For your security, enter your account password and transaction PIN to change your phone number.
                </p>
                {authError && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 mb-4 p-3 rounded-[10px]"
                        style={{ backgroundColor: 'rgba(255,59,48,0.06)' }}>
                        <AlertTriangle size={13} strokeWidth={1.8} style={{ color: C.danger }} />
                        <span className="text-[12px] font-medium" style={{ color: C.danger }}>{authError}</span>
                    </motion.div>
                )}
                <div className="space-y-4 mb-5">
                    <div>
                        <label className="text-[12px] font-medium block mb-2" style={{ color: B[600] }}>Account password</label>
                        <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password}
                                onChange={e => { setPassword(e.target.value); setAuthError(''); }}
                                className="w-full rounded-[10px] px-4 py-3 pr-10 text-[14px] font-normal transition-all duration-200 outline-none"
                                style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text }} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md" style={{ color: B[600] }}>
                                <Eye size={15} strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-[12px] font-medium block mb-2" style={{ color: B[600] }}>Transaction PIN</label>
                        <div className="flex gap-2">
                            {[0, 1, 2, 3].map(idx => (
                                <input key={idx} type="password" maxLength={1}
                                    value={pin[idx] || ''}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        const newPin = pin.split('');
                                        newPin[idx] = val;
                                        setPin(newPin.join(''));
                                        setAuthError('');
                                        if (val && e.target.nextElementSibling) (e.target.nextElementSibling as HTMLInputElement).focus();
                                    }}
                                    className="w-[44px] h-[44px] rounded-[10px] text-center text-[18px] font-semibold outline-none transition-all duration-200"
                                    style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text }} />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={() => { setStep('view'); setPassword(''); setPin(''); setAuthError(''); }}
                        className="px-4 py-2.5 rounded-[10px] text-[12.5px] font-medium"
                        style={{ color: B[600] }}>Cancel</button>
                    <button onClick={() => {
                        if (!password.trim()) { setAuthError('Please enter your password'); return; }
                        if (pin.length < 4) { setAuthError('Please enter your 4-digit transaction PIN'); return; }
                        setStep('newNumber'); toast.success('Identity verified');
                    }}
                        className="px-4 py-2.5 rounded-[10px] text-[12.5px] font-semibold text-white transition-all duration-150 active:scale-[0.97]"
                        style={{ backgroundColor: C.accent }}>
                        Continue
                    </button>
                </div>
            </motion.div>
        );
    }

    /* Step 3: Enter new phone number */
    if (step === 'newNumber') {
        return (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                className="mt-3 rounded-[14px] p-5"
                style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                <p className="text-[13px] font-semibold mb-1" style={{ color: C.text }}>Enter new phone number</p>
                <p className="text-[12px] mb-4" style={{ color: B[600] }}>We'll send a verification code to your new number.</p>
                <div className="mb-2 p-3 rounded-[10px] flex items-center gap-2.5"
                    style={{ backgroundColor: 'rgba(0,0,0,0.025)' }}>
                    <span className="text-[11.5px]" style={{ color: B[600] }}>Current:</span>
                    <span className="text-[12px] font-semibold" style={{ color: C.text }}>{REGISTERED_PHONE}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: 'rgba(52,199,89,0.1)', color: C.success }}>Active</span>
                </div>
                <div className="mb-4 mt-4">
                    <label className="text-[12px] font-medium block mb-2" style={{ color: B[600] }}>New phone number</label>
                    <input type="tel" placeholder="+1 (555) 000-0000" value={newPhone}
                        onChange={e => setNewPhone(e.target.value)}
                        className="w-full rounded-[10px] px-4 py-3 text-[14px] font-normal transition-all duration-200 outline-none"
                        style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text }} />
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setStep('view')}
                        className="px-4 py-2.5 rounded-[10px] text-[12.5px] font-medium"
                        style={{ color: B[600] }}>Cancel</button>
                    <button onClick={() => {
                        if (!newPhone.trim()) { toast.error('Please enter a phone number'); return; }
                        setStep('verify'); toast('Verification code sent to new number');
                    }}
                        className="px-4 py-2.5 rounded-[10px] text-[12.5px] font-semibold text-white transition-all duration-150 active:scale-[0.97]"
                        style={{ backgroundColor: C.accent }}>
                        Send verification code
                    </button>
                </div>
            </motion.div>
        );
    }

    /* Step 4: Verify new number */
    return (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="mt-3 rounded-[14px] p-5"
            style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <p className="text-[13px] font-semibold mb-1" style={{ color: C.text }}>Verify new number</p>
            <p className="text-[12px] mb-4" style={{ color: B[600] }}>
                Enter the 6-digit code we sent to {newPhone || 'your new number'}.
            </p>
            <div className="flex gap-2 mb-4">
                {[0, 1, 2, 3, 4, 5].map(idx => (
                    <input key={idx} type="text" maxLength={1}
                        value={verifyCode[idx] || ''}
                        onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            const newCode = verifyCode.split('');
                            newCode[idx] = val;
                            setVerifyCode(newCode.join(''));
                            if (val && e.target.nextElementSibling) (e.target.nextElementSibling as HTMLInputElement).focus();
                        }}
                        className="w-[40px] h-[44px] rounded-[10px] text-center text-[16px] font-semibold outline-none transition-all duration-200"
                        style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text }} />
                ))}
            </div>
            <div className="flex justify-end gap-2">
                <button onClick={() => { setStep('newNumber'); setVerifyCode(''); toast('New code sent'); }}
                    className="text-[12.5px] font-medium px-3.5 py-2.5 rounded-[10px]"
                    style={{ color: C.accent }}>
                    Resend code
                </button>
                <button onClick={() => { onNumberChanged(newPhone); toast.success('Phone number updated!'); }}
                    className="px-4 py-2.5 rounded-[10px] text-[12.5px] font-semibold text-white transition-all duration-150 active:scale-[0.97]"
                    style={{ backgroundColor: C.accent }}>
                    Verify & update
                </button>
            </div>
        </motion.div>
    );
}

/* ── Auth App Setup Panel ── */
function AuthAppSetupPanel({ onEnable, onClose }: {
    onEnable: () => void; onClose: () => void;
}) {
    const [step, setStep] = useState<'scan' | 'done'>('scan');
    const [verifyCode, setVerifyCode] = useState('');
    const MANUAL_KEY = 'JBSW-Y3DP-EHPK-3PXP';

    if (step === 'done') {
        return (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-3 rounded-[14px] p-5"
                style={{ backgroundColor: 'rgba(52,199,89,0.04)', border: '1px solid rgba(52,199,89,0.1)' }}>
                <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 size={16} strokeWidth={2} style={{ color: C.success }} />
                    <span className="text-[13px] font-semibold" style={{ color: C.success }}>Authenticator app connected</span>
                </div>
                <p className="text-[12px] mb-3" style={{ color: B[600] }}>Your app will generate a new code every 30 seconds.</p>
                <button onClick={onClose}
                    className="text-[12.5px] font-medium px-3.5 py-2 rounded-[9px]"
                    style={{ color: B[600] }}>
                    Done
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="mt-3 rounded-[14px] p-5"
            style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>

            {step === 'scan' && (
                <>
                    <p className="text-[13px] font-semibold mb-1" style={{ color: C.text }}>Set up authenticator app</p>
                    <p className="text-[12px] mb-5" style={{ color: B[600] }}>
                        Open your authenticator app (Google Authenticator, Authy, etc.) and scan this code.
                    </p>
                    <div className="flex justify-center mb-5">
                        <div className="w-[140px] h-[140px] rounded-[12px] flex items-center justify-center"
                            style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.08)' }}>
                            <div className="grid grid-cols-7 gap-[3px] p-3">
                                {Array.from({ length: 49 }).map((_, i) => (
                                    <div key={i} className="w-[11px] h-[11px] rounded-[2px]"
                                        style={{
                                            backgroundColor: [0,1,2,4,5,6,7,8,12,14,18,20,21,22,23,24,25,27,28,30,34,35,36,38,40,42,43,44,45,46,47,48].includes(i)
                                                ? C.text : 'transparent'
                                        }} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mb-4 p-3 rounded-[10px]" style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
                        <p className="text-[11px] font-medium mb-1.5" style={{ color: B[600] }}>Can't scan? Enter this key manually:</p>
                        <div className="flex items-center gap-2">
                            <span className="text-[14px] font-mono font-semibold tracking-wider" style={{ color: C.text }}>{MANUAL_KEY}</span>
                            <button onClick={() => { navigator.clipboard?.writeText(MANUAL_KEY.replace(/-/g, '')); toast.success('Key copied'); }}>
                                <Copy size={13} strokeWidth={1.8} style={{ color: B[600] }} />
                            </button>
                        </div>
                    </div>
                    {/* Inline step separator + code entry */}
                    <div className="flex items-center gap-2.5 mb-3 mt-1">
                        <div className="h-px flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
                        <span className="text-[11px] font-medium" style={{ color: B[500] }}>Then, enter the code from your app</span>
                        <div className="h-px flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
                    </div>
                    <div className="mb-5">
                        <div className="flex gap-2 justify-center">
                            {[0, 1, 2, 3, 4, 5].map(idx => (
                                <input key={idx} type="text" inputMode="numeric" maxLength={1}
                                    value={verifyCode[idx] || ''}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        const newCode = verifyCode.split('');
                                        newCode[idx] = val;
                                        setVerifyCode(newCode.join(''));
                                        if (val && e.target.nextElementSibling) (e.target.nextElementSibling as HTMLInputElement).focus();
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Backspace' && !verifyCode[idx] && idx > 0) {
                                            const prev = (e.target as HTMLInputElement).previousElementSibling as HTMLInputElement;
                                            if (prev) prev.focus();
                                        }
                                    }}
                                    className="w-[42px] h-[46px] rounded-[10px] text-center text-[17px] font-semibold outline-none transition-all duration-200"
                                    style={{
                                        backgroundColor: 'white',
                                        border: `1.5px solid ${verifyCode[idx] ? C.accent : 'rgba(0,0,0,0.1)'}`,
                                        color: C.text,
                                        boxShadow: verifyCode[idx] ? '0 0 0 3px rgba(0,113,227,0.08)' : 'none',
                                    }} />
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button onClick={onClose} className="px-4 py-2.5 rounded-[10px] text-[12.5px] font-medium" style={{ color: B[600] }}>Cancel</button>
                        <button onClick={() => {
                            if (verifyCode.length >= 6) {
                                setStep('done'); onEnable(); toast.success('Authenticator verified!');
                            } else {
                                toast.error('Please enter the 6-digit code from your app');
                            }
                        }}
                            className="px-4 py-2.5 rounded-[10px] text-[12.5px] font-semibold text-white transition-all duration-150 active:scale-[0.97]"
                            style={{ backgroundColor: C.accent, opacity: verifyCode.length >= 6 ? 1 : 0.5 }}>
                            Verify & enable
                        </button>
                    </div>
                </>
            )}
        </motion.div>
    );
}

/* ── Fake QR Code Canvas ── */
function FakeQRCode({ size = 140 }: { size?: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const s = size;
        canvas.width = s; canvas.height = s;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, s, s);
        const moduleSize = Math.floor(s / 25);
        const drawFinderPattern = (x: number, y: number) => {
            ctx.fillStyle = '#000';
            ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
        };
        drawFinderPattern(moduleSize, moduleSize);
        drawFinderPattern(s - 8 * moduleSize, moduleSize);
        drawFinderPattern(moduleSize, s - 8 * moduleSize);
        let seed = 42;
        const next = () => { seed = (seed * 16807 + 7) % 2147483647; return (seed & 0x7fffffff) / 0x7fffffff; };
        ctx.fillStyle = '#000';
        for (let row = 0; row < 25; row++) {
            for (let col = 0; col < 25; col++) {
                const inFinder = (row < 9 && col < 9) || (row < 9 && col > 15) || (row > 15 && col < 9);
                if (inFinder) continue;
                if (next() > 0.55) ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
            }
        }
    }, [size]);
    return <canvas ref={canvasRef} width={size} height={size} className="rounded-[8px]" />;
}

/* ── Passkey Setup Panel (multi-step) ── */
type PasskeyMethod = 'choose' | 'this-device' | 'another-device' | 'security-key';
type PasskeyStep = 'choose-method' | 'name-device' | 'biometric-prompt' | 'qr-scan' | 'qr-waiting' | 'key-insert' | 'key-waiting' | 'success';

function PasskeySetupPanel({ onRegister, onClose }: {
    onRegister: (name: string, deviceType: string) => void; onClose: () => void;
}) {
    const [method, setMethod] = useState<PasskeyMethod>('choose');
    const [step, setStep] = useState<PasskeyStep>('choose-method');
    const [deviceName, setDeviceName] = useState('');
    const [processing, setProcessing] = useState(false);
    const [countdown, setCountdown] = useState(120);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const startCountdown = () => {
        setCountdown(120);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const selectMethod = (m: PasskeyMethod) => {
        setMethod(m);
        if (m === 'this-device') setStep('name-device');
        else if (m === 'another-device') { setStep('qr-scan'); startCountdown(); }
        else if (m === 'security-key') setStep('key-insert');
    };

    const handleBiometricPrompt = () => {
        setProcessing(true);
        setStep('biometric-prompt');
        setTimeout(() => { setProcessing(false); setStep('success'); }, 2000);
    };

    const handleQrScanned = () => {
        setStep('qr-waiting');
        setTimeout(() => setStep('name-device'), 1800);
    };

    const handleKeyInsert = () => {
        setStep('key-waiting');
        setProcessing(true);
        setTimeout(() => { setProcessing(false); setStep('name-device'); }, 2200);
    };

    const handleFinish = () => {
        if (!deviceName.trim()) { toast.error('Please name this passkey'); return; }
        if (method === 'this-device') { handleBiometricPrompt(); }
        else { setProcessing(true); setTimeout(() => { setStep('success'); setProcessing(false); }, 800); }
    };

    const handleDone = () => {
        const dtype = method === 'another-device' ? 'phone' : method === 'security-key' ? 'key' : 'laptop';
        onRegister(deviceName.trim(), dtype);
    };

    const methodOptions: { id: PasskeyMethod; icon: typeof Fingerprint; label: string; desc: string; badge?: string }[] = [
        { id: 'this-device', icon: Fingerprint, label: 'This device', desc: 'Use fingerprint, face, or PIN on this device', badge: 'Recommended' },
        { id: 'another-device', icon: QrCode, label: 'Use a phone or tablet', desc: 'Scan a QR code with your mobile device' },
        { id: 'security-key', icon: Key, label: 'Security key', desc: 'Use a USB or NFC security key' },
    ];

    const stepNumber = step === 'choose-method' ? 1 :
        (step === 'name-device' && method === 'this-device') ? 2 :
        (step === 'biometric-prompt') ? 3 :
        (step === 'qr-scan' || step === 'key-insert') ? 2 :
        (step === 'qr-waiting' || step === 'key-waiting') ? 2 :
        (step === 'name-device') ? 3 :
        (step === 'success') ? (method === 'this-device' ? 3 : 4) : 1;
    const totalSteps = method === 'this-device' ? 3 : method === 'choose' ? 1 : 4;

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="mt-4 rounded-[16px] overflow-hidden"
            style={{ backgroundColor: 'rgba(0,113,227,0.025)', border: '1px solid rgba(0,113,227,0.10)' }}>

            {/* Header with step indicator */}
            <div className="px-5 pt-5 pb-0">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-[13.5px] font-semibold" style={{ color: C.text }}>
                        {step === 'choose-method' ? 'Add a passkey' :
                         step === 'success' ? 'Passkey registered' :
                         step === 'biometric-prompt' ? 'Verifying identity' :
                         step === 'qr-scan' ? 'Scan QR code' :
                         step === 'qr-waiting' ? 'Confirming on device' :
                         step === 'key-insert' ? 'Insert security key' :
                         step === 'key-waiting' ? 'Reading key…' :
                         'Name your passkey'}
                    </p>
                    {step !== 'success' && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                            style={{ color: B[600], backgroundColor: 'rgba(0,0,0,0.04)' }}>
                            Step {stepNumber} of {totalSteps}
                        </span>
                    )}
                </div>
                <div className="h-[2px] rounded-full mt-3 overflow-hidden" style={{ backgroundColor: 'rgba(0,113,227,0.08)' }}>
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: step === 'success' ? C.success : C.accent }}
                        initial={{ width: '0%' }}
                        animate={{ width: step === 'success' ? '100%' : `${(stepNumber / totalSteps) * 100}%` }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }} />
                </div>
            </div>

            <div className="p-5 pt-4">
                <AnimatePresence mode="wait">
                    {/* Step 1: Choose method */}
                    {step === 'choose-method' && (
                        <motion.div key="choose" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
                            <p className="text-[12px] mb-4" style={{ color: B[600] }}>
                                Choose how you'd like to create your passkey.
                            </p>
                            <div className="space-y-2">
                                {methodOptions.map(opt => (
                                    <button key={opt.id} onClick={() => selectMethod(opt.id)}
                                        className="w-full flex items-center gap-3.5 p-3.5 rounded-[12px] text-left transition-all duration-150 active:scale-[0.985] group"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.06)' }}>
                                        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: 'rgba(0,113,227,0.07)' }}>
                                            <opt.icon size={18} strokeWidth={1.6} style={{ color: C.accent }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] font-semibold" style={{ color: C.text }}>{opt.label}</span>
                                                {opt.badge && (
                                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                                        style={{ backgroundColor: 'rgba(52,199,89,0.10)', color: C.success }}>
                                                        {opt.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11.5px] mt-0.5" style={{ color: B[600] }}>{opt.desc}</p>
                                        </div>
                                        <ChevronRight size={14} strokeWidth={2} style={{ color: B[100] }} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* QR Code scan step */}
                    {step === 'qr-scan' && (
                        <motion.div key="qr" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
                            <p className="text-[12px] mb-5" style={{ color: B[600] }}>
                                Open the camera app on your phone or tablet and scan this QR code.
                            </p>
                            <div className="flex flex-col items-center mb-5">
                                <div className="p-4 rounded-[14px] mb-3" style={{ backgroundColor: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                                    <FakeQRCode size={160} />
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: C.accent }} />
                                    <span className="text-[11.5px] font-medium" style={{ color: B[600] }}>
                                        Waiting for scan · {formatTime(countdown)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-[10px] mb-4"
                                style={{ backgroundColor: 'rgba(0,0,0,0.025)' }}>
                                <Smartphone size={15} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: B[600] }} />
                                <div>
                                    <p className="text-[11.5px] font-medium" style={{ color: C.text }}>Don't have your phone nearby?</p>
                                    <p className="text-[11px] mt-0.5" style={{ color: B[600] }}>
                                        You can also text yourself a link. Open it on your mobile device to continue.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                                <button onClick={() => { setStep('choose-method'); setMethod('choose'); if (timerRef.current) clearInterval(timerRef.current); }}
                                    className="text-[12.5px] font-medium px-3 py-2 rounded-[10px] transition-colors"
                                    style={{ color: B[600] }}>
                                    ← Back
                                </button>
                                <button onClick={handleQrScanned}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[12.5px] font-semibold transition-all duration-150 active:scale-[0.97]"
                                    style={{ backgroundColor: 'rgba(0,113,227,0.08)', color: C.accent }}>
                                    <Smartphone size={13} strokeWidth={2} />
                                    Simulate scan
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* QR waiting / confirming */}
                    {step === 'qr-waiting' && (
                        <motion.div key="qr-wait" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="flex flex-col items-center py-6">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                className="w-10 h-10 rounded-full border-[2.5px] mb-4"
                                style={{ borderColor: 'rgba(0,113,227,0.15)', borderTopColor: C.accent }} />
                            <p className="text-[13px] font-semibold mb-1" style={{ color: C.text }}>QR code scanned</p>
                            <p className="text-[12px] text-center" style={{ color: B[600] }}>
                                Complete the verification on your mobile device…
                            </p>
                            <div className="flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full"
                                style={{ backgroundColor: 'rgba(52,199,89,0.08)' }}>
                                <CheckCircle2 size={13} strokeWidth={2} style={{ color: C.success }} />
                                <span className="text-[11px] font-medium" style={{ color: C.success }}>Device connected</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Security key insert */}
                    {step === 'key-insert' && (
                        <motion.div key="key-insert" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
                            <p className="text-[12px] mb-5" style={{ color: B[600] }}>
                                Insert your security key into a USB port, or hold it near your device for NFC.
                            </p>
                            <div className="flex flex-col items-center py-5 mb-4">
                                <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mb-4"
                                    style={{ backgroundColor: 'rgba(0,113,227,0.06)' }}>
                                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                                        <Key size={28} strokeWidth={1.4} style={{ color: C.accent }} />
                                    </motion.div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#ff9500' }} />
                                    <span className="text-[12px] font-medium" style={{ color: B[700] }}>Waiting for security key…</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                                <button onClick={() => { setStep('choose-method'); setMethod('choose'); }}
                                    className="text-[12.5px] font-medium px-3 py-2 rounded-[10px] transition-colors"
                                    style={{ color: B[600] }}>
                                    ← Back
                                </button>
                                <button onClick={handleKeyInsert}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[12.5px] font-semibold transition-all duration-150 active:scale-[0.97]"
                                    style={{ backgroundColor: 'rgba(0,113,227,0.08)', color: C.accent }}>
                                    <Key size={13} strokeWidth={2} />
                                    Simulate key touch
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Security key reading */}
                    {step === 'key-waiting' && (
                        <motion.div key="key-wait" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="flex flex-col items-center py-6">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                className="w-10 h-10 rounded-full border-[2.5px] mb-4"
                                style={{ borderColor: 'rgba(0,113,227,0.15)', borderTopColor: C.accent }} />
                            <p className="text-[13px] font-semibold mb-1" style={{ color: C.text }}>Reading security key…</p>
                            <p className="text-[12px]" style={{ color: B[600] }}>Don't remove the key yet</p>
                        </motion.div>
                    )}

                    {/* Name device step */}
                    {step === 'name-device' && (
                        <motion.div key="name" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
                            <p className="text-[12px] mb-4" style={{ color: B[600] }}>
                                {method === 'this-device' ? 'Give this passkey a name so you can recognise it later.' :
                                 method === 'another-device' ? 'Your phone is connected. Name this passkey to continue.' :
                                 'Security key verified. Name this passkey to finish setup.'}
                            </p>
                            {method !== 'this-device' && (
                                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-[10px]"
                                    style={{ backgroundColor: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.10)' }}>
                                    <CheckCircle2 size={14} strokeWidth={2} style={{ color: C.success }} />
                                    <span className="text-[12px] font-medium" style={{ color: C.success }}>
                                        {method === 'another-device' ? 'Mobile device verified' : 'Security key recognized'}
                                    </span>
                                </div>
                            )}
                            <div className="mb-4">
                                <label className="text-[12px] font-medium block mb-2" style={{ color: B[600] }}>Passkey name</label>
                                <input type="text"
                                    placeholder={method === 'this-device' ? 'e.g. "My MacBook Pro"' : method === 'another-device' ? 'e.g. "My iPhone 15"' : 'e.g. "YubiKey 5C"'}
                                    value={deviceName}
                                    onChange={e => setDeviceName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && deviceName.trim()) handleFinish(); }}
                                    autoFocus
                                    className="w-full rounded-[10px] px-4 py-3 text-[14px] font-normal transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                                    style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text }} />
                            </div>
                            {method === 'this-device' && (
                                <div className="flex items-start gap-2.5 p-3 rounded-[10px] mb-4"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.025)' }}>
                                    <Fingerprint size={15} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: B[600] }} />
                                    <p className="text-[11.5px]" style={{ color: B[600] }}>
                                        After naming, your browser will ask you to verify with your fingerprint, face, or device PIN.
                                    </p>
                                </div>
                            )}
                            <div className="flex justify-between pt-1">
                                <button onClick={() => {
                                    if (method === 'this-device') { setStep('choose-method'); setMethod('choose'); }
                                    else if (method === 'another-device') { setStep('qr-scan'); startCountdown(); }
                                    else { setStep('key-insert'); }
                                }}
                                    className="text-[12.5px] font-medium px-3 py-2 rounded-[10px] transition-colors"
                                    style={{ color: B[600] }}>
                                    ← Back
                                </button>
                                <button onClick={handleFinish} disabled={!deviceName.trim() || processing}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[12.5px] font-semibold text-white transition-all duration-150 active:scale-[0.97] disabled:opacity-50"
                                    style={{ backgroundColor: C.accent }}>
                                    {processing ? (
                                        <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" /> Verifying…</>
                                    ) : (
                                        <>{method === 'this-device' ? <Fingerprint size={13} strokeWidth={2} /> : <Check size={13} strokeWidth={2.5} />}
                                        {method === 'this-device' ? 'Verify & register' : 'Register passkey'}</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Biometric prompt */}
                    {step === 'biometric-prompt' && (
                        <motion.div key="bio" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="flex flex-col items-center py-6">
                            <motion.div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                                style={{ backgroundColor: 'rgba(0,113,227,0.06)' }}
                                animate={{ scale: [1, 1.08, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
                                <Fingerprint size={30} strokeWidth={1.3} style={{ color: C.accent }} />
                            </motion.div>
                            <p className="text-[13px] font-semibold mb-1" style={{ color: C.text }}>Touch the sensor</p>
                            <p className="text-[12px] text-center" style={{ color: B[600] }}>
                                Use your fingerprint, face, or device PIN to verify
                            </p>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="w-5 h-5 rounded-full border-2 mt-4"
                                style={{ borderColor: 'rgba(0,113,227,0.15)', borderTopColor: C.accent }} />
                        </motion.div>
                    )}

                    {/* Success */}
                    {step === 'success' && (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
                            className="flex flex-col items-center py-5">
                            <motion.div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                                style={{ backgroundColor: 'rgba(52,199,89,0.10)' }}
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}>
                                <CheckCircle2 size={28} strokeWidth={1.5} style={{ color: C.success }} />
                            </motion.div>
                            <p className="text-[14px] font-semibold mb-1" style={{ color: C.text }}>Passkey created</p>
                            <p className="text-[12px] text-center mb-1" style={{ color: B[600] }}>
                                "{deviceName}" has been registered successfully.
                            </p>
                            <p className="text-[11px] text-center mb-5" style={{ color: B[600] }}>
                                You can now use this passkey to sign in without a password.
                            </p>
                            <button onClick={handleDone}
                                className="px-6 py-2.5 rounded-[10px] text-[13px] font-semibold text-white transition-all duration-150 active:scale-[0.97]"
                                style={{ backgroundColor: C.success }}>
                                Done
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {step === 'choose-method' && (
                <div className="px-5 pb-4 pt-0">
                    <div className="flex justify-end">
                        <button onClick={onClose} className="text-[12.5px] font-medium px-3 py-2 rounded-[10px]" style={{ color: B[600] }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

/* ── Glitter dots mask for hidden words ── */
type GlitterDot = { x: number; y: number; r: number; freq: number; phase: number; dimBase: number };
function generateGlitterDots(count: number, w: number, h: number, seed: number): GlitterDot[] {
    const out: GlitterDot[] = [];
    let s = seed;
    const next = () => { s = (s * 16807 + 7) % 2147483647; return (s & 0x7fffffff) / 0x7fffffff; };
    for (let i = 0; i < count; i++) {
        out.push({
            x: next() * w,
            y: 2 + next() * (h - 4),
            r: 0.6 + next() * 0.5,
            freq: 1.5 + next() * 4,
            phase: next() * Math.PI * 2,
            dimBase: 0.03 + next() * 0.08,
        });
    }
    return out;
}

function ScatterDotsMask({ wordLen, seed }: { wordLen: number; seed: number }) {
    const w = 90;
    const h = 18;
    const count = Math.max(Math.round(wordLen * 3.2), 14);
    const dotsRef = useMemo(() => generateGlitterDots(count, w, h, seed), [count, w, h, seed]);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let raf: number;
        const draw = (t: number) => {
            ctx.clearRect(0, 0, w, h);
            const time = t * 0.001;
            for (const dot of dotsRef) {
                // Each dot twinkles independently at its own random frequency
                const wave1 = Math.sin(time * dot.freq + dot.phase);
                const wave2 = Math.sin(time * dot.freq * 0.7 + dot.phase * 2.3);
                const combined = (wave1 + wave2) * 0.5;
                const bright = Math.max(0, combined);
                const alpha = dot.dimBase + bright * bright * 0.8;
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0,0,0,${Math.min(alpha, 0.9)})`;
                ctx.fill();
            }
            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, [dotsRef, w, h]);

    return <canvas ref={canvasRef} width={w} height={h} className="block" style={{ width: '100%', height: '100%' }} />;
}

/* ── Hover-to-reveal word ── */
function HoverRevealWord({ index, word }: { index: number; word: string }) {
    const [revealed, setRevealed] = useState(false);
    return (
        <div className="flex items-center gap-2.5 py-[5px] cursor-pointer"
            onMouseEnter={() => setRevealed(true)} onMouseLeave={() => setRevealed(false)}>
            <span className="text-[11px] font-medium w-[16px] text-right tabular-nums shrink-0 transition-colors duration-200"
                style={{ color: revealed ? B[600] : B[400] }}>{index}</span>
            <div className="relative h-[24px] flex items-center w-[100px]">
                {/* Animated scatter dots mask */}
                <div className="absolute inset-0 flex items-center transition-opacity"
                    style={{ opacity: revealed ? 0 : 1, pointerEvents: revealed ? 'none' : 'auto', transitionDuration: '250ms' }}>
                    <ScatterDotsMask wordLen={word.length} seed={index * 31} />
                </div>
                {/* Revealed text */}
                <span className="text-[13px] font-mono font-medium transition-all"
                    style={{
                        color: C.text,
                        opacity: revealed ? 1 : 0,
                        transform: revealed ? 'translateY(0)' : 'translateY(2px)',
                        transitionDuration: '250ms',
                        userSelect: revealed ? 'text' : 'none',
                    }}>
                    {word}
                </span>
            </div>
        </div>
    );
}

/* ── Hover-to-reveal block ── */
function HoverRevealBlock({ text }: { text: string }) {
    const [revealed, setRevealed] = useState(false);
    return (
        <div className="rounded-[12px] p-4 mb-4 cursor-default relative overflow-hidden"
            onMouseEnter={() => setRevealed(true)} onMouseLeave={() => setRevealed(false)}
            style={{ backgroundColor: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.06)', minHeight: '48px' }}>
            {/* Masked state — soft gradient bars */}
            <div className="absolute inset-0 overflow-hidden transition-opacity duration-200"
                style={{ opacity: revealed ? 0 : 1, pointerEvents: revealed ? 'none' : 'auto' }}>
                <ScatterDotsMask wordLen={40} seed={7001} />
            </div>
            {/* Revealed state */}
            <span className="text-[13px] font-mono font-medium break-all transition-opacity duration-200"
                style={{ color: C.text, opacity: revealed ? 1 : 0, userSelect: revealed ? 'text' : 'none' }}>
                {text}
            </span>
        </div>
    );
}

/* ── Recovery Codes Panel — with tabs + hover reveal ── */
function RecoveryCodesPanel({ onClose }: { onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'phrase' | 'key'>('phrase');
    const [copied, setCopied] = useState(false);
    const RECOVERY_WORDS = ['alpine', 'bronze', 'canopy', 'drift', 'ember', 'falcon', 'grove', 'harbor', 'iris', 'jade', 'kindle', 'lunar'];
    const PRIVATE_KEY = '0x7f4e2c8a1b9d5e3f0a6c4b2d8e1f7a3c5b9d0e2f4a6c8b1d3e5f7a9c0b2d4e';

    const handleCopy = () => {
        const text = activeTab === 'phrase' ? RECOVERY_WORDS.join(' ') : PRIVATE_KEY;
        navigator.clipboard?.writeText(text).then(() => {
            setCopied(true); toast.success('Copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => toast.error('Could not copy'));
    };

    const handlePrint = () => {
        const content = activeTab === 'phrase'
            ? `<h2 style="font-family:system-ui;margin-bottom:16px;font-size:16px;color:#1d1d1f">Recovery Phrase</h2>
               <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 32px;font-family:monospace;font-size:14px;padding:20px;border:1px solid #e5e5e5;border-radius:12px">
                 ${RECOVERY_WORDS.map((w, i) => `<div><span style="color:#999;margin-right:8px">${i + 1}.</span>${w}</div>`).join('')}
               </div>`
            : `<h2 style="font-family:system-ui;margin-bottom:16px;font-size:16px;color:#1d1d1f">Private Key</h2>
               <div style="font-family:monospace;font-size:13px;word-break:break-all;padding:20px;border:1px solid #e5e5e5;border-radius:12px">${PRIVATE_KEY}</div>`;
        const printWindow = window.open('', '_blank', 'width=480,height=600');
        if (!printWindow) { toast.error('Could not open print window'); return; }
        printWindow.document.write(`<!DOCTYPE html><html><head><title>Recovery Backup</title></head><body style="padding:40px;max-width:420px;margin:0 auto">
            <p style="font-family:system-ui;font-size:11px;color:#999;margin-bottom:24px">Store this in a safe place. Do not share with anyone.</p>
            ${content}
            <p style="font-family:system-ui;font-size:10px;color:#bbb;margin-top:24px;text-align:center">Printed ${new Date().toLocaleDateString()}</p>
        </body></html>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="mt-4 rounded-[16px] overflow-hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <div className="px-5 pt-5 pb-5">
                {/* Tab toggle */}
                <div className="flex rounded-full p-[3px] mb-5 mx-auto w-fit" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                    <button onClick={() => { setActiveTab('phrase'); setCopied(false); }}
                        className="px-4 py-2 rounded-full text-[12px] font-semibold transition-all duration-200"
                        style={{ backgroundColor: activeTab === 'phrase' ? 'white' : 'transparent', color: activeTab === 'phrase' ? C.text : B[600], boxShadow: activeTab === 'phrase' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                        Recovery Phrase
                    </button>
                    <button onClick={() => { setActiveTab('key'); setCopied(false); }}
                        className="px-4 py-2 rounded-full text-[12px] font-semibold transition-all duration-200"
                        style={{ backgroundColor: activeTab === 'key' ? 'white' : 'transparent', color: activeTab === 'key' ? C.text : B[600], boxShadow: activeTab === 'key' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                        Private Key
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'phrase' ? (
                        <motion.div key="phrase" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                            <p className="text-[12.5px] mb-2" style={{ color: B[600] }}>Your Secret Recovery Phrase is a series of 12 random words in a specific order.</p>
                            <p className="text-[11.5px] mb-4 font-medium" style={{ color: B[600] }}>Hover over each word to reveal</p>
                            <div className="rounded-[14px] p-4 mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                                    {RECOVERY_WORDS.map((word, i) => (<HoverRevealWord key={i} index={i + 1} word={word} />))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="key" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                            <p className="text-[12.5px] mb-2" style={{ color: B[600] }}>Your private key is an alphanumeric code that provides you with authentication to your account.</p>
                            <p className="text-[11.5px] mb-4 font-medium" style={{ color: B[600] }}>Hover to reveal</p>
                            <HoverRevealBlock text={PRIVATE_KEY} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Warning */}
                <div className="flex items-start gap-2.5 mb-4 p-3 rounded-[10px]" style={{ backgroundColor: 'rgba(255,149,0,0.06)' }}>
                    <AlertTriangle size={14} strokeWidth={1.8} className="flex-shrink-0 mt-0.5" style={{ color: '#FF9500' }} />
                    <p className="text-[11.5px]" style={{ color: B[600] }}>Never share these with anyone. Store them offline in a safe place.</p>
                </div>

                <div className="flex items-center justify-end gap-2">
                    <button onClick={handlePrint} className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-medium transition-all duration-150 active:scale-[0.97]"
                        style={{ color: B[600], backgroundColor: 'rgba(0,0,0,0.04)' }}>
                        <Printer size={13} strokeWidth={1.6} />
                        Print
                    </button>
                    <button onClick={handleCopy} className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-medium transition-all duration-150 active:scale-[0.97]"
                        style={{ color: copied ? C.success : B[600], backgroundColor: copied ? 'rgba(52,199,89,0.08)' : 'rgba(0,0,0,0.04)' }}>
                        {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={1.6} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={onClose}
                        className="px-5 py-2 rounded-full text-[12.5px] font-semibold text-white transition-all duration-150 active:scale-[0.97]"
                        style={{ backgroundColor: '#2ECDA7' }}>
                        Done
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

/* ── Password Input with live requirements ── */
function PasswordInputWithReqs({ label, placeholder }: { label: string; placeholder?: string }) {
    const [value, setValue] = useState('');
    const [focused, setFocused] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const showReqs = focused || value.length > 0;
    const reqs = [
        { label: 'At least 8 characters', met: value.length >= 8 },
        { label: 'One uppercase letter (A\u2013Z)', met: /[A-Z]/.test(value) },
        { label: 'One lowercase letter (a\u2013z)', met: /[a-z]/.test(value) },
        { label: 'One number (0\u20139)', met: /\d/.test(value) },
        { label: 'One special character (!@#$...)', met: /[^a-zA-Z0-9]/.test(value) },
    ];
    return (
        <div>
            <label className="text-[12px] font-medium block mb-2" style={{ color: B[600] }}>{label}</label>
            <div className="relative">
                <input type={showPw ? 'text' : 'password'} placeholder={placeholder} value={value}
                    onChange={e => setValue(e.target.value)}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    className="w-full rounded-[10px] px-4 py-3 pr-10 text-[14px] font-normal transition-all duration-200 outline-none"
                    style={{ backgroundColor: 'white', border: `1px solid ${focused ? C.accent : 'rgba(0,0,0,0.1)'}`, color: C.text, boxShadow: focused ? '0 0 0 3px rgba(0,113,227,0.12)' : 'none' }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md" style={{ color: B[600] }}>
                    <Eye size={15} strokeWidth={1.5} />
                </button>
            </div>
            <AnimatePresence>
                {showReqs && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                        <div className="mt-3 space-y-1.5">
                            {reqs.map(r => (
                                <div key={r.label} className="flex items-center gap-2">
                                    <div className="w-[14px] h-[14px] rounded-full flex items-center justify-center transition-all duration-200"
                                        style={{ backgroundColor: r.met ? 'rgba(52,199,89,0.12)' : 'rgba(0,0,0,0.04)' }}>
                                        {r.met && <Check size={9} strokeWidth={3} style={{ color: C.success }} />}
                                    </div>
                                    <span className="text-[11.5px] transition-colors duration-200"
                                        style={{ color: r.met ? C.success : B[600] }}>{r.label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ── Trusted Device Card ── */
type TrustedDevice = {
    id: string; name: string; os: string; browser: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    current: boolean; serial: string; ip: string;
    city: string; country: string; isp: string;
    trustedSince: string; lastActive: string; lastActivity: string;
    sessionDuration?: string; removed: boolean;
    isNew?: boolean; unusualLocation?: boolean; suspicious?: boolean; suspiciousReason?: string;
};

const TrustedDeviceCard = React.forwardRef<HTMLDivElement, {
    device: TrustedDevice;
    onForget: (id: string) => void;
    onRename: (id: string, name: string) => void;
    index: number;
    ghost?: boolean;
}>(function TrustedDeviceCard({ device, onForget, onRename, index, ghost }, ref) {
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState(device.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

    const handleSaveRename = () => {
        const trimmed = editName.trim();
        if (trimmed && trimmed !== device.name) onRename(device.id, trimmed);
        else setEditName(device.name);
        setEditing(false);
    };

    /* ── Color system: ghost = all grays, active = full contrast ── */
    const g = ghost; // shorthand
    const clr = {
        name:      g ? B[400] : C.text,
        sub:       g ? B[400] : B[500],
        iconBg:    g ? 'rgba(0,0,0,0.018)' : 'rgba(0,0,0,0.035)',
        icon:      g ? B[400] : B[600],
        label:     g ? 'rgba(0,0,0,0.18)' : B[400],
        value:     g ? B[400] : B[700],
        mono:      g ? 'rgba(0,0,0,0.2)' : B[500],
        pill:      g ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.03)',
        separator: g ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.04)',
    };

    /* ── Device icon by type ── */
    const DeviceIcon = device.deviceType === 'desktop' ? Laptop
        : device.deviceType === 'mobile' ? Smartphone
        : device.deviceType === 'tablet' ? Tablet : Monitor;

    /* ── Status badges ── */
    const badges: { label: string; bg: string; fg: string }[] = [];
    if (device.current)          badges.push({ label: 'This device',       bg: 'rgba(52,199,89,0.09)',  fg: C.success });
    if (device.isNew)            badges.push({ label: 'New device',        bg: 'rgba(255,159,10,0.09)', fg: '#D97706' });
    if (device.unusualLocation)  badges.push({ label: 'Unusual location',  bg: 'rgba(255,149,0,0.08)',  fg: '#C2770E' });
    if (device.suspicious)       badges.push({ label: 'Suspicious',        bg: 'rgba(255,59,48,0.08)',  fg: C.danger });
    if (ghost)                   badges.push({ label: 'Removed',           bg: 'rgba(0,0,0,0.025)',     fg: B[400] });

    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, delay: index * 0.035 }}
            className="rounded-[14px] transition-colors duration-200"
            style={{ backgroundColor: g ? 'transparent' : 'rgba(0,0,0,0.012)', padding: g ? '14px 6px' : '18px 20px' }}>

            {/* ══════ Header: Icon · Name · OS/Browser · Badges ══════ */}
            <div className="flex items-start gap-3.5">
                <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center flex-shrink-0 mt-[1px]"
                    style={{ backgroundColor: clr.iconBg }}>
                    <DeviceIcon size={17} strokeWidth={1.5} style={{ color: clr.icon }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-[6px] flex-wrap">
                        {editing ? (
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <input ref={inputRef} value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') { setEditName(device.name); setEditing(false); } }}
                                    className="text-[13px] px-3 py-[5px] rounded-[10px] flex-1 min-w-0 outline-none transition-all duration-200"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.03)', border: '1.5px solid rgba(0,0,0,0.08)', color: C.text }} />
                                <button onClick={handleSaveRename}
                                    className="text-[11.5px] font-medium px-3 py-[5px] rounded-[9px] transition-all duration-150 active:scale-[0.97]"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: B[700] }}>Save</button>
                                <button onClick={() => { setEditName(device.name); setEditing(false); }}
                                    className="text-[11.5px] font-medium px-2 py-[5px] rounded-[9px] transition-all duration-150 active:scale-[0.97]"
                                    style={{ color: B[500] }}>Cancel</button>
                            </div>
                        ) : (
                            <>
                                <span className="text-[13.5px] font-medium" style={{ color: clr.name }}>{device.name}</span>
                                {badges.map((b, bi) => (
                                    <span key={bi} className="text-[10px] font-medium px-[7px] py-[2px] rounded-full"
                                        style={{ backgroundColor: b.bg, color: b.fg }}>
                                        {b.label}
                                    </span>
                                ))}
                            </>
                        )}
                    </div>
                    {/* OS + Browser — the device's identity at a glance */}
                    <span className="text-[12px] mt-[2px] block" style={{ color: clr.sub }}>
                        {device.os} · {device.browser}
                    </span>
                </div>
            </div>

            {/* ══════ Info rows — grouped semantically ══════ */}
            <div className="mt-4 ml-[54px] space-y-[11px]">

                {/* ── Location: City first so humans know WHERE instantly ── */}
                <div className="flex items-center gap-[9px]">
                    <MapPin size={13} strokeWidth={1.5} className="flex-shrink-0" style={{ color: clr.label }} />
                    <span className="text-[12.5px]" style={{ color: clr.value }}>
                        {device.city}, {device.country}
                    </span>
                </div>

                {/* ── Network: ISP + IP on one line ── */}
                <div className="flex items-center gap-[9px]">
                    <Globe size={13} strokeWidth={1.5} className="flex-shrink-0" style={{ color: clr.label }} />
                    <span className="text-[12px]" style={{ color: clr.value }}>
                        {device.isp}
                    </span>
                    <span className="text-[10.5px] font-mono tracking-wide" style={{ color: clr.mono }}>
                        {device.ip}
                    </span>
                </div>

                {/* ── Timing: Trusted since + Last activity ── */}
                <div className="flex items-center gap-[9px]">
                    <ShieldCheck size={13} strokeWidth={1.5} className="flex-shrink-0" style={{ color: clr.label }} />
                    <span className="text-[12px]" style={{ color: clr.value }}>
                        Trusted since {device.trustedSince}
                    </span>
                </div>

                <div className="flex items-center gap-[9px]">
                    <Clock size={13} strokeWidth={1.5} className="flex-shrink-0" style={{ color: clr.label }} />
                    <span className="text-[12.5px]" style={{ color: device.current ? C.success : clr.value }}>
                        {device.lastActive}
                    </span>
                    {device.sessionDuration && (
                        <span className="text-[10.5px] px-[6px] py-[1px] rounded-full"
                            style={{ backgroundColor: clr.pill, color: clr.mono }}>
                            Session {device.sessionDuration}
                        </span>
                    )}
                    <span className="text-[11px]" style={{ color: clr.mono }}>
                        · {device.lastActivity}
                    </span>
                </div>

                {/* ── Serial — subtle, for verification ── */}
                <div className="flex items-center gap-[9px]">
                    <Hash size={13} strokeWidth={1.5} className="flex-shrink-0" style={{ color: clr.label }} />
                    <span className="text-[10.5px] font-mono tracking-wider" style={{ color: clr.mono }}>{device.serial}</span>
                </div>

                {/* ── Suspicious reason — amber info row ── */}
                {device.suspicious && device.suspiciousReason && (
                    <div className="flex items-start gap-[9px] mt-[2px] px-[10px] py-[8px] rounded-[10px]"
                        style={{ backgroundColor: ghost ? 'rgba(0,0,0,0.02)' : 'rgba(255,159,10,0.07)', border: ghost ? 'none' : '1px solid rgba(255,159,10,0.15)' }}>
                        <AlertTriangle size={12} strokeWidth={1.75} className="flex-shrink-0 mt-[1px]"
                            style={{ color: ghost ? clr.label : '#D97706' }} />
                        <div>
                            <span className="text-[11px] block" style={{ color: ghost ? clr.value : '#92400E' }}>
                                {device.suspiciousReason}
                            </span>
                            {!ghost && (
                                <span className="text-[10.5px]" style={{ color: '#B45309' }}>
                                    Review this activity if it wasn't you.
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ══════ Actions — right-aligned ══════ */}
            {!ghost && (
                <div className="flex justify-end gap-2 mt-4 ml-[54px]">
                    {!editing && (
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-[5px] text-[11.5px] font-medium px-3.5 py-[6px] rounded-[10px] transition-all duration-150"
                            style={{ color: B[600], backgroundColor: 'rgba(0,0,0,0.03)' }}>
                            <Pencil size={11} strokeWidth={2} />
                            Rename
                        </motion.button>
                    )}
                    {!device.current && (
                        <motion.button
                            whileTap={{ scale: 0.94 }}
                            onClick={() => onForget(device.id)}
                            className="flex items-center gap-[5px] text-[11.5px] font-medium px-3.5 py-[6px] rounded-[10px] transition-all duration-150"
                            style={{ color: C.danger, backgroundColor: 'rgba(255,59,48,0.05)' }}>
                            <Trash2 size={11} strokeWidth={2} />
                            Remove
                        </motion.button>
                    )}
                </div>
            )}
        </motion.div>
    );
});

/* ── Trusted Devices Panel ── */
function TrustedDevicesPanel({ devices, onForget, onRename }: {
    devices: TrustedDevice[];
    onForget: (id: string) => void;
    onRename: (id: string, name: string) => void;
}) {
    const activeDevices = devices.filter(d => !d.removed);
    const removedDevices = devices.filter(d => d.removed);

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="rounded-[16px] overflow-hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.015)', border: '1px solid rgba(0,0,0,0.035)' }}>
            <div className="px-5 py-5">

                {/* Warm, human header */}
                <p className="text-[12.5px] mb-5" style={{ color: B[500], lineHeight: '1.55' }}>
                    These devices are trusted and won't need a verification code to sign in.
                </p>

                {/* ── Active devices ── */}
                <motion.div layout className="space-y-2.5">
                    <AnimatePresence mode="popLayout">
                        {activeDevices.map((d, i) => (
                            <TrustedDeviceCard key={d.id} device={d} onForget={onForget} onRename={onRename} index={i} />
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* ── Previously trusted — lighter, no actions, activity preserved ── */}
                {removedDevices.length > 0 && (
                    <div className="mt-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.05) 60%, transparent)' }} />
                            <span className="text-[10px] font-medium tracking-[0.06em] uppercase" style={{ color: B[400] }}>
                                Previously trusted
                            </span>
                            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.05) 60%, transparent)' }} />
                        </div>
                        <div className="space-y-1">
                            {removedDevices.map((d, i) => (
                                <TrustedDeviceCard key={d.id} device={d} onForget={onForget} onRename={onRename} index={activeDevices.length + i} ghost />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Remove all — right-aligned ── */}
                {activeDevices.filter(d => !d.current).length > 1 && (
                    <div className="flex justify-end mt-4">
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => { onForget('all'); toast('All other devices removed'); }}
                            className="text-[11.5px] font-medium px-3 py-[5px] rounded-[9px] transition-all duration-150"
                            style={{ color: C.danger, backgroundColor: 'rgba(255,59,48,0.04)' }}>
                            Remove all other devices
                        </motion.button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

/* ── Passkey Row ── */
function PasskeyRow({ name, deviceType, addedDate, onRemove }: {
    name: string; deviceType: 'laptop' | 'phone' | 'key'; addedDate: string; onRemove: () => void;
}) {
    const [hovered, setHovered] = useState(false);
    return (
        <div className="flex items-center gap-3.5 py-3.5 transition-opacity duration-150"
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            style={{ opacity: hovered ? 1 : 0.9 }}>
            <div className="w-[36px] h-[36px] rounded-[11px] flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(0,113,227,0.06)' }}>
                {deviceType === 'laptop'
                    ? <Laptop size={16} strokeWidth={1.6} style={{ color: C.accent }} />
                    : deviceType === 'key'
                    ? <Key size={16} strokeWidth={1.6} style={{ color: C.accent }} />
                    : <Smartphone size={16} strokeWidth={1.6} style={{ color: C.accent }} />}
            </div>
            <div className="flex-1 min-w-0">
                <span className="text-[13.5px] font-medium block" style={{ color: C.text }}>{name}</span>
                <span className="text-[12px]" style={{ color: B[600] }}>Added {addedDate}</span>
            </div>
            {hovered && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={onRemove}
                    className="text-[12px] font-medium px-3 py-1.5 rounded-[8px] transition-all duration-150 active:scale-[0.96]"
                    style={{ color: C.danger, backgroundColor: 'rgba(255,59,48,0.06)' }}>
                    Remove
                </motion.button>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════
   SECURITY TAB — Jony Ive level clarity
   ══════════════════════════════════════���═══ */
function SecurityTab({ privacy, setPrivacy }: { privacy: any; setPrivacy: any }) {
    const [smsEnabled, setSmsEnabled] = useState(true);
    const [showSmsSetup, setShowSmsSetup] = useState(false);
    const [authAppEnabled, setAuthAppEnabled] = useState(false);
    const [showAuthSetup, setShowAuthSetup] = useState(false);
    const [recoveryGenerated, setRecoveryGenerated] = useState(false);
    const [showCodes, setShowCodes] = useState(false);
    const [showDevices, setShowDevices] = useState(false);
    const [showPasskeySetup, setShowPasskeySetup] = useState(false);
    const [passkeys, setPasskeys] = useState([
        { id: '1', name: 'MacBook Air', deviceType: 'laptop' as const, addedDate: 'Dec 2025' },
        { id: '2', name: 'iPhone 15', deviceType: 'phone' as const, addedDate: 'Jan 2026' },
    ]);
    const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([
        { id: '1', name: 'MacBook Air', os: 'macOS 15.3', browser: 'Chrome 122', deviceType: 'desktop', lastActive: 'Active now', current: true, serial: 'C02G94XXML7H', ip: '192.168.1.12', city: 'San Francisco', country: 'US', isp: 'Comcast Cable', trustedSince: 'Jan 15, 2026', lastActivity: 'Feb 25, 2026 — 3:42 PM', sessionDuration: '2h 14m', removed: false },
        { id: '2', name: 'iPhone 15', os: 'iOS 18.3', browser: 'Safari 19.3', deviceType: 'mobile', lastActive: '2 days ago', current: false, serial: 'F17XKDG0HG', ip: '10.0.0.34', city: 'San Francisco', country: 'US', isp: 'AT\u0026T Wireless', trustedSince: 'Dec 8, 2025', lastActivity: 'Feb 23, 2026 — 11:08 AM', sessionDuration: '38m', removed: false },
        { id: '3', name: 'iPad Pro', os: 'iPadOS 17.4', browser: 'Safari 19.1', deviceType: 'tablet', lastActive: '2 weeks ago', current: false, serial: 'DLXR40E1FH', ip: '172.16.0.88', city: 'Portland', country: 'US', isp: 'Starbucks Guest Wi-Fi', trustedSince: 'Feb 2, 2026', lastActivity: 'Feb 11, 2026 — 6:20 PM', removed: true, unusualLocation: true, suspicious: true, suspiciousReason: '3 failed login attempts from an unfamiliar network' },
    ]);

    /* ── Transaction PIN state ── */
    const [showTpinFlow, setShowTpinFlow] = useState(false);
    const [tpinMode, setTpinMode] = useState<'change' | 'forgot'>('change');
    const [tpinStep, setTpinStep] = useState(0); // 0=current, 1=new, 2=confirm, 3=done / forgot: 0=passport, 1=otp, 2=new, 3=confirm, 4=done
    const [tpinValues, setTpinValues] = useState<string[]>(['', '', '', '']);
    const [focusedTpinIdx, setFocusedTpinIdx] = useState(-1);
    const [tpinPassport, setTpinPassport] = useState('');
    const [tpinOtp, setTpinOtp] = useState<string[]>(['', '', '', '', '', '']);
    const tpinRefs = useRef<(HTMLInputElement | null)[]>([]);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    /* ── Unregister state ── */
    const [showUnregister, setShowUnregister] = useState(false);
    const [unregisterConfirm, setUnregisterConfirm] = useState('');
    const [unregisterStep, setUnregisterStep] = useState(0);
    const [unregisterReason, setUnregisterReason] = useState('');
    const [unregisterCustomReason, setUnregisterCustomReason] = useState('');

    /* ── Sympathetic bounce tracker ── */
    const bounceCountRef = useRef(0);
    const triggerBounce = (origin: HTMLElement) => {
        bounceCountRef.current += 1;
        const n = bounceCountRef.current;
        const amp = Math.min(0.004 + 0.002 * Math.log(n + 1), 0.016);
        const parent = origin.closest('[data-security-section]') || origin.parentElement;
        if (!parent) return;
        const siblings = Array.from(parent.children).filter(c => c !== origin && c instanceof HTMLElement) as HTMLElement[];
        siblings.forEach((sib, i) => {
            const delay = i * 30;
            const sibAmp = amp * (0.6 + Math.random() * 0.4);
            setTimeout(() => {
                sib.animate([
                    { transform: 'translateY(0)', offset: 0 },
                    { transform: `translateY(${-sibAmp * 100}px)`, offset: 0.25 },
                    { transform: `translateY(${sibAmp * 35}px)`, offset: 0.55 },
                    { transform: `translateY(${-sibAmp * 12}px)`, offset: 0.78 },
                    { transform: 'translateY(0)', offset: 1 },
                ], { duration: 500 + n * 8, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
            }, delay);
        });
    };

    /* ── T-PIN helpers ── */
    const handleTpinDigit = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const next = [...tpinValues];
        next[index] = value;
        setTpinValues(next);
        if (value && index < 3) tpinRefs.current[index + 1]?.focus();
    };
    const handleOtpDigit = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const next = [...tpinOtp];
        next[index] = value;
        setTpinOtp(next);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    };
    const resetTpin = () => {
        setTpinValues(['', '', '', '']);
        setTpinOtp(['', '', '', '', '', '']);
        setTpinPassport('');
        setTpinStep(0);
        setTpinMode('change');
    };

    /* ── Protection score ── */
    const score = (() => {
        let s = 20; // base account
        if (privacy.twoFactor) s += 15;
        if (smsEnabled) s += 15;
        if (authAppEnabled) s += 15;
        if (recoveryGenerated) s += 10;
        if (passkeys.length > 0) s += 15;
        if (privacy.sessionTimeout !== 'never') s += 10;
        return Math.min(100, s);
    })();

    const handleToggle2FA = (v: boolean) => {
        setPrivacy((p: any) => ({ ...p, twoFactor: v }));
        if (v) {
            toast.success('Two-factor authentication enabled', { description: 'Choose a verification method below.' });
        } else {
            setAuthAppEnabled(false); setRecoveryGenerated(false);
            setShowCodes(false); setShowDevices(false); setShowSmsSetup(false); setShowAuthSetup(false);
            toast('Two-factor authentication disabled');
        }
    };

    const handleForgetDevice = (id: string) => {
        if (id === 'all') {
            setTrustedDevices(prev => prev.map(d => d.current ? d : { ...d, removed: true }));
            toast.success('All non-current devices removed');
        } else {
            setTrustedDevices(prev => prev.map(d => d.id === id ? { ...d, removed: true } : d));
            toast.success('Device removed');
        }
    };

    const handleRenameDevice = (id: string, newName: string) => {
        setTrustedDevices(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d));
        toast.success('Device renamed');
    };

    return (
        <div>
            {/* ── Protection Score ── */}
            {(() => {
                /* Sober pastels — soft coral → muted teal → calm sage (Figma ring palette) */
                const t = Math.min(1, score / 100);
                /* Tri-zone hue: coral(3) → teal(178) → sage(90) */
                const hueNorm = t < 0.35
                    ? 3 + (t / 0.35) * 175
                    : 178 - ((t - 0.35) / 0.65) * 88;
                const sat = 40 + t * 14;
                const lit = 70 - t * 6;
                const textLit = lit - 20;
                const scoreColor = `hsl(${hueNorm}, ${sat}%, ${textLit}%)`;
                const scoreColorAlpha = (a: number) => `hsla(${hueNorm}, ${sat}%, ${lit}%, ${a})`;
                const _factors = [
                    { icon: Shield, label: 'Two-factor', active: privacy.twoFactor },
                    { icon: Smartphone, label: 'Text verify', active: smsEnabled },
                    { icon: QrCode, label: 'Authenticator', active: authAppEnabled },
                    { icon: Fingerprint, label: 'Passkey', active: passkeys.length > 0 },
                    { icon: Key, label: 'Recovery', active: recoveryGenerated },
                    { icon: Clock, label: 'Auto-lock', active: privacy.sessionTimeout !== 'never' },
                ];
                const activeCount = _factors.filter(f => f.active).length;
                const remaining = _factors.filter(f => !f.active);
                /* Derived theme colors — muted, sober palette */
                const pillBg = scoreColorAlpha(0.07);
                const pillText = `hsl(${hueNorm}, ${sat - 4}%, ${Math.max(28, textLit + 4)}%)`;
                const pillDot = scoreColorAlpha(0.35);
                const cardTint = scoreColorAlpha(0.02);
                const hlColor = scoreColorAlpha(0.12);
                const handleCardTap = (e: React.MouseEvent<HTMLDivElement>) => {
                    const el = e.currentTarget;
                    const n = parseInt(el.dataset.taps || '0') + 1;
                    el.dataset.taps = String(n);
                    const amp = Math.min(0.003 + 0.0015 * Math.log(n + 1), 0.014);
                    el.animate([
                        { transform: 'scale(1)', offset: 0 },
                        { transform: `scale(${1 + amp})`, offset: 0.2 },
                        { transform: `scale(${1 - amp * 0.35})`, offset: 0.55 },
                        { transform: `scale(${1 + amp * 0.1})`, offset: 0.8 },
                        { transform: 'scale(1)', offset: 1 },
                    ], { duration: 550, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
                };
                return (
                    <motion.div
                        data-score-card=""
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        onClick={handleCardTap}
                        className="mb-8 rounded-[22px] overflow-hidden relative cursor-default"
                        style={{
                            background: `linear-gradient(145deg, rgba(255,255,255,0.55), ${cardTint})`,
                            backdropFilter: 'blur(40px)',
                            WebkitBackdropFilter: 'blur(40px)',
                            boxShadow: '0 0 0 0.5px rgba(0,0,0,0.035), 0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.02), inset 0 0.5px 0 rgba(255,255,255,0.5)',
                        }}>

                        {/* ── Top row: shield + message + score ── */}
                        <div className="flex items-center gap-4 px-6 pt-6 pb-4">
                            <motion.div
                                animate={{ scale: [1, 1.03, 1] }}
                                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                                className="w-[40px] h-[40px] rounded-full flex items-center justify-center flex-shrink-0"
                                style={{
                                    background: `linear-gradient(145deg, ${scoreColorAlpha(0.12)}, ${scoreColorAlpha(0.03)})`,
                                    boxShadow: `0 2px 10px ${scoreColorAlpha(0.08)}`,
                                }}>
                                <ShieldCheck size={19} strokeWidth={1.5} style={{ color: scoreColor }} />
                            </motion.div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[14.5px] font-semibold tracking-[-0.01em]" style={{ color: C.text }}>
                                    {score >= 90 ? "You're very well protected"
                                        : score >= 75 ? "You're well protected"
                                        : score >= 55 ? "Getting safer"
                                        : score >= 35 ? "A few steps away"
                                        : "Let's get you safe"}
                                </p>
                                <p className="text-[12px] mt-0.5" style={{ color: B[500] }}>
                                    {activeCount} of {_factors.length} active
                                </p>
                            </div>
                            <motion.div
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 22, stiffness: 160, delay: 0.15 }}
                                className="flex flex-col items-end flex-shrink-0">
                                <div className="flex items-baseline gap-[1px]">
                                    <span className="text-[26px] font-bold tracking-tight" style={{
                                        color: scoreColor, lineHeight: 1, letterSpacing: '-0.02em',
                                    }}>{score}</span>
                                    <span className="text-[13px] font-medium" style={{
                                        color: scoreColor, opacity: 0.45,
                                    }}>%</span>
                                </div>
                                <span className="text-[10px] -mt-0.5" style={{ color: B[400] }}>protected</span>
                            </motion.div>
                        </div>

                        {/* ── Progress bar ── */}
                        <div className="px-6 pb-5">
                            <div className="relative h-[4px] rounded-full overflow-hidden"
                                style={{ backgroundColor: 'rgba(0,0,0,0.035)' }}>
                                <motion.div
                                    className="absolute inset-y-0 left-0 rounded-full"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${score}%` }}
                                    transition={{ type: 'spring', damping: 30, stiffness: 60, delay: 0.35 }}
                                    style={{
                                        background: `linear-gradient(90deg, hsl(3, 65%, 87%), hsl(188, 58%, 63%), hsl(90, 52%, 80%))`,
                                        boxShadow: `0 0 8px ${scoreColorAlpha(0.18)}`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* ── Remaining items — warm amber "needs attention" pills ── */}
                        {remaining.length > 0 && (
                            <div className="px-6 pb-5">
                                <div className="flex flex-wrap gap-2">
                                    {remaining.map((item, i) => {
                                        const ItemIcon = item.icon;
                                        const scrollTargets: Record<string, string> = {
                                            'Two-factor': 'Two-factor authentication',
                                            'Text verify': 'Two-factor authentication',
                                            'Authenticator': 'Two-factor authentication',
                                            'Passkey': 'Passkeys',
                                            'Recovery': 'Two-factor authentication',
                                            'Auto-lock': 'Session management',
                                        };
                                        return (
                                            <motion.span key={item.label}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.3 + i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.94 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const target = scrollTargets[item.label];
                                                    if (!target) return;
                                                    const container = e.currentTarget.closest('[data-score-card]')?.parentElement;
                                                    if (!container) return;
                                                    const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
                                                    let node: Node | null = walker.nextNode();
                                                    while (node) {
                                                        const el = node as HTMLElement;
                                                        if (el.textContent?.trim() === target && !el.closest('[data-score-card]') && el.children.length === 0) {
                                                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                            const hl = el.parentElement || el;
                                                            hl.animate([
                                                                { backgroundColor: hlColor, borderRadius: '12px' },
                                                                { backgroundColor: 'transparent' },
                                                            ], { duration: 1400, easing: 'ease-out' });
                                                            break;
                                                        }
                                                        node = walker.nextNode();
                                                    }
                                                }}
                                                className="inline-flex items-center gap-1.5 pl-3 pr-2 py-[6px] rounded-full cursor-pointer select-none text-[11.5px] font-medium transition-colors duration-200"
                                                style={{
                                                    backgroundColor: pillBg,
                                                    color: pillText,
                                                }}>
                                                <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ backgroundColor: pillDot }} />
                                                <ItemIcon size={11} strokeWidth={1.6} style={{ opacity: 0.7 }} />
                                                <span>{item.label}</span>
                                                <ChevronRight size={11} strokeWidth={1.8} style={{ opacity: 0.35, marginLeft: '-2px' }} />
                                            </motion.span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                );
            })()}

            {/* ── Two-Factor Authentication ── */}
            <SectionTitle>Two-factor authentication</SectionTitle>

            <div className="mt-3">
                <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3.5">
                        <Shield size={18} strokeWidth={1.5} style={{ color: B[600] }} />
                        <div>
                            <span className="text-[14px] font-medium block" style={{ color: C.text }}>Require a second step to sign in</span>
                            <span className="text-[12.5px] block mt-0.5" style={{ color: B[600] }}>Keeps your account safe even if your password is compromised</span>
                        </div>
                    </div>
                    <Toggle checked={privacy.twoFactor} onChange={handleToggle2FA} />
                </div>
            </div>

            {/* ── 2FA Methods Expansion ── */}
            <AnimatePresence>
                {privacy.twoFactor && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 260, mass: 0.8 }}
                        style={{ overflow: 'hidden' }}>

                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12, duration: 0.3 }}
                            className="text-[12.5px] mt-4 mb-4 ml-[2px]" style={{ color: B[600] }}>
                            Choose how you'd like to verify your identity. We recommend at least two.
                        </motion.p>

                        <div className="rounded-[20px] overflow-hidden mb-2"
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.55)',
                                border: '1px solid rgba(0,0,0,0.045)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.025), 0 4px 14px rgba(0,0,0,0.018), 0 0 0 0.5px rgba(0,0,0,0.025)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                            }}>

                            {/* Text Message */}
                            <TwoFAMethodRow icon={Smartphone} title="Text message"
                                description="Codes sent to +1 (555) •••-4829"
                                enabled={smsEnabled}
                                onAction={() => setShowSmsSetup(!showSmsSetup)}
                                actionLabel={showSmsSetup ? 'Close' : 'Manage'}
                                index={0} />

                            <AnimatePresence>
                                {showSmsSetup && (
                                    <div className="px-3 pb-3">
                                        <SMSSetupPanel
                                            onNumberChanged={(phone) => { toast.success(`Number changed to ${phone}`); setShowSmsSetup(false); }}
                                            onClose={() => setShowSmsSetup(false)} />
                                    </div>
                                )}
                            </AnimatePresence>

                            <div className="h-px mx-6" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.045) 20%, rgba(0,0,0,0.045) 80%, transparent)' }} />

                            {/* Authenticator App */}
                            <TwoFAMethodRow icon={QrCode} title="Authenticator app"
                                description={authAppEnabled ? 'Connected — codes refresh every 30s' : 'Use Google Authenticator, Authy, or similar'}
                                enabled={authAppEnabled}
                                onAction={() => { if (!authAppEnabled) setShowAuthSetup(!showAuthSetup); }}
                                actionLabel={authAppEnabled ? undefined : (showAuthSetup ? 'Close' : 'Set up')}
                                index={1} />

                            <AnimatePresence>
                                {showAuthSetup && !authAppEnabled && (
                                    <div className="px-3 pb-3">
                                        <AuthAppSetupPanel
                                            onEnable={() => { setAuthAppEnabled(true); setShowAuthSetup(false); }}
                                            onClose={() => setShowAuthSetup(false)} />
                                    </div>
                                )}
                            </AnimatePresence>

                            <div className="h-px mx-6" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.045) 20%, rgba(0,0,0,0.045) 80%, transparent)' }} />

                            {/* Recovery Codes */}
                            <TwoFAMethodRow icon={Key} title="Recovery codes"
                                description="Backup codes for when you can't use your phone"
                                enabled={recoveryGenerated}
                                onAction={() => {
                                    if (!recoveryGenerated) { setRecoveryGenerated(true); setShowCodes(true); toast.success('Recovery codes generated'); }
                                    else { setShowCodes(!showCodes); }
                                }}
                                actionLabel={recoveryGenerated ? (showCodes ? 'Hide' : 'View') : 'Generate'}
                                index={2} />

                            <AnimatePresence>
                                {showCodes && recoveryGenerated && (
                                    <div className="px-3 pb-3">
                                        <RecoveryCodesPanel onClose={() => setShowCodes(false)} />
                                    </div>
                                )}
                            </AnimatePresence>

                            <div className="h-px mx-6" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.045) 20%, rgba(0,0,0,0.045) 80%, transparent)' }} />

                            {/* Trusted Devices */}
                            <TwoFAMethodRow icon={Monitor} title="Trusted devices"
                                description={`${trustedDevices.filter(d => !d.removed).length} device${trustedDevices.filter(d => !d.removed).length === 1 ? '' : 's'} skip verification`}
                                enabled={trustedDevices.filter(d => !d.removed).length > 0}
                                onAction={() => setShowDevices(!showDevices)}
                                actionLabel={showDevices ? 'Close' : 'Manage'}
                                index={3} />

                            <AnimatePresence>
                                {showDevices && (
                                    <div className="px-3 pb-3">
                                        <TrustedDevicesPanel devices={trustedDevices} onForget={handleForgetDevice} onRename={handleRenameDevice} />
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Passkeys ── */}
            <SectionTitle>Passkeys</SectionTitle>

            <div className="mt-3">
                <div className="rounded-[14px] mb-5 overflow-hidden"
                    style={{ backgroundColor: 'rgba(0,113,227,0.04)', border: '1px solid rgba(0,113,227,0.08)' }}>
                    <div className="flex items-start gap-3.5 p-4">
                        <Fingerprint size={20} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: C.accent }} />
                        <div className="flex-1">
                            <p className="text-[13px] font-medium" style={{ color: C.text }}>The simplest way to sign in</p>
                            <p className="text-[12px] mt-1" style={{ color: B[600] }}>
                                Use your fingerprint, face, or device PIN instead of a password. Passkeys are phishing-resistant and work across your devices.
                            </p>
                        </div>
                    </div>
                    {!showPasskeySetup && (
                        <div className="px-4 pb-3.5 pt-0">
                            <button onClick={() => setShowPasskeySetup(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-[11px] text-[13px] font-semibold transition-all duration-150 active:scale-[0.97]"
                                style={{ backgroundColor: 'rgba(0,113,227,0.08)', color: C.accent }}>
                                <Plus size={14} strokeWidth={2.2} />
                                Add a passkey
                            </button>
                        </div>
                    )}
                </div>

                {passkeys.length > 0 && (
                    <div className="mb-4">
                        {passkeys.map((pk, i) => (
                            <div key={pk.id}>
                                {i > 0 && <div className="h-px" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }} />}
                                <PasskeyRow name={pk.name} deviceType={pk.deviceType} addedDate={pk.addedDate}
                                    onRemove={() => { setPasskeys(prev => prev.filter(p => p.id !== pk.id)); toast.success(`Passkey for ${pk.name} removed`); }} />
                            </div>
                        ))}
                    </div>
                )}

                <AnimatePresence>
                    {showPasskeySetup && (
                        <PasskeySetupPanel
                            onRegister={(name, deviceType) => {
                                const newId = String(Date.now());
                                setPasskeys(prev => [...prev, { id: newId, name, deviceType: deviceType as 'laptop' | 'phone' | 'key', addedDate: 'Feb 2026' }]);
                                setShowPasskeySetup(false);
                                toast.success(`Passkey "${name}" registered`);
                            }}
                            onClose={() => setShowPasskeySetup(false)} />
                    )}
                </AnimatePresence>
            </div>

            {/* ── Password ── */}
            <SectionTitle>Password</SectionTitle>

            <div className="mt-4 space-y-4">
                <CleanInput label="Current password" type="password" placeholder="Enter current password" />
                <PasswordInputWithReqs label="New password" placeholder="Enter new password" />
                <div className="flex justify-end mt-2">
                    <button onClick={() => toast.success('Password updated')}
                        className="px-5 py-2.5 rounded-[10px] text-white text-[13px] font-medium active:scale-[0.98] transition-all duration-150"
                        style={{ backgroundColor: C.accent }}>
                        Update Password
                    </button>
                </div>
            </div>

            {/* ── Transaction PIN ── */}
            <SectionTitle>Transaction PIN</SectionTitle>

            <div className="mt-3" data-security-section="">
                <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3.5">
                        <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(145deg, rgba(0,113,227,0.08), rgba(90,200,250,0.04))' }}>
                            <Lock size={16} strokeWidth={1.6} style={{ color: C.accent }} />
                        </div>
                        <span className="text-[14px] font-medium" style={{ color: C.text }}>4-digit transaction PIN</span>
                    </div>
                    <button
                        onClick={(e) => {
                            setShowTpinFlow(!showTpinFlow);
                            if (!showTpinFlow) resetTpin();
                            triggerBounce(e.currentTarget);
                        }}
                        className="px-3.5 py-[6px] rounded-[9px] text-[12.5px] font-semibold transition-all duration-150 active:scale-[0.96]"
                        style={{ backgroundColor: 'rgba(0,113,227,0.08)', color: C.accent }}>
                        {showTpinFlow ? 'Close' : 'Change'}
                    </button>
                </div>

                <AnimatePresence>
                    {showTpinFlow && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 260, mass: 0.8 }}
                            style={{ overflow: 'hidden' }}>

                            <div className="rounded-[16px] p-5 mb-4"
                                style={{ backgroundColor: 'rgba(0,0,0,0.018)', border: '1px solid rgba(0,0,0,0.04)' }}>

                                {tpinMode === 'change' ? (
                                    /* ── Change PIN flow ── */
                                    <div>
                                        <p className="text-[13px] font-medium mb-1" style={{ color: C.text }}>
                                            {tpinStep === 0 ? 'Enter your current PIN'
                                                : tpinStep === 1 ? 'Choose a new PIN'
                                                : tpinStep === 2 ? 'Confirm your new PIN'
                                                : 'PIN updated'}
                                        </p>
                                        <p className="text-[11.5px] mb-5" style={{ color: B[600] }}>
                                            {tpinStep === 0 ? "We need to verify it's really you."
                                                : tpinStep === 1 ? 'Pick something memorable, avoid repeated digits.'
                                                : tpinStep === 2 ? 'One more time to make sure.'
                                                : 'Your transaction PIN has been changed successfully.'}
                                        </p>

                                        {tpinStep < 3 && (
                                            <div className="relative flex items-center gap-3 mb-5">
                                                {/* Ambient light pool — radial gradient that tracks the focused input */}
                                                <div style={getAmbientPoolStyle(focusedTpinIdx)} aria-hidden="true" />
                                                {[0, 1, 2, 3].map((i) => (
                                                    <div key={`pin-wrap-${tpinStep}-${i}`} className="relative">
                                                        {/* Per-input halo ring */}
                                                        <div style={getInputHaloStyle(i, focusedTpinIdx)} aria-hidden="true" />
                                                        <input
                                                            key={`pin-${tpinStep}-${i}`}
                                                            ref={el => { tpinRefs.current[i] = el; }}
                                                            type="password"
                                                            inputMode="numeric"
                                                            maxLength={1}
                                                            value={tpinValues[i]}
                                                            onChange={(e) => handleTpinDigit(i, e.target.value)}
                                                            onFocus={() => setFocusedTpinIdx(i)}
                                                            onBlur={() => setFocusedTpinIdx(-1)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Backspace' && !tpinValues[i] && i > 0) tpinRefs.current[i - 1]?.focus();
                                                            }}
                                                            className="relative z-[1] w-[48px] h-[52px] text-center text-[20px] font-semibold rounded-[12px] outline-none"
                                                            style={getPinInputStyle(i, focusedTpinIdx, !!tpinValues[i])}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {tpinStep < 3 ? (
                                            <div className="flex items-center justify-end gap-3">
                                                {tpinStep === 0 && (
                                                    <button
                                                        onClick={() => { setTpinMode('forgot'); setTpinStep(0); setTpinValues(['', '', '', '']); }}
                                                        className="text-[12.5px] font-medium px-3 py-2.5 rounded-[10px] transition-colors duration-150"
                                                        style={{ color: C.accent }}>
                                                        Forgot PIN?
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        if (tpinValues.every(v => v)) {
                                                            if (tpinStep === 2) {
                                                                setTpinStep(3);
                                                                toast.success('Transaction PIN updated');
                                                            } else {
                                                                setTpinStep(tpinStep + 1);
                                                                setTpinValues(['', '', '', '']);
                                                                setTimeout(() => tpinRefs.current[0]?.focus(), 100);
                                                            }
                                                            triggerBounce(e.currentTarget);
                                                        } else {
                                                            toast.error('Please enter all 4 digits');
                                                        }
                                                    }}
                                                    className="px-5 py-2.5 rounded-[10px] text-white text-[13px] font-medium active:scale-[0.97] transition-all duration-150"
                                                    style={{ backgroundColor: C.accent, opacity: tpinValues.every(v => v) ? 1 : 0.5 }}>
                                                    {tpinStep === 2 ? 'Confirm' : 'Continue'}
                                                </button>
                                            </div>
                                        ) : (
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                                className="flex items-center gap-2.5 p-3 rounded-[12px]"
                                                style={{ backgroundColor: 'rgba(52,199,89,0.06)' }}>
                                                <CheckCircle2 size={18} strokeWidth={1.5} style={{ color: C.success }} />
                                                <span className="text-[13px] font-medium" style={{ color: C.success }}>All set! Your new PIN is active.</span>
                                            </motion.div>
                                        )}
                                    </div>
                                ) : (
                                    /* ── Forgot PIN flow ── */
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <button onClick={() => { setTpinMode('change'); setTpinStep(0); setTpinValues(['', '', '', '']); }}
                                                className="text-[12px] font-medium flex items-center gap-1 transition-colors duration-150"
                                                style={{ color: B[600] }}>
                                                ← Back to PIN entry
                                            </button>
                                        </div>

                                        <p className="text-[13px] font-medium mb-1" style={{ color: C.text }}>
                                            {tpinStep === 0 ? 'Verify your identity'
                                                : tpinStep === 1 ? 'Enter the code we sent'
                                                : tpinStep === 2 ? 'Set your new PIN'
                                                : tpinStep === 3 ? 'Confirm your new PIN'
                                                : 'PIN has been reset'}
                                        </p>
                                        <p className="text-[11.5px] mb-5" style={{ color: B[600] }}>
                                            {tpinStep === 0 ? 'Enter your passport number so we can verify your identity securely.'
                                                : tpinStep === 1 ? 'A 6-digit code was sent to +1 (555) •••-4829'
                                                : tpinStep === 2 ? 'Choose a new 4-digit PIN.'
                                                : tpinStep === 3 ? 'Confirm it one more time.'
                                                : 'Your transaction PIN has been reset successfully.'}
                                        </p>

                                        {tpinStep === 0 && (
                                            <div className="mb-5">
                                                <label className="text-[12px] font-medium block mb-2" style={{ color: B[600] }}>Passport number</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. AB1234567"
                                                    value={tpinPassport}
                                                    onChange={(e) => setTpinPassport(e.target.value.toUpperCase())}
                                                    className="w-full rounded-[10px] px-4 py-3 text-[14px] font-medium outline-none transition-all duration-200 tracking-wider"
                                                    style={{
                                                        backgroundColor: 'white',
                                                        border: `1.5px solid ${tpinPassport ? C.accent : 'rgba(0,0,0,0.1)'}`,
                                                        color: C.text,
                                                        boxShadow: tpinPassport ? '0 0 0 3px rgba(0,113,227,0.08)' : 'none',
                                                    }}
                                                />
                                                <p className="text-[10.5px] mt-2 flex items-center gap-1.5" style={{ color: B[600] }}>
                                                    <Lock size={10} strokeWidth={1.8} />
                                                    Your passport number is only used for this verification and is never stored.
                                                </p>
                                            </div>
                                        )}

                                        {tpinStep === 1 && (
                                            <div className="flex items-center gap-2.5 mb-5">
                                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                                    <input
                                                        key={`otp-${i}`}
                                                        ref={el => { otpRefs.current[i] = el; }}
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={1}
                                                        value={tpinOtp[i]}
                                                        onChange={(e) => handleOtpDigit(i, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Backspace' && !tpinOtp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                                                        }}
                                                        className="w-[42px] h-[48px] text-center text-[18px] font-semibold rounded-[10px] outline-none transition-all duration-200"
                                                        style={{
                                                            backgroundColor: 'white',
                                                            border: `1.5px solid ${tpinOtp[i] ? C.accent : 'rgba(0,0,0,0.1)'}`,
                                                            color: C.text,
                                                            boxShadow: tpinOtp[i] ? '0 0 0 3px rgba(0,113,227,0.08)' : 'none',
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {(tpinStep === 2 || tpinStep === 3) && (
                                            <div className="flex items-center gap-3 mb-5">
                                                {[0, 1, 2, 3].map((i) => (
                                                    <input
                                                        key={`fpin-${tpinStep}-${i}`}
                                                        ref={el => { tpinRefs.current[i] = el; }}
                                                        type="password"
                                                        inputMode="numeric"
                                                        maxLength={1}
                                                        value={tpinValues[i]}
                                                        onChange={(e) => handleTpinDigit(i, e.target.value)}
                                                        onFocus={() => setFocusedTpinIdx(i)}
                                                        onBlur={() => setFocusedTpinIdx(-1)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Backspace' && !tpinValues[i] && i > 0) tpinRefs.current[i - 1]?.focus();
                                                        }}
                                                        className="w-[48px] h-[52px] text-center text-[20px] font-semibold rounded-[12px] outline-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                                        style={getPinInputStyle(i, focusedTpinIdx, !!tpinValues[i])}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {tpinStep < 4 ? (
                                            <div className="flex justify-end">
                                            <button
                                                onClick={(e) => {
                                                    if (tpinStep === 0) {
                                                        if (tpinPassport.length >= 5) {
                                                            setTpinStep(1);
                                                            toast('Verification code sent to your phone', { description: '+1 (555) •••-4829' });
                                                            setTimeout(() => otpRefs.current[0]?.focus(), 100);
                                                        } else {
                                                            toast.error('Please enter a valid passport number');
                                                        }
                                                    } else if (tpinStep === 1) {
                                                        if (tpinOtp.every(v => v)) {
                                                            setTpinStep(2);
                                                            setTpinValues(['', '', '', '']);
                                                            setTimeout(() => tpinRefs.current[0]?.focus(), 100);
                                                            toast.success('Identity verified');
                                                        } else {
                                                            toast.error('Please enter the full 6-digit code');
                                                        }
                                                    } else if (tpinStep === 2) {
                                                        if (tpinValues.every(v => v)) {
                                                            setTpinStep(3);
                                                            setTpinValues(['', '', '', '']);
                                                            setTimeout(() => tpinRefs.current[0]?.focus(), 100);
                                                        } else {
                                                            toast.error('Please enter all 4 digits');
                                                        }
                                                    } else if (tpinStep === 3) {
                                                        if (tpinValues.every(v => v)) {
                                                            setTpinStep(4);
                                                            toast.success('Transaction PIN has been reset');
                                                        } else {
                                                            toast.error('Please enter all 4 digits');
                                                        }
                                                    }
                                                    triggerBounce(e.currentTarget);
                                                }}
                                                className="px-5 py-2.5 rounded-[10px] text-white text-[13px] font-medium active:scale-[0.97] transition-all duration-150"
                                                style={{
                                                    backgroundColor: C.accent,
                                                    opacity: (tpinStep === 0 && tpinPassport.length >= 5) || (tpinStep === 1 && tpinOtp.every(v => v)) || ((tpinStep === 2 || tpinStep === 3) && tpinValues.every(v => v)) ? 1 : 0.5,
                                                }}>
                                                {tpinStep === 0 ? 'Send verification code'
                                                    : tpinStep === 1 ? 'Verify'
                                                    : tpinStep === 3 ? 'Reset PIN'
                                                    : 'Continue'}
                                            </button>
                                            </div>
                                        ) : (
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                                className="flex items-center gap-2.5 p-3 rounded-[12px]"
                                                style={{ backgroundColor: 'rgba(52,199,89,0.06)' }}>
                                                <CheckCircle2 size={18} strokeWidth={1.5} style={{ color: C.success }} />
                                                <span className="text-[13px] font-medium" style={{ color: C.success }}>PIN reset complete. You're all set.</span>
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Session Management ── */}
            <SectionTitle>Session management</SectionTitle>
            <Sep />


            {/* ── Recent Activity ── */}
            <SectionTitle>Recent activity</SectionTitle>

            <div className="mt-3 space-y-0">
                <ActivityRow text="Login from Chrome · MacBook" time="Just now" active />
                <ActivityRow text="Password changed" time="3 days ago" />
                <ActivityRow text="Login from Safari · iPhone" time="5 days ago" />
                <ActivityRow text="New passkey registered" time="2 weeks ago" />
            </div>

            {/* ── Unregister ── */}
            <div className="mt-12 mb-2">
                <div className="h-px mb-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)' }} />

                <div className="rounded-[18px] overflow-hidden transition-all duration-300"
                    style={{
                        backgroundColor: showUnregister ? 'rgba(255,59,48,0.02)' : 'rgba(0,0,0,0.012)',
                        border: `1px solid ${showUnregister ? 'rgba(255,59,48,0.08)' : 'rgba(0,0,0,0.04)'}`,
                    }}>

                    <button
                        onClick={(e) => {
                            setShowUnregister(!showUnregister);
                            setUnregisterStep(0);
                            setUnregisterConfirm('');
                            setUnregisterReason('');
                            setUnregisterCustomReason('');
                            triggerBounce(e.currentTarget);
                        }}
                        className="w-full flex items-center gap-3 px-6 py-3 transition-colors duration-200 opacity-50 hover:opacity-75"
                        style={{ marginTop: 8 }}>
                        <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: showUnregister ? 'rgba(255,59,48,0.06)' : 'rgba(0,0,0,0.02)' }}>
                            <User size={13} strokeWidth={1.5} style={{ color: B[600] }} />
                        </div>
                        <div className="text-left flex-1">
                            <span className="text-[12px] block" style={{ color: B[600] }}>Unregister account</span>
                        </div>
                        <ChevronRight size={13} strokeWidth={1.5}
                            className="transition-transform duration-200"
                            style={{ color: B[600], transform: showUnregister ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                    </button>

                    <AnimatePresence>
                        {showUnregister && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: 'spring', damping: 28, stiffness: 260, mass: 0.8 }}
                                style={{ overflow: 'hidden' }}>

                                <div className="px-6 pb-6">
                                    {/* ── Step 0: Warning ── */}
                                    {unregisterStep === 0 && (
                                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                            <div className="rounded-[14px] p-4 mb-5"
                                                style={{ backgroundColor: 'rgba(255,149,0,0.04)', border: '1px solid rgba(255,149,0,0.08)' }}>
                                                <div className="flex items-start gap-3">
                                                    <AlertTriangle size={18} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: '#FF9500' }} />
                                                    <div>
                                                        <p className="text-[13px] font-medium mb-1.5" style={{ color: C.text }}>Before you go</p>
                                                        <p className="text-[12px]" style={{ color: B[700], lineHeight: 1.6 }}>
                                                            We're sorry to see you go. Unregistering will permanently delete your account,
                                                            order history, saved addresses, and all payment methods after a 30-day grace period.
                                                            During this period, you can sign back in to cancel the process.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 mb-5 text-[12.5px]" style={{ color: B[600] }}>
                                                <div className="flex items-center gap-3">
                                                    <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(255,59,48,0.35)' }} />
                                                    <span>All pending orders will be cancelled and refunded</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(255,59,48,0.35)' }} />
                                                    <span>Your business profiles and bank links will be removed</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(255,59,48,0.35)' }} />
                                                    <span>You can reregister with the same email after 30 days</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-end">
                                                <button
                                                    onClick={(e) => { setUnregisterStep(1); triggerBounce(e.currentTarget); }}
                                                    className="px-5 py-2.5 rounded-[10px] text-[13px] font-medium active:scale-[0.97] transition-all duration-150"
                                                    style={{ backgroundColor: 'rgba(255,59,48,0.08)', color: C.danger }}>
                                                    I understand, continue
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* ── Step 1: Reason for leaving + assistance offer ── */}
                                    {unregisterStep === 1 && (
                                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                            <p className="text-[13px] font-medium mb-1" style={{ color: C.text }}>Help us improve</p>
                                            <p className="text-[12px] mb-4" style={{ color: B[600], lineHeight: 1.5 }}>
                                                We'd love to understand why you're leaving. Your feedback helps us build a better experience for everyone.
                                            </p>

                                            <div className="space-y-2 mb-5">
                                                {[
                                                    { key: 'alternative', label: 'I found a better alternative' },
                                                    { key: 'pricing', label: 'Too expensive or pricing doesn\u2019t fit my needs' },
                                                    { key: 'unused', label: 'I don\u2019t use it enough to justify keeping it' },
                                                    { key: 'privacy', label: 'Privacy or security concerns' },
                                                    { key: 'bugs', label: 'Technical issues or bugs I couldn\u2019t resolve' },
                                                    { key: 'features', label: 'Missing features I need' },
                                                    { key: 'other', label: 'Other reason' },
                                                ].map(({ key, label }) => (
                                                    <button
                                                        key={key}
                                                        onClick={(e) => {
                                                            setUnregisterReason(key);
                                                            if (key !== 'other') setUnregisterCustomReason('');
                                                            triggerBounce(e.currentTarget);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left transition-all duration-200 active:scale-[0.98]"
                                                        style={{
                                                            backgroundColor: unregisterReason === key ? 'rgba(255,59,48,0.04)' : 'rgba(0,0,0,0.02)',
                                                            border: `1.5px solid ${unregisterReason === key ? 'rgba(255,59,48,0.18)' : 'rgba(0,0,0,0.04)'}`,
                                                            boxShadow: unregisterReason === key ? '0 0 0 3px rgba(255,59,48,0.04)' : 'none',
                                                        }}>
                                                        <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                                                            style={{
                                                                border: `2px solid ${unregisterReason === key ? C.danger : 'rgba(0,0,0,0.12)'}`,
                                                                backgroundColor: unregisterReason === key ? C.danger : 'transparent',
                                                            }}>
                                                            {unregisterReason === key && (
                                                                <motion.div
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    transition={{ type: 'spring', damping: 15, stiffness: 400 }}
                                                                    className="w-[6px] h-[6px] rounded-full"
                                                                    style={{ backgroundColor: 'white' }}
                                                                />
                                                            )}
                                                        </div>
                                                        <span className="text-[13px]" style={{ color: unregisterReason === key ? C.danger : C.text }}>
                                                            {label}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Custom reason text area */}
                                            <AnimatePresence>
                                                {unregisterReason === 'other' && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                                        style={{ overflow: 'hidden' }}>
                                                        <textarea
                                                            placeholder="Tell us more about why you're leaving..."
                                                            value={unregisterCustomReason}
                                                            onChange={(e) => setUnregisterCustomReason(e.target.value)}
                                                            rows={3}
                                                            className="w-full rounded-[12px] px-4 py-3 text-[13px] outline-none resize-none mb-5 transition-all duration-200"
                                                            style={{
                                                                backgroundColor: 'white',
                                                                border: `1.5px solid ${unregisterCustomReason ? 'rgba(255,59,48,0.15)' : 'rgba(0,0,0,0.08)'}`,
                                                                color: C.text,
                                                                lineHeight: 1.6,
                                                            }}
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Assistance offer card */}
                                            {unregisterReason && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.35, delay: 0.1 }}
                                                    className="rounded-[14px] p-4 mb-5"
                                                    style={{ backgroundColor: 'rgba(0,113,227,0.03)', border: '1px solid rgba(0,113,227,0.08)' }}>
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0"
                                                            style={{ background: 'rgba(0,113,227,0.07)' }}>
                                                            <MessageCircle size={16} strokeWidth={1.5} style={{ color: C.accent }} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-[13px] font-medium mb-1" style={{ color: C.text }}>
                                                                We'd like to help
                                                            </p>
                                                            <p className="text-[12px] mb-3" style={{ color: B[600], lineHeight: 1.6 }}>
                                                                Before you go, would you like to chat with a member of our team?
                                                                We may be able to resolve your concern or find a better plan that works for you.
                                                            </p>
                                                            <button
                                                                onClick={(e) => {
                                                                    toast.success('Chat request sent', {
                                                                        description: 'A support specialist will reach out within the hour.',
                                                                    });
                                                                    triggerBounce(e.currentTarget);
                                                                }}
                                                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[12.5px] font-medium active:scale-[0.97] transition-all duration-150"
                                                                style={{
                                                                    backgroundColor: 'rgba(0,113,227,0.08)',
                                                                    color: C.accent,
                                                                }}>
                                                                <MessageSquare size={14} strokeWidth={1.5} />
                                                                Start a 1-to-1 conversation
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => { setUnregisterStep(0); setUnregisterReason(''); setUnregisterCustomReason(''); }}
                                                    className="px-4 py-2.5 rounded-[10px] text-[13px] font-medium transition-colors duration-150"
                                                    style={{ color: B[600] }}>
                                                    Back
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        if (unregisterReason) {
                                                            setUnregisterStep(2);
                                                            triggerBounce(e.currentTarget);
                                                        } else {
                                                            toast.error('Please select a reason to continue');
                                                        }
                                                    }}
                                                    className="px-5 py-2.5 rounded-[10px] text-[13px] font-medium active:scale-[0.97] transition-all duration-150"
                                                    style={{
                                                        backgroundColor: 'rgba(255,59,48,0.08)',
                                                        color: C.danger,
                                                        opacity: unregisterReason ? 1 : 0.4,
                                                    }}>
                                                    Continue anyway
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* ── Step 2: Type UNREGISTER to confirm ── */}
                                    {unregisterStep === 2 && (
                                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                            <p className="text-[13px] font-medium mb-1" style={{ color: C.text }}>Confirm by typing</p>
                                            <p className="text-[11.5px] mb-4" style={{ color: B[600] }}>
                                                Type <span className="font-semibold" style={{ color: C.danger }}>UNREGISTER</span> below to confirm you want to permanently close your account.
                                            </p>

                                            <input
                                                type="text"
                                                placeholder="Type UNREGISTER"
                                                value={unregisterConfirm}
                                                onChange={(e) => setUnregisterConfirm(e.target.value)}
                                                className="w-full rounded-[10px] px-4 py-3 text-[14px] font-medium outline-none transition-all duration-200 tracking-wider mb-5"
                                                style={{
                                                    backgroundColor: 'white',
                                                    border: `1.5px solid ${unregisterConfirm === 'UNREGISTER' ? C.danger : 'rgba(0,0,0,0.1)'}`,
                                                    color: unregisterConfirm === 'UNREGISTER' ? C.danger : C.text,
                                                    boxShadow: unregisterConfirm === 'UNREGISTER' ? '0 0 0 3px rgba(255,59,48,0.08)' : 'none',
                                                }}
                                            />

                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => { setShowUnregister(false); setUnregisterStep(0); setUnregisterConfirm(''); setUnregisterReason(''); setUnregisterCustomReason(''); }}
                                                    className="px-4 py-2.5 rounded-[10px] text-[13px] font-medium transition-colors duration-150"
                                                    style={{ color: B[600] }}>
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        if (unregisterConfirm === 'UNREGISTER') {
                                                            setUnregisterStep(3);
                                                            toast('Account scheduled for deletion', { description: 'Sign back in within 30 days to cancel.' });
                                                            triggerBounce(e.currentTarget);
                                                        } else {
                                                            toast.error('Please type UNREGISTER exactly');
                                                        }
                                                    }}
                                                    className="px-5 py-2.5 rounded-[10px] text-white text-[13px] font-medium active:scale-[0.97] transition-all duration-150"
                                                    style={{ backgroundColor: C.danger, opacity: unregisterConfirm === 'UNREGISTER' ? 1 : 0.4 }}>
                                                    Unregister my account
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* ── Step 3: Confirmation ── */}
                                    {unregisterStep === 3 && (
                                        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                                            className="rounded-[14px] p-5 text-center"
                                            style={{ backgroundColor: 'rgba(255,59,48,0.03)' }}>
                                            <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center mx-auto mb-3"
                                                style={{ backgroundColor: 'rgba(255,59,48,0.08)' }}>
                                                <User size={20} strokeWidth={1.5} style={{ color: C.danger }} />
                                            </div>
                                            <p className="text-[14px] font-semibold mb-1" style={{ color: C.text }}>Account scheduled for closure</p>
                                            <p className="text-[12px]" style={{ color: B[600], lineHeight: 1.6 }}>
                                                Your account will be permanently removed on March 28, 2026.
                                                Sign back in anytime before then to cancel.
                                            </p>
                                            <p className="text-[11px] mt-3" style={{ color: B[600] }}>
                                                We hope to welcome you back someday.
                                            </p>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

/* ── Small helpers ── */
function ActivityRow({ text, time, active }: { text: string; time: string; active?: boolean }) {
    return (
        <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
                {active && <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: C.success }} />}
                <span className="text-[13px] font-normal" style={{ color: C.text }}>{text}</span>
            </div>
            <span className="text-[12px]" style={{ color: B[600] }}>{time}</span>
        </div>
    );
}

function CleanInput({ label, type = 'text', placeholder }: { label: string; type?: string; placeholder?: string }) {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <label className="text-[12px] font-medium block mb-2" style={{ color: B[600] }}>{label}</label>
            <input type={type} placeholder={placeholder}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                className="w-full rounded-[10px] px-4 py-3 text-[14px] font-normal transition-all duration-200 outline-none"
                style={{
                    backgroundColor: 'white',
                    border: `1px solid ${focused ? C.accent : 'rgba(0,0,0,0.1)'}`,
                    color: C.text,
                    boxShadow: focused ? `0 0 0 3px rgba(0,113,227,0.12)` : 'none',
                }} />
        </div>
    );
}

/* ══════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════ */
export function SettingsPopover() {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const avatarRef = useRef<HTMLButtonElement>(null);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
    const [hovered, setHovered] = useState(false);
    const momentumRef = useRef({ value: 0 });
    const [authUser, setAuthUser] = useState<any | null>(null);

    useEffect(() => {
        setAuthUser(readVehslUser());
    }, []);

    const userDisplay = useMemo(() => getUserDisplay(authUser), [authUser]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (momentumRef.current.value > 0)
                momentumRef.current.value = Math.max(0, momentumRef.current.value * 0.92 - 0.005);
        }, 100);
        return () => clearInterval(interval);
    }, []);

    const openPopover = useCallback(() => {
        if (avatarRef.current) setAnchorRect(avatarRef.current.getBoundingClientRect());
        momentumRef.current.value = Math.min(1, momentumRef.current.value + 0.1);
        setPopoverOpen(true);
    }, []);
    const closePopover = useCallback(() => setPopoverOpen(false), []);
    const openSettings = useCallback(() => {
        setPopoverOpen(false);
        setTimeout(() => setSettingsOpen(true), 100);
    }, []);
    const closeSettings = useCallback(() => setSettingsOpen(false), []);

    const bounceAvatar = useCallback(() => {
        const el = avatarRef.current;
        if (!el) return;
        const m = momentumRef.current.value;
        const amp = 0.3 + m * 0.7;
        el.animate([
            { transform: 'scale(1)', offset: 0 },
            { transform: `scale(${1 - 0.05 * amp})`, offset: 0.2 },
            { transform: `scale(${1 + 0.025 * amp})`, offset: 0.55 },
            { transform: 'scale(1)', offset: 1 },
        ], { duration: 300 + m * 60, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
    }, []);

    return (
        <>
            <button ref={avatarRef}
                onClick={() => { if (popoverOpen) closePopover(); else { openPopover(); bounceAvatar(); } }}
                onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-200"
                style={{
                    backgroundColor: popoverOpen || hovered ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.6)',
                    color: C.text,
                    backdropFilter: 'blur(20px)',
                }}>
                {userDisplay.initial}
            </button>
            <AnimatePresence>
                {popoverOpen && <ProfilePopover anchorRect={anchorRect} onClose={closePopover} onOpenSettings={openSettings} momentumRef={momentumRef} />}
            </AnimatePresence>
            <AnimatePresence>
                {settingsOpen && <FullSettingsModal onClose={closeSettings} />}
            </AnimatePresence>
        </>
    );
}
