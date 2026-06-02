"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { authedFetch } from '@/lib/api';
import { toast } from 'sonner';
import { ImageWithFallback } from '@/components/order/figma/ImageWithFallback';
import {
    Search, SlidersHorizontal, ArrowLeft, ChevronRight, X,
    Check, MapPin, Fingerprint, Car, UserCheck, Clock,
    Calendar, ArrowUpRight, Package, DollarSign, Warehouse as WarehouseIcon,
    Copy, Phone, Star, User, PenLine, FileText, Hash, Download, Share2,
    Lock, ShieldCheck, Layers, Truck, ArrowRight
} from 'lucide-react';
import {
    Warehouse, InventoryItem, ReleaseRequest, ReleaseRecord
} from '@/components/order/data/mockWarehouse';
import svgPaths from './imports/svg-v5nteu4twa';
import { useRole } from '@/components/order/RoleContext';

// ─── Shared easing ───
const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

function asString(v: unknown, fallback = ''): string {
    if (v === null || v === undefined) return fallback;
    const s = String(v);
    return s === 'undefined' || s === 'null' ? fallback : s;
}

function asNumber(v: unknown, fallback = 0): number {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function isWarehouseFeature(v: unknown): v is Warehouse['features'][number] {
    return v === 'climate' || v === 'security' || v === 'covered';
}

function mapWarehouse(raw: any): Warehouse | null {
    const id = asString(raw?.id);
    if (!id) return null;

    const featuresRaw: unknown[] = Array.isArray(raw?.features) ? raw.features : [];
    const features = featuresRaw.filter(isWarehouseFeature);

    const hoursRaw = raw?.hours;
    let hours: Warehouse['hours'] | undefined;
    if (hoursRaw === '24/7') {
        hours = '24/7';
    } else if (hoursRaw && typeof hoursRaw === 'object') {
        const open = asString((hoursRaw as any).open);
        const close = asString((hoursRaw as any).close);
        const days = asString((hoursRaw as any).days);
        if (open && close && days) hours = { open, close, days };
    }

    const storedSince = asString(raw?.storedSince ?? raw?.stored_since, '');

    return {
        id,
        name: asString(raw?.name),
        address: asString(raw?.address),
        distance: asString(raw?.distance),
        pricePerWeek: asNumber(raw?.pricePerWeek ?? raw?.price_per_week, 0),
        rating: asString(raw?.rating),
        features: features.length ? features : ['climate', 'security', 'covered'],
        storedSince: storedSince || undefined,
        hours,
        managerName: asString(raw?.managerName ?? raw?.manager_name),
        managerPhone: asString(raw?.managerPhone ?? raw?.manager_phone),
    };
}

function mapInventoryItem(raw: any, fallbackWarehouseId: string): InventoryItem | null {
    const id = asString(raw?.id);
    if (!id) return null;
    return {
        id,
        productName: asString(raw?.productName ?? raw?.product_name),
        sku: asString(raw?.sku),
        image: asString(raw?.image),
        totalBoxes: asNumber(raw?.totalBoxes ?? raw?.total_boxes, 0),
        releasedBoxes: asNumber(raw?.releasedBoxes ?? raw?.released_boxes, 0),
        palletsCount: asNumber(raw?.palletsCount ?? raw?.pallets_count, 0),
        unitPrice: asNumber(raw?.unitPrice ?? raw?.unit_price, 0),
        warehouseId: asString(raw?.warehouseId ?? raw?.warehouse_id, fallbackWarehouseId),
    };
}

function mapReleaseRequest(raw: any): ReleaseRequest | null {
    const id = asString(raw?.id);
    if (!id) return null;
    return {
        id,
        orderId: asString(raw?.orderId ?? raw?.order_id) || undefined,
        warehouseId: asString(raw?.warehouseId ?? raw?.warehouse_id) || undefined,
        inventoryItemId: asString(raw?.inventoryItemId ?? raw?.inventory_item_id),
        requesterName: asString(raw?.requesterName ?? raw?.requester_name),
        idCardNumber: asString(raw?.idCardNumber ?? raw?.id_card_number),
        vehicleNumber: asString(raw?.vehicleNumber ?? raw?.vehicle_number),
        boxesRequested: asNumber(raw?.boxesRequested ?? raw?.boxes_requested, 0),
        paymentAmount: asNumber(raw?.paymentAmount ?? raw?.payment_amount, 0),
        requestedDate: asString(raw?.requestedDate ?? raw?.requested_date),
        note: asString(raw?.note, '') || undefined,
    };
}

function mapReleaseRecord(raw: any): ReleaseRecord | null {
    const id = asString(raw?.id);
    if (!id) return null;
    const statusRaw = asString(raw?.status).toLowerCase();
    const status: ReleaseRecord['status'] = statusRaw === 'pending' ? 'pending' : 'completed';
    return {
        id,
        orderId: asString(raw?.orderId ?? raw?.order_id) || undefined,
        warehouseId: asString(raw?.warehouseId ?? raw?.warehouse_id) || undefined,
        inventoryItemId: asString(raw?.inventoryItemId ?? raw?.inventory_item_id),
        recipientName: asString(raw?.recipientName ?? raw?.recipient_name),
        idCardNumber: asString(raw?.idCardNumber ?? raw?.id_card_number),
        vehicleNumber: asString(raw?.vehicleNumber ?? raw?.vehicle_number),
        boxesReleased: asNumber(raw?.boxesReleased ?? raw?.boxes_released, 0),
        paymentAmount: asNumber(raw?.paymentAmount ?? raw?.payment_amount, 0),
        date: asString(raw?.date),
        status,
    };
}

// ─── Product color gradient (pink → teal → green) ───
// Shared across inventory, composition bar, request cards, timeline
function prodColor(t: number): string {
    const cP = [249, 168, 212], cT = [103, 232, 249], cG = [187, 247, 208];
    let r: number, g: number, b: number;
    if (t < 0.4) {
        const p = t / 0.4;
        r = cP[0] + (cT[0] - cP[0]) * p;
        g = cP[1] + (cT[1] - cP[1]) * p;
        b = cP[2] + (cT[2] - cP[2]) * p;
    } else {
        const p = (t - 0.4) / 0.6;
        r = cT[0] + (cG[0] - cT[0]) * p;
        g = cT[1] + (cG[1] - cT[1]) * p;
        b = cT[2] + (cG[2] - cT[2]) * p;
    }
    return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

// Parse rgb string to [r,g,b] array
function parseRgb(color: string): [number, number, number] {
    const m = color.match(/(\d+)/g);
    return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [150, 150, 150];
}

// ─── Hours helpers ───
function formatTime(t: string) {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return m === 0 ? `${h12} ${ampm}` : `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function getHoursLabel(hours: Warehouse['hours'] | undefined): string {
    if (!hours) return '';
    if (hours === '24/7') return '24/7';
    return `${formatTime(hours.open)}–${formatTime(hours.close)}`;
}

function isCurrentlyOpen(hours: Warehouse['hours'] | undefined): boolean {
    if (!hours) return true;
    if (hours === '24/7') return true;
    const nowHour = 14;
    const nowMin = 30;
    const nowTotal = nowHour * 60 + nowMin;
    const [oh, om] = hours.open.split(':').map(Number);
    const [ch, cm] = hours.close.split(':').map(Number);
    return nowTotal >= oh * 60 + om && nowTotal < ch * 60 + cm;
}

// ─── Glass — 6-layer shadow, no colors, just light ─��─
function Glass({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`backdrop-blur-2xl border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55),inset_0_-0.5px_0_0_rgba(0,0,0,0.02),0_0_0_0.5px_rgba(0,0,0,0.03),0_1px_2px_0_rgba(0,0,0,0.025),0_4px_16px_-4px_rgba(0,0,0,0.045),0_24px_56px_-16px_rgba(0,0,0,0.06)] ${className}`}>
            {children}
        </div>
    );
}

// ─── Figma feature icons (monochrome, inherit color) ───
function ClimateIcon() {
    return (
        <svg className="size-[10px]" fill="none" viewBox="0 0 14.2222 14.2222">
            <path d={svgPaths.p1e994000} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
            <path d={svgPaths.p22c69b40} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
            <path d={svgPaths.p3335d040} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
            <path d={svgPaths.p3047fbc0} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
            <path d={svgPaths.p155d5d80} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
            <path d={svgPaths.p3b181900} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
            <path d={svgPaths.p1e002b00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
            <path d={svgPaths.p39e7e6c0} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
            <path d={svgPaths.p3be8de80} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
            <path d={svgPaths.p3bed0320} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
            <path d={svgPaths.p115d900} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
            <path d={svgPaths.p88a2000} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
        </svg>
    );
}
function SecurityIcon() {
    return (
        <svg className="size-[10px]" fill="none" viewBox="0 0 14.2222 14.2222">
            <path d={svgPaths.p11a96a80} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
        </svg>
    );
}
function CoveredIcon() {
    return (
        <svg className="size-[10px]" fill="none" viewBox="0 0 14.2222 14.2222">
            <path d={svgPaths.p2ab85400} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
            <path d={svgPaths.p17835680} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
            <path d="M7.11003 13.0353V7.10938" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
        </svg>
    );
}

const featureIcon: Record<string, React.ReactNode> = {
    climate: <ClimateIcon />,
    security: <SecurityIcon />,
    covered: <CoveredIcon />,
};
const featureLabel: Record<string, string> = {
    climate: 'Climate',
    security: 'Security',
    covered: 'Covered',
};

// ─── Star badge ───
function RatingBadge({ rating, active }: { rating: string; active: boolean }) {
    return (
        <div className={`inline-flex items-center gap-1 rounded-full pl-1 pr-2 py-0.5 ${active ? 'bg-[#1A1A1A]/[0.06]' : 'bg-[#1A1A1A]/[0.03]'}`}>
            <svg className="size-[14px]" fill="none" viewBox="0 0 21.6 21.0422">
                <rect fill="#1A1A1A" fillOpacity={active ? 0.08 : 0.04} height="21.0422" rx="10.5211" width="21.6" />
                <path d={svgPaths.p87a2900} fill="#1A1A1A" stroke="#1A1A1A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.19989" opacity={active ? 0.5 : 0.2} />
            </svg>
            <span className={`text-[10px] font-bold ${active ? 'text-[#1A1A1A]/60' : 'text-[#1A1A1A]/30'}`}>{rating}</span>
        </div>
    );
}


// ═══════════════════════════════════════════
// STATUS BADGE — open/closed indicator
// ═══════════════════════════════════════════
function StatusBadge({ isOpen, hoursLabel }: { isOpen: boolean; hoursLabel: string }) {
    if (!hoursLabel) return null;
    return (
        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] ${
            isOpen ? 'bg-emerald-500/[0.06]' : 'bg-rose-400/[0.06]'
        }`}>
            <div className={`w-[5px] h-[5px] rounded-full ${isOpen ? 'bg-emerald-500/60' : 'bg-rose-400/60'}`} />
            <span className={`text-[10px] font-bold ${isOpen ? 'text-emerald-600/50' : 'text-rose-500/50'}`}>
                {isOpen ? 'Open' : 'Closed'}
            </span>
            <span className="text-[10px] font-medium text-[#1A1A1A]/20">{hoursLabel}</span>
        </div>
    );
}


// ═══════════════════════════════════════════
// LISTING STATUS STEPPER — onboarding progress
// ═══════════════════════════════════════════
function ListingStatusStepper({ lr }: { lr: any }) {
    const stages = [
        { key: 'samples', label: 'Samples', icon: <Package size={14} /> },
        { key: 'compliance', label: 'Compliance', icon: <ShieldCheck size={14} /> },
        { key: 'inspection', label: 'Inspection', icon: <Search size={14} /> },
        { key: 'inbound', label: 'Inbound', icon: <Truck size={14} /> },
        { key: 'live', label: 'Live', icon: <Check size={14} /> },
    ];

    const currentStageIndex = stages.findIndex(s => s.key === lr.stage);
    
    return (
        <div className="flex items-center gap-6 mt-4">
            {stages.map((stage, i) => {
                const isCompleted = i < currentStageIndex || (lr.stage === 'done');
                const isCurrent = i === currentStageIndex && lr.stage !== 'done';
                
                return (
                    <React.Fragment key={stage.key}>
                        <div className="flex flex-col items-center gap-1.5 relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                                isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                                isCurrent ? 'bg-[#0171E3] text-white shadow-lg shadow-[#0171E3]/20 scale-110' :
                                'bg-[#1A1A1A]/[0.04] text-[#1A1A1A]/25'
                            }`}>
                                {isCompleted ? <Check size={18} strokeWidth={3} /> : stage.icon}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                isCurrent ? 'text-[#0171E3]' : 'text-[#1A1A1A]/30'
                            }`}>
                                {stage.label}
                            </span>
                            
                            {stage.key === 'compliance' && lr.compliance_verified && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10">
                                    <Check size={10} strokeWidth={4} className="text-white" />
                                </div>
                            )}
                            {stage.key === 'compliance' && !lr.compliance_verified && lr.stage === 'compliance' && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10 animate-pulse">
                                    <Clock size={10} strokeWidth={3} className="text-white" />
                                </div>
                            )}

                            {stage.key === 'inspection' && lr.inspected && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10">
                                    <Check size={10} strokeWidth={4} className="text-white" />
                                </div>
                            )}
                            {stage.key === 'inspection' && lr.inspector_name && !lr.inspected && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10" title={`Inspector Assigned: ${lr.inspector_name}`}>
                                    <User size={10} strokeWidth={3} className="text-white" />
                                </div>
                            )}
                            {stage.key === 'inspection' && !lr.inspector_name && !lr.inspected && lr.stage === 'inspection' && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10 animate-pulse">
                                    <Clock size={10} strokeWidth={3} className="text-white" />
                                </div>
                            )}
                        </div>
                        {i < stages.length - 1 && (
                            <div className={`h-[2px] w-12 -mt-5 rounded-full transition-all duration-700 ${
                                isCompleted ? 'bg-emerald-500' : 'bg-[#1A1A1A]/[0.06]'
                            }`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}


// ═══════════════════════════════════════════
// WAREHOUSE ROW — selection view
// ═══════════════════════════════════════════
// Grade color map — A++ emerald, A+ green, A teal, B amber
function gradeRgb(r: string): string {
    if (r.includes('++')) return '52,199,89';
    if (r.includes('+')) return '48,209,88';
    if (r.startsWith('A')) return '90,200,250';
    if (r.startsWith('B')) return '255,179,64';
    return '142,142,147';
}

function WarehouseRow({ warehouse, isActive, onSelect, stockBoxes, stockValue, products, pallets }: {
    warehouse: Warehouse; isActive: boolean; onSelect: () => void;
    stockBoxes: number; stockValue: number; pallets: number;
    products: { name: string; boxes: number; color: string }[];
}) {
    const hoursLabel = getHoursLabel(warehouse.hours);
    const open = isCurrentlyOpen(warehouse.hours);

    // Ring — product-colored, stock-sized
    const ringSize = 54, ringR = 21, ringC = 2 * Math.PI * ringR;
    const fillPct = Math.min(stockBoxes / 250, 1);
    const dominant = products[0]?.color || 'rgb(150,150,150)';
    const [dr, dg, db] = parseRgb(dominant);
    const ringStroke = `rgba(${dr},${dg},${db},${isActive ? 0.72 : 0.32})`;
    const ringTrack = `rgba(${dr},${dg},${db},${isActive ? 0.12 : 0.06})`;

    // Compact value
    const fmtVal = stockValue >= 10000 ? `$${(stockValue / 1000).toFixed(0)}k` : stockValue >= 1000 ? `$${(stockValue / 1000).toFixed(1)}k` : `$${stockValue}`;

    // Grade badge color
    const gC = gradeRgb(warehouse.rating);

    return (
        <motion.button
            onClick={onSelect}
            whileTap={{ scale: 0.98 }}
            layout
            className={`w-full text-left rounded-[20px] p-[18px] transition-all duration-300 ${
                isActive
                    ? 'bg-white/55 border border-[#1A1A1A]/[0.06]'
                    : 'bg-white/20 border border-transparent hover:bg-white/40'
            }`}
            style={{
                boxShadow: isActive
                    ? `0 10px 40px rgba(${dr},${dg},${db},0.10), 0 2px 8px rgba(26,26,26,0.04), inset 0 1px 2px rgba(255,255,255,0.5)`
                    : 'none',
            }}
        >
            {/* ── Top: Ring + Info + Price ── */}
            <div className="flex items-center gap-3.5 mb-3">
                {/* Product-colored capacity ring with box count */}
                <div className="relative flex-shrink-0" style={{ width: ringSize, height: ringSize }}>
                    <svg width={ringSize} height={ringSize} className="-rotate-90">
                        <circle cx={ringSize / 2} cy={ringSize / 2} r={ringR} fill="none" stroke={ringTrack} strokeWidth="3.5" />
                        <circle cx={ringSize / 2} cy={ringSize / 2} r={ringR} fill="none" stroke={ringStroke} strokeWidth="3.5"
                            strokeDasharray={ringC} strokeDashoffset={ringC * (1 - fillPct)} strokeLinecap="round"
                            className="transition-all duration-500" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-[13px] font-black tabular-nums leading-none transition-colors duration-300 ${isActive ? 'text-[#1A1A1A]/80' : 'text-[#1A1A1A]/32'}`}>
                            {stockBoxes}
                        </span>
                        <span className={`text-[7px] font-bold leading-none mt-[2px] transition-colors duration-300 ${isActive ? 'text-[#1A1A1A]/28' : 'text-[#1A1A1A]/14'}`}>
                            box
                        </span>
                    </div>
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                    <h3 className={`text-[14px] font-bold leading-snug truncate transition-colors duration-300 ${isActive ? 'text-[#1A1A1A]/90' : 'text-[#1A1A1A]/50'}`}>
                        {warehouse.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin size={10} strokeWidth={2.5} className={`flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-[#1A1A1A]/28' : 'text-[#1A1A1A]/15'}`} />
                        <span className={`text-[11px] font-medium truncate transition-colors duration-300 ${isActive ? 'text-[#1A1A1A]/35' : 'text-[#1A1A1A]/20'}`}>{warehouse.distance}</span>
                        {hoursLabel && <StatusBadge isOpen={open} hoursLabel={hoursLabel} />}
                    </div>
                    {/* Value + Pallets — compact metric row */}
                    <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1">
                            <DollarSign size={10} strokeWidth={2.5} className={`flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-[#1A1A1A]/25' : 'text-[#1A1A1A]/12'}`} />
                            <span className={`text-[12px] font-black tabular-nums transition-colors duration-300 ${isActive ? 'text-[#1A1A1A]/50' : 'text-[#1A1A1A]/22'}`}>{fmtVal}</span>
                        </div>
                        <div className={`w-px h-[10px] transition-colors duration-300 ${isActive ? 'bg-[#1A1A1A]/10' : 'bg-[#1A1A1A]/05'}`} />
                        <div className="flex items-center gap-1">
                            <Layers size={10} strokeWidth={2.5} className={`flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-[#1A1A1A]/25' : 'text-[#1A1A1A]/12'}`} />
                            <span className={`text-[12px] font-black tabular-nums transition-colors duration-300 ${isActive ? 'text-[#1A1A1A]/50' : 'text-[#1A1A1A]/22'}`}>{pallets}</span>
                            <span className={`text-[10px] font-medium transition-colors duration-300 ${isActive ? 'text-[#1A1A1A]/25' : 'text-[#1A1A1A]/12'}`}>plt</span>
                        </div>
                    </div>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0 pl-2">
                    <span className={`text-[18px] font-black tabular-nums block transition-colors duration-300 ${isActive ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/40'}`}>
                        ${warehouse.pricePerWeek}
                    </span>
                    <span className={`text-[10px] font-medium block -mt-0.5 transition-colors duration-300 ${isActive ? 'text-[#1A1A1A]/25' : 'text-[#1A1A1A]/15'}`}>/week</span>
                </div>
            </div>

            {/* ── Product composition bar ── */}
            {products.length > 0 && (
                <div className="mb-3">
                    <div className="flex h-[5px] rounded-full overflow-hidden gap-px">
                        {products.map((p, i) => {
                            const pct = stockBoxes > 0 ? (p.boxes / stockBoxes) * 100 : 0;
                            const [pr, pg, pb] = parseRgb(p.color);
                            return (
                                <div key={i} className="h-full transition-all duration-500"
                                    style={{
                                        width: `${Math.max(pct, 2)}%`,
                                        background: `rgba(${pr},${pg},${pb},${isActive ? 0.55 : 0.22})`,
                                        borderRadius: i === 0 ? '9px 0 0 9px' : i === products.length - 1 ? '0 9px 9px 0' : '0',
                                    }}
                                />
                            );
                        })}
                    </div>
                    {/* Product legend — color dot + short name */}
                    <div className="flex items-center gap-2.5 mt-1.5 overflow-hidden">
                        {products.slice(0, 3).map((p, i) => {
                            const [pr, pg, pb] = parseRgb(p.color);
                            const shortName = p.name.length > 14 ? p.name.slice(0, 12) + '…' : p.name;
                            return (
                                <div key={i} className="flex items-center gap-1 min-w-0">
                                    <div className="size-[6px] rounded-full flex-shrink-0" style={{ background: `rgba(${pr},${pg},${pb},${isActive ? 0.65 : 0.3})` }} />
                                    <span className={`text-[10px] font-medium truncate transition-colors duration-300 ${isActive ? 'text-[#1A1A1A]/35' : 'text-[#1A1A1A]/18'}`}>{shortName}</span>
                                </div>
                            );
                        })}
                        {products.length > 3 && (
                            <span className={`text-[10px] font-bold flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-[#1A1A1A]/25' : 'text-[#1A1A1A]/12'}`}>+{products.length - 3}</span>
                        )}
                    </div>
                </div>
            )}

            {/* ── Footer: Grade + Features + Select ── */}
            <div className="flex items-center gap-2">
                {/* Color-graded rating badge */}
                <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] transition-all duration-300`}
                    style={{ background: `rgba(${gC},${isActive ? 0.13 : 0.06})` }}>
                    <span className="text-[11px] font-black" style={{ color: `rgba(${gC},${isActive ? 0.9 : 0.5})` }}>{warehouse.rating}</span>
                </div>

                <div className="flex items-center gap-1 ml-0.5">
                    {warehouse.features.map((f) => (
                        <div key={f} className={`size-[22px] rounded-full flex items-center justify-center transition-all duration-300 ${
                            isActive ? 'bg-white/60 text-[#1A1A1A]/35' : 'bg-white/25 text-[#1A1A1A]/15'
                        }`} title={featureLabel[f]}>
                            {featureIcon[f]}
                        </div>
                    ))}
                </div>
                <div className="flex-1" />
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="flex items-center gap-1.5 bg-[#1A1A1A] text-white rounded-full px-3.5 py-1.5"
                        style={{ boxShadow: `0 3px 12px rgba(${dr},${dg},${db},0.2), 0 1px 3px rgba(26,26,26,0.15)` }}
                    >
                        <span className="text-[11px] font-bold">Select</span>
                        <svg className="size-2.5" fill="currentColor" viewBox="0 0 17.1427 13.4541">
                            <path d={svgPaths.p382d1880} />
                        </svg>
                    </motion.div>
                )}
            </div>
        </motion.button>
    );
}


// ═══════════════════════════════════════════
// STOCK RING — circular progress, soft glow
// ═══════════════════════════════════════════
function StockRing({ percent, remaining, total, size = 44, productColor }: {
    percent: number; remaining: number; total: number; size?: number; productColor?: string;
}) {
    const clipPct = Math.min(100, Math.max(0, percent));
    const SEGS = 28;
    const activeCount = Math.round((clipPct / 100) * SEGS);

    const [pcR, pcG, pcB] = productColor ? parseRgb(productColor) : [0, 0, 0];
    const hasColor = !!productColor;

    // Pre-compute segment angles
    const segments = React.useMemo(() => {
        return Array.from({ length: SEGS }, (_, i) => {
            const angle = (i / SEGS) * 360 - 90;
            return { angle };
        });
    }, []);

    return (
        <div className="flex flex-col items-center gap-[4px] flex-shrink-0">
            <div className="relative" style={{ width: size, height: size }}>
                {/* Ambient glow behind ring — tinted to product color */}
                <div
                    className="absolute inset-[-6px] rounded-full blur-[12px] opacity-45 transition-opacity duration-700"
                    style={{
                        background: hasColor
                            ? `radial-gradient(circle, rgba(${pcR},${pcG},${pcB},0.3) 0%, rgba(${pcR},${pcG},${pcB},0.08) 70%, transparent 100%)`
                            : 'conic-gradient(from -90deg, rgba(249,168,212,0.3), rgba(103,232,249,0.25), rgba(187,247,208,0.3), rgba(249,168,212,0.2))'
                    }}
                />
                <svg viewBox="0 0 48 48" className="relative z-10 block size-full">
                    {/* Inner frosted glass disc */}
                    <circle cx="24" cy="24" r="13.5" fill="rgba(255,255,255,0.32)" />
                    <circle cx="24" cy="24" r="13.5" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />

                    {/* Track segments — full ring, very faint */}
                    {segments.map((seg, i) => (
                        <rect
                            key={`t${i}`}
                            x={24 - 1.35} y={3.2}
                            width={2.7} height={5.2} rx={1.35}
                            fill="rgba(26,26,26,0.04)"
                            transform={`rotate(${seg.angle} 24 24)`}
                        />
                    ))}

                    {/* Active progress segments — product-colored */}
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.7, delay: 0.12, ease: EASE_OUT }}
                    >
                        {segments.slice(0, activeCount).map((seg, i) => (
                            <rect
                                key={`a${i}`}
                                x={24 - 1.35} y={3.2}
                                width={2.7} height={5.2} rx={1.35}
                                fill={hasColor ? `rgb(${pcR},${pcG},${pcB})` : `rgba(150,150,150,0.5)`}
                                opacity={hasColor ? 0.55 + 0.2 * (i / Math.max(activeCount - 1, 1)) : 0.5}
                                transform={`rotate(${seg.angle} 24 24)`}
                            />
                        ))}
                    </motion.g>
                </svg>
                {/* Center number */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <span className={`${size > 36 ? 'text-[13px]' : 'text-[10px]'} font-black text-[#1A1A1A]/65 tabular-nums leading-none`}>
                        {remaining}
                    </span>
                </div>
            </div>
            <span className="text-[8px] font-medium text-[#1A1A1A]/20 tabular-nums leading-none">
                of {total}
            </span>
        </div>
    );
}


// ═══════════════════════════════════════════
// INVENTORY ROW — table-aligned, polished
// ═══════════════════════════════════════════
function InventoryRow({ item, isLast, onRelease, index, productColor }: {
    item: InventoryItem; isLast: boolean; onRelease: () => void; index: number; productColor?: string;
}) {
    const remaining = item.totalBoxes - item.releasedBoxes;
    const percent = Math.round((remaining / item.totalBoxes) * 100);
    const stockValue = remaining * item.unitPrice;
    const [cr, cg, cb] = productColor ? parseRgb(productColor) : [150, 150, 150];

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: index * 0.05 }}
            className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-5 py-[16px] px-3 ${
                !isLast ? 'border-b border-[#1A1A1A]/[0.04]' : ''
            } group cursor-default rounded-[14px] hover:bg-white/30 transition-all duration-400`}
        >
            {/* Column 1: Product */}
            <div className="flex items-center gap-3.5 min-w-0">
                <div
                    className="w-[46px] h-[46px] rounded-[12px] bg-white/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.02),0_1px_3px_-1px_rgba(0,0,0,0.04)] flex items-center justify-center p-[5px] flex-shrink-0 overflow-hidden group-hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.02),0_2px_8px_-2px_rgba(0,0,0,0.06)] transition-shadow duration-500 relative"
                    style={{ border: `1.5px solid rgba(${cr},${cg},${cb},0.2)` }}
                >
                    <ImageWithFallback
                        src={item.image}
                        alt={item.productName}
                        className="max-w-full max-h-full object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 group-hover:scale-[1.05] transition-all duration-500 ease-out"
                    />
                </div>
                <div className="min-w-0">
                    <h4 className="text-[13px] font-bold text-[#1A1A1A]/80 leading-snug mb-[3px] truncate group-hover:text-[#1A1A1A]/90 transition-colors duration-500">
                        {item.productName}
                    </h4>
                    <div className="flex items-center text-[10px] font-medium text-[#1A1A1A]/28">
                        <span className="tabular-nums">{item.palletsCount} {item.palletsCount === 1 ? 'pallet' : 'pallets'}</span>
                        <span className="mx-[6px] w-[3px] h-[3px] rounded-full bg-[#1A1A1A]/10 inline-block" />
                        <span className="tabular-nums">${item.unitPrice} ea</span>
                    </div>
                </div>
            </div>

            {/* Column 2: Stock ring — tinted to product color */}
            <StockRing percent={percent} remaining={remaining} total={item.totalBoxes} productColor={productColor} />

            {/* Column 3: Value */}
            <div className="text-right w-[80px]">
                <span className="text-[14px] font-black text-[#1A1A1A]/70 tabular-nums tracking-tight">${stockValue.toLocaleString()}</span>
                <span className="block text-[9px] font-medium text-[#1A1A1A]/20">value</span>
            </div>

            {/* Column 4: Action */}
            <button
                onClick={onRelease}
                className="flex items-center gap-1 text-[11px] font-bold text-[#1A1A1A]/25 hover:text-[#1A1A1A]/60 transition-all duration-300 active:scale-[0.96] flex-shrink-0 group/btn pl-2"
            >
                <span>Release</span>
                <ChevronRight size={10} strokeWidth={2.5} className="opacity-0 -translate-x-1 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300" />
            </button>
        </motion.div>
    );
}


// ═══════════════════════════════════════════
// REQUEST CARD — with avatar, polished
// ═══════════════════════════════════════════
function RequestCard({ request, product, onApprove, onDecline, index, productColor }: {
    request: ReleaseRequest;
    product: InventoryItem | undefined;
    onApprove: () => void;
    onDecline: () => void;
    index: number;
    productColor?: string;
}) {
    const initials = request.requesterName.split(' ').map(n => n[0]).join('').slice(0, 2);
    const [cr, cg, cb] = productColor ? parseRgb(productColor) : [150, 150, 150];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE, delay: index * 0.06 }}
            className="px-4 py-3.5"
        >
            <div className="flex items-start gap-3">
                {/* Avatar — tinted by product color */}
                <div
                    className="size-[38px] rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm"
                    style={{
                        background: `linear-gradient(145deg, rgba(255,255,255,0.85), rgba(${cr},${cg},${cb},0.12))`,
                        border: `1px solid rgba(${cr},${cg},${cb},0.28)`,
                        boxShadow: `0 1px 4px -1px rgba(0,0,0,0.07), 0 0.5px 1px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.55)`,
                    }}
                >
                    <span className="text-[12px] font-black text-[#1A1A1A]/35">{initials}</span>
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-1.5">
                        <div className="min-w-0">
                            <h4 className="text-[13px] font-bold text-[#1A1A1A]/80 leading-tight">{request.requesterName}</h4>
                            <div className="flex items-center gap-0 mt-[3px] text-[10px] font-medium text-[#1A1A1A]/25">
                                <Fingerprint size={9} strokeWidth={2} className="mr-1 opacity-50" />
                                <span className="tabular-nums">{request.idCardNumber}</span>
                                <span className="mx-[5px] w-[3px] h-[3px] rounded-full bg-[#1A1A1A]/8 inline-block" />
                                <Car size={9} strokeWidth={2} className="mr-1 opacity-50" />
                                <span>{request.vehicleNumber}</span>
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                            <span className="text-[15px] font-black text-[#1A1A1A]/80 tabular-nums">${request.paymentAmount.toFixed(0)}</span>
                            <p className="text-[9px] font-medium text-[#1A1A1A]/22 mt-[-1px]">{request.boxesRequested} boxes</p>
                        </div>
                    </div>

                    {/* Product context */}
                    {product && (
                        <div className="flex items-center gap-2 mb-2 mt-2">
                            <div
                                className="w-[20px] h-[20px] rounded-[5px] flex items-center justify-center p-0.5 overflow-hidden flex-shrink-0"
                                style={{
                                    background: `linear-gradient(135deg, rgba(255,255,255,0.7), rgba(${cr},${cg},${cb},0.08))`,
                                    border: `0.5px solid rgba(${cr},${cg},${cb},0.15)`,
                                }}
                            >
                                <ImageWithFallback
                                    src={product.image}
                                    alt={product.productName}
                                    className="max-w-full max-h-full object-contain mix-blend-multiply opacity-70"
                                />
                            </div>
                            <div className="w-[5px] h-[5px] rounded-[1.5px] flex-shrink-0" style={{ backgroundColor: `rgba(${cr},${cg},${cb},0.55)` }} />
                            <span className="text-[10px] font-medium text-[#1A1A1A]/28 truncate">{product.productName}</span>
                        </div>
                    )}

                    {/* Note */}
                    {request.note && (
                        <p className="text-[11px] font-medium text-[#1A1A1A]/22 leading-relaxed mb-2.5 italic">"{request.note}"</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-2.5">
                        <span className="text-[9px] font-medium text-[#1A1A1A]/18">{request.requestedDate}</span>
                        <div className="flex-1" />
                        <button
                            onClick={onDecline}
                            className="flex items-center gap-1.5 rounded-full px-3 py-[5px] transition-all duration-300 active:scale-[0.97] hover:bg-[#E86363]/[0.08] group/decline"
                            style={{ border: '1px solid transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(232,99,99,0.15)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; }}
                        >
                            <X size={10} strokeWidth={2.5} className="text-[#1A1A1A]/25 group-hover/decline:text-[#C94A4A]/60 transition-colors duration-300" />
                            <span className="text-[10px] font-bold text-[#1A1A1A]/25 group-hover/decline:text-[#C94A4A]/55 transition-colors duration-300">Decline</span>
                        </button>
                        <button
                            onClick={onApprove}
                            className="flex items-center gap-1.5 rounded-full bg-[#1A1A1A]/[0.05] px-3 py-[5px] transition-all duration-300 active:scale-[0.97] hover:bg-[#4A9B6F]/[0.12] group/approve"
                            style={{ border: '1px solid transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(74,155,111,0.18)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; }}
                        >
                            <Check size={10} strokeWidth={2.5} className="text-[#1A1A1A]/45 group-hover/approve:text-[#3A7D56]/70 transition-colors duration-300" />
                            <span className="text-[10px] font-bold text-[#1A1A1A]/50 group-hover/approve:text-[#3A7D56]/65 transition-colors duration-300">Approve</span>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}


// ═══════════════════════════════════════════
// TIMELINE ROW — sidebar release activity
// ═══════════════════════════════════════════
function TimelineRow({ record, isLast, index, productName, productColor, onClick }: { record: ReleaseRecord; isLast: boolean; index: number; productName?: string; productColor?: string; onClick?: () => void }) {
    // Format date to short like "Feb 8"
    const shortDate = (() => {
        const parts = record.date.split('-');
        if (parts.length === 3) {
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return record.date;
    })();

    const initials = record.recipientName.split(' ').map(n => n[0]).join('').slice(0, 2);
    const [cr, cg, cb] = productColor ? parseRgb(productColor) : [150, 150, 150];

    return (
        <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.3 + index * 0.06 }}
            className={`flex gap-2.5 group ${onClick ? 'cursor-pointer rounded-[10px] -mx-1.5 px-1.5 hover:bg-white/35 active:scale-[0.985] transition-all duration-300' : ''}`}
            onClick={onClick}
        >
            {/* Color-coded initials circle */}
            <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                <div
                    className="w-[28px] h-[28px] rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0"
                    style={{
                        background: `linear-gradient(145deg, rgba(255,255,255,0.85), rgba(${cr},${cg},${cb},0.12))`,
                        border: `1px solid rgba(${cr},${cg},${cb},0.22)`,
                        boxShadow: `0 1px 3px -1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.5)`,
                    }}
                >
                    <span className="text-[9px] font-black text-[#1A1A1A]/40 leading-none select-none">{initials}</span>
                </div>
                {!isLast && <div className="w-px flex-1 bg-[#1A1A1A]/[0.05] mt-1" />}
            </div>

            {/* Content */}
            <div className={`flex-1 min-w-0 ${!isLast ? 'pb-4' : 'pb-1'}`}>
                <div className="flex items-baseline justify-between mb-0.5">
                    <div className="min-w-0 flex-1 pr-2">
                        <p className="text-[11px] font-bold text-[#1A1A1A]/60 leading-tight truncate group-hover:text-[#1A1A1A]/75 transition-colors">
                            {record.recipientName}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[11px] font-bold text-[#1A1A1A]/50 tabular-nums">${record.paymentAmount.toFixed(0)}</span>
                        {onClick && <ChevronRight size={9} strokeWidth={2.5} className="text-[#1A1A1A]/15 group-hover:text-[#1A1A1A]/35 transition-colors" />}
                    </div>
                </div>
                <div className="flex items-center text-[9px] font-medium text-[#1A1A1A]/22 mt-[1px]">
                    <span className="tabular-nums">{shortDate}</span>
                    <span className="mx-[4px] w-[2px] h-[2px] rounded-full bg-[#1A1A1A]/8 inline-block" />
                    <span className="tabular-nums">{record.boxesReleased} boxes</span>
                    <span className="mx-[4px] w-[2px] h-[2px] rounded-full bg-[#1A1A1A]/8 inline-block" />
                    <span className="truncate">{productName || 'Unknown product'}</span>
                </div>
            </div>
        </motion.div>
    );
}


// ══════════════════════════���════════════════
// TRANSACTION DETAIL SHEET — frosted glass record view
// ═══════════════════════════════════════════
function TransactionDetailSheet({ record, productName, productColor, onClose }: {
    record: ReleaseRecord;
    productName?: string;
    productColor?: string;
    onClose: () => void;
}) {
    const [cr, cg, cb] = productColor ? parseRgb(productColor) : [150, 150, 150];
    const initials = record.recipientName.split(' ').map(n => n[0]).join('').slice(0, 2);

    const fullDate = (() => {
        const parts = record.date.split('-');
        if (parts.length === 3) {
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        }
        return record.date;
    })();

    const DetailRow = ({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) => (
        <div className="flex items-start gap-3 py-2.5">
            <div className="w-[28px] h-[28px] rounded-[8px] bg-white/40 flex items-center justify-center flex-shrink-0 border border-white/30">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold text-[#1A1A1A]/25 tracking-[0.8px] uppercase block mb-0.5">{label}</span>
                <span className={`text-[13px] font-bold text-[#1A1A1A]/70 leading-snug ${mono ? 'tabular-nums' : ''}`}>{value}</span>
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ y: 60, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 40, opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', damping: 32, stiffness: 320 }}
                className="relative w-full max-w-[420px]"
            >
                <Glass className="bg-white/80 rounded-[26px] overflow-hidden">
                    {/* Header — colored accent strip */}
                    <div className="relative overflow-hidden">
                        {/* Subtle product-colored ambient orb */}
                        <div
                            className="absolute top-[-20px] right-[-20px] w-[120px] h-[120px] rounded-full blur-[50px] opacity-20"
                            style={{ background: `rgb(${cr},${cg},${cb})` }}
                        />
                        <div className="px-6 pt-6 pb-4 relative">
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-3.5">
                                    {/* Initials avatar with product-colored ring */}
                                    <div
                                        className="w-[44px] h-[44px] rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0"
                                        style={{
                                            background: `linear-gradient(145deg, rgba(255,255,255,0.9), rgba(${cr},${cg},${cb},0.12))`,
                                            border: `1.5px solid rgba(${cr},${cg},${cb},0.25)`,
                                            boxShadow: `0 2px 8px -2px rgba(${cr},${cg},${cb},0.15), inset 0 1px 0 rgba(255,255,255,0.6)`,
                                        }}
                                    >
                                        <span className="text-[13px] font-black text-[#1A1A1A]/45 leading-none select-none">{initials}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold text-[#1A1A1A]/25 tracking-[1px] uppercase block">Transaction Record</span>
                                        <h3 className="text-[16px] font-black text-[#1A1A1A]/85 leading-tight">{record.recipientName}</h3>
                                    </div>
                                </div>
                                <button onClick={onClose} className="size-[30px] rounded-full bg-[#1A1A1A]/[0.04] flex items-center justify-center text-[#1A1A1A]/30 hover:text-[#1A1A1A]/60 hover:bg-[#1A1A1A]/[0.08] transition-all active:scale-95">
                                    <X size={13} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Status + Date pill bar */}
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    record.status === 'completed'
                                        ? 'bg-emerald-500/[0.08] text-emerald-600/60'
                                        : 'bg-amber-500/[0.08] text-amber-600/60'
                                }`}>
                                    <span className={`w-[5px] h-[5px] rounded-full ${record.status === 'completed' ? 'bg-emerald-500/50' : 'bg-amber-500/50'}`} />
                                    {record.status === 'completed' ? 'Completed' : 'Pending'}
                                </span>
                                <span className="text-[10px] font-medium text-[#1A1A1A]/25">{fullDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-[#1A1A1A]/[0.04] mx-6" />

                    {/* Details grid */}
                    <div className="px-6 py-4 space-y-0.5">
                        <DetailRow
                            icon={<Package size={12} strokeWidth={2} className="text-[#1A1A1A]/30" />}
                            label="Product"
                            value={productName || 'Unknown product'}
                        />
                        <DetailRow
                            icon={<Hash size={12} strokeWidth={2} className="text-[#1A1A1A]/30" />}
                            label="Boxes Released"
                            value={`${record.boxesReleased} boxes`}
                            mono
                        />
                        <DetailRow
                            icon={<DollarSign size={12} strokeWidth={2} className="text-[#1A1A1A]/30" />}
                            label="Payment Amount"
                            value={`$${record.paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                            mono
                        />
                        <DetailRow
                            icon={<Fingerprint size={12} strokeWidth={2} className="text-[#1A1A1A]/30" />}
                            label="ID Card Number"
                            value={record.idCardNumber}
                            mono
                        />
                        <DetailRow
                            icon={<Car size={12} strokeWidth={2} className="text-[#1A1A1A]/30" />}
                            label="Vehicle Number"
                            value={record.vehicleNumber}
                        />
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-[#1A1A1A]/[0.04] mx-6" />

                    {/* Signature section */}
                    <div className="px-6 py-5">
                        <div className="flex items-center gap-1.5 mb-3">
                            <PenLine size={10} strokeWidth={2} className="text-[#1A1A1A]/25" />
                            <span className="text-[9px] font-bold text-[#1A1A1A]/25 tracking-[0.8px] uppercase">Receiving Signature</span>
                        </div>
                        <div
                            className="relative rounded-[16px] bg-white/40 border border-[#1A1A1A]/[0.04] p-5 overflow-hidden"
                            style={{ boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(0,0,0,0.01)' }}
                        >
                            {/* Simulated signature as an SVG scribble */}
                            <svg viewBox="0 0 260 60" className="w-full h-[50px] opacity-50" fill="none" stroke={`rgba(${cr},${cg},${cb},0.6)`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M 20 42 C 30 18, 40 12, 50 30 C 58 44, 62 46, 70 28 C 76 14, 82 12, 88 28 C 94 44, 100 42, 108 26 C 114 14, 120 18, 124 30" />
                                <path d="M 138 40 C 142 22, 150 16, 156 28 C 162 40, 168 44, 176 26 C 182 12, 188 14, 194 30 C 200 46, 208 40, 216 24 C 222 12, 230 18, 240 34" />
                            </svg>
                            {/* Name below signature */}
                            <div className="mt-2 pt-2 border-t border-dashed border-[#1A1A1A]/[0.06] flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[#1A1A1A]/30">{record.recipientName}</span>
                                <span className="text-[9px] font-medium text-[#1A1A1A]/18 tabular-nums">{fullDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer actions */}
                    <div className="px-6 pb-6 space-y-2.5">
                        {/* Download & Share row */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const lines = [
                                        '═══════════════════════════════',
                                        '       RELEASE RECEIPT',
                                        '═══════════════════════════════',
                                        '',
                                        `Recipient:     ${record.recipientName}`,
                                        `ID Card:       ${record.idCardNumber}`,
                                        `Vehicle:       ${record.vehicleNumber}`,
                                        `Product:       ${productName || 'Unknown'}`,
                                        `Boxes:         ${record.boxesReleased}`,
                                        `Amount:        $${record.paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                                        `Date:          ${fullDate}`,
                                        `Status:        ${record.status === 'completed' ? 'Completed' : 'Pending'}`,
                                        `Ref:           ${record.id.toUpperCase()}`,
                                        '',
                                        '───────────────────────────────',
                                        '  Signature on file',
                                        '───────────────────────────────',
                                    ].join('\n');
                                    const blob = new Blob([lines], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `receipt-${record.id}.txt`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                    toast.success('Receipt downloaded');
                                }}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#1A1A1A] text-white rounded-[14px] py-3 font-bold text-[13px] hover:bg-[#2A2A2A] active:scale-[0.98] transition-all"
                            >
                                <Download size={13} strokeWidth={2} />
                                Download
                            </button>
                            <button
                                onClick={async () => {
                                    const text = [
                                        `Release Receipt — ${record.recipientName}`,
                                        `Product: ${productName || 'Unknown'}`,
                                        `Boxes: ${record.boxesReleased} · Amount: $${record.paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                                        `Vehicle: ${record.vehicleNumber} · ID: ${record.idCardNumber}`,
                                        `Date: ${fullDate} · Status: ${record.status === 'completed' ? 'Completed' : 'Pending'}`,
                                        `Ref: ${record.id.toUpperCase()}`,
                                    ].join('\n');

                                    if (navigator.share) {
                                        try {
                                            await navigator.share({ title: `Receipt — ${record.recipientName}`, text });
                                        } catch { /* user cancelled */ }
                                    } else {
                                        try {
                                            await navigator.clipboard.writeText(text);
                                            toast.success('Receipt copied to clipboard');
                                        } catch {
                                            toast.error('Could not share');
                                        }
                                    }
                                }}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#1A1A1A]/[0.06] hover:bg-[#1A1A1A]/[0.10] text-[#1A1A1A]/55 rounded-[14px] py-3 font-bold text-[13px] active:scale-[0.98] transition-all"
                            >
                                <Share2 size={13} strokeWidth={2} />
                                Share
                            </button>
                        </div>
                        {/* Done */}
                        <button
                            onClick={onClose}
                            className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A]/[0.03] hover:bg-[#1A1A1A]/[0.06] text-[#1A1A1A]/35 rounded-[14px] py-2.5 font-bold text-[12px] active:scale-[0.98] transition-all"
                        >
                            Done
                        </button>
                    </div>
                </Glass>
            </motion.div>
        </motion.div>
    );
}


// ═══════════════════════════════════════════
// RELEASE SHEET — unchanged, already polished
// ═══════════════════════════════════════════
function ReleaseSheet({ item, onClose, onSubmit, prefill, productColor }: {
    item: InventoryItem;
    onClose: () => void;
    onSubmit: (data: { name: string; idCard: string; vehicle: string; boxes: number; amount: number }) => void;
    prefill?: { name: string; idCard: string; vehicle: string; boxes: number };
    productColor?: string;
}) {
    const [name, setName] = useState(prefill?.name || '');
    const [idCard, setIdCard] = useState(prefill?.idCard || '');
    const [vehicle, setVehicle] = useState(prefill?.vehicle || '');
    const [boxes, setBoxes] = useState(prefill?.boxes || 1);
    const [pin, setPin] = useState(['', '', '', '']);
    const [pinError, setPinError] = useState(false);
    const [pinShake, setPinShake] = useState(false);
    const [pinVerified, setPinVerified] = useState(false);
    const pinRefs = [React.useRef<HTMLInputElement>(null), React.useRef<HTMLInputElement>(null), React.useRef<HTMLInputElement>(null), React.useRef<HTMLInputElement>(null)];
    const SECRET_PIN = '1234'; // Owner's secret transaction PIN
    const remaining = item.totalBoxes - item.releasedBoxes;
    const amount = boxes * item.unitPrice;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="relative w-full max-w-[420px]"
            >
                <Glass className="bg-white/80 rounded-[26px] overflow-hidden">
                    {/* Header */}
                    <div className="px-6 pt-6 pb-4">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-[40px] h-[40px] rounded-[10px] bg-white/50 flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                                    <ImageWithFallback
                                        src={item.image}
                                        alt={item.productName}
                                        className="max-w-full max-h-full object-contain mix-blend-multiply opacity-80"
                                    />
                                </div>
                                <div>
                                    <span className="text-[9px] font-bold text-[#1A1A1A]/25 tracking-[1px] uppercase block">Release</span>
                                    <h3 className="text-[14px] font-bold text-[#1A1A1A]/85 leading-tight">{item.productName}</h3>
                                </div>
                            </div>
                            <button onClick={onClose} className="size-[28px] rounded-full bg-[#1A1A1A]/[0.04] flex items-center justify-center text-[#1A1A1A]/30 hover:text-[#1A1A1A]/60 hover:bg-[#1A1A1A]/[0.08] transition-all">
                                <X size={13} strokeWidth={2.5} />
                            </button>
                        </div>
                        <p className="text-[11px] font-medium text-[#1A1A1A]/30">{remaining} boxes available · ${item.unitPrice} per box</p>
                    </div>

                    {/* Form */}
                    <div className="px-6 py-4 space-y-3">
                        <div>
                            <label className="flex items-center gap-1.5 text-[9px] font-bold text-[#1A1A1A]/30 tracking-[0.8px] uppercase mb-1.5">
                                <UserCheck size={9} strokeWidth={2.5} />
                                Person name
                            </label>
                            <input
                                type="text" value={name} onChange={(e) => setName(e.target.value)}
                                placeholder="Who is collecting..."
                                className="w-full bg-white/50 border border-[#1A1A1A]/[0.05] rounded-[12px] px-3.5 py-2.5 text-[13px] font-medium text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/18 focus:outline-none focus:border-[#1A1A1A]/10 transition-all"
                            />
                        </div>
                        <div className="flex gap-2.5">
                            <div className="flex-1">
                                <label className="flex items-center gap-1.5 text-[9px] font-bold text-[#1A1A1A]/30 tracking-[0.8px] uppercase mb-1.5">
                                    <Fingerprint size={9} strokeWidth={2.5} />
                                    ID Card
                                </label>
                                <input
                                    type="text" value={idCard} onChange={(e) => setIdCard(e.target.value)}
                                    placeholder="XXXXX-XXXXXXX-X"
                                    className="w-full bg-white/50 border border-[#1A1A1A]/[0.05] rounded-[12px] px-3.5 py-2.5 text-[13px] font-medium text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/18 focus:outline-none focus:border-[#1A1A1A]/10 transition-all tabular-nums"
                                />
                            </div>
                            <div className="w-[130px] flex-shrink-0">
                                <label className="flex items-center gap-1.5 text-[9px] font-bold text-[#1A1A1A]/30 tracking-[0.8px] uppercase mb-1.5">
                                    <Car size={9} strokeWidth={2.5} />
                                    Vehicle
                                </label>
                                <input
                                    type="text" value={vehicle} onChange={(e) => setVehicle(e.target.value)}
                                    placeholder="ABC-1234"
                                    className="w-full bg-white/50 border border-[#1A1A1A]/[0.05] rounded-[12px] px-3.5 py-2.5 text-[13px] font-medium text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/18 focus:outline-none focus:border-[#1A1A1A]/10 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Stock Visualization ── */}
                    {(() => {
                        const total = item.totalBoxes;
                        const alreadyReleased = item.releasedBoxes;
                        const afterRelease = remaining - boxes;
                        const releasePct = boxes / total;
                        const alreadyPct = alreadyReleased / total;
                        const afterPct = afterRelease / total;
                        // Urgency: how critical is the remaining stock
                        const urgency = afterRelease <= 0 ? 1 : afterRelease / remaining < 0.15 ? 0.85 : afterRelease / remaining < 0.3 ? 0.5 : 0;
                        // Product color from productColorMap (matches all other panels)
                        const pColor = productColor || prodColor(0.5);
                        const [cr, cg, cb] = parseRgb(pColor);
                        // SVG ring params
                        const ringSize = 88, strokeW = 6, rad = (ringSize - strokeW) / 2;
                        const circ = 2 * Math.PI * rad;
                        // Arc segment fractions
                        const gapFrac = 3 / 360;
                        const usable = 1 - gapFrac * 3;
                        const arcAlready = usable * alreadyPct;
                        const arcReleasing = usable * releasePct;
                        const arcAfter = usable * afterPct;

                        return (
                            <div className="px-6 py-4">
                                <div className="rounded-[18px] bg-white/30 border border-[#1A1A1A]/[0.04] p-4 overflow-hidden relative"
                                    data-stock-card=""
                                    style={{ boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.5), inset 0 -1px 2px rgba(0,0,0,0.01)' }}
                                >
                                    {/* Ambient product orb */}
                                    <div className="absolute top-[-30px] left-[-30px] w-[100px] h-[100px] rounded-full blur-[45px] opacity-15 pointer-events-none"
                                        style={{ background: `rgb(${cr},${cg},${cb})` }} />

                                    {/* Top: Ring + Hero Numbers */}
                                    <div className="flex items-center gap-4">
                                        {/* SVG Ring */}
                                        <div data-ring-section="" className="relative flex-shrink-0" style={{ width: ringSize, height: ringSize }}>
                                            <svg width={ringSize} height={ringSize} className="block" style={{ transform: 'rotate(-90deg)' }}>
                                                {/* Track */}
                                                <circle cx={ringSize / 2} cy={ringSize / 2} r={rad} fill="none"
                                                    stroke="rgba(26,26,26,0.04)" strokeWidth={strokeW} />
                                                {/* Already released (gray) */}
                                                <motion.circle cx={ringSize / 2} cy={ringSize / 2} r={rad} fill="none"
                                                    stroke="rgba(26,26,26,0.12)" strokeWidth={strokeW} strokeLinecap="round"
                                                    strokeDasharray={circ}
                                                    initial={false}
                                                    animate={{ strokeDashoffset: circ * (1 - arcAlready) }}
                                                    transition={{ type: 'spring', damping: 28, stiffness: 200 }}
                                                />
                                                {/* Releasing now (product color) */}
                                                <motion.circle cx={ringSize / 2} cy={ringSize / 2} r={rad} fill="none"
                                                    stroke={`rgba(${cr},${cg},${cb},0.7)`} strokeWidth={strokeW + 1} strokeLinecap="round"
                                                    strokeDasharray={circ}
                                                    initial={false}
                                                    animate={{ strokeDashoffset: circ * (1 - arcReleasing) }}
                                                    transition={{ type: 'spring', damping: 28, stiffness: 200 }}
                                                    style={{ transform: `rotate(${(arcAlready + gapFrac) * 360}deg)`, transformOrigin: 'center' }}
                                                />
                                                {/* Remaining (soft pastel) */}
                                                <motion.circle cx={ringSize / 2} cy={ringSize / 2} r={rad} fill="none"
                                                    stroke={`rgba(${cr},${cg},${cb},0.15)`} strokeWidth={strokeW - 1} strokeLinecap="round"
                                                    strokeDasharray={circ}
                                                    initial={false}
                                                    animate={{ strokeDashoffset: circ * (1 - arcAfter) }}
                                                    transition={{ type: 'spring', damping: 28, stiffness: 200 }}
                                                    style={{ transform: `rotate(${(arcAlready + arcReleasing + gapFrac * 2) * 360}deg)`, transformOrigin: 'center' }}
                                                />
                                            </svg>
                                            {/* Center number — click to type */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <motion.div
                                                    key={boxes}
                                                    initial={{ scale: 1.15, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                                                    className="relative"
                                                >
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        defaultValue={boxes}
                                                        onFocus={(e) => { e.target.select(); }}
                                                        onBlur={(e) => {
                                                            const v = parseInt(e.target.value, 10);
                                                            if (!isNaN(v) && v >= 1) setBoxes(Math.min(remaining, v));
                                                            else e.target.value = String(boxes);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                                            if (e.key === 'Escape') {
                                                                (e.target as HTMLInputElement).value = String(boxes);
                                                                (e.target as HTMLInputElement).blur();
                                                            }
                                                        }}
                                                        className="w-[48px] text-center text-[22px] font-black tabular-nums bg-transparent outline-none border-none p-0 m-0 rounded-[8px] cursor-pointer focus:cursor-text focus:bg-white/50 transition-all"
                                                        style={{
                                                            color: `rgba(${cr},${cg},${cb},0.85)`,
                                                            caretColor: `rgb(${cr},${cg},${cb})`,
                                                            boxShadow: 'none',
                                                        }}
                                                        onFocusCapture={(e) => {
                                                            (e.target as HTMLInputElement).style.boxShadow = `0 0 0 2px rgba(${cr},${cg},${cb},0.15)`;
                                                        }}
                                                        onBlurCapture={(e) => {
                                                            (e.target as HTMLInputElement).style.boxShadow = 'none';
                                                        }}
                                                    />
                                                </motion.div>
                                                <span className="text-[7px] font-bold text-[#1A1A1A]/25 uppercase tracking-[0.5px] -mt-0.5">releasing</span>
                                            </div>
                                        </div>

                                        {/* Stock breakdown numbers */}
                                        <div data-numbers-section="" className="flex-1 min-w-0">
                                            <div className="space-y-1.5">
                                                <div className="flex items-baseline justify-between">
                                                    <span className="text-[9px] font-bold text-[#1A1A1A]/25 uppercase tracking-[0.5px]">Available</span>
                                                    <span className="text-[13px] font-black text-[#1A1A1A]/70 tabular-nums">{remaining}</span>
                                                </div>
                                                <div className="flex items-baseline justify-between">
                                                    <span className="text-[9px] font-bold text-[#1A1A1A]/25 uppercase tracking-[0.5px]">Releasing</span>
                                                    <span className="text-[13px] font-black tabular-nums" style={{ color: `rgba(${cr},${cg},${cb},0.8)` }}>{boxes}</span>
                                                </div>
                                                <div className="h-px bg-[#1A1A1A]/[0.04] my-0.5" />
                                                <div className="flex items-baseline justify-between">
                                                    <span className="text-[9px] font-bold text-[#1A1A1A]/25 uppercase tracking-[0.5px]">Left after</span>
                                                    <motion.span
                                                        key={afterRelease}
                                                        initial={{ scale: 1.15, opacity: 0.5 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="text-[13px] font-black tabular-nums"
                                                        style={{
                                                            color: urgency > 0.8 ? 'rgba(239,68,68,0.7)'
                                                                : urgency > 0.4 ? 'rgba(245,158,11,0.7)'
                                                                : 'rgba(26,26,26,0.7)'
                                                        }}
                                                    >{afterRelease}</motion.span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stepper */}
                                    <div className="mt-4 flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                const nb = Math.max(1, boxes - 1);
                                                setBoxes(nb);
                                                // Physics: w = mass of release (0→feather, 1→full load)
                                                const w = Math.min(1, nb / remaining);
                                                const dy = 0.4 + w * 2.6;
                                                const ds = 1 - w * 0.03;
                                                const os = 1 + w * 0.015;
                                                const dur = 280 + w * 280;
                                                const fade = 1 - w * 0.25;
                                                const ls = 1 - w * 0.025;
                                                const lo = 1 + w * 0.02;
                                                const glow = w * 0.1;
                                                const card = (e.currentTarget as HTMLElement).closest('[data-stock-card]');
                                                if (!card) return;
                                                const ring = card.querySelector('[data-ring-section]') as HTMLElement | null;
                                                const nums = card.querySelector('[data-numbers-section]') as HTMLElement | null;
                                                const legend = card.querySelector('[data-legend-section]') as HTMLElement | null;
                                                const sp = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
                                                ring?.animate([
                                                    { transform: 'translateY(0) scale(1)', offset: 0 },
                                                    { transform: `translateY(${dy}px) scale(${ds})`, offset: 0.22 },
                                                    { transform: `translateY(${-dy * 0.45}px) scale(${os})`, offset: 0.58 },
                                                    { transform: 'translateY(0) scale(1)', offset: 1 },
                                                ], { duration: dur, easing: sp });
                                                nums?.animate([
                                                    { transform: 'translateY(0)', opacity: '1', offset: 0 },
                                                    { transform: `translateY(${dy * 1.1}px)`, opacity: String(fade), offset: 0.26 },
                                                    { transform: `translateY(${-dy * 0.3}px)`, opacity: '1', offset: 0.62 },
                                                    { transform: 'translateY(0)', opacity: '1', offset: 1 },
                                                ], { duration: dur * 0.92, easing: sp, delay: w * 25 });
                                                legend?.animate([
                                                    { transform: 'scale(1)', offset: 0 },
                                                    { transform: `scale(${ls})`, offset: 0.3 },
                                                    { transform: `scale(${lo})`, offset: 0.65 },
                                                    { transform: 'scale(1)', offset: 1 },
                                                ], { duration: dur * 0.85, easing: sp, delay: w * 45 });
                                                if (glow > 0.01) {
                                                    (card as HTMLElement).animate([
                                                        { boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.5), inset 0 -1px 2px rgba(0,0,0,0.01)', offset: 0 },
                                                        { boxShadow: `inset 0 1px 3px rgba(255,255,255,0.5), inset 0 -1px 2px rgba(0,0,0,0.01), 0 0 0 1.5px rgba(${cr},${cg},${cb},${glow})`, offset: 0.35 },
                                                        { boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.5), inset 0 -1px 2px rgba(0,0,0,0.01)', offset: 1 },
                                                    ], { duration: dur, easing: 'ease-out' });
                                                }
                                            }}
                                            className="w-[40px] h-[36px] rounded-[10px] bg-[#1A1A1A]/[0.04] hover:bg-[#1A1A1A]/[0.07] flex items-center justify-center text-[#1A1A1A]/40 active:scale-90 transition-all text-[15px] font-bold"
                                        >{'\u2212'}</button>

                                        {/* Visual slider bar — draggable */}
                                        <div
                                            className="flex-1 relative h-[36px] flex items-center cursor-grab active:cursor-grabbing select-none touch-none"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                const barEl = e.currentTarget;
                                                const rect = barEl.getBoundingClientRect();
                                                const dot = barEl.querySelector('[data-slider-dot]') as HTMLElement | null;
                                                const baseShadow = `0 2px 6px rgba(${cr},${cg},${cb},0.35), 0 0 0 3px rgba(${cr},${cg},${cb},0.1)`;
                                                const calcNewBoxes = (clientX: number) => {
                                                    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                                                    const availRange = 1 - alreadyPct;
                                                    if (availRange <= 0) return 1;
                                                    const relFrac = Math.max(0, Math.min(1, (frac - alreadyPct) / availRange));
                                                    return Math.max(1, Math.min(remaining, Math.round(relFrac * remaining)));
                                                };
                                                setBoxes(calcNewBoxes(e.clientX));
                                                document.body.style.cursor = 'grabbing';
                                                if (dot) {
                                                    dot.style.scale = '1.45';
                                                    dot.style.boxShadow = `0 4px 16px rgba(${cr},${cg},${cb},0.5), 0 0 0 6px rgba(${cr},${cg},${cb},0.12)`;
                                                }
                                                const onMove = (ev: MouseEvent) => { ev.preventDefault(); setBoxes(calcNewBoxes(ev.clientX)); };
                                                const onUp = () => {
                                                    document.body.style.cursor = '';
                                                    if (dot) {
                                                        dot.style.scale = '';
                                                        dot.style.boxShadow = baseShadow;
                                                    }
                                                    window.removeEventListener('mousemove', onMove);
                                                    window.removeEventListener('mouseup', onUp);
                                                };
                                                window.addEventListener('mousemove', onMove);
                                                window.addEventListener('mouseup', onUp);
                                            }}
                                            onTouchStart={(e) => {
                                                const barEl = e.currentTarget;
                                                const rect = barEl.getBoundingClientRect();
                                                const dot = barEl.querySelector('[data-slider-dot]') as HTMLElement | null;
                                                const baseShadow = `0 2px 6px rgba(${cr},${cg},${cb},0.35), 0 0 0 3px rgba(${cr},${cg},${cb},0.1)`;
                                                const calcNewBoxes = (clientX: number) => {
                                                    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                                                    const availRange = 1 - alreadyPct;
                                                    if (availRange <= 0) return 1;
                                                    const relFrac = Math.max(0, Math.min(1, (frac - alreadyPct) / availRange));
                                                    return Math.max(1, Math.min(remaining, Math.round(relFrac * remaining)));
                                                };
                                                if (e.touches[0]) setBoxes(calcNewBoxes(e.touches[0].clientX));
                                                if (dot) {
                                                    dot.style.scale = '1.45';
                                                    dot.style.boxShadow = `0 4px 16px rgba(${cr},${cg},${cb},0.5), 0 0 0 6px rgba(${cr},${cg},${cb},0.12)`;
                                                }
                                                const onMove = (ev: TouchEvent) => { if (ev.touches[0]) setBoxes(calcNewBoxes(ev.touches[0].clientX)); };
                                                const onUp = () => {
                                                    if (dot) {
                                                        dot.style.scale = '';
                                                        dot.style.boxShadow = baseShadow;
                                                    }
                                                    window.removeEventListener('touchmove', onMove);
                                                    window.removeEventListener('touchend', onUp);
                                                };
                                                window.addEventListener('touchmove', onMove, { passive: true });
                                                window.addEventListener('touchend', onUp);
                                            }}
                                        >
                                            <div className="w-full h-[6px] rounded-full bg-[#1A1A1A]/[0.04] overflow-hidden relative">
                                                {/* Already released segment */}
                                                <div
                                                    className="absolute left-0 top-0 h-full rounded-full bg-[#1A1A1A]/[0.08]"
                                                    style={{ width: `${alreadyPct * 100}%` }}
                                                />
                                                {/* Releasing now — animated */}
                                                <motion.div
                                                    className="absolute top-0 h-full rounded-full"
                                                    style={{
                                                        left: `${alreadyPct * 100}%`,
                                                        background: `linear-gradient(90deg, rgba(${cr},${cg},${cb},0.6), rgba(${cr},${cg},${cb},0.35))`,
                                                    }}
                                                    initial={false}
                                                    animate={{ width: `${releasePct * 100}%` }}
                                                    transition={{ type: 'spring', damping: 28, stiffness: 200 }}
                                                />
                                            </div>
                                            {/* Floating indicator dot — draggable handle */}
                                            <motion.div
                                                data-slider-dot=""
                                                className="absolute top-1/2 -translate-y-1/2 w-[16px] h-[16px] rounded-full border-2 border-white cursor-grab active:cursor-grabbing hover:scale-[1.2]"
                                                style={{
                                                    background: `rgb(${cr},${cg},${cb})`,
                                                    boxShadow: `0 2px 6px rgba(${cr},${cg},${cb},0.35), 0 0 0 3px rgba(${cr},${cg},${cb},0.1)`,
                                                    transition: 'scale 220ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 220ms ease',
                                                }}
                                                initial={false}
                                                animate={{ left: `calc(${(alreadyPct + releasePct) * 100}% - 8px)` }}
                                                transition={{ type: 'spring', damping: 28, stiffness: 200 }}
                                            />
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                const nb = Math.min(remaining, boxes + 1);
                                                setBoxes(nb);
                                                // Physics: w = mass of release (0→feather, 1→full load)
                                                const w = Math.min(1, nb / remaining);
                                                const dy = 0.4 + w * 2.6;
                                                const ds = 1 - w * 0.03;
                                                const os = 1 + w * 0.015;
                                                const dur = 280 + w * 280;
                                                const fade = 1 - w * 0.25;
                                                const ls = 1 - w * 0.025;
                                                const lo = 1 + w * 0.02;
                                                const glow = w * 0.1;
                                                const card = (e.currentTarget as HTMLElement).closest('[data-stock-card]');
                                                if (!card) return;
                                                const ring = card.querySelector('[data-ring-section]') as HTMLElement | null;
                                                const nums = card.querySelector('[data-numbers-section]') as HTMLElement | null;
                                                const legend = card.querySelector('[data-legend-section]') as HTMLElement | null;
                                                const sp = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
                                                ring?.animate([
                                                    { transform: 'translateY(0) scale(1)', offset: 0 },
                                                    { transform: `translateY(${-dy}px) scale(${ds})`, offset: 0.22 },
                                                    { transform: `translateY(${dy * 0.45}px) scale(${os})`, offset: 0.58 },
                                                    { transform: 'translateY(0) scale(1)', offset: 1 },
                                                ], { duration: dur, easing: sp });
                                                nums?.animate([
                                                    { transform: 'translateY(0)', opacity: '1', offset: 0 },
                                                    { transform: `translateY(${-dy * 1.1}px)`, opacity: String(fade), offset: 0.26 },
                                                    { transform: `translateY(${dy * 0.3}px)`, opacity: '1', offset: 0.62 },
                                                    { transform: 'translateY(0)', opacity: '1', offset: 1 },
                                                ], { duration: dur * 0.92, easing: sp, delay: w * 25 });
                                                legend?.animate([
                                                    { transform: 'scale(1)', offset: 0 },
                                                    { transform: `scale(${ls})`, offset: 0.3 },
                                                    { transform: `scale(${lo})`, offset: 0.65 },
                                                    { transform: 'scale(1)', offset: 1 },
                                                ], { duration: dur * 0.85, easing: sp, delay: w * 45 });
                                                if (glow > 0.01) {
                                                    (card as HTMLElement).animate([
                                                        { boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.5), inset 0 -1px 2px rgba(0,0,0,0.01)', offset: 0 },
                                                        { boxShadow: `inset 0 1px 3px rgba(255,255,255,0.5), inset 0 -1px 2px rgba(0,0,0,0.01), 0 0 0 1.5px rgba(${cr},${cg},${cb},${glow})`, offset: 0.35 },
                                                        { boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.5), inset 0 -1px 2px rgba(0,0,0,0.01)', offset: 1 },
                                                    ], { duration: dur, easing: 'ease-out' });
                                                }
                                            }}
                                            className="w-[40px] h-[36px] rounded-[10px] bg-[#1A1A1A]/[0.04] hover:bg-[#1A1A1A]/[0.07] flex items-center justify-center text-[#1A1A1A]/40 active:scale-90 transition-all text-[15px] font-bold"
                                        >+</button>
                                    </div>

                                    {/* Segment legend */}
                                    <div data-legend-section="" className="mt-3 flex items-center justify-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-[8px] h-[8px] rounded-full bg-[#1A1A1A]/[0.12]" />
                                            <span className="text-[10px] font-bold text-[#1A1A1A]/35">{alreadyReleased} released</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-[8px] h-[8px] rounded-full" style={{ background: `rgba(${cr},${cg},${cb},0.6)` }} />
                                            <span className="text-[10px] font-bold text-[#1A1A1A]/35">{boxes} releasing</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-[8px] h-[8px] rounded-full" style={{ background: `rgba(${cr},${cg},${cb},0.15)` }} />
                                            <span className="text-[10px] font-bold text-[#1A1A1A]/35">{afterRelease} remaining</span>
                                        </div>
                                    </div>

                                    {/* Low stock warning */}
                                    {urgency > 0.4 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-[10px] ${
                                                urgency > 0.8
                                                    ? 'bg-rose-500/[0.06] border border-rose-500/10'
                                                    : 'bg-amber-500/[0.06] border border-amber-500/10'
                                            }`}
                                        >
                                            <Package size={10} strokeWidth={2.5} className={urgency > 0.8 ? 'text-rose-500/50' : 'text-amber-500/50'} />
                                            <span className={`text-[9px] font-bold ${urgency > 0.8 ? 'text-rose-500/50' : 'text-amber-500/50'}`}>
                                                {urgency > 0.8 ? 'This will empty your stock completely' : 'Low stock after this release'}
                                            </span>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Divider */}
                    <div className="h-px bg-[#1A1A1A]/[0.04] mx-6" />

                    {/* Transaction PIN */}
                    <div className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`w-[24px] h-[24px] rounded-[7px] flex items-center justify-center transition-all duration-500 ${
                                pinVerified
                                    ? 'bg-emerald-500/[0.1] border border-emerald-500/20'
                                    : pinError
                                        ? 'bg-rose-500/[0.08] border border-rose-500/15'
                                        : 'bg-[#1A1A1A]/[0.03] border border-[#1A1A1A]/[0.05]'
                            }`}>
                                {pinVerified
                                    ? <ShieldCheck size={11} strokeWidth={2.5} className="text-emerald-500/70" />
                                    : <Lock size={11} strokeWidth={2.5} className={pinError ? 'text-rose-500/50' : 'text-[#1A1A1A]/25'} />
                                }
                            </div>
                            <div className="flex-1">
                                <label className="text-[9px] font-bold text-[#1A1A1A]/30 tracking-[0.8px] uppercase block">
                                    {pinVerified ? 'PIN Verified' : 'Transaction PIN'}
                                </label>
                                {!pinVerified && (
                                    <span className="text-[9px] font-medium text-[#1A1A1A]/18 block mt-px">Owner authorization required</span>
                                )}
                            </div>
                            {pinVerified && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-[9px] font-bold text-emerald-600/50 bg-emerald-500/[0.06] px-2 py-0.5 rounded-full"
                                >
                                    Authorized
                                </motion.span>
                            )}
                        </div>

                        {!pinVerified ? (
                            <motion.div
                                animate={pinShake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
                                transition={{ duration: 0.45 }}
                                onAnimationComplete={() => setPinShake(false)}
                            >
                                <div className="flex items-center justify-center gap-2.5">
                                    {pin.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={pinRefs[i]}
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(-1);
                                                const newPin = [...pin];
                                                newPin[i] = val;
                                                setPin(newPin);
                                                setPinError(false);

                                                // Auto-advance to next field
                                                if (val && i < 3) {
                                                    pinRefs[i + 1].current?.focus();
                                                }

                                                // Auto-verify when all 4 digits entered
                                                if (val && i === 3) {
                                                    const fullPin = newPin.join('');
                                                    if (fullPin.length === 4) {
                                                        if (fullPin === SECRET_PIN) {
                                                            setPinVerified(true);
                                                            toast.success('PIN verified — release authorized');
                                                        } else {
                                                            setPinError(true);
                                                            setPinShake(true);
                                                            setPin(['', '', '', '']);
                                                            setTimeout(() => pinRefs[0].current?.focus(), 500);
                                                            toast.error('Incorrect PIN');
                                                        }
                                                    }
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                // Backspace moves to previous
                                                if (e.key === 'Backspace' && !pin[i] && i > 0) {
                                                    pinRefs[i - 1].current?.focus();
                                                }
                                            }}
                                            className={`w-[48px] h-[48px] rounded-[14px] text-center text-[20px] font-black tracking-wider transition-all duration-300 focus:outline-none ${
                                                pinError
                                                    ? 'bg-rose-500/[0.05] border-2 border-rose-500/20 text-rose-500/70'
                                                    : digit
                                                        ? 'bg-[#1A1A1A]/[0.06] border-2 border-[#1A1A1A]/10 text-[#1A1A1A]/80'
                                                        : 'bg-white/50 border-2 border-[#1A1A1A]/[0.05] text-[#1A1A1A]/80 focus:border-[#1A1A1A]/15 focus:bg-white/70'
                                            }`}
                                        />
                                    ))}
                                </div>
                                {pinError && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-[10px] font-bold text-rose-500/50 text-center mt-2.5"
                                    >
                                        Wrong PIN — try again
                                    </motion.p>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="flex items-center justify-center gap-1.5 py-2"
                            >
                                <div className="flex gap-1.5">
                                    {[0, 1, 2, 3].map((i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: i * 0.06, type: 'spring', stiffness: 400, damping: 20 }}
                                            className="w-[10px] h-[10px] rounded-full bg-emerald-500/30"
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 pt-2">
                        <div className="flex items-baseline justify-between mb-4">
                            <span className="text-[11px] font-bold text-[#1A1A1A]/35">Payment to authorize</span>
                            <span className="text-[24px] font-black text-[#1A1A1A] tabular-nums tracking-tight">${amount.toFixed(0)}</span>
                        </div>
                        <button
                            onClick={() => {
                                if (!name || !idCard || !vehicle) { toast.error('Fill in all fields'); return; }
                                if (!pinVerified) {
                                    toast.error('Enter your transaction PIN to authorize');
                                    pinRefs[0].current?.focus();
                                    return;
                                }
                                onSubmit({ name, idCard, vehicle, boxes, amount });
                            }}
                            className={`w-full flex items-center justify-center gap-2 rounded-[14px] py-3 font-bold text-[13px] active:scale-[0.98] transition-all duration-300 ${
                                pinVerified
                                    ? 'bg-[#1A1A1A] text-white hover:bg-[#2A2A2A]'
                                    : 'bg-[#1A1A1A]/[0.08] text-[#1A1A1A]/30 cursor-not-allowed'
                            }`}
                        >
                            {pinVerified ? <ShieldCheck size={13} strokeWidth={2.5} /> : <Lock size={13} strokeWidth={2} />}
                            {pinVerified ? 'Authorize & Release' : 'Enter PIN to Release'}
                        </button>
                    </div>
                </Glass>
            </motion.div>
        </motion.div>
    );
}


// ═══════════════════════════════════════════
// MAIN VIEW
// ═══════════════════════════════════════════
type ViewState = 'select' | 'inventory' | 'inbound' | 'onboarding';

export function WarehouseView() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const { isSeller, isAdmin, isLogistics } = useRole();
    const [view, setView] = useState<ViewState>('select');
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [inboundRequests, setInboundRequests] = useState<any[]>([]);
    const [listingRequests, setListingRequests] = useState<any[]>([]);
    const [editingListingRequest, setEditingListingRequest] = useState<any | null>(null);
    const [listingEditSaving, setListingEditSaving] = useState(false);
    const [listingEditDraft, setListingEditDraft] = useState({
        product_name: '',
        company_name: '',
        description: '',
        unit_price: '',
        moq: '1',
        sku: '',
        hs_code: '',
        origin_country: '',
        origin_region: '',
        origin_city: '',
        lead_time_days: '',
        weight_grams: '',
        ship_time_min_days: '',
        ship_time_max_days: '',
    });
    const [releaseRequests, setReleaseRequests] = useState<ReleaseRequest[]>([]);
    const [releaseRecords, setReleaseRecords] = useState<ReleaseRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [inventoryPage, setInventoryPage] = useState(1);
    const [inventorySearch, setInventorySearch] = useState('');
    const [autoOrderSettings, setAutoOrderSettings] = useState<Record<string, { minThreshold: number; maxCapacity: number; enabled: boolean }>>({});

    const fetchWarehouseData = useCallback(async () => {
        try {
            setLoading(true);
            const [wRes, rRes, recRes, autoRes, inRes, lrRes] = await Promise.all([
                authedFetch('/api/v1/warehouse/dashboard/list_warehouses/'),
                authedFetch('/api/v1/warehouse/dashboard/release_requests/'),
                authedFetch('/api/v1/warehouse/dashboard/release_records/'),
                authedFetch('/api/v1/warehouse/dashboard/auto_order_settings/'),
                authedFetch('/api/v1/catalog/inbound-requests/'),
                authedFetch('/api/v1/catalog/seller/listing-requests/'),
            ]);

            if (wRes.ok) {
                const raw = await wRes.json();
                const mapped = Array.isArray(raw) ? raw.map(mapWarehouse).filter((x): x is Warehouse => !!x) : [];
                setWarehouses(mapped);
                if (mapped.length > 0) {
                    setSelectedWarehouse((prev) => mapped.find((w) => w.id === (prev?.id || '')) || mapped[0]);
                    setView('inventory');
                } else {
                    setSelectedWarehouse(null);
                    setView('select');
                }
            }

            if (rRes.ok) {
                const raw = await rRes.json();
                const mapped = Array.isArray(raw) ? raw.map(mapReleaseRequest).filter((x): x is ReleaseRequest => !!x) : [];
                setReleaseRequests(mapped);
            }

            if (recRes.ok) {
                const raw = await recRes.json();
                const mapped = Array.isArray(raw) ? raw.map(mapReleaseRecord).filter((x): x is ReleaseRecord => !!x) : [];
                setReleaseRecords(mapped);
            }

            if (inRes.ok) {
                const raw = await inRes.json();
                setInboundRequests(Array.isArray(raw) ? raw : []);
            }

            if (lrRes.ok) {
                const raw = await lrRes.json();
                setListingRequests(Array.isArray(raw) ? raw : []);
            }

            if (autoRes.ok) {
                const raw = await autoRes.json().catch(() => ({}));
                if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
                    const mapped: Record<string, { minThreshold: number; maxCapacity: number; enabled: boolean }> = {};
                    for (const [k, v] of Object.entries(raw as any)) {
                        const obj = v as any;
                        mapped[k] = {
                            minThreshold: asNumber(obj?.minThreshold ?? obj?.min_threshold, 50),
                            maxCapacity: asNumber(obj?.maxCapacity ?? obj?.max_capacity, 500),
                            enabled: obj?.enabled === undefined ? true : !!obj.enabled,
                        };
                    }
                    setAutoOrderSettings(mapped);
                }
            }
        } catch (err) {
            console.error('Warehouse fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [authedFetch]);

    const openListingFix = useCallback((lr: any) => {
        const meta = lr?.product_meta && typeof lr.product_meta === 'object' ? lr.product_meta : {};
        const origin = meta?.origin_location && typeof meta.origin_location === 'object' ? meta.origin_location : {};
        setListingEditDraft({
            product_name: asString(lr?.product_name),
            company_name: asString(lr?.company_name),
            description: asString(lr?.description),
            unit_price: asString(lr?.unit_price),
            moq: asString(lr?.moq ?? '1'),
            sku: asString(meta?.sku),
            hs_code: asString(meta?.hs_code),
            origin_country: asString(origin?.country),
            origin_region: asString(origin?.region),
            origin_city: asString(origin?.city),
            lead_time_days: asString(meta?.lead_time_days),
            weight_grams: asString(meta?.weight_grams),
            ship_time_min_days: asString(meta?.ship_time_min_days),
            ship_time_max_days: asString(meta?.ship_time_max_days),
        });
        setEditingListingRequest(lr);
    }, []);

    const closeListingFix = useCallback(() => {
        setEditingListingRequest(null);
        setListingEditSaving(false);
    }, []);

    const submitListingFix = useCallback(async () => {
        const lr = editingListingRequest;
        const id = Number(lr?.id || 0);
        if (!id) return;
        if (listingEditSaving) return;

        const payload: any = {
            product_name: listingEditDraft.product_name.trim(),
            company_name: listingEditDraft.company_name.trim(),
            description: listingEditDraft.description.trim(),
            unit_price: listingEditDraft.unit_price.trim(),
            moq: listingEditDraft.moq.trim(),
            sku: listingEditDraft.sku.trim(),
            hs_code: listingEditDraft.hs_code.trim(),
            origin_country: listingEditDraft.origin_country.trim(),
            origin_region: listingEditDraft.origin_region.trim(),
            origin_city: listingEditDraft.origin_city.trim(),
            lead_time_days: listingEditDraft.lead_time_days.trim(),
            weight_grams: listingEditDraft.weight_grams.trim(),
            ship_time_min_days: listingEditDraft.ship_time_min_days.trim(),
            ship_time_max_days: listingEditDraft.ship_time_max_days.trim(),
        };

        const missing: string[] = [];
        if (!payload.sku) missing.push('SKU');
        if (!payload.hs_code) missing.push('HS code');
        if (!payload.origin_country) missing.push('Origin country');
        if (!payload.lead_time_days) missing.push('Lead time');
        if (!payload.weight_grams) missing.push('Weight (grams)');
        if (!payload.ship_time_min_days || !payload.ship_time_max_days) missing.push('Shipping time range');
        if (!payload.product_name) missing.push('Product name');
        if (!payload.unit_price) missing.push('Unit price');
        if (missing.length) {
            toast.error('Missing required fields', { description: missing.join(', ') });
            return;
        }

        setListingEditSaving(true);
        try {
            const patchRes = await authedFetch(`/api/v1/catalog/seller/listing-requests/${id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const patchData = await patchRes.json().catch(() => null);
            if (!patchRes.ok) {
                toast.error('Update failed', { description: asString(patchData?.detail, `Could not update (${patchRes.status})`) });
                return;
            }

            const resubmitRes = await authedFetch(`/api/v1/catalog/seller/listing-requests/${id}/resubmit/`, { method: 'POST' });
            const resubmitData = await resubmitRes.json().catch(() => null);
            if (!resubmitRes.ok) {
                toast.error('Resubmit failed', { description: asString(resubmitData?.detail, `Could not resubmit (${resubmitRes.status})`) });
                return;
            }

            toast.success('Resubmitted for review', { description: 'Your updates were sent back to the compliance team.' });
            closeListingFix();
            fetchWarehouseData();
        } catch {
            toast.error('Resubmit failed', { description: 'Could not resubmit your changes.' });
        } finally {
            setListingEditSaving(false);
        }
    }, [authedFetch, closeListingFix, editingListingRequest, fetchWarehouseData, listingEditDraft, listingEditSaving]);

    const fetchInventory = useCallback(async (wId: string) => {
        try {
            const res = await authedFetch(`/api/v1/warehouse/dashboard/inventory/?warehouse_id=${wId}`);
            if (res.ok) {
                const raw = await res.json();
                const mapped = Array.isArray(raw)
                    ? raw.map((i: any) => mapInventoryItem(i, wId)).filter((x): x is InventoryItem => !!x)
                    : [];
                setInventory(mapped);
            }
        } catch (err) {
            console.error('Inventory fetch error:', err);
        }
    }, [authedFetch]);

    useEffect(() => {
        if (!mounted) return;
        fetchWarehouseData();
    }, [fetchWarehouseData, mounted]);

    useEffect(() => {
        if (!mounted || !selectedWarehouse?.id) return;
        fetchInventory(selectedWarehouse.id);
    }, [selectedWarehouse?.id, fetchInventory, mounted]);

    useEffect(() => {
        setInventoryPage(1);
    }, [selectedWarehouse?.id]);

    useEffect(() => {
        setInventoryPage(1);
    }, [inventorySearch]);

    const [releasingItem, setReleasingItem] = useState<InventoryItem | null>(null);
    const [prefillData, setPrefillData] = useState<{ name: string; idCard: string; vehicle: string; boxes: number } | undefined>();
    const [approvingRequest, setApprovingRequest] = useState<ReleaseRequest | null>(null);
    const [showAllFacilities, setShowAllFacilities] = useState(false);
    const [detailRecord, setDetailRecord] = useState<ReleaseRecord | null>(null);
    const autoOrderSaveTimers = useRef<Record<string, any>>({});
    
    // Warehouses that have user's stock (fallback to all warehouses if inventory is empty)
    const warehouseIdsWithStock = new Set(inventory.map(i => i.warehouseId));
    const warehousesWithStock = warehouseIdsWithStock.size > 0 ? warehouses.filter(w => warehouseIdsWithStock.has(w.id)) : warehouses;

    const qWare = searchQuery.trim().toLowerCase();
    const filteredWarehouses = warehousesWithStock.filter(w => {
        if (!qWare) return true;
        const name = (w.name || '').toLowerCase();
        const addr = (w.address || '').toLowerCase();
        return name.includes(qWare) || addr.includes(qWare);
    });

    // Per-warehouse stock stats (for selection view)
    const warehouseStockStats = (wId: string) => {
        const items = inventory.filter(i => i.warehouseId === wId);
        const len = items.length;
        const boxes = items.reduce((s, i) => s + (i.totalBoxes - i.releasedBoxes), 0);
        const value = items.reduce((s, i) => s + (i.totalBoxes - i.releasedBoxes) * i.unitPrice, 0);
        const pallets = items.reduce((s, i) => s + i.palletsCount, 0);
        const products = items
            .map((item, idx) => ({
                name: item.productName,
                boxes: item.totalBoxes - item.releasedBoxes,
                color: prodColor(len > 1 ? idx / (len - 1) : 0.2),
            }))
            .sort((a, b) => b.boxes - a.boxes);
        return { boxes, value, productCount: len, products, pallets };
    };

    const PAGE_SIZE = 10;

    const hasActiveWarehouse = Boolean(selectedWarehouse?.id);
    const effectiveView: ViewState = hasActiveWarehouse ? view : 'select';
    const activeWarehouse: Warehouse = selectedWarehouse ?? {
        id: '',
        name: '',
        address: '',
        distance: '',
        pricePerWeek: 0,
        rating: '',
        features: [],
        storedSince: undefined,
        hours: undefined,
        managerName: '',
        managerPhone: '',
    };

    const warehouseInventoryAll = hasActiveWarehouse ? inventory.filter(i => i.warehouseId === activeWarehouse.id) : [];
    const invSearch = inventorySearch.trim().toLowerCase();
    const warehouseInventory = invSearch
        ? warehouseInventoryAll.filter((it) => {
            const name = (it.productName || '').toLowerCase();
            const sku = (it.sku || '').toLowerCase();
            return name.includes(invSearch) || sku.includes(invSearch);
        })
        : warehouseInventoryAll;

    const inventoryTotal = warehouseInventory.length;
    const inventoryTotalPages = Math.max(1, Math.ceil(inventoryTotal / PAGE_SIZE));
    const inventoryPageSafe = Math.min(Math.max(1, inventoryPage), inventoryTotalPages);
    const inventoryStart = (inventoryPageSafe - 1) * PAGE_SIZE;
    const warehouseInventoryPage = warehouseInventory.slice(inventoryStart, inventoryStart + PAGE_SIZE);
    const inventoryRangeStart = inventoryTotal ? inventoryStart + 1 : 0;
    const inventoryRangeEnd = inventoryTotal ? Math.min(inventoryTotal, inventoryStart + warehouseInventoryPage.length) : 0;
    const totalBoxes = warehouseInventory.reduce((sum, i) => sum + (i.totalBoxes - i.releasedBoxes), 0);
    const totalPallets = warehouseInventory.reduce((sum, i) => sum + i.palletsCount, 0);
    const weeklyCharge = activeWarehouse.pricePerWeek;
    const stockValue = warehouseInventory.reduce((sum, i) => sum + (i.totalBoxes - i.releasedBoxes) * i.unitPrice, 0);

    // ─── Product color map: inventoryItemId → color from gradient ───
    const productColorMap = React.useMemo(() => {
        const map: Record<string, string> = {};
        const len = warehouseInventory.length;
        warehouseInventory.forEach((item, idx) => {
            map[item.id] = prodColor(len > 1 ? idx / (len - 1) : 0.2);
        });
        return map;
    }, [warehouseInventory]);

    // ─── Rent ───
    const storedSince = activeWarehouse.storedSince;
    const today = new Date('2026-02-10');
    const startDate = storedSince ? new Date(storedSince) : null;
    const daysDiff = startDate ? Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    const weeksStored = Math.ceil(daysDiff / 7);
    const rentToDate = weeksStored * weeklyCharge;
    const startLabel = startDate ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

    // ─── Hours ───
    const activeHoursLabel = getHoursLabel(activeWarehouse.hours);
    const activeIsOpen = isCurrentlyOpen(activeWarehouse.hours);

    const handleConfirmWarehouse = (w: Warehouse) => {
        setSelectedWarehouse(w);
        setShowAllFacilities(false);
        setView('inventory');
        toast.success(`Switched to ${w.name}`);
    };

    const orderIdFromRequest = useCallback((req: ReleaseRequest) => {
        const direct = (req.orderId || '').toString().trim();
        if (direct) return direct;
        const m = /^req-(\d+)$/.exec(req.id || '');
        return m ? m[1] : '';
    }, []);

    const persistAutoOrder = useCallback((inventoryItemId: string, next: { minThreshold: number; maxCapacity: number; enabled: boolean }) => {
        if (!inventoryItemId) return;
        if (autoOrderSaveTimers.current[inventoryItemId]) {
            clearTimeout(autoOrderSaveTimers.current[inventoryItemId]);
        }
        autoOrderSaveTimers.current[inventoryItemId] = setTimeout(async () => {
            try {
                await authedFetch('/api/v1/warehouse/dashboard/update_auto_order_settings/', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        inventory_item_id: inventoryItemId,
                        enabled: next.enabled,
                        min_threshold: next.minThreshold,
                        max_capacity: next.maxCapacity,
                    }),
                });
            } catch {
            }
        }, 450);
    }, [authedFetch]);

    const handleRelease = useCallback(async (data: { name: string; idCard: string; vehicle: string; boxes: number; amount: number }) => {
        if (!releasingItem) return;
        if (approvingRequest) {
            const oid = orderIdFromRequest(approvingRequest);
            if (!oid) {
                toast.error('Missing order id for this request.');
                return;
            }
            try {
                const wId = selectedWarehouse?.id || '';
                const res = await authedFetch(`/api/v1/warehouse/dashboard/release_requests/${oid}/approve/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        warehouse_id: wId,
                        recipient_name: data.name,
                        id_card_number: data.idCard,
                        vehicle_number: data.vehicle,
                        boxes_released: data.boxes,
                    }),
                });
                const payload = await res.json().catch(() => null);
                if (!res.ok) {
                    toast.error('Approve failed', { description: asString(payload?.detail, 'Could not approve release.') });
                    return;
                }
                toast.success(`${data.boxes} boxes released to ${data.name}`, {
                    description: `$${data.amount.toFixed(0)} payment authorized`,
                });
                setApprovingRequest(null);
                setReleasingItem(null);
                setPrefillData(undefined);
                await Promise.all([fetchWarehouseData(), wId ? fetchInventory(wId) : Promise.resolve()]);
            } catch {
                toast.error('Approve failed', { description: 'Could not approve release.' });
            }
            return;
        }

        toast.error('Manual release is not enabled for this mode.');
    }, [approvingRequest, authedFetch, fetchInventory, fetchWarehouseData, orderIdFromRequest, releasingItem, selectedWarehouse?.id]);

    const handleApproveRequest = (req: ReleaseRequest) => {
        const product = inventory.find(i => i.id === req.inventoryItemId);
        if (!product) return;
        setApprovingRequest(req);
        setReleasingItem(product);
        setPrefillData({
            name: req.requesterName,
            idCard: req.idCardNumber,
            vehicle: req.vehicleNumber,
            boxes: req.boxesRequested,
        });
    };

    const handleDeclineRequest = useCallback(async (req: ReleaseRequest) => {
        const oid = orderIdFromRequest(req);
        if (!oid) {
            toast.error('Missing order id for this request.');
            return;
        }
        try {
            const res = await authedFetch(`/api/v1/warehouse/dashboard/release_requests/${oid}/decline/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: '' }),
            });
            if (!res.ok) {
                const payload = await res.json().catch(() => null);
                toast.error('Decline failed', { description: asString(payload?.detail, 'Could not decline release.') });
                return;
            }
            setReleaseRequests(prev => prev.filter(r => r.id !== req.id));
            toast('Request declined', { description: `${req.requesterName}'s request for ${req.boxesRequested} boxes` });
        } catch {
            toast.error('Decline failed', { description: 'Could not decline release.' });
        }
    }, [authedFetch, orderIdFromRequest]);

    if (!mounted) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[1120px] mx-auto font-urbanist pb-16"
        >
            <AnimatePresence>
                {releasingItem && (
                    <ReleaseSheet
                        item={releasingItem}
                        onClose={() => { setApprovingRequest(null); setReleasingItem(null); setPrefillData(undefined); }}
                        onSubmit={(d) => { void handleRelease(d); }}
                        prefill={prefillData}
                        productColor={productColorMap[releasingItem.id]}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {detailRecord && (
                    <TransactionDetailSheet
                        record={detailRecord}
                        productName={inventory.find(item => item.id === detailRecord.inventoryItemId)?.productName}
                        productColor={productColorMap[detailRecord.inventoryItemId]}
                        onClose={() => setDetailRecord(null)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {editingListingRequest && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] flex items-center justify-center p-5"
                        style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)' }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) closeListingFix();
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 5 }}
                            transition={{ duration: 0.25, ease: EASE }}
                            className="w-full max-w-[720px] rounded-[26px] bg-white/95 backdrop-blur-2xl border border-white/40 overflow-hidden"
                            style={{ boxShadow: '0 24px 80px -12px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
                        >
                            <div className="px-6 py-5 border-b border-black/[0.06] flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="text-[14px] font-black text-[#1A1A1A] tracking-tight">Fix & Resubmit</div>
                                    <div className="text-[12px] font-medium text-[#1A1A1A]/45 mt-1 truncate">
                                        #{editingListingRequest.id} · {(editingListingRequest.product_name || '').toString()}
                                    </div>
                                </div>
                                <button onClick={closeListingFix} className="w-9 h-9 rounded-full bg-black/[0.04] flex items-center justify-center hover:bg-black/[0.06]">
                                    <X size={15} className="text-[#1A1A1A]/55" strokeWidth={2.5} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {(() => {
                                    const meta = editingListingRequest?.product_meta && typeof editingListingRequest.product_meta === 'object' ? editingListingRequest.product_meta : {};
                                    const msg = asString((meta as any)?.review_message, '');
                                    if (!msg) return null;
                                    return (
                                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 flex gap-3">
                                            <FileText size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                            <div className="min-w-0">
                                                <div className="text-[11px] font-black text-amber-700/80 uppercase tracking-[1.4px]">Admin requested changes</div>
                                                <div className="text-[12px] font-medium text-[#1A1A1A]/70 mt-1 whitespace-pre-wrap break-words">{msg}</div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        value={listingEditDraft.product_name}
                                        onChange={(e) => setListingEditDraft((p) => ({ ...p, product_name: e.target.value }))}
                                        placeholder="Product name"
                                        className="w-full px-4 py-3 rounded-2xl bg-black/[0.02] border border-black/[0.06] text-[13px] font-semibold text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#0171E3]/30"
                                    />
                                    <input
                                        value={listingEditDraft.company_name}
                                        onChange={(e) => setListingEditDraft((p) => ({ ...p, company_name: e.target.value }))}
                                        placeholder="Company name"
                                        className="w-full px-4 py-3 rounded-2xl bg-black/[0.02] border border-black/[0.06] text-[13px] font-semibold text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#0171E3]/30"
                                    />
                                    <input
                                        value={listingEditDraft.unit_price}
                                        onChange={(e) => setListingEditDraft((p) => ({ ...p, unit_price: e.target.value }))}
                                        placeholder="Unit price (e.g. 12.50)"
                                        className="w-full px-4 py-3 rounded-2xl bg-black/[0.02] border border-black/[0.06] text-[13px] font-semibold text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#0171E3]/30"
                                    />
                                    <input
                                        value={listingEditDraft.moq}
                                        onChange={(e) => setListingEditDraft((p) => ({ ...p, moq: e.target.value }))}
                                        placeholder="MOQ"
                                        className="w-full px-4 py-3 rounded-2xl bg-black/[0.02] border border-black/[0.06] text-[13px] font-semibold text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#0171E3]/30"
                                    />
                                </div>

                                <textarea
                                    value={listingEditDraft.description}
                                    onChange={(e) => setListingEditDraft((p) => ({ ...p, description: e.target.value }))}
                                    placeholder="Description"
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-2xl bg-black/[0.02] border border-black/[0.06] text-[13px] font-medium text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#0171E3]/30 resize-none"
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        value={listingEditDraft.sku}
                                        onChange={(e) => setListingEditDraft((p) => ({ ...p, sku: e.target.value }))}
                                        placeholder="SKU"
                                        className="w-full px-4 py-3 rounded-2xl bg-black/[0.02] border border-black/[0.06] text-[13px] font-semibold text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#0171E3]/30"
                                    />
                                    <input
                                        value={listingEditDraft.hs_code}
                                        onChange={(e) => setListingEditDraft((p) => ({ ...p, hs_code: e.target.value }))}
                                        placeholder="HS code"
                                        className="w-full px-4 py-3 rounded-2xl bg-black/[0.02] border border-black/[0.06] text-[13px] font-semibold text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#0171E3]/30"
                                    />
                                    <input
                                        value={listingEditDraft.origin_country}
                                        onChange={(e) => setListingEditDraft((p) => ({ ...p, origin_country: e.target.value }))}
                                        placeholder="Origin country"
                                        className="w-full px-4 py-3 rounded-2xl bg-black/[0.02] border border-black/[0.06] text-[13px] font-semibold text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#0171E3]/30"
                                    />
                                    <input
                                        value={listingEditDraft.lead_time_days}
                                        onChange={(e) => setListingEditDraft((p) => ({ ...p, lead_time_days: e.target.value }))}
                                        placeholder="Lead time (days)"
                                        className="w-full px-4 py-3 rounded-2xl bg-black/[0.02] border border-black/[0.06] text-[13px] font-semibold text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#0171E3]/30"
                                    />
                                    <input
                                        value={listingEditDraft.weight_grams}
                                        onChange={(e) => setListingEditDraft((p) => ({ ...p, weight_grams: e.target.value }))}
                                        placeholder="Weight (grams)"
                                        className="w-full px-4 py-3 rounded-2xl bg-black/[0.02] border border-black/[0.06] text-[13px] font-semibold text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#0171E3]/30"
                                    />
                                    <input
                                        value={listingEditDraft.ship_time_min_days}
                                        onChange={(e) => setListingEditDraft((p) => ({ ...p, ship_time_min_days: e.target.value }))}
                                        placeholder="Ship time min (days)"
                                        className="w-full px-4 py-3 rounded-2xl bg-black/[0.02] border border-black/[0.06] text-[13px] font-semibold text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#0171E3]/30"
                                    />
                                    <input
                                        value={listingEditDraft.ship_time_max_days}
                                        onChange={(e) => setListingEditDraft((p) => ({ ...p, ship_time_max_days: e.target.value }))}
                                        placeholder="Ship time max (days)"
                                        className="w-full px-4 py-3 rounded-2xl bg-black/[0.02] border border-black/[0.06] text-[13px] font-semibold text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#0171E3]/30"
                                    />
                                </div>
                            </div>

                            <div className="px-6 pb-6 pt-2 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeListingFix}
                                    className="px-4 py-2.5 rounded-full text-[12px] font-bold bg-black/[0.04] text-[#1A1A1A]/60 hover:bg-black/[0.06]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void submitListingFix()}
                                    disabled={listingEditSaving}
                                    className={`px-4 py-2.5 rounded-full text-[12px] font-black text-white flex items-center gap-2 ${
                                        listingEditSaving ? 'bg-[#1A1A1A]/40 cursor-not-allowed' : 'bg-[#1A1A1A] hover:bg-[#2A2A2A]'
                                    }`}
                                >
                                    <ArrowRight size={14} strokeWidth={2.5} />
                                    {listingEditSaving ? 'Submitting…' : 'Resubmit'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {effectiveView === 'select' ? (
                /* ═══ WAREHOUSE SELECTION ═══ */
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="max-w-[460px] mx-auto"
                >
                    <button
                        onClick={() => setView('inventory')}
                        className="flex items-center gap-1.5 text-[#1A1A1A]/35 hover:text-[#1A1A1A]/60 transition-colors mb-6 active:scale-[0.97]"
                    >
                        <ArrowLeft size={14} strokeWidth={2} />
                        <span className="text-[13px] font-bold">Back</span>
                    </button>

                    <div className="flex items-baseline gap-3 mb-1">
                        <h2 className="text-[26px] font-black text-[#1A1A1A] tracking-tight leading-tight">
                            Your Storage
                        </h2>
                        <span className="text-[12px] font-bold text-[#1A1A1A]/28 tabular-nums">
                            {warehousesWithStock.length}
                        </span>
                    </div>
                    <p className="text-[13px] font-medium text-[#1A1A1A]/25 mb-6">
                        Warehouses holding your inventory
                    </p>

                    <Glass className="bg-white/45 rounded-full px-4 py-2.5 mb-5 flex items-center gap-3">
                        <Search size={15} strokeWidth={2} className="text-[#1A1A1A]/20 flex-shrink-0" />
                        <input
                            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search city, warehouse, or zip..."
                            className="flex-1 bg-transparent text-[13px] font-medium text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/18 focus:outline-none"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-[#1A1A1A]/20 hover:text-[#1A1A1A]/45 transition-colors">
                                <X size={13} strokeWidth={2.5} />
                            </button>
                        )}
                        <SlidersHorizontal size={15} strokeWidth={2} className="text-[#1A1A1A]/20 flex-shrink-0 cursor-pointer hover:text-[#1A1A1A]/45 transition-colors" />
                    </Glass>

                    <div className="space-y-2.5">
                        {filteredWarehouses.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-12 flex flex-col items-center gap-2"
                            >
                                <Search size={20} strokeWidth={1.5} className="text-[#1A1A1A]/12" />
                                <span className="text-[13px] font-medium text-[#1A1A1A]/28">No warehouses match &ldquo;{searchQuery}&rdquo;</span>
                            </motion.div>
                        ) : filteredWarehouses.map((w, i) => {
                            const stats = warehouseStockStats(w.id);
                            return (
                                <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.35 }}>
                                    <WarehouseRow
                                        warehouse={w}
                                        isActive={w.id === activeWarehouse.id}
                                        onSelect={() => handleConfirmWarehouse(w)}
                                        stockBoxes={stats.boxes}
                                        stockValue={stats.value}
                                        products={stats.products}
                                        pallets={stats.pallets}
                                    />
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            ) : view === 'inventory' ? (
                /* ═══ INVENTORY DASHBOARD ═══ */
                <div className="space-y-5">

                    {/* ── Page title — warehouse name + address with copy ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: EASE }}
                        className="flex flex-col items-center text-center px-1"
                    >
                        <div className="flex items-center gap-2 mb-1.5">
                            <h1 className="text-[22px] lg:text-[26px] font-black text-[#1A1A1A] tracking-tight leading-[1.1]">
                                {activeWarehouse.name}
                            </h1>
                            <button
                                onClick={() => setView('select')}
                                className="flex items-center gap-0.5 text-[#1A1A1A]/25 hover:text-[#1A1A1A]/50 transition-colors active:scale-[0.97] flex-shrink-0"
                            >
                                <span className="text-[10px] font-bold">Change</span>
                                <ChevronRight size={10} strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="flex items-center text-[11px] font-medium text-[#1A1A1A]/30 gap-1.5 justify-center">
                            <MapPin size={10} strokeWidth={2} className="opacity-40 flex-shrink-0" />
                            <span>{activeWarehouse.address}</span>
                            <button
                                onClick={() => {
                                    const hoursText = activeHoursLabel ? `Hours: ${activeHoursLabel}${activeWarehouse.hours !== '24/7' && typeof activeWarehouse.hours === 'object' ? ` (${activeWarehouse.hours.days})` : ''}` : '';
                                    const text = `${activeWarehouse.name}\n${activeWarehouse.address}\n${hoursText}\nManager: ${activeWarehouse.managerName} · ${activeWarehouse.managerPhone}`;
                                    try {
                                        const ta = document.createElement('textarea');
                                        ta.value = text;
                                        ta.style.position = 'fixed';
                                        ta.style.opacity = '0';
                                        document.body.appendChild(ta);
                                        ta.select();
                                        document.execCommand('copy');
                                        document.body.removeChild(ta);
                                        toast.success('Location details copied');
                                    } catch {
                                        toast.error('Could not copy to clipboard');
                                    }
                                }}
                                className="text-[#1A1A1A]/20 hover:text-[#1A1A1A]/50 transition-colors active:scale-[0.92] flex-shrink-0"
                                title="Copy location, timings & contact"
                            >
                                <Copy size={10} strokeWidth={2} />
                            </button>
                        </div>
                    </motion.div>

                    {/* ── 2-column content ── */}
                    <div className="flex flex-col lg:flex-row gap-5 items-start mt-6">

                        {/* Left: Requests + Inventory */}
                        <div className="flex-1 w-full min-w-0 space-y-5">
                            {/* Tabs */}
                            <div className="flex items-center gap-6 mb-2 border-b border-[#1A1A1A]/[0.03]">
                                <button
                                    onClick={() => setView('inventory')}
                                    className={`pb-3 px-2 text-[13px] font-bold transition-all relative ${
                                        (view as string) === 'inventory' ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/25 hover:text-[#1A1A1A]/45'
                                    }`}
                                >
                                    Inventory
                                    {(view as string) === 'inventory' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A] rounded-full" />}
                                </button>
                                <button
                                    onClick={() => setView('inbound')}
                                    className={`pb-3 px-2 text-[13px] font-bold transition-all relative ${
                                        (view as string) === 'inbound' ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/25 hover:text-[#1A1A1A]/45'
                                    }`}
                                >
                                    Inbound
                                    {(view as string) === 'inbound' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A] rounded-full" />}
                                </button>
                                <button
                                    onClick={() => setView('onboarding')}
                                    className={`pb-3 px-2 text-[13px] font-bold transition-all relative ${
                                        (view as string) === 'onboarding' ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/25 hover:text-[#1A1A1A]/45'
                                    }`}
                                >
                                    Onboarding
                                    {(view as string) === 'onboarding' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A] rounded-full" />}
                                </button>
                            </div>

                            {/* Requests */}
                            {releaseRequests.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.08, duration: 0.5, ease: EASE }}
                                >
                                    <Glass className="bg-white/45 rounded-[22px] border border-[#1A1A1A]/[0.06] overflow-hidden">
                                        {/* ── Summary header with gradient ring ── */}
                                        <div className="px-5 pt-5 pb-4">
                                            <div className="flex items-center gap-4">
                                                {/* Requester avatar stack + request-size bars */}
                                                <div className="flex-shrink-0">
                                                    {/* Stacked initial circles */}
                                                    <div className="flex -space-x-2">
                                                        {releaseRequests.slice(0, 4).map((req, i) => {
                                                            const initials = req.requesterName.split(' ').map(w => w[0]).join('').slice(0, 2);
                                                            const color = productColorMap[req.inventoryItemId] || prodColor(0.2);
                                                            const [cr, cg, cb] = parseRgb(color);
                                                            return (
                                                                <motion.div
                                                                    key={req.id}
                                                                    className="w-[32px] h-[32px] rounded-full flex items-center justify-center backdrop-blur-sm"
                                                                    style={{
                                                                        zIndex: releaseRequests.length - i,
                                                                        background: `linear-gradient(145deg, rgba(255,255,255,0.85), rgba(${cr},${cg},${cb},0.12))`,
                                                                        border: `1px solid rgba(${cr},${cg},${cb},0.28)`,
                                                                        boxShadow: '0 1px 4px -1px rgba(0,0,0,0.07), 0 0.5px 1px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.55)',
                                                                    }}
                                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    transition={{ duration: 0.35, delay: 0.06 + i * 0.06, ease: EASE_OUT }}
                                                                >
                                                                    <span className="text-[10px] font-black text-[#1A1A1A]/48 leading-none select-none">{initials}</span>
                                                                </motion.div>
                                                            );
                                                        })}
                                                        {releaseRequests.length > 4 && (
                                                            <div
                                                                className="w-[32px] h-[32px] rounded-full flex items-center justify-center bg-white/60 backdrop-blur-sm border border-[#1A1A1A]/[0.06]"
                                                                style={{ zIndex: 0, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }}
                                                            >
                                                                <span className="text-[9px] font-bold text-[#1A1A1A]/22">+{releaseRequests.length - 4}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Request-size bars — proportional to boxes requested */}
                                                    <div className="flex gap-[3px] mt-2 pl-[3px]">
                                                        {(() => {
                                                            const maxV = Math.max(...releaseRequests.map(r => r.paymentAmount));
                                                            return releaseRequests.slice(0, 4).map((req, i) => {
                                                                const color = productColorMap[req.inventoryItemId] || prodColor(0.2);
                                                                const [cr, cg, cb] = parseRgb(color);
                                                                return (
                                                                <motion.div
                                                                    key={req.id}
                                                                    className="h-[3px] rounded-full"
                                                                    style={{
                                                                        width: Math.max(5, (req.paymentAmount / maxV) * 30),
                                                                        backgroundColor: `rgba(${cr},${cg},${cb},0.5)`,
                                                                    }}
                                                                    initial={{ scaleX: 0 }}
                                                                    animate={{ scaleX: 1 }}
                                                                    transition={{ duration: 0.4, delay: 0.28 + i * 0.05, ease: EASE_OUT }}
                                                                />
                                                            );});
                                                        })()}
                                                    </div>
                                                </div>

                                                {/* Summary info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-[13px] font-bold text-[#1A1A1A]/70">Release Requests</h3>
                                                        <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#56D7EA]/10 text-[9px] font-black text-[#1A1A1A]/30 tabular-nums">{releaseRequests.length}</span>
                                                    </div>
                                                    <p className="text-[10px] font-medium text-[#1A1A1A]/22 mt-1">Pending your approval</p>
                                                    <div className="flex items-center gap-1.5 mt-2.5">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full bg-[#CCF0A8]/25 text-[10px] font-bold text-[#1A1A1A]/40 tabular-nums">
                                                            <DollarSign size={9} strokeWidth={2.5} className="opacity-40" />
                                                            {releaseRequests.reduce((s, r) => s + r.paymentAmount, 0).toLocaleString()}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full bg-[#FDC3BF]/20 text-[10px] font-bold text-[#1A1A1A]/40 tabular-nums">
                                                            <Package size={9} strokeWidth={2.5} className="opacity-40" />
                                                            {releaseRequests.reduce((s, r) => s + r.boxesRequested, 0)} boxes
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Divider ── */}
                                        <div className="mx-5 h-px bg-[#1A1A1A]/[0.05]" />

                                        {/* ── Request items ── */}
                                        <div className="divide-y divide-[#1A1A1A]/[0.04]">
                                            {releaseRequests.map((req, i) => (
                                                <RequestCard
                                                    key={req.id}
                                                    request={req}
                                                    product={inventory.find(inv => inv.id === req.inventoryItemId)}
                                                    onApprove={() => handleApproveRequest(req)}
                                                    onDecline={() => handleDeclineRequest(req)}
                                                    index={i}
                                                    productColor={productColorMap[req.inventoryItemId]}
                                                />
                                            ))}
                                        </div>
                                    </Glass>
                                </motion.div>
                            )}

                            {/* Inventory / Auto-Order Controls */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.12, duration: 0.5, ease: EASE }}
                            >
                                {isSeller ? (
                                    // Seller: Auto-Order Limit Controls
                                    <>
                                        <div className="flex items-center justify-between mb-3 px-1">
                                            <span className="text-[9px] font-bold text-[#1A1A1A]/30 tracking-[1.5px] uppercase">Auto-Order Limits</span>
                                            <span className="text-[9px] font-bold text-[#0171E3]/35">{inventoryTotal} products</span>
                                        </div>
                                        <Glass className="bg-white/50 rounded-[20px] overflow-hidden">
                                            <div className="px-6 py-3 border-b border-[#1A1A1A]/[0.04]">
                                                <div className="relative">
                                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/25" />
                                                    <input
                                                        value={inventorySearch}
                                                        onChange={(e) => setInventorySearch(e.target.value)}
                                                        placeholder="Search products or SKU…"
                                                        className="w-full h-9 rounded-full pl-9 pr-3 text-[12px] font-semibold outline-none bg-white/70 border border-[#1A1A1A]/[0.06]"
                                                    />
                                                </div>
                                            </div>
                                            {/* Table header */}
                                            <div className="grid grid-cols-[1fr_auto_120px_auto] items-center gap-x-6 px-6 py-2.5 border-b border-[#1A1A1A]/[0.04]">
                                                <span className="text-[9px] font-bold text-[#1A1A1A]/22 tracking-[1px] uppercase">Product</span>
                                                <span className="text-[9px] font-bold text-[#1A1A1A]/22 tracking-[1px] uppercase text-center">Status</span>
                                                <span className="text-[9px] font-bold text-[#1A1A1A]/22 tracking-[1px] uppercase text-center">Thresholds</span>
                                                <span className="text-[9px] font-bold text-[#1A1A1A]/22 tracking-[1px] uppercase text-center">Auto-Order</span>
                                            </div>
                                            <div className="px-3 py-1">
                                                {warehouseInventoryPage.map((item, i) => {
                                                    const currentStock = item.totalBoxes - item.releasedBoxes;
                                                    const totalStock = item.totalBoxes;
                                                    
                                                    // Get or initialize settings for this item
                                                    const settings = autoOrderSettings[item.id] || { minThreshold: 50, maxCapacity: 500, enabled: true };
                                                    const { minThreshold, maxCapacity, enabled: autoOrderEnabled } = settings;
                                                    
                                                    const percent = Math.round((currentStock / totalStock) * 100);
                                                    const [cr, cg, cb] = productColorMap[item.id] ? parseRgb(productColorMap[item.id]) : [150, 150, 150];
                                                    
                                                    return (
                                                        <motion.div
                                                            key={item.id}
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
                                                            className={`grid grid-cols-[1fr_auto_120px_auto] items-center gap-x-6 py-[16px] px-3 ${ i !== warehouseInventoryPage.length - 1 ? 'border-b border-[#1A1A1A]/[0.04]' : '' } group cursor-default rounded-[14px] hover:bg-white/30 transition-all duration-400`}
                                                        >
                                                            {/* Column 1: Product */}
                                                            <div className="flex items-center gap-3.5 min-w-0">
                                                                <div
                                                                    className="w-[46px] h-[46px] rounded-[12px] bg-white/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.02),0_1px_3px_-1px_rgba(0,0,0,0.04)] flex items-center justify-center p-[5px] flex-shrink-0 overflow-hidden group-hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.02),0_2px_8px_-2px_rgba(0,0,0,0.06)] transition-shadow duration-500 relative"
                                                                    style={{ border: `1.5px solid rgba(${cr},${cg},${cb},0.2)` }}
                                                                >
                                                                    <ImageWithFallback
                                                                        src={item.image}
                                                                        alt={item.productName}
                                                                        className="max-w-full max-h-full object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 group-hover:scale-[1.05] transition-all duration-500 ease-out"
                                                                    />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className="text-[13px] font-bold text-[#1A1A1A]/80 leading-snug mb-[3px] truncate group-hover:text-[#1A1A1A]/90 transition-colors duration-500">
                                                                        {item.productName}
                                                                    </h4>
                                                                    <div className="flex items-center text-[10px] font-medium text-[#1A1A1A]/28">
                                                                        <span className="tabular-nums">{item.palletsCount} {item.palletsCount === 1 ? 'pallet' : 'pallets'}</span>
                                                                        <span className="mx-[6px] w-[3px] h-[3px] rounded-full bg-[#1A1A1A]/10 inline-block" />
                                                                        <span className="tabular-nums">{currentStock} boxes</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Column 2: Stock ring */}
                                                            <StockRing percent={percent} remaining={currentStock} total={totalStock} productColor={productColorMap[item.id]} />

                                                            {/* Column 3: Threshold Inputs */}
                                                            <div className="flex items-center gap-2 justify-center">
                                                                {/* Min */}
                                                                <div className="relative group/input">
                                                                    <input
                                                                        type="number"
                                                                        value={minThreshold}
                                                                        onChange={(e) => {
                                                                            const next = { ...settings, minThreshold: Number(e.target.value) };
                                                                            setAutoOrderSettings(prev => ({ ...prev, [item.id]: next }));
                                                                            persistAutoOrder(item.id, next);
                                                                        }}
                                                                        className="w-[52px] px-2 py-1.5 rounded-[18px] bg-white/70 backdrop-blur-sm border border-[#1A1A1A]/[0.06] text-[11px] font-bold text-[#1A1A1A]/70 text-center tabular-nums outline-none shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.02),0_1px_2px_-0.5px_rgba(0,0,0,0.03)] focus:border-[#0171E3]/25 focus:bg-white/90 focus:shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.02),0_0_0_2.5px_rgba(1,113,227,0.08),0_2px_6px_-1px_rgba(1,113,227,0.12)] transition-all duration-300"
                                                                    />
                                                                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] font-bold text-[#1A1A1A]/18 tracking-[0.5px] uppercase whitespace-nowrap">Min</span>
                                                                </div>
                                                                <span className="text-[10px] font-bold text-[#1A1A1A]/10">–</span>
                                                                {/* Max */}
                                                                <div className="relative group/input">
                                                                    <input
                                                                        type="number"
                                                                        value={maxCapacity}
                                                                        onChange={(e) => {
                                                                            const next = { ...settings, maxCapacity: Number(e.target.value) };
                                                                            setAutoOrderSettings(prev => ({ ...prev, [item.id]: next }));
                                                                            persistAutoOrder(item.id, next);
                                                                        }}
                                                                        className="w-[52px] px-2 py-1.5 rounded-[18px] bg-white/70 backdrop-blur-sm border border-[#1A1A1A]/[0.06] text-[11px] font-bold text-[#1A1A1A]/70 text-center tabular-nums outline-none shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.02),0_1px_2px_-0.5px_rgba(0,0,0,0.03)] focus:border-[#0171E3]/25 focus:bg-white/90 focus:shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.02),0_0_0_2.5px_rgba(1,113,227,0.08),0_2px_6px_-1px_rgba(1,113,227,0.12)] transition-all duration-300"
                                                                    />
                                                                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] font-bold text-[#1A1A1A]/18 tracking-[0.5px] uppercase whitespace-nowrap">Max</span>
                                                                </div>
                                                            </div>

                                                            {/* Column 4: Auto-Order Toggle */}
                                                            <button
                                                                onClick={() => {
                                                                    const next = { ...settings, enabled: !autoOrderEnabled };
                                                                    setAutoOrderSettings(prev => ({ ...prev, [item.id]: next }));
                                                                    persistAutoOrder(item.id, next);
                                                                }}
                                                                className={`relative w-[46px] h-[26px] rounded-full transition-all duration-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08),0_1px_2px_-0.5px_rgba(0,0,0,0.04)] ${autoOrderEnabled ? 'bg-[#0171E3] shadow-[inset_0_1px_2px_rgba(0,0,0,0.15),0_0_0_0px_rgba(1,113,227,0.2),0_2px_8px_-2px_rgba(1,113,227,0.4)]' : 'bg-[#1A1A1A]/[0.06]'}`}
                                                            >
                                                                <motion.div 
                                                                    className={`absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15),0_0_0_0.5px_rgba(0,0,0,0.04)]`}
                                                                    animate={{ left: autoOrderEnabled ? '23px' : '3px' }}
                                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                />
                                                            </button>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 py-3 border-t border-[#1A1A1A]/[0.04]">
                                                <div className="text-[10px] font-semibold text-[#1A1A1A]/35">
                                                    Showing <span className="tabular-nums">{inventoryRangeStart}</span>–<span className="tabular-nums">{inventoryRangeEnd}</span> of{" "}
                                                    <span className="tabular-nums">{inventoryTotal}</span>
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setInventoryPage((p) => Math.max(1, p - 1))}
                                                        disabled={inventoryPageSafe <= 1}
                                                        className="h-8 rounded-full border border-[#1A1A1A]/[0.08] bg-white/70 px-3 text-[11px] font-bold text-[#1A1A1A]/60 disabled:opacity-40"
                                                    >
                                                        Prev
                                                    </button>
                                                    <div className="text-[11px] font-bold text-[#1A1A1A]/45 tabular-nums px-2">
                                                        {inventoryPageSafe} / {inventoryTotalPages}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setInventoryPage((p) => Math.min(inventoryTotalPages, p + 1))}
                                                        disabled={inventoryPageSafe >= inventoryTotalPages}
                                                        className="h-8 rounded-full border border-[#1A1A1A]/[0.08] bg-white/70 px-3 text-[11px] font-bold text-[#1A1A1A]/60 disabled:opacity-40"
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        </Glass>
                                    </>
                                ) : (
                                    // Buyer: Regular Inventory Table
                                    <>
                                        <div className="flex items-center justify-between mb-3 px-1">
                                            <span className="text-[9px] font-bold text-[#1A1A1A]/30 tracking-[1.5px] uppercase">Inventory</span>
                                            <span className="text-[9px] font-bold text-[#1A1A1A]/20">{inventoryTotal} products</span>
                                        </div>
                                        <Glass className="bg-white/50 rounded-[20px] overflow-hidden">
                                            <div className="px-6 py-3 border-b border-[#1A1A1A]/[0.04]">
                                                <div className="relative">
                                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/25" />
                                                    <input
                                                        value={inventorySearch}
                                                        onChange={(e) => setInventorySearch(e.target.value)}
                                                        placeholder="Search products or SKU…"
                                                        className="w-full h-9 rounded-full pl-9 pr-3 text-[12px] font-semibold outline-none bg-white/70 border border-[#1A1A1A]/[0.06]"
                                                    />
                                                </div>
                                            </div>
                                            {/* Table header */}
                                            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-5 px-6 py-2.5 border-b border-[#1A1A1A]/[0.04]">
                                                <span className="text-[9px] font-bold text-[#1A1A1A]/22 tracking-[1px] uppercase">Product</span>
                                                <span className="text-[9px] font-bold text-[#1A1A1A]/22 tracking-[1px] uppercase text-center">Stock</span>
                                                <span className="text-[9px] font-bold text-[#1A1A1A]/22 tracking-[1px] uppercase text-right w-[80px]">Value</span>
                                                <span className="text-[9px] font-bold text-[#1A1A1A]/22 tracking-[1px] uppercase text-right pl-2">Action</span>
                                            </div>
                                            <div className="px-3 py-1">
                                                {warehouseInventoryPage.map((item, i) => (
                                                    <InventoryRow
                                                        key={item.id}
                                                        item={item}
                                                        isLast={i === warehouseInventoryPage.length - 1}
                                                        onRelease={() => { setReleasingItem(item); setPrefillData(undefined); }}
                                                        index={i}
                                                        productColor={productColorMap[item.id]}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 py-3 border-t border-[#1A1A1A]/[0.04]">
                                                <div className="text-[10px] font-semibold text-[#1A1A1A]/35">
                                                    Showing <span className="tabular-nums">{inventoryRangeStart}</span>–<span className="tabular-nums">{inventoryRangeEnd}</span> of{" "}
                                                    <span className="tabular-nums">{inventoryTotal}</span>
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setInventoryPage((p) => Math.max(1, p - 1))}
                                                        disabled={inventoryPageSafe <= 1}
                                                        className="h-8 rounded-full border border-[#1A1A1A]/[0.08] bg-white/70 px-3 text-[11px] font-bold text-[#1A1A1A]/60 disabled:opacity-40"
                                                    >
                                                        Prev
                                                    </button>
                                                    <div className="text-[11px] font-bold text-[#1A1A1A]/45 tabular-nums px-2">
                                                        {inventoryPageSafe} / {inventoryTotalPages}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setInventoryPage((p) => Math.min(inventoryTotalPages, p + 1))}
                                                        disabled={inventoryPageSafe >= inventoryTotalPages}
                                                        className="h-8 rounded-full border border-[#1A1A1A]/[0.08] bg-white/70 px-3 text-[11px] font-bold text-[#1A1A1A]/60 disabled:opacity-40"
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        </Glass>
                                    </>
                                )}
                            </motion.div>
                        </div>

                        {/* Right: Storage + Activity — all info in one card */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.6, ease: EASE }}
                            className="w-full lg:w-[280px] lg:sticky lg:top-20 flex-shrink-0"
                        >
                            <Glass className="bg-white/55 rounded-[20px] p-5">
                                {/* Section: Storage */}
                                <span className="text-[9px] font-bold text-[#1A1A1A]/25 tracking-[1.5px] uppercase block mb-3">Storage</span>

                                <div className="space-y-[10px]">
                                    {/* In-stock — product composition card */}
                                    {(() => {
                                        const totalFull = warehouseInventory.reduce((s, i) => s + i.totalBoxes, 0);
                                        const pct = totalFull > 0 ? Math.round((totalBoxes / totalFull) * 100) : 0;

                                        return (
                                            <div className="rounded-[18px] -mx-1 relative overflow-hidden" style={{
                                                background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, rgba(249,168,212,0.24), rgba(103,232,249,0.18) 50%, rgba(187,247,208,0.24)) border-box',
                                                border: '0.5px solid transparent',
                                            }}>
                                                {/* Glass overlay */}
                                                <div className="absolute inset-0 bg-white/[0.68] backdrop-blur-md" />
                                                {/* Gradient tint wash */}
                                                <div className="absolute inset-0 opacity-[0.04]" style={{ background: 'linear-gradient(135deg, #F9A8D4, #67E8F9 55%, #BBF7D0)' }} />
                                                {/* Ambient orb — top-right */}
                                                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #67E8F9, transparent 70%)' }} />
                                                {/* Ambient orb — bottom-left */}
                                                <div className="absolute -bottom-6 -left-4 w-20 h-20 rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #F9A8D4, transparent 70%)' }} />
                                                {/* Multi-layer shadow border */}
                                                <div className="absolute inset-0 rounded-[18px] shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.6),inset_0_-0.5px_1px_rgba(0,0,0,0.015),0_2px_8px_-2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.03)]" />

                                                <div className="relative z-10 px-4 pt-3.5 pb-3">
                                                    {(() => {
                                                        const productsAll = warehouseInventory
                                                            .map((item, idx, arr) => ({
                                                                name: item.productName.split(/\s*[—–]\s*/)[0].trim(),
                                                                remaining: item.totalBoxes - item.releasedBoxes,
                                                                flex: totalFull > 0 ? ((item.totalBoxes - item.releasedBoxes) / totalFull) * 100 : 0,
                                                                color: prodColor(arr.length > 1 ? idx / (arr.length - 1) : 0.2),
                                                            }))
                                                            .filter((p) => p.remaining > 0)
                                                            .sort((a, b) => b.remaining - a.remaining);

                                                        const top = productsAll.slice(0, 12);
                                                        const rest = productsAll.slice(12);
                                                        const restRemaining = rest.reduce((s, p) => s + p.remaining, 0);
                                                        const restFlex = totalFull > 0 ? (restRemaining / totalFull) * 100 : 0;
                                                        const segments = rest.length
                                                            ? [
                                                                ...top,
                                                                {
                                                                    name: "Other",
                                                                    remaining: restRemaining,
                                                                    flex: restFlex,
                                                                    color: "rgb(180,180,180)",
                                                                },
                                                            ]
                                                            : top;
                                                        const legend = rest.length
                                                            ? [
                                                                ...top,
                                                                {
                                                                    name: `+${rest.length} more`,
                                                                    remaining: restRemaining,
                                                                    flex: restFlex,
                                                                    color: "rgb(180,180,180)",
                                                                },
                                                            ]
                                                            : top;

                                                        const releasedFlex = totalFull > 0 ? ((totalFull - totalBoxes) / totalFull) * 100 : 0;

                                                        return (<>
                                                            {/* Header: label + live stocked badge */}
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className="text-[8px] font-bold text-[#1A1A1A]/22 tracking-[1.2px] uppercase">Inventory</span>
                                                                <motion.div
                                                                    className="flex items-center gap-[5px] px-[7px] py-[3px] rounded-full"
                                                                    style={{ background: 'linear-gradient(135deg, rgba(249,168,212,0.08), rgba(103,232,249,0.06), rgba(187,247,208,0.08))', boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.5)' }}
                                                                    initial={{ opacity: 0, scale: 0.85 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    transition={{ duration: 0.4, delay: 0.5, ease: EASE_OUT }}
                                                                >
                                                                    <div className="relative w-[5px] h-[5px]">
                                                                        <div className="absolute inset-0 rounded-full" style={{ background: pct > 60 ? 'linear-gradient(135deg, #67E8F9, #BBF7D0)' : 'linear-gradient(135deg, #F9A8D4, #67E8F9)' }} />
                                                                        <div className="absolute inset-[-2px] rounded-full animate-ping opacity-20" style={{ background: pct > 60 ? '#67E8F9' : '#F9A8D4' }} />
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-[#1A1A1A]/50 tabular-nums leading-none">{pct}%</span>
                                                                    <span className="text-[7px] font-bold text-[#1A1A1A]/18">stocked</span>
                                                                </motion.div>
                                                            </div>

                                                            {/* Product composition bar — segmented pills */}
                                                            <div className="relative rounded-[6px] overflow-hidden mb-4">
                                                                <div className="flex gap-[2.5px] h-[9px] p-[1px] rounded-[6px] bg-[#1A1A1A]/[0.025]" style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)' }}>
                                                                    {segments.map((p, i) => (
                                                                        <motion.div
                                                                            key={p.name + i}
                                                                            className="h-full rounded-[4.5px] relative overflow-hidden"
                                                                            style={{
                                                                                flex: `${p.flex} 0 0%`,
                                                                                minWidth: 4,
                                                                                backgroundColor: p.color,
                                                                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -0.5px 0 rgba(0,0,0,0.06), 0 0.5px 1px rgba(0,0,0,0.04)',
                                                                            }}
                                                                            initial={{ scaleX: 0 }}
                                                                            animate={{ scaleX: 1 }}
                                                                            transition={{ duration: 0.65, delay: 0.12 + i * 0.09, ease: EASE_OUT }}
                                                                        >
                                                                            <div className="absolute inset-x-0 top-0 h-[40%] rounded-t-[4px] bg-white/[0.22]" />
                                                                        </motion.div>
                                                                    ))}
                                                                    {releasedFlex > 0.5 && (
                                                                        <div className="h-full rounded-[4.5px] bg-[#1A1A1A]/[0.02]" style={{ flex: `${releasedFlex} 0 0%` }} />
                                                                    )}
                                                                </div>
                                                                {/* One-shot shimmer sweep */}
                                                                <motion.div
                                                                    className="absolute inset-y-0 w-[35%] rounded-[6px] pointer-events-none"
                                                                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.45) 55%, transparent)' }}
                                                                    initial={{ left: '-35%' }}
                                                                    animate={{ left: '135%' }}
                                                                    transition={{ duration: 1.1, delay: 1.0, ease: [0.25, 0.1, 0.25, 1] }}
                                                                />
                                                            </div>

                                                            {/* Metrics: boxes + pallets */}
                                                            <div className="flex items-start justify-between mb-3">
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 8 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ duration: 0.5, delay: 0.28, ease: EASE_OUT }}
                                                                >
                                                                    <span className="block text-[26px] font-black text-[#1A1A1A]/65 tabular-nums leading-none tracking-tight">{totalBoxes}</span>
                                                                    <span className="block mt-1 text-[8px] font-bold text-[#1A1A1A]/20 tracking-[1px] uppercase">boxes</span>
                                                                </motion.div>
                                                                <motion.div
                                                                    className="text-right"
                                                                    initial={{ opacity: 0, y: 8 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ duration: 0.5, delay: 0.36, ease: EASE_OUT }}
                                                                >
                                                                    <span className="block text-[26px] font-black text-[#1A1A1A]/65 tabular-nums leading-none tracking-tight">{totalPallets}</span>
                                                                    <span className="block mt-1 text-[8px] font-bold text-[#1A1A1A]/20 tracking-[1px] uppercase">pallets</span>
                                                                </motion.div>
                                                            </div>

                                                            {/* Product legend dots */}
                                                            <motion.div
                                                                className="flex flex-wrap gap-x-3.5 gap-y-[5px]"
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                transition={{ duration: 0.5, delay: 0.55, ease: EASE_OUT }}
                                                            >
                                                                {legend.map((p, i) => (
                                                                    <div key={i} className="flex items-center gap-[5px]">
                                                                        <div className="w-[8px] h-[4px] rounded-[1.5px] flex-shrink-0" style={{
                                                                            backgroundColor: p.color,
                                                                            boxShadow: `0 0 3px ${p.color}33`,
                                                                        }} />
                                                                        <span className="text-[8px] font-bold text-[#1A1A1A]/28 truncate" style={{ maxWidth: 62 }}>{p.name}</span>
                                                                    </div>
                                                                ))}
                                                            </motion.div>
                                                        </>);
                                                    })()}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {startLabel && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={11} strokeWidth={2} className="text-[#1A1A1A]/25" />
                                                <span className="text-[11px] font-medium text-[#1A1A1A]/35">Stored</span>
                                            </div>
                                            <span className="text-[11px] font-bold text-[#1A1A1A]/35 tabular-nums">{weeksStored} weeks</span>
                                        </div>
                                    )}

                                    {/* Rate */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={11} strokeWidth={2} className="text-[#1A1A1A]/25" />
                                            <span className="text-[11px] font-medium text-[#1A1A1A]/35">Rate</span>
                                        </div>
                                        <span className="text-[11px] font-bold text-[#1A1A1A]/45 tabular-nums">${weeklyCharge}/week</span>
                                    </div>

                                    {startLabel && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ArrowUpRight size={11} strokeWidth={2} className="text-[#1A1A1A]/25" />
                                                <span className="text-[11px] font-medium text-[#1A1A1A]/35">Rent to date</span>
                                            </div>
                                            <span className="text-[11px] font-bold text-[#1A1A1A]/35 tabular-nums">${rentToDate}</span>
                                        </div>
                                    )}

                                    {/* Stock value */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <WarehouseIcon size={11} strokeWidth={2} className="text-[#1A1A1A]/25" />
                                            <span className="text-[11px] font-medium text-[#1A1A1A]/35">Stock value</span>
                                        </div>
                                        <span className="text-[11px] font-bold text-[#1A1A1A]/45 tabular-nums">${stockValue.toLocaleString()}</span>
                                    </div>

                                    {/* Rating */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Star size={11} strokeWidth={2} className="text-[#1A1A1A]/25" />
                                            <span className="text-[11px] font-medium text-[#1A1A1A]/35">Rating</span>
                                        </div>
                                        <RatingBadge rating={activeWarehouse.rating} active />
                                    </div>

                                    {/* Facilities */}
                                    {(() => {
                                        const MAX_VISIBLE = 2;
                                        const features = activeWarehouse.features;
                                        const visible = features.slice(0, MAX_VISIBLE);
                                        const overflow = features.length - MAX_VISIBLE;
                                        return (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Check size={11} strokeWidth={2} className="text-[#1A1A1A]/25" />
                                                    <span className="text-[11px] font-medium text-[#1A1A1A]/35">Facilities</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {visible.map((f) => (
                                                        <div key={f} className="flex items-center gap-1 rounded-full bg-[#1A1A1A]/[0.03] px-2 py-0.5">
                                                            <div className="text-[#1A1A1A]/25">{featureIcon[f]}</div>
                                                            <span className="text-[9px] font-bold text-[#1A1A1A]/30">{featureLabel[f]}</span>
                                                        </div>
                                                    ))}
                                                    {overflow > 0 && (
                                                        <button
                                                            onClick={() => setShowAllFacilities(prev => !prev)}
                                                            className="flex items-center justify-center rounded-full bg-[#1A1A1A]/[0.04] hover:bg-[#1A1A1A]/[0.07] px-2 py-0.5 transition-colors active:scale-[0.94]"
                                                        >
                                                            <span className="text-[9px] font-bold text-[#1A1A1A]/35">{showAllFacilities ? '−' : `+${overflow}`}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Expanded facilities list */}
                                    <AnimatePresence>
                                        {showAllFacilities && activeWarehouse.features.length > 2 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="flex flex-wrap gap-1.5 pt-1 pl-[19px]">
                                                    {activeWarehouse.features.slice(2).map((f) => (
                                                        <div key={f} className="flex items-center gap-1 rounded-full bg-[#1A1A1A]/[0.03] px-2 py-0.5">
                                                            <div className="text-[#1A1A1A]/25">{featureIcon[f]}</div>
                                                            <span className="text-[9px] font-bold text-[#1A1A1A]/30">{featureLabel[f]}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-[#1A1A1A]/[0.04] my-4" />

                                {/* Section: Contact Details */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-bold text-[#1A1A1A]/25 tracking-[1.5px] uppercase">Contact Details</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const hoursText = activeHoursLabel ? `Hours: ${activeHoursLabel}${activeWarehouse.hours !== '24/7' && typeof activeWarehouse.hours === 'object' ? ` (${activeWarehouse.hours.days})` : ''}` : '';
                                            const text = `${activeWarehouse.name}\n${activeWarehouse.address}\n${hoursText}\nManager: ${activeWarehouse.managerName} · ${activeWarehouse.managerPhone}`;
                                            try {
                                                const ta = document.createElement('textarea');
                                                ta.value = text;
                                                ta.style.position = 'fixed';
                                                ta.style.opacity = '0';
                                                document.body.appendChild(ta);
                                                ta.select();
                                                document.execCommand('copy');
                                                document.body.removeChild(ta);
                                                toast.success('Contact details copied');
                                            } catch {
                                                toast.error('Could not copy');
                                            }
                                        }}
                                        className="text-[#1A1A1A]/20 hover:text-[#1A1A1A]/45 transition-colors active:scale-[0.92]"
                                        title="Copy all contact details"
                                    >
                                        <Copy size={10} strokeWidth={2} />
                                    </button>
                                </div>

                                <div className="space-y-[10px]">
                                    {/* Address */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={11} strokeWidth={2} className="text-[#1A1A1A]/25" />
                                            <span className="text-[11px] font-medium text-[#1A1A1A]/35">Location</span>
                                        </div>
                                        <span className="text-[11px] font-bold text-[#1A1A1A]/40 text-right max-w-[150px] truncate" title={activeWarehouse.address}>{activeWarehouse.address}</span>
                                    </div>

                                    {/* Hours — with Open/Closed dot */}
                                    {activeHoursLabel && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Clock size={11} strokeWidth={2} className="text-[#1A1A1A]/25" />
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-[5px] h-[5px] rounded-full ${activeIsOpen ? 'bg-emerald-500/60' : 'bg-rose-400/60'}`} />
                                                    <span className={`text-[11px] font-bold ${activeIsOpen ? 'text-emerald-600/50' : 'text-rose-500/50'}`}>
                                                        {activeIsOpen ? 'Open' : 'Closed'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-bold text-[#1A1A1A]/45 tabular-nums">
                                                {activeHoursLabel}
                                                {activeWarehouse.hours !== '24/7' && typeof activeWarehouse.hours === 'object' && (
                                                    <span className="text-[#1A1A1A]/20 font-medium ml-1">{activeWarehouse.hours.days}</span>
                                                )}
                                            </span>
                                        </div>
                                    )}

                                    {/* Manager */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <User size={11} strokeWidth={2} className="text-[#1A1A1A]/25" />
                                            <span className="text-[11px] font-medium text-[#1A1A1A]/35">{activeWarehouse.managerName}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Phone size={9} strokeWidth={2} className="text-[#1A1A1A]/22" />
                                            <span className="text-[11px] font-bold text-[#1A1A1A]/40 tabular-nums">{activeWarehouse.managerPhone}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-[#1A1A1A]/[0.04] my-4" />

                                {/* Section: Activity */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <Check size={10} strokeWidth={2.5} className="text-emerald-500/40" />
                                        <span className="text-[9px] font-bold text-[#1A1A1A]/25 tracking-[1.5px] uppercase">Released</span>
                                    </div>
                                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[#1A1A1A]/[0.05] px-1.5 text-[9px] font-bold text-[#1A1A1A]/30 tabular-nums">{releaseRecords.length}</span>
                                </div>
                                {releaseRecords.slice(0, 4).map((record, i) => (
                                    <TimelineRow
                                        key={record.id}
                                        record={record}
                                        isLast={i === Math.min(releaseRecords.length, 4) - 1}
                                        index={i}
                                        productName={inventory.find(item => item.id === record.inventoryItemId)?.productName}
                                        productColor={productColorMap[record.inventoryItemId]}
                                        onClick={() => setDetailRecord(record)}
                                    />
                                ))}
                            </Glass>
                        </motion.div>
                    </div>
                </div>
            ) : view === 'onboarding' ? (
                /* ═══ ONBOARDING DASHBOARD ═══ */
                <div className="flex flex-col lg:flex-row gap-5 items-start">
                    <div className="flex-1 w-full min-w-0 space-y-5">
                        <div className="flex items-center gap-6 mb-2 border-b border-[#1A1A1A]/[0.03]">
                            <button
                                onClick={() => setView('inventory')}
                                className={`pb-3 px-2 text-[13px] font-bold transition-all relative ${
                                    (view as string) === 'inventory' ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/25 hover:text-[#1A1A1A]/45'
                                }`}
                            >
                                Inventory
                                {(view as string) === 'inventory' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A] rounded-full" />}
                            </button>
                            <button
                                onClick={() => setView('inbound')}
                                className={`pb-3 px-2 text-[13px] font-bold transition-all relative ${
                                    (view as string) === 'inbound' ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/25 hover:text-[#1A1A1A]/45'
                                }`}
                            >
                                Inbound
                                {(view as string) === 'inbound' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A] rounded-full" />}
                            </button>
                            <button
                                onClick={() => setView('onboarding')}
                                className={`pb-3 px-2 text-[13px] font-bold transition-all relative ${
                                    (view as string) === 'onboarding' ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/25 hover:text-[#1A1A1A]/45'
                                }`}
                            >
                                Onboarding
                                {(view as string) === 'onboarding' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A] rounded-full" />}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {listingRequests.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-[#1A1A1A]/[0.02] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <PenLine size={24} className="text-[#1A1A1A]/10" />
                                    </div>
                                    <h3 className="text-[16px] font-bold text-[#1A1A1A]/40">No active listing requests</h3>
                                    <p className="text-[13px] text-[#1A1A1A]/25 mt-1">Submit your first product for onboarding.</p>
                                </div>
                            ) : listingRequests.map((lr, i) => (
                                <motion.div
                                    key={lr.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="p-6 rounded-[22px] bg-white/45 border border-[#1A1A1A]/[0.06]"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[14px] bg-white flex items-center justify-center shadow-sm overflow-hidden border border-[#1A1A1A]/[0.04]">
                                                {lr.photos?.[0]?.file_url ? (
                                                    <img src={lr.photos[0].file_url} alt={lr.product_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package size={20} className="text-[#1A1A1A]/20" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-[15px] font-bold text-[#1A1A1A]">{lr.product_name}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[11px] font-medium text-[#1A1A1A]/35">{lr.category_label || 'Uncategorized'}</span>
                                                    <span className="w-1 h-1 rounded-full bg-[#1A1A1A]/10" />
                                                    <span className="text-[11px] font-bold text-[#1A1A1A]/30">#{lr.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                lr.stage === 'live' || lr.stage === 'done' ? 'bg-emerald-500/10 text-emerald-600' :
                                                lr.stage === 'inspection' ? 'bg-amber-500/10 text-amber-600' :
                                                'bg-[#0171E3]/10 text-[#0171E3]'
                                            }`}>
                                                {lr.stage}
                                            </span>
                                            <span className="text-[10px] font-medium text-[#1A1A1A]/20">
                                                Submitted {new Date(lr.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="h-px bg-[#1A1A1A]/[0.04] mb-6" />
                                    
                                    <div className="flex flex-col items-center">
                                        <ListingStatusStepper lr={lr} />
                                        
                                        {lr.compliance_notes && (
                                            <div className="mt-6 w-full p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                                                <FileText size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <span className="text-[11px] font-bold text-amber-600/80 uppercase tracking-wider block mb-1">Admin Feedback</span>
                                                    <p className="text-[12px] text-[#1A1A1A]/60 leading-relaxed">{lr.compliance_notes}</p>
                                                </div>
                                            </div>
                                        )}

                                        {lr.stage === 'samples' && lr.product_meta?.review_message && (
                                            <div className="mt-4 w-full p-4 rounded-xl bg-[#0171E3]/5 border border-[#0171E3]/10 flex items-start justify-between gap-4">
                                                <div className="flex gap-3 min-w-0">
                                                    <PenLine size={16} className="text-[#0171E3] flex-shrink-0 mt-0.5" />
                                                    <div className="min-w-0">
                                                        <span className="text-[11px] font-black text-[#0171E3]/80 uppercase tracking-wider block mb-1">Changes requested</span>
                                                        <p className="text-[12px] text-[#1A1A1A]/65 leading-relaxed whitespace-pre-wrap break-words">
                                                            {String(lr.product_meta.review_message || '')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => openListingFix(lr)}
                                                    className="px-3 py-2 rounded-full bg-[#1A1A1A] text-white text-[11px] font-black whitespace-nowrap hover:bg-[#2A2A2A] active:scale-[0.98] transition-all"
                                                >
                                                    Fix & Resubmit
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* ═══ INBOUND DASHBOARD ═══ */
                <div className="space-y-5">
                    <div className="flex items-center gap-6 mb-2 border-b border-[#1A1A1A]/[0.03]">
                        <button
                            onClick={() => setView('inventory')}
                            className={`pb-3 px-2 text-[13px] font-bold transition-all relative ${
                                (view as string) === 'inventory' ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/25 hover:text-[#1A1A1A]/45'
                            }`}
                        >
                            Inventory
                            {(view as string) === 'inventory' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A] rounded-full" />}
                        </button>
                        <button
                            onClick={() => setView('inbound')}
                            className={`pb-3 px-2 text-[13px] font-bold transition-all relative ${
                                (view as string) === 'inbound' ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/25 hover:text-[#1A1A1A]/45'
                            }`}
                        >
                            Inbound
                            {(view as string) === 'inbound' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A] rounded-full" />}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {inboundRequests.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="w-16 h-16 bg-[#1A1A1A]/[0.02] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Package size={24} className="text-[#1A1A1A]/10" />
                                </div>
                                <h3 className="text-[16px] font-bold text-[#1A1A1A]/40">No inbound requests</h3>
                                <p className="text-[13px] text-[#1A1A1A]/25 mt-1">Start by sending products to our warehouse.</p>
                            </div>
                        ) : inboundRequests.map((req, i) => (
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-5 rounded-[22px] bg-white/45 border border-[#1A1A1A]/[0.06] flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                        <Truck size={18} className="text-[#1A1A1A]/40" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-[14px] font-bold text-[#1A1A1A]/80">#{req.id} · {req.warehouse_name}</h4>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                req.status === 'received' ? 'bg-emerald-500/10 text-emerald-600' :
                                                req.status === 'shipped' ? 'bg-blue-500/10 text-blue-600' :
                                                'bg-amber-500/10 text-amber-600'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <p className="text-[12px] text-[#1A1A1A]/35 mt-0.5">
                                            {(req.items?.length || 0) > 0 ? `${req.items.length} products` : (req.listing_request_product_name || "0 products")} · Sent by {req.seller_name}
                                        </p>
                                    </div>
                                </div>
                                {(isAdmin || isLogistics) && req.status === 'shipped' && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                const res = await authedFetch(`/api/v1/catalog/inbound-requests/${req.id}/receive/`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        items: req.items.map((it: any) => ({
                                                            id: it.id,
                                                            quantity_received: it.quantity_expected
                                                        }))
                                                    })
                                                });
                                                if (res.ok) {
                                                    toast.success('Inbound received & stock updated');
                                                    fetchWarehouseData();
                                                }
                                            } catch (e) {
                                                toast.error('Failed to receive');
                                            }
                                        }}
                                        className="px-4 py-2 rounded-full bg-emerald-500 text-white text-[12px] font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                    >
                                        Confirm Receipt
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
