"use client";

import React from 'react';
import { motion } from 'motion/react';
import type { ApiOrder } from './order-types';
import { Package, Truck, DollarSign, CheckCircle2 } from 'lucide-react';

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

function Glass({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`backdrop-blur-2xl border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55),inset_0_-0.5px_0_0_rgba(0,0,0,0.02),0_0_0_0.5px_rgba(0,0,0,0.03),0_1px_2px_0_rgba(0,0,0,0.025),0_4px_16px_-4px_rgba(0,0,0,0.045),0_24px_56px_-16px_rgba(0,0,0,0.06)] ${className}`}>
            {children}
        </div>
    );
}

interface MetricCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    subValue?: string;
    accent?: string;
    delay?: number;
}

function MetricCard({ icon, label, value, subValue, accent = 'rgba(0,113,227,0.1)', delay = 0 }: MetricCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: EASE }}
            className="flex-1 min-w-0"
        >
            <div className="flex items-center gap-3">
                <div
                    className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: accent }}
                >
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-[9px] font-bold text-[#1A1A1A]/25 tracking-[1.2px] uppercase truncate">{label}</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[20px] font-black text-[#1A1A1A]/85 tabular-nums tracking-tight leading-tight">{value}</span>
                        {subValue && (
                            <span className="text-[10px] font-medium text-[#1A1A1A]/30 truncate">{subValue}</span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

interface OrdersMetricsProps {
    orders: ApiOrder[];
}

export function OrdersMetrics({ orders }: OrdersMetricsProps) {
    const status = (s: string) => (s || '').toLowerCase();
    const activeOrders = orders.filter(o => ['created', 'accepted', 'shipped', 'disputed'].includes(status(o.status)));
    const shippedOrders = orders.filter(o => status(o.status) === 'shipped');
    const deliveredOrders = orders.filter(o => ['delivered', 'completed'].includes(status(o.status)));

    // Total spend this month
    const now = new Date();
    const thisMonthOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlySpend = thisMonthOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const fmtSpend = monthlySpend >= 10000
        ? `$${(monthlySpend / 1000).toFixed(0)}k`
        : `$${monthlySpend.toLocaleString()}`;

    // Delivery rate
    const completable = orders.filter(o => status(o.status) !== 'cancelled');
    const rate = completable.length > 0
        ? Math.round((deliveredOrders.length / completable.length) * 100)
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[1120px] mx-auto mb-8"
        >
            <Glass className="bg-white/50 rounded-[20px] px-5 py-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-4">
                    <MetricCard
                        icon={<Package size={15} strokeWidth={2} className="text-blue-600/70" />}
                        label="Active"
                        value={String(activeOrders.length)}
                        subValue={`of ${orders.length} orders`}
                        accent="rgba(59,130,246,0.08)"
                        delay={0.05}
                    />
                    <MetricCard
                        icon={<Truck size={15} strokeWidth={2} className="text-cyan-600/70" />}
                        label="In transit"
                        value={String(shippedOrders.length)}
                        subValue="shipments"
                        accent="rgba(6,182,212,0.08)"
                        delay={0.1}
                    />
                    <MetricCard
                        icon={<DollarSign size={15} strokeWidth={2} className="text-emerald-600/70" />}
                        label="This month"
                        value={fmtSpend}
                        subValue={`${thisMonthOrders.length} orders`}
                        accent="rgba(16,185,129,0.08)"
                        delay={0.15}
                    />
                    <MetricCard
                        icon={<CheckCircle2 size={15} strokeWidth={2} className="text-violet-600/70" />}
                        label="Delivered"
                        value={`${rate}%`}
                        subValue={`${deliveredOrders.length} complete`}
                        accent="rgba(139,92,246,0.08)"
                        delay={0.2}
                    />
                </div>
            </Glass>
        </motion.div>
    );
}
