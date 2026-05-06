"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
    Zap, Layers, ClipboardCheck, Factory, Truck, Check, X,
    ChevronRight, Clock, Boxes, Timer, Gauge, FileText, Globe,
    MapPin, Wallet, Calendar, DollarSign, Receipt,
    TrendingUp, TrendingDown, ShieldAlert
} from 'lucide-react';
import { B, C, Toggle, Sep } from './shared';

const PIPELINE_STAGES: { key: string; label: string; icon: React.ElementType; description: string; color: string; settingKey?: string }[] = [
    { key: 'accept', label: 'Accept', icon: Zap, description: 'Review & accept incoming orders', color: '#0071e3' },
    { key: 'sample', label: 'Sample', icon: Layers, description: 'Buyer approves pre-production sample', color: '#5856d6', settingKey: 'sampleApproval' },
    { key: 'qc', label: 'QC', icon: ClipboardCheck, description: 'Quality checkpoint before bulk run', color: '#ff9500', settingKey: 'qcCheckpoint' },
    { key: 'making', label: 'Making', icon: Factory, description: 'Full production run', color: '#34c759' },
    { key: 'pickup', label: 'Pickup', icon: Truck, description: 'Courier collects from your facility', color: '#ff3b30' },
];

export function SellerFulfillmentTab({ orderSettings, setOrderSettings }: { orderSettings: any; setOrderSettings: any }) {
    const set = (k: string, v: any) => setOrderSettings((p: any) => ({ ...p, [k]: v }));

    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const toggleSection = (key: string) => setExpandedSection(prev => prev === key ? null : key);
    const [pipelineInfo, setPipelineInfo] = useState<string | null>(null);

    /* ── Derived ── */
    const autoAccept = orderSettings.autoAccept ?? false;
    const threshold = orderSettings.autoAcceptThreshold ?? '5,000';
    const minQty = orderSettings.minOrderQty ?? 50;
    const deadline = orderSettings.responseDeadline ?? '24h';
    const leadTime = orderSettings.defaultLeadTime ?? 14;
    const capacity = orderSettings.weeklyCapacity ?? '2,000';
    const qcOn = orderSettings.qcCheckpoint ?? true;
    const sampleOn = orderSettings.sampleApproval ?? true;
    const carrier = orderSettings.preferredCarrier ?? 'DHL Express';
    const autoInvoice = orderSettings.autoInvoice ?? true;
    const exportDocs = orderSettings.exportDocs ?? true;
    const payoutSchedule = orderSettings.payoutSchedule ?? 'Weekly';
    const payoutCurrency = orderSettings.defaultCurrency ?? 'USD';

    const activeStages = PIPELINE_STAGES.filter(s => {
        if (s.settingKey === 'sampleApproval') return sampleOn;
        if (s.settingKey === 'qcCheckpoint') return qcOn;
        return true;
    }).length;

    const cycle = <T extends string | number>(key: string, options: readonly T[], label: string) => {
        const cur = orderSettings[key] ?? options[0];
        const idx = options.indexOf(cur as T);
        const next = options[(idx + 1) % options.length];
        set(key, next);
        toast(`${label}: ${next}`);
    };

    const payoutSteps = [
        { label: 'Order confirmed', color: '#0071e3' },
        { label: payoutSchedule === 'Instant' ? 'Instant release' : `${payoutSchedule} hold`, color: '#ff9500' },
        { label: `→ ${payoutCurrency}`, color: '#34c759' },
    ];

    return (
        <div>
            {/* ═══════════════════════════════════════
               1. PIPELINE SHAPE — The Form
               ═══════════════════════════════════════ */}
            <div className="mb-10">
                <p className="text-[13px] font-medium mb-1" style={{ color: C.text }}>Your pipeline</p>
                <p className="text-[12px] mb-5" style={{ color: B[600] }}>
                    {activeStages} of {PIPELINE_STAGES.length} stages active. Tap a stage to learn more, toggle optional ones.
                </p>

                {/* Pipeline nodes */}
                <div className="flex items-center justify-between relative px-1">
                    <div className="absolute left-[24px] right-[24px] top-[20px] h-[2px] rounded-full"
                        style={{ backgroundColor: 'rgba(0,0,0,0.05)' }} />

                    {PIPELINE_STAGES.map((stage) => {
                        const isOptional = !!stage.settingKey;
                        const isActive = isOptional ? (orderSettings[stage.settingKey!] ?? true) : true;
                        const isInfoOpen = pipelineInfo === stage.key;
                        const StageIcon = stage.icon;

                        return (
                            <div key={stage.key} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
                                <motion.button
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => {
                                        if (isOptional) {
                                            const next = !isActive;
                                            set(stage.settingKey!, next);
                                            toast(next ? `${stage.label} stage enabled` : `${stage.label} stage skipped`);
                                        }
                                        setPipelineInfo(isInfoOpen ? null : stage.key);
                                    }}
                                    className="w-[40px] h-[40px] rounded-full flex items-center justify-center relative border-none cursor-pointer transition-all duration-300"
                                    style={{
                                        backgroundColor: isActive ? `${stage.color}14` : 'rgba(0,0,0,0.03)',
                                        boxShadow: isActive
                                            ? `0 0 0 2px ${stage.color}30, 0 2px 8px ${stage.color}12`
                                            : '0 0 0 1.5px rgba(0,0,0,0.06)',
                                    }}>
                                    <StageIcon size={17} strokeWidth={1.6}
                                        style={{ color: isActive ? stage.color : B[100], transition: 'color 0.3s' }} />
                                    {isOptional && (
                                        <div className="absolute -top-[3px] -right-[3px] w-[14px] h-[14px] rounded-full flex items-center justify-center"
                                            style={{
                                                backgroundColor: isActive ? stage.color : 'rgba(0,0,0,0.12)',
                                                boxShadow: '0 0 0 2px white',
                                                transition: 'background-color 0.3s',
                                            }}>
                                            <Check size={8} strokeWidth={3} color="white" />
                                        </div>
                                    )}
                                </motion.button>

                                <span className="text-[10.5px] font-medium mt-2 text-center transition-colors duration-300"
                                    style={{ color: isActive ? C.text : B[100] }}>
                                    {stage.label}
                                </span>

                                {isOptional && !isActive && (
                                    <span className="text-[8.5px] font-medium tracking-[0.02em] mt-0.5" style={{ color: B[100] }}>
                                        skip
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Stage info tooltip */}
                <AnimatePresence>
                    {pipelineInfo && (() => {
                        const stage = PIPELINE_STAGES.find(s => s.key === pipelineInfo);
                        if (!stage) return null;
                        const isOptional = !!stage.settingKey;
                        const isActive = isOptional ? (orderSettings[stage.settingKey!] ?? true) : true;
                        return (
                            <motion.div
                                key={pipelineInfo}
                                initial={{ opacity: 0, y: -4, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -4, height: 0 }}
                                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden">
                                <div className="mt-4 rounded-[18px] p-4 flex items-start gap-3.5"
                                    style={{ backgroundColor: `${stage.color}06`, border: `1px solid ${stage.color}15` }}>
                                    <stage.icon size={16} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: stage.color }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold" style={{ color: C.text }}>{stage.label}</p>
                                        <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>{stage.description}</p>
                                        {isOptional ? (
                                            <p className="text-[11px] mt-2 font-medium" style={{ color: stage.color }}>
                                                {isActive ? 'Active — tap the node above to skip this stage' : 'Skipped — tap to re-enable'}
                                            </p>
                                        ) : (
                                            <p className="text-[11px] mt-2" style={{ color: B[100] }}>This stage is always part of your pipeline.</p>
                                        )}
                                    </div>
                                    <button onClick={() => setPipelineInfo(null)}
                                        className="flex-shrink-0 w-[24px] h-[24px] rounded-full flex items-center justify-center border-none cursor-pointer transition-colors hover:bg-black/[0.04]"
                                        style={{ backgroundColor: 'transparent' }}>
                                        <X size={12} strokeWidth={2} style={{ color: B[600] }} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>
            </div>

            {/* ═══════════════════════════════════════
               2. ACCEPTANCE GATE
               ═══════════════════════════════════════ */}
            <div className="mb-2">
                <button onClick={() => toggleSection('acceptance')}
                    className="w-full flex items-center gap-4 py-4 text-left cursor-pointer border-none bg-transparent outline-none transition-opacity duration-150 hover:opacity-100"
                    style={{ opacity: expandedSection === 'acceptance' ? 1 : 0.88 }}>
                    <div className="w-[36px] h-[36px] rounded-[12px] flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(0,113,227,0.06)' }}>
                        <Zap size={17} strokeWidth={1.5} style={{ color: C.accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[14.5px] font-semibold" style={{ color: C.text }}>Order acceptance</p>
                        <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>
                            {autoAccept ? `Auto-accept under $${threshold}` : 'Manual review'} · {deadline} deadline · {minQty}+ units
                        </p>
                    </div>
                    <ChevronRight size={15} strokeWidth={1.5}
                        className="transition-transform duration-200"
                        style={{ color: B[100], transform: expandedSection === 'acceptance' ? 'rotate(90deg)' : 'rotate(0)' }} />
                </button>

                <AnimatePresence>
                    {expandedSection === 'acceptance' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden">
                            <div className="rounded-[22px] p-5 space-y-1" style={{ backgroundColor: 'rgba(0,0,0,0.018)' }}>
                                {/* Auto-accept — primary control */}
                                <div className="flex items-center gap-4 py-3">
                                    <Zap size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[13.5px] font-medium block" style={{ color: C.text }}>Auto-accept orders</span>
                                        <span className="text-[11.5px] block mt-0.5" style={{ color: B[600] }}>Automatically accept orders below your threshold</span>
                                    </div>
                                    <Toggle checked={autoAccept} onChange={v => { set('autoAccept', v); toast(v ? 'Auto-accept enabled' : 'Manual review required for all orders'); }} />
                                </div>

                                {/* Threshold — conditionally visible */}
                                <AnimatePresence>
                                    {autoAccept && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}>
                                            <div className="flex items-center gap-4 py-3 pl-10">
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-[13px] font-medium block" style={{ color: C.text }}>Value threshold</span>
                                                    <span className="text-[11px] block mt-0.5" style={{ color: B[600] }}>Orders above this need manual review</span>
                                                </div>
                                                <button onClick={() => cycle('autoAcceptThreshold', ['1,000', '2,500', '5,000', '10,000', '25,000'] as const, 'Threshold')}
                                                    className="text-[13px] font-semibold px-3 py-1.5 rounded-full border-none cursor-pointer transition-colors duration-150 hover:bg-black/[0.04]"
                                                    style={{ backgroundColor: 'rgba(0,113,227,0.06)', color: C.accent }}>
                                                    ${threshold}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <Sep />

                                {/* MOQ */}
                                <div className="flex items-center gap-4 py-3">
                                    <Boxes size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[13.5px] font-medium block" style={{ color: C.text }}>Minimum order quantity</span>
                                        <span className="text-[11.5px] block mt-0.5" style={{ color: B[600] }}>Auto-decline orders below this</span>
                                    </div>
                                    <button onClick={() => cycle('minOrderQty', [10, 25, 50, 100, 250, 500] as const, 'Min qty')}
                                        className="text-[13px] font-semibold px-3 py-1.5 rounded-full border-none cursor-pointer transition-colors duration-150 hover:bg-black/[0.04]"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: C.text }}>
                                        {minQty} units
                                    </button>
                                </div>

                                <Sep />

                                {/* Response deadline */}
                                <div className="flex items-center gap-4 py-3">
                                    <Clock size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[13.5px] font-medium block" style={{ color: C.text }}>Response deadline</span>
                                        <span className="text-[11.5px] block mt-0.5" style={{ color: B[600] }}>Auto-declines if you don't respond</span>
                                    </div>
                                    <button onClick={() => cycle('responseDeadline', ['12h', '24h', '48h', '72h'] as const, 'Deadline')}
                                        className="text-[13px] font-semibold px-3 py-1.5 rounded-full border-none cursor-pointer transition-colors duration-150 hover:bg-black/[0.04]"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: C.text }}>
                                        {deadline}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="h-px" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }} />

            {/* ═══════════════════════════════════════
               3. PRODUCTION RHYTHM
               ═══════════════════════════════════════ */}
            <div className="mb-2">
                <button onClick={() => toggleSection('production')}
                    className="w-full flex items-center gap-4 py-4 text-left cursor-pointer border-none bg-transparent outline-none transition-opacity duration-150 hover:opacity-100"
                    style={{ opacity: expandedSection === 'production' ? 1 : 0.88 }}>
                    <div className="w-[36px] h-[36px] rounded-[12px] flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(52,199,89,0.06)' }}>
                        <Gauge size={17} strokeWidth={1.5} style={{ color: C.success }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[14.5px] font-semibold" style={{ color: C.text }}>Production</p>
                        <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>
                            {leadTime}-day lead · {capacity}/week · {sampleOn ? 'sample' : '—'}{sampleOn && qcOn ? ' + ' : ''}{qcOn ? 'QC' : ''}
                        </p>
                    </div>
                    <ChevronRight size={15} strokeWidth={1.5}
                        className="transition-transform duration-200"
                        style={{ color: B[100], transform: expandedSection === 'production' ? 'rotate(90deg)' : 'rotate(0)' }} />
                </button>

                <AnimatePresence>
                    {expandedSection === 'production' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden">
                            <div className="rounded-[22px] p-5 space-y-1" style={{ backgroundColor: 'rgba(0,0,0,0.018)' }}>
                                {/* Lead time + capacity — two tappable metric tiles */}
                                <div className="flex gap-3 mb-3">
                                    <button onClick={() => cycle('defaultLeadTime', [7, 14, 21, 30, 45, 60] as const, 'Lead time')}
                                        className="flex-1 rounded-[16px] p-4 text-center border-none cursor-pointer transition-all duration-150 hover:bg-black/[0.025]"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                        <Timer size={16} strokeWidth={1.5} style={{ color: B[600] }} className="mx-auto mb-2" />
                                        <p className="text-[18px] font-semibold tracking-[-0.02em]" style={{ color: C.text }}>{leadTime}</p>
                                        <p className="text-[11px] mt-0.5" style={{ color: B[600] }}>days lead time</p>
                                    </button>
                                    <button onClick={() => cycle('weeklyCapacity', ['500', '1,000', '2,000', '5,000', '10,000'] as const, 'Capacity')}
                                        className="flex-1 rounded-[16px] p-4 text-center border-none cursor-pointer transition-all duration-150 hover:bg-black/[0.025]"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                        <Gauge size={16} strokeWidth={1.5} style={{ color: B[600] }} className="mx-auto mb-2" />
                                        <p className="text-[18px] font-semibold tracking-[-0.02em]" style={{ color: C.text }}>{capacity}</p>
                                        <p className="text-[11px] mt-0.5" style={{ color: B[600] }}>units / week</p>
                                    </button>
                                </div>

                                {/* Capacity usage bar */}
                                {(() => {
                                    const capNum = parseInt(capacity.replace(/,/g, ''));
                                    const usedPercent = Math.min(100, Math.round((3200 / capNum) * 100));
                                    const barColor = usedPercent > 80 ? '#ff3b30' : usedPercent > 60 ? '#ff9500' : '#34c759';
                                    return (
                                        <div className="rounded-[14px] p-3.5 mb-1" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11.5px] font-medium" style={{ color: B[600] }}>Current load</span>
                                                <span className="text-[11.5px] font-semibold" style={{ color: barColor }}>
                                                    ~3,200 queued · {usedPercent}%
                                                </span>
                                            </div>
                                            <div className="relative h-[5px] rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                                                <motion.div
                                                    className="absolute inset-y-0 left-0 rounded-full"
                                                    initial={{ width: '0%' }}
                                                    animate={{ width: `${usedPercent}%` }}
                                                    transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                                    style={{ backgroundColor: barColor }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })()}

                                <Sep />

                                {/* Sample approval */}
                                <div className="flex items-center gap-4 py-3">
                                    <Layers size={16} strokeWidth={1.5} style={{ color: sampleOn ? '#5856d6' : B[100] }} />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[13.5px] font-medium block" style={{ color: C.text }}>Require sample approval</span>
                                        <span className="text-[11.5px] block mt-0.5" style={{ color: B[600] }}>Buyer signs off before bulk production</span>
                                    </div>
                                    <Toggle checked={sampleOn} onChange={v => { set('sampleApproval', v); toast(v ? 'Sample stage enabled' : 'Sample stage skipped'); }} />
                                </div>

                                <Sep />

                                {/* QC checkpoint */}
                                <div className="flex items-center gap-4 py-3">
                                    <ClipboardCheck size={16} strokeWidth={1.5} style={{ color: qcOn ? '#ff9500' : B[100] }} />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[13.5px] font-medium block" style={{ color: C.text }}>QC checkpoint</span>
                                        <span className="text-[11.5px] block mt-0.5" style={{ color: B[600] }}>Pause for quality inspection before shipping</span>
                                    </div>
                                    <Toggle checked={qcOn} onChange={v => { set('qcCheckpoint', v); toast(v ? 'QC checkpoint on' : 'QC checkpoint off'); }} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="h-px" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }} />

            {/* ═══════════════════════════════════════
               4. DISPATCH
               ═══════════════════════════════════════ */}
            <div className="mb-2">
                <button onClick={() => toggleSection('dispatch')}
                    className="w-full flex items-center gap-4 py-4 text-left cursor-pointer border-none bg-transparent outline-none transition-opacity duration-150 hover:opacity-100"
                    style={{ opacity: expandedSection === 'dispatch' ? 1 : 0.88 }}>
                    <div className="w-[36px] h-[36px] rounded-[12px] flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(255,59,48,0.06)' }}>
                        <Truck size={17} strokeWidth={1.5} style={{ color: '#ff3b30' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[14.5px] font-semibold" style={{ color: C.text }}>Shipping & dispatch</p>
                        <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>
                            {carrier} · {autoInvoice ? 'auto-invoice' : 'manual invoice'} · {exportDocs ? 'docs attached' : 'manual docs'}
                        </p>
                    </div>
                    <ChevronRight size={15} strokeWidth={1.5}
                        className="transition-transform duration-200"
                        style={{ color: B[100], transform: expandedSection === 'dispatch' ? 'rotate(90deg)' : 'rotate(0)' }} />
                </button>

                <AnimatePresence>
                    {expandedSection === 'dispatch' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden">
                            <div className="rounded-[22px] p-5 space-y-1" style={{ backgroundColor: 'rgba(0,0,0,0.018)' }}>
                                {/* Carrier */}
                                <div className="flex items-center gap-4 py-3">
                                    <Truck size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[13.5px] font-medium block" style={{ color: C.text }}>Default carrier</span>
                                        <span className="text-[11.5px] block mt-0.5" style={{ color: B[600] }}>Shipping partner for outbound orders</span>
                                    </div>
                                    <button onClick={() => cycle('preferredCarrier', ['DHL Express', 'FedEx', 'Maersk', 'UPS', 'Local courier'] as const, 'Carrier')}
                                        className="text-[12.5px] font-semibold px-3 py-1.5 rounded-full border-none cursor-pointer transition-colors duration-150 hover:bg-black/[0.04]"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: C.text }}>
                                        {carrier}
                                    </button>
                                </div>

                                <Sep />

                                {/* Auto-invoice */}
                                <div className="flex items-center gap-4 py-3">
                                    <FileText size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[13.5px] font-medium block" style={{ color: C.text }}>Auto-generate invoice</span>
                                        <span className="text-[11.5px] block mt-0.5" style={{ color: B[600] }}>Creates invoice when order ships</span>
                                    </div>
                                    <Toggle checked={autoInvoice} onChange={v => { set('autoInvoice', v); toast(v ? 'Auto-invoice on' : 'Manual invoicing'); }} />
                                </div>

                                <Sep />

                                {/* Export docs */}
                                <div className="flex items-center gap-4 py-3">
                                    <Globe size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[13.5px] font-medium block" style={{ color: C.text }}>Export documentation</span>
                                        <span className="text-[11.5px] block mt-0.5" style={{ color: B[600] }}>Customs & export docs auto-attached</span>
                                    </div>
                                    <Toggle checked={exportDocs} onChange={v => { set('exportDocs', v); toast(v ? 'Export docs attached' : 'Manual attachment'); }} />
                                </div>

                                <Sep />

                                {/* Pickup address */}
                                <div role="button" tabIndex={0}
                                    onClick={() => toast('Opening pickup address', { description: 'Edit in Business tab → Pickup & dispatch.' })}
                                    className="flex items-center gap-4 py-3 cursor-pointer transition-opacity duration-150 hover:opacity-100 outline-none"
                                    style={{ opacity: 0.88 }}>
                                    <MapPin size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[13.5px] font-medium block" style={{ color: C.text }}>Pickup address</span>
                                        <span className="text-[11.5px] block mt-0.5" style={{ color: B[600] }}>Default factory collection point</span>
                                    </div>
                                    <ChevronRight size={14} strokeWidth={1.5} style={{ color: B[100] }} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="h-px" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }} />

            {/* ═══════════════════════════════════════
               5. PAYOUTS — The Settlement
               ═══════════════════════════════════════ */}
            <div className="mb-2">
                <button onClick={() => toggleSection('payouts')}
                    className="w-full flex items-center gap-4 py-4 text-left cursor-pointer border-none bg-transparent outline-none transition-opacity duration-150 hover:opacity-100"
                    style={{ opacity: expandedSection === 'payouts' ? 1 : 0.88 }}>
                    <div className="w-[36px] h-[36px] rounded-[12px] flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(255,149,0,0.06)' }}>
                        <Wallet size={17} strokeWidth={1.5} style={{ color: '#ff9500' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[14.5px] font-semibold" style={{ color: C.text }}>Payouts</p>
                        <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>
                            {payoutSchedule} in {payoutCurrency} · 9% deposit on $10K+
                        </p>
                    </div>
                    <ChevronRight size={15} strokeWidth={1.5}
                        className="transition-transform duration-200"
                        style={{ color: B[100], transform: expandedSection === 'payouts' ? 'rotate(90deg)' : 'rotate(0)' }} />
                </button>

                <AnimatePresence>
                    {expandedSection === 'payouts' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden">
                            <div className="rounded-[22px] p-5" style={{ backgroundColor: 'rgba(0,0,0,0.018)' }}>

                                {/* Payout flow visualization */}
                                <div className="rounded-[16px] p-4 mb-4" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.4px] mb-3" style={{ color: B[600] }}>Payout flow</p>
                                    <div className="flex items-center gap-0">
                                        {payoutSteps.map((step, i) => (
                                            <React.Fragment key={i}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-[8px] h-[8px] rounded-full flex-shrink-0" style={{ backgroundColor: step.color }} />
                                                    <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: C.text }}>{step.label}</span>
                                                </div>
                                                {i < payoutSteps.length - 1 && (
                                                    <div className="flex-1 min-w-[12px] h-px mx-2" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    {/* Schedule */}
                                    <div className="flex items-center gap-4 py-3">
                                        <Calendar size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[13.5px] font-medium block" style={{ color: C.text }}>Payout schedule</span>
                                            <span className="text-[11.5px] block mt-0.5" style={{ color: B[600] }}>When cleared funds transfer to your bank</span>
                                        </div>
                                        <button onClick={() => cycle('payoutSchedule', ['Instant', 'Daily', 'Weekly', 'Bi-weekly', 'Monthly'] as const, 'Payout')}
                                            className="text-[12.5px] font-semibold px-3 py-1.5 rounded-full border-none cursor-pointer transition-colors duration-150 hover:bg-black/[0.04]"
                                            style={{ backgroundColor: 'rgba(255,149,0,0.08)', color: '#e88b00' }}>
                                            {payoutSchedule}
                                        </button>
                                    </div>

                                    <Sep />

                                    {/* Currency */}
                                    <div className="flex items-center gap-4 py-3">
                                        <DollarSign size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[13.5px] font-medium block" style={{ color: C.text }}>Payout currency</span>
                                            <span className="text-[11.5px] block mt-0.5" style={{ color: B[600] }}>All earnings deposited in this currency</span>
                                        </div>
                                        <button onClick={() => cycle('defaultCurrency', ['USD', 'EUR', 'GBP'] as const, 'Currency')}
                                            className="text-[12.5px] font-semibold px-3 py-1.5 rounded-full border-none cursor-pointer transition-colors duration-150 hover:bg-black/[0.04]"
                                            style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: C.text }}>
                                            {payoutCurrency}
                                        </button>
                                    </div>

                                    <Sep />

                                    {/* History */}
                                    <div role="button" tabIndex={0}
                                        onClick={() => toast('Opening payout history...')}
                                        className="flex items-center gap-4 py-3 cursor-pointer transition-opacity duration-150 hover:opacity-100 outline-none"
                                        style={{ opacity: 0.88 }}>
                                        <Receipt size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[13.5px] font-medium block" style={{ color: C.text }}>Payout history</span>
                                            <span className="text-[11.5px] block mt-0.5" style={{ color: B[600] }}>Download past statements</span>
                                        </div>
                                        <ChevronRight size={14} strokeWidth={1.5} style={{ color: B[100] }} />
                                    </div>
                                </div>

                                {/* Bonus / penalty / deposit info cards */}
                                <div className="mt-4 space-y-2.5">
                                    <div className="rounded-[16px] p-4" style={{ backgroundColor: 'rgba(52,199,89,0.04)', border: '1px solid rgba(52,199,89,0.1)' }}>
                                        <div className="flex items-start gap-3">
                                            <TrendingUp size={15} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: C.success }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12.5px] font-semibold" style={{ color: C.text }}>Early delivery bonus</p>
                                                <p className="text-[11px] mt-0.5" style={{ color: B[600] }}>Up to 10% bonus for delivering ahead of schedule</p>
                                            </div>
                                            <span className="text-[11px] font-semibold px-2 py-[3px] rounded-full flex-shrink-0"
                                                style={{ backgroundColor: 'rgba(52,199,89,0.1)', color: C.success }}>+10% max</span>
                                        </div>
                                    </div>

                                    <div className="rounded-[16px] p-4" style={{ backgroundColor: 'rgba(255,59,48,0.03)', border: '1px solid rgba(255,59,48,0.08)' }}>
                                        <div className="flex items-start gap-3">
                                            <TrendingDown size={15} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: '#e84030' }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12.5px] font-semibold" style={{ color: C.text }}>Late delivery penalty</p>
                                                <p className="text-[11px] mt-0.5" style={{ color: B[600] }}>Progressive penalties with warnings before deduction — max 9%</p>
                                            </div>
                                            <span className="text-[11px] font-semibold px-2 py-[3px] rounded-full flex-shrink-0"
                                                style={{ backgroundColor: 'rgba(255,59,48,0.07)', color: C.danger }}>−9% max</span>
                                        </div>
                                    </div>

                                    <div className="rounded-[16px] p-4" style={{ backgroundColor: 'rgba(0,113,227,0.03)', border: '1px solid rgba(0,113,227,0.08)' }}>
                                        <div className="flex items-start gap-3">
                                            <ShieldAlert size={15} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: C.accent }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12.5px] font-semibold" style={{ color: C.text }}>Security deposit</p>
                                                <p className="text-[11px] mt-0.5" style={{ color: B[600] }}>9% held on orders above $10,000 — released on confirmed delivery</p>
                                            </div>
                                            <span className="text-[11px] font-semibold px-2 py-[3px] rounded-full flex-shrink-0"
                                                style={{ backgroundColor: 'rgba(0,113,227,0.08)', color: C.accent }}>Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
