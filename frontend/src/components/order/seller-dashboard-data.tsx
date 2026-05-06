"use client";

import React, { useRef, useCallback } from 'react';
import {
    Check, ChevronRight, Plus, Camera, Clock,
    AlertTriangle, Package, Upload, X, Paperclip, Mic, ShieldAlert,
    DollarSign, Eye, Truck, ClipboardCheck, ChevronDown, Send, CircleAlert,
    MessageCircle, Power, Tag, ArrowRight, Shield,
    Download, FileText, RotateCcw, Bell, MessageSquare, ExternalLink,
    Star, Copy, Share2, Image, CalendarClock, Receipt, HelpCircle, BookOpen, CheckCircle2,
    CircleDollarSign, BadgeCheck, CircleX, Coins,
    Lightbulb, Sparkles, ZoomIn, MapPin, Home, Factory, Palette, Trash2, CreditCard,
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

/* -- Product images -- */
export const PRODUCTS = {
    headphones: 'https://images.unsplash.com/photo-1558590987-fec611c944de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGhlYWRwaG9uZXMlMjBpc29sYXRlZCUyMHdoaXRlJTIwYmFja2dyb3VuZCUyMHByb2R1Y3R8ZW58MXx8fHwxNzcyOTA5NTk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    cable: 'https://images.unsplash.com/photo-1769025142953-26ed712efa39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVU0IlMjBjYWJsZSUyMGdyZWVuJTIwaXNvbGF0ZWQlMjB3aGl0ZSUyMGJhY2tncm91bmR8ZW58MXx8fHwxNzcyOTA5NTk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    stand: 'https://images.unsplash.com/photo-1624895608078-e9f564cbe3fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBzdGFuZCUyMHNpbHZlciUyMG1pbmltYWwlMjBwcm9kdWN0JTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzcyOTA5NTk5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    vase: 'https://images.unsplash.com/photo-1769118440996-801e493974be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kbWFkZSUyMHBvdHRlcnklMjB2YXNlJTIwbWluaW1hbCUyMHN0dWRpbyUyMHNob3R8ZW58MXx8fHwxNzcyOTA5NTk5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    bag: 'https://images.unsplash.com/photo-1605549188293-7f7881e08153?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwbWVzc2VuZ2VyJTIwYmFnJTIwcHJvZHVjdCUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NzI5MTAzNTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    keyboard: 'https://images.unsplash.com/photo-1709817552870-f96756fb8c9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWNoYW5pY2FsJTIwa2V5Ym9hcmQlMjBtaW5pbWFsJTIwcHJvZHVjdCUyMHdoaXRlfGVufDF8fHx8MTc3MjkxMDM1N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
};

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

export const ACTION_ORDERS: ActionOrder[] = [
    {
        id: '3',
        product: 'Handmade Ceramic Vase',
        image: PRODUCTS.vase,
        type: 'approval',
        deadline: 'Review required',
        deadlineUrgent: true,
        orderNumber: '#3LMP109X',
        qty: 1500,
        unitPrice: 89,
        buyer: 'Sarah Jenkins',
        destination: 'London, UK',
        message: 'Order exceeds warehouse stock (400 units). Approve to begin production for remaining 1,100?',
        capacityPct: 25,
        availableBy: 'Apr 18',
        buyerMessages: [
            { text: 'Can we do a matte glaze instead of glossy? Happy to pay extra if needed.', time: '2h ago', isCustomRequest: true },
        ],
    },
    {
        id: '1',
        product: 'Wireless NC Headphones',
        image: PRODUCTS.headphones,
        type: 'pickup',
        deadline: 'Tuesday, 10:00 AM',
        deadlineUrgent: false,
        orderNumber: '#4KNW280R',
        qty: 24,
        unitPrice: 269,
        buyer: 'Noah Mateo',
        destination: 'San Francisco, CA',
        buyerMessages: [
            { text: 'Please make sure they are packed individually with bubble wrap', time: '1d ago' },
        ],
    },
    {
        id: '5',
        product: 'Leather Messenger Bag',
        image: PRODUCTS.bag,
        type: 'approval',
        deadline: '2d left',
        deadlineUrgent: false,
        orderNumber: '#7PLQ445M',
        qty: 60,
        unitPrice: 185,
        buyer: 'Emma Duval',
        destination: 'Paris, FR',
        capacityPct: 90,
        availableBy: 'Apr 25',
    },
    {
        id: '6',
        product: 'Mechanical Keyboard — White',
        image: PRODUCTS.keyboard,
        type: 'approval',
        deadline: '4d left',
        deadlineUrgent: false,
        orderNumber: '#2XRF773B',
        qty: 150,
        unitPrice: 78,
        buyer: 'James Park',
        destination: 'Seoul, KR',
        capacityPct: 55,
        availableBy: 'May 2',
        buyerMessages: [
            { text: 'Can you do Cherry MX Brown switches instead of Red?', time: '5h ago' },
        ],
    },
    {
        id: '2',
        product: 'USB C Wire — Green 2m',
        image: PRODUCTS.cable,
        type: 'production',
        deadline: '5h 36m left',
        deadlineUrgent: true,
        orderNumber: '#9JKS992L',
        qty: 86,
        unitPrice: 32,
        buyer: 'Ahmed Khan',
        destination: 'Dubai, UAE',
        productionStep: 0,
        productionStartDate: 'Mar 1',
        sampleCollectionDate: 'Mar 8',
        respondedAt: Date.now() - 100000,
        buyerMessages: [
            { text: 'Need the sample to match Pantone 375C green exactly', time: '4h ago', isCustomRequest: true },
            { text: 'Also can you include 2 extra units as backup?', time: '3h ago' },
            { text: 'We need a new sample \u2014 the connector housing feels loose on 3 of the test units. Can you send a revised batch?', time: '25 min ago', isSampleRequest: true },
        ],
    },
    {
        id: '4',
        product: 'Aluminum Laptop Stand',
        image: PRODUCTS.stand,
        type: 'production',
        deadline: 'Apr 12',
        deadlineUrgent: false,
        orderNumber: '#8WQZ331K',
        qty: 200,
        unitPrice: 45,
        buyer: 'Lisa Chen',
        destination: 'Toronto, CA',
        productionStep: 3,
        productionStartDate: 'Feb 20',
        respondedAt: Date.now() - 50000,
    },
];

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

export const LISTED: ListedProduct[] = [
    { id: 'p1', name: 'Wireless NC Headphones', image: PRODUCTS.headphones, price: 269, status: 'active', sold: 48, inWarehouse: 120, inTransit: 24, isOnline: true, rating: 4.72 },
    { id: 'p2', name: 'USB C Wire — Green 2m', image: PRODUCTS.cable, price: 32, status: 'active', sold: 136, inWarehouse: 500, inTransit: 0, isOnline: true, rating: 4.31 },
    { id: 'p3', name: 'Aluminum Laptop Stand', image: PRODUCTS.stand, price: 45, status: 'active', sold: 24, inWarehouse: 85, inTransit: 12, isOnline: true, rating: 3.88 },
    { id: 'p4', name: 'Handmade Ceramic Vase', image: PRODUCTS.vase, price: 89, status: 'legal_check', sold: 0, inWarehouse: 400, inTransit: 0, isOnline: false, rating: 0.00 },
    { id: 'p5', name: 'Bamboo Desk Organizer', image: PRODUCTS.stand, price: 34, status: 'review', sold: 0, inWarehouse: 200, inTransit: 0, isOnline: false, rating: 0.00 },
    { id: 'p6', name: 'Eco Canvas Tote Bag', image: PRODUCTS.cable, price: 18, status: 'pickup_approved', sold: 0, inWarehouse: 600, inTransit: 0, isOnline: false, rating: 0.00 },
];

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

export const ACTIVITIES: Activity[] = [
    {
        id: 'a1',
        type: 'sample_report',
        title: 'Sample report ready',
        subtitle: '24\u00d7 Wireless NC Headphones',
        detail: 'QC sample inspection completed. 23 of 24 units passed. 1 unit flagged for minor cosmetic defect on left ear cup. Overall batch: Approved with note.',
        time: '35 min ago',
        orderRef: '#4KNW280R',
        productName: 'Wireless NC Headphones',
        actionKind: 'download',
        actionLabel: 'Download PDF',
        reportUrl: '#sample-report-4KNW280R.pdf',
        passRate: '23/24',
    },
    {
        id: 'a2',
        type: 'sample_feedback',
        title: 'Buyer feedback on sample',
        subtitle: 'TechVault Inc \u00b7 #4KNW280R',
        detail: 'Buyer reviewed your sample shipment and left comments. They want a slight color shift before full production approval.',
        time: '1 hour ago',
        orderRef: '#4KNW280R',
        productName: 'Wireless NC Headphones',
        clientComment: '"The matte black is slightly too glossy compared to the reference. Can you do a more muted finish for the production run? Otherwise dimensions and weight are perfect."',
        actionKind: 'reply',
        actionLabel: 'Reply',
        urgent: true,
    },
    {
        id: 'a3',
        type: 'inspection_done',
        title: 'Inspection complete',
        subtitle: 'Inspector Raj K. \u00b7 300\u00d7 Laptop Stand \u00b7 All passed',
        detail: 'Pre-shipment inspection for order #7RKT441P completed at your Shenzhen warehouse. 300 of 300 units passed. No defects. Lot sealed and ready for dispatch.',
        time: '3 hours ago',
        orderRef: '#7RKT441P',
        productName: 'Aluminum Laptop Stand',
        inspectorName: 'Raj K.',
        actionKind: 'download',
        actionLabel: 'Report',
        reportUrl: '#inspection-7RKT441P.pdf',
        inspectionRating: 4.85,
        passRate: '300/300',
    },
    {
        id: 'a4',
        type: 'pickup_done',
        title: 'Order collected',
        subtitle: 'DHL Express \u00b7 #4KNW280R \u00b7 24\u00d7 Headphones',
        detail: 'Courier DHL Express picked up 24 units of Wireless NC Headphones. Tracking #DHL-9827461035 shared with buyer automatically. Estimated delivery: 3\u20135 business days.',
        time: '1 day ago',
        orderRef: '#4KNW280R',
        productName: 'Wireless NC Headphones',
        courierName: 'DHL Express',
        actionKind: 'none',
        trackingNumber: 'DHL-9827461035',
        estimatedDelivery: '3\u20135 business days',
    },
    {
        id: 'a5',
        type: 'payment',
        title: 'Payment released',
        subtitle: '48\u00d7 Wireless NC Headphones',
        detail: 'Payment for 48 units has cleared and will be deposited within 2 business days to your registered bank account ending in \u2022\u20224521.',
        time: '1 day ago',
        amount: 12912,
        orderRef: '#7RKT441P',
        actionKind: 'none',
        depositEta: 'within 2 business days',
        bankLast4: '4521',
    },
    {
        id: 'a6',
        type: 'listing_rejected',
        title: 'Listing needs updates',
        subtitle: 'Handmade Ceramic Vase',
        detail: 'Your listing is almost ready! A few things need your attention before we can make it live. We have included photos and suggestions below to help you get it right quickly.',
        time: '2 days ago',
        productName: 'Handmade Ceramic Vase',
        rejectionReason: 'Missing CE safety certification. Products in category "Home D\u00e9cor > Ceramics" require a valid CE mark or equivalent safety documentation.',
        actionKind: 'resubmit',
        actionLabel: 'Fix & resubmit',
        urgent: true,
        improvementSuggestions: [
            { text: 'Upload your CE safety certificate (PDF or image)', tip: 'You can get this from your manufacturer or a certified testing lab in your region', photos: [
                { url: 'https://images.unsplash.com/photo-1715173679369-18006e84d6a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDRSUyMGNlcnRpZmljYXRpb24lMjBkb2N1bWVudCUyMHBhcGVyfGVufDF8fHx8MTc3MzM5OTY1OHww&ixlib=rb-4.1.0&q=80&w=1080', caption: 'Example certificate' },
                { url: 'https://images.unsplash.com/photo-1696416228396-d31a664f8881?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDRSUyMHNhZmV0eSUyMGNlcnRpZmljYXRpb24lMjBsYWJlbCUyMHByb2R1Y3R8ZW58MXx8fHwxNzczMzU3Mzk1fDA&ixlib=rb-4.1.0&q=80&w=1080', caption: 'CE mark close-up' },
                { url: 'https://images.unsplash.com/photo-1715173679369-18006e84d6a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvZmZpY2lhbCUyMGRvY3VtZW50JTIwY2VydGlmaWNhdGUlMjBzdGFtcHxlbnwxfHx8fDE3NzM0MDAwMTR8MA&ixlib=rb-4.1.0&q=80&w=1080', caption: 'Stamp placement' },
                { url: 'https://images.unsplash.com/photo-1766297247287-9bf80d5f8281?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWZldHklMjB0ZXN0aW5nJTIwbGFib3JhdG9yeSUyMGVxdWlwbWVudHxlbnwxfHx8fDE3NzM0MDAwMTV8MA&ixlib=rb-4.1.0&q=80&w=1080', caption: 'Testing lab report' },
            ]},
            { text: 'Add the CE mark to your product photos', tip: 'Place the label where buyers can clearly see it \u2014 usually on the base or packaging', photos: [
                { url: 'https://images.unsplash.com/photo-1510828561531-05a3388f6d3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZXJhbWljJTIwdmFzZSUyMHByb2R1Y3QlMjBwaG90b2dyYXBoeXxlbnwxfHx8fDE3NzMzNTczOTV8MA&ixlib=rb-4.1.0&q=80&w=1080', caption: 'Your current photo' },
                { url: 'https://images.unsplash.com/photo-1623413838682-1604739cd41e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZXJhbWljJTIwcHJvZHVjdCUyMHNhZmV0eSUyMGxhYmVsJTIwc3RpY2tlcnxlbnwxfHx8fDE3NzMzOTk2NTh8MA&ixlib=rb-4.1.0&q=80&w=1080', caption: 'Good example: label visible' },
                { url: 'https://images.unsplash.com/photo-1672552228078-f88635bef06d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9kdWN0JTIwbGFiZWwlMjBtYXJraW5nJTIwY29tcGxpYW5jZXxlbnwxfHx8fDE3NzM0MDAwMTV8MA&ixlib=rb-4.1.0&q=80&w=1080', caption: 'Mark on base' },
                { url: 'https://images.unsplash.com/photo-1673436765927-2c94b9705f5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZXJhbWljJTIwdmFzZSUyMGJvdHRvbSUyMGxhYmVsJTIwbWFya2luZ3xlbnwxfHx8fDE3NzM0MDAwMTV8MA&ixlib=rb-4.1.0&q=80&w=1080', caption: 'Bottom label example' },
                { url: 'https://images.unsplash.com/photo-1686632800715-b705ba1b0eb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9kdWN0JTIwcGFja2FnaW5nJTIwbWF0ZXJpYWxzJTIwY2xvc2V1cHxlbnwxfHx8fDE3NzMzOTk2NTh8MA&ixlib=rb-4.1.0&q=80&w=1080', caption: 'Packaging label' },
            ]},
            { text: 'Include material safety details in the description', tip: 'Mention that your ceramics are lead-free, food-safe, or kiln-fired \u2014 whatever applies', photos: [
                { url: 'https://images.unsplash.com/photo-1686632800715-b705ba1b0eb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9kdWN0JTIwcGFja2FnaW5nJTIwbWF0ZXJpYWxzJTIwY2xvc2V1cHxlbnwxfHx8fDE3NzMzOTk2NTh8MA&ixlib=rb-4.1.0&q=80&w=1080', caption: 'Packaging with details' },
            ]},
        ],
    },
    {
        id: 'a7',
        type: 'compliance',
        title: 'Certificate expiring',
        subtitle: 'Ceramic Vase \u00b7 HS 6913.10 \u00b7 14 days left',
        detail: 'Export certificate expires Mar 25, 2026. Upload renewed certificate before expiry to avoid automatic listing suspension.',
        time: '3 days ago',
        productName: 'Handmade Ceramic Vase',
        actionKind: 'upload',
        actionLabel: 'Upload',
        daysLeft: 14,
        certType: 'CE Safety Certificate',
    },
    {
        id: 'a8',
        type: 'platform_notice',
        title: 'Updated return policy',
        subtitle: 'Effective Mar 20 \u00b7 Applies to all sellers',
        detail: 'Platform return window extended from 14 to 21 days for electronics category. Review the updated terms to ensure your policies are aligned.',
        time: '4 days ago',
        actionKind: 'link',
        actionLabel: 'View policy',
    },
];

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