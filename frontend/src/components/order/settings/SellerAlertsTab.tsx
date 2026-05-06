"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
    Package, Tag, Layers, Pencil, AlertCircle,
    ClipboardCheck, AlertTriangle, CheckCircle2, Calendar, Gauge,
    ShieldAlert, Wallet, DollarSign, TrendingDown, BadgeCheck,
    RotateCcw, FileText, Mail, Smartphone, MessageSquare,
    MessageCircle, Volume2, BellOff, Clock
} from 'lucide-react';
import { B, C, Toggle, SettingRow, SectionTitle, Sep } from './shared';

export function SellerAlertsTab({ notifications, setNotifications }: { notifications: any; setNotifications: any }) {
    const t = (k: string) => setNotifications((p: any) => ({ ...p, [k]: !p[k] }));

    /* ── Quiet hours state ── */
    const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
    const [quietFrom, setQuietFrom] = useState('22:00');
    const [quietTo, setQuietTo] = useState('07:00');
    const [quietDays, setQuietDays] = useState<string[]>([...ALL_DAYS]);
    const [editingQuietHours, setEditingQuietHours] = useState(false);
    const [quietDraft, setQuietDraft] = useState({ from: '22:00', to: '07:00', days: [...ALL_DAYS] as string[] });

    const formatTime12 = (t24: string) => {
        const [h, m] = t24.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
    };
    const quietDaysSummary = (days: string[]) => {
        if (days.length === 7) return 'Every day';
        if (days.length === 5 && !days.includes('Sat') && !days.includes('Sun')) return 'Weekdays';
        if (days.length === 2 && days.includes('Sat') && days.includes('Sun')) return 'Weekends';
        return days.join(', ');
    };
    const toggleQuietDay = (day: string) => {
        setQuietDraft(prev => ({
            ...prev,
            days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day],
        }));
    };
    const saveQuietHours = () => {
        if (quietDraft.days.length === 0) { toast('Select at least one day'); return; }
        setQuietFrom(quietDraft.from);
        setQuietTo(quietDraft.to);
        setQuietDays([...quietDraft.days]);
        setEditingQuietHours(false);
        toast('Quiet hours updated');
    };

    const inputStyle = { backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" };

    return (
        <div>
            {/* ═══ Incoming Orders ═══ */}
            <SectionTitle>Incoming orders</SectionTitle>
            <p className="text-[12px] mt-1 mb-3" style={{ color: B[600] }}>
                Stay on top of new business — orders, negotiations, and sample requests.
            </p>
            <Sep />
            <SettingRow icon={Package} label="New order received" description="When a buyer places an order with you"
                right={<Toggle checked={notifications.orderConfirmed ?? true} onChange={() => t('orderConfirmed')} />}
                onClick={() => t('orderConfirmed')} />
            <Sep />
            <SettingRow icon={Tag} label="Price negotiation" description="Buyer proposes a different price"
                right={<Toggle checked={notifications.priceChangeAlerts ?? true} onChange={() => t('priceChangeAlerts')} />}
                onClick={() => t('priceChangeAlerts')} />
            <Sep />
            <SettingRow icon={Layers} label="Sample request" description="Buyer requests a pre-production sample"
                right={<Toggle checked={notifications.orderProcessing ?? true} onChange={() => t('orderProcessing')} />}
                onClick={() => t('orderProcessing')} />
            <Sep />
            <SettingRow icon={Pencil} label="Order modification" description="Buyer changes quantity, specs or delivery date"
                right={<Toggle checked={notifications.orderModified ?? true} onChange={() => t('orderModified')} />}
                onClick={() => t('orderModified')} />
            <Sep />
            <SettingRow icon={AlertCircle} label="Order cancelled" description="Buyer or system cancels an order"
                right={<Toggle checked={notifications.orderCancelled ?? true} onChange={() => t('orderCancelled')} />}
                onClick={() => t('orderCancelled')} />

            {/* ═══ Production Milestones ═══ */}
            <SectionTitle>Production milestones</SectionTitle>
            <p className="text-[12px] mt-1 mb-3" style={{ color: B[600] }}>
                Track progress through your manufacturing stages.
            </p>
            <Sep />
            <SettingRow icon={ClipboardCheck} label="QC passed" description="Quality check completed successfully"
                right={<Toggle checked={notifications.proofOfDelivery ?? true} onChange={() => t('proofOfDelivery')} />}
                onClick={() => t('proofOfDelivery')} />
            <Sep />
            <SettingRow icon={AlertTriangle} label="QC failed" description="Quality check flagged issues needing resolution"
                right={<Toggle checked={notifications.storageCapacity ?? true} onChange={() => t('storageCapacity')} />}
                onClick={() => t('storageCapacity')} />
            <Sep />
            <SettingRow icon={CheckCircle2} label="Stage completed" description="Sample, Making, or Pickup stage finished"
                right={<Toggle checked={notifications.containerTracking ?? true} onChange={() => t('containerTracking')} />}
                onClick={() => t('containerTracking')} />
            <Sep />
            <SettingRow icon={Calendar} label="Deadline approaching" description="Orders within 3 days of delivery date"
                right={<Toggle checked={notifications.deliveryScheduleChanges ?? true} onChange={() => t('deliveryScheduleChanges')} />}
                onClick={() => t('deliveryScheduleChanges')} />
            <Sep />
            <SettingRow icon={Gauge} label="Capacity warning" description="Production load exceeds 80% of weekly capacity"
                right={<Toggle checked={notifications.demurrageWarnings ?? true} onChange={() => t('demurrageWarnings')} />}
                onClick={() => t('demurrageWarnings')} />

            {/* ═══ Payments & Deposits ═══ */}
            <SectionTitle>Payments & deposits</SectionTitle>
            <p className="text-[12px] mt-1 mb-3" style={{ color: B[600] }}>
                Financial events — cleared payments, deposits, and payouts.
            </p>
            <Sep />
            <SettingRow icon={CheckCircle2} label="Payment cleared" description="Buyer payment confirmed and funds secured"
                right={<Toggle checked={notifications.paymentConfirmed ?? true} onChange={() => t('paymentConfirmed')} />}
                onClick={() => t('paymentConfirmed')} />
            <Sep />
            <SettingRow icon={ShieldAlert} label="Security deposit held" description="9% deposit held for qualifying orders"
                right={<Toggle checked={notifications.goodsReceived ?? true} onChange={() => t('goodsReceived')} />}
                onClick={() => t('goodsReceived')} />
            <Sep />
            <SettingRow icon={Wallet} label="Payout processed" description="Funds transferred to your bank account"
                right={<Toggle checked={notifications.invoiceGenerated ?? true} onChange={() => t('invoiceGenerated')} />}
                onClick={() => t('invoiceGenerated')} />
            <Sep />
            <SettingRow icon={DollarSign} label="Early delivery bonus" description="Bonus credited for ahead-of-schedule delivery"
                right={<Toggle checked={notifications.creditLimitAlerts ?? true} onChange={() => t('creditLimitAlerts')} />}
                onClick={() => t('creditLimitAlerts')} />
            <Sep />
            <SettingRow icon={TrendingDown} label="Late penalty warning" description="Progressive penalty alerts as deadline passes"
                right={<Toggle checked={notifications.paymentDueReminders ?? true} onChange={() => t('paymentDueReminders')} />}
                onClick={() => t('paymentDueReminders')} />

            {/* ═══ Listings & Compliance ═══ */}
            <SectionTitle>Listings & compliance</SectionTitle>
            <p className="text-[12px] mt-1 mb-3" style={{ color: B[600] }}>
                Product listing status and regulatory updates.
            </p>
            <Sep />
            <SettingRow icon={BadgeCheck} label="Listing approved" description="Your product is live on the marketplace"
                right={<Toggle checked={notifications.shipmentDispatched ?? true} onChange={() => t('shipmentDispatched')} />}
                onClick={() => t('shipmentDispatched')} />
            <Sep />
            <SettingRow icon={RotateCcw} label="Listing rejected" description="Product requires changes before approval"
                right={<Toggle checked={notifications.partialDeliveries ?? true} onChange={() => t('partialDeliveries')} />}
                onClick={() => t('partialDeliveries')} />
            <Sep />
            <SettingRow icon={FileText} label="Certificate expiring" description="Export or compliance docs nearing expiry"
                right={<Toggle checked={notifications.customsClearance ?? true} onChange={() => t('customsClearance')} />}
                onClick={() => t('customsClearance')} />

            {/* ═══ Notification Channels ═══ */}
            <SectionTitle>Notification channels</SectionTitle>
            <p className="text-[12px] mt-1 mb-3" style={{ color: B[600] }}>
                Choose how you'd like to receive notifications.
            </p>
            <Sep />
            <SettingRow icon={Mail} label="Email" description="Summaries and detailed reports"
                right={<Toggle checked={notifications.emailNotifications} onChange={() => t('emailNotifications')} />}
                onClick={() => t('emailNotifications')} />
            <Sep />
            <SettingRow icon={Smartphone} label="Push notifications" description="Real-time alerts on your device"
                right={<Toggle checked={notifications.pushNotifications} onChange={() => t('pushNotifications')} />}
                onClick={() => t('pushNotifications')} />
            <Sep />
            <SettingRow icon={MessageSquare} label="SMS" description="Text messages for critical updates"
                right={<Toggle checked={notifications.smsNotifications} onChange={() => t('smsNotifications')} />}
                onClick={() => t('smsNotifications')} />
            <Sep />
            <SettingRow icon={MessageCircle} label="WhatsApp" description="Rich messages with order details"
                right={<Toggle checked={notifications.whatsappNotifications} onChange={() => t('whatsappNotifications')} />}
                onClick={() => t('whatsappNotifications')} />
            <Sep />
            <SettingRow icon={Volume2} label="Sound" description="Notification chime"
                right={<Toggle checked={notifications.sound} onChange={v => { setNotifications((p: any) => ({ ...p, sound: v })); toast(v ? 'Sound on' : 'Muted'); }} />}
                onClick={() => { const n = !notifications.sound; setNotifications((p: any) => ({ ...p, sound: n })); toast(n ? 'Sound on' : 'Muted'); }} />

            {/* ═══ Quiet Hours ═══ */}
            <SectionTitle>Quiet hours</SectionTitle>
            <p className="text-[12px] mt-1 mb-3" style={{ color: B[600] }}>
                Pause non-urgent notifications outside working hours. Critical order alerts still come through.
            </p>
            <Sep />
            <SettingRow icon={BellOff} label="Enable quiet hours" description="Silence non-urgent alerts"
                right={<Toggle checked={notifications.quietHours} onChange={() => t('quietHours')} />}
                onClick={() => t('quietHours')} />
            {notifications.quietHours && !editingQuietHours && (
                <div className="rounded-[20px] p-4 mt-3" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <div className="flex items-center gap-3.5">
                        <Clock size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium" style={{ color: C.text }}>
                                {formatTime12(quietFrom)} — {formatTime12(quietTo)}
                            </p>
                            <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>
                                {quietDaysSummary(quietDays)}
                            </p>
                        </div>
                        <button onClick={() => { setQuietDraft({ from: quietFrom, to: quietTo, days: [...quietDays] }); setEditingQuietHours(true); }}
                            className="text-[12px] font-medium px-3 py-1 rounded-full transition-colors duration-150 hover:bg-black/[0.04]"
                            style={{ color: C.accent }}>
                            Edit
                        </button>
                    </div>
                </div>
            )}
            {notifications.quietHours && editingQuietHours && (
                <div className="rounded-[20px] p-5 mt-3 space-y-4" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <div className="flex items-center gap-2">
                        <BellOff size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                        <p className="text-[13px] font-medium" style={{ color: C.text }}>Edit quiet hours</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <label className="text-[11px] font-medium block mb-1.5" style={{ color: B[600] }}>From</label>
                            <input type="time" value={quietDraft.from}
                                onChange={e => setQuietDraft(d => ({ ...d, from: e.target.value }))}
                                className="w-full text-[13px] rounded-[14px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                style={inputStyle} />
                        </div>
                        <span className="text-[13px] mt-5" style={{ color: B[600] }}>—</span>
                        <div className="flex-1">
                            <label className="text-[11px] font-medium block mb-1.5" style={{ color: B[600] }}>To</label>
                            <input type="time" value={quietDraft.to}
                                onChange={e => setQuietDraft(d => ({ ...d, to: e.target.value }))}
                                className="w-full text-[13px] rounded-[14px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                style={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-medium block mb-2" style={{ color: B[600] }}>Active days</label>
                        <div className="flex gap-1.5">
                            {ALL_DAYS.map(day => {
                                const active = quietDraft.days.includes(day);
                                return (
                                    <button key={day} onClick={() => toggleQuietDay(day)}
                                        className="flex-1 py-2 rounded-[10px] text-[11px] font-semibold transition-all duration-200"
                                        style={{
                                            backgroundColor: active ? 'rgba(0,113,227,0.1)' : 'rgba(0,0,0,0.03)',
                                            color: active ? C.accent : B[600],
                                            boxShadow: active ? `inset 0 0 0 1.5px rgba(0,113,227,0.25)` : 'none',
                                        }}>
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {([
                            { label: 'Every day', days: [...ALL_DAYS] },
                            { label: 'Weekdays', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
                            { label: 'Weekends', days: ['Sat', 'Sun'] },
                        ] as const).map(preset => (
                            <button key={preset.label}
                                onClick={() => setQuietDraft(d => ({ ...d, days: [...preset.days] }))}
                                className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors duration-150 hover:bg-black/[0.04]"
                                style={{ backgroundColor: 'rgba(0,0,0,0.03)', color: B[600] }}>
                                {preset.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <button onClick={() => setEditingQuietHours(false)}
                            className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 hover:bg-black/[0.06]"
                            style={{ color: B[600] }}>Cancel</button>
                        <button onClick={saveQuietHours}
                            className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150"
                            style={{ backgroundColor: C.accent, color: 'white' }}>Save</button>
                    </div>
                </div>
            )}
        </div>
    );
}
