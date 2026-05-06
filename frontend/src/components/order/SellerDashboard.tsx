// @ts-nocheck -- legacy port; tighten incrementally
"use client";

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
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
import { ImageWithFallback } from './figma/ImageWithFallback';
import { NewSellerOnboarding } from './NewSellerOnboarding';
import { SellerTrends } from './SellerTrends';
import { SellerReels } from './SellerReels';
import { PaymentSheet } from './PaymentSheet';
import paymentSvgPaths from './imports/svg-bdwoyeteyk';
import {
    FONT, EASE, GLASS, GLASS_ELEVATED, useBounce, fmt, PRODUCTS,
    ACTION_ORDERS, LISTED, ACTIVITIES, ACTIVITY_ICONS, ACTION_BUTTON_STYLES,
    greet,
} from './seller-dashboard-data';
import type { ActionType, ActionOrder, ListedProduct, Activity, ActivityType, ActivityActionKind } from './seller-dashboard-data';



export function SellerDashboard() {
    const { bounce, ripple } = useBounce();
    const pageRef = useRef<HTMLDivElement>(null);
    const [isNewSeller, setIsNewSeller] = useState(true);
    const [orders, setOrders] = useState(ACTION_ORDERS);
    const [products, setProducts] = useState(LISTED);
    const [showListingForm, setShowListingForm] = useState(false);
    const [listingPickupLocation, setListingPickupLocation] = useState<string>('factory');
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [newAddressLabel, setNewAddressLabel] = useState('');
    const [newAddressValue, setNewAddressValue] = useState('');
    const [savedAddresses, setSavedAddresses] = useState<{ id: string; label: string; address: string }[]>([]);
    const [listingVariations, setListingVariations] = useState<{ id: string; type: string; value: string }[]>([]);
    const [listingLegalExpanded, setListingLegalExpanded] = useState(true);
    const [requestChangesId, setRequestChangesId] = useState<string | null>(null);
    const [changeText, setChangeText] = useState('');
    const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
    const [activities, setActivities] = useState(ACTIVITIES);
    const [adjustId, setAdjustId] = useState<string | null>(null);
    const [adjustDays, setAdjustDays] = useState(0);
    const [chatOpenId, setChatOpenId] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [sampleConfirmId, setSampleConfirmId] = useState<string | null>(null); // orderId being confirmed
    const [sampleConfirmMsgIdx, setSampleConfirmMsgIdx] = useState<number | null>(null);
    const [samplePickupDate, setSamplePickupDate] = useState('');
    const [priceBrackets, setPriceBrackets] = useState<{ id: string; minQty: string; maxQty: string; price: string }[]>([
        { id: '1', minQty: '1', maxQty: '', price: '' }
    ]);

    const handleConfirmSampleRequest = (orderId: string, msgIdx: number, dateStr: string) => {
        const SAMPLE_DELAY_DAYS = 5; // extra days added to deadline for new sample
        setOrders(prev => prev.map(o => {
            if (o.id !== orderId) return o;
            const updatedMessages = o.buyerMessages?.map((m, i) =>
                i === msgIdx ? { ...m, sampleConfirmedDate: dateStr } : m
            );
            // Calculate new deadline — add SAMPLE_DELAY_DAYS
            const origDeadline = o.originalDeadline || o.deadline;
            const deadlineMatch = origDeadline.match(/(\d+)/);
            let newDeadline = origDeadline;
            if (deadlineMatch) {
                const num = parseInt(deadlineMatch[1]);
                // If deadline has hours/minutes, convert to days equivalent
                if (origDeadline.includes('h')) {
                    newDeadline = `${SAMPLE_DELAY_DAYS}d left`;
                } else if (origDeadline.includes('d')) {
                    newDeadline = `${num + SAMPLE_DELAY_DAYS}d left`;
                } else {
                    // Date-style deadline — shift forward
                    newDeadline = `+${SAMPLE_DELAY_DAYS}d — ${origDeadline}`;
                }
            } else {
                newDeadline = `${SAMPLE_DELAY_DAYS}d left`;
            }
            return {
                ...o,
                buyerMessages: updatedMessages,
                extraSampleRequested: true,
                extraSampleReadyDate: dateStr,
                originalDeadline: origDeadline,
                deadline: newDeadline,
                deadlineUrgent: false,
                // If in production step 0, stay at 0 but timeline is extended
                // If past step 0, revert to step 0 for the new sample
                productionStep: o.type === 'production' ? 0 : o.productionStep,
                respondedAt: Date.now(),
            };
        }));
        setSampleConfirmId(null);
        setSampleConfirmMsgIdx(null);
        setSamplePickupDate('');
        toast.success('Sample pickup confirmed', {
            description: `New sample ready by ${dateStr} — timeline adjusted (+5 days)`,
        });
    };
    const [priceEditId, setPriceEditId] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState('');
    const [toggleProductId, setToggleProductId] = useState<string | null>(null);
    const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
    const [cancelPassword, setCancelPassword] = useState('');
    const [cancelPasswordError, setCancelPasswordError] = useState(false);
    const [togglePassword, setTogglePassword] = useState('');
    const [toggleError, setToggleError] = useState(false);
    const [paymentProductId, setPaymentProductId] = useState<string | null>(null);
    const [paymentStep, setPaymentStep] = useState<'summary' | 'methods' | 'card_form' | 'processing' | 'done'>('summary');
    const [selectedPayMethod, setSelectedPayMethod] = useState<string | null>(null);
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [showAllActivity, setShowAllActivity] = useState(false);
    const [activityReplyId, setActivityReplyId] = useState<string | null>(null);
    const [activityReplyText, setActivityReplyText] = useState('');
    const [newOrdersExpanded, setNewOrdersExpanded] = useState(false);
    const [depositConfirmId, setDepositConfirmId] = useState<string | null>(null);
    const [declineConfirmId, setDeclineConfirmId] = useState<string | null>(null);

    // Sort orders: needs-response first, responded orders sink to bottom
    const sortedOrders = useMemo(() => {
        const needsResponse = (o: ActionOrder) => {
            if (o.type === 'approval' || o.type === 'sample') return true;
            if (o.type === 'production') {
                const ps = o.productionStep ?? 0;
                return ps === 0 || ps === 3; // seller action needed at these steps
            }
            if (o.type === 'pickup' && (o.timelineStep ?? 0) === 0 && !o.respondedAt) return true;
            return !o.respondedAt;
        };
        return [...orders].sort((a, b) => {
            const aNeed = needsResponse(a);
            const bNeed = needsResponse(b);
            if (aNeed && !bNeed) return -1;
            if (!aNeed && bNeed) return 1;
            // Among needs-response: urgent first, then by total value descending
            if (aNeed && bNeed) {
                if (a.deadlineUrgent && !b.deadlineUrgent) return -1;
                if (!a.deadlineUrgent && b.deadlineUrgent) return 1;
                const aVal = a.qty * a.unitPrice;
                const bVal = b.qty * b.unitPrice;
                return bVal - aVal; // highest value first
            }
            // Among responded: most recent response last (bottom)
            return (a.respondedAt ?? 0) - (b.respondedAt ?? 0);
        });
    }, [orders]);

    // Compute pending earnings from active orders + in-progress
    const pendingFromOrders = orders.reduce((sum, o) => sum + o.qty * o.unitPrice, 0);
    const inProgressPending = 150 * 269 + 300 * 45; // in-transit orders
    const totalPending = pendingFromOrders + inProgressPending;
    const lastPaidAmount = 12912;

    const handleConfirmPickup = (id: string) => {
        setOrders(prev => prev.map(o => {
            if (o.id !== id) return o;
            const nextStep = (o.timelineStep ?? 0) + 1;
            if (nextStep >= 4) {
                return null as unknown as ActionOrder;
            }
            return {
                ...o,
                timelineStep: nextStep,
                deadline: nextStep === 1 ? 'Courier arriving tomorrow' : nextStep === 2 ? 'Estimated 3–5 days' : 'Delivered',
                deadlineUrgent: false,
                message: undefined,
                respondedAt: Date.now(),
            };
        }).filter(Boolean));
        const step = orders.find(o => o.id === id)?.timelineStep ?? 0;
        const labels = ['Courier pickup scheduled', 'In transit now', 'Delivery confirmed', 'Order completed'];
        toast.success(labels[step] || 'Phase advanced', {
            description: 'Order moved to next phase',
        });
    };

    const handleApproveSample = (id: string) => {
        setOrders(prev => prev.filter(o => o.id !== id));
        toast.success('Sample marked as ready', {
            description: 'Our team will collect it from your location shortly',
        });
    };

    const handleApproveAndProduce = (id: string) => {
        const collectionDate = new Date();
        collectionDate.setDate(collectionDate.getDate() + 7);
        const dateStr = collectionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        setOrders(prev => prev.map(o => {
            if (o.id !== id) return o;
            return {
                ...o,
                type: 'production' as ActionType,
                deadline: `Sample collection: ${dateStr}`,
                deadlineUrgent: false,
                message: undefined,
                sampleCollectionDate: dateStr,
                productionStartDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                productionStep: 0,
                timelineStep: 0,
                respondedAt: Date.now(),
            };
        }));
        toast.success('Production scheduled', {
            description: `Sample collection on ${dateStr}`,
        });
    };

    const DAILY_RATE_PCT = 0.19; // 0.19% per day — bonus (early) or penalty (delay)
    const CANCEL_PENALTY_PCT = 15; // 15% flat for cancellation
    const BIG_ORDER_THRESHOLD = 25000; // Orders above this require security deposit
    const SECURITY_DEPOSIT_PCT = 9; // 9% refundable deposit for large orders

    const handleAdjustTimeline = (id: string, days: number) => {
        const order = orders.find(o => o.id === id);
        if (!order || days === 0) return;
        const totalValue = order.qty * order.unitPrice;
        const dailyCost = Math.round(totalValue * DAILY_RATE_PCT / 100);
        const isEarly = days < 0;
        const maxBonus = Math.round(totalValue * 1.5 / 100);
        const totalAmount = isEarly ? Math.min(dailyCost * Math.abs(days), maxBonus) : dailyCost * days;
        const newDeadline = new Date();
        newDeadline.setDate(newDeadline.getDate() + days);
        const dateStr = newDeadline.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        setOrders(prev => prev.map(o => {
            if (o.id !== id) return o;
            return {
                ...o,
                deadline: isEarly ? `Early · ${dateStr}` : `Delayed to ${dateStr}`,
                deadlineUrgent: !isEarly,
                message: isEarly
                    ? `Finishing ${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''} early · ${fmt(totalAmount)} bonus added`
                    : `Delayed ${days} day${days > 1 ? 's' : ''} · ${fmt(totalAmount)} penalty will be deducted`,
                respondedAt: Date.now(),
            };
        }));
        setAdjustId(null);
        setAdjustDays(0);
        if (isEarly) {
            toast.success(`Early delivery confirmed · ${fmt(totalAmount)} bonus`, {
                description: `New deadline: ${dateStr}. ${fmt(dailyCost)}/day bonus added to your payout.`,
            });
        } else {
            toast(`Extension confirmed · ${fmt(totalAmount)} fee`, {
                description: `New deadline: ${dateStr}. ${fmt(dailyCost)}/day will be deducted from your payout.`,
            });
        }
    };

    const handleCancelOrder = (id: string) => {
        const order = orders.find(o => o.id === id);
        if (!order) return;
        const totalValue = order.qty * order.unitPrice;
        const penalty = Math.round(totalValue * CANCEL_PENALTY_PCT / 100);
        setOrders(prev => prev.filter(o => o.id !== id));
        setAdjustId(null);
        setCancelConfirmId(null);
        setCancelPassword('');
        setCancelPasswordError(false);
        setAdjustDays(0);
        toast.error(`Order cancelled · ${fmt(penalty)} penalty`, {
            description: `${CANCEL_PENALTY_PCT}% of ${fmt(totalValue)} will be deducted from your next payout`,
        });
    };

    const handleRequestChanges = (id: string) => {
        if (requestChangesId === id) {
            if (changeText.trim()) {
                setOrders(prev => prev.filter(o => o.id !== id));
                setRequestChangesId(null);
                setChangeText('');
                toast('Changes requested', {
                    description: 'We\'ll update the sample accordingly',
                });
            }
        } else {
            setRequestChangesId(id);
        }
    };

    const handleActivityAction = (activity: Activity) => {
        switch (activity.actionKind) {
            case 'download':
                toast.success('Downloading…', { description: `${activity.actionLabel ?? 'Report'} for ${activity.orderRef ?? activity.productName}` });
                break;
            case 'reply':
                setActivityReplyId(activityReplyId === activity.id ? null : activity.id);
                setActivityReplyText('');
                if (expandedActivity !== activity.id) setExpandedActivity(activity.id);
                break;
            case 'upload':
                toast('File picker opening…', { description: 'Select your renewed certificate' });
                break;
            case 'resubmit':
                toast('Opening listing editor…', { description: `Fix and resubmit "${activity.productName}"` });
                break;
            case 'reorder':
                toast('Scheduling new sample pickup…', { description: activity.orderRef ?? '' });
                break;
            case 'link':
                toast.info(activity.title, { description: activity.detail });
                break;
            default:
                toast(activity.title, { description: activity.detail });
        }
    };

    const handleDismissActivity = (id: string) => {
        setActivities(prev => prev.filter(a => a.id !== id));
        toast('Dismissed', { description: 'Notification removed' });
    };

    // ── New seller onboarding ────────────────────────────────────────────────
    if (isNewSeller) {
        return (
            <NewSellerOnboarding
                sellerName="Noah"
                onComplete={() => setIsNewSeller(false)}
            />
        );
    }

    return (
        <div
            className="max-w-[760px] mx-auto pb-24 px-4 sm:px-6"
            ref={pageRef}
            style={{ fontFamily: FONT }}
        >
            {/* ── Greeting + Earnings summary ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="pt-10 md:pt-12 pb-2"
            >
                <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-[#1A1A1A]/30 tracking-wide">
                        {greet()}, Noah
                    </p>
                    {/* Demo toggle — preview new seller onboarding */}
                    <button
                        onClick={() => setIsNewSeller(true)}
                        className="text-[11px] font-semibold text-[#1A1A1A]/22 hover:text-[#0171E3] transition-colors bg-transparent border-none cursor-pointer px-2 py-1 rounded-full"
                        style={{ border: '0.5px solid rgba(0,0,0,0.06)' }}
                    >
                        ← New seller view
                    </button>
                </div>
            </motion.div>

            {/* ── Earnings overview — the number sellers care about most ── */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.6, ease: EASE }}
                className="mb-12 mt-1"
            >
                <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-[36px] md:text-[42px] font-black text-[#1A1A1A]/90 tracking-tighter tabular-nums leading-none">
                        {fmt(totalPending)}
                    </p>
                    <p className="text-[14px] font-medium text-[#1A1A1A]/20">
                        pending
                    </p>
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <div className="w-[6px] h-[6px] rounded-full" style={{ background: 'linear-gradient(135deg, #34d058, #2eaa57)', boxShadow: '0 0 6px rgba(46,170,87,0.3)' }} />
                    <p className="text-[12px] font-medium text-[#1A1A1A]/30">
                        Last deposit {fmt(lastPaidAmount)}
                    </p>
                </div>
            </motion.div>

            {/* ═══════════════════════════════════════ */}
            {/*  ACTION CARDS — what needs your response */}
            {/* ═══════════════════════════════════════ */}
            {sortedOrders.length > 0 && (() => {
                const newOrders = sortedOrders.filter(o => !o.respondedAt);
                const inProgressOrders = sortedOrders.filter(o => !!o.respondedAt);
                const actionCount = newOrders.length;
                const NEW_ORDERS_COLLAPSED_LIMIT = 3;
                const hasHiddenNewOrders = !newOrdersExpanded && newOrders.length > NEW_ORDERS_COLLAPSED_LIMIT;
                const hiddenCount = newOrders.length - NEW_ORDERS_COLLAPSED_LIMIT;
                const visibleNewOrders = newOrdersExpanded ? newOrders : newOrders.slice(0, NEW_ORDERS_COLLAPSED_LIMIT);
                const groupedOrders = [
                    ...visibleNewOrders,
                    ...inProgressOrders,
                ];
                return (
                <div className="mb-10">
                    <div className="flex items-center gap-2.5 mb-5 px-1">
                        <p className="text-[12px] font-semibold text-[#1A1A1A]/30 tracking-wide">
                            Your orders
                        </p>
                        {actionCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-[#e67e22]"
                                style={{ background: 'rgba(230,126,34,0.06)', border: '0.5px solid #e67e221a' }}>
                                <div className="w-[5px] h-[5px] rounded-full bg-[#e67e22] animate-pulse" />
                                {actionCount} need{actionCount === 1 ? 's' : ''} response
                            </span>
                        )}
                    </div>
                    <div className="space-y-6">
                        {groupedOrders.map((order, oi) => {
                            const totalValue = order.qty * order.unitPrice;
                            const needsAction = !order.respondedAt;
                            // Show "New orders" header before first item, "In progress" divider at boundary
                            const isFirstNewOrder = needsAction && oi === 0;
                            const prevOrder = oi > 0 ? groupedOrders[oi - 1] : null;
                            const showDivider = !needsAction && (!prevOrder || !prevOrder.respondedAt);
                            const isLastVisibleNewOrder = needsAction && hasHiddenNewOrders && oi === visibleNewOrders.length - 1;
                            return (
                                <div key={`frag-${order.id}`} className="contents">
                                {isFirstNewOrder && actionCount > 0 && (
                                    <div key="divider-new" className="flex items-center gap-3 py-2 px-1">
                                        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)' }} />
                                        <span className="text-[10px] font-semibold text-[#e67e22]/50 uppercase tracking-widest flex-shrink-0">New orders</span>
                                        <span className="text-[10px] font-semibold text-[#e67e22]/30 tabular-nums flex-shrink-0">{newOrders.length}</span>
                                        {newOrdersExpanded && newOrders.length > NEW_ORDERS_COLLAPSED_LIMIT && (
                                            <button
                                                onClick={() => setNewOrdersExpanded(false)}
                                                className="text-[10px] font-semibold text-[#1A1A1A]/25 uppercase tracking-wider flex-shrink-0 border-none bg-transparent cursor-pointer hover:text-[#1A1A1A]/40 transition-colors px-0"
                                            >
                                                Collapse
                                            </button>
                                        )}
                                        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)' }} />
                                    </div>
                                )}
                                {showDivider && (
                                    <div key="divider-progress" className="flex items-center gap-3 py-3 px-1">
                                        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)' }} />
                                        <span className="text-[10px] font-semibold text-[#1A1A1A]/25 uppercase tracking-widest flex-shrink-0">In progress</span>
                                        <span className="text-[10px] font-semibold text-[#1A1A1A]/15 tabular-nums flex-shrink-0">{inProgressOrders.length}</span>
                                        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)' }} />
                                    </div>
                                )}
                                <motion.div
                                    id={`order-${order.id}`}
                                    layout
                                    layoutId={`order-card-${order.id}`}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: needsAction ? 1 : 0.85, y: 0 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                    transition={{ 
                                        delay: 0.06 + oi * 0.08, 
                                        duration: 0.5, 
                                        ease: EASE,
                                        layout: { type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }
                                    }}
                                    className={`relative rounded-[24px] backdrop-blur-2xl border overflow-hidden ${
                                        needsAction 
                                            ? 'bg-white/80 border-white/40' 
                                            : 'bg-white/50 border-white/20'
                                    }`}
                                    style={{ 
                                        boxShadow: needsAction ? GLASS_ELEVATED : GLASS,
                                        ...(isLastVisibleNewOrder ? { position: 'relative' as const, zIndex: 2 } : {})
                                    }}
                                >
                                    {/* Urgency glow */}
                                    {order.deadlineUrgent && needsAction && (
                                        <div className="absolute -inset-3 rounded-[28px] -z-10 blur-[32px] opacity-20"
                                            style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(255,160,50,0.35), transparent 70%)' }}
                                        />
                                    )}

                                    <div className="p-5 md:p-7">
                                        {/* Top row: product + value */}
                                        <div className="flex items-start gap-4">
                                            <div className="w-[56px] h-[56px] md:w-[64px] md:h-[64px] rounded-[16px] bg-gradient-to-br from-[#fafafa] to-[#f0f0f0] flex-shrink-0 overflow-hidden flex items-center justify-center"
                                                style={{ border: '0.5px solid rgba(0,0,0,0.04)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
                                            >
                                                <ImageWithFallback
                                                    src={order.image}
                                                    alt={order.product}
                                                    className="w-[80%] h-[80%] object-contain"
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-[15px] md:text-[16px] font-bold text-[#1A1A1A]/85 leading-snug truncate">
                                                            {order.product}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <p className="text-[11px] sm:text-[12px] font-medium text-[#1A1A1A]/40 truncate">
                                                                {order.orderNumber} &middot; {order.buyer} &middot; {order.destination}
                                                            </p>
                                                            {/* Badge removed — section divider handles categorization */}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Order value row — with negotiation support */}
                                                {(() => {
                                                    const hasNegotiated = order.negotiatedUnitPrice != null && order.negotiatedUnitPrice !== order.unitPrice;
                                                    const activePrice = hasNegotiated ? order.negotiatedUnitPrice! : order.unitPrice;
                                                    const activeTotal = order.qty * activePrice;
                                                    const isEditing = priceEditId === order.id;
                                                    
                                                    return (
                                                        <div className="mt-2.5">
                                                            <div className="flex items-baseline gap-2 flex-wrap">
                                                                <span className="text-[18px] font-black text-[#1A1A1A]/90 leading-none tabular-nums">
                                                                    {fmt(activeTotal)}
                                                                </span>
                                                                {hasNegotiated ? (
                                                                    <span className="flex items-center gap-1.5">
                                                                        <span className="text-[12px] font-medium text-[#1A1A1A]/30 line-through tabular-nums">
                                                                            {fmt(order.unitPrice)}/ea
                                                                        </span>
                                                                        <ArrowRight size={10} color="rgba(26,26,26,0.25)" />
                                                                        <span className="text-[13px] font-bold text-[#0071e3] tabular-nums">
                                                                            {fmt(activePrice)}/ea
                                                                        </span>
                                                                        <span className="text-[11px] font-medium text-[#1A1A1A]/30">
                                                                            &times; {order.qty}
                                                                        </span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[12px] font-medium text-[#1A1A1A]/40">
                                                                        {order.qty} &times; {fmt(order.unitPrice)}/ea
                                                                    </span>
                                                                )}
                                                                {/* Tap-to-edit for approval orders */}
                                                                {order.type === 'approval' && !order.priceOfferSent && (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (isEditing) {
                                                                                setPriceEditId(null);
                                                                            } else {
                                                                                setPriceEditId(order.id);
                                                                                setEditPrice(String(activePrice));
                                                                            }
                                                                        }}
                                                                        className="ml-2 px-2.5 py-[3px] rounded-full flex items-center justify-center border-none cursor-pointer active:scale-[0.93] transition-all duration-200 ease-out backdrop-blur-md"
                                                                        style={{
                                                                            background: isEditing ? 'rgba(0,113,227,0.08)' : 'rgba(255,255,255,0.5)',
                                                                            boxShadow: isEditing
                                                                                ? '0 0 0 1px rgba(0,113,227,0.15), 0 1px 3px rgba(0,113,227,0.06)'
                                                                                : '0 0 0 1px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
                                                                        }}
                                                                        title="Adjust price per unit"
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                fontSize: '10px',
                                                                                fontWeight: 600,
                                                                                letterSpacing: '0.02em',
                                                                                color: isEditing ? '#0071e3' : 'rgba(26,26,26,0.35)',
                                                                                lineHeight: 1,
                                                                            }}
                                                                        >
                                                                            {isEditing ? 'done' : 'edit'}
                                                                        </span>
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Inline price editor */}
                                                            <AnimatePresence>
                                                                {isEditing && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: 'auto' }}
                                                                        exit={{ opacity: 0, height: 0 }}
                                                                        transition={{ duration: 0.2, ease: EASE }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="mt-2 flex items-center gap-2">
                                                                            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] bg-[#0071e3]/5 border border-[#0071e3]/15">
                                                                                <span className="text-[11px] font-semibold text-[#0071e3]/50">₹</span>
                                                                                <input
                                                                                    type="number"
                                                                                    value={editPrice}
                                                                                    onChange={(e) => setEditPrice(e.target.value)}
                                                                                    className="w-[72px] bg-transparent border-none outline-none text-[14px] font-bold text-[#0071e3] tabular-nums"
                                                                                    autoFocus
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === 'Enter' && editPrice) {
                                                                                            const newPrice = Number(editPrice);
                                                                                            if (newPrice > 0) {
                                                                                                setOrders(prev => prev.map(o =>
                                                                                                    o.id === order.id ? { ...o, negotiatedUnitPrice: newPrice } : o
                                                                                                ));
                                                                                                setPriceEditId(null);
                                                                                            }
                                                                                        }
                                                                                        if (e.key === 'Escape') setPriceEditId(null);
                                                                                    }}
                                                                                />
                                                                                <span className="text-[10px] font-medium text-[#0071e3]/40">/unit</span>
                                                                            </div>
                                                                            <motion.button
                                                                                whileTap={{ scale: 0.95 }}
                                                                                onClick={() => {
                                                                                    const newPrice = Number(editPrice);
                                                                                    if (newPrice > 0) {
                                                                                        setOrders(prev => prev.map(o =>
                                                                                            o.id === order.id ? { ...o, negotiatedUnitPrice: newPrice } : o
                                                                                        ));
                                                                                        setPriceEditId(null);
                                                                                        if (newPrice !== order.unitPrice) {
                                                                                            toast('Price updated', { description: `${fmt(order.unitPrice)} → ${fmt(newPrice)} per unit` });
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                className="px-3 py-1.5 rounded-full border-none cursor-pointer text-[11px] font-bold text-white"
                                                                                style={{ background: '#0071e3' }}
                                                                            >
                                                                                Set
                                                                            </motion.button>
                                                                            {hasNegotiated && (
                                                                                <motion.button
                                                                                    whileTap={{ scale: 0.95 }}
                                                                                    onClick={() => {
                                                                                        setOrders(prev => prev.map(o =>
                                                                                            o.id === order.id ? { ...o, negotiatedUnitPrice: undefined } : o
                                                                                        ));
                                                                                        setPriceEditId(null);
                                                                                        toast('Price reset to original');
                                                                                    }}
                                                                                    className="px-2 py-1.5 rounded-full cursor-pointer text-[11px] font-semibold"
                                                                                    style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.06)', color: 'rgba(26,26,26,0.4)' }}
                                                                                >
                                                                                    Reset
                                                                                </motion.button>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-[10px] font-medium text-[#1A1A1A]/30 mt-1.5">
                                                                            New total: {fmt(order.qty * (Number(editPrice) || activePrice))} for {order.qty} units
                                                                        </p>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>

                                                            {/* Price offer status badges */}
                                                            {hasNegotiated && order.priceOfferSent && !order.priceAccepted && (
                                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                                    <div className="w-[5px] h-[5px] rounded-full bg-[#e67e22] animate-pulse" />
                                                                    <span className="text-[10px] font-semibold text-[#e67e22]">Awaiting buyer approval</span>
                                                                </div>
                                                            )}
                                                            {hasNegotiated && order.priceAccepted && (
                                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                                    <Check size={10} color="#2eaa57" strokeWidth={3} />
                                                                    <span className="text-[10px] font-semibold text-[#2eaa57]">Price agreed by buyer</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                {/* Deadline — inline text + message button */}
                                                <div className="flex items-center gap-2 mt-2">
                                                    {order.deadlineUrgent ? (
                                                        <AlertTriangle size={12} color="#e67e22" strokeWidth={2.5} />
                                                    ) : (
                                                        <Clock size={12} color="rgba(26,26,26,0.3)" strokeWidth={2} />
                                                    )}
                                                    <span className={`flex-1 text-[11px] font-semibold ${order.deadlineUrgent ? 'text-[#e67e22]' : 'text-[#1A1A1A]/50'}`}>
                                                        {order.type === 'pickup' ? `Pickup: ${order.deadline}` : order.deadline}
                                                        {order.deadlineUrgent && order.type !== 'approval' && (
                                                            <span className="text-[#e67e22]/60 ml-1.5">&middot; Late fees apply</span>
                                                        )}
                                                        {order.extraSampleRequested && (
                                                            <span className="text-[#e67e22]/50 ml-1.5">&middot; +5d sample</span>
                                                        )}
                                                    </span>
                                                    {order.buyerMessages && order.buyerMessages.length > 0 && (
                                                        <button
                                                            onClick={() => setChatOpenId(chatOpenId === order.id ? null : order.id)}
                                                            className="relative w-[30px] h-[30px] rounded-[10px] backdrop-blur-xl bg-white/70 flex items-center justify-center cursor-pointer border border-white/50 hover:bg-white/90 hover:border-white/60 active:scale-[0.93] transition-all duration-200 ease-out flex-shrink-0"
                                                            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.03), 0 0 0 0.5px rgba(0,0,0,0.025), inset 0 0.5px 0 rgba(255,255,255,0.7)' }}
                                                        >
                                                            {(() => {
                                                                const hasPendingSample = order.buyerMessages.some(m => m.isSampleRequest && !m.sampleConfirmedDate);
                                                                return (
                                                                    <>
                                                                        <MessageCircle size={13} color={hasPendingSample ? '#e67e22' : '#0071e3'} strokeWidth={2} style={{ opacity: 0.7 }} />
                                                                        <span
                                                                            className="absolute -top-[3px] -right-[3px] min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-[3px]"
                                                                            style={{ background: hasPendingSample ? '#e67e22' : '#FF3B30', boxShadow: `0 1px 4px ${hasPendingSample ? 'rgba(230,126,34,0.3)' : 'rgba(255,59,48,0.3)'}, 0 0 0 1.5px rgba(255,255,255,0.9)` }}
                                                                        >
                                                                            <span className="text-[8px] font-bold text-white leading-none">{order.buyerMessages.length}</span>
                                                                        </span>
                                                                    </>
                                                                );
                                                            })()}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Expandable chat panel */}
                                                {order.buyerMessages && order.buyerMessages.length > 0 && (
                                                    <AnimatePresence>
                                                        {chatOpenId === order.id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.25, ease: EASE }}
                                                                className="overflow-hidden mt-2"
                                                            >
                                                                <div className="rounded-[14px] bg-[#1A1A1A]/[0.02] overflow-hidden">
                                                                    <div className="p-3 space-y-2.5 max-h-[280px] overflow-y-auto">
                                                                        {order.buyerMessages.map((msg, mi) => (
                                                                            <div key={mi}>
                                                                                <div className="flex items-start gap-2.5">
                                                                                    <div className={`w-[24px] h-[24px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${msg.isSampleRequest ? 'bg-[#e67e22]/12' : 'bg-[#0071e3]/10'}`}>
                                                                                        {msg.isSampleRequest
                                                                                            ? <Package size={10} strokeWidth={2.5} className="text-[#e67e22]" />
                                                                                            : <span className="text-[10px] font-bold text-[#0071e3]">{order.buyer.charAt(0)}</span>
                                                                                        }
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-[11px] font-bold text-[#1A1A1A]/70">{order.buyer.split(' ')[0]}</span>
                                                                                            <span className="text-[10px] font-medium text-[#1A1A1A]/25">{msg.time}</span>
                                                                                            {msg.isCustomRequest && (
                                                                                                <span className="px-1.5 py-0.5 rounded-full bg-[#e67e22]/10 text-[8px] font-bold text-[#e67e22] uppercase tracking-wide">Custom</span>
                                                                                            )}
                                                                                            {msg.isSampleRequest && (
                                                                                                <span className="px-1.5 py-0.5 rounded-full bg-[#e67e22]/10 text-[8px] font-bold text-[#e67e22] uppercase tracking-wide">New Sample</span>
                                                                                            )}
                                                                                        </div>
                                                                                        <p className={`text-[12px] font-medium leading-snug mt-0.5 ${msg.isSampleRequest ? 'text-[#1A1A1A]/70' : 'text-[#1A1A1A]/60'}`}>{msg.text}</p>

                                                                                        {/* Sample request action area */}
                                                                                        {msg.isSampleRequest && (
                                                                                            <div className="mt-2">
                                                                                                {msg.sampleConfirmedDate ? (
                                                                                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] w-fit" style={{ background: 'rgba(46,170,87,0.06)', border: '0.5px solid rgba(46,170,87,0.12)' }}>
                                                                                                        <Check size={10} color="#2eaa57" strokeWidth={3} />
                                                                                                        <span className="text-[10px] font-semibold text-[#2eaa57]">
                                                                                                            Pickup confirmed — {msg.sampleConfirmedDate}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                ) : sampleConfirmId === order.id && sampleConfirmMsgIdx === mi ? (
                                                                                                    <motion.div
                                                                                                        initial={{ opacity: 0, y: 4 }}
                                                                                                        animate={{ opacity: 1, y: 0 }}
                                                                                                        transition={{ duration: 0.2, ease: EASE }}
                                                                                                        className="flex items-center gap-2 flex-wrap"
                                                                                                    >
                                                                                                        {(() => {
                                                                                                            const today = new Date();
                                                                                                            today.setHours(0,0,0,0);
                                                                                                            const selDate = samplePickupDate ? new Date(samplePickupDate + 'T00:00:00') : null;
                                                                                                            const viewMonth = (() => {
                                                                                                                if (samplePickupDate.startsWith('NAV:')) {
                                                                                                                    const [y, m] = samplePickupDate.slice(4).split('-').map(Number);
                                                                                                                    return new Date(y, m - 1, 1);
                                                                                                                }
                                                                                                                if (selDate && !isNaN(selDate.getTime())) return new Date(selDate.getFullYear(), selDate.getMonth(), 1);
                                                                                                                return new Date(today.getFullYear(), today.getMonth(), 1);
                                                                                                            })();
                                                                                                            const yr = viewMonth.getFullYear();
                                                                                                            const mo = viewMonth.getMonth();
                                                                                                            const daysInMonth = new Date(yr, mo + 1, 0).getDate();
                                                                                                            const startDay = new Date(yr, mo, 1).getDay();
                                                                                                            const dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];
                                                                                                            const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                                                                                                            const canGoPrev = !(yr === today.getFullYear() && mo === today.getMonth());
                                                                                                            const selectedISO = selDate && !isNaN(selDate.getTime()) ? samplePickupDate : null;
                                                                                                            return (
                                                                                                                <motion.div
                                                                                                                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                                                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                                                                    transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                                                                                                                    className="rounded-[14px] overflow-hidden backdrop-blur-2xl"
                                                                                                                    style={{
                                                                                                                        background: 'linear-gradient(145deg, rgba(255,255,255,0.82), rgba(255,250,245,0.72))',
                                                                                                                        border: '0.5px solid rgba(230,126,34,0.12)',
                                                                                                                        boxShadow: '0 8px 32px -4px rgba(230,126,34,0.08), 0 2px 8px rgba(0,0,0,0.03), inset 0 0.5px 0 rgba(255,255,255,0.8)',

                                                                                                                    }}
                                                                                                                >
                                                                                                                    <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                                                                                                                        <button
                                                                                                                            onClick={() => { if (canGoPrev) { const prev = new Date(yr, mo - 1, 1); setSamplePickupDate(`NAV:${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,'0')}`); } }}
                                                                                                                            className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center border-none cursor-pointer transition-all duration-150"
                                                                                                                            style={{ background: canGoPrev ? 'rgba(230,126,34,0.06)' : 'transparent', opacity: canGoPrev ? 1 : 0.2, pointerEvents: canGoPrev ? 'auto' : 'none' }}
                                                                                                                        >
                                                                                                                            <ChevronRight size={11} strokeWidth={2.5} className="text-[#e67e22] rotate-180" />
                                                                                                                        </button>
                                                                                                                        <span className="text-[11px] font-semibold text-[#1A1A1A]/60">{monthLabel}</span>
                                                                                                                        <button
                                                                                                                            onClick={() => { const next = new Date(yr, mo + 1, 1); setSamplePickupDate(`NAV:${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}`); }}
                                                                                                                            className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center border-none cursor-pointer transition-all duration-150"
                                                                                                                            style={{ background: 'rgba(230,126,34,0.06)' }}
                                                                                                                        >
                                                                                                                            <ChevronRight size={11} strokeWidth={2.5} className="text-[#e67e22]" />
                                                                                                                        </button>
                                                                                                                    </div>
                                                                                                                    <div className="grid grid-cols-7 px-2 pt-1 pb-0.5">
                                                                                                                        {dayNames.map(d => (
                                                                                                                            <div key={d} className="flex items-center justify-center h-[20px]">
                                                                                                                                <span className="text-[9px] font-semibold text-[#1A1A1A]/20 uppercase tracking-wider">{d}</span>
                                                                                                                            </div>
                                                                                                                        ))}
                                                                                                                    </div>
                                                                                                                    <div className="grid grid-cols-7 px-2 pb-2.5 gap-y-[1px]">
                                                                                                                        {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} className="h-[26px]" />)}
                                                                                                                        {Array.from({ length: daysInMonth }).map((_, i) => {
                                                                                                                            const day = i + 1;
                                                                                                                            const cellDate = new Date(yr, mo, day);
                                                                                                                            const isPast = cellDate < today;
                                                                                                                            const isToday = cellDate.getTime() === today.getTime();
                                                                                                                            const iso = `${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                                                                                                                            const isSelected = selectedISO === iso;
                                                                                                                            return (
                                                                                                                                <button
                                                                                                                                    key={day}
                                                                                                                                    disabled={isPast}
                                                                                                                                    onClick={() => setSamplePickupDate(iso)}
                                                                                                                                    className="h-[26px] w-full flex items-center justify-center border-none cursor-pointer transition-all duration-150 rounded-[8px]"
                                                                                                                                    style={{
                                                                                                                                        background: isSelected ? 'linear-gradient(135deg, #f0a54a, #e89a3e)' : isToday ? 'rgba(230,126,34,0.06)' : 'transparent',
                                                                                                                                        opacity: isPast ? 0.2 : 1,
                                                                                                                                        pointerEvents: isPast ? 'none' : 'auto',
                                                                                                                                        boxShadow: isSelected ? '0 2px 8px rgba(230,126,34,0.2), inset 0 0.5px 0 rgba(255,255,255,0.3)' : 'none',
                                                                                                                                    }}
                                                                                                                                >
                                                                                                                                    <span className="text-[11px] font-semibold" style={{ color: isSelected ? '#fff' : isToday ? '#e67e22' : 'rgba(26,26,26,0.55)' }}>
                                                                                                                                        {day}
                                                                                                                                    </span>
                                                                                                                                </button>
                                                                                                                            );
                                                                                                                        })}
                                                                                                                    </div>
                                                                                                                    {selectedISO && (
                                                                                                                        <div className="px-3 pb-2.5 pt-0">
                                                                                                                            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-[8px]" style={{ background: 'rgba(230,126,34,0.05)' }}>
                                                                                                                                <CalendarClock size={9} strokeWidth={2.5} className="text-[#e67e22]/50" />
                                                                                                                                <span className="text-[10px] font-semibold text-[#e67e22]">
                                                                                                                                    {selDate!.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                                                                                                </span>
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                </motion.div>
                                                                                                            );
                                                                                                        })()}
                                                                                                        <motion.button
                                                                                                            whileTap={{ scale: 0.95 }}
                                                                                                            onClick={() => {
                                                                                                                const isValidDate = samplePickupDate && !samplePickupDate.startsWith('NAV:');
                                                                                                                if (isValidDate) {
                                                                                                                    const d = new Date(samplePickupDate + 'T00:00:00');
                                                                                                                    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                                                                                    handleConfirmSampleRequest(order.id, mi, formatted);
                                                                                                                }
                                                                                                            }}
                                                                                                            className="px-3 py-1.5 rounded-full border-none cursor-pointer text-[10px] font-bold text-white"
                                                                                                            style={{ background: (samplePickupDate && !samplePickupDate.startsWith('NAV:')) ? '#2eaa57' : 'rgba(26,26,26,0.08)', color: (samplePickupDate && !samplePickupDate.startsWith('NAV:')) ? '#fff' : 'rgba(26,26,26,0.25)', transition: 'all 0.2s ease' }}
                                                                                                        >
                                                                                                            Confirm
                                                                                                        </motion.button>
                                                                                                        <button
                                                                                                            onClick={() => { setSampleConfirmId(null); setSampleConfirmMsgIdx(null); }}
                                                                                                            className="text-[10px] font-medium text-[#1A1A1A]/25 bg-transparent border-none cursor-pointer hover:text-[#1A1A1A]/40 transition-colors"
                                                                                                        >
                                                                                                            Cancel
                                                                                                        </button>
                                                                                                    </motion.div>
                                                                                                ) : (
                                                                                                    <motion.button
                                                                                                        whileHover={{ scale: 1.01 }}
                                                                                                        whileTap={{ scale: 0.97 }}
                                                                                                        onClick={() => {
                                                                                                            setSampleConfirmId(order.id);
                                                                                                            setSampleConfirmMsgIdx(mi);
                                                                                                            setSamplePickupDate('');
                                                                                                        }}
                                                                                                        className="mt-0.5 px-3 py-1.5 rounded-full cursor-pointer inline-flex items-center gap-1.5 text-[10px] font-semibold border-none"
                                                                                                        style={{ background: 'rgba(230,126,34,0.08)', color: '#e67e22', transition: 'all 0.2s ease' }}
                                                                                                    >
                                                                                                        <CalendarClock size={10} strokeWidth={2.5} />
                                                                                                        Confirm pickup date
                                                                                                    </motion.button>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <div className="border-t border-black/[0.04] px-3 py-2 flex items-center gap-2">
                                                                        <button
                                                                            className="group/tag w-[28px] h-[28px] rounded-full flex items-center justify-center border-none cursor-pointer flex-shrink-0 transition-colors"
                                                                            style={{ background: order.buyerMessages.some(m => m.isCustomRequest) ? 'rgba(230,126,34,0.12)' : 'rgba(0,0,0,0.03)' }}
                                                                            title="Mark as custom order"
                                                                            onClick={() => {
                                                                                const hasCustom = order.buyerMessages.some(m => m.isCustomRequest);
                                                                                if (!hasCustom) {
                                                                                    setOrders(prev => prev.map(o =>
                                                                                        o.id === order.id
                                                                                            ? { ...o, buyerMessages: o.buyerMessages?.map((m, i) => i === 0 ? { ...m, isCustomRequest: true } : m) }
                                                                                            : o
                                                                                    ));
                                                                                    toast('Order marked as custom', { description: 'Custom pricing & specs now apply to this order' });
                                                                                } else {
                                                                                    setOrders(prev => prev.map(o =>
                                                                                        o.id === order.id
                                                                                            ? { ...o, buyerMessages: o.buyerMessages?.map(m => ({ ...m, isCustomRequest: false })) }
                                                                                            : o
                                                                                    ));
                                                                                    toast('Custom tag removed');
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Tag size={12} color={order.buyerMessages.some(m => m.isCustomRequest) ? '#e67e22' : 'rgba(26,26,26,0.25)'} strokeWidth={2} />
                                                                        </button>
                                                                        <input
                                                                            value={chatInput}
                                                                            onChange={(e) => setChatInput(e.target.value)}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter' && chatInput.trim()) {
                                                                                    toast.success('Message sent to ' + order.buyer.split(' ')[0]);
                                                                                    setChatInput('');
                                                                                }
                                                                            }}
                                                                            placeholder={`Reply to ${order.buyer.split(' ')[0]}...`}
                                                                            className="flex-1 bg-transparent border-none outline-none text-[12px] font-medium text-[#1A1A1A]/70 placeholder:text-[#1A1A1A]/20"
                                                                        />
                                                                        <button
                                                                            className="w-[26px] h-[26px] rounded-full flex items-center justify-center border-none cursor-pointer flex-shrink-0"
                                                                            style={{ background: chatInput.trim() ? '#0071e3' : 'rgba(0,0,0,0.04)' }}
                                                                            onClick={() => {
                                                                                if (chatInput.trim()) {
                                                                                    toast.success('Message sent to ' + order.buyer.split(' ')[0]);
                                                                                    setChatInput('');
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Send size={11} color={chatInput.trim() ? 'white' : 'rgba(26,26,26,0.2)'} strokeWidth={2.5} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                )}

                                                {order.message && (
                                                    <p className="mt-2 text-[12px] font-medium text-amber-800/60 leading-snug">
                                                        {order.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Production timeline — after approval */}
                                        {order.type === 'production' && (() => {
                                            const pStep = order.productionStep ?? 0;
                                            const hasExtraSample = !!order.extraSampleRequested;
                                            const steps = hasExtraSample ? [
                                                { label: 'Revised sample', short: 'Resample' },
                                                { label: 'Sample pickup', short: 'Sample' },
                                                { label: 'QC check', short: 'QC' },
                                                { label: 'Resume & finish', short: 'Done' },
                                            ] : [
                                                { label: 'Producing', short: 'Making' },
                                                { label: 'Sample pickup', short: 'Sample' },
                                                { label: 'QC check', short: 'QC' },
                                                { label: 'Finish & collect', short: 'Done' },
                                            ];
                                            return (
                                                <div className="mt-4">
                                                    {/* ── Frosted journey panel — layered glass depth ── */}
                                                    <div
                                                        className="rounded-[18px] overflow-hidden backdrop-blur-xl"
                                                        style={{
                                                            background: 'linear-gradient(145deg, rgba(255,255,255,0.45), rgba(250,252,255,0.35))',
                                                            border: '0.5px solid rgba(255,255,255,0.55)',
                                                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -0.5px 0 rgba(0,0,0,0.01), 0 2px 12px -2px rgba(0,0,0,0.03)',
                                                        }}
                                                    >
                                                        <div className="px-4 pt-3 pb-3">
                                                            {(() => {
                                                                const activeStep = steps[pStep] || steps[0];
                                                                const sIcons = [Package, Truck, Eye, Check];
                                                                const AIcon = sIcons[pStep] || Package;
                                                                const cS = 94; // logical SVG coordinate space — CSS handles visual scaling
                                                                const ccx = cS / 2;
                                                                const ccy = cS / 2;
                                                                const arcSpan = 76;
                                                                const gapSpan = 14;
                                                                const pal = hasExtraSample ? [
                                                                    { bar: '#f0a54a', bd: '#e89a3e', tx: '#d4872e', lt: '#fce8c8' },
                                                                    { bar: '#6bb8e8', bd: '#5aa8d8', tx: '#4090c4', lt: '#d0e8f6' },
                                                                    { bar: '#4fc9a8', bd: '#3db998', tx: '#2da68a', lt: '#c8eddf' },
                                                                    { bar: '#34c26a', bd: '#2bb85e', tx: '#22a352', lt: '#bfe8cc' },
                                                                ] : [
                                                                    { bar: '#8b9cf7', bd: '#7b8ce7', tx: '#6272d9', lt: '#dde1fc' },
                                                                    { bar: '#6bb8e8', bd: '#5aa8d8', tx: '#4090c4', lt: '#d0e8f6' },
                                                                    { bar: '#4fc9a8', bd: '#3db998', tx: '#2da68a', lt: '#c8eddf' },
                                                                    { bar: '#34c26a', bd: '#2bb85e', tx: '#22a352', lt: '#bfe8cc' },
                                                                ];
                                                                const eTimes = hasExtraSample ? ['Est. 3–4d', '45m', '1h 30m', 'Done'] : ['2h 15m', '45m', '1h 30m', 'Done'];
                                                                const lerpHex = (a: string, b: string, t: number) => {
                                                                    const pa = [parseInt(a.slice(1,3),16), parseInt(a.slice(3,5),16), parseInt(a.slice(5,7),16)];
                                                                    const pb = [parseInt(b.slice(1,3),16), parseInt(b.slice(3,5),16), parseInt(b.slice(5,7),16)];
                                                                    const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
                                                                    const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
                                                                    const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
                                                                    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`;
                                                                };
                                                                const ticksPerSeg = 8;
                                                                const innerR = 29;
                                                                const outerR = 39;
                                                                const ticks = steps.map((_, seg) => {
                                                                    const segStart = -90 + seg * (arcSpan + gapSpan);
                                                                    const st = seg < pStep ? 'done' : seg === pStep ? 'active' : 'pending';
                                                                    return Array.from({ length: ticksPerSeg }, (__, j) => {
                                                                        const angle = (segStart + j * (arcSpan / (ticksPerSeg - 1))) * Math.PI / 180;
                                                                        const progress = j / (ticksPerSeg - 1);
                                                                        const segPal = pal[seg];
                                                                        const solidColor = lerpHex(segPal.lt, segPal.bd, progress);
                                                                        return {
                                                                            x1: ccx + innerR * Math.cos(angle),
                                                                            y1: ccy + innerR * Math.sin(angle),
                                                                            x2: ccx + outerR * Math.cos(angle),
                                                                            y2: ccy + outerR * Math.sin(angle),
                                                                            seg, st, idx: j, solidColor,
                                                                        };
                                                                    });
                                                                }).flat();
                                                                return (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ duration: 0.6, ease: EASE }}
                                                                        className="flex flex-col gap-3"
                                                                    >
                                                                        {/* Row 1: Gauge + Info */}
                                                                        <div className="flex items-center gap-4">
                                                                            {/* Radial gauge */}
                                                                            <motion.div
                                                                                className="relative flex-shrink-0 w-[80px] h-[80px] sm:w-[94px] sm:h-[94px]"
                                                                                animate={{ filter: [
                                                                                    'drop-shadow(0 0 0px rgba(0,0,0,0))',
                                                                                    `drop-shadow(0 0 12px ${pal[pStep].bar}28)`,
                                                                                    'drop-shadow(0 0 0px rgba(0,0,0,0))',
                                                                                ] }}
                                                                                transition={{ filter: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
                                                                            >
                                                                                <svg viewBox={`0 0 ${cS} ${cS}`} className="w-full h-full">
                                                                                    {ticks.map((t, i) => (
                                                                                        <line key={`bg${i}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                                                                                            stroke="#e8e8e8" strokeWidth={2.5} strokeLinecap="round" />
                                                                                    ))}
                                                                                    {ticks.map((t, i) => {
                                                                                        if (t.st === 'pending') return null;
                                                                                        return (
                                                                                            <motion.line key={`fg${i}`}
                                                                                                x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                                                                                                stroke={t.solidColor} strokeWidth={2.5} strokeLinecap="round"
                                                                                                initial={{ pathLength: 0 }}
                                                                                                animate={{ pathLength: 1 }}
                                                                                                transition={{
                                                                                                    pathLength: { duration: 0.4, delay: i * 0.03, ease: [0.32, 0.72, 0, 1] },
                                                                                                }}
                                                                                            />
                                                                                        );
                                                                                    })}
                                                                                </svg>
                                                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                                    <AIcon size={18} strokeWidth={2} color={pal[pStep].tx} />
                                                                                    <span className="text-[7px] font-semibold leading-none mt-[3px]" style={{ color: pal[pStep].tx, opacity: 0.6 }}>
                                                                                        {activeStep.short || activeStep.label}
                                                                                    </span>
                                                                                </div>
                                                                            </motion.div>
                                                                            {/* Info column */}
                                                                            <div className="flex flex-col gap-[4px] min-w-0">
                                                                                <span className="text-[15px] font-bold leading-none" style={{ color: pal[pStep].tx }}>
                                                                                    {activeStep.label}
                                                                                </span>
                                                                                <span className="text-[11px] font-medium leading-snug" style={{ color: 'rgba(26,26,26,0.3)' }}>
                                                                                    {pStep === 0 && (hasExtraSample ? 'Preparing revised sample per buyer request' : 'We\'re crafting your order')}
                                                                                    {pStep === 1 && 'Courier collecting your sample'}
                                                                                    {pStep === 2 && 'Quality review in progress'}
                                                                                    {pStep === 3 && (hasExtraSample ? 'Approved — resuming full production' : 'Passed — ready for you')}
                                                                                </span>
                                                                                {hasExtraSample && pStep === 0 && order.extraSampleReadyDate && (
                                                                                    <span className="inline-flex items-center gap-[3px] text-[9px] font-semibold px-[6px] py-[2px] rounded-[5px] w-fit mt-[2px]"
                                                                                        style={{ background: 'rgba(230,126,34,0.08)', color: '#e67e22' }}>
                                                                                        <CalendarClock size={8} strokeWidth={2.5} />
                                                                                        Pickup {order.extraSampleReadyDate}
                                                                                    </span>
                                                                                )}
                                                                                <span className="inline-flex items-center gap-[3px] text-[10px] font-semibold px-[7px] py-[3px] rounded-[6px] w-fit mt-[2px]"
                                                                                    style={{ background: `${pal[pStep].bar}12`, color: pal[pStep].tx }}>
                                                                                    <Clock size={9} strokeWidth={2.5} />
                                                                                    {pStep < 3 ? `${eTimes[pStep]} elapsed` : 'Complete'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        {/* Row 2: Action buttons — right-aligned */}
                                                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                                                            {(() => {
                                                                                if (pStep === 1 || pStep === 2) {
                                                                                    return (
                                                                                        <span className="text-[11px] font-medium text-[#1A1A1A]/30 italic">
                                                                                            {pStep === 1 ? 'Waiting for sample pickup…' : 'Waiting for QC results…'}
                                                                                        </span>
                                                                                    );
                                                                                }
                                                                                return (
                                                                                    <>
                                                                                        {cancelConfirmId !== order.id && (
                                                                                            <button
                                                                                                onClick={() => { setCancelConfirmId(order.id); setCancelPassword(''); setCancelPasswordError(false); }}
                                                                                                className="border-none bg-transparent cursor-pointer py-1.5 px-2 rounded-full group/cancel leading-none transition-all duration-200 hover:bg-[#FF3B30]/[0.04]"
                                                                                            >
                                                                                                <span className="text-[11px] font-medium text-[#1A1A1A]/20 group-hover/cancel:text-[#FF3B30]/50 transition-colors duration-200">Cancel</span>
                                                                                            </button>
                                                                                        )}
                                                                                        <motion.button
                                                                                            whileHover={{ scale: 1.01 }}
                                                                                            whileTap={{ scale: 0.975 }}
                                                                                            onClick={(e) => { bounce(e.currentTarget); setAdjustId(adjustId === order.id ? null : order.id); }}
                                                                                            className="px-4 py-2 rounded-full cursor-pointer inline-flex items-center gap-1.5"
                                                                                            style={{
                                                                                                background: adjustId === order.id
                                                                                                    ? (adjustDays < 0 ? 'rgba(46,170,87,0.10)' : adjustDays > 0 ? 'rgba(230,126,34,0.10)' : 'transparent')
                                                                                                    : 'transparent',
                                                                                                border: adjustId === order.id
                                                                                                    ? (adjustDays < 0 ? '1px solid rgba(46,170,87,0.30)' : adjustDays > 0 ? '1px solid rgba(230,126,34,0.30)' : '1px solid rgba(0,0,0,0.10)')
                                                                                                    : '1px solid rgba(0,0,0,0.10)',
                                                                                                color: adjustId === order.id
                                                                                                    ? (adjustDays < 0 ? '#2eaa57' : adjustDays > 0 ? '#e67e22' : 'rgba(26,26,26,0.45)')
                                                                                                    : 'rgba(26,26,26,0.45)',
                                                                                                transition: 'all 0.3s ease',
                                                                                            }}
                                                                                        >
                                                                                            <Clock size={13} strokeWidth={2} />
                                                                                            <span className="text-[12px] font-semibold">Adjust</span>
                                                                                        </motion.button>
                                                                                        {pStep === 0 ? (
                                                                                            <motion.button
                                                                                                whileHover={{ scale: 1.01 }}
                                                                                                whileTap={{ scale: 0.975 }}
                                                                                                onClick={(e) => {
                                                                                                    bounce(e.currentTarget);
                                                                                                    if (pageRef.current) ripple(pageRef.current, 1);
                                                                                                    setOrders(prev => prev.map(o => o.id !== order.id ? o : { ...o, productionStep: 1, respondedAt: Date.now() }));
                                                                                                    toast.success(hasExtraSample ? 'Revised sample ready' : 'Sample marked as ready', { description: 'Our team will collect it from your location shortly' });
                                                                                                }}
                                                                                                className="px-5 py-2.5 rounded-full border-none cursor-pointer inline-flex items-center gap-2"
                                                                                                style={{ background: hasExtraSample ? 'linear-gradient(135deg, #f0a54a, #e89a3e)' : 'linear-gradient(135deg, #34c759, #2eaa57)', color: '#fff', boxShadow: hasExtraSample ? '0 2px 8px rgba(230,126,34,0.2), 0 8px 24px -8px rgba(230,126,34,0.3)' : '0 2px 8px rgba(46,170,87,0.2), 0 8px 24px -8px rgba(46,170,87,0.3)' }}
                                                                                            >
                                                                                                <Package size={14} strokeWidth={2.5} />
                                                                                                <span className="text-[13px] font-bold">{hasExtraSample ? 'Revised Sample Ready' : 'Sample Ready'}</span>
                                                                                            </motion.button>
                                                                                        ) : (
                                                                                            <motion.button
                                                                                                whileHover={{ scale: 1.01 }}
                                                                                                whileTap={{ scale: 0.975 }}
                                                                                                onClick={(e) => {
                                                                                                    bounce(e.currentTarget);
                                                                                                    if (pageRef.current) ripple(pageRef.current, 1);
                                                                                                    setOrders(prev => prev.map(o => o.id !== order.id ? o : { ...o, type: 'pickup' as ActionType, deadline: 'Tuesday, 10:00 AM', deadlineUrgent: false, timelineStep: 0, message: undefined, respondedAt: Date.now() }));
                                                                                                    toast.success('Production complete', { description: 'We\'ll collect the order from your location shortly' });
                                                                                                }}
                                                                                                className="px-5 py-2.5 rounded-full border-none cursor-pointer inline-flex items-center gap-2"
                                                                                                style={{ background: 'linear-gradient(135deg, #34d058, #2eaa57)', color: '#fff', boxShadow: '0 2px 8px rgba(46,170,87,0.2), 0 8px 24px -8px rgba(46,170,87,0.3)' }}
                                                                                            >
                                                                                                <Truck size={14} strokeWidth={2.5} />
                                                                                                <span className="text-[13px] font-bold">Pickup</span>
                                                                                            </motion.button>
                                                                                        )}
                                                                                    </>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                    </motion.div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Pickup timeline — simplified: no "Ordered" step */}
                                        {order.type === 'pickup' && (() => {
                                            const currentStep = order.timelineStep ?? 0;
                                            const steps = [
                                                { label: 'Preparing', short: 'Packing' },
                                                { label: 'Courier pickup', short: 'Pickup' },
                                                { label: 'In transit', short: 'Moving' },
                                                { label: 'Delivered', short: 'Done' },
                                            ];
                                            return (
                                                <div className="mt-4">
                                                    {/* ── Frosted journey panel ── */}
                                                    <div
                                                        className="rounded-[18px] overflow-hidden backdrop-blur-xl"
                                                        style={{
                                                            background: 'linear-gradient(145deg, rgba(255,255,255,0.45), rgba(250,252,255,0.35))',
                                                            border: '0.5px solid rgba(255,255,255,0.55)',
                                                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -0.5px 0 rgba(0,0,0,0.01), 0 2px 12px -2px rgba(0,0,0,0.03)',
                                                        }}
                                                    >
                                                        <div className="px-4 pt-3 pb-3">
                                                            {(() => {
                                                                const activeStep = steps[currentStep] || steps[0];
                                                                const sIcons = [Package, Truck, Truck, Check];
                                                                const AIcon = sIcons[currentStep] || Package;
                                                                const cS = 94;
                                                                const ccx = cS / 2;
                                                                const ccy = cS / 2;
                                                                const arcSpan = 76;
                                                                const gapSpan = 14;
                                                                const pal = [
                                                                    { bar: '#8b9cf7', bd: '#7b8ce7', tx: '#6272d9', lt: '#dde1fc' },
                                                                    { bar: '#6bb8e8', bd: '#5aa8d8', tx: '#4090c4', lt: '#d0e8f6' },
                                                                    { bar: '#4fc9a8', bd: '#3db998', tx: '#2da68a', lt: '#c8eddf' },
                                                                    { bar: '#34c26a', bd: '#2bb85e', tx: '#22a352', lt: '#bfe8cc' },
                                                                ];
                                                                const eTimes = ['1h 10m', '30m', '2h 05m', 'Done'];
                                                                const lerpHex = (a: string, b: string, t: number) => {
                                                                    const pa = [parseInt(a.slice(1,3),16), parseInt(a.slice(3,5),16), parseInt(a.slice(5,7),16)];
                                                                    const pb = [parseInt(b.slice(1,3),16), parseInt(b.slice(3,5),16), parseInt(b.slice(5,7),16)];
                                                                    const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
                                                                    const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
                                                                    const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
                                                                    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`;
                                                                };
                                                                const ticksPerSeg = 8;
                                                                const innerR = 29;
                                                                const outerR = 39;
                                                                const ticks = steps.map((_, seg) => {
                                                                    const segStart = -90 + seg * (arcSpan + gapSpan);
                                                                    const st = seg < currentStep ? 'done' : seg === currentStep ? 'active' : 'pending';
                                                                    return Array.from({ length: ticksPerSeg }, (__, j) => {
                                                                        const angle = (segStart + j * (arcSpan / (ticksPerSeg - 1))) * Math.PI / 180;
                                                                        const progress = j / (ticksPerSeg - 1);
                                                                        const segPal = pal[seg];
                                                                        const solidColor = lerpHex(segPal.lt, segPal.bd, progress);
                                                                        return {
                                                                            x1: ccx + innerR * Math.cos(angle),
                                                                            y1: ccy + innerR * Math.sin(angle),
                                                                            x2: ccx + outerR * Math.cos(angle),
                                                                            y2: ccy + outerR * Math.sin(angle),
                                                                            seg, st, idx: j, solidColor,
                                                                        };
                                                                    });
                                                                }).flat();
                                                                return (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ duration: 0.6, ease: EASE }}
                                                                        className="flex flex-col gap-3"
                                                                    >
                                                                        {/* Row 1: Gauge + Info */}
                                                                        <div className="flex items-center gap-4">
                                                                            {/* Radial gauge */}
                                                                            <motion.div
                                                                                className="relative flex-shrink-0 w-[80px] h-[80px] sm:w-[94px] sm:h-[94px]"
                                                                                animate={{ filter: [
                                                                                    'drop-shadow(0 0 0px rgba(0,0,0,0))',
                                                                                    `drop-shadow(0 0 12px ${pal[currentStep].bar}28)`,
                                                                                    'drop-shadow(0 0 0px rgba(0,0,0,0))',
                                                                                ] }}
                                                                                transition={{ filter: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
                                                                            >
                                                                                <svg viewBox={`0 0 ${cS} ${cS}`} className="w-full h-full">
                                                                                    {ticks.map((t, i) => (
                                                                                        <line key={`bg${i}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                                                                                            stroke="#e8e8e8" strokeWidth={2.5} strokeLinecap="round" />
                                                                                    ))}
                                                                                    {ticks.map((t, i) => {
                                                                                        if (t.st === 'pending') return null;
                                                                                        return (
                                                                                            <motion.line key={`fg${i}`}
                                                                                                x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                                                                                                stroke={t.solidColor} strokeWidth={2.5} strokeLinecap="round"
                                                                                                initial={{ pathLength: 0 }}
                                                                                                animate={{ pathLength: 1 }}
                                                                                                transition={{
                                                                                                    pathLength: { duration: 0.4, delay: i * 0.03, ease: [0.32, 0.72, 0, 1] },
                                                                                                }}
                                                                                            />
                                                                                        );
                                                                                    })}
                                                                                </svg>
                                                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                                    <AIcon size={18} strokeWidth={2} color={pal[currentStep].tx} />
                                                                                    <span className="text-[7px] font-semibold leading-none mt-[3px]" style={{ color: pal[currentStep].tx, opacity: 0.6 }}>
                                                                                        {activeStep.short || activeStep.label}
                                                                                    </span>
                                                                                </div>
                                                                            </motion.div>
                                                                            {/* Info column */}
                                                                            <div className="flex flex-col gap-[4px] min-w-0">
                                                                                <span className="text-[15px] font-bold leading-none" style={{ color: pal[currentStep].tx }}>
                                                                                    {activeStep.label}
                                                                                </span>
                                                                                <span className="text-[11px] font-medium leading-snug" style={{ color: 'rgba(26,26,26,0.3)' }}>
                                                                                    {currentStep === 0 && 'Preparing your package'}
                                                                                    {currentStep === 1 && 'Courier on the way'}
                                                                                    {currentStep === 2 && 'Moving to destination'}
                                                                                    {currentStep === 3 && 'Delivered safely'}
                                                                                </span>
                                                                                <span className="inline-flex items-center gap-[3px] text-[10px] font-semibold px-[7px] py-[3px] rounded-[6px] w-fit mt-[2px]"
                                                                                    style={{ background: `${pal[currentStep].bar}12`, color: pal[currentStep].tx }}>
                                                                                    <Clock size={9} strokeWidth={2.5} />
                                                                                    {currentStep < 3 ? `${eTimes[currentStep]} elapsed` : 'Complete'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        {/* Row 2: Action buttons — right-aligned */}
                                                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                                                            {cancelConfirmId !== order.id && (
                                                                                <button
                                                                                    onClick={() => { setCancelConfirmId(order.id); setCancelPassword(''); setCancelPasswordError(false); }}
                                                                                    className="border-none bg-transparent cursor-pointer py-1.5 px-2 rounded-full group/cancel leading-none transition-all duration-200 hover:bg-[#FF3B30]/[0.04]"
                                                                                >
                                                                                    <span className="text-[11px] font-medium text-[#1A1A1A]/20 group-hover/cancel:text-[#FF3B30]/50 transition-colors duration-200">Cancel</span>
                                                                                </button>
                                                                            )}
                                                                            <motion.button
                                                                                whileHover={{ scale: 1.01 }}
                                                                                whileTap={{ scale: 0.975 }}
                                                                                onClick={(e) => { bounce(e.currentTarget); setAdjustId(adjustId === order.id ? null : order.id); }}
                                                                                className="px-4 py-2 rounded-full cursor-pointer inline-flex items-center gap-1.5"
                                                                                style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.10)', color: 'rgba(26,26,26,0.45)' }}
                                                                            >
                                                                                <Clock size={13} strokeWidth={2} />
                                                                                <span className="text-[12px] font-semibold">Delay</span>
                                                                            </motion.button>
                                                                            <motion.button
                                                                                whileHover={{ scale: 1.01 }}
                                                                                whileTap={{ scale: 0.975 }}
                                                                                onClick={(e) => {
                                                                                    bounce(e.currentTarget);
                                                                                    if (pageRef.current) ripple(pageRef.current, 1);
                                                                                    handleConfirmPickup(order.id);
                                                                                }}
                                                                                className="px-5 py-2.5 rounded-full border-none cursor-pointer inline-flex items-center gap-2"
                                                                                style={{ background: 'linear-gradient(135deg, #3b82f6, #0071e3)', color: '#fff', boxShadow: '0 2px 8px rgba(0,113,227,0.2), 0 8px 24px -8px rgba(0,113,227,0.3)' }}
                                                                            >
                                                                                <Truck size={14} strokeWidth={2.5} />
                                                                                <span className="text-[13px] font-bold">Confirm Ready</span>
                                                                            </motion.button>
                                                                        </div>
                                                                    </motion.div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Request changes text area (for sample orders) */}
                                        <AnimatePresence>
                                            {requestChangesId === order.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.25, ease: EASE }}
                                                    className="mt-4 overflow-hidden"
                                                >
                                                    <div className="relative rounded-[14px] border border-black/[0.06] bg-white/80 overflow-hidden">
                                                        <div className="flex items-center gap-2 px-4 py-3">
                                                            <button
                                                                onClick={() => { setRequestChangesId(null); setChangeText(''); }}
                                                                className="flex-shrink-0 border-none bg-transparent cursor-pointer p-0"
                                                            >
                                                                <X size={14} color="rgba(26,26,26,0.3)" />
                                                            </button>
                                                            <input
                                                                value={changeText}
                                                                onChange={(e) => setChangeText(e.target.value)}
                                                                onKeyDown={(e) => { if (e.key === 'Enter') handleRequestChanges(order.id); }}
                                                                placeholder="Describe changes (e.g. 'Use matte finish')..."
                                                                className="flex-1 bg-transparent border-none outline-none text-[13px] font-medium text-[#1A1A1A]/70 placeholder:text-[#1A1A1A]/25"
                                                                autoFocus
                                                            />
                                                            <button className="flex-shrink-0 border-none bg-transparent cursor-pointer p-0">
                                                                <Paperclip size={14} color="rgba(26,26,26,0.25)" />
                                                            </button>
                                                            <button
                                                                className="flex-shrink-0 w-[28px] h-[28px] rounded-full flex items-center justify-center border-none cursor-pointer"
                                                                style={{ background: '#0071e3' }}
                                                                onClick={() => handleRequestChanges(order.id)}
                                                            >
                                                                <Send size={12} color="white" strokeWidth={2.5} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Not Ready — compact inline delay notice */}
                                        <AnimatePresence>
                                            {adjustId === order.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.25, ease: EASE }}
                                                    className="mt-4 overflow-hidden"
                                                >
                                                    <div className="pt-3 flex flex-col gap-2.5" style={{ borderTop: adjustDays < 0 ? '1px solid #2eaa571a' : '1px solid #e67e221a', transition: 'border-color 0.3s ease' }}>
                                                        {/* Line 1: Label left ··· fee | day [− N +] right */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Clock size={14} color={adjustDays < 0 ? '#2eaa57' : '#e67e22'} strokeWidth={2} style={{ transition: 'color 0.3s ease' }} />
                                                                <span className="text-[12px] font-semibold text-[#1A1A1A]/70">
                                                                    {adjustDays < 0 ? 'Finishing early?' : adjustDays === 0 ? 'Adjust timeline' : 'Need more time?'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-baseline gap-1">
                                                                    {(() => {
                                                                        const MAX_FEE_PCT = 9;
                                                                        const rawBonus = Math.round(totalValue * DAILY_RATE_PCT / 100) * Math.abs(adjustDays);
                                                                        const maxBonus = Math.round(totalValue * 1.5 / 100);
                                                                        const cappedBonus = Math.min(rawBonus, maxBonus);
                                                                        const isBonusCapped = rawBonus >= maxBonus;
                                                                        const rawFee = Math.round(totalValue * DAILY_RATE_PCT / 100) * adjustDays;
                                                                        const maxFee = Math.round(totalValue * MAX_FEE_PCT / 100);
                                                                        const cappedFee = Math.min(rawFee, maxFee);
                                                                        const isFeeCapped = rawFee >= maxFee;
                                                                        return (<>
                                                                            <span className="text-[14px] font-bold leading-none tabular-nums" style={{ color: adjustDays < 0 ? '#2eaa57' : adjustDays === 0 ? 'rgba(26,26,26,0.25)' : '#e67e22', transition: 'color 0.3s ease' }}>
                                                                                {adjustDays === 0 ? '—' : fmt(adjustDays < 0 ? cappedBonus : cappedFee)}
                                                                            </span>
                                                                            <span className="text-[9px] font-semibold leading-none" style={{ color: adjustDays < 0 ? 'rgba(46,170,87,0.5)' : adjustDays === 0 ? 'rgba(26,26,26,0.15)' : 'rgba(230,126,34,0.5)', transition: 'color 0.3s ease' }}>
                                                                                {adjustDays < 0 ? (isBonusCapped ? 'max bonus' : 'bonus') : adjustDays === 0 ? '' : (isFeeCapped ? 'max fee' : 'fee')}
                                                                            </span>
                                                                        </>);
                                                                    })()}
                                                                </div>
                                                                <div className="w-[1px] h-[16px] bg-black/8" />
                                                                <span className="text-[11px] font-medium text-[#1A1A1A]/35">day{Math.abs(adjustDays) !== 1 ? 's' : ''}</span>
                                                                <div className="flex items-center gap-0.5">
                                                                    <motion.button
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={() => setAdjustDays(prev => Math.max(-30, prev - 1))}
                                                                        className="w-[26px] h-[26px] rounded-full flex items-center justify-center cursor-pointer border-none"
                                                                        style={{ background: adjustDays <= -30 ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.06)', color: adjustDays <= -30 ? 'rgba(26,26,26,0.15)' : 'rgba(26,26,26,0.6)' }}
                                                                    >
                                                                        <span className="text-[14px] font-bold leading-none">−</span>
                                                                    </motion.button>
                                                                    <div className="w-[36px] text-center">
                                                                        <span className="text-[18px] font-black leading-none tabular-nums" style={{ color: adjustDays < 0 ? '#2eaa57' : adjustDays === 0 ? 'rgba(26,26,26,0.25)' : 'rgba(26,26,26,0.9)', transition: 'color 0.3s ease' }}>{adjustDays}</span>
                                                                    </div>
                                                                    <motion.button
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={() => setAdjustDays(prev => prev + 1)}
                                                                        className="w-[26px] h-[26px] rounded-full flex items-center justify-center cursor-pointer border-none"
                                                                        style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(26,26,26,0.6)' }}
                                                                    >
                                                                        <span className="text-[14px] font-bold leading-none">+</span>
                                                                    </motion.button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Line 2: warning + rate note + deadline + Cancel + Confirm */}
                                                        <div className="flex items-center justify-end gap-2.5">
                                                            {adjustDays >= 7 && (
                                                                <div className="flex items-center gap-1.5 mr-auto">
                                                                    <ShieldAlert size={10} strokeWidth={2.2} style={{ color: adjustDays >= 21 ? '#dc3545b0' : adjustDays >= 14 ? '#e67e22a0' : '#e67e2280', flexShrink: 0, transition: 'color 0.3s ease' }} />
                                                                    <span className="text-[9.5px] font-medium" style={{ color: adjustDays >= 21 ? '#dc3545a0' : adjustDays >= 14 ? '#e67e2290' : '#e67e2270', transition: 'color 0.3s ease' }}>
                                                                        {adjustDays >= 21 ? 'May reduce visibility or restrict account' : adjustDays >= 14 ? 'Repeated extensions may reduce visibility' : 'May affect seller score'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <span className="text-[11px] font-medium text-[#1A1A1A]/35">
                                                                {adjustDays < 0 ? `${DAILY_RATE_PCT}%/day · 1.5% max` : adjustDays === 0 ? 'On schedule' : `${DAILY_RATE_PCT}%/day · 9% max`}
                                                            </span>
                                                            <span className="text-[10px] font-medium text-[#1A1A1A]/35">
                                                                {adjustDays === 0 ? 'Original deadline' : (adjustDays < 0 ? 'Early delivery: ' : 'New deadline: ')}
                                                                {adjustDays !== 0 && (
                                                                    <span className="font-semibold" style={{ color: adjustDays < 0 ? 'rgba(46,170,87,0.7)' : 'rgba(26,26,26,0.55)' }}>
                                                                        {(() => {
                                                                            const d = new Date();
                                                                            d.setDate(d.getDate() + adjustDays);
                                                                            return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                                                        })()}
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <motion.button
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => { setAdjustId(null); setAdjustDays(0); }}
                                                                className="px-3 py-1.5 rounded-full cursor-pointer text-[11px] font-semibold"
                                                                style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.06)', color: 'rgba(26,26,26,0.4)' }}
                                                            >
                                                                Cancel
                                                            </motion.button>
                                                            <motion.button
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={(e) => {
                                                                    if (adjustDays === 0) return;
                                                                    bounce(e.currentTarget);
                                                                    handleAdjustTimeline(order.id, adjustDays);
                                                                }}
                                                                className="px-3.5 py-1.5 rounded-full border-none cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold"
                                                                style={{ background: adjustDays < 0 ? '#2eaa57' : adjustDays === 0 ? 'rgba(26,26,26,0.12)' : '#e67e22', color: '#fff', opacity: adjustDays === 0 ? 0.5 : 1, cursor: adjustDays === 0 ? 'default' : 'pointer', transition: 'background 0.3s ease, opacity 0.3s ease' }}
                                                            >
                                                                <Clock size={11} strokeWidth={2.5} />
                                                                {adjustDays < 0 ? `Early ${Math.abs(adjustDays)}d` : adjustDays === 0 ? 'No change' : `Extend ${adjustDays}d`}
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Action buttons — only for approval & sample types (production/pickup buttons are inside their panels) */}
                                        {(order.type === 'approval' || order.type === 'sample') && (
                                        <div className="flex items-center mt-4 justify-between gap-2.5">
                                            {order.type !== 'approval' ? (
                                                <div className="flex-shrink-0">
                                                    {cancelConfirmId !== order.id ? (
                                                        <button
                                                            onClick={() => { setCancelConfirmId(order.id); setCancelPassword(''); setCancelPasswordError(false); }}
                                                            className="border-none bg-transparent cursor-pointer py-1 px-2 rounded-full group/cancel leading-none transition-all duration-200 hover:bg-[#FF3B30]/[0.04]"
                                                        >
                                                            <span className="text-[9px] font-medium text-[#1A1A1A]/10 group-hover/cancel:text-[#FF3B30]/50 transition-colors duration-200">Cancel order</span>
                                                        </button>
                                                    ) : <div />}
                                                </div>
                                            ) : null}
                                            {order.type === 'approval' ? (
                                                (() => {
                                                    const hasNewPrice = order.negotiatedUnitPrice != null && order.negotiatedUnitPrice !== order.unitPrice;
                                                    const offerSent = order.priceOfferSent;
                                                    const priceAgreed = order.priceAccepted;
                                                    const finalPrice = hasNewPrice ? order.negotiatedUnitPrice! : order.unitPrice;
                                                    const finalTotal = order.qty * finalPrice;
                                                    
                                                    return (
                                                        <>
                                                            <div className="flex items-center gap-4">
                                                                <div className="hidden sm:flex flex-col items-center gap-1.5">
                                                                    {(() => {
                                                                        const pct = order.capacityPct || 25;
                                                                        const color = pct > 80 ? '#e05252' : pct > 50 ? '#f5a623' : '#2eaa57';
                                                                        const totalBars = 12;
                                                                        const filledBars = Math.round((pct / 100) * totalBars);
                                                                        const barH = 14;
                                                                        const barW = 3;
                                                                        const gap = 2;
                                                                        const totalW = totalBars * barW + (totalBars - 1) * gap;
                                                                        return (
                                                                            <>
                                                                                <div className="flex flex-col items-center gap-1">
                                                                                    {(() => {
                                                                                        const prevPct = (order as any).prevCapacityPct ?? Math.max(0, pct - 8 - (order.id.charCodeAt(0) % 5));
                                                                                        const prevBars = Math.round((prevPct / 100) * totalBars);
                                                                                        const oldColor = pct > 80 ? '#f5b8b8' : pct > 50 ? '#fde8b0' : '#b8e6c8';
                                                                                        return (
                                                                                            <>
                                                                                                <svg width={totalW} height={barH} className="block">
                                                                                                    <defs>
                                                                                                        <pattern id={`capLines-${order.id}`} width="4" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                                                                                            <line x1="0" y1="0" x2="0" y2="3" stroke="#d2d2d2" strokeWidth="0.7" />
                                                                                                        </pattern>
                                                                                                    </defs>
                                                                                                    {Array.from({ length: totalBars }).map((_, i) => {
                                                                                                        const h = barH * (0.4 + 0.6 * ((i + 1) / totalBars));
                                                                                                        const bx = i * (barW + gap);
                                                                                                        const by = barH - h;
                                                                                                        if (i < prevBars) {
                                                                                                            return <rect key={i} x={bx} y={by} width={barW} height={h} rx={1.2} fill={oldColor} style={{ transition: 'fill 0.3s ease' }} />;
                                                                                                        } else if (i < filledBars) {
                                                                                                            return <rect key={i} x={bx} y={by} width={barW} height={h} rx={1.2} fill={color} style={{ transition: 'fill 0.3s ease' }} />;
                                                                                                        }
                                                                                                        return (
                                                                                                            <g key={i}>
                                                                                                                <rect x={bx} y={by} width={barW} height={h} rx={1.2} fill="#ececec" />
                                                                                                                <rect x={bx} y={by} width={barW} height={h} rx={1.2} fill={`url(#capLines-${order.id})`} />
                                                                                                            </g>
                                                                                                        );
                                                                                                    })}
                                                                                                </svg>
                                                                                                <div className="flex items-center gap-1.5">
                                                                                                    <span className="text-[11px] font-bold tabular-nums leading-none" style={{ color }}>
                                                                                                        {pct}%
                                                                                                    </span>
                                                                                                    <span className="text-[8px] font-semibold text-[#1A1A1A]/30 leading-none">
                                                                                                        +{pct - prevPct}% new
                                                                                                    </span>
                                                                                                </div>
                                                                                            </>
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                                <span className="text-[8px] font-semibold text-[#1A1A1A]/35 tracking-wide uppercase leading-none">Capacity</span>
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </div>
                                                                <div className="hidden sm:block w-[1px] h-[20px] bg-black/10" />
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-bold text-[#1A1A1A]/40 tracking-wider uppercase mb-1">Ready by</span>
                                                                    <span className="text-[12px] font-bold text-[#1A1A1A]/80 leading-none">{order.availableBy || 'TBD'}</span>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-2">
                                                                <AnimatePresence mode="wait">
                                                                    {declineConfirmId === order.id ? (
                                                                        <motion.button
                                                                            key="confirm"
                                                                            initial={{ width: 40, opacity: 0.8 }}
                                                                            animate={{ width: 'auto', opacity: 1 }}
                                                                            exit={{ width: 40, opacity: 0.8 }}
                                                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                            whileTap={{ scale: 0.975 }}
                                                                            onClick={(e) => {
                                                                                bounce(e.currentTarget);
                                                                                setDeclineConfirmId(null);
                                                                                setOrders(prev => prev.filter(o => o.id !== order.id));
                                                                                toast('Order declined', { description: 'Buyer will be notified.' });
                                                                            }}
                                                                            onBlur={() => setDeclineConfirmId(null)}
                                                                            className="py-2.5 px-4 flex items-center justify-center gap-2 rounded-full cursor-pointer backdrop-blur-sm"
                                                                            style={{
                                                                                background: 'rgba(220,38,38,0.08)',
                                                                                border: '1px solid rgba(220,38,38,0.15)',
                                                                                boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.4)',
                                                                            }}
                                                                        >
                                                                            <X size={13} strokeWidth={2.5} style={{ color: 'rgba(220,38,38,0.7)' }} />
                                                                            <span className="text-[12px] font-semibold whitespace-nowrap" style={{ color: 'rgba(220,38,38,0.7)' }}>
                                                                                Decline?
                                                                            </span>
                                                                        </motion.button>
                                                                    ) : (
                                                                        <motion.button
                                                                            key="initial"
                                                                            whileHover={{ scale: 1.01 }}
                                                                            whileTap={{ scale: 0.975 }}
                                                                            onClick={(e) => {
                                                                                bounce(e.currentTarget);
                                                                                setDeclineConfirmId(order.id);
                                                                            }}
                                                                            className="w-[40px] h-[40px] flex items-center justify-center rounded-full cursor-pointer bg-white/80 backdrop-blur-sm"
                                                                            style={{ color: '#1A1A1A', border: '1px solid rgba(0,0,0,0.06)', boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.6)' }}
                                                                        >
                                                                            <X size={14} style={{ color: 'rgba(26,26,26,0.5)' }} />
                                                                        </motion.button>
                                                                    )}
                                                                </AnimatePresence>

                                                                {hasNewPrice && !offerSent && (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.01 }}
                                                                        whileTap={{ scale: 0.975 }}
                                                                        onClick={(e) => {
                                                                            bounce(e.currentTarget);
                                                                            if (pageRef.current) ripple(pageRef.current, 1);
                                                                            setOrders(prev => prev.map(o =>
                                                                                o.id === order.id ? { ...o, priceOfferSent: true, respondedAt: Date.now() } : o
                                                                            ));
                                                                            toast.success('Price offer sent', {
                                                                                description: `${fmt(finalPrice)}/unit (${fmt(finalTotal)} total) — awaiting buyer`,
                                                                            });
                                                                            setTimeout(() => {
                                                                                setOrders(prev => prev.map(o =>
                                                                                    o.id === order.id ? { ...o, priceAccepted: true } : o
                                                                                ));
                                                                                toast.success(`${order.buyer.split(' ')[0]} accepted your price`, {
                                                                                    description: `${fmt(finalPrice)}/unit agreed — you can now start production`,
                                                                                });
                                                                            }, 4000);
                                                                        }}
                                                                        className="px-5 sm:px-6 py-2.5 rounded-full border-none cursor-pointer inline-flex items-center justify-center gap-2"
                                                                        style={{ background: 'linear-gradient(135deg, #3b82f6, #0071e3)', color: '#fff', boxShadow: '0 2px 8px rgba(0,113,227,0.2), 0 8px 24px -8px rgba(0,113,227,0.3)' }}
                                                                    >
                                                                        <DollarSign size={14} strokeWidth={2.5} />
                                                                        <span className="text-[13px] font-bold whitespace-nowrap">Send Offer · {fmt(finalPrice)}/unit</span>
                                                                    </motion.button>
                                                                )}

                                                                {hasNewPrice && offerSent && !priceAgreed && (
                                                                    <div className="px-4 sm:px-5 py-2 rounded-full inline-flex items-center justify-center gap-2"
                                                                        style={{ background: 'rgba(230,126,34,0.08)', border: '1px solid #e67e2226' }}
                                                                    >
                                                                        <div className="w-[5px] h-[5px] rounded-full bg-[#e67e22] animate-pulse" />
                                                                        <span className="text-[12px] font-semibold text-[#e67e22]/80 whitespace-nowrap">Awaiting buyer · {fmt(finalPrice)}/unit</span>
                                                                    </div>
                                                                )}

                                                                {(!hasNewPrice || priceAgreed) && (() => {
                                                                    const isBigOrder = finalTotal >= BIG_ORDER_THRESHOLD;
                                                                    const depositAmt = Math.round(finalTotal * SECURITY_DEPOSIT_PCT / 100);
                                                                    const showingDeposit = depositConfirmId === order.id;

                                                                    if (isBigOrder && !showingDeposit) {
                                                                        return (
                                                                            <motion.button
                                                                                whileHover={{ scale: 1.01 }}
                                                                                whileTap={{ scale: 0.975 }}
                                                                                onClick={(e) => {
                                                                                    bounce(e.currentTarget);
                                                                                    setDepositConfirmId(order.id);
                                                                                }}
                                                                                className="px-5 sm:px-6 py-2.5 rounded-full border-none cursor-pointer inline-flex items-center justify-center gap-2"
                                                                                style={{ background: 'linear-gradient(135deg, #34d058, #2eaa57)', color: '#fff', boxShadow: '0 2px 8px rgba(46,170,87,0.2), 0 8px 24px -8px rgba(46,170,87,0.3)' }}
                                                                            >
                                                                                <Shield size={13} strokeWidth={2.5} />
                                                                                <span className="text-[13px] font-bold whitespace-nowrap">
                                                                                    Accept · {order.qty} pcs · {fmt(finalPrice)}/ea
                                                                                </span>
                                                                            </motion.button>
                                                                        );
                                                                    }

                                                                    if (!isBigOrder) {
                                                                        return (
                                                                            <motion.button
                                                                                whileHover={{ scale: 1.01 }}
                                                                                whileTap={{ scale: 0.975 }}
                                                                                onClick={(e) => {
                                                                                    bounce(e.currentTarget);
                                                                                    if (pageRef.current) ripple(pageRef.current, 1);
                                                                                    handleApproveAndProduce(order.id);
                                                                                }}
                                                                                className="px-5 sm:px-6 py-2.5 rounded-full border-none cursor-pointer inline-flex items-center justify-center gap-2"
                                                                                style={{ background: 'linear-gradient(135deg, #34d058, #2eaa57)', color: '#fff', boxShadow: '0 2px 8px rgba(46,170,87,0.2), 0 8px 24px -8px rgba(46,170,87,0.3)' }}
                                                                            >
                                                                                <Check size={14} strokeWidth={2.5} />
                                                                                <span className="text-[13px] font-bold whitespace-nowrap">
                                                                                    Accept · {order.qty} pcs · {fmt(finalPrice)}/ea
                                                                                </span>
                                                                            </motion.button>
                                                                        );
                                                                    }

                                                                    return null;
                                                                })()}
                                                            </div>
                                                        </>
                                                    );
                                                })()
                                            ) : (
                                                /* ── SAMPLE — platform collects sample from seller ── */
                                                <>
                                                    <motion.button
                                                        whileHover={{ scale: 1.01 }}
                                                        whileTap={{ scale: 0.975 }}
                                                        onClick={(e) => {
                                                            bounce(e.currentTarget);
                                                            setAdjustId(adjustId === order.id ? null : order.id);
                                                        }}
                                                        className="px-3.5 py-2 rounded-full cursor-pointer inline-flex items-center gap-1.5"
                                                        style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.08)', color: 'rgba(26,26,26,0.45)' }}
                                                    >
                                                        <Clock size={13} strokeWidth={2} />
                                                        <span className="text-[12px] font-semibold">Need More Time</span>
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.01 }}
                                                        whileTap={{ scale: 0.975 }}
                                                        onClick={(e) => {
                                                            bounce(e.currentTarget);
                                                            if (pageRef.current) ripple(pageRef.current, 1);
                                                            handleApproveSample(order.id);
                                                        }}
                                                        className="px-5 py-2.5 rounded-full border-none cursor-pointer inline-flex items-center gap-2"
                                                        style={{
                                                            background: 'linear-gradient(135deg, #3b82f6, #0071e3)',
                                                            color: '#fff',
                                                            boxShadow: '0 2px 8px rgba(0,113,227,0.2), 0 8px 24px -8px rgba(0,113,227,0.3)',
                                                        }}
                                                    >
                                                        <Package size={14} strokeWidth={2.5} />
                                                        <span className="text-[13px] font-bold">Sample Ready — Collect</span>
                                                    </motion.button>
                                                </>
                                            )}
                                        </div>
                                        )}

                                        {/* ── Security deposit panel for large orders ── */}
                                        <AnimatePresence>
                                            {depositConfirmId === order.id && order.type === 'approval' && (() => {
                                                const hasNeg = order.negotiatedUnitPrice != null && order.negotiatedUnitPrice !== order.unitPrice;
                                                const aPrice = hasNeg ? order.negotiatedUnitPrice! : order.unitPrice;
                                                const aTotal = order.qty * aPrice;
                                                const depAmt = Math.round(aTotal * SECURITY_DEPOSIT_PCT / 100);
                                                const depFrac = SECURITY_DEPOSIT_PCT / 100;

                                                return (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0, scale: 0.98 }}
                                                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                                        exit={{ opacity: 0, height: 0, scale: 0.98 }}
                                                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                                                        className="overflow-hidden mt-5"
                                                    >
                                                        <div
                                                            className="rounded-[20px] overflow-hidden backdrop-blur-2xl"
                                                            style={{
                                                                background: 'linear-gradient(145deg, rgba(240,247,255,0.65), rgba(248,250,255,0.5))',
                                                                border: '0.5px solid rgba(0,113,227,0.12)',
                                                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 24px -4px rgba(0,113,227,0.08), 0 1px 3px rgba(0,0,0,0.02)',
                                                            }}
                                                        >
                                                            <div className="px-4 py-3.5 sm:px-5 sm:py-4">
                                                                {/* Header row: icon + title + amount */}
                                                                <div className="flex items-center gap-2.5 mb-3">
                                                                    <motion.div
                                                                        className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center flex-shrink-0"
                                                                        style={{
                                                                            background: 'linear-gradient(135deg, rgba(0,113,227,0.08), rgba(0,113,227,0.04))',
                                                                            border: '0.5px solid rgba(0,113,227,0.10)',
                                                                        }}
                                                                        animate={{
                                                                            boxShadow: [
                                                                                '0 0 0px rgba(0,113,227,0)',
                                                                                '0 0 12px rgba(0,113,227,0.08)',
                                                                                '0 0 0px rgba(0,113,227,0)',
                                                                            ],
                                                                        }}
                                                                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                                                    >
                                                                        <Shield size={13} strokeWidth={2} color="#0071e3" style={{ opacity: 0.7 }} />
                                                                    </motion.div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-[12px] font-bold text-[#1A1A1A]/75 leading-tight">
                                                                            Security deposit · <span className="text-[#0071e3] tabular-nums">{fmt(depAmt)}</span>
                                                                        </p>
                                                                        <p className="text-[10px] font-medium text-[#1A1A1A]/30 leading-tight mt-0.5">
                                                                            {SECURITY_DEPOSIT_PCT}% of {fmt(aTotal)} · 100% refunded on delivery
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Compact proportion bar */}
                                                                <div className="w-full h-[4px] rounded-full overflow-hidden mb-3" style={{ background: 'rgba(0,0,0,0.04)' }}>
                                                                    <motion.div
                                                                        className="h-full rounded-full"
                                                                        style={{
                                                                            background: 'linear-gradient(90deg, #0071e3, #3b82f6)',
                                                                            boxShadow: '0 0 6px rgba(0,113,227,0.25)',
                                                                        }}
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${Math.max(depFrac * 100, 4)}%` }}
                                                                        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1], delay: 0.15 }}
                                                                    />
                                                                </div>

                                                                {/* Compact trust signals — single row */}
                                                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                                                    <span className="flex items-center gap-1 text-[10px] font-medium text-[#2eaa57]/60">
                                                                        <Check size={9} strokeWidth={3} /> Fully refundable
                                                                    </span>
                                                                    <span className="flex items-center gap-1 text-[10px] font-medium text-[#1A1A1A]/30">
                                                                        <Shield size={8} strokeWidth={2.5} /> Mutual commitment
                                                                    </span>
                                                                    <span className="flex items-center gap-1 text-[10px] font-medium text-[#1A1A1A]/30">
                                                                        <AlertTriangle size={8} strokeWidth={2.5} /> Forfeit only on cancel
                                                                    </span>
                                                                </div>

                                                                {/* Action row */}
                                                                <div className="flex items-center justify-end gap-2.5">
                                                                    <span className="text-[9px] font-medium text-[#1A1A1A]/20 mr-auto">
                                                                        Orders above {fmt(BIG_ORDER_THRESHOLD)}
                                                                    </span>
                                                                    <motion.button
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={() => setDepositConfirmId(null)}
                                                                        className="px-4 py-2 rounded-full cursor-pointer text-[12px] font-semibold"
                                                                        style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.06)', color: 'rgba(26,26,26,0.4)' }}
                                                                    >
                                                                        Not now
                                                                    </motion.button>
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.01 }}
                                                                        whileTap={{ scale: 0.97 }}
                                                                        onClick={(e) => {
                                                                            bounce(e.currentTarget);
                                                                            if (pageRef.current) ripple(pageRef.current, 2);
                                                                            setDepositConfirmId(null);
                                                                            handleApproveAndProduce(order.id);
                                                                            toast.success('Deposit paid — order accepted', {
                                                                                description: `${fmt(depAmt)} held securely · refunded on delivery`,
                                                                            });
                                                                        }}
                                                                        className="px-5 py-2.5 rounded-full border-none cursor-pointer inline-flex items-center gap-2"
                                                                        style={{
                                                                            background: 'linear-gradient(135deg, #34d058, #2eaa57)',
                                                                            color: '#fff',
                                                                            boxShadow: '0 2px 10px rgba(46,170,87,0.25), 0 8px 28px -8px rgba(46,170,87,0.35)',
                                                                        }}
                                                                    >
                                                                        <Shield size={13} strokeWidth={2.5} />
                                                                        <span className="text-[13px] font-bold whitespace-nowrap">
                                                                            Deposit & Accept
                                                                        </span>
                                                                        <ChevronRight size={14} strokeWidth={2.5} style={{ marginLeft: -2 }} />
                                                                    </motion.button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })()}
                                        </AnimatePresence>

                                        {/* ── Cancel order — password verification zone ── */}
                                        <AnimatePresence>
                                            {cancelConfirmId === order.id && order.type !== 'approval' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.25, ease: EASE }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mt-3 pt-3 border-t border-[#FF3B30]/8">
                                                        <div className="flex flex-col gap-1.5 mb-3 px-3 py-2.5 rounded-[12px] bg-[#FF3B30]/[0.04] border border-[#FF3B30]/10">
                                                            <div className="flex items-center gap-2">
                                                                <ShieldAlert size={15} color="#FF3B30" strokeWidth={2.2} />
                                                                <span className="text-[13px] font-bold text-[#FF3B30]/80">
                                                                    Cancel this order?
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] font-medium text-[#1A1A1A]/45 leading-snug ml-[23px]">
                                                                This action is <span className="font-bold text-[#1A1A1A]/60">permanent</span> and cannot be undone. A <span className="font-bold text-[#FF3B30]/70">{CANCEL_PENALTY_PCT}%</span> cancellation fee of <span className="font-bold text-[#FF3B30]/70">{fmt(Math.round(order.qty * order.unitPrice * CANCEL_PENALTY_PCT / 100))}</span> will be deducted from your payout.
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-[10px] transition-colors ${cancelPasswordError ? 'bg-[#FF3B30]/5 border border-[#FF3B30]/20' : 'bg-[#1A1A1A]/[0.02] border border-black/[0.06]'}`}>
                                                                <ShieldAlert size={12} color={cancelPasswordError ? '#FF3B30' : 'rgba(26,26,26,0.2)'} strokeWidth={2} />
                                                                <input
                                                                    type="password"
                                                                    value={cancelPassword}
                                                                    onChange={(e) => { setCancelPassword(e.target.value); setCancelPasswordError(false); }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' && cancelPassword) {
                                                                            if (cancelPassword.length >= 4) {
                                                                                handleCancelOrder(order.id);
                                                                            } else {
                                                                                setCancelPasswordError(true);
                                                                            }
                                                                        }
                                                                        if (e.key === 'Escape') { setCancelConfirmId(null); setCancelPassword(''); setCancelPasswordError(false); }
                                                                    }}
                                                                    placeholder="Enter your password to cancel"
                                                                    className="flex-1 bg-transparent border-none outline-none text-[12px] font-medium text-[#1A1A1A]/70 placeholder:text-[#1A1A1A]/20"
                                                                    autoFocus
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => { setCancelConfirmId(null); setCancelPassword(''); setCancelPasswordError(false); }}
                                                                className="px-3 py-2 rounded-full cursor-pointer text-[11px] font-semibold border-none bg-transparent text-[#1A1A1A]/30 hover:text-[#1A1A1A]/50 transition-colors"
                                                            >
                                                                Dismiss
                                                            </button>
                                                            <motion.button
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={(e) => {
                                                                    if (cancelPassword.length >= 4) {
                                                                        bounce(e.currentTarget);
                                                                        handleCancelOrder(order.id);
                                                                    } else {
                                                                        setCancelPasswordError(true);
                                                                    }
                                                                }}
                                                                className="px-3.5 py-2 rounded-full border-none cursor-pointer text-[11px] font-bold whitespace-nowrap"
                                                                style={{
                                                                    background: cancelPassword.length >= 4 ? '#FF3B30' : 'rgba(255,59,48,0.08)',
                                                                    color: cancelPassword.length >= 4 ? '#fff' : 'rgba(255,59,48,0.4)',
                                                                    transition: 'all 0.2s ease',
                                                                }}
                                                            >
                                                                Cancel · {fmt(Math.round(order.qty * order.unitPrice * CANCEL_PENALTY_PCT / 100))}
                                                            </motion.button>
                                                        </div>
                                                        {cancelPasswordError && (
                                                            <p className="text-[10px] font-medium text-[#FF3B30]/60 mt-1.5 ml-1">
                                                                Please enter a valid password to confirm
                                                            </p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                                {/* iOS 26–style stacked peek: thin strips behind last visible new order */}
                                {isLastVisibleNewOrder && (
                                    <motion.div
                                        className="relative cursor-pointer"
                                        onClick={() => setNewOrdersExpanded(true)}
                                        style={{ zIndex: 0, marginTop: '-4px' }}
                                        whileTap={{ scale: 0.985 }}
                                    >
                                        {/* Card edge 1 */}
                                        <div
                                            className="mx-auto rounded-b-[22px] backdrop-blur-sm"
                                            style={{
                                                width: 'calc(100% - 20px)',
                                                height: '12px',
                                                background: 'linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.55))',
                                                borderLeft: '0.5px solid rgba(255,255,255,0.3)',
                                                borderRight: '0.5px solid rgba(255,255,255,0.3)',
                                                borderBottom: '0.5px solid rgba(255,255,255,0.3)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.035), inset 0 0.5px 0 rgba(255,255,255,0.4)',
                                            }}
                                        />
                                        {/* Card edge 2 */}
                                        {hiddenCount > 0 && (
                                            <div
                                                className="mx-auto rounded-b-[20px]"
                                                style={{
                                                    width: 'calc(100% - 40px)',
                                                    height: '8px',
                                                    marginTop: '-1px',
                                                    background: 'linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.35))',
                                                    borderLeft: '0.5px solid rgba(255,255,255,0.18)',
                                                    borderRight: '0.5px solid rgba(255,255,255,0.18)',
                                                    borderBottom: '0.5px solid rgba(255,255,255,0.18)',
                                                    boxShadow: '0 3px 8px rgba(0,0,0,0.02)',
                                                }}
                                            />
                                        )}
                                        {/* Tap label */}
                                        <div className="flex justify-center mt-3">
                                            <motion.button
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.96 }}
                                                className="inline-flex items-center gap-1.5 px-4 py-[6px] rounded-full cursor-pointer border-none transition-all duration-200"
                                                style={{
                                                    background: 'rgba(255,255,255,0.6)',
                                                    backdropFilter: 'blur(16px)',
                                                    WebkitBackdropFilter: 'blur(16px)',
                                                    border: '1px solid rgba(255,255,255,0.5)',
                                                    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                                            >
                                                <span className="text-[11px] font-bold text-[#1A1A1A]/40">
                                                    +{hiddenCount}
                                                </span>
                                                <ChevronRight size={11} color="rgba(26,26,26,0.35)" strokeWidth={2.5} />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                );
            })()}

            {/* All done state */}
            {sortedOrders.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="rounded-[22px] bg-white/60 backdrop-blur-xl border border-white/30 p-10 mb-8 text-center"
                    style={{ boxShadow: GLASS }}
                >
                    <div className="w-[40px] h-[40px] rounded-full bg-[#5EC072]/10 flex items-center justify-center mx-auto mb-3">
                        <Check size={18} color="#5EC072" strokeWidth={2.5} />
                    </div>
                    <p className="text-[14px] font-semibold text-[#1A1A1A]/50">
                        All caught up — no orders need your response
                    </p>
                </motion.div>
            )}

            {/* ═══════════════════════════════════════ */}
            {/*  ACTIVITY FEED — seller-specific        */}
            {/* ═══════════════════════════════════════ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.55, ease: EASE }}
                className="mb-8"
            >
                <div className="flex items-center justify-between mb-5 px-1">
                    <div className="flex items-center gap-2">
                        <p className="text-[12px] font-semibold text-[#1A1A1A]/30 tracking-wide">
                            Activity
                        </p>
                        {activities.filter(a => a.urgent || a.actionKind !== 'none').length > 0 && (
                            <span className="w-[6px] h-[6px] rounded-full bg-[#e74c3c] flex-shrink-0" />
                        )}
                        <span className="text-[10px] font-bold text-[#1A1A1A]/15 tabular-nums">
                            {activities.filter(a => a.urgent).length > 0 && `${activities.filter(a => a.urgent).length} urgent`}
                        </span>
                    </div>
                    {activities.length > 4 && (
                        <button 
                            className="text-[11px] font-bold text-[#0171e3]/70 bg-transparent border-none cursor-pointer hover:text-[#0171e3] transition-colors duration-200 inline-flex items-center gap-1"
                            onClick={() => setShowAllActivity(!showAllActivity)}
                        >
                            {showAllActivity ? (
                                <>
                                    Show less
                                    <ChevronDown size={11} strokeWidth={2.5} className="rotate-180" />
                                </>
                            ) : `View all (${activities.length})`}
                        </button>
                    )}
                </div>
                {/* Stacked card wrapper — gives depth illusion when collapsed */}
                <div className="relative" style={{ marginBottom: activities.length > 4 && !showAllActivity ? '4px' : '0' }}>
                <div className="rounded-[24px] bg-white/50 backdrop-blur-xl border border-white/40 overflow-hidden relative z-[2]" style={{ boxShadow: GLASS }}>
                    {(showAllActivity ? activities : activities.slice(0, 4)).map((activity, i) => {
                        const isExpanded = expandedActivity === activity.id;
                        const fallbackIcon = { icon: <Bell size={15} color="#8e8e93" strokeWidth={2.5} />, bg: 'rgba(142,142,147,0.06)' };
                        const iconData = ACTIVITY_ICONS[activity.type as ActivityType] ?? fallbackIcon;
                        const actionStyle = ACTION_BUTTON_STYLES[(activity as Activity).actionKind] ?? ACTION_BUTTON_STYLES.none;
                        const hasAction = (activity as Activity).actionKind !== 'none' && activity.actionLabel;

                        /* Types that are simple one-liners — no expand, no reply needed */
                        const simpleTypes = ['payment', 'platform_notice'];
                        const noReplyTypes = ['payment', 'platform_notice', 'compliance', 'pickup_done'];
                        const isSimple = simpleTypes.includes(activity.type);
                        const needsReply = !noReplyTypes.includes(activity.type);

                        /* ── Type-aware color — each notification has its own identity color ── */
                        const typeColorMap: Record<string, string> = {
                            sample_report: '#0171e3', sample_feedback: '#e67e22', inspection_done: '#2eaa57',
                            pickup_done: '#494B4D', payment: '#2eaa57', listing_rejected: '#c8892a',
                            compliance: '#e67e22', platform_notice: '#7A7D80',
                        };
                        const tc = typeColorMap[activity.type] ?? '#494B4D';

                        /* Rating color logic for inspection */
                        const ratingColor = activity.inspectionRating != null
                            ? activity.inspectionRating >= 4.0 ? '#2eaa57'
                            : activity.inspectionRating >= 3.0 ? '#e67e22'
                            : '#e74c3c'
                            : '#2eaa57';

                        return (
                            <div key={activity.id}>
                                {i > 0 && <div className="mx-4 h-[0.5px] bg-black/[0.04]" />}
                                <div className="transition-colors duration-200 group/row">
                                    {/* Main row — key info surfaced inline */}
                                    <div 
                                        className={`relative flex items-center gap-3 px-4 py-3 transition-all duration-200 ${isSimple ? '' : 'cursor-pointer hover:bg-white/40'}`}
                                        onClick={() => !isSimple && setExpandedActivity(isExpanded ? null : activity.id)}
                                    >
                                        {/* Urgent left edge indicator */}
                                        {activity.urgent && (
                                            <div className="absolute left-0 top-[25%] bottom-[25%] w-[2.5px] rounded-r-full bg-[#e74c3c]" />
                                        )}
                                        {/* Expanded state left accent — clearly shows which is open */}
                                        {isExpanded && !activity.urgent && (
                                            <div className="absolute left-0 top-[18%] bottom-[18%] w-[2.5px] rounded-r-full" style={{ background: tc, opacity: 0.4 }} />
                                        )}
                                        <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ background: iconData.bg }}
                                        >
                                            {iconData.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <p className="text-[13px] font-bold truncate transition-colors duration-200" style={{ color: isExpanded ? tc : 'rgba(26,26,26,0.85)' }}>{activity.title}</p>
                                                {/* Inline inspection rating badge */}
                                                {activity.inspectionRating != null && (
                                                    <span className="inline-flex items-center gap-[3px] px-[6px] py-[1px] rounded-full text-[10px] font-black tabular-nums flex-shrink-0"
                                                        style={{ background: `${ratingColor}10`, color: ratingColor }}
                                                    >
                                                        <Star size={8} fill={ratingColor} color={ratingColor} />
                                                        {activity.inspectionRating.toFixed(2)}
                                                    </span>
                                                )}
                                                {/* Inline pass rate chip */}
                                                {activity.passRate && !activity.inspectionRating && (
                                                    <span className="text-[10px] font-bold text-[#2eaa57]/70 bg-[#2eaa57]/[0.06] px-[6px] py-[1px] rounded-full flex-shrink-0">
                                                        {activity.passRate} ✓
                                                    </span>
                                                )}
                                                {/* Payment amount */}
                                                {activity.amount && (
                                                    <span className="text-[12px] font-black text-[#2eaa57] tabular-nums flex-shrink-0">
                                                        +{fmt(activity.amount)}
                                                    </span>
                                                )}
                                                {/* Compliance countdown */}
                                                {activity.daysLeft != null && (
                                                    <span className={`text-[10px] font-bold px-[6px] py-[1px] rounded-full flex-shrink-0 ${
                                                        activity.daysLeft <= 7 ? 'text-[#e74c3c]/80 bg-[#e74c3c]/[0.06]' : 'text-[#e67e22]/70 bg-[#e67e22]/[0.06]'
                                                    }`}>
                                                        {activity.daysLeft}d left
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <p className="text-[11px] font-medium text-[#1A1A1A]/40 truncate">
                                                    {activity.subtitle}
                                                    <span className="text-[#1A1A1A]/20"> · {activity.time}</span>
                                                </p>
                                                {/* Inline tracking chip on main row */}
                                                {activity.trackingNumber && (
                                                    <span 
                                                        className="text-[9px] font-bold text-[#1A1A1A]/30 bg-black/[0.03] px-1.5 py-[1px] rounded flex-shrink-0 cursor-pointer hover:bg-black/[0.06] transition-colors tabular-nums"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard.writeText(activity.trackingNumber!);
                                                            toast.success('Tracking # copied', { description: activity.trackingNumber });
                                                        }}
                                                        title="Click to copy"
                                                    >
                                                        {activity.trackingNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Inline action button — zero friction, revealed on hover */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <div className={`flex items-center gap-2 transition-all duration-200 ${isExpanded ? 'opacity-100 grayscale-0' : 'opacity-[0.35] grayscale group-hover/row:opacity-100 group-hover/row:grayscale-0'}`}>
                                            {/* Primary Track shipment for pickup_done */}
                                            {activity.type === 'pickup_done' && activity.trackingNumber && (
                                                <motion.button
                                                    whileHover={{ scale: 1.04 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toast('Opening shipment details…');
                                                    }}
                                                    className="px-3 py-[5px] rounded-full cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold transition-all duration-200"
                                                    style={{
                                                        background: `${tc}12`,
                                                        color: tc,
                                                        border: `1px solid ${tc}20`,
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = `${tc}22`; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = `${tc}12`; }}
                                                >
                                                    <Truck size={11} strokeWidth={2} />
                                                    Track shipment
                                                </motion.button>
                                            )}
                                            {/* Hide row-level action for listing_rejected when expanded — the card's blue CTA is the single action point */}
                                            {hasAction && !(activity.type === 'listing_rejected' && isExpanded) && (
                                                <motion.button
                                                    whileHover={{ scale: 1.04 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleActivityAction(activity);
                                                    }}
                                                    className="px-3 py-[5px] rounded-full cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold transition-all duration-200"
                                                    style={{
                                                        background: `${tc}12`,
                                                        color: tc,
                                                        border: `1px solid ${tc}20`,
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = `${tc}22`; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = `${tc}12`; }}
                                                >
                                                    {actionStyle.icon}
                                                    {activity.actionLabel}
                                                </motion.button>
                                            )}
                                            </div>
                                            {!isSimple && (
                                                <motion.div
                                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="flex-shrink-0"
                                                >
                                                    <ChevronDown size={13} color={isExpanded ? tc : 'rgba(26,26,26,0.15)'} strokeWidth={2.5} style={{ opacity: isExpanded ? 0.55 : 1, transition: 'all 0.2s' }} />
                                                </motion.div>
                                            )}
                                            {/* Spacer to align with expandable rows that have a chevron */}
                                            {isSimple && (
                                                <div className="w-[13px] flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded detail — rich context */}
                                    <AnimatePresence>
                                        {isExpanded && !isSimple && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: EASE }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-3.5 pl-[58px]">
                                                    {/* For listing_rejected: skip generic detail — the unified card below tells the whole story */}
                                                    {activity.type !== 'listing_rejected' && (
                                                        <p className="text-[12px] font-medium text-[#1A1A1A]/50 leading-[1.65] mb-2.5">
                                                            {activity.detail}
                                                        </p>
                                                    )}

                                                    {/* ══════════════════════════════════════════════════════════
                                                        LISTING REJECTED — Platonic unified experience
                                                        One card. One flow. Zero friction.
                                                        Problem → See it → Fix it → Done.
                                                       ══════════════════════════════════════════════════════════ */}
                                                    {activity.type === 'listing_rejected' && activity.rejectionReason && (
                                                        <div className="mb-3 rounded-[16px] overflow-hidden" style={{ background: 'linear-gradient(180deg, #FAFBFD 0%, #F6F4F0 100%)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                            
                                                            {/* ── Header: warm, human, not robotic ── */}
                                                            <div className="px-4 pt-3.5 pb-2">
                                                                <div className="flex items-center gap-2.5 mb-2">
                                                                    <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #F0E6D3 0%, #E8D9BF 100%)' }}>
                                                                        <Lightbulb size={13} color="#a07830" strokeWidth={2} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[13px] font-semibold text-[#1A1A1A]/75">Almost there!</p>
                                                                        <p className="text-[11px] font-medium text-[#1A1A1A]/35">Just a few small updates needed</p>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* The issue — in plain, warm language */}
                                                                <p className="text-[12px] font-medium text-[#1A1A1A]/55 leading-[1.7] mt-1">
                                                                    {activity.rejectionReason}
                                                                </p>
                                                            </div>

                                                            {/* ── Steps with paired photos: each photo sits inside its step ── */}
                                                            {activity.improvementSuggestions && activity.improvementSuggestions.length > 0 && (
                                                                <div className="px-4 pt-1 pb-2.5">
                                                                    <div className="rounded-[12px] bg-white/70 border border-black/[0.04] overflow-hidden">
                                                                        {activity.improvementSuggestions.map((suggestion, si) => {
                                                                            /* Support both: per-step photos (suggestion.photos) and legacy flat list (rejectionPhotos[si]) */
                                                                            const stepPhotos = suggestion.photos ?? (activity.rejectionPhotos?.[si] ? [activity.rejectionPhotos[si]] : []);
                                                                            return (
                                                                                <div key={si}>
                                                                                    {si > 0 && <div className="h-[0.5px] bg-black/[0.04] mx-3" />}
                                                                                    <div className="flex items-start gap-2.5 px-3 py-2.5">
                                                                                        <div className="w-[20px] h-[20px] rounded-full bg-[#0171E3]/8 flex items-center justify-center flex-shrink-0 mt-[0.5px]">
                                                                                            <span className="text-[10px] font-black text-[#0171E3]/55 tabular-nums">{si + 1}</span>
                                                                                        </div>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-[12px] font-semibold text-[#1A1A1A]/60 leading-[1.45]">
                                                                                                {suggestion.text}
                                                                                            </p>
                                                                                            {suggestion.tip && (
                                                                                                <p className="text-[10.5px] font-medium text-[#1A1A1A]/30 leading-[1.5] mt-0.5">
                                                                                                    {suggestion.tip}
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                        {/* Per-step photos — max 2 visible + overflow badge + download all on hover */}
                                                                                        {stepPhotos.length > 0 && (() => {
                                                                                            const maxVisible = 2;
                                                                                            const visiblePhotos = stepPhotos.slice(0, maxVisible);
                                                                                            const overflowCount = stepPhotos.length - maxVisible;
                                                                                            return (
                                                                                                <div
                                                                                                    className="flex-shrink-0 flex items-center gap-1.5 ml-1 relative group/dl cursor-pointer"
                                                                                                    onClick={() => {
                                                                                                        stepPhotos.forEach((photo, idx) => {
                                                                                                            const link = document.createElement('a');
                                                                                                            link.href = photo.url;
                                                                                                            link.download = `step-${si + 1}-photo-${idx + 1}.jpg`;
                                                                                                            link.target = '_blank';
                                                                                                            link.rel = 'noopener noreferrer';
                                                                                                            document.body.appendChild(link);
                                                                                                            link.click();
                                                                                                            document.body.removeChild(link);
                                                                                                        });
                                                                                                        toast.success(`Downloading ${stepPhotos.length} photo${stepPhotos.length > 1 ? 's' : ''}`, { description: `Reference photos for step ${si + 1}` });
                                                                                                    }}
                                                                                                >
                                                                                                    {visiblePhotos.map((photo, pi) => (
                                                                                                        <div key={pi} className="relative">
                                                                                                            <div className="relative w-[48px] h-[40px] rounded-[6px] overflow-hidden transition-opacity duration-200 group-hover/dl:opacity-60" style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                                                                                                <ImageWithFallback
                                                                                                                    src={photo.url}
                                                                                                                    alt={photo.caption}
                                                                                                                    className="w-full h-full object-cover"
                                                                                                                />
                                                                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                                                                                                                <p className="absolute bottom-[1.5px] left-[2px] right-[2px] text-[5.5px] font-semibold text-white/85 truncate text-center">
                                                                                                                    {photo.caption}
                                                                                                                </p>
                                                                                                            </div>
                                                                                                            {pi === visiblePhotos.length - 1 && overflowCount > 0 && (
                                                                                                                <div className="absolute inset-0 rounded-[6px] bg-black/40 flex items-center justify-center pointer-events-none group-hover/dl:bg-black/55 transition-colors">
                                                                                                                    <span className="text-[11px] font-black text-white/90 tabular-nums">+{overflowCount}</span>
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    ))}
                                                                                                    {/* Download icon — floats over photo group on hover */}
                                                                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/dl:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                                                                                        <div className="w-[22px] h-[22px] rounded-full bg-white/90 flex items-center justify-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
                                                                                                            <Download size={11} color="#0171E3" strokeWidth={2.5} />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        })()}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Fallback: photos only when no steps exist */}
                                                            {(!activity.improvementSuggestions || activity.improvementSuggestions.length === 0) && activity.rejectionPhotos && activity.rejectionPhotos.length > 0 && (
                                                                <div className="px-4 py-2.5">
                                                                    <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                                                                        {activity.rejectionPhotos.map((photo, pi) => (
                                                                            <div key={pi} className="flex-shrink-0 group/photo cursor-pointer">
                                                                                <div className="relative w-[100px] h-[75px] rounded-[12px] overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                                                                    <ImageWithFallback src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                                                                    <p className="absolute bottom-[4px] left-[6px] right-[6px] text-[8px] font-semibold text-white/90 truncate">{photo.caption}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* ── Footer: one clear action + help escape hatch ── */}
                                                            <div className="px-4 pb-3.5 pt-1 flex items-center gap-2">
                                                                <motion.button
                                                                    whileHover={{ scale: 1.01 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={() => toast.success('Opening editor…', { description: 'Make your updates and resubmit when ready' })}
                                                                    className="flex-1 py-2 rounded-[10px] cursor-pointer inline-flex items-center justify-center gap-2 text-[12px] font-semibold text-white border-none transition-all duration-200"
                                                                    style={{ background: 'linear-gradient(135deg, #0171E3 0%, #0160C2 100%)', boxShadow: '0 1px 3px rgba(1,113,227,0.2)' }}
                                                                >
                                                                    <Upload size={12} strokeWidth={2.5} />
                                                                    Fix & resubmit
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.97 }}
                                                                    onClick={() => toast('Connecting you to support…', { description: 'A team member will help you through this' })}
                                                                    className="py-2 px-3.5 rounded-[10px] cursor-pointer inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold bg-transparent border transition-all duration-200"
                                                                    style={{ color: 'rgba(26,26,26,0.4)', borderColor: 'rgba(0,0,0,0.07)' }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; e.currentTarget.style.color = 'rgba(26,26,26,0.6)'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(26,26,26,0.4)'; }}
                                                                >
                                                                    <HelpCircle size={11} strokeWidth={2} />
                                                                    Need help?
                                                                </motion.button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* ── Inspection rating card ── */}
                                                    {activity.inspectionRating != null && (
                                                        <div className="mb-3 rounded-[12px] border px-3 py-2.5"
                                                            style={{ background: `${ratingColor}04`, borderColor: `${ratingColor}15` }}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-[10px] font-bold tracking-wide mb-1" style={{ color: `${ratingColor}90` }}>QUALITY SCORE</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[22px] font-black tabular-nums" style={{ color: ratingColor }}>
                                                                            {activity.inspectionRating.toFixed(2)}
                                                                        </span>
                                                                        <span className="text-[11px] font-medium text-[#1A1A1A]/30">/5.00</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    {activity.passRate && (
                                                                        <div className="mb-1">
                                                                            <p className="text-[10px] font-bold text-[#1A1A1A]/25 tracking-wide mb-0.5">PASS RATE</p>
                                                                            <p className="text-[13px] font-black tabular-nums" style={{ color: ratingColor }}>{activity.passRate}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {/* 5-star visual */}
                                                            <div className="flex items-center gap-[2px] mt-1.5">
                                                                {[1,2,3,4,5].map(s => (
                                                                    <Star key={s} size={11}
                                                                        fill={s <= Math.round(activity.inspectionRating!) ? ratingColor : 'transparent'}
                                                                        color={s <= Math.round(activity.inspectionRating!) ? ratingColor : 'rgba(26,26,26,0.1)'}
                                                                        strokeWidth={2}
                                                                    />
                                                                ))}
                                                                <span className="text-[10px] font-medium text-[#1A1A1A]/25 ml-1">
                                                                    {activity.inspectionRating >= 4.5 ? 'Excellent' : activity.inspectionRating >= 4.0 ? 'Very Good' : activity.inspectionRating >= 3.0 ? 'Acceptable' : 'Below Standard'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* ── Sample report pass rate card ── */}
                                                    {activity.type === 'sample_report' && activity.passRate && !activity.inspectionRating && (
                                                        <div className="mb-3 rounded-[12px] bg-[#2eaa57]/[0.04] border border-[#2eaa57]/10 px-3 py-2.5">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-[#2eaa57]/60 tracking-wide mb-0.5">SAMPLE RESULT</p>
                                                                    <p className="text-[14px] font-black text-[#2eaa57] tabular-nums">{activity.passRate} passed</p>
                                                                </div>
                                                                <CheckCircle2 size={20} color="#2eaa57" strokeWidth={2} style={{ opacity: 0.4 }} />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* ── Tracking & delivery card ── */}
                                                    {activity.type === 'pickup_done' && activity.trackingNumber && (
                                                        <div className="mb-3 rounded-[12px] bg-[#1A1A1A]/[0.02] border border-black/[0.04] px-3 py-2.5">
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <p className="text-[10px] font-bold text-[#1A1A1A]/25 tracking-wide">SHIPMENT</p>
                                                                <span className="text-[9px] font-bold text-[#2eaa57]/60 bg-[#2eaa57]/[0.06] px-1.5 py-[1px] rounded-full">IN TRANSIT</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-[12px] font-bold text-[#1A1A1A]/60 tabular-nums">{activity.trackingNumber}</p>
                                                                    {activity.estimatedDelivery && (
                                                                        <p className="text-[10px] font-medium text-[#1A1A1A]/30 mt-0.5">ETA: {activity.estimatedDelivery}</p>
                                                                    )}
                                                                </div>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(activity.trackingNumber!);
                                                                        toast.success('Copied!', { description: activity.trackingNumber });
                                                                    }}
                                                                    className="w-[28px] h-[28px] rounded-full bg-black/[0.04] flex items-center justify-center cursor-pointer border-none hover:bg-black/[0.07] transition-colors"
                                                                >
                                                                    <Copy size={11} color="rgba(26,26,26,0.4)" strokeWidth={2.5} />
                                                                </motion.button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* ── Payment deposit card ── */}
                                                    {activity.type === 'payment' && (
                                                        <div className="mb-3 rounded-[12px] bg-[#2eaa57]/[0.03] border border-[#2eaa57]/10 px-3 py-2.5">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-[#2eaa57]/50 tracking-wide mb-0.5">DEPOSIT</p>
                                                                    <p className="text-[12px] font-bold text-[#1A1A1A]/60">
                                                                        {activity.depositEta ?? 'Processing'}
                                                                        {activity.bankLast4 && <span className="text-[#1A1A1A]/30"> → ••{activity.bankLast4}</span>}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[16px] font-black text-[#2eaa57] tabular-nums">+{fmt(activity.amount!)}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* ── Compliance countdown card ── */}
                                                    {activity.type === 'compliance' && activity.daysLeft != null && (
                                                        <div className={`mb-3 rounded-[12px] border px-3 py-2.5 ${
                                                            activity.daysLeft <= 7 ? 'bg-[#e74c3c]/[0.03] border-[#e74c3c]/10' : 'bg-[#e67e22]/[0.03] border-[#e67e22]/10'
                                                        }`}>
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className={`text-[10px] font-bold tracking-wide mb-0.5 ${activity.daysLeft <= 7 ? 'text-[#e74c3c]/60' : 'text-[#e67e22]/60'}`}>
                                                                        {activity.certType ?? 'CERTIFICATE'}
                                                                    </p>
                                                                    <div className="flex items-baseline gap-1.5">
                                                                        <span className={`text-[20px] font-black tabular-nums ${activity.daysLeft <= 7 ? 'text-[#e74c3c]' : 'text-[#e67e22]'}`}>
                                                                            {activity.daysLeft}
                                                                        </span>
                                                                        <span className="text-[11px] font-medium text-[#1A1A1A]/30">days remaining</span>
                                                                    </div>
                                                                </div>
                                                                {/* Mini progress arc */}
                                                                <div className="relative w-[36px] h-[36px]">
                                                                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                                                        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="3" />
                                                                        <circle cx="18" cy="18" r="14" fill="none"
                                                                            stroke={activity.daysLeft <= 7 ? '#e74c3c' : '#e67e22'}
                                                                            strokeWidth="3" strokeLinecap="round"
                                                                            strokeDasharray={`${Math.max(5, (activity.daysLeft / 30) * 88)} 88`}
                                                                            opacity={0.6}
                                                                        />
                                                                    </svg>
                                                                    <CalendarClock size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" color={activity.daysLeft <= 7 ? '#e74c3c' : '#e67e22'} strokeWidth={2} style={{ opacity: 0.5 }} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Client comment on sample — verbatim quote + threaded reply */}
                                                    {activity.clientComment && (
                                                        <div className="mb-3">
                                                            <div 
                                                                className="rounded-t-[12px] bg-[#FFF8F0] border border-[#e67e22]/10 px-3 py-2.5 cursor-pointer hover:bg-[#FFF3E6] transition-colors group/comment"
                                                                onClick={() => {
                                                                    const matchedOrder = orders.find(o => o.orderNumber === activity.orderRef);
                                                                    if (matchedOrder) {
                                                                        setChatOpenId(matchedOrder.id);
                                                                        setTimeout(() => {
                                                                            document.getElementById(`order-${matchedOrder.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                        }, 100);
                                                                    }
                                                                }}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[10px] font-bold text-[#e67e22]/60 mb-1 tracking-wide">BUYER COMMENT</p>
                                                                    <span className="text-[10px] font-semibold text-[#e67e22]/40 opacity-0 group-hover/comment:opacity-100 transition-opacity">View conversation →</span>
                                                                </div>
                                                                <p className="text-[12px] font-medium text-[#1A1A1A]/70 leading-[1.55] italic">
                                                                    {activity.clientComment}
                                                                </p>
                                                            </div>

                                                            {/* Threaded reply — inline attached to comment */}
                                                            <div className="rounded-b-[12px] bg-[#FFF8F0]/30 border border-t-0 border-[#e67e22]/10 px-3 py-1.5">
                                                                <div className="flex items-center gap-2">
                                                                    <textarea
                                                                        value={activityReplyText}
                                                                        onChange={(e) => setActivityReplyText(e.target.value)}
                                                                        placeholder="Reply to buyer…"
                                                                        className="flex-1 bg-white/70 rounded-[8px] border border-[#e67e22]/[0.06] px-3 py-[7px] text-[12px] font-medium text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/25 resize-none outline-none focus:border-[#e67e22]/20 focus:bg-white transition-colors"
                                                                        rows={1}
                                                                        autoFocus
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter' && !e.shiftKey && activityReplyText.trim()) {
                                                                                e.preventDefault();
                                                                                toast.success('Reply sent', { description: `Your response to ${activity.orderRef ?? 'buyer'} has been delivered` });
                                                                                setActivityReplyId(null);
                                                                                setActivityReplyText('');
                                                                            }
                                                                        }}
                                                                    />
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.92 }}
                                                                        onClick={() => {
                                                                            if (activityReplyText.trim()) {
                                                                                toast.success('Reply sent', { description: `Your response to ${activity.orderRef ?? 'buyer'} has been delivered` });
                                                                                setActivityReplyId(null);
                                                                                setActivityReplyText('');
                                                                            }
                                                                        }}
                                                                        className="w-[28px] h-[28px] rounded-full flex items-center justify-center cursor-pointer border-none flex-shrink-0 transition-all"
                                                                        style={{
                                                                            background: activityReplyText.trim() ? '#e67e22' : 'rgba(230,126,34,0.08)',
                                                                        }}
                                                                    >
                                                                        <Send size={12} color={activityReplyText.trim() ? 'white' : 'rgba(230,126,34,0.3)'} strokeWidth={2.5} />
                                                                    </motion.button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Reply input for activities without a client comment — inline in flow */}
                                                    {/* listing_rejected has its own unified card with actions — no reply needed here */}
                                                    {!activity.clientComment && needsReply && activity.type !== 'listing_rejected' && (
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <textarea
                                                                value={activityReplyText}
                                                                onChange={(e) => setActivityReplyText(e.target.value)}
                                                                placeholder="Type your reply…"
                                                                className="flex-1 bg-[#F5F5F7] rounded-[10px] border border-black/[0.04] px-3 py-[7px] text-[12px] font-medium text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/25 resize-none outline-none focus:border-[#0071e3]/20 focus:bg-white transition-colors"
                                                                rows={1}
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && !e.shiftKey && activityReplyText.trim()) {
                                                                        e.preventDefault();
                                                                        toast.success('Reply sent', { description: `Your response to ${activity.orderRef ?? 'buyer'} has been delivered` });
                                                                        setActivityReplyId(null);
                                                                        setActivityReplyText('');
                                                                    }
                                                                }}
                                                            />
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.92 }}
                                                                onClick={() => {
                                                                    if (activityReplyText.trim()) {
                                                                        toast.success('Reply sent', { description: `Your response to ${activity.orderRef ?? 'buyer'} has been delivered` });
                                                                        setActivityReplyId(null);
                                                                        setActivityReplyText('');
                                                                    }
                                                                }}
                                                                className="w-[28px] h-[28px] rounded-full flex items-center justify-center cursor-pointer border-none flex-shrink-0 transition-all"
                                                                style={{
                                                                    background: activityReplyText.trim() ? '#1A1A1A' : 'rgba(26,26,26,0.06)',
                                                                }}
                                                            >
                                                                <Send size={12} color={activityReplyText.trim() ? 'white' : 'rgba(26,26,26,0.2)'} strokeWidth={2.5} />
                                                            </motion.button>
                                                        </div>
                                                    )}

                                                    {/* Rejection reason fallback for non-listing types */}
                                                    {activity.rejectionReason && activity.type !== 'listing_rejected' && (
                                                        <div className="mb-3 rounded-[12px] bg-[#FDF8F0] border border-[#e6a94d]/12 px-3 py-2.5">
                                                            <p className="text-[10px] font-bold text-[#c8892a]/60 mb-1 tracking-wide">DETAILS</p>
                                                            <p className="text-[12px] font-medium text-[#1A1A1A]/70 leading-[1.55]">
                                                                {activity.rejectionReason}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Order ref + Contextual smart actions — same row */}
                                                    {/* For listing_rejected, all actions live inside the unified card — skip this row entirely */}
                                                    <div className={`flex items-center gap-2 mt-1 flex-wrap pr-[21px] ${activity.type === 'listing_rejected' ? 'hidden' : ''}`}>
                                                        {activity.orderRef && (
                                                            <>
                                                                <span className="text-[10px] font-bold text-[#1A1A1A]/25 tracking-wide">ORDER</span>
                                                                <span 
                                                                    className="text-[11px] font-bold text-[#0171e3]/60 bg-[#0171e3]/[0.06] px-2 py-0.5 rounded-full cursor-pointer hover:bg-[#0171e3]/[0.10] hover:text-[#0171e3]/80 transition-all duration-200"
                                                                    onClick={() => {
                                                                        const matchedOrder = orders.find(o => o.orderNumber === activity.orderRef);
                                                                        if (matchedOrder) {
                                                                            document.getElementById(`order-${matchedOrder.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                        }
                                                                    }}
                                                                >
                                                                    {activity.orderRef}
                                                                </span>
                                                                {activity.inspectorName && (
                                                                    <>
                                                                        <span className="text-[10px] font-bold text-[#1A1A1A]/25 tracking-wide">INSPECTOR</span>
                                                                        <span className="text-[11px] font-semibold text-[#1A1A1A]/50">
                                                                            {activity.inspectorName}
                                                                        </span>
                                                                    </>
                                                                )}
                                                                {activity.courierName && (
                                                                    <>
                                                                        <span className="text-[10px] font-bold text-[#1A1A1A]/25 tracking-wide">COURIER</span>
                                                                        <span className="text-[11px] font-semibold text-[#1A1A1A]/50">
                                                                            {activity.courierName}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </>
                                                        )}
                                                        <div className="flex-1" />
                                                        {/* ── Contextual smart actions per type — calm blue for all ── */}
                                                        {/* Sample report: view defect photos, schedule revision */}
                                                        {activity.type === 'sample_report' && (
                                                            <>
                                                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                                    onClick={() => toast('Opening defect photos…', { description: 'Visual report for flagged units' })}
                                                                    className="px-3 py-1.5 rounded-full cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold bg-transparent transition-all duration-200"
                                                                    style={{ color: '#0171E390', border: '1px solid #0171E318' }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#0171E308'; e.currentTarget.style.color = '#0171E3'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0171E390'; }}
                                                                >
                                                                    <Image size={10} strokeWidth={2.5} />
                                                                    Defect photos
                                                                </motion.button>
                                                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                                    onClick={() => {
                                                                        const matchedOrder = orders.find(o => o.orderNumber === activity.orderRef);
                                                                        if (matchedOrder) {
                                                                            setChatOpenId(matchedOrder.id);
                                                                            setTimeout(() => {
                                                                                document.getElementById(`order-${matchedOrder.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                            }, 100);
                                                                        }
                                                                    }}
                                                                    className="px-3 py-1.5 rounded-full cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold bg-transparent transition-all duration-200"
                                                                    style={{ color: '#0171E390', border: '1px solid #0171E318' }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#0171E308'; e.currentTarget.style.color = '#0171E3'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0171E390'; }}
                                                                >
                                                                    <Share2 size={10} strokeWidth={2.5} />
                                                                    Share with buyer
                                                                </motion.button>
                                                            </>
                                                        )}

                                                        {/* Buyer feedback: reorder sample, accept & proceed */}
                                                        {activity.type === 'sample_feedback' && (
                                                            <>
                                                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                                    onClick={() => toast('Scheduling new sample…', { description: 'A revised sample pickup will be arranged' })}
                                                                    className="px-3 py-1.5 rounded-full cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold bg-transparent transition-all duration-200"
                                                                    style={{ color: '#0171E390', border: '1px solid #0171E318' }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#0171E308'; e.currentTarget.style.color = '#0171E3'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0171E390'; }}
                                                                >
                                                                    <RotateCcw size={10} strokeWidth={2.5} />
                                                                    Reorder sample
                                                                </motion.button>
                                                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                                    onClick={() => toast.success('Production approved', { description: 'Changes accepted — production can begin' })}
                                                                    className="px-3 py-1.5 rounded-full cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold bg-transparent transition-all duration-200"
                                                                    style={{ color: '#2eaa57bb', border: '1px solid rgba(46,170,87,0.18)' }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(46,170,87,0.06)'; e.currentTarget.style.color = '#2eaa57'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2eaa57bb'; }}
                                                                >
                                                                    <Check size={10} strokeWidth={2.5} />
                                                                    Accept & proceed
                                                                </motion.button>
                                                            </>
                                                        )}

                                                        {/* Inspection: share report, dispute, re-inspect */}
                                                        {activity.type === 'inspection_done' && (
                                                            <>
                                                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                                    onClick={() => {
                                                                        const matchedOrder = orders.find(o => o.orderNumber === activity.orderRef);
                                                                        if (matchedOrder) {
                                                                            setChatOpenId(matchedOrder.id);
                                                                            setTimeout(() => {
                                                                                document.getElementById(`order-${matchedOrder.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                            }, 100);
                                                                        }
                                                                    }}
                                                                    className="px-3 py-1.5 rounded-full cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold bg-transparent transition-all duration-200"
                                                                    style={{ color: '#0171E390', border: '1px solid #0171E318' }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#0171E308'; e.currentTarget.style.color = '#0171E3'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0171E390'; }}
                                                                >
                                                                    <Share2 size={10} strokeWidth={2.5} />
                                                                    Share with buyer
                                                                </motion.button>
                                                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                                    onClick={() => toast('Re-inspection requested', { description: 'A new inspection will be scheduled' })}
                                                                    className="px-3 py-1.5 rounded-full cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold bg-transparent transition-all duration-200"
                                                                    style={{ color: '#0171E390', border: '1px solid #0171E318' }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#0171E308'; e.currentTarget.style.color = '#0171E3'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0171E390'; }}
                                                                >
                                                                    <RotateCcw size={10} strokeWidth={2.5} />
                                                                    Re-inspect
                                                                </motion.button>
                                                            </>
                                                        )}

                                                        {/* Pickup: share tracking, view on map */}
                                                        {activity.type === 'pickup_done' && (
                                                            <>
                                                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(activity.trackingNumber ?? '');
                                                                        toast.success('Tracking # copied');
                                                                    }}
                                                                    className="px-3 py-1.5 rounded-full cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold bg-transparent transition-all duration-200"
                                                                    style={{ color: '#0171E390', border: '1px solid #0171E318' }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#0171E308'; e.currentTarget.style.color = '#0171E3'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0171E390'; }}
                                                                >
                                                                    <Copy size={10} strokeWidth={2.5} />
                                                                    Copy tracking #
                                                                </motion.button>
                                                                {/* Track shipment promoted to main row */}
                                                            </>
                                                        )}

                                                        {/* Payment: view breakdown, download invoice */}
                                                        {activity.type === 'payment' && (
                                                            <>
                                                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                                    onClick={() => toast('Opening payment breakdown…')}
                                                                    className="px-3 py-1.5 rounded-full cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold bg-transparent transition-all duration-200"
                                                                    style={{ color: '#0171E390', border: '1px solid #0171E318' }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#0171E308'; e.currentTarget.style.color = '#0171E3'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0171E390'; }}
                                                                >
                                                                    <Receipt size={10} strokeWidth={2.5} />
                                                                    View breakdown
                                                                </motion.button>
                                                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                                    onClick={() => toast.success('Invoice downloaded')}
                                                                    className="px-3 py-1.5 rounded-full cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold bg-transparent transition-all duration-200"
                                                                    style={{ color: '#0171E390', border: '1px solid #0171E318' }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#0171E308'; e.currentTarget.style.color = '#0171E3'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0171E390'; }}
                                                                >
                                                                    <Download size={10} strokeWidth={2.5} />
                                                                    Invoice
                                                                </motion.button>
                                                            </>
                                                        )}

                                                        {/* Listing rejected: actions live inside the unified card above — no duplicate buttons needed */}

                                                        {/* Compliance: set reminder */}
                                                        {activity.type === 'compliance' && (
                                                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                                onClick={() => toast.success('Reminder set', { description: 'You will be notified 3 days before expiry' })}
                                                                className="px-3 py-1.5 rounded-full cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold bg-transparent transition-all duration-200"
                                                                style={{ color: '#0171E390', border: '1px solid #0171E318' }}
                                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#0171E308'; e.currentTarget.style.color = '#0171E3'; }}
                                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0171E390'; }}
                                                            >
                                                                <Bell size={10} strokeWidth={2.5} />
                                                                Set reminder
                                                            </motion.button>
                                                        )}

                                                        {/* Platform notice: acknowledge */}
                                                        {activity.type === 'platform_notice' && (
                                                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                                onClick={() => {
                                                                    toast.success('Acknowledged');
                                                                    setExpandedActivity(null);
                                                                }}
                                                                className="px-3 py-1.5 rounded-full cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold bg-transparent transition-all duration-200"
                                                                style={{ color: '#0171E390', border: '1px solid #0171E318' }}
                                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#0171E308'; e.currentTarget.style.color = '#0171E3'; }}
                                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0171E390'; }}
                                                            >
                                                                <Check size={10} strokeWidth={2.5} />
                                                                Mark as read
                                                            </motion.button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        );
                    })}

                </div>

                {/* ── Collapse pill — floats below the card when expanded, clearly not a notification ── */}
                {activities.length > 4 && showAllActivity && (
                    <div className="flex justify-center" style={{ marginTop: '10px' }}>
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setShowAllActivity(false)}
                            className="inline-flex items-center gap-1.5 px-4 py-[6px] rounded-full cursor-pointer border-none transition-all duration-200"
                            style={{
                                background: 'rgba(255,255,255,0.6)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255,255,255,0.5)',
                                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                        >
                            <ChevronDown size={11} color="rgba(26,26,26,0.35)" strokeWidth={2.5} className="rotate-180" />
                            <span className="text-[11px] font-bold text-[#1A1A1A]/40">
                                Show less
                            </span>
                        </motion.button>
                    </div>
                )}

                {/* ── iOS-style stacked cards — ghost strips peeking behind, clickable to expand ── */}
                {activities.length > 4 && !showAllActivity && (
                    <motion.div
                        className="relative cursor-pointer"
                        style={{ height: '24px', marginTop: '-2px' }}
                        onClick={() => setShowAllActivity(true)}
                        whileHover="hover"
                        initial="rest"
                        animate="rest"
                    >
                        {/* Ghost card 1 — first layer */}
                        <motion.div
                            className="absolute left-[8px] right-[8px] rounded-b-[20px] z-[1]"
                            style={{
                                top: 0,
                                height: '14px',
                                background: 'rgba(255,255,255,0.45)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255,255,255,0.5)',
                                borderTop: 'none',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
                            }}
                            variants={{
                                rest: { y: 0 },
                                hover: { y: 1 },
                            }}
                            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                        />
                        {/* Ghost card 2 — second deeper layer */}
                        <motion.div
                            className="absolute left-[18px] right-[18px] rounded-b-[16px] z-[0]"
                            style={{
                                top: '7px',
                                height: '11px',
                                background: 'rgba(255,255,255,0.28)',
                                backdropFilter: 'blur(6px)',
                                WebkitBackdropFilter: 'blur(6px)',
                                border: '1px solid rgba(255,255,255,0.32)',
                                borderTop: 'none',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                            }}
                            variants={{
                                rest: { y: 0 },
                                hover: { y: 2 },
                            }}
                            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                        />
                        {/* Count pill — floats centered over the stack */}
                        <motion.div
                            className="absolute left-1/2 -translate-x-1/2 z-[3] flex items-center gap-1.5 px-3 py-[3px] rounded-full"
                            style={{
                                top: '3px',
                                background: 'rgba(255,255,255,0.75)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255,255,255,0.6)',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                            }}
                            variants={{
                                rest: { opacity: 0.7, scale: 1 },
                                hover: { opacity: 1, scale: 1.04 },
                            }}
                            transition={{ duration: 0.2 }}
                        >
                            <span className="text-[10px] font-bold text-[#0171e3]/70 tabular-nums whitespace-nowrap">
                                +{activities.length - 4} more
                            </span>
                            <ChevronDown size={9} color="#0171e3" strokeWidth={3} style={{ opacity: 0.5 }} />
                        </motion.div>
                    </motion.div>
                )}
                </div>
            </motion.div>

            {/* ═══════════════════════════════════════ */}
            {/*  TRENDS & INSIGHTS                      */}
            {/* ═══════════════════════════════════════ */}
            <SellerTrends />

            {/* ═══════════════════════════════════════ */}
            {/*  PRODUCT REELS                          */}
            {/* ═══════════════════════════════════════ */}
            <SellerReels />

            {/* ═══════════════════════════════════════ */}
            {/*  LISTED PRODUCTS                        */}
            {/* ═══════════════════════════════════════ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.55, ease: EASE }}
                className="mb-5"
            >
                <div className="flex items-center justify-between mb-4 px-1">
                    <p className="text-[12px] font-semibold text-[#1A1A1A]/30">
                        Your products
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => {
                            bounce(e.currentTarget);
                            setShowListingForm(true);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border-none cursor-pointer"
                        style={{
                            background: '#1A1A1A',
                            color: '#fff',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1), 0 6px 16px -6px rgba(0,0,0,0.14)',
                        }}
                    >
                        <Plus size={13} strokeWidth={2.5} />
                        <span className="text-[11px] font-bold">New Listing</span>
                    </motion.button>
                </div>

                {/* ── Compact product list ── */}
                <div
                    className="rounded-[14px] overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.5)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(0,0,0,0.03)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.01), 0 4px 12px -4px rgba(0,0,0,0.03)',
                    }}
                >
                    {(() => {
                        const pendingStatuses = new Set(['review', 'legal_check']);

                        const sorted = [...products].sort((a, b) => {
                            const aApproved = a.status === 'pickup_approved';
                            const bApproved = b.status === 'pickup_approved';
                            if (aApproved && !bApproved) return -1;
                            if (!aApproved && bApproved) return 1;
                            const aPending = pendingStatuses.has(a.status);
                            const bPending = pendingStatuses.has(b.status);
                            if (aPending && !bPending) return -1;
                            if (!aPending && bPending) return 1;
                            return (b.sold / 14) - (a.sold / 14);
                        });

                        return sorted.map((p, pi) => {
                            const dailyRate = p.sold > 0 ? Math.round((p.sold / 14) * 10) / 10 : 0;
                            const daysOfStock = dailyRate > 0 ? Math.round(p.inWarehouse / dailyRate) : 999;
                            const isCritical = daysOfStock < 14 && dailyRate > 0 && p.status === 'active';
                            const isPending = pendingStatuses.has(p.status);
                            const isReady = p.status === 'pickup_approved';

                            return (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.28 + pi * 0.04, duration: 0.35, ease: EASE }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors hover:bg-black/[0.015] ${pi > 0 ? 'border-t border-black/[0.03]' : ''}`}
                                    onClick={(e) => {
                                        bounce(e.currentTarget);
                                        toast(p.name, { description: isPending ? 'Under review — we\u2019ll notify you when approved' : isReady ? 'Approved! Pay for testing & pickup to go live' : `${fmt(p.price)}/unit · ${p.inWarehouse} in warehouse` });
                                    }}
                                >
                                    {/* Tiny image */}
                                    <div className="w-[32px] h-[32px] rounded-[8px] bg-[#f4f5f6] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        <ImageWithFallback src={p.image} alt={p.name} className="w-[78%] h-[78%] object-contain" />
                                    </div>

                                    {/* Name + inline flag */}
                                    <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                        <p className="text-[11.5px] font-semibold text-[#1A1A1A]/70 truncate text-[12px]">{p.name}</p>
                                        {isCritical && (
                                            <span className="text-[8px] font-bold text-[#e74444]/55 flex-shrink-0">Low</span>
                                        )}
                                    </div>

                                    {p.status === 'active' ? (
                                        <div className="flex items-center gap-0 flex-shrink-0">
                                            {/* Sample count - showing all possibilities across 3 products */}
                                            {(() => {
                                                let sampleCount, needsPickup, colorClass, urgency;
                                                
                                                // Force different scenarios: Product 1=8 samples, Product 2=2 critical, Product 3=checkmark
                                                if (p.id === 1) {
                                                    sampleCount = 8;
                                                    colorClass = 'text-[#0171E3]/55';
                                                    urgency = 'good';
                                                    needsPickup = true;
                                                } else if (p.id === 2) {
                                                    sampleCount = 2;
                                                    colorClass = 'text-[#e74444]/65';
                                                    urgency = 'critical';
                                                    needsPickup = true;
                                                } else if (p.id === 3) {
                                                    sampleCount = '✓';
                                                    needsPickup = false;
                                                } else if (p.inWarehouse > 10) {
                                                    sampleCount = '✓';
                                                    needsPickup = false;
                                                } else {
                                                    sampleCount = 5;
                                                    colorClass = 'text-[#e67e22]/60';
                                                    urgency = 'low';
                                                    needsPickup = true;
                                                }
                                                
                                                return (
                                                    <div className="flex items-center justify-end gap-1 min-w-[42px]">
                                                        {needsPickup ? (
                                                            <>
                                                                <span className={`text-[9.5px] font-bold tabular-nums ${colorClass}`}>
                                                                    {sampleCount}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        bounce(e.currentTarget);
                                                                        toast(`Sample pickup • ${p.name}`, { 
                                                                            description: `${sampleCount} sample${sampleCount > 1 ? 's' : ''} at Vehsl — requesting pickup`,
                                                                            icon: urgency === 'critical' ? '🚨' : '📦'
                                                                        });
                                                                    }}
                                                                    className="flex items-center justify-center w-[15px] h-[15px] rounded-full border-none cursor-pointer transition-all hover:scale-110"
                                                                    style={{
                                                                        background: urgency === 'critical' 
                                                                            ? 'rgba(231,68,68,0.1)' 
                                                                            : urgency === 'low'
                                                                            ? 'rgba(230,126,34,0.08)'
                                                                            : 'rgba(1,113,227,0.08)',
                                                                    }}
                                                                    title={`${sampleCount} sample${sampleCount > 1 ? 's' : ''} available — tap to request pickup`}
                                                                >
                                                                    <Plus 
                                                                        size={8} 
                                                                        strokeWidth={3} 
                                                                        className={
                                                                            urgency === 'critical' 
                                                                                ? 'text-[#e74444]/70' 
                                                                                : urgency === 'low'
                                                                                ? 'text-[#e67e22]/70'
                                                                                : 'text-[#0171E3]/70'
                                                                        } 
                                                                    />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-[#2eaa57]/40" title="Using warehouse stock for samples">✓</span>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            {/* Stock count */}
                                            <span className={`hidden sm:inline text-[10px] tabular-nums text-right ${isCritical ? 'text-[#e74444]/40' : 'text-[#1A1A1A]/18'}`} style={{ width: 32 }}>{p.inWarehouse.toLocaleString()}</span>

                                            {/* Rating */}
                                            <span className="hidden md:flex items-center justify-end gap-0.5 w-[38px] flex-shrink-0">
                                                <Star size={8} fill={(p.rating ?? 0) > 0 ? '#f5a623' : 'none'} className={(p.rating ?? 0) > 0 ? 'text-[#f5a623]/70' : 'text-[#1A1A1A]/10'} />
                                                <span className={`text-[9.5px] tabular-nums ${(p.rating ?? 0) > 0 ? 'text-[#1A1A1A]/25' : 'text-[#1A1A1A]/12'}`}>{(p.rating ?? 0).toFixed(2)}</span>
                                            </span>

                                            {/* Price */}
                                            <span className="text-[11px] font-bold text-[#1A1A1A]/25 tabular-nums text-right w-[38px] flex-shrink-0">{fmt(p.price)}</span>

                                            {/* iOS-style live toggle */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setToggleProductId(p.id);
                                                    setTogglePassword('');
                                                    setToggleError(false);
                                                }}
                                                className="flex-shrink-0 cursor-pointer border-none p-0 relative ml-1"
                                                style={{
                                                    width: 34,
                                                    height: 20,
                                                    borderRadius: 10,
                                                    background: p.isOnline ? '#2eaa57' : 'rgba(26,26,26,0.08)',
                                                    transition: 'background 0.25s ease',
                                                }}
                                                title={p.isOnline ? 'Live — tap to delist (pending orders unaffected)' : 'Delisted — tap to go live'}
                                            >
                                                <div
                                                    className="absolute top-[2px] rounded-full"
                                                    style={{
                                                        width: 16,
                                                        height: 16,
                                                        background: '#fff',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.15), 0 1px 1px rgba(0,0,0,0.06)',
                                                        left: p.isOnline ? 16 : 2,
                                                        transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    }}
                                                />
                                            </button>
                                        </div>
                                    ) : isPending ? (
                                        /* Simple "Under review" badge — no pipeline detail */
                                        <div
                                            className="flex items-center gap-1.5 px-2.5 py-[3px] rounded-full flex-shrink-0"
                                            style={{ background: 'rgba(230,126,34,0.06)' }}
                                        >
                                            <Clock size={8} strokeWidth={2.5} className="text-[#e67e22]/40" />
                                            <span className="text-[8.5px] font-bold text-[#e67e22]/50">Under review</span>
                                        </div>
                                    ) : isReady ? (
                                        /* Approved — single CTA for testing & pickup payment */
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                bounce(e.currentTarget);
                                                setPaymentProductId(p.id);
                                                setPaymentStep('methods');
                                                setSelectedPayMethod(null);
                                                setCardNumber('');
                                                setCardExpiry('');
                                                setCardCvv('');
                                            }}
                                            className="flex items-center gap-2 px-4 py-[7px] rounded-full border-none cursor-pointer flex-shrink-0"
                                            style={{
                                                background: '#0171E3',
                                                boxShadow: '0 1px 4px rgba(1,113,227,0.25), 0 3px 8px -2px rgba(1,113,227,0.18)',
                                            }}
                                        >
                                            <CreditCard size={13} strokeWidth={2.5} className="text-white/90" />
                                            <span className="text-[12px] font-bold text-white/95">Pay {fmt(Math.round((p.price * 0.12 + 45 + 12.5) * 100) / 100)}</span>
                                        </motion.button>
                                    ) : (
                                        <div
                                            className="flex-shrink-0 rounded-[10px] flex items-center justify-center"
                                            style={{ width: 34, height: 20, background: 'rgba(26,26,26,0.04)' }}
                                        >
                                            <Clock size={9} strokeWidth={2.5} className="text-[#1A1A1A]/15" />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        });
                    })()}
                </div>

                {/* ── Testing & Pickup Payment Sheet ── */}
                <AnimatePresence>
                    <PaymentSheet
                        paymentProductId={paymentProductId}
                        products={products}
                        paymentStep={paymentStep}
                        selectedPayMethod={selectedPayMethod}
                        cardNumber={cardNumber}
                        cardExpiry={cardExpiry}
                        cardCvv={cardCvv}
                        setPaymentProductId={setPaymentProductId}
                        setPaymentStep={setPaymentStep}
                        setSelectedPayMethod={setSelectedPayMethod}
                        setCardNumber={setCardNumber}
                        setCardExpiry={setCardExpiry}
                        setCardCvv={setCardCvv}
                        setProducts={setProducts}
                    />
                </AnimatePresence>
            </motion.div>

            {/* ═══════════════════════════════════════ */}
            {/*  IN PROGRESS — with pending payment     */}
            {/* ═══════════════════════════════════════ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.55, ease: EASE }}
                className="mt-10 mb-5"
            >
                <div className="flex items-center justify-between mb-4 px-1">
                    <p className="text-[12px] font-semibold text-[#1A1A1A]/30">
                        In transit
                    </p>
                </div>
                <div className="rounded-[22px] bg-white/40 backdrop-blur-md border border-white/40 overflow-hidden" style={{ boxShadow: GLASS }}>
                    {[
                        { id: 't1', item: 'Wireless NC Headphones', image: PRODUCTS.headphones, qty: 150, unitPrice: 269, dest: 'New York, USA', daysLeft: 3, orderRef: '#8PLQ221M' },
                        { id: 't2', item: 'Aluminum Laptop Stand', image: PRODUCTS.stand, qty: 300, unitPrice: 45, dest: 'Berlin, DE', daysLeft: 9, orderRef: '#2VNR883K' },
                    ].map((track, i) => (
                        <div key={track.id} className={`flex items-center gap-4 p-4 ${i !== 0 ? 'border-t border-black/[0.04]' : ''}`}>
                            <div className="w-[36px] h-[36px] rounded-[10px] bg-[#f4f5f6] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                <ImageWithFallback src={track.image} alt={track.item} className="w-[80%] h-[80%] object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-[#1A1A1A]/85 truncate">{track.item} <span className="font-medium text-[#1A1A1A]/40">({track.qty})</span></p>
                                <p className="text-[11px] font-medium text-[#1A1A1A]/35 mt-0.5">
                                    {track.orderRef} &middot; {track.dest}
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-[14px] font-black text-[#1A1A1A]/85 tabular-nums leading-none mb-1">{fmt(track.qty * track.unitPrice)}</p>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tabular-nums tracking-wider" style={{ background: 'rgba(1,113,227,0.08)', color: 'rgba(1,113,227,0.7)' }}>
                                    {track.daysLeft}d to release
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ═══════════════════════════════════════ */}
            {/*  NEW LISTING REQUEST FORM               */}
            {/* ════════════════════���══════════════════ */}
            <AnimatePresence>
                {showListingForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-5"
                        style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)' }}
                        onClick={(e) => { if (e.target === e.currentTarget) setShowListingForm(false); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 5 }}
                            transition={{ duration: 0.3, ease: EASE }}
                            className="w-full max-w-[90vw] sm:max-w-[440px] rounded-[24px] bg-white/95 backdrop-blur-2xl border border-white/40 overflow-hidden max-h-[90vh] flex flex-col mx-4"
                            style={{ boxShadow: '0 24px 80px -12px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
                        >
                            {/* Sticky header */}
                            <div className="px-5 md:px-6 pt-5 md:pt-6 pb-3 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[18px] font-bold text-[#1A1A1A]/85">
                                            List a new product
                                        </p>
                                        <p className="text-[11px] font-medium text-[#1A1A1A]/30 mt-0.5">Fill in the details and we'll review within 48h</p>
                                    </div>
                                    <button
                                        onClick={() => setShowListingForm(false)}
                                        className="w-[30px] h-[30px] rounded-full bg-black/[0.04] flex items-center justify-center border-none cursor-pointer hover:bg-black/[0.07] transition-colors"
                                    >
                                        <X size={14} color="rgba(26,26,26,0.4)" />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable form body */}
                            <div
                                className="flex-1 overflow-y-auto px-5 md:px-6 pb-5 md:pb-6"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                            >
                                <style>{`.listing-scroll::-webkit-scrollbar { display: none; }`}</style>

                                {/* ── Section: Product Info ── */}
                                <div className="mb-5">
                                    <p className="text-[10px] font-bold text-[#0171E3]/60 uppercase tracking-[0.08em] mb-3">Product Info</p>

                                    {/* Product name + Price */}
                                    <div className="grid grid-cols-1 sm:grid-cols-[1fr,110px] gap-3 mb-3">
                                        <div>
                                            <label className="text-[11px] font-semibold text-[#1A1A1A]/35 block mb-1.5">
                                                Product name
                                            </label>
                                            <input
                                                placeholder="e.g. Handwoven Silk Scarf"
                                                className="w-full px-4 py-2.5 rounded-[12px] border border-black/[0.06] bg-white/80 text-[13px] font-medium text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/20 outline-none focus:border-[#0171E3]/30 focus:ring-[2px] focus:ring-[#0171E3]/8 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-[#1A1A1A]/35 block mb-1.5">
                                                Price / unit
                                            </label>
                                            <input
                                                placeholder="$0.00"
                                                type="number"
                                                value={priceBrackets[0].price}
                                                onChange={(e) => setPriceBrackets([{ ...priceBrackets[0], price: e.target.value }])}
                                                className="w-full px-4 py-2.5 rounded-[12px] border border-black/[0.06] bg-white/80 text-[13px] font-medium text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/20 outline-none focus:border-[#0171E3]/30 focus:ring-[2px] focus:ring-[#0171E3]/8 transition-all tabular-nums"
                                            />
                                            {priceBrackets.length === 1 && (
                                                <button
                                                    onClick={() => setPriceBrackets([
                                                        { id: '1', minQty: '1', maxQty: '', price: priceBrackets[0].price },
                                                        { id: '2', minQty: '', maxQty: '', price: '' }
                                                    ])}
                                                    className="mt-1.5 text-[10px] font-semibold text-[#0171E3]/50 hover:text-[#0171E3] transition-colors"
                                                >
                                                    + Volume discount
                                                </button>
                                            )}
                                            <AnimatePresence>
                                                {priceBrackets.length > 1 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.2, ease: EASE }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="mt-2 p-2.5 rounded-[10px] bg-[#0171E3]/[0.02] border border-[#0171E3]/[0.08] space-y-1.5">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <p className="text-[10px] font-semibold text-[#0171E3]/60">Volume Discount</p>
                                                                <button
                                                                    onClick={() => setPriceBrackets([{ id: '1', minQty: '1', maxQty: '', price: priceBrackets[0].price }])}
                                                                    className="text-[9px] font-semibold text-[#1A1A1A]/30 hover:text-[#1A1A1A]/50 transition-colors"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[11px] text-[#1A1A1A]/40">
                                                                <span className="font-medium">Buy</span>
                                                                <input
                                                                    placeholder="100"
                                                                    type="number"
                                                                    value={priceBrackets[1].minQty}
                                                                    onChange={(e) => {
                                                                        const updated = [...priceBrackets];
                                                                        updated[1].minQty = e.target.value;
                                                                        setPriceBrackets(updated);
                                                                    }}
                                                                    className="w-16 px-2 py-1.5 rounded-[8px] border border-black/[0.06] bg-white text-[11px] font-semibold text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/20 outline-none focus:border-[#0171E3]/30 transition-all tabular-nums text-center"
                                                                />
                                                                <span className="font-medium">+ for</span>
                                                                <input
                                                                    placeholder="$0.00"
                                                                    type="number"
                                                                    value={priceBrackets[1].price}
                                                                    onChange={(e) => {
                                                                        const updated = [...priceBrackets];
                                                                        updated[1].price = e.target.value;
                                                                        setPriceBrackets(updated);
                                                                    }}
                                                                    className="flex-1 px-2 py-1.5 rounded-[8px] border border-black/[0.06] bg-white text-[11px] font-semibold text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/20 outline-none focus:border-[#0171E3]/30 transition-all tabular-nums text-center"
                                                                />
                                                                <span className="font-medium">each</span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="mb-3">
                                        <label className="text-[11px] font-semibold text-[#1A1A1A]/35 block mb-1.5">
                                            Description
                                        </label>
                                        <textarea
                                            placeholder="Materials, dimensions, colors available..."
                                            rows={2}
                                            className="w-full px-4 py-2.5 rounded-[12px] border border-black/[0.06] bg-white/80 text-[13px] font-medium text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/20 outline-none focus:border-[#0171E3]/30 focus:ring-[2px] focus:ring-[#0171E3]/8 transition-all resize-none"
                                        />
                                    </div>
                                    
                                    {/* Capacity + Sample date */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[11px] font-semibold text-[#1A1A1A]/35 block mb-1.5">
                                                Weekly Capacity
                                            </label>
                                            <div className="relative">
                                                <input
                                                    placeholder="e.g. 500"
                                                    type="number"
                                                    className="w-full pl-4 pr-10 py-2.5 rounded-[12px] border border-black/[0.06] bg-white/80 text-[13px] font-medium text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/20 outline-none focus:border-[#0171E3]/30 focus:ring-[2px] focus:ring-[#0171E3]/8 transition-all tabular-nums"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#1A1A1A]/30 uppercase">Units</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-[#1A1A1A]/35 block mb-1.5">
                                                Sample Ready By
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full px-4 py-2.5 rounded-[12px] border border-black/[0.06] bg-white/80 text-[13px] font-medium text-[#1A1A1A]/75 outline-none focus:border-[#0171E3]/30 focus:ring-[2px] focus:ring-[#0171E3]/8 transition-all"
                                                style={{ colorScheme: 'light' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-black/[0.04] mb-5" />

                                {/* ── Section: Photos ── */}
                                <div className="mb-5">
                                    <p className="text-[10px] font-bold text-[#0171E3]/60 uppercase tracking-[0.08em] mb-3">Photos</p>
                                    <div
                                        className="flex items-center gap-3 px-4 py-3.5 rounded-[14px] border-2 border-dashed border-[#0171E3]/[0.12] cursor-pointer transition-all hover:border-[#0171E3]/25 hover:bg-[#0171E3]/[0.02]"
                                        onClick={() => toast('Camera opening...', { description: 'Take photos of your product' })}
                                    >
                                        <div className="w-[34px] h-[34px] rounded-full bg-[#0171E3]/[0.06] flex items-center justify-center flex-shrink-0">
                                            <Camera size={16} color="#0171E3" strokeWidth={2} style={{ opacity: 0.5 }} />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-semibold text-[#1A1A1A]/50">Add product photos</p>
                                            <p className="text-[10px] font-medium text-[#1A1A1A]/25 mt-0.5">Tap to take or upload — reviewed for compliance</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-black/[0.04] mb-5" />

                                {/* ── Section: Variations ── */}
                                <div className="mb-5">
                                    <p className="text-[10px] font-bold text-[#0171E3]/60 uppercase tracking-[0.08em] mb-3">Variations</p>
                                    <div className="space-y-2">
                                        {listingVariations.map((v) => (
                                            <div key={v.id} className="flex items-center gap-2">
                                                <select
                                                    value={v.type}
                                                    onChange={e => setListingVariations(prev => prev.map(x => x.id === v.id ? { ...x, type: e.target.value } : x))}
                                                    className="w-[100px] px-3 py-2.5 rounded-[10px] border border-black/[0.06] bg-white/80 text-[12px] font-medium text-[#1A1A1A]/65 outline-none focus:border-[#0171E3]/30 transition-colors cursor-pointer appearance-none"
                                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(26,26,26,0.3)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                                                >
                                                    <option value="Color">Color</option>
                                                    <option value="Size">Size</option>
                                                    <option value="Material">Material</option>
                                                    <option value="Style">Style</option>
                                                    <option value="Weight">Weight</option>
                                                    <option value="Pack">Pack Size</option>
                                                </select>
                                                <input
                                                    value={v.value}
                                                    onChange={e => setListingVariations(prev => prev.map(x => x.id === v.id ? { ...x, value: e.target.value } : x))}
                                                    placeholder={v.type === 'Color' ? 'e.g. Red, Blue, Green' : v.type === 'Size' ? 'e.g. S, M, L, XL' : 'e.g. Option 1, Option 2'}
                                                    className="flex-1 px-3 py-2.5 rounded-[10px] border border-black/[0.06] bg-white/80 text-[12px] font-medium text-[#1A1A1A]/65 placeholder:text-[#1A1A1A]/20 outline-none focus:border-[#0171E3]/30 transition-colors"
                                                />
                                                <button
                                                    onClick={() => setListingVariations(prev => prev.filter(x => x.id !== v.id))}
                                                    className="w-[28px] h-[28px] rounded-full bg-black/[0.03] flex items-center justify-center border-none cursor-pointer hover:bg-red-50 transition-colors flex-shrink-0"
                                                >
                                                    <Trash2 size={12} color="rgba(26,26,26,0.25)" />
                                                </button>
                                            </div>
                                        ))}
                                        <div
                                            onClick={() => setListingVariations(prev => [...prev, { id: `var_${Date.now()}`, type: 'Color', value: '' }])}
                                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px] border border-dashed border-[#0171E3]/[0.12] cursor-pointer transition-all hover:border-[#0171E3]/25 hover:bg-[#0171E3]/[0.02]"
                                        >
                                            <div className="w-[24px] h-[24px] rounded-full bg-[#0171E3]/[0.06] flex items-center justify-center flex-shrink-0">
                                                <Plus size={11} color="#0171E3" strokeWidth={2.5} style={{ opacity: 0.5 }} />
                                            </div>
                                            <p className="text-[12px] font-semibold text-[#0171E3]/40">Add variation (color, size, etc.)</p>
                                        </div>
                                        {listingVariations.length > 0 && (
                                            <p className="text-[10px] font-medium text-[#1A1A1A]/25 px-1">Separate options with commas</p>
                                        )}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-black/[0.04] mb-5" />
                                
                                {/* ── Section: Pickup Location ── */}
                                <div className="mb-5">
                                    <p className="text-[10px] font-bold text-[#0171E3]/60 uppercase tracking-[0.08em] mb-1">Pickup Location</p>
                                    <p className="text-[10px] font-medium text-[#1A1A1A]/25 mb-3">Where should our courier collect orders?</p>
                                    <div className="space-y-1.5">
                                        {/* Factory address */}
                                        <div
                                            onClick={() => { setListingPickupLocation('factory'); setShowAddAddress(false); }}
                                            className={`flex items-center gap-3 px-3.5 py-3 rounded-[12px] cursor-pointer transition-all ${listingPickupLocation === 'factory' ? 'bg-[#0171E3]/[0.05] border border-[#0171E3]/[0.15]' : 'bg-white/60 border border-black/[0.04] hover:border-black/[0.08]'}`}
                                        >
                                            <div className={`w-[30px] h-[30px] rounded-[10px] flex items-center justify-center flex-shrink-0 ${listingPickupLocation === 'factory' ? 'bg-[#0171E3]/[0.1]' : 'bg-black/[0.03]'}`}>
                                                <Factory size={14} color={listingPickupLocation === 'factory' ? '#0171E3' : 'rgba(26,26,26,0.25)'} strokeWidth={2} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[12px] font-semibold ${listingPickupLocation === 'factory' ? 'text-[#1A1A1A]/80' : 'text-[#1A1A1A]/40'}`}>Factory Address</p>
                                                <p className="text-[10px] font-medium text-[#1A1A1A]/25 mt-0.5 truncate">14 Industrial Zone B, Dongguan, GD 523000</p>
                                            </div>
                                            <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${listingPickupLocation === 'factory' ? 'border-[#0171E3] bg-[#0171E3]' : 'border-black/[0.12]'}`}>
                                                {listingPickupLocation === 'factory' && <Check size={10} color="white" strokeWidth={3} />}
                                            </div>
                                        </div>
                                        {/* Home address */}
                                        <div
                                            onClick={() => { setListingPickupLocation('home'); setShowAddAddress(false); }}
                                            className={`flex items-center gap-3 px-3.5 py-3 rounded-[12px] cursor-pointer transition-all ${listingPickupLocation === 'home' ? 'bg-[#0171E3]/[0.05] border border-[#0171E3]/[0.15]' : 'bg-white/60 border border-black/[0.04] hover:border-black/[0.08]'}`}
                                        >
                                            <div className={`w-[30px] h-[30px] rounded-[10px] flex items-center justify-center flex-shrink-0 ${listingPickupLocation === 'home' ? 'bg-[#0171E3]/[0.1]' : 'bg-black/[0.03]'}`}>
                                                <Home size={14} color={listingPickupLocation === 'home' ? '#0171E3' : 'rgba(26,26,26,0.25)'} strokeWidth={2} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[12px] font-semibold ${listingPickupLocation === 'home' ? 'text-[#1A1A1A]/80' : 'text-[#1A1A1A]/40'}`}>Home Address</p>
                                                <p className="text-[10px] font-medium text-[#1A1A1A]/25 mt-0.5 truncate">88 Riverside Rd, Apt 12B, Shenzhen, GD 518000</p>
                                            </div>
                                            <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${listingPickupLocation === 'home' ? 'border-[#0171E3] bg-[#0171E3]' : 'border-black/[0.12]'}`}>
                                                {listingPickupLocation === 'home' && <Check size={10} color="white" strokeWidth={3} />}
                                            </div>
                                        </div>
                                        {/* Saved custom addresses */}
                                        {savedAddresses.map(addr => (
                                            <div
                                                key={addr.id}
                                                onClick={() => { setListingPickupLocation(addr.id); setShowAddAddress(false); }}
                                                className={`flex items-center gap-3 px-3.5 py-3 rounded-[12px] cursor-pointer transition-all ${listingPickupLocation === addr.id ? 'bg-[#0171E3]/[0.05] border border-[#0171E3]/[0.15]' : 'bg-white/60 border border-black/[0.04] hover:border-black/[0.08]'}`}
                                            >
                                                <div className={`w-[30px] h-[30px] rounded-[10px] flex items-center justify-center flex-shrink-0 ${listingPickupLocation === addr.id ? 'bg-[#0171E3]/[0.1]' : 'bg-black/[0.03]'}`}>
                                                    <MapPin size={14} color={listingPickupLocation === addr.id ? '#0171E3' : 'rgba(26,26,26,0.25)'} strokeWidth={2} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-[12px] font-semibold ${listingPickupLocation === addr.id ? 'text-[#1A1A1A]/80' : 'text-[#1A1A1A]/40'}`}>{addr.label}</p>
                                                    <p className="text-[10px] font-medium text-[#1A1A1A]/25 mt-0.5 truncate">{addr.address}</p>
                                                </div>
                                                <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${listingPickupLocation === addr.id ? 'border-[#0171E3] bg-[#0171E3]' : 'border-black/[0.12]'}`}>
                                                    {listingPickupLocation === addr.id && <Check size={10} color="white" strokeWidth={3} />}
                                                </div>
                                            </div>
                                        ))}
                                        {/* Add new address */}
                                        <AnimatePresence>
                                            {showAddAddress ? (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2, ease: EASE }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-3 rounded-[12px] border border-[#0171E3]/[0.12] bg-[#0171E3]/[0.02] space-y-2 mt-1">
                                                        <input
                                                            value={newAddressLabel}
                                                            onChange={e => setNewAddressLabel(e.target.value)}
                                                            placeholder="Label (e.g. Warehouse #2)"
                                                            className="w-full px-3 py-2 rounded-[10px] border border-black/[0.06] bg-white/80 text-[12px] font-medium text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/20 outline-none focus:border-[#0171E3]/30 transition-colors"
                                                        />
                                                        <input
                                                            value={newAddressValue}
                                                            onChange={e => setNewAddressValue(e.target.value)}
                                                            placeholder="Full address"
                                                            className="w-full px-3 py-2 rounded-[10px] border border-black/[0.06] bg-white/80 text-[12px] font-medium text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/20 outline-none focus:border-[#0171E3]/30 transition-colors"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => { setShowAddAddress(false); setNewAddressLabel(''); setNewAddressValue(''); }}
                                                                className="flex-1 py-2 rounded-[10px] border border-black/[0.06] bg-white/60 text-[11px] font-semibold text-[#1A1A1A]/40 cursor-pointer hover:bg-white/80 transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (newAddressLabel.trim() && newAddressValue.trim()) {
                                                                        const id = `addr_${Date.now()}`;
                                                                        setSavedAddresses(prev => [...prev, { id, label: newAddressLabel.trim(), address: newAddressValue.trim() }]);
                                                                        setListingPickupLocation(id);
                                                                        setShowAddAddress(false);
                                                                        setNewAddressLabel('');
                                                                        setNewAddressValue('');
                                                                        toast.success('Address saved');
                                                                    }
                                                                }}
                                                                className="flex-1 py-2 rounded-[10px] border-none text-[11px] font-semibold text-white cursor-pointer"
                                                                style={{ background: '#0171E3' }}
                                                            >
                                                                Save Address
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <div
                                                    onClick={() => setShowAddAddress(true)}
                                                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] border border-dashed border-[#0171E3]/[0.12] cursor-pointer transition-all hover:border-[#0171E3]/25 hover:bg-[#0171E3]/[0.02]"
                                                >
                                                    <div className="w-[30px] h-[30px] rounded-[10px] bg-[#0171E3]/[0.04] flex items-center justify-center flex-shrink-0">
                                                        <Plus size={13} color="#0171E3" strokeWidth={2.5} style={{ opacity: 0.4 }} />
                                                    </div>
                                                    <p className="text-[12px] font-semibold text-[#0171E3]/40">Add a new pickup address</p>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-black/[0.04] mb-5" />

                                {/* ── Section: Legal ── */}
                                <div className="mb-4">
                                    <div
                                        onClick={() => setListingLegalExpanded(!listingLegalExpanded)}
                                        className="flex items-center gap-2.5 cursor-pointer select-none mb-2"
                                    >
                                        <ShieldAlert size={13} color="rgba(140,20,20,0.5)" strokeWidth={2.5} className="flex-shrink-0" />
                                        <p className="text-[10px] font-bold text-[#6B1A1A]/60 uppercase tracking-[0.06em] flex-1">Seller Liability Notice</p>
                                        <ChevronDown
                                            size={12}
                                            color="rgba(26,26,26,0.3)"
                                            className="flex-shrink-0 transition-transform"
                                            style={{ transform: listingLegalExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                        />
                                    </div>
                                    
                                    {/* Summary always visible */}
                                    <p className="text-[10px] font-medium text-[#1A1A1A]/40 leading-[1.6] mb-2">
                                        You are <span className="font-semibold text-[#6B1A1A]/60">solely responsible</span> for the legality and safety of your products. Vehsl is <span className="font-semibold text-[#6B1A1A]/60">fully indemnified</span> against all claims and damages.
                                    </p>

                                    {/* Expandable details */}
                                    <AnimatePresence>
                                        {listingLegalExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2, ease: EASE }}
                                                className="overflow-hidden"
                                            >
                                                <div className="rounded-[12px] px-3.5 py-3 space-y-2" style={{ background: 'rgba(140,20,20,0.025)', border: '1px solid rgba(120,30,30,0.06)' }}>
                                                    <p className="text-[10px] font-medium text-[#1A1A1A]/45 leading-[1.65]">
                                                        By listing on Vehsl, you assume <span className="font-bold text-[#6B1A1A]/70">sole and complete liability</span> for every item's legality, safety, authenticity, and regulatory compliance. This includes:
                                                    </p>
                                                    <ul className="text-[10px] font-medium text-[#1A1A1A]/45 leading-[1.65] list-none space-y-1 pl-0">
                                                        <li className="flex items-start gap-1.5">
                                                            <span className="text-[#6B1A1A]/40 flex-shrink-0 mt-px">•</span>
                                                            <span><span className="font-bold text-[#6B1A1A]/70">Counterfeit goods</span>, prohibited substances, and sanctioned materials</span>
                                                        </li>
                                                        <li className="flex items-start gap-1.5">
                                                            <span className="text-[#6B1A1A]/40 flex-shrink-0 mt-px">•</span>
                                                            <span>Products causing <span className="font-bold text-[#6B1A1A]/70">bodily harm</span>, property damage, or financial loss</span>
                                                        </li>
                                                        <li className="flex items-start gap-1.5">
                                                            <span className="text-[#6B1A1A]/40 flex-shrink-0 mt-px">•</span>
                                                            <span>Misrepresented capacity, origin, or certifications</span>
                                                        </li>
                                                    </ul>
                                                    <p className="text-[10px] font-medium text-[#1A1A1A]/45 leading-[1.65]">
                                                        <span className="font-bold text-[#6B1A1A]/70">Vehsl bears no liability</span> for seller-listed products. You agree to fully indemnify Vehsl, its affiliates, and employees. Violations result in <span className="font-bold text-[#6B1A1A]/70">permanent suspension</span>, asset freezing, and law enforcement referral.
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Acknowledgment checkbox */}
                                <label className="flex items-start gap-2.5 mb-1 cursor-pointer select-none">
                                    <input type="checkbox" className="mt-0.5 w-[15px] h-[15px] rounded-[4px] border-2 border-black/[0.12] accent-[#0171E3] cursor-pointer flex-shrink-0" />
                                    <span className="text-[10px] font-medium text-[#1A1A1A]/45 leading-[1.6]">
                                        I confirm all information is truthful, my products comply with all applicable laws, and I accept <span className="font-semibold text-[#1A1A1A]/60">sole liability</span> — fully indemnifying Vehsl against all claims and damages.
                                    </span>
                                </label>
                            </div>

                            {/* Sticky submit footer */}
                            <div className="px-5 md:px-6 pb-5 md:pb-6 pt-3 flex-shrink-0 border-t border-black/[0.04]">
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.975 }}
                                    onClick={(e) => {
                                        bounce(e.currentTarget);
                                        setShowListingForm(false);
                                        setProducts(prev => [...prev, {
                                            id: `p${Date.now()}`,
                                            name: 'New Product',
                                            image: PRODUCTS.vase,
                                            price: 0,
                                            status: 'review' as const,
                                            sold: 0,
                                            inWarehouse: 0,
                                            inTransit: 0,
                                            isOnline: false
                                        }]);
                                        toast.success('Listing submitted!', {
                                            description: 'We\'ll review and publish within 48 hours',
                                        });
                                    }}
                                    className="w-full py-3.5 rounded-full border-none cursor-pointer flex items-center justify-center gap-2"
                                    style={{
                                        background: '#0171E3',
                                        color: '#fff',
                                        boxShadow: '0 2px 8px rgba(1,113,227,0.2), 0 8px 20px -8px rgba(1,113,227,0.3)',
                                    }}
                                >
                                    <Upload size={14} strokeWidth={2.5} />
                                    <span className="text-[13px] font-bold">Submit for Review</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Password confirmation modal for product toggle ── */}
            <AnimatePresence>
                {toggleProductId && (() => {
                    const targetProduct = products.find(pr => pr.id === toggleProductId);
                    if (!targetProduct) return null;
                    const goingOnline = !targetProduct.isOnline;
                    return (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-5"
                            style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)' }}
                            onClick={(e) => { if (e.target === e.currentTarget) { setToggleProductId(null); setTogglePassword(''); setToggleError(false); } }}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.97, y: 5 }}
                                transition={{ duration: 0.3, ease: EASE }}
                                className="w-full max-w-[90vw] sm:max-w-[360px] rounded-[22px] bg-white/95 backdrop-blur-2xl border border-white/40 overflow-hidden mx-4"
                                style={{ boxShadow: '0 24px 80px -12px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
                            >
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ background: goingOnline ? 'rgba(46,170,87,0.08)' : 'rgba(26,26,26,0.05)' }}
                                        >
                                            <Power size={16} color={goingOnline ? '#2eaa57' : 'rgba(26,26,26,0.4)'} strokeWidth={2} />
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-bold text-[#1A1A1A]/85">
                                                {goingOnline ? 'Put product live?' : 'Take product offline?'}
                                            </p>
                                            <p className="text-[12px] font-medium text-[#1A1A1A]/40 mt-0.5">
                                                {targetProduct.name}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-[12px] font-medium text-[#1A1A1A]/45 mb-4 leading-relaxed">
                                        {goingOnline 
                                            ? 'This product will become visible to all buyers. Enter your password to confirm.'
                                            : 'Buyers will no longer be able to see or order this product. Enter your password to confirm.'
                                        }
                                    </p>

                                    <input
                                        type="password"
                                        value={togglePassword}
                                        onChange={(e) => { setTogglePassword(e.target.value); setToggleError(false); }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && togglePassword.length >= 4) {
                                                setProducts(prev => prev.map(pr => pr.id === toggleProductId ? { ...pr, isOnline: !pr.isOnline } : pr));
                                                toast.success(goingOnline ? `${targetProduct.name} is now live` : `${targetProduct.name} is now offline`, {
                                                    description: goingOnline ? 'Product is visible to buyers' : 'Buyers can no longer see this product',
                                                });
                                                setToggleProductId(null);
                                                setTogglePassword('');
                                                setToggleError(false);
                                            } else if (e.key === 'Enter') {
                                                setToggleError(true);
                                            }
                                        }}
                                        placeholder="Enter your password"
                                        className={`w-full px-4 py-3 rounded-[12px] border bg-white/80 text-[13px] font-medium text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/20 outline-none transition-colors ${
                                            toggleError ? 'border-[#ff3b30]/30 bg-[#ff3b30]/[0.02]' : 'border-black/[0.06] focus:border-[#0071e3]/30'
                                        }`}
                                        autoFocus
                                    />
                                    {toggleError && (
                                        <p className="text-[11px] font-medium text-[#ff3b30] mt-1.5 px-1">Password is required</p>
                                    )}

                                    <div className="flex items-center gap-2 mt-5">
                                        <button
                                            onClick={() => { setToggleProductId(null); setTogglePassword(''); setToggleError(false); }}
                                            className="flex-1 py-2.5 rounded-full cursor-pointer text-[13px] font-semibold text-[#1A1A1A]/50 bg-transparent border border-black/[0.08]"
                                        >
                                            Cancel
                                        </button>
                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => {
                                                if (togglePassword.length < 4) {
                                                    setToggleError(true);
                                                    return;
                                                }
                                                setProducts(prev => prev.map(pr => pr.id === toggleProductId ? { ...pr, isOnline: !pr.isOnline } : pr));
                                                toast.success(goingOnline ? `${targetProduct.name} is now live` : `${targetProduct.name} is now offline`, {
                                                    description: goingOnline ? 'Product is visible to buyers' : 'Buyers can no longer see this product',
                                                });
                                                setToggleProductId(null);
                                                setTogglePassword('');
                                                setToggleError(false);
                                            }}
                                            className="flex-1 py-2.5 rounded-full border-none cursor-pointer text-[13px] font-bold text-white"
                                            style={{
                                                background: goingOnline ? '#2eaa57' : '#1A1A1A',
                                                boxShadow: goingOnline ? '0 2px 8px rgba(46,170,87,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
                                                opacity: togglePassword.length >= 4 ? 1 : 0.5,
                                            }}
                                        >
                                            {goingOnline ? 'Go Live' : 'Take Offline'}
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
}
