"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
    Camera, Package, MapPin, Rocket, DollarSign,
    Check, Plus, ArrowRight, Sparkles, Shield,
    Truck, Bell, HelpCircle, Eye, Factory, Star,
    MessageCircle, ChevronRight, CheckCircle2, Zap,
    EyeOff, X, FileText, Award, Search, FlaskConical,
    Building2, ClipboardCheck, ShieldCheck, Clock,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { FONT, EASE, GLASS, GLASS_ELEVATED, fmt } from './seller-dashboard-data';

// ─── Types ────────────────────────────────────────────────────────────────────

type StepId = 'request' | 'compliance' | 'samples' | 'inspection' | 'live';
type FullStep = 'welcome' | StepId | 'done';

interface ProductDraft {
    photo: string | null;
    photoFile: File | null;
    uploading: boolean;
    name: string;
    price: string;
    qty: number;
    category: string;
    categoryId: number | null;
    currency: string;
    sku: string;
    hsCode: string;
    originCountry: string;
    originRegion: string;
    originCity: string;
    leadTimeDays: string;
    weightGrams: string;
    shipTimeMinDays: string;
    shipTimeMaxDays: string;
    sampleAvailable: boolean;
    sampleShipDays: string;
    extraPhotos: File[];
    documents: File[];
    description: string;
    companyName: string;
    monthlyCapacity: string;
    ipProtectionLevel: 'low' | 'medium' | 'high';
    trademarkRegistrationNumber: string;
    variations: Array<{ sku: string; attributes: Array<{ key: string; value: string }> }>;
    pricingTiers: Array<{ variationIndex: number | null; minQuantity: string; maxQuantity: string; unitPrice: string; currency: string }>;
    specifications: Array<{ title: string; collapsed?: boolean; items: Array<{ label: string; value: string }> }>;
}

interface SampleDraft {
    type: 'factory' | 'warehouse' | 'office';
    address: string;
    contactName: string;
    phone: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
    'Electronics', 'Fashion & Apparel', 'Home & Garden',
    'Food & Beverage', 'Health & Beauty', 'Handmade & Crafts',
    'Industrial & Mfg.', 'Sports & Outdoors', 'Other',
];

const MILESTONES: { id: StepId; Icon: React.ElementType; label: string; tip: string }[] = [
    { id: 'request', Icon: FileText,       label: 'Request',  tip: 'Submit your listing' },
    { id: 'compliance', Icon: Shield,      label: 'Compliance', tip: 'Compliance verification' },
    { id: 'samples', Icon: Package,        label: 'Samples',  tip: 'We collect samples'  },
    { id: 'inspection', Icon: Factory,     label: 'Inspect',  tip: 'Factory visit'        },
    { id: 'live',    Icon: Star,           label: 'Rated & Live', tip: 'Published with rating' },
];

// Verification walkthrough — what happens after the seller submits their request
const VERIFICATION_PHASES = [
    {
        emoji: '\uD83D\uDCCB',
        title: 'Listing review begins',
        sub: 'Our seller team reviews your submitted details and documentation within 24\u00A0hours of your request.',
        action: 'Continue \u2192',
        accentColor: '#0171E3',
    },
    {
        emoji: '\uD83D\uDCE6',
        title: 'We collect your samples',
        sub: 'A team member contacts you to schedule a sample pickup. No shipping needed \u2014 we come to you.',
        action: 'Continue \u2192',
        accentColor: '#0171E3',
    },
    {
        emoji: '\uD83C\uDFED',
        title: 'Factory inspection visit',
        sub: 'An independent inspector visits your manufacturing unit to assess production capacity, standards, and working conditions.',
        action: 'Continue \u2192',
        accentColor: '#e67e22',
    },
    {
        emoji: '\uD83E\uDDEA',
        title: 'Lab & quality testing',
        sub: 'Samples undergo physical, chemical, and durability testing. Results are typically ready within 5\u20137 business days.',
        action: 'Continue \u2192',
        accentColor: '#e67e22',
    },
    {
        emoji: '\u2B50',
        title: 'Your rating is assigned',
        sub: 'A verified quality score is computed from all test results and the inspection report. This badge travels with every order.',
        action: 'See my rating \u2192',
        accentColor: '#5EC072',
    },
    {
        emoji: '\uD83D\uDE80',
        title: 'You go live',
        sub: 'Your listing is published with a verified badge and your quality rating. Real buyers can discover you from this moment.',
        action: "I\u2019m ready to sell \u2192",
        accentColor: '#5EC072',
    },
] as const;

// ─── Weighted bounce: grows more satisfying as the seller takes actions ───────

function useWeightedBounce() {
    const actionsRef = useRef(0);
    const bounce = useCallback((el: HTMLElement | null) => {
        if (!el) return;
        const a = actionsRef.current;
        const compress = 1 - (0.016 + Math.min(a, 8) * 0.002);
        const overshoot = 1 + (0.006 + Math.min(a, 8) * 0.0008);
        const dur = 360 + Math.min(a, 8) * 25;
        el.animate(
            [
                { transform: 'scale(1)' },
                { transform: `scale(${compress})` },
                { transform: `scale(${overshoot})` },
                { transform: 'scale(1)' },
            ],
            { duration: dur, easing: 'cubic-bezier(0.34,1.56,0.64,1)' }
        );
        actionsRef.current = Math.min(12, a + 1);
    }, []);
    return bounce;
}

// ─── Sparkle celebration particles ───────────────────────────────────────────

function CelebrationBurst() {
    const sparks = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        angle: (i / 12) * 360,
        color: i % 3 === 0 ? '#5EC072' : i % 3 === 1 ? '#0171E3' : '#e67e22',
        size: 6 + (i % 3) * 3,
        distance: 60 + (i % 4) * 20,
    }));
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {sparks.map(s => (
                <motion.div
                    key={s.id}
                    className="absolute rounded-full"
                    style={{ width: s.size, height: s.size, background: s.color }}
                    initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                    animate={{
                        opacity: 0,
                        scale: [0, 1.4, 0.8],
                        x: Math.cos((s.angle * Math.PI) / 180) * s.distance,
                        y: Math.sin((s.angle * Math.PI) / 180) * s.distance,
                    }}
                    transition={{ duration: 0.9, ease: [0.2, 0, 0.4, 1] }}
                />
            ))}
        </div>
    );
}

// ─── Rating Stars display ─────────────────────────────────────────────────────

function RatingStars({ rating, size = 14 }: { rating: number; size?: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star
                    key={s}
                    size={size}
                    fill={s <= Math.floor(rating) ? '#e67e22' : s - 0.5 <= rating ? '#e67e22' : 'none'}
                    color="#e67e22"
                    strokeWidth={1.5}
                />
            ))}
        </div>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    sellerName?: string;
    onComplete: () => void;
    initialStep?: FullStep;
    showWelcome?: boolean;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NewSellerOnboarding({ sellerName = 'Noah', onComplete, initialStep, showWelcome = true }: Props) {
    const wBounce = useWeightedBounce();

    // Navigation & progress
    const [step, setStep] = useState<FullStep>(initialStep ?? (showWelcome ? 'welcome' : 'request'));
    const [completed, setCompleted] = useState<Set<StepId>>(new Set());
    const [celebrating, setCelebrating] = useState(false);

    // Product / request draft
    const [product, setProduct] = useState<ProductDraft>({
        photo: null, photoFile: null, uploading: false, name: '', price: '', qty: 50,
        category: '',
        categoryId: null,
        currency: 'USD',
        sku: '',
        hsCode: '',
        originCountry: '',
        originRegion: '',
        originCity: '',
        leadTimeDays: '',
        weightGrams: '',
        shipTimeMinDays: '',
        shipTimeMaxDays: '',
        sampleAvailable: false,
        sampleShipDays: '',
        extraPhotos: [],
        documents: [],
        description: '',
        companyName: '',
        monthlyCapacity: '',
        ipProtectionLevel: 'low',
        trademarkRegistrationNumber: '',
        variations: [],
        pricingTiers: [],
        specifications: [],
    });
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [nameError, setNameError] = useState(false);
    const [priceError, setPriceError] = useState(false);
    const [companyError, setCompanyError] = useState(false);

    // Sample pickup address
    const [sample, setSample] = useState<SampleDraft>({
        type: 'factory', address: '', contactName: '', phone: '',
    });

    // Inspection walkthrough phase
    const [verifyPhase, setVerifyPhase] = useState(0);

    // Assigned rating (shown in live step)
    const [assignedRating, setAssignedRating] = useState<number>(4.8);
    const [serverStage, setServerStage] = useState<string>('');

    const [listingId, setListingId] = useState<number | null>(null);
    const [submittingRequest, setSubmittingRequest] = useState(false);
    const [savingSample, setSavingSample] = useState(false);
    const [advancing, setAdvancing] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const didAutoCompleteRef = useRef(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const extraPhotosRef = useRef<HTMLInputElement | null>(null);
    const documentsRef = useRef<HTMLInputElement | null>(null);
    const [extraPhotoUrls, setExtraPhotoUrls] = useState<string[]>([]);

    const [categoryOptions, setCategoryOptions] = useState<Array<{ id: number; name: string }>>([]);
    const [categoryLoading, setCategoryLoading] = useState(true);
    const [categoryQuery, setCategoryQuery] = useState("");
    const [showAllCategories, setShowAllCategories] = useState(false);

    const apiBase = useCallback(() => {
        const fromEnv = (process.env.NEXT_PUBLIC_API_URL || '').trim();
        const normalize = (u: string) => u.replace(/\/$/, '');
        if (fromEnv && /^https?:\/\//.test(fromEnv) && !/\/\/backend(?=[:/]|$)/.test(fromEnv)) return normalize(fromEnv);
        const host = (window.location.hostname === '0.0.0.0' || window.location.hostname === '') ? 'localhost' : window.location.hostname;
        return normalize(`${window.location.protocol}//${host}:8000`);
    }, []);

    const readAuth = useCallback(() => {
        try {
            return {
                access: window.localStorage.getItem('vehsl.access') || '',
                refresh: window.localStorage.getItem('vehsl.refresh') || '',
            };
        } catch {
            return { access: '', refresh: '' };
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                if (!cancelled) setCategoryLoading(true);
                const res = await fetch(`${apiBase()}/api/v1/categories/explore/`);
                if (!res.ok) return;
                const data = await res.json().catch(() => null);
                const rows = Array.isArray(data?.categories) ? data.categories : [];
                const flat: Array<{ id: number; name: string }> = [];
                for (const c of rows) {
                    const topId = Number((c as any)?.id || 0);
                    const topName = String((c as any)?.name || '').trim();
                    if (topId && topName) flat.push({ id: topId, name: topName });
                    const children = Array.isArray((c as any)?.children) ? (c as any).children : [];
                    for (const ch of children) {
                        const chId = Number((ch as any)?.id || 0);
                        const chName = String((ch as any)?.name || '').trim();
                        if (chId && chName) flat.push({ id: chId, name: `${topName} · ${chName}`.trim() });
                    }
                }
                if (!cancelled) setCategoryOptions(flat);
            } catch { 
            } finally {
                if (!cancelled) setCategoryLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [apiBase]);

    useEffect(() => {
        const { access } = readAuth();
        if (!access) return;
        (async () => {
            try {
                const res = await fetch(`${apiBase()}/api/v1/seller/listing-requests/`, {
                    headers: { Authorization: `Bearer ${access}` },
                });
                if (!res.ok) return;
                const list = await res.json().catch(() => null);
                if (!Array.isArray(list) || list.length === 0) return;
                const active = (list.find((x: any) => x && x.stage !== 'done') || list[0]) as any;
                if (!active || typeof active.id !== 'number') return;

                setListingId(active.id);
                setAssignedRating(typeof active.rating === 'number' ? active.rating : Number(active.rating || 4.8));
                setServerStage((active.stage || '').toString().toLowerCase());

                const firstPhoto = Array.isArray(active.photos) && active.photos[0] ? active.photos[0] : null;
                const meta = active.product_meta && typeof active.product_meta === 'object' ? active.product_meta : {};
                const origin = meta.origin_location && typeof meta.origin_location === 'object' ? meta.origin_location : {};
                const detailCfg = meta.detail_config && typeof meta.detail_config === 'object' ? meta.detail_config : {};
                const rawSpecs = Array.isArray((detailCfg as any)?.specifications) ? (detailCfg as any).specifications : [];
                const specs = rawSpecs
                    .filter((g: any) => g && typeof g === 'object')
                    .map((g: any) => ({
                        title: String(g.title || '').trim(),
                        collapsed: Boolean(g.collapsed),
                        items: Array.isArray(g.items)
                            ? g.items
                                  .filter((it: any) => it && typeof it === 'object')
                                  .map((it: any) => ({ label: String(it.label || '').trim(), value: String(it.value || '').trim() }))
                                  .filter((it: any) => it.label && it.value)
                            : [],
                    }))
                    .filter((g: any) => g.title && g.items.length > 0);
                const rawVars = Array.isArray((meta as any)?.variations) ? (meta as any).variations : [];
                const variations = rawVars
                    .filter((v: any) => v && typeof v === 'object')
                    .map((v: any) => {
                        const attrs = v.attributes && typeof v.attributes === 'object' ? v.attributes : {};
                        const pairs = Object.entries(attrs as Record<string, any>)
                            .map(([k, val]) => ({ key: String(k || '').trim(), value: String(val || '').trim() }))
                            .filter((p: any) => p.key && p.value);
                        return { sku: String(v.sku || '').trim(), attributes: pairs.length ? pairs : [{ key: '', value: '' }] };
                    });
                const rawTiers = Array.isArray((meta as any)?.pricing_tiers) ? (meta as any).pricing_tiers : [];
                const pricingTiers = rawTiers
                    .filter((t: any) => t && typeof t === 'object')
                    .map((t: any) => ({
                        variationIndex: t.variation == null ? null : Number(t.variation),
                        minQuantity: t.min_quantity != null ? String(t.min_quantity) : '1',
                        maxQuantity: t.max_quantity != null ? String(t.max_quantity) : '',
                        unitPrice: t.unit_price != null ? String(t.unit_price) : '',
                        currency: String(t.currency || active.currency || 'USD').toUpperCase(),
                    }))
                    .filter((t: any) => t.unitPrice.trim());
                setProduct(p => ({
                    ...p,
                    photo: (firstPhoto?.file_url || p.photo),
                    photoFile: null,
                    name: (active.product_name || p.name),
                    companyName: (active.company_name || p.companyName),
                    price: (active.unit_price != null ? String(active.unit_price) : p.price),
                    qty: (active.moq != null ? Number(active.moq) : p.qty),
                    category: (active.category_label || p.category),
                    categoryId: (typeof active.category === 'number' ? active.category : p.categoryId),
                    currency: (active.currency || p.currency),
                    sku: (meta.sku || p.sku),
                    hsCode: (meta.hs_code || p.hsCode),
                    originCountry: (origin.country || p.originCountry),
                    originRegion: (origin.region || p.originRegion),
                    originCity: (origin.city || p.originCity),
                    leadTimeDays: (meta.lead_time_days != null ? String(meta.lead_time_days) : p.leadTimeDays),
                    weightGrams: (meta.weight_grams != null ? String(meta.weight_grams) : p.weightGrams),
                    shipTimeMinDays: (meta.ship_time_min_days != null ? String(meta.ship_time_min_days) : p.shipTimeMinDays),
                    shipTimeMaxDays: (meta.ship_time_max_days != null ? String(meta.ship_time_max_days) : p.shipTimeMaxDays),
                    sampleAvailable: Boolean(meta.sample_available ?? p.sampleAvailable),
                    sampleShipDays: (meta.sample_ship_days != null ? String(meta.sample_ship_days) : p.sampleShipDays),
                    description: (active.description || p.description),
                    monthlyCapacity: (active.monthly_capacity || p.monthlyCapacity),
                    ipProtectionLevel: (['low', 'medium', 'high'] as const).includes(String(meta.ip_protection_level || '').toLowerCase() as any)
                        ? (String(meta.ip_protection_level || '').toLowerCase() as any)
                        : p.ipProtectionLevel,
                    trademarkRegistrationNumber: (meta.trademark_registration_number || p.trademarkRegistrationNumber),
                    specifications: specs.length ? specs : p.specifications,
                    variations: variations.length ? variations : p.variations,
                    pricingTiers: pricingTiers.length ? pricingTiers : p.pricingTiers,
                }));
                setSample(s => ({
                    ...s,
                    type: (active.pickup_type as any) || s.type,
                    address: active.pickup_address || s.address,
                    contactName: active.pickup_contact_name || s.contactName,
                    phone: active.pickup_phone || s.phone,
                }));

                const stage = (active.stage || '').toString().toLowerCase();
                if (stage === 'samples') {
                    setCompleted(new Set(['request', 'compliance']));
                    setStep('samples');
                } else if (stage === 'compliance') {
                    setCompleted(new Set(['request']));
                    setStep('compliance');
                } else if (stage === 'inspection') {
                    setCompleted(new Set(['request', 'compliance', 'samples']));
                    setStep('inspection');
                } else if (stage === 'live') {
                    setCompleted(new Set(['request', 'compliance', 'samples', 'inspection']));
                    setStep('live');
                } else if (stage === 'inbound') {
                    setCompleted(new Set(['request', 'compliance', 'samples', 'inspection']));
                    setStep('inspection');
                } else if (stage === 'done') {
                    setCompleted(new Set(['request', 'compliance', 'samples', 'inspection', 'live']));
                    setStep('done');
                }
            } catch { }
        })();
    }, [apiBase, readAuth]);

    // Help panel
    const [helpOpen, setHelpOpen] = useState(false);

    // Computed helpers
    const currencySymbol = useMemo(() => {
        const c = (product.currency || 'USD').toUpperCase();
        if (c === 'EUR') return '€';
        if (c === 'GBP') return '£';
        if (c === 'CNY') return '¥';
        return '$';
    }, [product.currency]);
    const canSubmitRequest = !!product.photo
        && product.name.trim().length > 0
        && product.price.trim().length > 0
        && product.companyName.trim().length > 0
        && product.sku.trim().length > 0
        && product.hsCode.trim().length > 0
        && product.originCountry.trim().length > 0
        && product.leadTimeDays.trim().length > 0
        && product.weightGrams.trim().length > 0
        && product.shipTimeMinDays.trim().length > 0
        && product.shipTimeMaxDays.trim().length > 0;
    const canSaveSampleAddress = sample.address.trim().length > 6 && sample.contactName.trim().length > 1;

    // ── Handlers ────────────────────────────────────────────────────────────

    const buildDetailConfig = useCallback((p: ProductDraft) => {
        const groups = (p.specifications || [])
            .map(g => ({
                title: (g.title || '').trim(),
                collapsed: Boolean(g.collapsed),
                items: (g.items || [])
                    .map(it => ({ label: (it.label || '').trim(), value: (it.value || '').trim() }))
                    .filter(it => it.label && it.value),
            }))
            .filter(g => g.title && g.items.length > 0);
        const cfg: Record<string, unknown> = {};
        if (groups.length) cfg.specifications = groups;
        return cfg;
    }, []);

    const buildVariationsPayload = useCallback((p: ProductDraft) => {
        const vars = (p.variations || [])
            .map(v => {
                const attrs: Record<string, string> = {};
                for (const pair of v.attributes || []) {
                    const k = (pair.key || '').trim();
                    const val = (pair.value || '').trim();
                    if (!k || !val) continue;
                    attrs[k] = val;
                }
                const sku = (v.sku || '').trim();
                return { attributes: attrs, sku };
            })
            .filter(v => Object.keys(v.attributes || {}).length > 0 || v.sku.trim());
        return vars;
    }, []);

    const buildPricingTiersPayload = useCallback((p: ProductDraft) => {
        const tiers = (p.pricingTiers || [])
            .map(t => ({
                variation: t.variationIndex == null ? null : t.variationIndex,
                min_quantity: Number((t.minQuantity || '1').trim() || '1'),
                max_quantity: (t.maxQuantity || '').trim() ? Number((t.maxQuantity || '').trim()) : null,
                unit_price: (t.unitPrice || '').trim(),
                currency: (t.currency || p.currency || 'USD').toUpperCase(),
            }))
            .filter(t => String(t.unit_price || '').trim());
        return tiers;
    }, []);

    const completeStep = useCallback((id: StepId, next: FullStep, msg: string, desc?: string) => {
        setCompleted(prev => new Set([...prev, id]));
        toast.success(msg, { description: desc });
        setTimeout(() => setStep(next), 380);
    }, []);

    const handlePickPhoto = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const addExtraPhotos = useCallback((files: File[]) => {
        const incoming = (files || []).filter(Boolean).slice(0, 20);
        if (!incoming.length) return;
        setProduct(p => {
            const existing = Array.isArray(p.extraPhotos) ? p.extraPhotos : [];
            const keyOf = (f: File) => `${f.name}::${f.size}::${f.lastModified}`;
            const seen = new Set(existing.map(keyOf));
            const merged: File[] = [...existing];
            for (const f of incoming) {
                const k = keyOf(f);
                if (seen.has(k)) continue;
                seen.add(k);
                merged.push(f);
            }
            return { ...p, extraPhotos: merged.slice(0, 7) };
        });
        toast.success('More photos added', { description: 'Up to 8 total product images' });
    }, []);

    const handlePickExtraPhotos = useCallback(() => {
        extraPhotosRef.current?.click();
    }, []);

    const handlePhotoChange = useCallback((files: File[]) => {
        const picked = (files || []).filter(Boolean);
        if (!picked.length) return;
        const main = picked[0];
        const url = URL.createObjectURL(main);
        setProduct(p => ({ ...p, photo: url, photoFile: main, uploading: false, extraPhotos: (picked.slice(1, 8) || []).slice(0, 7) }));
        toast.success('Photos added!', { description: 'You can add up to 8 product images' });
    }, []);

    useEffect(() => {
        const urls = (product.extraPhotos || []).slice(0, 7).map(f => URL.createObjectURL(f));
        setExtraPhotoUrls(urls);
        return () => {
            for (const u of urls) {
                try { URL.revokeObjectURL(u); } catch { }
            }
        };
    }, [product.extraPhotos]);

    const handleSubmitRequest = useCallback(async (el: HTMLElement | null) => {
        let hasErr = false;
        if (!product.photo || !product.photoFile) {
            toast('Add a product photo first', { description: 'Our review team needs to see what you make' });
            return;
        }
        if (!product.name.trim()) { setNameError(true); hasErr = true; }
        if (!product.price.trim()) { setPriceError(true); hasErr = true; }
        if (!product.companyName.trim()) { setCompanyError(true); hasErr = true; }
        if (hasErr) {
            toast('Almost there', { description: 'Fill in the required fields to submit your request' });
            return;
        }
        const missing: string[] = [];
        if (!product.sku.trim()) missing.push('SKU');
        if (!product.hsCode.trim()) missing.push('HS code');
        if (!product.originCountry.trim()) missing.push('Origin country');
        if (!product.leadTimeDays.trim()) missing.push('Lead time');
        if (!product.weightGrams.trim()) missing.push('Weight (grams)');
        if (!product.shipTimeMinDays.trim() || !product.shipTimeMaxDays.trim()) missing.push('Ship time range');
        if (missing.length) {
            setDetailsOpen(true);
            toast('Missing required product details', { description: missing.join(', ') });
            return;
        }
        wBounce(el);
        const { access } = readAuth();
        if (!access) {
            toast.error('Please sign in again.');
            return;
        }
        if (submittingRequest) return;
        try {
            setSubmittingRequest(true);
            const fd = new FormData();
            fd.set('product_name', product.name.trim());
            fd.set('company_name', product.companyName.trim());
            if (product.currency.trim()) fd.set('currency', product.currency.trim());
            fd.set('unit_price', product.price.trim());
            fd.set('moq', String(product.qty || 1));
            if (product.categoryId) fd.set('category_id', String(product.categoryId));
            if (product.category.trim()) fd.set('category', product.category.trim());
            if (product.sku.trim()) fd.set('sku', product.sku.trim());
            if (product.hsCode.trim()) fd.set('hs_code', product.hsCode.trim());
            if (product.originCountry.trim()) fd.set('origin_country', product.originCountry.trim());
            if (product.originRegion.trim()) fd.set('origin_region', product.originRegion.trim());
            if (product.originCity.trim()) fd.set('origin_city', product.originCity.trim());
            if (product.leadTimeDays.trim()) fd.set('lead_time_days', product.leadTimeDays.trim());
            if (product.weightGrams.trim()) fd.set('weight_grams', product.weightGrams.trim());
            if (product.shipTimeMinDays.trim()) fd.set('ship_time_min_days', product.shipTimeMinDays.trim());
            if (product.shipTimeMaxDays.trim()) fd.set('ship_time_max_days', product.shipTimeMaxDays.trim());
            fd.set('sample_available', product.sampleAvailable ? 'true' : 'false');
            if (product.sampleShipDays.trim()) fd.set('sample_ship_days', product.sampleShipDays.trim());
            if (product.description.trim()) fd.set('description', product.description.trim());
            if (product.monthlyCapacity.trim()) fd.set('monthly_capacity', product.monthlyCapacity.trim());
            if (product.ipProtectionLevel) fd.set('ip_protection_level', product.ipProtectionLevel);
            if (product.trademarkRegistrationNumber.trim()) fd.set('trademark_registration_number', product.trademarkRegistrationNumber.trim());
            const detailCfg = buildDetailConfig(product);
            if (Object.keys(detailCfg).length) fd.set('detail_config', JSON.stringify(detailCfg));
            const varsPayload = buildVariationsPayload(product);
            if (varsPayload.length) fd.set('variations', JSON.stringify(varsPayload));
            const tiersPayload = buildPricingTiersPayload(product);
            if (tiersPayload.length) fd.set('pricing_tiers', JSON.stringify(tiersPayload));
            fd.set('photo', product.photoFile);
            for (const f of (product.extraPhotos || []).slice(0, 7)) fd.append('photos', f);
            for (const f of (product.documents || []).slice(0, 10)) fd.append('documents', f);
            const res = await fetch(`${apiBase()}/api/v1/seller/listing-requests/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${access}` },
                body: fd,
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                const msg = (data && (data.detail || data.error)) || `Request failed (${res.status})`;
                toast.error(typeof msg === 'string' ? msg : `Request failed (${res.status})`);
                return;
            }
            setListingId(data?.id ?? null);
            if (Array.isArray(data?.photos) && data.photos[0]?.file_url) {
                setProduct(p => ({ ...p, photo: data.photos[0].file_url, photoFile: null }));
            }
            completeStep(
                'request', 'samples',
                'Listing request submitted \u2713',
                'Our team will review your details within 24\u00A0hours'
            );
        } finally {
            setSubmittingRequest(false);
        }
    }, [apiBase, buildDetailConfig, buildPricingTiersPayload, buildVariationsPayload, completeStep, product, readAuth, submittingRequest, wBounce]);

    const handleSaveSampleAddress = useCallback(async (el: HTMLElement | null) => {
        if (!canSaveSampleAddress) {
            toast('Add your pickup details', { description: 'We need an address and contact name to schedule sample collection' });
            return;
        }
        if (!listingId) {
            toast('Submit your listing request first', { description: 'We need your request before scheduling sample pickup' });
            return;
        }
        wBounce(el);
        const { access } = readAuth();
        if (!access) {
            toast.error('Please sign in again.');
            return;
        }
        if (savingSample) return;
        try {
            setSavingSample(true);
            const res = await fetch(`${apiBase()}/api/v1/seller/listing-requests/${listingId}/sample/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: sample.type,
                    address: sample.address,
                    contact_name: sample.contactName,
                    phone: sample.phone,
                }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                const msg = (data && (data.detail || data.error)) || `Request failed (${res.status})`;
                toast.error(typeof msg === 'string' ? msg : `Request failed (${res.status})`);
                return;
            }
            completeStep(
                'samples', 'inspection',
                'Sample address saved \u2713',
                'We\u2019ll contact you to arrange pickup timing'
            );
        } finally {
            setSavingSample(false);
        }
    }, [apiBase, canSaveSampleAddress, completeStep, listingId, readAuth, sample, savingSample, wBounce]);

    const handleAdvanceVerify = useCallback(async (el: HTMLElement | null) => {
        wBounce(el);
        if (verifyPhase < VERIFICATION_PHASES.length - 1) {
            setVerifyPhase(t => t + 1);
        } else {
            const allPrior = completed.has('request') && completed.has('samples');
            completeStep(
                'inspection',
                allPrior ? 'live' : 'request',
                'You know what to expect \u2713',
                allPrior ? 'Our team is reviewing your samples and details' : 'Let\u2019s start with your request'
            );
        }
    }, [advancing, apiBase, assignedRating, completeStep, completed, listingId, readAuth, verifyPhase, wBounce]);

    const [refreshingStatus, setRefreshingStatus] = useState(false);
    const refreshStatus = useCallback(async () => {
        if (!listingId) return;
        const { access } = readAuth();
        if (!access) return;
        if (refreshingStatus) return;
        try {
            setRefreshingStatus(true);
            const res = await fetch(`${apiBase()}/api/v1/seller/listing-requests/${listingId}/`, {
                headers: { Authorization: `Bearer ${access}` },
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data) return;
            const stage = (data.stage || '').toString().toLowerCase();
            setServerStage(stage);
            if (stage === 'samples') {
                setCompleted(new Set(['request']));
                setStep('samples');
            } else if (stage === 'compliance') {
                setCompleted(new Set(['request']));
                setStep('compliance');
            } else if (stage === 'inspection') {
                setCompleted(new Set(['request', 'compliance', 'samples']));
                setStep('inspection');
            } else if (stage === 'inbound') {
                setCompleted(new Set(['request', 'compliance', 'samples', 'inspection']));
                setStep('inspection');
            } else if (stage === 'live') {
                setCompleted(new Set(['request', 'compliance', 'samples', 'inspection']));
                setStep('live');
            } else if (stage === 'done') {
                setCompleted(new Set(['request', 'samples', 'inspection', 'live']));
                if (typeof data.rating === 'number' || data.rating) {
                    const r = typeof data.rating === 'number' ? data.rating : Number(data.rating || assignedRating);
                    if (Number.isFinite(r)) setAssignedRating(r);
                }
                setStep('done');
            }
        } finally {
            setRefreshingStatus(false);
        }
    }, [apiBase, assignedRating, listingId, readAuth, refreshingStatus]);

    useEffect(() => {
        if (step !== 'done') return;
        if (didAutoCompleteRef.current) return;
        didAutoCompleteRef.current = true;
        toast.success('Listing is live', { description: 'Redirecting to your dashboard…' });
        const t = window.setTimeout(() => onComplete(), 900);
        return () => window.clearTimeout(t);
    }, [onComplete, step]);

    // Clear field errors when user types
    useEffect(() => { if (product.name.trim()) setNameError(false); }, [product.name]);
    useEffect(() => { if (product.price.trim()) setPriceError(false); }, [product.price]);
    useEffect(() => { if (product.companyName.trim()) setCompanyError(false); }, [product.companyName]);

    // ── Journey Arc ──────────────────────────────────────────────────────────

    const journeyArc = (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="pt-10 md:pt-12 pb-8"
        >
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => {
                        if (showWelcome) setStep('welcome');
                        else onComplete();
                    }}
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1A1A1A]/25 hover:text-[#1A1A1A]/50 transition-colors bg-transparent border-none cursor-pointer px-0"
                >
                    <span>← Back</span>
                </button>
                <span className="text-[12px] font-semibold text-[#1A1A1A]/20">
                    {completed.size} of 4 steps done
                </span>
            </div>

            {/* Journey nodes + connecting lines */}
            <div className="flex items-center">
                {MILESTONES.map((m, i) => {
                    const isCompleted = completed.has(m.id);
                    const isActive = step === m.id;
                    const Icon = m.Icon;
                    return (
                        <React.Fragment key={m.id}>
                            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                <motion.div
                                    animate={{
                                        scale: isActive ? 1.18 : isCompleted ? 1.0 : 0.88,
                                    }}
                                    transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{
                                        background: isCompleted
                                            ? 'linear-gradient(135deg, #5EC072, #3ab057)'
                                            : isActive
                                            ? 'linear-gradient(135deg, #0171E3, #0150C0)'
                                            : 'rgba(255,255,255,0.65)',
                                        border: isActive
                                            ? 'none'
                                            : isCompleted
                                            ? 'none'
                                            : '1px solid rgba(0,0,0,0.08)',
                                        boxShadow: isActive
                                            ? '0 0 0 5px rgba(1,113,227,0.1), 0 4px 12px rgba(1,113,227,0.25)'
                                            : isCompleted
                                            ? '0 3px 10px rgba(94,192,114,0.28)'
                                            : 'none',
                                    }}
                                >
                                    {isCompleted
                                        ? <Check size={15} color="white" strokeWidth={2.8} />
                                        : <Icon size={15} color={isActive ? 'white' : 'rgba(26,26,26,0.22)'} strokeWidth={2} />
                                    }
                                </motion.div>
                                <span className={`text-[10px] font-bold tracking-wide transition-colors ${isActive ? 'text-[#0171E3]' : isCompleted ? 'text-[#5EC072]' : 'text-[#1A1A1A]/18'}`}>
                                    {m.label}
                                </span>
                            </div>

                            {/* Connecting line */}
                            {i < MILESTONES.length - 1 && (
                                <div className="flex-1 relative mx-2 mb-4">
                                    <div className="h-[1.5px] rounded-full bg-black/[0.05]" />
                                    <motion.div
                                        className="absolute inset-y-0 left-0 rounded-full"
                                        style={{ background: 'linear-gradient(90deg, #5EC072, #3ab057)' }}
                                        animate={{ width: isCompleted ? '100%' : '0%' }}
                                        transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </motion.div>
    );

    // ── WELCOME VIEW ─────────────────────────────────────────────────────────

    const welcomeView = (
        <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="min-h-[82vh] flex flex-col justify-center py-12"
        >
            {/* Greeting */}
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.7, ease: EASE }}
            >
                <p className="text-[13px] font-semibold text-[#1A1A1A]/28 tracking-wide mb-3">
                    Welcome to your store
                </p>
                <h1 className="text-[38px] md:text-[50px] font-black text-[#1A1A1A]/88 tracking-tighter leading-[1.04]">
                    Good to have you,<br />{sellerName}.&nbsp;✶
                </h1>
                <p className="mt-4 text-[16px] md:text-[17px] font-medium text-[#1A1A1A]/42 leading-relaxed max-w-[440px]">
                    Every seller on this platform is quality-verified. Submit your listing request and we handle the rest — from sample collection to factory inspection.
                </p>
            </motion.div>

            {/* Value props */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.6, ease: EASE }}
                className="mt-10 space-y-3.5"
            >
                {[
                    { Icon: FileText, text: 'Submit your listing request \u2014 we review every seller personally', color: '#0171E3' },
                    { Icon: Factory,  text: 'We visit your factory and test samples before publishing you', color: '#e67e22' },
                    { Icon: Star,     text: 'A verified quality rating badge builds buyer trust from day one', color: '#5EC072' },
                ].map(({ Icon, text, color }, i) => (
                    <motion.div
                        key={text}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.28 + i * 0.08, duration: 0.5, ease: EASE }}
                        className="flex items-center gap-3.5"
                    >
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: `${color}14` }}
                        >
                            <Icon size={15} color={color} strokeWidth={2.5} />
                        </div>
                        <p className="text-[14px] font-medium text-[#1A1A1A]/55">{text}</p>
                    </motion.div>
                ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.48, duration: 0.6, ease: EASE }}
                className="mt-10 flex flex-col items-start gap-3"
            >
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStep('request')}
                    className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-[15px] font-bold text-white border-none cursor-pointer w-full sm:w-auto justify-center"
                    style={{
                        background: 'linear-gradient(135deg, #0171E3 0%, #0150C0 100%)',
                        boxShadow: '0 6px 28px rgba(1,113,227,0.32), 0 1px 4px rgba(1,113,227,0.18)',
                    }}
                >
                    Submit your listing request
                    <ArrowRight size={16} strokeWidth={2.5} />
                </motion.button>
                <button
                    onClick={() => { setVerifyPhase(0); setStep('inspection'); }}
                    className="text-[13px] font-semibold text-[#1A1A1A]/28 hover:text-[#0171E3] transition-colors cursor-pointer bg-transparent border-none py-1 px-1"
                >
                    See how verification works first →
                </button>
            </motion.div>

            {/* Trust note */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.72, duration: 0.6, ease: EASE }}
                className="mt-12 flex items-center gap-2"
            >
                <Shield size={12} color="rgba(26,26,26,0.18)" strokeWidth={2.5} />
                <p className="text-[12px] font-medium text-[#1A1A1A]/22">
                    Your details stay private. Both buyers and sellers are protected by our verification process.
                </p>
            </motion.div>
        </motion.div>
    );

    // ── STEP 1: LISTING REQUEST ───────────────────────────────────────────────

    const requestStep = (
        <motion.div
            key="request"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.42, ease: EASE }}
        >
            <div className="mb-6">
                <p className="text-[12px] font-bold text-[#0171E3]/55 tracking-widest mb-1.5">STEP 1 OF 4 · ~3 MINUTES</p>
                <h2 className="text-[30px] md:text-[34px] font-black text-[#1A1A1A]/88 tracking-tight leading-tight">
                    Tell us what<br />you make
                </h2>
                <p className="text-[14px] font-medium text-[#1A1A1A]/40 mt-2 leading-relaxed">
                    This is a listing <span className="font-bold text-[#1A1A1A]/60">request</span> — not an auto-publish. Our team reviews every submission before anything goes live.
                </p>
            </div>

            {/* Review process banner */}
            <div
                className="flex items-start gap-3 p-4 rounded-[16px] mb-5"
                style={{ background: 'rgba(1,113,227,0.045)', border: '0.5px solid rgba(1,113,227,0.14)' }}
            >
                <ClipboardCheck size={14} color="#0171E3" strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
                <p className="text-[12px] font-medium text-[#1A1A1A]/55 leading-relaxed">
                    <span className="font-bold text-[#0171E3]">How it works:</span>{' '}
                    Submit your details → we collect samples → inspect your factory → run quality tests → publish you with a verified rating badge.
                </p>
            </div>

            <div
                className="rounded-[28px] overflow-hidden"
                style={{
                    background: 'rgba(255,255,255,0.80)',
                    backdropFilter: 'blur(28px)',
                    border: '0.5px solid rgba(255,255,255,0.65)',
                    boxShadow: GLASS_ELEVATED,
                }}
            >
                <div className="p-6 md:p-8 space-y-6">

                    {/* ── Photo ── */}
                    <div>
                        <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">PRODUCT PHOTO</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            multiple
                            onChange={(e) => handlePhotoChange(Array.from(e.target.files || []).slice(0, 8))}
                        />
                        <input
                            ref={extraPhotosRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            multiple
                            onChange={(e) => addExtraPhotos(Array.from(e.target.files || []).slice(0, 8))}
                        />
                        {product.photo ? (
                            <div className="relative group">
                                <div
                                    className="w-full h-[196px] rounded-[18px] overflow-hidden"
                                    style={{ border: '0.5px solid rgba(0,0,0,0.05)' }}
                                >
                                    <ImageWithFallback
                                        src={product.photo}
                                        alt="Product"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button
                                    onClick={handlePickPhoto}
                                    className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ color: 'white' }}
                                >
                                    <Camera size={12} strokeWidth={2.5} />
                                    <span className="text-[11px] font-semibold">Change</span>
                                </button>
                                <button
                                    onClick={handlePickExtraPhotos}
                                    className="absolute top-3 right-[92px] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ color: 'white' }}
                                >
                                    <Plus size={12} strokeWidth={2.5} />
                                    <span className="text-[11px] font-semibold">Add more</span>
                                </button>
                                <div
                                    className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                                    style={{ background: 'rgba(94,192,114,0.9)', backdropFilter: 'blur(8px)' }}
                                >
                                    <Check size={10} color="white" strokeWidth={3} />
                                    <span className="text-[10px] font-bold text-white">Added</span>
                                </div>
                                {!!(product.extraPhotos || []).length && (
                                    <div className="mt-3 grid grid-cols-4 gap-2">
                                        {extraPhotoUrls.slice(0, 7).map((u, idx) => (
                                            <div
                                                key={u}
                                                className="relative h-[52px] rounded-[12px] overflow-hidden"
                                                style={{ border: '0.5px solid rgba(0,0,0,0.06)' }}
                                            >
                                                <img src={u} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setProduct(p => ({
                                                            ...p,
                                                            extraPhotos: (p.extraPhotos || []).filter((_, i) => i !== idx),
                                                        }))
                                                    }
                                                    className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center border-none cursor-pointer"
                                                    style={{ background: 'rgba(0,0,0,0.45)', color: 'white' }}
                                                >
                                                    <X size={12} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.008 }}
                                whileTap={{ scale: 0.995 }}
                                onClick={handlePickPhoto}
                                disabled={product.uploading}
                                className="w-full rounded-[18px] py-10 flex flex-col items-center gap-3.5 cursor-pointer border-none transition-all duration-300"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(1,113,227,0.04), rgba(1,113,227,0.015))',
                                    border: '1.5px dashed rgba(1,113,227,0.22)',
                                }}
                            >
                                {product.uploading ? (
                                    <div className="w-9 h-9 rounded-full border-2 border-[#0171E3]/18 border-t-[#0171E3] animate-spin" />
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-[16px] flex items-center justify-center"
                                            style={{ background: 'rgba(1,113,227,0.08)' }}>
                                            <Camera size={22} color="#0171E3" strokeWidth={1.8} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[14px] font-semibold text-[#1A1A1A]/55">Drop photos or tap to add</p>
                                            <p className="text-[12px] font-medium text-[#1A1A1A]/28 mt-0.5">JPG, PNG or HEIC · Up to 8 photos</p>
                                        </div>
                                    </>
                                )}
                            </motion.button>
                        )}
                    </div>

                    {/* ── Product Name ── */}
                    <div>
                        <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">PRODUCT NAME <span className="text-[#e67e22]/60">*</span></p>
                        <input
                            type="text"
                            placeholder="e.g. Handmade Leather Wallet"
                            value={product.name}
                            onChange={e => setProduct(p => ({ ...p, name: e.target.value }))}
                            className="w-full rounded-[14px] px-5 py-3.5 text-[15px] font-medium text-[#1A1A1A]/80 placeholder-[#1A1A1A]/18 outline-none transition-all duration-200"
                            style={{
                                background: nameError ? 'rgba(230,126,34,0.05)' : 'rgba(0,0,0,0.028)',
                                border: nameError ? '0.5px solid rgba(230,126,34,0.35)' : '0.5px solid rgba(0,0,0,0.07)',
                            }}
                        />
                        {nameError && (
                            <p className="text-[11px] font-medium text-[#e67e22]/70 mt-1.5 pl-1">Give your product a name so our team knows what to review</p>
                        )}
                    </div>

                    {/* ── Company Name ── */}
                    <div>
                        <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">COMPANY / BUSINESS NAME <span className="text-[#e67e22]/60">*</span></p>
                        <input
                            type="text"
                            placeholder="e.g. Noah Craft Industries"
                            value={product.companyName}
                            onChange={e => setProduct(p => ({ ...p, companyName: e.target.value }))}
                            className="w-full rounded-[14px] px-5 py-3.5 text-[15px] font-medium text-[#1A1A1A]/80 placeholder-[#1A1A1A]/18 outline-none transition-all duration-200"
                            style={{
                                background: companyError ? 'rgba(230,126,34,0.05)' : 'rgba(0,0,0,0.028)',
                                border: companyError ? '0.5px solid rgba(230,126,34,0.35)' : '0.5px solid rgba(0,0,0,0.07)',
                            }}
                        />
                        {companyError && (
                            <p className="text-[11px] font-medium text-[#e67e22]/70 mt-1.5 pl-1">We need a business name to begin the review</p>
                        )}
                    </div>

                    {/* ── Price + Qty ── */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">UNIT PRICE <span className="text-[#e67e22]/60">*</span></p>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-[#1A1A1A]/28">{currencySymbol}</span>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={product.price}
                                    onChange={e => setProduct(p => ({ ...p, price: e.target.value }))}
                                    className="w-full rounded-[14px] pl-9 pr-5 py-3.5 text-[15px] font-medium text-[#1A1A1A]/80 placeholder-[#1A1A1A]/18 outline-none transition-all duration-200"
                                    style={{
                                        background: priceError ? 'rgba(230,126,34,0.05)' : 'rgba(0,0,0,0.028)',
                                        border: priceError ? '0.5px solid rgba(230,126,34,0.35)' : '0.5px solid rgba(0,0,0,0.07)',
                                    }}
                                />
                            </div>
                            {priceError && (
                                <p className="text-[11px] font-medium text-[#e67e22]/70 mt-1.5 pl-1">Set a price so buyers can order</p>
                            )}
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">MIN. ORDER</p>
                            <div
                                className="flex items-center rounded-[14px] overflow-hidden"
                                style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                            >
                                <button
                                    onClick={() => setProduct(p => ({ ...p, qty: Math.max(1, p.qty - 10) }))}
                                    className="w-10 py-3.5 flex items-center justify-center text-[#1A1A1A]/28 hover:text-[#1A1A1A]/55 transition-colors border-none bg-transparent cursor-pointer"
                                >
                                    <span className="text-[16px] leading-none">−</span>
                                </button>
                                <span className="w-12 text-center text-[14px] font-bold tabular-nums text-[#1A1A1A]/78">
                                    {product.qty}
                                </span>
                                <button
                                    onClick={() => setProduct(p => ({ ...p, qty: p.qty + 10 }))}
                                    className="w-10 py-3.5 flex items-center justify-center text-[#1A1A1A]/28 hover:text-[#0171E3] transition-colors border-none bg-transparent cursor-pointer"
                                >
                                    <Plus size={14} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Optional details ── */}
                    <div>
                        <button
                            onClick={() => setDetailsOpen(o => !o)}
                            className="flex items-center gap-2 text-[13px] font-semibold text-[#0171E3]/55 hover:text-[#0171E3] transition-colors bg-transparent border-none cursor-pointer px-0 py-1"
                        >
                            <motion.span
                                animate={{ rotate: detailsOpen ? 90 : 0 }}
                                transition={{ duration: 0.22 }}
                                className="inline-block"
                            >
                                <ChevronRight size={14} strokeWidth={2.5} />
                            </motion.span>
                            Add more details
                            <span className="text-[11px] font-medium text-[#1A1A1A]/22">optional</span>
                        </button>
                        <AnimatePresence>
                            {detailsOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: EASE }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-5 space-y-5">
                                        {/* Currency */}
                                        <div>
                                            <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">CURRENCY</p>
                                            <div className="flex flex-wrap gap-2">
                                                {['USD', 'EUR', 'GBP', 'CNY'].map(cur => (
                                                    <button
                                                        key={cur}
                                                        onClick={() =>
                                                            setProduct(p => ({
                                                                ...p,
                                                                currency: cur,
                                                                pricingTiers: (p.pricingTiers || []).map(t => ({ ...t, currency: cur })),
                                                            }))
                                                        }
                                                        className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 cursor-pointer border"
                                                        style={{
                                                            background: product.currency === cur ? 'rgba(1,113,227,0.08)' : 'transparent',
                                                            borderColor: product.currency === cur ? 'rgba(1,113,227,0.25)' : 'rgba(0,0,0,0.07)',
                                                            color: product.currency === cur ? '#0171E3' : 'rgba(26,26,26,0.42)',
                                                        }}
                                                    >
                                                        {cur}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Category */}
                                        <div>
                                            <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">CATEGORY</p>
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    placeholder="Search categories..."
                                                    value={categoryQuery}
                                                    onChange={(e) => { setCategoryQuery(e.target.value); setShowAllCategories(false); }}
                                                    className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                                    style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                />
                                                <div className="flex flex-wrap gap-2">
                                                {categoryOptions.length ? (() => {
                                                    const q = categoryQuery.trim().toLowerCase();
                                                    const filtered = q ? categoryOptions.filter((c) => c.name.toLowerCase().includes(q)) : categoryOptions;
                                                    const visible = showAllCategories ? filtered : filtered.slice(0, 24);
                                                    return (
                                                        <>
                                                            {visible.map(cat => (
                                                        <button
                                                            key={cat.id}
                                                            onClick={() =>
                                                                setProduct(p => {
                                                                    const same = p.categoryId === cat.id;
                                                                    return { ...p, category: same ? '' : cat.name, categoryId: same ? null : cat.id };
                                                                })
                                                            }
                                                            className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 cursor-pointer border"
                                                            style={{
                                                                background: product.categoryId === cat.id ? 'rgba(1,113,227,0.08)' : 'transparent',
                                                                borderColor: product.categoryId === cat.id ? 'rgba(1,113,227,0.25)' : 'rgba(0,0,0,0.07)',
                                                                color: product.categoryId === cat.id ? '#0171E3' : 'rgba(26,26,26,0.42)',
                                                            }}
                                                        >
                                                            {cat.name}
                                                        </button>
                                                            ))}
                                                            {!showAllCategories && filtered.length > 24 ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowAllCategories(true)}
                                                                    className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 cursor-pointer border"
                                                                    style={{
                                                                        background: 'rgba(0,0,0,0.02)',
                                                                        borderColor: 'rgba(0,0,0,0.07)',
                                                                        color: 'rgba(26,26,26,0.42)',
                                                                    }}
                                                                >
                                                                    Show {filtered.length - 24} more
                                                                </button>
                                                            ) : null}
                                                        </>
                                                    );
                                                })() : categoryLoading ? (
                                                    <span className="text-[12px] font-semibold text-[#1A1A1A]/30">Loading categories…</span>
                                                ) : (
                                                    <div className="w-full space-y-2">
                                                        <span className="text-[12px] font-semibold text-[#1A1A1A]/30">No categories found.</span>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter category"
                                                            value={product.category}
                                                            onChange={e => setProduct(p => ({ ...p, category: e.target.value, categoryId: null }))}
                                                            className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                                            style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                        />
                                                    </div>
                                                )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">SKU</p>
                                                <input
                                                    type="text"
                                                    placeholder="Optional"
                                                    value={product.sku}
                                                    onChange={e => setProduct(p => ({ ...p, sku: e.target.value }))}
                                                    className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                                    style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">HS CODE</p>
                                                <input
                                                    type="text"
                                                    placeholder="Optional"
                                                    value={product.hsCode}
                                                    onChange={e => setProduct(p => ({ ...p, hsCode: e.target.value }))}
                                                    className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                                    style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">ORIGIN COUNTRY</p>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. USA"
                                                    value={product.originCountry}
                                                    onChange={e => setProduct(p => ({ ...p, originCountry: e.target.value }))}
                                                    className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                                    style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">ORIGIN REGION</p>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. CA"
                                                    value={product.originRegion}
                                                    onChange={e => setProduct(p => ({ ...p, originRegion: e.target.value }))}
                                                    className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                                    style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">ORIGIN CITY</p>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Los Angeles"
                                                    value={product.originCity}
                                                    onChange={e => setProduct(p => ({ ...p, originCity: e.target.value }))}
                                                    className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                                    style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">LEAD TIME (DAYS)</p>
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 7"
                                                    value={product.leadTimeDays}
                                                    onChange={e => setProduct(p => ({ ...p, leadTimeDays: e.target.value }))}
                                                    className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                                    style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">WEIGHT (GRAMS)</p>
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 500"
                                                    value={product.weightGrams}
                                                    onChange={e => setProduct(p => ({ ...p, weightGrams: e.target.value }))}
                                                    className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                                    style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">SHIP TIME MIN (DAYS)</p>
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 2"
                                                    value={product.shipTimeMinDays}
                                                    onChange={e => setProduct(p => ({ ...p, shipTimeMinDays: e.target.value }))}
                                                    className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                                    style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">SHIP TIME MAX (DAYS)</p>
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 5"
                                                    value={product.shipTimeMaxDays}
                                                    onChange={e => setProduct(p => ({ ...p, shipTimeMaxDays: e.target.value }))}
                                                    className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                                    style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">SAMPLE AVAILABLE</p>
                                                <p className="text-[12px] font-medium text-[#1A1A1A]/35 mt-1">Show sample option on product page</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setProduct(p => ({ ...p, sampleAvailable: !p.sampleAvailable }))}
                                                className="px-3 py-2 rounded-full text-[12px] font-bold border"
                                                style={{
                                                    background: product.sampleAvailable ? 'rgba(94,192,114,0.12)' : 'rgba(0,0,0,0.03)',
                                                    borderColor: product.sampleAvailable ? 'rgba(94,192,114,0.28)' : 'rgba(0,0,0,0.07)',
                                                    color: product.sampleAvailable ? 'rgba(46,170,87,0.95)' : 'rgba(26,26,26,0.42)',
                                                }}
                                            >
                                                {product.sampleAvailable ? 'Yes' : 'No'}
                                            </button>
                                        </div>

                                        {product.sampleAvailable && (
                                            <div>
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">SAMPLE SHIP DAYS</p>
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 3"
                                                    value={product.sampleShipDays}
                                                    onChange={e => setProduct(p => ({ ...p, sampleShipDays: e.target.value }))}
                                                    className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                                    style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">EXTRA PHOTOS</p>
                                                <button
                                                    type="button"
                                                    onClick={handlePickExtraPhotos}
                                                    className="w-full rounded-[14px] px-5 py-3.5 text-left text-[13px] font-semibold cursor-pointer border"
                                                    style={{ background: 'rgba(0,0,0,0.028)', borderColor: 'rgba(0,0,0,0.07)', color: 'rgba(26,26,26,0.55)' }}
                                                >
                                                    {(product.extraPhotos || []).length ? `${product.extraPhotos.length} selected` : 'Choose images (up to 7)'}
                                                </button>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">DOCUMENTS</p>
                                                <input
                                                    ref={documentsRef}
                                                    type="file"
                                                    multiple
                                                    onChange={(e) => {
                                                        const files = Array.from(e.target.files || []);
                                                        setProduct(p => ({ ...p, documents: files }));
                                                    }}
                                                    className="hidden"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => documentsRef.current?.click()}
                                                    className="w-full rounded-[14px] px-5 py-3.5 text-left text-[13px] font-semibold cursor-pointer border"
                                                    style={{ background: 'rgba(0,0,0,0.028)', borderColor: 'rgba(0,0,0,0.07)', color: 'rgba(26,26,26,0.55)' }}
                                                >
                                                    {(product.documents || []).length ? `${product.documents.length} selected` : 'Choose documents'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Monthly capacity */}
                                        <div>
                                            <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">MONTHLY PRODUCTION CAPACITY</p>
                                            <input
                                                type="text"
                                                placeholder="e.g. 500 units / month"
                                                value={product.monthlyCapacity}
                                                onChange={e => setProduct(p => ({ ...p, monthlyCapacity: e.target.value }))}
                                                className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                                style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                            />
                                        </div>
                                        {/* Description */}
                                        <div>
                                            <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">DESCRIPTION</p>
                                            <textarea
                                                placeholder="Describe your product — materials, dimensions, what makes it special…"
                                                value={product.description}
                                                onChange={e => setProduct(p => ({ ...p, description: e.target.value }))}
                                                rows={3}
                                                className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none resize-none"
                                                style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">IP PROTECTION LEVEL</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {([
                                                        { id: 'low' as const, label: 'Low' },
                                                        { id: 'medium' as const, label: 'Medium' },
                                                        { id: 'high' as const, label: 'High' },
                                                    ]).map(opt => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => setProduct(p => ({ ...p, ipProtectionLevel: opt.id }))}
                                                            className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 cursor-pointer border"
                                                            style={{
                                                                background: product.ipProtectionLevel === opt.id ? 'rgba(94,192,114,0.12)' : 'transparent',
                                                                borderColor: product.ipProtectionLevel === opt.id ? 'rgba(94,192,114,0.26)' : 'rgba(0,0,0,0.07)',
                                                                color: product.ipProtectionLevel === opt.id ? 'rgba(46,170,87,0.95)' : 'rgba(26,26,26,0.42)',
                                                            }}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">TRADEMARK REG. NUMBER</p>
                                                <input
                                                    type="text"
                                                    placeholder="Optional"
                                                    value={product.trademarkRegistrationNumber}
                                                    onChange={e => setProduct(p => ({ ...p, trademarkRegistrationNumber: e.target.value }))}
                                                    className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                                    style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">VARIANTS</p>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setProduct(p => ({
                                                            ...p,
                                                            variations: [...(p.variations || []), { sku: '', attributes: [{ key: '', value: '' }] }],
                                                        }))
                                                    }
                                                    className="px-3 py-1.5 rounded-full text-[12px] font-bold cursor-pointer border"
                                                    style={{ background: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.07)', color: 'rgba(26,26,26,0.55)' }}
                                                >
                                                    Add variant
                                                </button>
                                            </div>

                                            {(product.variations || []).length === 0 ? (
                                                <p className="text-[12px] font-medium text-[#1A1A1A]/30">No variants yet. Add one if you sell different sizes/colors.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {(product.variations || []).map((v, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="rounded-[18px] p-4"
                                                            style={{ background: 'rgba(0,0,0,0.022)', border: '0.5px solid rgba(0,0,0,0.06)' }}
                                                        >
                                                            <div className="flex items-center justify-between gap-3 mb-3">
                                                                <p className="text-[12px] font-bold text-[#1A1A1A]/60">Variant #{idx + 1}</p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setProduct(p => ({
                                                                            ...p,
                                                                            variations: (p.variations || []).filter((_, i) => i !== idx),
                                                                            pricingTiers: (p.pricingTiers || []).map(t => ({
                                                                                ...t,
                                                                                variationIndex:
                                                                                    t.variationIndex == null
                                                                                        ? null
                                                                                        : t.variationIndex === idx
                                                                                          ? null
                                                                                          : t.variationIndex > idx
                                                                                            ? t.variationIndex - 1
                                                                                            : t.variationIndex,
                                                                            })),
                                                                        }))
                                                                    }
                                                                    className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer"
                                                                    style={{ background: 'rgba(0,0,0,0.04)', color: 'rgba(26,26,26,0.55)' }}
                                                                >
                                                                    <X size={14} strokeWidth={2.5} />
                                                                </button>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-[#1A1A1A]/30 tracking-widest mb-2">SKU</p>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Optional"
                                                                        value={v.sku}
                                                                        onChange={e =>
                                                                            setProduct(p => ({
                                                                                ...p,
                                                                                variations: (p.variations || []).map((vv, i) => (i === idx ? { ...vv, sku: e.target.value } : vv)),
                                                                            }))
                                                                        }
                                                                        className="w-full rounded-[14px] px-5 py-3 text-[13px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                                                        style={{ background: 'rgba(255,255,255,0.65)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                                    />
                                                                </div>
                                                                <div className="flex items-end justify-end">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setProduct(p => ({
                                                                                ...p,
                                                                                variations: (p.variations || []).map((vv, i) =>
                                                                                    i === idx ? { ...vv, attributes: [...(vv.attributes || []), { key: '', value: '' }] } : vv
                                                                                ),
                                                                            }))
                                                                        }
                                                                        className="px-3 py-2 rounded-full text-[12px] font-bold cursor-pointer border"
                                                                        style={{ background: 'rgba(255,255,255,0.55)', borderColor: 'rgba(0,0,0,0.07)', color: 'rgba(26,26,26,0.55)' }}
                                                                    >
                                                                        Add attribute
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 space-y-2">
                                                                {(v.attributes || []).map((pair, j) => (
                                                                    <div key={j} className="flex gap-2 items-center">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Attribute (e.g. Color)"
                                                                            value={pair.key}
                                                                            onChange={e =>
                                                                                setProduct(p => ({
                                                                                    ...p,
                                                                                    variations: (p.variations || []).map((vv, i) =>
                                                                                        i === idx
                                                                                            ? {
                                                                                                  ...vv,
                                                                                                  attributes: (vv.attributes || []).map((pp, k) => (k === j ? { ...pp, key: e.target.value } : pp)),
                                                                                              }
                                                                                            : vv
                                                                                    ),
                                                                                }))
                                                                            }
                                                                            className="flex-1 rounded-[14px] px-5 py-2.5 text-[13px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                                                            style={{ background: 'rgba(255,255,255,0.65)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Value (e.g. Red)"
                                                                            value={pair.value}
                                                                            onChange={e =>
                                                                                setProduct(p => ({
                                                                                    ...p,
                                                                                    variations: (p.variations || []).map((vv, i) =>
                                                                                        i === idx
                                                                                            ? {
                                                                                                  ...vv,
                                                                                                  attributes: (vv.attributes || []).map((pp, k) => (k === j ? { ...pp, value: e.target.value } : pp)),
                                                                                              }
                                                                                            : vv
                                                                                    ),
                                                                                }))
                                                                            }
                                                                            className="flex-1 rounded-[14px] px-5 py-2.5 text-[13px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                                                            style={{ background: 'rgba(255,255,255,0.65)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setProduct(p => ({
                                                                                    ...p,
                                                                                    variations: (p.variations || []).map((vv, i) =>
                                                                                        i === idx ? { ...vv, attributes: (vv.attributes || []).filter((_, k) => k !== j) } : vv
                                                                                    ),
                                                                                }))
                                                                            }
                                                                            className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer"
                                                                            style={{ background: 'rgba(0,0,0,0.04)', color: 'rgba(26,26,26,0.55)' }}
                                                                        >
                                                                            <X size={14} strokeWidth={2.5} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">BULK PRICING TIERS</p>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setProduct(p => ({
                                                            ...p,
                                                            pricingTiers: [
                                                                ...(p.pricingTiers || []),
                                                                { variationIndex: null, minQuantity: '1', maxQuantity: '', unitPrice: '', currency: p.currency || 'USD' },
                                                            ],
                                                        }))
                                                    }
                                                    className="px-3 py-1.5 rounded-full text-[12px] font-bold cursor-pointer border"
                                                    style={{ background: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.07)', color: 'rgba(26,26,26,0.55)' }}
                                                >
                                                    Add tier
                                                </button>
                                            </div>

                                            {(product.pricingTiers || []).length === 0 ? (
                                                <p className="text-[12px] font-medium text-[#1A1A1A]/30">Optional. Add tiers like 100+ units, 500+ units, etc.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {(product.pricingTiers || []).map((t, idx) => {
                                                        const labelFor = (v: any) => {
                                                            const pairs = (v?.attributes || []).filter((p: any) => (p.key || '').trim() && (p.value || '').trim());
                                                            if (pairs.length) return pairs.map((p: any) => `${p.key}: ${p.value}`).join(', ');
                                                            return (v?.sku || '').trim() ? `SKU: ${(v.sku || '').trim()}` : 'Variant';
                                                        };
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="rounded-[18px] p-4"
                                                                style={{ background: 'rgba(0,0,0,0.022)', border: '0.5px solid rgba(0,0,0,0.06)' }}
                                                            >
                                                                <div className="flex items-center justify-between gap-3 mb-3">
                                                                    <p className="text-[12px] font-bold text-[#1A1A1A]/60">Tier #{idx + 1}</p>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setProduct(p => ({ ...p, pricingTiers: (p.pricingTiers || []).filter((_, i) => i !== idx) }))}
                                                                        className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer"
                                                                        style={{ background: 'rgba(0,0,0,0.04)', color: 'rgba(26,26,26,0.55)' }}
                                                                    >
                                                                        <X size={14} strokeWidth={2.5} />
                                                                    </button>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                                    <div>
                                                                        <p className="text-[10px] font-bold text-[#1A1A1A]/30 tracking-widest mb-2">APPLIES TO</p>
                                                                        <select
                                                                            value={t.variationIndex == null ? '' : String(t.variationIndex)}
                                                                            onChange={e =>
                                                                                setProduct(p => ({
                                                                                    ...p,
                                                                                    pricingTiers: (p.pricingTiers || []).map((tt, i) =>
                                                                                        i === idx ? { ...tt, variationIndex: e.target.value === '' ? null : Number(e.target.value) } : tt
                                                                                    ),
                                                                                }))
                                                                            }
                                                                            className="w-full rounded-[14px] px-4 py-3 text-[13px] font-medium text-[#1A1A1A]/78 outline-none"
                                                                            style={{ background: 'rgba(255,255,255,0.65)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                                        >
                                                                            <option value="">All variants</option>
                                                                            {(product.variations || []).map((v, i) => (
                                                                                <option key={i} value={String(i)}>
                                                                                    Variant #{i + 1} — {labelFor(v)}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-bold text-[#1A1A1A]/30 tracking-widest mb-2">MIN QTY</p>
                                                                        <input
                                                                            type="number"
                                                                            value={t.minQuantity}
                                                                            onChange={e =>
                                                                                setProduct(p => ({
                                                                                    ...p,
                                                                                    pricingTiers: (p.pricingTiers || []).map((tt, i) => (i === idx ? { ...tt, minQuantity: e.target.value } : tt)),
                                                                                }))
                                                                            }
                                                                            className="w-full rounded-[14px] px-5 py-3 text-[13px] font-medium text-[#1A1A1A]/78 outline-none"
                                                                            style={{ background: 'rgba(255,255,255,0.65)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-bold text-[#1A1A1A]/30 tracking-widest mb-2">MAX QTY</p>
                                                                        <input
                                                                            type="number"
                                                                            placeholder="Optional"
                                                                            value={t.maxQuantity}
                                                                            onChange={e =>
                                                                                setProduct(p => ({
                                                                                    ...p,
                                                                                    pricingTiers: (p.pricingTiers || []).map((tt, i) => (i === idx ? { ...tt, maxQuantity: e.target.value } : tt)),
                                                                                }))
                                                                            }
                                                                            className="w-full rounded-[14px] px-5 py-3 text-[13px] font-medium text-[#1A1A1A]/78 outline-none"
                                                                            style={{ background: 'rgba(255,255,255,0.65)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-bold text-[#1A1A1A]/30 tracking-widest mb-2">UNIT PRICE ({product.currency})</p>
                                                                        <input
                                                                            type="number"
                                                                            placeholder="0.00"
                                                                            value={t.unitPrice}
                                                                            onChange={e =>
                                                                                setProduct(p => ({
                                                                                    ...p,
                                                                                    pricingTiers: (p.pricingTiers || []).map((tt, i) =>
                                                                                        i === idx ? { ...tt, unitPrice: e.target.value, currency: p.currency || 'USD' } : tt
                                                                                    ),
                                                                                }))
                                                                            }
                                                                            className="w-full rounded-[14px] px-5 py-3 text-[13px] font-medium text-[#1A1A1A]/78 outline-none"
                                                                            style={{ background: 'rgba(255,255,255,0.65)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">SPECIFICATIONS</p>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setProduct(p => ({
                                                            ...p,
                                                            specifications: [...(p.specifications || []), { title: '', collapsed: false, items: [{ label: '', value: '' }] }],
                                                        }))
                                                    }
                                                    className="px-3 py-1.5 rounded-full text-[12px] font-bold cursor-pointer border"
                                                    style={{ background: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.07)', color: 'rgba(26,26,26,0.55)' }}
                                                >
                                                    Add group
                                                </button>
                                            </div>

                                            {(product.specifications || []).length === 0 ? (
                                                <p className="text-[12px] font-medium text-[#1A1A1A]/30">Add materials, dimensions, packaging, certifications, etc.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {(product.specifications || []).map((g, gi) => (
                                                        <div
                                                            key={gi}
                                                            className="rounded-[18px] p-4"
                                                            style={{ background: 'rgba(0,0,0,0.022)', border: '0.5px solid rgba(0,0,0,0.06)' }}
                                                        >
                                                            <div className="flex items-center justify-between gap-3 mb-3">
                                                                <p className="text-[12px] font-bold text-[#1A1A1A]/60">Group #{gi + 1}</p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setProduct(p => ({ ...p, specifications: (p.specifications || []).filter((_, i) => i !== gi) }))}
                                                                    className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer"
                                                                    style={{ background: 'rgba(0,0,0,0.04)', color: 'rgba(26,26,26,0.55)' }}
                                                                >
                                                                    <X size={14} strokeWidth={2.5} />
                                                                </button>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                <div className="md:col-span-2">
                                                                    <p className="text-[10px] font-bold text-[#1A1A1A]/30 tracking-widest mb-2">TITLE</p>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="e.g. Materials"
                                                                        value={g.title}
                                                                        onChange={e =>
                                                                            setProduct(p => ({
                                                                                ...p,
                                                                                specifications: (p.specifications || []).map((gg, i) => (i === gi ? { ...gg, title: e.target.value } : gg)),
                                                                            }))
                                                                        }
                                                                        className="w-full rounded-[14px] px-5 py-3 text-[13px] font-medium text-[#1A1A1A]/78 outline-none"
                                                                        style={{ background: 'rgba(255,255,255,0.65)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                                    />
                                                                </div>
                                                                <div className="flex items-end justify-end">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setProduct(p => ({
                                                                                ...p,
                                                                                specifications: (p.specifications || []).map((gg, i) =>
                                                                                    i === gi ? { ...gg, items: [...(gg.items || []), { label: '', value: '' }] } : gg
                                                                                ),
                                                                            }))
                                                                        }
                                                                        className="px-3 py-2 rounded-full text-[12px] font-bold cursor-pointer border"
                                                                        style={{ background: 'rgba(255,255,255,0.55)', borderColor: 'rgba(0,0,0,0.07)', color: 'rgba(26,26,26,0.55)' }}
                                                                    >
                                                                        Add item
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 space-y-2">
                                                                {(g.items || []).map((it, ii) => (
                                                                    <div key={ii} className="flex gap-2 items-center">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Label (e.g. Material)"
                                                                            value={it.label}
                                                                            onChange={e =>
                                                                                setProduct(p => ({
                                                                                    ...p,
                                                                                    specifications: (p.specifications || []).map((gg, i) =>
                                                                                        i === gi
                                                                                            ? {
                                                                                                  ...gg,
                                                                                                  items: (gg.items || []).map((x, k) => (k === ii ? { ...x, label: e.target.value } : x)),
                                                                                              }
                                                                                            : gg
                                                                                    ),
                                                                                }))
                                                                            }
                                                                            className="flex-1 rounded-[14px] px-5 py-2.5 text-[13px] font-medium text-[#1A1A1A]/78 outline-none"
                                                                            style={{ background: 'rgba(255,255,255,0.65)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Value (e.g. Stainless steel)"
                                                                            value={it.value}
                                                                            onChange={e =>
                                                                                setProduct(p => ({
                                                                                    ...p,
                                                                                    specifications: (p.specifications || []).map((gg, i) =>
                                                                                        i === gi
                                                                                            ? {
                                                                                                  ...gg,
                                                                                                  items: (gg.items || []).map((x, k) => (k === ii ? { ...x, value: e.target.value } : x)),
                                                                                              }
                                                                                            : gg
                                                                                    ),
                                                                                }))
                                                                            }
                                                                            className="flex-1 rounded-[14px] px-5 py-2.5 text-[13px] font-medium text-[#1A1A1A]/78 outline-none"
                                                                            style={{ background: 'rgba(255,255,255,0.65)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setProduct(p => ({
                                                                                    ...p,
                                                                                    specifications: (p.specifications || []).map((gg, i) =>
                                                                                        i === gi ? { ...gg, items: (gg.items || []).filter((_, k) => k !== ii) } : gg
                                                                                    ),
                                                                                }))
                                                                            }
                                                                            className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer"
                                                                            style={{ background: 'rgba(0,0,0,0.04)', color: 'rgba(26,26,26,0.55)' }}
                                                                        >
                                                                            <X size={14} strokeWidth={2.5} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="h-px bg-black/[0.04]" />

                    {/* ── Buyer preview ── */}
                    <AnimatePresence>
                        {showPreview && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.3, ease: EASE }}
                            >
                                <p className="text-[11px] font-bold text-[#1A1A1A]/30 tracking-widest mb-3">HOW BUYERS WILL SEE IT (AFTER APPROVAL)</p>
                                <div
                                    className="flex gap-4 items-center p-4 rounded-[18px]"
                                    style={{ background: 'rgba(1,113,227,0.03)', border: '0.5px solid rgba(1,113,227,0.1)' }}
                                >
                                    <div
                                        className="w-[60px] h-[60px] rounded-[14px] overflow-hidden flex-shrink-0 bg-[#f5f5f5]"
                                        style={{ border: '0.5px solid rgba(0,0,0,0.05)' }}
                                    >
                                        {product.photo
                                            ? <ImageWithFallback src={product.photo} alt="" className="w-full h-full object-cover" />
                                            : <div className="w-full h-full flex items-center justify-center"><Package size={20} color="rgba(26,26,26,0.18)" /></div>
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-bold text-[#1A1A1A]/80 truncate">
                                            {product.name || 'Your product name'}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <RatingStars rating={4.8} size={9} />
                                            <span className="text-[10px] font-bold text-[#e67e22] ml-1">4.8</span>
                                                <span className="text-[10px] font-medium text-[#1A1A1A]/28 ml-1">• Verified Seller</span>
                                        </div>
                                        <p className="text-[13px] font-bold text-[#0171E3] mt-1">
                                            {product.price ? `$${parseFloat(product.price || '0').toFixed(2)} per unit` : 'Price not set yet'}
                                        </p>
                                    </div>
                                    <div
                                        className="flex-shrink-0 px-3.5 py-2 rounded-full text-[12px] font-bold text-white"
                                        style={{ background: '#0171E3' }}
                                    >
                                        Order
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowPreview(p => !p)}
                            className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1A1A1A]/28 hover:text-[#0171E3] transition-colors bg-transparent border-none cursor-pointer px-0"
                        >
                            {showPreview ? <EyeOff size={13} strokeWidth={2} /> : <Eye size={13} strokeWidth={2} />}
                            {showPreview ? 'Hide preview' : 'Preview approved listing'}
                        </button>
                    </div>

                    {/* ── Submit Request CTA ── */}
                    <motion.button
                        whileHover={{ scale: canSubmitRequest ? 1.012 : 1.0 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={e => handleSubmitRequest(e.currentTarget)}
                        className="w-full py-4 rounded-full text-[15px] font-bold border-none cursor-pointer flex items-center justify-center gap-2 transition-all duration-350"
                        style={{
                            background: canSubmitRequest
                                ? 'linear-gradient(135deg, #0171E3 0%, #0150C0 100%)'
                                : 'rgba(0,0,0,0.05)',
                            color: canSubmitRequest ? 'white' : 'rgba(26,26,26,0.22)',
                            boxShadow: canSubmitRequest ? '0 5px 24px rgba(1,113,227,0.32), 0 1px 4px rgba(1,113,227,0.15)' : 'none',
                        }}
                    >
                        Submit listing request
                        <ArrowRight size={16} strokeWidth={2.5} />
                    </motion.button>

                    <p className="text-center text-[12px] font-medium text-[#1A1A1A]/22">
                        Not published yet — our team reviews this before anything goes live
                    </p>
                </div>
            </div>

            {/* Reassurance row */}
            <div className="flex items-center justify-center gap-6 mt-5 flex-wrap">
                {[
                    { Icon: Shield, text: 'Private by default' },
                    { Icon: ClipboardCheck, text: 'Reviewed by our team' },
                    { Icon: CheckCircle2, text: 'Edit anytime' },
                ].map(({ Icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5">
                        <Icon size={12} color="rgba(26,26,26,0.2)" strokeWidth={2.5} />
                        <span className="text-[11px] font-medium text-[#1A1A1A]/25">{text}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );

    // ── STEP 2: COMPLIANCE REVIEW ─────────────────────────────────────────────

    const complianceStep = (
        <motion.div
            key="compliance"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.42, ease: EASE }}
        >
            <div className="mb-6">
                <p className="text-[12px] font-bold text-[#D97706]/55 tracking-widest mb-1.5">STEP 2 OF 5 · IN REVIEW</p>
                <h2 className="text-[30px] md:text-[34px] font-black text-[#1A1A1A]/88 tracking-tight leading-tight">
                    Compliance &<br />Review
                </h2>
                <p className="text-[14px] font-medium text-[#1A1A1A]/40 mt-2 leading-relaxed">
                    Our team is currently verifying your product details and certifications. This typically takes 24-48 hours.
                </p>
            </div>

            <div
                className="rounded-[28px] overflow-hidden"
                style={{
                    background: 'rgba(255,255,255,0.80)',
                    backdropFilter: 'blur(28px)',
                    border: '0.5px solid rgba(255,255,255,0.65)',
                    boxShadow: GLASS_ELEVATED,
                }}
            >
                <div className="p-12 flex flex-col items-center justify-center text-center">
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                        style={{ background: 'rgba(217,119,6,0.1)' }}
                    >
                        <ShieldCheck size={40} color="#D97706" />
                    </div>
                    <h3 className="text-[20px] font-black text-[#1A1A1A]/88 mb-2">Awaiting Verification</h3>
                    <p className="text-[14px] font-medium text-[#1A1A1A]/42 max-w-[320px] leading-relaxed">
                        We&apos;re checking your HS Code, Origin Location, and required documents. You&apos;ll be notified once this stage is complete.
                    </p>

                    <div className="mt-8 pt-8 border-t border-black/[0.04] w-full">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Clock size={14} color="rgba(26,26,26,0.35)" />
                            <span className="text-[12px] font-bold text-[#1A1A1A]/35 uppercase tracking-widest">Typical Timeline</span>
                        </div>
                        <div className="flex justify-between max-w-[280px] mx-auto text-[11px] font-bold text-[#1A1A1A]/25 uppercase tracking-tighter">
                            <span>Reviewing</span>
                            <ArrowRight size={10} />
                            <span>Vetted</span>
                            <ArrowRight size={10} />
                            <span>Approved</span>
                        </div>
                    </div>

                    <button
                        onClick={() => refreshStatus()}
                        className="mt-10 px-8 py-3.5 rounded-full text-[14px] font-bold cursor-pointer transition-all border-none text-white"
                        style={{
                            background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                            boxShadow: '0 6px 20px rgba(217,119,6,0.25)',
                        }}
                    >
                        {refreshingStatus ? 'Checking...' : 'Check Status'}
                    </button>
                </div>
            </div>
        </motion.div>
    );

    // ── STEP 3: SAMPLE COLLECTION ─────────────────────────────────────────────

    const samplesStep = (
        <motion.div
            key="samples"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.42, ease: EASE }}
        >
            <div className="mb-6">
                <p className="text-[12px] font-bold text-[#0171E3]/55 tracking-widest mb-1.5">STEP 2 OF 4</p>
                <h2 className="text-[30px] md:text-[34px] font-black text-[#1A1A1A]/88 tracking-tight leading-tight">
                    Where should we<br />collect your samples?
                </h2>
                <p className="text-[14px] font-medium text-[#1A1A1A]/40 mt-2 leading-relaxed">
                    Our team comes to you to pick up product samples for quality testing. No shipping needed.
                </p>
            </div>

            {/* What happens next callout */}
            <div
                className="flex items-start gap-3 p-4 rounded-[16px] mb-5"
                style={{ background: 'rgba(230,126,34,0.045)', border: '0.5px solid rgba(230,126,34,0.14)' }}
            >
                <Package size={14} color="#e67e22" strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
                <p className="text-[12px] font-medium text-[#1A1A1A]/55 leading-relaxed">
                    <span className="font-bold text-[#e67e22]">What we collect:</span>{' '}
                    3–5 sample units per product. We test them in our lab and use results to compute your quality rating. Samples are returned or compensated after testing.
                </p>
            </div>

            <div
                className="rounded-[28px] overflow-hidden"
                style={{
                    background: 'rgba(255,255,255,0.80)',
                    backdropFilter: 'blur(28px)',
                    border: '0.5px solid rgba(255,255,255,0.65)',
                    boxShadow: GLASS_ELEVATED,
                }}
            >
                <div className="p-6 md:p-8 space-y-6">

                    {/* Location type */}
                    <div>
                        <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">PICKUP LOCATION</p>
                        <div className="flex gap-2.5">
                            {([
                                { type: 'factory' as const, Icon: Factory, label: 'Factory' },
                                { type: 'warehouse' as const, Icon: Building2, label: 'Warehouse' },
                                { type: 'office' as const, Icon: MapPin, label: 'Office' },
                            ]).map(({ type, Icon, label }) => (
                                <button
                                    key={type}
                                    onClick={() => setSample(p => ({ ...p, type }))}
                                    className="flex-1 flex flex-col items-center gap-2.5 py-5 rounded-[18px] cursor-pointer transition-all duration-250 border"
                                    style={{
                                        background: sample.type === type ? 'rgba(1,113,227,0.06)' : 'rgba(0,0,0,0.02)',
                                        borderColor: sample.type === type ? 'rgba(1,113,227,0.22)' : 'rgba(0,0,0,0.06)',
                                    }}
                                >
                                    <Icon
                                        size={20}
                                        color={sample.type === type ? '#0171E3' : 'rgba(26,26,26,0.28)'}
                                        strokeWidth={1.8}
                                    />
                                    <span className={`text-[12px] font-bold ${sample.type === type ? 'text-[#0171E3]' : 'text-[#1A1A1A]/38'}`}>
                                        {label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">FULL ADDRESS <span className="text-[#e67e22]/60">*</span></p>
                        <textarea
                            placeholder={'123 Industrial Zone, Unit 4\nYour City, State 12345'}
                            value={sample.address}
                            onChange={e => setSample(p => ({ ...p, address: e.target.value }))}
                            rows={3}
                            className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none resize-none"
                            style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                        />
                    </div>

                    {/* Contact name */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">CONTACT PERSON <span className="text-[#e67e22]/60">*</span></p>
                            <input
                                type="text"
                                placeholder="e.g. Noah Ahmed"
                                value={sample.contactName}
                                onChange={e => setSample(p => ({ ...p, contactName: e.target.value }))}
                                className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                            />
                        </div>
                        <div className="flex-1">
                            <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest mb-3">PHONE <span className="font-medium text-[#1A1A1A]/20 normal-case tracking-normal text-[11px]">· optional</span></p>
                            <input
                                type="tel"
                                placeholder="+1 555 000 0000"
                                value={sample.phone}
                                onChange={e => setSample(p => ({ ...p, phone: e.target.value }))}
                                className="w-full rounded-[14px] px-5 py-3.5 text-[14px] font-medium text-[#1A1A1A]/78 placeholder-[#1A1A1A]/18 outline-none"
                                style={{ background: 'rgba(0,0,0,0.028)', border: '0.5px solid rgba(0,0,0,0.07)' }}
                            />
                        </div>
                    </div>

                    {/* Privacy shield */}
                    <div
                        className="flex items-start gap-3 p-4 rounded-[16px]"
                        style={{ background: 'rgba(94,192,114,0.055)', border: '0.5px solid rgba(94,192,114,0.18)' }}
                    >
                        <Shield size={14} color="#5EC072" strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
                        <p className="text-[12px] font-medium text-[#1A1A1A]/50 leading-relaxed">
                            <span className="font-bold text-[#1A1A1A]/65">Your address stays completely private.</span>{' '}
                            Only our verified inspection team sees it. Buyers only ever see your city.
                        </p>
                    </div>

                    <div className="h-px bg-black/[0.04]" />

                    {/* Save CTA */}
                    <motion.button
                        whileHover={{ scale: canSaveSampleAddress ? 1.012 : 1.0 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={e => handleSaveSampleAddress(e.currentTarget)}
                        className="w-full py-4 rounded-full text-[15px] font-bold border-none cursor-pointer flex items-center justify-center gap-2 transition-all duration-350"
                        style={{
                            background: canSaveSampleAddress
                                ? 'linear-gradient(135deg, #0171E3 0%, #0150C0 100%)'
                                : 'rgba(0,0,0,0.05)',
                            color: canSaveSampleAddress ? 'white' : 'rgba(26,26,26,0.22)',
                            boxShadow: canSaveSampleAddress ? '0 5px 24px rgba(1,113,227,0.32)' : 'none',
                        }}
                    >
                        Confirm sample pickup address
                        <ArrowRight size={16} strokeWidth={2.5} />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );

    // ── STEP 3: INSPECTION WALKTHROUGH ────────────────────────────────────────

    const vPhase = VERIFICATION_PHASES[verifyPhase];
    const inspectionStep = (
        <motion.div
            key="inspection"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.42, ease: EASE }}
        >
            <div className="mb-6">
                <p className="text-[12px] font-bold text-[#0171E3]/55 tracking-widest mb-1.5">
                    {completed.has('samples') ? 'STEP 3 OF 4' : 'HOW VERIFICATION WORKS'}
                </p>
                <h2 className="text-[30px] md:text-[34px] font-black text-[#1A1A1A]/88 tracking-tight leading-tight">
                    The verification<br />journey
                </h2>
                <p className="text-[14px] font-medium text-[#1A1A1A]/40 mt-2 leading-relaxed">
                    Walk through every stage of our seller verification process \u2014 so you know exactly what to expect.
                </p>
            </div>

            {/* Phase progress bar */}
            <div className="flex items-center gap-1.5 mb-6">
                {VERIFICATION_PHASES.map((_, i) => (
                    <div
                        key={i}
                        className="flex-1 h-[3px] rounded-full transition-all duration-500"
                        style={{
                            background: i < verifyPhase ? '#5EC072' : i === verifyPhase ? '#0171E3' : 'rgba(0,0,0,0.06)',
                        }}
                    />
                ))}
            </div>

            <div
                className="rounded-[28px] overflow-hidden"
                style={{
                    background: 'rgba(255,255,255,0.80)',
                    backdropFilter: 'blur(28px)',
                    border: '0.5px solid rgba(255,255,255,0.65)',
                    boxShadow: GLASS_ELEVATED,
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={verifyPhase}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.32, ease: EASE }}
                        className="p-6 md:p-8"
                    >
                        {/* Phase emoji + heading */}
                        <div className="text-center mb-6">
                            <motion.span
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 20, delay: 0.05 }}
                                className="text-[44px] block"
                            >
                                {vPhase.emoji}
                            </motion.span>
                            <h3 className="text-[20px] font-black text-[#1A1A1A]/88 mt-2">{vPhase.title}</h3>
                            <p className="text-[14px] font-medium text-[#1A1A1A]/42 mt-2 leading-relaxed max-w-[360px] mx-auto">
                                {vPhase.sub}
                            </p>
                        </div>

                        {/* Phase visual mock */}
                        <div
                            className="rounded-[18px] p-5 mb-6"
                            style={{ background: 'rgba(0,0,0,0.025)', border: '0.5px solid rgba(0,0,0,0.06)' }}
                        >
                            {/* Phase 0: Listing review */}
                            {verifyPhase === 0 && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-[#1A1A1A]/28 tracking-widest">YOUR SUBMISSION</p>
                                    {[
                                        ['Product', product.name || 'Your product'],
                                        ['Company', product.companyName || 'Your company'],
                                        ['Category', product.category || 'Not specified'],
                                        ['Unit Price', product.price ? `$${parseFloat(product.price).toFixed(2)}` : '\u2014'],
                                        ['Min. Order', `${product.qty} units`],
                                    ].map(([label, val]) => (
                                        <div key={label} className="flex items-center justify-between">
                                            <p className="text-[12px] font-medium text-[#1A1A1A]/42">{label}</p>
                                            <p className="text-[12px] font-semibold text-[#1A1A1A]/72 truncate max-w-[55%] text-right">{val}</p>
                                        </div>
                                    ))}
                                    <div className="h-px bg-black/[0.05] my-0.5" />
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#0171E3] animate-pulse" />
                                        <p className="text-[11px] font-semibold text-[#0171E3]">Under review by seller team</p>
                                    </div>
                                </div>
                            )}

                            {/* Phase 1: Sample collection */}
                            {verifyPhase === 1 && (
                                <div className="space-y-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-[#0171E3]/10 flex items-center justify-center flex-shrink-0">
                                            <Package size={15} color="#0171E3" strokeWidth={2} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-[#1A1A1A]/80">Sample pickup scheduled</p>
                                            <p className="text-[11px] font-medium text-[#1A1A1A]/35">Team member en route to your {sample.type}</p>
                                        </div>
                                    </div>
                                    <div className="pl-12 space-y-1.5">
                                        {[
                                            '3\u20135 units of each product variant',
                                            'Packaging and labelling included',
                                            'Samples tracked with unique IDs',
                                        ].map(item => (
                                            <div key={item} className="flex items-center gap-2">
                                                <Check size={10} color="#5EC072" strokeWidth={3} />
                                                <p className="text-[12px] font-medium text-[#1A1A1A]/55">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Phase 2: Factory inspection */}
                            {verifyPhase === 2 && (
                                <div className="space-y-3.5">
                                    <p className="text-[10px] font-black text-[#1A1A1A]/28 tracking-widest mb-1">INSPECTION CHECKLIST</p>
                                    {[
                                        { label: 'Production capacity verified', done: true },
                                        { label: 'Safety & compliance standards', done: true },
                                        { label: 'Equipment & tooling audit', done: false, active: true },
                                        { label: 'Worker conditions assessment', done: false },
                                        { label: 'Environmental compliance', done: false },
                                    ].map(({ label, done, active }) => (
                                        <div key={label} className="flex items-center gap-3">
                                            <div
                                                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                                style={{
                                                    background: done ? '#5EC072' : active ? '#e67e22' : 'rgba(0,0,0,0.06)',
                                                }}
                                            >
                                                {done && <Check size={10} color="white" strokeWidth={3} />}
                                                {active && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                                            </div>
                                            <p className={`text-[12px] font-semibold ${done || active ? 'text-[#1A1A1A]/72' : 'text-[#1A1A1A]/22'}`}>
                                                {label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Phase 3: Lab testing */}
                            {verifyPhase === 3 && (
                                <div className="space-y-3.5">
                                    <p className="text-[10px] font-black text-[#1A1A1A]/28 tracking-widest mb-1">LAB TEST PROGRESS</p>
                                    {[
                                        { label: 'Material composition', status: 'Pass', done: true },
                                        { label: 'Durability & stress test', status: 'Pass', done: true },
                                        { label: 'Safety & chemical analysis', status: 'Running\u2026', active: true },
                                        { label: 'Spec accuracy verification', status: 'Pending', done: false },
                                    ].map(({ label, status, done, active }) => (
                                        <div key={label} className="flex items-center justify-between">
                                            <p className={`text-[12px] font-semibold ${done || active ? 'text-[#1A1A1A]/70' : 'text-[#1A1A1A]/22'}`}>{label}</p>
                                            <span
                                                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                                                style={{
                                                    background: done ? 'rgba(94,192,114,0.1)' : active ? 'rgba(230,126,34,0.08)' : 'rgba(0,0,0,0.04)',
                                                    color: done ? '#5EC072' : active ? '#e67e22' : 'rgba(26,26,26,0.2)',
                                                }}
                                            >
                                                {status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Phase 4: Rating assigned */}
                            {verifyPhase === 4 && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-[#1A1A1A]/28 tracking-widest">QUALITY SCORE BREAKDOWN</p>
                                    {[
                                        { label: 'Material quality', score: 4.9 },
                                        { label: 'Production standards', score: 4.7 },
                                        { label: 'Spec accuracy', score: 4.8 },
                                        { label: 'Factory conditions', score: 4.8 },
                                    ].map(({ label, score }) => (
                                        <div key={label} className="flex items-center justify-between">
                                            <p className="text-[12px] font-medium text-[#1A1A1A]/55">{label}</p>
                                            <div className="flex items-center gap-1.5">
                                                <RatingStars rating={score} size={9} />
                                                <span className="text-[11px] font-bold text-[#e67e22]">{score}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="h-px bg-black/[0.05] my-1" />
                                    <div className="flex items-center justify-between">
                                        <p className="text-[13px] font-bold text-[#1A1A1A]/72">Overall rating</p>
                                        <div className="flex items-center gap-1.5">
                                            <RatingStars rating={assignedRating} size={12} />
                                            <span className="text-[15px] font-black text-[#e67e22]">{assignedRating}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Phase 5: Go live */}
                            {verifyPhase === 5 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'rgba(94,192,114,0.1)' }}>
                                            <Award size={18} color="#5EC072" strokeWidth={1.8} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-[#1A1A1A]/80">Verified Seller Badge</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <RatingStars rating={assignedRating} size={10} />
                                            <span className="text-[11px] font-bold text-[#e67e22] ml-1">{assignedRating} • Verified</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pl-[52px] space-y-1.5">
                                        {[
                                            'Visible on every product listing',
                                            'Appears in buyer search filters',
                                            'Refreshed with every new order review',
                                        ].map(item => (
                                            <div key={item} className="flex items-center gap-2">
                                                <Check size={10} color="#5EC072" strokeWidth={3} />
                                                <p className="text-[12px] font-medium text-[#1A1A1A]/55">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action button */}
                        <motion.button
                            whileHover={{ scale: 1.012 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={e => handleAdvanceVerify(e.currentTarget)}
                            className="w-full py-4 rounded-full text-[15px] font-bold border-none cursor-pointer flex items-center justify-center gap-2"
                            style={{
                                background: verifyPhase >= 4
                                    ? 'linear-gradient(135deg, #5EC072 0%, #3ab057 100%)'
                                    : 'linear-gradient(135deg, #0171E3 0%, #0150C0 100%)',
                                color: 'white',
                                boxShadow: verifyPhase >= 4
                                    ? '0 5px 24px rgba(94,192,114,0.38)'
                                    : '0 5px 24px rgba(1,113,227,0.32)',
                            }}
                        >
                            {vPhase.action}
                        </motion.button>

                        <p className="text-center text-[11px] font-medium text-[#1A1A1A]/20 mt-3">
                            Stage {verifyPhase + 1} of {VERIFICATION_PHASES.length}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );

    // ── STEP 4: RATED & LIVE ──────────────────────────────────────────────────

    const liveStep = (
        <motion.div
            key="live"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.42, ease: EASE }}
        >
            <div className="mb-6">
                <p className="text-[12px] font-bold text-[#0171E3]/55 tracking-widest mb-1.5">STEP 4 OF 4</p>
                <h2 className="text-[30px] md:text-[34px] font-black text-[#1A1A1A]/88 tracking-tight leading-tight">
                    Testing complete.<br />Your rating is in.
                </h2>
                <p className="text-[14px] font-medium text-[#1A1A1A]/40 mt-2 leading-relaxed">
                    Review your assigned quality rating and confirm to publish your listing to real buyers.
                </p>
            </div>

            <div
                className="rounded-[28px] overflow-hidden"
                style={{
                    background: 'rgba(255,255,255,0.80)',
                    backdropFilter: 'blur(28px)',
                    border: '0.5px solid rgba(255,255,255,0.65)',
                    boxShadow: GLASS_ELEVATED,
                }}
            >
                <div className="p-6 md:p-8 space-y-6">

                    {/* Rating reveal */}
                    <div
                        className="rounded-[20px] p-6 flex flex-col items-center text-center"
                        style={{ background: 'linear-gradient(135deg, rgba(230,126,34,0.05), rgba(230,126,34,0.02))', border: '0.5px solid rgba(230,126,34,0.15)' }}
                    >
                        <p className="text-[11px] font-black text-[#e67e22]/55 tracking-widest mb-3">YOUR VERIFIED QUALITY RATING</p>
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 20, delay: 0.1 }}
                            className="text-[64px] font-black text-[#e67e22] leading-none tabular-nums"
                        >
                            {assignedRating}
                        </motion.div>
                        <div className="flex items-center gap-1 mt-2">
                            <RatingStars rating={assignedRating} size={18} />
                        </div>
                        <p className="text-[12px] font-semibold text-[#1A1A1A]/35 mt-3">
                            Based on factory inspection, lab tests, and spec verification
                        </p>
                    </div>

                    {/* Setup summary */}
                    <div className="space-y-3.5">
                        <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">VERIFICATION COMPLETE</p>
                        {[
                            {
                                Icon: FileText,
                                label: product.name || 'Your product',
                                sub: 'Listing reviewed and approved',
                                done: completed.has('request'),
                            },
                            {
                                Icon: Package,
                                label: 'Samples collected',
                                sub: `From your ${sample.type === 'factory' ? 'factory' : sample.type === 'warehouse' ? 'warehouse' : 'office'}`,
                                done: completed.has('samples'),
                            },
                            {
                                Icon: Factory,
                                label: 'Factory inspection passed',
                                sub: 'All standards met',
                                done: completed.has('inspection'),
                            },
                            {
                                Icon: Award,
                                label: `Quality rating: ${assignedRating}\u2605`,
                                sub: 'Assigned after lab testing',
                                done: true,
                            },
                        ].map(({ Icon, label, sub, done }) => (
                            <div key={label} className="flex items-center gap-3.5">
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ background: done ? 'rgba(94,192,114,0.1)' : 'rgba(0,0,0,0.04)' }}
                                >
                                    {done
                                        ? <Check size={14} color="#5EC072" strokeWidth={2.5} />
                                        : <Icon size={14} color="rgba(26,26,26,0.28)" strokeWidth={2} />
                                    }
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold text-[#1A1A1A]/80">{label}</p>
                                    <p className="text-[11px] font-medium text-[#1A1A1A]/35">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="h-px bg-black/[0.04]" />

                    {/* Launch CTA */}
                    <div className="text-center py-3">
                        <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                            style={{ background: 'rgba(94,192,114,0.08)' }}>
                            <Sparkles size={26} color="#5EC072" strokeWidth={1.6} />
                        </div>
                        <p className="text-[16px] font-bold text-[#1A1A1A]/80 mb-1.5">
                            {(serverStage === 'live' || serverStage === 'done') ? 'Awaiting publish' : 'Awaiting review'}
                        </p>
                        <p className="text-[13px] font-medium text-[#1A1A1A]/38 mb-7 max-w-[280px] mx-auto leading-relaxed">
                            Our team will inspect and publish your listing after review. Tap refresh to check the latest status.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => refreshStatus()}
                            className="w-full py-5 rounded-full text-[16px] font-black border-none cursor-pointer flex items-center justify-center gap-2.5 relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #0171E3 0%, #0159B2 100%)',
                                color: 'white',
                                boxShadow: '0 8px 36px rgba(1,113,227,0.35), 0 2px 8px rgba(1,113,227,0.18)',
                            }}
                        >
                            {celebrating && <CelebrationBurst />}
                            <Rocket size={18} strokeWidth={2.5} />
                            {refreshingStatus ? 'Refreshing…' : 'Refresh status'}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => onComplete()}
                            className="w-full mt-3 py-4 rounded-full text-[14px] font-black cursor-pointer flex items-center justify-center gap-2"
                            style={{
                                background: 'rgba(26,26,26,0.06)',
                                color: 'rgba(26,26,26,0.72)',
                                border: '0.5px solid rgba(0,0,0,0.10)',
                            }}
                        >
                            <ArrowRight size={16} strokeWidth={2.5} />
                            Go to dashboard
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    // ── DONE VIEW ─────────────────────────────────────────────────────────────

    const doneView = (
        <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="min-h-[72vh] flex flex-col items-center justify-center text-center py-16"
        >
            <motion.div
                initial={{ scale: 0.2, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 20, delay: 0.1 }}
                className="rounded-full flex items-center justify-center mb-7 relative"
                style={{
                    width: 84, height: 84,
                    background: 'linear-gradient(135deg, #5EC072, #2eaa57)',
                    boxShadow: '0 10px 50px rgba(94,192,114,0.45)',
                }}
            >
                <Check size={38} color="white" strokeWidth={2.5} />
                <CelebrationBurst />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5, ease: EASE }}
            >
                <h2 className="text-[34px] font-black text-[#1A1A1A]/90 tracking-tight">You&apos;re verified ✓</h2>
                <div className="flex items-center justify-center gap-1.5 mt-3 mb-2">
                    <RatingStars rating={assignedRating} size={16} />
                    <span className="text-[18px] font-black text-[#e67e22]">{assignedRating}</span>
                    <span className="text-[13px] font-semibold text-[#1A1A1A]/35 ml-1">Verified Seller</span>
                </div>
                <p className="text-[15px] font-medium text-[#1A1A1A]/42 mt-2 max-w-[340px] leading-relaxed">
                    List your next product now. Each product becomes a listing request that we review before it goes live.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65, duration: 0.5, ease: EASE }}
                className="mt-10 w-full max-w-[360px]"
            >
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                        setListingId(null);
                        setAssignedRating(4.8);
                        setVerifyPhase(0);
                        setCelebrating(false);
                        setShowPreview(false);
                        setDetailsOpen(false);
                        setProduct({
                            photo: null,
                            photoFile: null,
                            uploading: false,
                            name: '',
                            price: '',
                            qty: 50,
                            category: '',
                            categoryId: null,
                            currency: 'USD',
                            sku: '',
                            hsCode: '',
                            originCountry: '',
                            originRegion: '',
                            originCity: '',
                            leadTimeDays: '',
                            weightGrams: '',
                            shipTimeMinDays: '',
                            shipTimeMaxDays: '',
                            sampleAvailable: false,
                            sampleShipDays: '',
                            extraPhotos: [],
                            documents: [],
                            description: '',
                            companyName: '',
                            monthlyCapacity: '',
                            ipProtectionLevel: 'low',
                            trademarkRegistrationNumber: '',
                            variations: [],
                            pricingTiers: [],
                            specifications: [],
                        });
                        setSample({ type: 'factory', address: '', contactName: '', phone: '' });
                        setCompleted(new Set());
                        setStep('request');
                    }}
                    className="w-full py-4 rounded-full text-[15px] font-black border-none cursor-pointer flex items-center justify-center gap-2.5 relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, #0171E3 0%, #0150C0 100%)',
                        color: 'white',
                        boxShadow: '0 8px 34px rgba(1,113,227,0.32), 0 2px 8px rgba(1,113,227,0.18)',
                    }}
                >
                    <FileText size={18} strokeWidth={2.5} />
                    List a new product
                </motion.button>

                <button
                    onClick={onComplete}
                    className="mt-3 w-full py-3.5 rounded-full text-[13px] font-bold cursor-pointer border"
                    style={{
                        background: 'rgba(255,255,255,0.78)',
                        borderColor: 'rgba(0,0,0,0.08)',
                        color: 'rgba(26,26,26,0.55)',
                    }}
                >
                    Go to dashboard
                </button>
            </motion.div>
        </motion.div>
    );

    // ── HELP PANEL ────────────────────────────────────────────────────────────

    const helpPanel = (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.94 }}
            transition={{ duration: 0.24, ease: EASE }}
            className="fixed bottom-20 right-4 sm:right-6 w-[260px] rounded-[22px] overflow-hidden z-50"
            style={{
                background: 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(28px)',
                boxShadow: GLASS_ELEVATED,
                border: '0.5px solid rgba(255,255,255,0.85)',
            }}
        >
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-black text-[#1A1A1A]/38 tracking-widest">NEED HELP?</p>
                    <button
                        onClick={() => setHelpOpen(false)}
                        className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center border-none cursor-pointer hover:bg-black/8 transition-colors"
                    >
                        <X size={12} color="rgba(26,26,26,0.4)" strokeWidth={2.5} />
                    </button>
                </div>
                <div className="space-y-1.5">
                    {[
                        { Icon: MessageCircle, label: 'Chat with our seller team', sub: 'Typical reply in 2 min', action: 'chat' },
                        { Icon: HelpCircle, label: 'Verification guide', sub: 'Step-by-step walkthrough', action: 'guide' },
                        { Icon: Search, label: 'What inspectors look for', sub: '3-minute overview', action: 'inspect' },
                    ].map(({ Icon, label, sub, action }) => (
                        <button
                            key={action}
                            onClick={() => { toast.info(label); setHelpOpen(false); }}
                            className="w-full flex items-center gap-3 p-3 rounded-[14px] hover:bg-black/[0.03] transition-colors cursor-pointer bg-transparent border-none text-left"
                        >
                            <div className="w-8 h-8 rounded-full bg-[#0171E3]/8 flex items-center justify-center flex-shrink-0">
                                <Icon size={14} color="#0171E3" strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-[13px] font-semibold text-[#1A1A1A]/75">{label}</p>
                                <p className="text-[11px] font-medium text-[#1A1A1A]/35">{sub}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );

    // ── MAIN RENDER ───────────────────────────────────────────────────────────

    return (
        <div style={{ fontFamily: FONT }} className="max-w-[760px] mx-auto pb-28 px-4 sm:px-6">
            <AnimatePresence mode="wait">
                {step === 'welcome' && welcomeView}

                {step === 'done' && doneView}

                {step !== 'welcome' && step !== 'done' && (
                    <motion.div
                        key="journey-shell"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                    >
                        {journeyArc}
                        <AnimatePresence mode="wait">
                            {step === 'request' && requestStep}
                            {step === 'compliance' && complianceStep}
                            {step === 'samples' && samplesStep}
                            {step === 'inspection' && inspectionStep}
                            {step === 'live' && liveStep}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Help overlay */}
            <AnimatePresence>
                {helpOpen && helpPanel}
            </AnimatePresence>

            {/* Floating help button */}
            <AnimatePresence>
                {step !== 'done' && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: 0.8, duration: 0.35, ease: EASE }}
                        onClick={() => setHelpOpen(o => !o)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.92 }}
                        className="fixed bottom-6 right-4 sm:right-6 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer border-none z-40"
                        style={{
                            background: helpOpen ? '#0171E3' : 'rgba(255,255,255,0.92)',
                            backdropFilter: 'blur(16px)',
                            boxShadow: helpOpen
                                ? '0 4px 18px rgba(1,113,227,0.35)'
                                : GLASS,
                            border: helpOpen ? 'none' : '0.5px solid rgba(255,255,255,0.85)',
                        }}
                    >
                        <HelpCircle
                            size={18}
                            color={helpOpen ? 'white' : 'rgba(26,26,26,0.38)'}
                            strokeWidth={2}
                        />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
