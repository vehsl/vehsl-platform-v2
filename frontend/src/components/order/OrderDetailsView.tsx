"use client";

import React, { useState } from 'react';
import { Order, OrderItem } from '@/components/order/data/mockOrders';
import { Play, Copy, CheckCircle2, MapPin, CreditCard, Phone, ChevronRight, FileText, MessageCircle, Ship, Box, Plane, Truck, Package as PackageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '@/components/order/figma/ImageWithFallback';
import { toast } from 'sonner';
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

function ChatIcon() {
    return (
        <svg className="size-[15px]" fill="none" viewBox="0 0 15 15">
            <path d={svgPaths.p3d4426f2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
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

// --- Quality Report Types ---

interface QualityReport {
    id: string;
    title: string;
    date: string;
    summary: string;
    type: 'video' | 'image' | 'doc';
    mediaUrl?: string;
    reportDocUrl?: string;
    matchScore: number;
}

const latestUpdate: QualityReport = {
    id: 'r2',
    title: 'Material Analysis Complete',
    date: 'Today, 9:41 AM',
    summary: 'Spectroscopic analysis confirms 98.5% molecular match with the golden sample. Polymer density is optimal.',
    type: 'video',
    mediaUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2070',
    reportDocUrl: '#',
    matchScore: 98,
};

// --- Glass surface wrapper ---
function Glass({ children, className = '', blur = 'backdrop-blur-2xl' }: { children: React.ReactNode; className?: string; blur?: string }) {
    return (
        <div className={`${blur} border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55),inset_0_-0.5px_0_0_rgba(0,0,0,0.02),0_0_0_0.5px_rgba(0,0,0,0.03),0_1px_2px_0_rgba(0,0,0,0.025),0_4px_16px_-4px_rgba(0,0,0,0.045),0_24px_56px_-16px_rgba(0,0,0,0.06)] ${className}`}>
            {children}
        </div>
    );
}

// --- Quality Update (lives inside the hero, not a separate box) ---
function QualityUpdate({ update }: { update: QualityReport }) {
    const dotColor = update.matchScore >= 95 ? 'bg-emerald-500' : update.matchScore >= 80 ? 'bg-amber-500' : 'bg-rose-500';
    const scoreColor = update.matchScore >= 95 ? 'text-emerald-600/40' : update.matchScore >= 80 ? 'text-amber-600/40' : 'text-rose-600/40';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-6 pt-5 border-t border-white/50"
        >
            {/* Label line */}
            <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                    <div className={`w-[6px] h-[6px] rounded-full ${dotColor}`} />
                    <span className="text-[10px] font-bold text-[#1A1A1A]/30 tracking-[1.2px] uppercase">Quality</span>
                    <span className={`text-[10px] font-bold ${scoreColor} tabular-nums`}>{update.matchScore}%</span>
                </div>
                <span className="text-[10px] font-medium text-[#1A1A1A]/25">{update.date}</span>
            </div>

            <h3 className="text-[14px] font-bold text-[#1A1A1A]/85 leading-snug mb-1">{update.title}</h3>
            <p className="text-[12px] font-medium text-[#1A1A1A]/35 leading-relaxed line-clamp-2 mb-5">{update.summary}</p>

            {/* Inline actions — no containers, just text */}
            <div className="flex items-center gap-5">
                <button
                    onClick={() => toast('Playing inspection video...')}
                    className="flex items-center gap-1.5 text-[#1A1A1A]/35 hover:text-[#1A1A1A]/70 transition-colors duration-200 active:scale-[0.97]"
                >
                    <Play size={10} fill="currentColor" className="ml-px" />
                    <span className="text-[11px] font-bold">Watch</span>
                </button>
                <button
                    onClick={() => toast('Downloading report...')}
                    className="flex items-center gap-1.5 text-[#1A1A1A]/35 hover:text-[#1A1A1A]/70 transition-colors duration-200 active:scale-[0.97]"
                >
                    <FileText size={10} strokeWidth={2.5} />
                    <span className="text-[11px] font-bold">Report</span>
                </button>
                <button
                    onClick={() => toast('Opening chat with manufacturer...')}
                    className="flex items-center gap-1.5 text-[#1A1A1A]/35 hover:text-[#1A1A1A]/70 transition-colors duration-200 active:scale-[0.97]"
                >
                    <MessageCircle size={10} strokeWidth={2.5} />
                    <span className="text-[11px] font-bold">Message</span>
                </button>
            </div>
        </motion.div>
    );
}

// --- Item Row (not a card — just a row inside a glass container) ---
function ItemRow({ item, isLast }: { item: OrderItem; isLast: boolean }) {
    return (
        <div className={`flex items-center gap-4 py-3.5 px-1 ${!isLast ? 'border-b border-white/30' : ''} group`}>
            <div className="w-[56px] h-[56px] rounded-[14px] bg-white/45 flex items-center justify-center p-1.5 flex-shrink-0 overflow-hidden">
                <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className="max-w-full max-h-full object-contain mix-blend-multiply opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-[13px] font-bold text-[#1A1A1A]/85 leading-tight mb-0.5">{item.name}</h4>
                <p className="text-[11px] font-medium text-[#1A1A1A]/40">{item.specs}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[14px] font-bold text-[#1A1A1A]/80 tabular-nums">${(item.price * item.quantity).toLocaleString()}</span>
                <span className="text-[10px] font-bold text-[#1A1A1A]/35 bg-white/45 rounded-full px-2 py-0.5 tabular-nums">×{item.quantity} @ ${item.price}</span>
            </div>
        </div>
    );
}

// --- Tracking Timeline ---
function TrackingTimeline({ steps }: { steps: Order['trackingSteps'] }) {
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

// --- Container Card ---
function ContainerCard({ container, index }: { container: NonNullable<Order['containers']>[0]; index: number }) {
    const statusColors: Record<string, { dot: string; bg: string; text: string }> = {
        'loaded': { dot: 'bg-blue-500', bg: 'bg-blue-500/[0.06]', text: 'text-blue-600/70' },
        'in-transit': { dot: 'bg-cyan-500', bg: 'bg-cyan-500/[0.06]', text: 'text-cyan-600/70' },
        'at-port': { dot: 'bg-amber-500', bg: 'bg-amber-500/[0.06]', text: 'text-amber-600/70' },
        'customs': { dot: 'bg-violet-500', bg: 'bg-violet-500/[0.06]', text: 'text-violet-600/70' },
        'delivered': { dot: 'bg-emerald-500', bg: 'bg-emerald-500/[0.06]', text: 'text-emerald-600/70' },
    };
    const sc = statusColors[container.status] || statusColors['loaded'];
    const statusLabel = container.status.replace('-', ' ').replace(/^\w/, c => c.toUpperCase());

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex items-center gap-3 py-2.5 px-1"
        >
            <div className="w-[32px] h-[32px] rounded-[8px] bg-[#1A1A1A]/[0.03] flex items-center justify-center flex-shrink-0">
                <Ship size={13} strokeWidth={1.8} className="text-[#1A1A1A]/25" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold text-[#1A1A1A]/65 tabular-nums truncate">{container.containerId}</span>
                    <span className="text-[9px] font-bold text-[#1A1A1A]/25 bg-[#1A1A1A]/[0.03] rounded-full px-1.5 py-px flex-shrink-0">{container.type}</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-medium text-[#1A1A1A]/25">
                    <span className="tabular-nums">{container.weight}</span>
                    <span className="w-[2px] h-[2px] rounded-full bg-[#1A1A1A]/10" />
                    <span className="tabular-nums">Seal: {container.sealNumber}</span>
                </div>
            </div>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${sc.bg} flex-shrink-0`}>
                <div className={`w-[4px] h-[4px] rounded-full ${sc.dot}`} />
                <span className={`text-[9px] font-bold ${sc.text}`}>{statusLabel}</span>
            </div>
        </motion.div>
    );
}

// --- Shipment type badge ---
function ShipmentBadge({ type }: { type?: string }) {
    if (!type) return null;
    const icons: Record<string, React.ReactNode> = {
        'FCL': <Ship size={10} strokeWidth={2} />,
        'LCL': <Box size={10} strokeWidth={2} />,
        'Air': <Plane size={10} strokeWidth={2} />,
        'Express': <Truck size={10} strokeWidth={2} />,
    };
    const labels: Record<string, string> = {
        'FCL': 'Full Container Load',
        'LCL': 'Less-than-Container',
        'Air': 'Air Freight',
        'Express': 'Express Delivery',
    };
    return (
        <div className="flex items-center gap-1.5 text-[#1A1A1A]/30">
            {icons[type] || <PackageIcon size={10} strokeWidth={2} />}
            <span className="text-[10px] font-bold">{labels[type] || type}</span>
        </div>
    );
}

// --- Main View ---

interface OrderDetailsViewProps {
    order: Order;
    onCancelOrder: (id: string) => void;
    onRequestSample: (id: string) => void;
}

export function OrderDetailsView({ order }: OrderDetailsViewProps) {
    const completedSteps = order.trackingSteps?.filter(s => s.completed).length || 0;
    const totalSteps = order.trackingSteps?.length || 1;
    const progressPercent = Math.round((completedSteps / totalSteps) * 100);
    const [copied, setCopied] = useState(false);

    // Status config
    const statusBadge = (() => {
        switch (order.status) {
            case 'Arriving': return { bg: 'bg-blue-500/8', dot: 'bg-blue-500', text: 'text-blue-600/85', label: 'In production' };
            case 'Processing': return { bg: 'bg-blue-500/8', dot: 'bg-blue-500', text: 'text-blue-600/85', label: 'Processing' };
            case 'In Transit': return { bg: 'bg-cyan-500/8', dot: 'bg-cyan-500', text: 'text-cyan-600/85', label: 'In transit' };
            case 'Customs': return { bg: 'bg-amber-500/8', dot: 'bg-amber-500', text: 'text-amber-600/85', label: 'At customs' };
            case 'At Warehouse': return { bg: 'bg-violet-500/8', dot: 'bg-violet-500', text: 'text-violet-600/85', label: 'At warehouse' };
            case 'Delivered': return { bg: 'bg-emerald-500/8', dot: 'bg-emerald-500', text: 'text-emerald-600/85', label: 'Delivered' };
            case 'Cancelled': return { bg: 'bg-[#1A1A1A]/5', dot: 'bg-[#1A1A1A]/30', text: 'text-[#1A1A1A]/40', label: 'Cancelled' };
            default: return { bg: 'bg-[#1A1A1A]/5', dot: 'bg-[#1A1A1A]/30', text: 'text-[#1A1A1A]/40', label: order.status };
        }
    })();

    // Format arrival date
    const arrivalFormatted = (() => {
        try {
            const d = new Date(order.arrivalDate + 'T00:00:00');
            return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        } catch {
            return order.arrivalDate;
        }
    })();

    const handleCopyOrder = () => {
        navigator.clipboard?.writeText(order.orderNumber).catch(() => {});
        setCopied(true);
        toast('Order number copied');
        setTimeout(() => setCopied(false), 2000);
    };

    const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);

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
                                {arrivalFormatted}
                            </h1>

                            {/* Order # + PO # */}
                            <div className="flex items-center gap-3 mb-5">
                                <button
                                    onClick={handleCopyOrder}
                                    className="flex items-center gap-1.5 text-[#1A1A1A]/35 hover:text-[#1A1A1A]/55 transition-colors group"
                                >
                                    <span className="text-[11px] font-medium">#{order.orderNumber}</span>
                                    {copied ? (
                                        <CheckCircle2 size={10} strokeWidth={2.5} className="text-emerald-500" />
                                    ) : (
                                        <Copy size={10} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                                    )}
                                </button>
                                {order.poNumber && (
                                    <>
                                        <span className="w-[3px] h-[3px] rounded-full bg-[#1A1A1A]/15" />
                                        <span className="text-[11px] font-medium text-[#1A1A1A]/25">{order.poNumber}</span>
                                    </>
                                )}
                            </div>

                            {/* Shipment info strip */}
                            <div className="flex items-center gap-4 mb-4">
                                <ShipmentBadge type={order.shipmentType} />
                                {order.totalWeight && (
                                    <>
                                        <span className="w-[3px] h-[3px] rounded-full bg-[#1A1A1A]/10" />
                                        <span className="text-[10px] font-bold text-[#1A1A1A]/25 tabular-nums">{order.totalWeight}</span>
                                    </>
                                )}
                                {(order.containerCount ?? 0) > 0 && (
                                    <>
                                        <span className="w-[3px] h-[3px] rounded-full bg-[#1A1A1A]/10" />
                                        <span className="text-[10px] font-bold text-[#1A1A1A]/25 tabular-nums">{order.containerCount} container{order.containerCount !== 1 ? 's' : ''}</span>
                                    </>
                                )}
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

                            {/* Quality Update — flows inside, separated by a glass divider */}
                            {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                                <QualityUpdate update={latestUpdate} />
                            )}
                        </Glass>
                    </motion.div>

                    {/* Containers — if applicable */}
                    {order.containers && order.containers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <div className="flex items-center justify-between mb-3 px-1">
                                <span className="text-[10px] font-bold text-[#1A1A1A]/35 tracking-[1.5px] uppercase">Containers</span>
                                <span className="text-[10px] font-bold text-[#1A1A1A]/20 tabular-nums">{order.containers.length}</span>
                            </div>
                            <Glass className="bg-white/50 rounded-[20px] px-4 py-1">
                                {order.containers.map((c, i) => (
                                    <div key={c.containerId} className={`${i < order.containers!.length - 1 ? 'border-b border-white/30' : ''}`}>
                                        <ContainerCard container={c} index={i} />
                                    </div>
                                ))}
                            </Glass>
                        </motion.div>
                    )}

                    {/* Tracking Timeline */}
                    {order.trackingSteps && order.trackingSteps.length > 0 && (
                        <TrackingTimeline steps={order.trackingSteps} />
                    )}

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
                                <ItemRow key={item.id} item={item} isLast={i === order.items.length - 1} />
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
                                icon={<ChatIcon />}
                                label="Message seller"
                                onClick={() => toast('Opening chat with seller...')}
                            />
                            <ActionButton
                                icon={<HelpIcon />}
                                label="Get help"
                                onClick={() => toast('Opening help center...')}
                            />
                        </div>

                        {/* Glass divider */}
                        <div className="h-px bg-[#1A1A1A]/6" />

                        {/* Buyer */}
                        {order.buyerCompany && (
                            <>
                                <div>
                                    <span className="text-[10px] font-bold text-[#1A1A1A]/30 tracking-[1.5px] uppercase block mb-3">Buyer</span>
                                    <div className="flex gap-3 items-center">
                                        <div className="w-[28px] h-[28px] rounded-full bg-blue-500/[0.06] flex items-center justify-center flex-shrink-0">
                                            <span className="text-[10px] font-black text-blue-600/50">
                                                {order.buyerCompany.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-[#1A1A1A]/85">{order.buyerCompany}</p>
                                            <p className="text-[10px] font-medium text-[#1A1A1A]/30">{order.shippingAddress.name}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-px bg-[#1A1A1A]/6" />
                            </>
                        )}

                        {/* Delivery */}
                        <div>
                            <span className="text-[10px] font-bold text-[#1A1A1A]/30 tracking-[1.5px] uppercase block mb-3">Delivery</span>
                            <div className="flex gap-3 items-start">
                                <MapPin size={13} strokeWidth={2} className="text-[#1A1A1A]/28 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[13px] font-bold text-[#1A1A1A]/85 mb-0.5">{order.shippingAddress.name}</p>
                                    <p className="text-[11px] font-medium text-[#1A1A1A]/40 leading-relaxed">
                                        {order.shippingAddress.street}<br />
                                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-center mt-2 ml-[1px]">
                                <Phone size={12} strokeWidth={2} className="text-[#1A1A1A]/28 flex-shrink-0" />
                                <p className="text-[11px] font-medium text-[#1A1A1A]/40">{order.shippingAddress.phone}</p>
                            </div>
                        </div>

                        {/* Glass divider */}
                        <div className="h-px bg-[#1A1A1A]/6" />

                        {/* Payment */}
                        <div>
                            <span className="text-[10px] font-bold text-[#1A1A1A]/30 tracking-[1.5px] uppercase block mb-3">Payment</span>
                            <div className="flex gap-3 items-center">
                                <CreditCard size={13} strokeWidth={2} className="text-[#1A1A1A]/28 flex-shrink-0" />
                                <p className="text-[12px] font-medium text-[#1A1A1A]/55">
                                    {order.paymentMethod.type} ending in {order.paymentMethod.last4}
                                </p>
                            </div>
                        </div>

                        {/* Glass divider */}
                        <div className="h-px bg-[#1A1A1A]/6" />

                        {/* Pricing */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-[12px]">
                                <span className="font-medium text-[#1A1A1A]/40">Subtotal</span>
                                <span className="font-medium text-[#1A1A1A]/55 tabular-nums">${order.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[12px]">
                                <span className="font-medium text-[#1A1A1A]/40">Shipping</span>
                                <span className="font-medium text-[#1A1A1A]/55 tabular-nums">${order.shipping.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[12px]">
                                <span className="font-medium text-[#1A1A1A]/40">Tax</span>
                                <span className="font-medium text-[#1A1A1A]/55 tabular-nums">${order.tax.toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-[#1A1A1A]/6 !mt-3.5 !mb-1.5" />
                            <div className="flex justify-between items-baseline">
                                <span className="text-[12px] font-bold text-[#1A1A1A]/65">Total</span>
                                <span className="text-[22px] font-black text-[#1A1A1A] tracking-tight tabular-nums">${order.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </Glass>

                    {/* Manufacturer — subtle glass row */}
                    <button
                        onClick={() => toast('Opening manufacturer profile...')}
                        className="w-full flex items-center justify-between py-3 px-4 bg-white/30 backdrop-blur-xl border border-white/30 rounded-[16px] hover:bg-white/50 transition-all duration-300 group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-white/55 flex items-center justify-center text-[10px] font-black text-[#1A1A1A]/50">
                                {order.seller.name.charAt(0)}
                            </div>
                            <div className="text-left">
                                <p className="text-[11px] font-bold text-[#1A1A1A]/65">{order.seller.name}</p>
                                <p className="text-[9px] font-medium text-[#1A1A1A]/35">{order.seller.location}</p>
                            </div>
                        </div>
                        <ChevronRight size={13} className="text-[#1A1A1A]/25 group-hover:text-[#1A1A1A]/45 group-hover:translate-x-0.5 transition-all" />
                    </button>
                </motion.div>
            </div>
        </motion.div>
    );
}