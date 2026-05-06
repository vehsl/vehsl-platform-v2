"use client";

import React, { useState, useMemo } from 'react';
import { Order } from '@/components/order/data/mockOrders';
import { ChevronRight, Package, Search, X, Ship, Plane, Truck, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from '@/components/order/figma/ImageWithFallback';

function Glass({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`backdrop-blur-2xl border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55),inset_0_-0.5px_0_0_rgba(0,0,0,0.02),0_0_0_0.5px_rgba(0,0,0,0.03),0_1px_2px_0_rgba(0,0,0,0.025),0_4px_16px_-4px_rgba(0,0,0,0.045),0_24px_56px_-16px_rgba(0,0,0,0.06)] ${className}`}>
            {children}
        </div>
    );
}

type StatusFilter = 'all' | 'active' | 'delivered' | 'cancelled';

interface OrderHistoryListProps {
    orders: Order[];
    currentOrderId: string;
    onSelectOrder: (id: string) => void;
}

const statusConfig = (status: Order['status']) => {
    switch (status) {
        case 'Arriving':
        case 'Processing':
            return { color: 'text-blue-600/85', dot: 'bg-blue-500', bg: 'bg-blue-500/[0.06]', label: status };
        case 'In Transit':
            return { color: 'text-cyan-600/85', dot: 'bg-cyan-500', bg: 'bg-cyan-500/[0.06]', label: 'In Transit' };
        case 'Customs':
            return { color: 'text-amber-600/85', dot: 'bg-amber-500', bg: 'bg-amber-500/[0.06]', label: 'Customs' };
        case 'At Warehouse':
            return { color: 'text-violet-600/85', dot: 'bg-violet-500', bg: 'bg-violet-500/[0.06]', label: 'At Warehouse' };
        case 'Delivered':
            return { color: 'text-emerald-600/85', dot: 'bg-emerald-500', bg: 'bg-emerald-500/[0.06]', label: 'Delivered' };
        case 'Cancelled':
            return { color: 'text-[#1A1A1A]/35', dot: 'bg-[#1A1A1A]/25', bg: 'bg-[#1A1A1A]/[0.03]', label: 'Cancelled' };
        default:
            return { color: 'text-[#1A1A1A]/35', dot: 'bg-[#1A1A1A]/25', bg: 'bg-[#1A1A1A]/[0.03]', label: status };
    }
};

const shipmentIcon = (type?: string) => {
    switch (type) {
        case 'FCL': return <Ship size={10} strokeWidth={2} className="text-[#1A1A1A]/20" />;
        case 'LCL': return <Box size={10} strokeWidth={2} className="text-[#1A1A1A]/20" />;
        case 'Air': return <Plane size={10} strokeWidth={2} className="text-[#1A1A1A]/20" />;
        case 'Express': return <Truck size={10} strokeWidth={2} className="text-[#1A1A1A]/20" />;
        default: return <Package size={10} strokeWidth={2} className="text-[#1A1A1A]/20" />;
    }
};

function isActiveStatus(status: Order['status']): boolean {
    return ['Arriving', 'Processing', 'In Transit', 'Customs', 'At Warehouse'].includes(status);
}

export function OrderHistoryList({ orders, currentOrderId, onSelectOrder }: OrderHistoryListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [showAll, setShowAll] = useState(false);

    const otherOrders = orders.filter(o => o.id !== currentOrderId);

    const filteredOrders = useMemo(() => {
        let result = otherOrders;

        // Status filter
        if (statusFilter === 'active') {
            result = result.filter(o => isActiveStatus(o.status));
        } else if (statusFilter === 'delivered') {
            result = result.filter(o => o.status === 'Delivered');
        } else if (statusFilter === 'cancelled') {
            result = result.filter(o => o.status === 'Cancelled');
        }

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(o =>
                o.orderNumber.toLowerCase().includes(q) ||
                o.items.some(i => i.name.toLowerCase().includes(q)) ||
                (o.buyerCompany && o.buyerCompany.toLowerCase().includes(q)) ||
                (o.poNumber && o.poNumber.toLowerCase().includes(q)) ||
                o.seller.name.toLowerCase().includes(q)
            );
        }

        return result;
    }, [otherOrders, statusFilter, searchQuery]);

    const displayOrders = showAll ? filteredOrders : filteredOrders.slice(0, 6);
    const hasMore = filteredOrders.length > 6 && !showAll;

    // Counts for filter tabs
    const activeCt = otherOrders.filter(o => isActiveStatus(o.status)).length;
    const deliveredCt = otherOrders.filter(o => o.status === 'Delivered').length;
    const cancelledCt = otherOrders.filter(o => o.status === 'Cancelled').length;

    if (otherOrders.length === 0) return null;

    const filters: { key: StatusFilter; label: string; count: number }[] = [
        { key: 'all', label: 'All', count: otherOrders.length },
        { key: 'active', label: 'Active', count: activeCt },
        { key: 'delivered', label: 'Delivered', count: deliveredCt },
        { key: 'cancelled', label: 'Cancelled', count: cancelledCt },
    ];

    return (
        <div className="w-full max-w-[1120px] mx-auto mt-14 pb-24 font-urbanist">
            {/* Section header */}
            <div className="flex items-center gap-4 mb-5 px-1">
                <span className="text-[10px] font-bold text-[#1A1A1A]/30 tracking-[1.5px] uppercase">Order History</span>
                <div className="h-px bg-[#1A1A1A]/6 flex-1" />
                <span className="text-[10px] font-bold text-[#1A1A1A]/20 tabular-nums">{orders.length} total</span>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                {/* Search */}
                <Glass className="bg-white/45 rounded-full px-4 py-2 flex items-center gap-2.5 flex-1">
                    <Search size={14} strokeWidth={2} className="text-[#1A1A1A]/20 flex-shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search orders, PO numbers, products..."
                        className="flex-1 bg-transparent text-[12px] font-medium text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/18 focus:outline-none"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="text-[#1A1A1A]/20 hover:text-[#1A1A1A]/45 transition-colors"
                        >
                            <X size={12} strokeWidth={2.5} />
                        </button>
                    )}
                </Glass>

                {/* Status filter pills */}
                <div className="flex items-center gap-1 bg-[#1A1A1A]/[0.02] rounded-full p-[3px] flex-shrink-0">
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => { setStatusFilter(f.key); setShowAll(false); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-250 text-[10px] font-bold ${
                                statusFilter === f.key
                                    ? 'bg-white/80 text-[#1A1A1A]/80 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_0_0_0.5px_rgba(0,0,0,0.04)]'
                                    : 'text-[#1A1A1A]/30 hover:text-[#1A1A1A]/50'
                            }`}
                        >
                            {f.label}
                            {f.count > 0 && (
                                <span className={`tabular-nums text-[9px] ${statusFilter === f.key ? 'text-[#1A1A1A]/40' : 'text-[#1A1A1A]/18'}`}>
                                    {f.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Order cards */}
            <AnimatePresence mode="wait">
                {filteredOrders.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-16 flex flex-col items-center gap-3"
                    >
                        <Search size={24} strokeWidth={1.5} className="text-[#1A1A1A]/10" />
                        <p className="text-[13px] font-medium text-[#1A1A1A]/25">
                            {searchQuery
                                ? `No orders match "${searchQuery}"`
                                : 'No orders in this category'
                            }
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key={statusFilter + searchQuery}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <Glass className="bg-white/45 rounded-[20px] overflow-hidden">
                            {displayOrders.map((order, index) => {
                                const cfg = statusConfig(order.status);
                                const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);

                                return (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.04, duration: 0.35 }}
                                        onClick={() => onSelectOrder(order.id)}
                                        className={`group cursor-pointer px-5 py-4 hover:bg-white/40 transition-all duration-300 active:scale-[0.998] ${
                                            index < displayOrders.length - 1 ? 'border-b border-white/30' : ''
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                {/* Product thumbnail */}
                                                <div className="w-12 h-12 rounded-[12px] bg-white/50 flex items-center justify-center overflow-hidden flex-shrink-0 p-1.5">
                                                    {order.items[0]?.image ? (
                                                        <ImageWithFallback
                                                            src={order.items[0].image}
                                                            alt=""
                                                            className="w-full h-full object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                                                        />
                                                    ) : (
                                                        <Package className="text-[#1A1A1A]/25" size={16} />
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h4 className="text-[13px] font-bold text-[#1A1A1A]/85 leading-tight truncate group-hover:text-blue-600 transition-colors duration-300">
                                                            {order.items.length > 1
                                                                ? `${order.items[0].name} +${order.items.length - 1}`
                                                                : order.items[0].name}
                                                        </h4>
                                                    </div>
                                                    {/* Meta row 1: order # + date + company */}
                                                    <div className="flex items-center gap-2 text-[10px] font-medium text-[#1A1A1A]/30 flex-wrap">
                                                        <span className="tabular-nums">#{order.orderNumber}</span>
                                                        <span className="w-[3px] h-[3px] rounded-full bg-[#1A1A1A]/15" />
                                                        <span>{new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                        {order.buyerCompany && (
                                                            <>
                                                                <span className="w-[3px] h-[3px] rounded-full bg-[#1A1A1A]/15" />
                                                                <span className="truncate">{order.buyerCompany}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {/* Meta row 2: shipment details */}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {/* Mobile-only status badge */}
                                                        <div className={`sm:hidden inline-flex items-center gap-1 px-1.5 py-px rounded-full ${cfg.bg}`}>
                                                            <div className={`w-[3px] h-[3px] rounded-full ${cfg.dot}`} />
                                                            <span className={`text-[8px] font-bold ${cfg.color}`}>{cfg.label}</span>
                                                        </div>
                                                        {order.shipmentType && (
                                                            <div className="flex items-center gap-1 text-[9px] font-bold text-[#1A1A1A]/22">
                                                                {shipmentIcon(order.shipmentType)}
                                                                <span>{order.shipmentType}</span>
                                                            </div>
                                                        )}
                                                        {(order.containerCount ?? 0) > 0 && (
                                                            <>
                                                                <span className="w-[3px] h-[3px] rounded-full bg-[#1A1A1A]/10" />
                                                                <span className="text-[9px] font-bold text-[#1A1A1A]/22 tabular-nums">
                                                                    {order.containerCount} container{order.containerCount !== 1 ? 's' : ''}
                                                                </span>
                                                            </>
                                                        )}
                                                        <span className="w-[3px] h-[3px] rounded-full bg-[#1A1A1A]/10" />
                                                        <span className="text-[9px] font-bold text-[#1A1A1A]/22 tabular-nums">{totalItems} units</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-5 flex-shrink-0">
                                                {/* Price + Status */}
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-[14px] font-black text-[#1A1A1A]/75 mb-1 tabular-nums tracking-tight">
                                                        ${order.total.toLocaleString()}
                                                    </p>
                                                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${cfg.bg}`}>
                                                        <div className={`w-[4px] h-[4px] rounded-full ${cfg.dot}`} />
                                                        <span className={`text-[9px] font-bold ${cfg.color}`}>{cfg.label}</span>
                                                    </div>
                                                </div>

                                                <div className="w-7 h-7 rounded-full bg-white/45 flex items-center justify-center text-[#1A1A1A]/25 group-hover:bg-[#1A1A1A] group-hover:text-white transition-all duration-300">
                                                    <ChevronRight size={13} />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </Glass>

                        {/* Show more */}
                        {hasMore && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex justify-center mt-4"
                            >
                                <button
                                    onClick={() => setShowAll(true)}
                                    className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A1A1A]/30 hover:text-[#1A1A1A]/55 transition-colors duration-200 active:scale-[0.97]"
                                >
                                    Show {filteredOrders.length - 6} more orders
                                    <ChevronRight size={11} strokeWidth={2.5} />
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}