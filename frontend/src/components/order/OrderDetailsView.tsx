"use client";

import React, { useMemo, useState } from 'react';
import type { ApiOrder, ApiOrderItem } from './order-types';
import { Copy, CheckCircle2, MapPin, CreditCard, Phone, Package as PackageIcon, Ban, FlaskConical, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '@/components/order/figma/ImageWithFallback';
import { toast } from 'sonner';
import { fmtMoney as fmtMoneyUtil } from '@/lib/utils';
import svgPaths from './imports/svg-qnvxk449z7';

// --- Action Button Icons from Figma ---

function DownloadIcon() {
    return (
        <svg className="size-4" fill="none" viewBox="0 0 16 16">
            <path d={svgPaths.p23ad1400} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
            <path d={svgPaths.p32d65340} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
            <path d="M8 10V2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </svg>
    );
}

function PrintIcon() {
    return (
        <svg className="size-4" fill="none" viewBox="0 0 16 16">
            <path d={svgPaths.p3c7aa800} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
            <path d={svgPaths.p2f5569c0} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
            <path d={svgPaths.pffd0140} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </svg>
    );
}

function HelpIcon() {
    return (
        <svg className="size-4" fill="none" viewBox="0 0 16 16">
            <path d={svgPaths.p1db87e00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
            <path d={svgPaths.ped3e900} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
            <path d="M8 11.332H8.00667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </svg>
    );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            title={label}
            className="group relative size-[34px] rounded-full bg-white/60 backdrop-blur-xl border border-white/80 flex items-center justify-center text-[#71717A] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)] hover:bg-white/90 hover:text-[#3F3F46] hover:shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] hover:scale-105 active:scale-95 transition-all duration-200"
        >
            {icon}
        </button>
    );
}

// --- Glass surface wrapper ---
function Glass({ children, className = '', blur = 'backdrop-blur-2xl' }: { children: React.ReactNode; className?: string; blur?: string }) {
    return (
        <div className={`${blur} border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55),inset_0_-0.5px_0_0_rgba(0,0,0,0.02),0_0_0_0.5px_rgba(0,0,0,0.03),0_1px_2px_0_rgba(0,0,0,0.025),0_4px_16px_-4px_rgba(0,0,0,0.045),0_24px_56px_-16px_rgba(0,0,0,0.06)] ${className}`}>
            {children}
        </div>
    );
}

// --- Item Row (not a card — just a row inside a glass container) ---
function ItemRow({ item, isLast, currency }: { item: ApiOrderItem; isLast: boolean; currency: string }) {
    const unit = Number(item.unit_price || 0);
    const total = Number(item.line_total || 0) || unit * Number(item.quantity || 0);
    return (
        <div className={`flex items-center gap-4 py-3.5 px-1 ${!isLast ? 'border-b border-white/30' : ''} group`}>
            <div className="w-[56px] h-[56px] rounded-[14px] bg-white/45 flex items-center justify-center p-1.5 flex-shrink-0 overflow-hidden">
                {item.image_url ? (
                    <ImageWithFallback
                        src={item.image_url}
                        alt={item.product_name}
                        className="max-w-full max-h-full object-contain mix-blend-multiply opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                ) : (
                    <PackageIcon className="text-[#1A1A1A]/25" size={18} />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-[13px] font-bold text-[#1A1A1A]/85 leading-tight mb-0.5">{item.product_name}</h4>
                <p className="text-[11px] font-medium text-[#1A1A1A]/40">{item.specs || ''}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[14px] font-bold text-[#1A1A1A]/80 tabular-nums">{currency} {total.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-[#1A1A1A]/35 bg-white/45 rounded-full px-2 py-0.5 tabular-nums">×{item.quantity} @ {currency} {unit.toLocaleString()}</span>
            </div>
        </div>
    );
}

// --- Tracking Timeline ---
type TrackingStep = { label: string; date?: string; completed: boolean; current?: boolean };

function TrackingTimeline({ steps }: { steps: TrackingStep[] }) {
    if (!steps || steps.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[10px] font-bold text-[#1A1A1A]/35 tracking-[1.5px] uppercase">Tracking</span>
            </div>
            <Glass className="bg-white/50 rounded-[20px] px-5 py-4">
                <div className="space-y-0">
                    {steps.map((step, i) => {
                        const isLast = i === steps.length - 1;
                        return (
                            <div key={i} className="flex gap-3">
                                {/* Timeline line + dot */}
                                <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                                    <div className={`w-[10px] h-[10px] rounded-full flex-shrink-0 ${
                                        step.current
                                            ? 'bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]'
                                            : step.completed
                                                ? 'bg-emerald-500/60'
                                                : 'bg-[#1A1A1A]/8'
                                    }`}>
                                        {step.current && (
                                            <div className="w-full h-full rounded-full animate-ping bg-blue-500/30" />
                                        )}
                                    </div>
                                    {!isLast && (
                                        <div className={`w-px flex-1 min-h-[20px] mt-1 ${
                                            step.completed ? 'bg-emerald-500/20' : 'bg-[#1A1A1A]/[0.05]'
                                        }`} />
                                    )}
                                </div>

                                {/* Content */}
                                <div className={`flex-1 min-w-0 ${!isLast ? 'pb-3' : ''}`}>
                                    <div className="flex items-baseline justify-between">
                                        <p className={`text-[12px] font-bold leading-tight ${
                                            step.current ? 'text-blue-600/85' : step.completed ? 'text-[#1A1A1A]/65' : 'text-[#1A1A1A]/25'
                                        }`}>
                                            {step.label}
                                        </p>
                                        <span className={`text-[10px] font-medium tabular-nums ${
                                            step.current ? 'text-blue-600/50' : step.completed ? 'text-[#1A1A1A]/30' : 'text-[#1A1A1A]/15'
                                        }`}>
                                            {step.date}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Glass>
        </motion.div>
    );
}

// --- Main View ---

interface OrderDetailsViewProps {
    order: ApiOrder;
    onCancelOrder: (id: number) => void;
    onRequestSample: (id: number) => void;
    onConfirmDelivered: (id: number) => void;
    onConfirmReceived: (id: number) => void;
}

function fmtMoney(currency: string, amount: string | number) {
    return fmtMoneyUtil(amount, currency);
}

export function OrderDetailsView({ order, onCancelOrder, onRequestSample, onConfirmDelivered, onConfirmReceived }: OrderDetailsViewProps) {
    const [copied, setCopied] = useState(false);
    const status = (order.status || '').toLowerCase();
    const steps = useMemo<TrackingStep[]>(() => {
        const createdAt = order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        const updatedAt = order.updated_at ? new Date(order.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        const shipped = status === 'shipped' || status === 'delivered' || status === 'completed';
        const delivered = status === 'delivered' || status === 'completed';
        const cancelled = status === 'cancelled';
        const accepted = status === 'accepted' || shipped || delivered;
        const out: TrackingStep[] = [
            { label: 'Order placed', date: createdAt, completed: true },
            { label: 'Accepted', date: accepted ? updatedAt : '', completed: accepted, current: status === 'accepted' },
            { label: 'Shipped', date: shipped ? updatedAt : '', completed: shipped, current: status === 'shipped' },
            { label: 'Delivered', date: delivered ? updatedAt : '', completed: delivered, current: delivered },
        ];
        if (cancelled) {
            return [
                { label: 'Order placed', date: createdAt, completed: true },
                { label: 'Cancelled', date: updatedAt, completed: true, current: true },
            ];
        }
        return out;
    }, [order.created_at, order.updated_at, status]);
    const completedSteps = steps.filter(s => s.completed).length || 0;
    const totalSteps = steps.length || 1;
    const progressPercent = Math.round((completedSteps / totalSteps) * 100);

    // Status config
    const statusBadge = (() => {
        if (status === 'created') return { bg: 'bg-blue-500/8', dot: 'bg-blue-500', text: 'text-blue-600/85', label: 'Created' };
        if (status === 'accepted') return { bg: 'bg-blue-500/8', dot: 'bg-blue-500', text: 'text-blue-600/85', label: 'Accepted' };
        if (status === 'shipped') return { bg: 'bg-cyan-500/8', dot: 'bg-cyan-500', text: 'text-cyan-600/85', label: 'Shipped' };
        if (status === 'delivered' || status === 'completed') return { bg: 'bg-emerald-500/8', dot: 'bg-emerald-500', text: 'text-emerald-600/85', label: 'Delivered' };
        if (status === 'cancelled') return { bg: 'bg-[#1A1A1A]/5', dot: 'bg-[#1A1A1A]/30', text: 'text-[#1A1A1A]/40', label: 'Cancelled' };
        if (status === 'rejected') return { bg: 'bg-[#1A1A1A]/5', dot: 'bg-[#1A1A1A]/30', text: 'text-[#1A1A1A]/40', label: 'Rejected' };
        return { bg: 'bg-[#1A1A1A]/5', dot: 'bg-[#1A1A1A]/30', text: 'text-[#1A1A1A]/40', label: order.status || '—' };
    })();

    const handleCopyOrder = () => {
        navigator.clipboard?.writeText(`ORD-${order.id}`).catch(() => {});
        setCopied(true);
        toast('Order number copied');
        setTimeout(() => setCopied(false), 2000);
    };

    const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = useMemo(() => {
        const sum = (order.items || []).reduce((acc, it) => acc + Number(it.line_total || 0), 0);
        return Number.isFinite(sum) ? sum : 0;
    }, [order.items]);
    const ship = order.shipping_address || {};
    const shipName = String(ship.contact_name || ship.name || '').trim();
    const shipPhone = String(ship.phone || '').trim();
    const shipCountry = String(ship.country || ship.country_name || '').trim();
    const shipRegion = String(ship.region || ship.state || '').trim();
    const shipCity = String(ship.city || '').trim();
    const shipStreet1 = String(ship.street1 || ship.street || '').trim();
    const shipStreet2 = String(ship.street2 || '').trim();
    const shipPostal = String(ship.postal_code || ship.zip || '').trim();
    const shipMethod = String((order as any).shipping_method || '').trim();
    const shipCostRaw = (order as any).shipping_cost;
    const shipCost = Number(shipCostRaw || 0);

    const canCancel = !['shipped', 'delivered', 'completed', 'cancelled', 'rejected'].includes(status);
    const canConfirmDelivered = status === 'shipped';
    const canConfirmReceived = status === 'delivered';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[1120px] mx-auto font-urbanist"
        >
            <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* ─── Left Column ─── */}
                <div className="flex-1 w-full space-y-5">

                    {/* Status Hero — primary glass surface */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        <Glass className="bg-white/60 rounded-[24px] p-6 pb-5">
                            {/* Label + Status */}
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold text-[#1A1A1A]/35 tracking-[1.5px] uppercase">
                                    {order.status === 'Delivered' ? 'Delivered' : 'Estimated Arrival'}
                                </span>
                                <div className={`flex items-center gap-2 ${statusBadge.bg} rounded-full px-3 py-1`}>
                                    <div className={`w-[5px] h-[5px] rounded-full ${statusBadge.dot} ${order.status !== 'Delivered' && order.status !== 'Cancelled' ? 'animate-pulse' : ''}`} />
                                    <span className={`text-[10px] font-bold ${statusBadge.text}`}>{statusBadge.label}</span>
                                </div>
                            </div>

                            {/* Date — hero */}
                            <h1 className="text-[30px] lg:text-[34px] font-black text-[#1A1A1A] tracking-tight leading-[1.1] mb-1.5">
                                {status === 'delivered' || status === 'completed' ? 'Delivered' : 'Order status'}
                            </h1>

                            {/* Order # + PO # */}
                            <div className="flex items-center gap-3 mb-5">
                                <button
                                    onClick={handleCopyOrder}
                                    className="flex items-center gap-1.5 text-[#1A1A1A]/35 hover:text-[#1A1A1A]/55 transition-colors group"
                                >
                                    <span className="text-[11px] font-medium">ORD-{order.id}</span>
                                    {copied ? (
                                        <CheckCircle2 size={10} strokeWidth={2.5} className="text-emerald-500" />
                                    ) : (
                                        <Copy size={10} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                                    )}
                                </button>
                            </div>

                            {/* Shipment info strip */}
                            <div className="flex items-center gap-4 mb-4">
                                {order.latest_shipment?.tracking_number ? (
                                    <>
                                        <span className="text-[10px] font-bold text-[#1A1A1A]/25 tabular-nums">
                                            {order.latest_shipment.tracking_number}
                                        </span>
                                    </>
                                ) : null}
                                {order.latest_shipment?.status ? (
                                    <>
                                        <span className="w-[3px] h-[3px] rounded-full bg-[#1A1A1A]/10" />
                                        <span className="text-[10px] font-bold text-[#1A1A1A]/25 tabular-nums">{order.latest_shipment.status}</span>
                                    </>
                                ) : null}
                                <span className="w-[3px] h-[3px] rounded-full bg-[#1A1A1A]/10" />
                                <span className="text-[10px] font-bold text-[#1A1A1A]/25 tabular-nums">{totalItems} units</span>
                            </div>

                            {/* Progress — thin glass bar */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-[3px] bg-[#1A1A1A]/6 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        className={`h-full rounded-full ${order.status === 'Delivered' ? 'bg-emerald-500' : order.status === 'Cancelled' ? 'bg-[#1A1A1A]/20' : 'bg-blue-500'}`}
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-[#1A1A1A]/35 tabular-nums">{progressPercent}%</span>
                            </div>
                        </Glass>
                    </motion.div>

                    {/* Tracking Timeline */}
                    <TrackingTimeline steps={steps} />

                    {/* Items — single glass surface, rows inside */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        <div className="flex items-center justify-between mb-3 px-1">
                            <span className="text-[10px] font-bold text-[#1A1A1A]/35 tracking-[1.5px] uppercase">Items</span>
                            <span className="text-[10px] font-bold text-[#1A1A1A]/30">{order.items.length} {order.items.length === 1 ? 'product' : 'products'} · {totalItems} units</span>
                        </div>
                        <Glass className="bg-white/50 rounded-[20px] px-4 py-1">
                            {order.items.map((item, i) => (
                                <ItemRow key={item.id} item={item} currency={order.currency} isLast={i === order.items.length - 1} />
                            ))}
                        </Glass>
                    </motion.div>
                </div>

                {/* ─── Right Column — Summary Glass ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="w-full lg:w-[340px] lg:sticky lg:top-20 flex-shrink-0 space-y-3"
                >
                    <Glass className="bg-white/55 rounded-[24px] p-6 space-y-6">

                        {/* Quick Actions — frosted glass circles */}
                        <div className="flex items-center gap-2">
                            <ActionButton
                                icon={<DownloadIcon />}
                                label="Download invoice"
                                onClick={() => toast('Downloading invoice...')}
                            />
                            <ActionButton
                                icon={<PrintIcon />}
                                label="Print order"
                                onClick={() => toast('Preparing print view...')}
                            />
                            <ActionButton
                                icon={<HelpIcon />}
                                label="Get help"
                                onClick={() => toast('Opening help center...')}
                            />
                        </div>

                        {/* Glass divider */}
                        <div className="h-px bg-[#1A1A1A]/6" />

                        {/* Delivery */}
                        <div>
                            <span className="text-[10px] font-bold text-[#1A1A1A]/30 tracking-[1.5px] uppercase block mb-3">Delivery</span>
                            <div className="flex gap-3 items-start">
                                <MapPin size={13} strokeWidth={2} className="text-[#1A1A1A]/28 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[13px] font-bold text-[#1A1A1A]/85 mb-0.5">{shipName || '—'}</p>
                                    <p className="text-[11px] font-medium text-[#1A1A1A]/40 leading-relaxed">
                                        {[shipStreet1, shipStreet2].filter(Boolean).join(' ')}<br />
                                        {[shipCity, shipRegion, shipPostal].filter(Boolean).join(', ')} {shipCountry}
                                    </p>
                                </div>
                            </div>
                            {shipPhone ? (
                                <div className="flex gap-3 items-center mt-2 ml-[1px]">
                                    <Phone size={12} strokeWidth={2} className="text-[#1A1A1A]/28 flex-shrink-0" />
                                    <p className="text-[11px] font-medium text-[#1A1A1A]/40">{shipPhone}</p>
                                </div>
                            ) : null}
                            {(shipMethod || shipCost > 0) ? (
                                <div className="flex gap-3 items-center mt-2 ml-[1px]">
                                    <Truck size={12} strokeWidth={2} className="text-[#1A1A1A]/28 flex-shrink-0" />
                                    <p className="text-[11px] font-medium text-[#1A1A1A]/40">
                                        Shipped via: {shipMethod || '—'} ({fmtMoney(order.currency, shipCost)})
                                    </p>
                                </div>
                            ) : null}
                        </div>

                        {/* Glass divider */}
                        <div className="h-px bg-[#1A1A1A]/6" />

                        {/* Payment */}
                        <div>
                            <span className="text-[10px] font-bold text-[#1A1A1A]/30 tracking-[1.5px] uppercase block mb-3">Payment</span>
                            <div className="flex gap-3 items-center">
                                <CreditCard size={13} strokeWidth={2} className="text-[#1A1A1A]/28 flex-shrink-0" />
                                <p className="text-[12px] font-medium text-[#1A1A1A]/55">
                                    {order.payment_method} · {order.payment_status}
                                </p>
                            </div>
                        </div>

                        {/* Glass divider */}
                        <div className="h-px bg-[#1A1A1A]/6" />

                        {/* Pricing */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-[12px]">
                                <span className="font-medium text-[#1A1A1A]/40">Subtotal</span>
                                <span className="font-medium text-[#1A1A1A]/55 tabular-nums">{fmtMoney(order.currency, subtotal)}</span>
                            </div>
                            <div className="h-px bg-[#1A1A1A]/6 !mt-3.5 !mb-1.5" />
                            <div className="flex justify-between items-baseline">
                                <span className="text-[12px] font-bold text-[#1A1A1A]/65">Total</span>
                                <span className="text-[22px] font-black text-[#1A1A1A] tracking-tight tabular-nums">{fmtMoney(order.currency, order.total_amount)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <button
                                onClick={() => onRequestSample(order.id)}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white/55 border border-white/70 px-4 py-2 text-[11px] font-bold text-[#1A1A1A]/60 hover:bg-white/75 transition-colors"
                            >
                                <FlaskConical size={12} strokeWidth={2.5} />
                                Request sample
                            </button>
                            {canConfirmDelivered ? (
                                <button
                                    onClick={() => onConfirmDelivered(order.id)}
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white/55 border border-white/70 px-4 py-2 text-[11px] font-bold text-[#1A1A1A]/60 hover:bg-white/75 transition-colors"
                                >
                                    <Truck size={12} strokeWidth={2.5} />
                                    Confirm delivered
                                </button>
                            ) : canConfirmReceived ? (
                                <button
                                    onClick={() => onConfirmReceived(order.id)}
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white/55 border border-white/70 px-4 py-2 text-[11px] font-bold text-[#1A1A1A]/60 hover:bg-white/75 transition-colors"
                                >
                                    <CheckCircle2 size={12} strokeWidth={2.5} />
                                    Confirm received
                                </button>
                            ) : canCancel ? (
                                <button
                                    onClick={() => onCancelOrder(order.id)}
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white/55 border border-white/70 px-4 py-2 text-[11px] font-bold text-[#1A1A1A]/60 hover:bg-white/75 transition-colors"
                                >
                                    <Ban size={12} strokeWidth={2.5} />
                                    Cancel
                                </button>
                            ) : (
                                <div className="flex-1" />
                            )}
                        </div>
                    </Glass>
                </motion.div>
            </div>
        </motion.div>
    );
}
