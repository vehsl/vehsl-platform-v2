"use client";

import React, { useRef, useCallback } from 'react';
import {
    Package, Send, CircleAlert,
    MessageCircle, RotateCcw, Bell, MessageSquare,
    Coins, FileText, BadgeCheck, Lightbulb, Download, Eye, Upload, ExternalLink,
    Check, ChevronRight, Plus, Camera, Clock, AlertTriangle, X, Paperclip, Mic, ShieldAlert,
    DollarSign, Truck, ClipboardCheck, ChevronDown, Power, Tag, ArrowRight, Shield,
    Star, Copy, Share2, Image, CalendarClock, Receipt, HelpCircle, BookOpen, CheckCircle2,
    CircleDollarSign, CircleX, Sparkles, ZoomIn, MapPin, Home, Factory, Palette, Trash2, CreditCard
} from 'lucide-react';

export const FONT = "'Urbanist', sans-serif";
export const EASE = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

export const GLASS = `
    inset 0 1px 0 0 rgba(255,255,255,0.75),
    inset 0 -0.5px 0 0 rgba(0,0,0,0.01),
    0 0 0 0.5px rgba(0,0,0,0.02),
    0 1px 3px 0 rgba(0,0,0,0.018),
    0 6px 24px -6px rgba(0,0,0,0.04),
    0 28px 64px -20px rgba(0,0,0,0.055)
`;

export const GLASS_ELEVATED = `
    inset 0 1px 0 0 rgba(255,255,255,0.85),
    inset 0 -0.5px 0 0 rgba(0,0,0,0.01),
    0 0 0 0.5px rgba(0,0,0,0.025),
    0 2px 4px 0 rgba(0,0,0,0.02),
    0 8px 32px -8px rgba(0,0,0,0.055),
    0 32px 72px -24px rgba(0,0,0,0.07)
`;

/* -- Momentum bounce -- */
export function useBounce() {
    const m = useRef(0);
    const bounce = useCallback((el: HTMLElement | null) => {
        if (!el) return;
        const v = m.current;
        el.animate([
            { transform: 'scale(1)' },
            { transform: `scale(${1 - 0.014 * (v + 0.3)})` },
            { transform: `scale(${1 + 0.005 * (v + 0.3)})` },
            { transform: 'scale(1)' },
        ], { duration: 350 + v * 80, easing: 'cubic-bezier(0.34,1.56,0.64,1)' });
        m.current = Math.min(1, v + 0.12);
    }, []);
    const ripple = useCallback((container: HTMLElement | null, origin: number) => {
        if (!container) return;
        const kids = Array.from(container.children) as HTMLElement[];
        kids.forEach((kid, i) => {
            if (i === origin) return;
            const d = Math.abs(i - origin);
            const s = Math.max(0.001, 0.005 - d * 0.0012) * (m.current + 0.3);
            setTimeout(() => {
                kid.animate([
                    { transform: 'scale(1)' },
                    { transform: `scale(${1 - s})` },
                    { transform: `scale(${1 + s * 0.35})` },
                    { transform: 'scale(1)' },
                ], { duration: 280 + d * 35, easing: 'cubic-bezier(0.34,1.56,0.64,1)' });
            }, d * 30);
        });
    }, []);
    return { bounce, ripple };
}

export function fmt(n: number) {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* -- Action orders needing seller response -- */
export type ActionType = 'pickup' | 'sample' | 'approval' | 'production';
export interface ActionOrder {
    id: string;
    product: string;
    image: string;
    type: ActionType;
    deadline: string;
    deadlineUrgent: boolean;
    orderNumber: string;
    qty: number;
    unitPrice: number;
    buyer: string;
    destination: string;
    message?: string;
    capacityPct?: number;
    availableBy?: string;
    sampleCollectionDate?: string;
    timelineStep?: number;
    productionStep?: number;
    productionStartDate?: string;
    respondedAt?: number;
    buyerMessages?: { text: string; time: string; isCustomRequest?: boolean; isSampleRequest?: boolean; sampleConfirmedDate?: string }[];
    extraSampleRequested?: boolean;
    extraSampleReadyDate?: string;
    originalDeadline?: string;
    negotiatedUnitPrice?: number;
    priceOfferSent?: boolean;
    priceAccepted?: boolean;
}

export interface ListedProduct {
    id: string;
    name: string;
    image: string;
    price: number;
    status: 'active' | 'review' | 'legal_check' | 'pickup_approved' | 'draft';
    sold: number;
    inWarehouse: number;
    inTransit: number;
    isOnline: boolean;
    rating: number;
}

/* -- Seller-specific activity feed -- */
export type ActivityType = 'sample_report' | 'sample_feedback' | 'inspection_done' | 'pickup_done' | 'listing_rejected' | 'payment' | 'compliance' | 'platform_notice';
export type ActivityActionKind = 'download' | 'reply' | 'view' | 'upload' | 'resubmit' | 'reorder' | 'link' | 'none';
export interface Activity {
    id: string;
    type: ActivityType;
    title: string;
    subtitle: string;
    detail: string;
    time: string;
    amount?: number;
    orderRef?: string;
    productName?: string;
    actionKind: ActivityActionKind;
    actionLabel?: string;
    clientComment?: string;
    rejectionReason?: string;
    inspectorName?: string;
    courierName?: string;
    reportUrl?: string;
    urgent?: boolean;
    inspectionRating?: number;
    passRate?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    daysLeft?: number;
    certType?: string;
    depositEta?: string;
    bankLast4?: string;
    rejectionPhotos?: { url: string; caption: string }[];
    improvementSuggestions?: { text: string; tip?: string; photos?: { url: string; caption: string }[] }[];
}

export const ACTIVITY_ICONS: Record<ActivityType, { icon: React.ReactNode; bg: string }> = {
    sample_report: { icon: <FileText size={15} color="#0171e3" strokeWidth={1.8} />, bg: 'rgba(1,113,227,0.07)' },
    sample_feedback: { icon: <MessageCircle size={15} color="#e67e22" strokeWidth={1.8} />, bg: 'rgba(230,126,34,0.07)' },
    inspection_done: { icon: <BadgeCheck size={15} color="#2eaa57" strokeWidth={1.8} />, bg: 'rgba(46,170,87,0.07)' },
    pickup_done: { icon: <Package size={15} color="#1A1A1A" strokeWidth={1.8} style={{ opacity: 0.45 }} />, bg: 'rgba(26,26,26,0.04)' },
    payment: { icon: <Coins size={15} color="#2eaa57" strokeWidth={1.8} />, bg: 'rgba(46,170,87,0.07)' },
    listing_rejected: { icon: <Lightbulb size={15} color="#c8892a" strokeWidth={1.8} />, bg: 'rgba(200,137,42,0.07)' },
    compliance: { icon: <CircleAlert size={15} color="#e67e22" strokeWidth={1.8} />, bg: 'rgba(230,126,34,0.07)' },
    platform_notice: { icon: <Bell size={15} color="#8e8e93" strokeWidth={1.8} />, bg: 'rgba(142,142,147,0.05)' },
};

export const ACTION_BUTTON_STYLES: Record<ActivityActionKind, { icon: React.ReactNode; bg: string; color: string; border?: string }> = {
    download: { icon: <Download size={11} strokeWidth={2.5} />, bg: '#0071e3', color: '#fff' },
    reply: { icon: <Send size={11} strokeWidth={2.5} />, bg: '#1A1A1A', color: '#fff' },
    view: { icon: <Eye size={11} strokeWidth={2.5} />, bg: '#1A1A1A', color: '#fff' },
    upload: { icon: <Upload size={11} strokeWidth={2.5} />, bg: 'transparent', color: '#e67e22', border: '1px solid rgba(230,126,34,0.3)' },
    resubmit: { icon: <RotateCcw size={11} strokeWidth={2.5} />, bg: '#0171E3', color: '#fff' },
    reorder: { icon: <RotateCcw size={11} strokeWidth={2.5} />, bg: '#1A1A1A', color: '#fff' },
    link: { icon: <ExternalLink size={11} strokeWidth={2.5} />, bg: 'transparent', color: 'rgba(26,26,26,0.5)', border: '1px solid rgba(0,0,0,0.08)' },
    none: { icon: null, bg: 'transparent', color: 'transparent' },
};

/* -- Greeting -- */
export function greet() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}
