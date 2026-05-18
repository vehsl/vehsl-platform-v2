"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
    Shield, ShieldCheck, ShieldAlert, Lock, Key, Fingerprint, QrCode,
    Smartphone, Clock, Laptop, Tablet, Wifi, Eye, EyeOff,
    AlertTriangle, Check, ChevronRight, ChevronDown, Copy,
    CreditCard, Package, FileText, Trash2, RotateCcw,
    Boxes, CircleDollarSign, ClipboardCheck, BadgeCheck,
} from 'lucide-react';
import { B, C, FONT } from './constants';
import { SectionTitle, Sep, Toggle, SettingRow } from './shared';

/* ═══════════════════════════════════════════════
   SELLER SECURITY TAB
   ═══════════════════════════════════════════════ */
export function SellerSecurityTab({ privacy, setPrivacy }: { privacy: any; setPrivacy: any }) {
    const smsEnabled = privacy?.smsEnabled ?? true;
    const authAppEnabled = privacy?.authAppEnabled ?? false;
    const recoveryGenerated = privacy?.recoveryGenerated ?? false;
    const [showCodes, setShowCodes] = useState(false);
    const [passkeys, setPasskeys] = useState([
        { id: '1', name: 'MacBook Air', deviceType: 'laptop' as const, addedDate: 'Dec 2025' },
        { id: '2', name: 'iPhone 15', deviceType: 'phone' as const, addedDate: 'Jan 2026' },
    ]);

    /* ── Seller-specific verification ── */
    const payoutPinEnabled = privacy?.payoutPinEnabled ?? true;
    const listingLockEnabled = privacy?.listingLockEnabled ?? true;
    const cancelVerifyEnabled = privacy?.cancelVerifyEnabled ?? true;
    const [showPayoutPinSetup, setShowPayoutPinSetup] = useState(false);
    const [payoutPin, setPayoutPin] = useState(['', '', '', '']);
    const payoutPinRefs = useRef<(HTMLInputElement | null)[]>([]);

    /* ── Session ── */
    const [sessionExpanded, setSessionExpanded] = useState(false);

    /* ── Trusted devices ── */
    const [showDevices, setShowDevices] = useState(false);
    const [devices] = useState([
        { id: '1', name: 'MacBook Air', os: 'macOS 15.3', browser: 'Chrome 122', current: true, lastActive: 'Active now' },
        { id: '2', name: 'iPhone 15', os: 'iOS 18.3', browser: 'Safari 19.3', current: false, lastActive: '2 days ago' },
    ]);

    /* ── Protection score ── */
    const score = (() => {
        let s = 20;
        if (privacy.twoFactor) s += 12;
        if (smsEnabled) s += 10;
        if (authAppEnabled) s += 12;
        if (recoveryGenerated) s += 8;
        if (passkeys.length > 0) s += 10;
        if (payoutPinEnabled) s += 12;
        if (listingLockEnabled) s += 8;
        if (cancelVerifyEnabled) s += 8;
        return Math.min(100, s);
    })();

    const t = Math.min(1, score / 100);
    const hueNorm = t < 0.35 ? 3 + (t / 0.35) * 175 : 178 - ((t - 0.35) / 0.65) * 88;
    const sat = 40 + t * 14;
    const lit = 70 - t * 6;
    const textLit = lit - 20;
    const scoreColor = `hsl(${hueNorm}, ${sat}%, ${textLit}%)`;
    const scoreColorAlpha = (a: number) => `hsla(${hueNorm}, ${sat}%, ${lit}%, ${a})`;

    const handleToggle2FA = (v: boolean) => {
        setPrivacy((p: any) => ({ ...p, twoFactor: v }));
        if (v) {
            toast.success('Two-factor authentication enabled', { description: 'Choose a verification method below.' });
        } else {
            setPrivacy((p: any) => ({ ...p, authAppEnabled: false, recoveryGenerated: false }));
            setShowCodes(false);
            toast('Two-factor authentication disabled');
        }
    };

    const handlePayoutPinDigit = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const next = [...payoutPin];
        next[index] = value;
        setPayoutPin(next);
        if (value && index < 3) payoutPinRefs.current[index + 1]?.focus();
    };

    const recoveryCodes = ['XKCD-8842', 'MNOP-3917', 'RSTV-6204', 'WXYC-1538', 'BCDF-9071', 'GHKL-4285'];

    return (
        <div>
            {/* ── Protection Score ── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8 rounded-[22px] overflow-hidden relative"
                style={{
                    background: `linear-gradient(145deg, rgba(255,255,255,0.55), ${scoreColorAlpha(0.02)})`,
                    backdropFilter: 'blur(40px)',
                    boxShadow: '0 0 0 0.5px rgba(0,0,0,0.035), 0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.02)',
                }}>
                <div className="flex items-center gap-4 px-6 pt-6 pb-4">
                    <motion.div
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-[40px] h-[40px] rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                            background: `linear-gradient(145deg, ${scoreColorAlpha(0.12)}, ${scoreColorAlpha(0.03)})`,
                            boxShadow: `0 2px 10px ${scoreColorAlpha(0.08)}`,
                        }}>
                        <ShieldCheck size={19} strokeWidth={1.5} style={{ color: scoreColor }} />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[14.5px] font-semibold tracking-[-0.01em]" style={{ color: C.text }}>
                            {score >= 90 ? 'Store fully protected'
                                : score >= 70 ? 'Store well protected'
                                : score >= 50 ? 'Getting safer'
                                : 'Needs attention'}
                        </p>
                        <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>
                            {score >= 90 ? 'All seller verification layers active'
                                : `Enable ${Math.ceil((100 - score) / 12)} more protections for full coverage`}
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <span className="text-[28px] font-semibold tracking-[-0.02em]" style={{ color: scoreColor }}>{score}</span>
                    </div>
                </div>

                {/* Score bar */}
                <div className="px-6 pb-5">
                    <div className="relative h-[4px] rounded-full overflow-hidden" style={{ backgroundColor: scoreColorAlpha(0.1) }}>
                        <motion.div
                            className="absolute inset-y-0 left-0 rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: `${score}%` }}
                            transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            style={{ background: `linear-gradient(90deg, ${scoreColorAlpha(0.5)}, ${scoreColor})` }}
                        />
                    </div>
                </div>
            </motion.div>

            {/* ── Seller-specific protections ── */}
            <SectionTitle>Seller protections</SectionTitle>
            <p className="text-[12px] mt-1 mb-4" style={{ color: B[600] }}>
                Extra verification layers that protect your store, payouts, and listings.
            </p>

            <div className="space-y-1" data-security-section>
                {/* Payout PIN */}
                <div className="flex items-center gap-4 py-4">
                    <CircleDollarSign size={18} strokeWidth={1.5} style={{ color: B[600] }} />
                    <div className="flex-1 min-w-0">
                        <span className="text-[14px] font-medium block" style={{ color: C.text }}>Payout protection PIN</span>
                        <span className="text-[12px] block mt-0.5" style={{ color: B[600] }}>Required before changing payout accounts or withdrawing</span>
                    </div>
                    <Toggle checked={payoutPinEnabled} onChange={(v) => {
                        setPrivacy((p: any) => ({ ...p, payoutPinEnabled: v }));
                        if (v) { setShowPayoutPinSetup(true); toast.success('Set your 4-digit payout PIN'); }
                        else { setShowPayoutPinSetup(false); toast('Payout PIN disabled'); }
                    }} />
                </div>

                <AnimatePresence>
                    {showPayoutPinSetup && payoutPinEnabled && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden">
                            <div className="rounded-[18px] p-5 mb-3" style={{ backgroundColor: 'rgba(0,113,227,0.03)' }}>
                                <p className="text-[13px] font-medium mb-4 text-center" style={{ color: C.text }}>Enter 4-digit payout PIN</p>
                                <div className="flex justify-center gap-3 mb-4">
                                    {payoutPin.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={el => { payoutPinRefs.current[i] = el; }}
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={e => handlePayoutPinDigit(i, e.target.value)}
                                            className="w-[48px] h-[52px] text-center text-[20px] font-semibold rounded-[14px] outline-none transition-all duration-200"
                                            style={{
                                                backgroundColor: 'white',
                                                border: `1.5px solid ${digit ? C.accent : 'rgba(0,0,0,0.1)'}`,
                                                color: C.text,
                                                fontFamily: FONT,
                                                boxShadow: digit ? `0 0 0 3px rgba(0,113,227,0.08)` : 'none',
                                            }}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={() => {
                                        if (payoutPin.every(d => d)) {
                                            setShowPayoutPinSetup(false);
                                            setPrivacy((p: any) => ({ ...p, payoutPinSet: true }));
                                            toast.success('Payout PIN set successfully');
                                        } else {
                                            toast.error('Please enter all 4 digits');
                                        }
                                    }}
                                    className="w-full py-2.5 rounded-[12px] text-[13px] font-medium border-none cursor-pointer transition-opacity duration-150 hover:opacity-85"
                                    style={{ backgroundColor: C.accent, color: 'white' }}>
                                    Set PIN
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Sep />

                {/* Listing lock */}
                <div className="flex items-center gap-4 py-4">
                    <Lock size={18} strokeWidth={1.5} style={{ color: B[600] }} />
                    <div className="flex-1 min-w-0">
                        <span className="text-[14px] font-medium block" style={{ color: C.text }}>Listing modification lock</span>
                        <span className="text-[12px] block mt-0.5" style={{ color: B[600] }}>Require password before editing live product listings</span>
                    </div>
                    <Toggle checked={listingLockEnabled} onChange={(v) => {
                        setPrivacy((p: any) => ({ ...p, listingLockEnabled: v }));
                        toast(v ? 'Listing lock enabled' : 'Listing lock disabled');
                    }} />
                </div>

                <Sep />

                {/* Order cancellation verification */}
                <div className="flex items-center gap-4 py-4">
                    <Package size={18} strokeWidth={1.5} style={{ color: B[600] }} />
                    <div className="flex-1 min-w-0">
                        <span className="text-[14px] font-medium block" style={{ color: C.text }}>Order cancellation verification</span>
                        <span className="text-[12px] block mt-0.5" style={{ color: B[600] }}>Password required to cancel accepted orders</span>
                    </div>
                    <Toggle checked={cancelVerifyEnabled} onChange={(v) => {
                        setPrivacy((p: any) => ({ ...p, cancelVerifyEnabled: v }));
                        toast(v ? 'Cancellation verification on' : 'Cancellation verification off');
                    }} />
                </div>
            </div>

            {/* ── Two-factor authentication ── */}
            <SectionTitle>Two-factor authentication</SectionTitle>

            <div className="space-y-1" data-security-section>
                <div className="flex items-center gap-4 py-4">
                    <Shield size={18} strokeWidth={1.5} style={{ color: B[600] }} />
                    <div className="flex-1 min-w-0">
                        <span className="text-[14px] font-medium block" style={{ color: C.text }}>Two-factor authentication</span>
                        <span className="text-[12px] block mt-0.5" style={{ color: B[600] }}>Extra verification when you sign in</span>
                    </div>
                    <Toggle checked={privacy.twoFactor} onChange={handleToggle2FA} />
                </div>

                {privacy.twoFactor && (
                    <>
                        <Sep />
                        <div className="flex items-center gap-4 py-4">
                            <Smartphone size={18} strokeWidth={1.5} style={{ color: B[600] }} />
                            <div className="flex-1 min-w-0">
                                <span className="text-[14px] font-medium block" style={{ color: C.text }}>SMS verification</span>
                                <span className="text-[12px] block mt-0.5" style={{ color: B[600] }}>Text message codes to +1 •••• 4892</span>
                            </div>
                            <Toggle checked={smsEnabled} onChange={(v) => { setPrivacy((p: any) => ({ ...p, smsEnabled: v })); toast(v ? 'SMS verification enabled' : 'SMS verification disabled'); }} />
                        </div>

                        <Sep />

                        <div className="flex items-center gap-4 py-4">
                            <QrCode size={18} strokeWidth={1.5} style={{ color: B[600] }} />
                            <div className="flex-1 min-w-0">
                                <span className="text-[14px] font-medium block" style={{ color: C.text }}>Authenticator app</span>
                                <span className="text-[12px] block mt-0.5" style={{ color: B[600] }}>
                                    {authAppEnabled ? 'Connected — Google Authenticator' : 'More secure than SMS'}
                                </span>
                            </div>
                            <Toggle checked={authAppEnabled} onChange={(v) => { setPrivacy((p: any) => ({ ...p, authAppEnabled: v })); toast(v ? 'Authenticator app enabled' : 'Authenticator app disabled'); }} />
                        </div>

                        <Sep />

                        {/* Recovery codes */}
                        <div>
                            <div
                                role="button" tabIndex={0}
                                onClick={() => {
                                    if (!recoveryGenerated) { setPrivacy((p: any) => ({ ...p, recoveryGenerated: true })); setShowCodes(true); toast.success('Recovery codes generated'); }
                                    else { setShowCodes(!showCodes); }
                                }}
                                className="w-full flex items-center gap-4 py-4 text-left cursor-pointer transition-opacity duration-150 hover:opacity-100 outline-none"
                                style={{ opacity: 0.88 }}>
                                <Key size={18} strokeWidth={1.5} style={{ color: B[600] }} />
                                <div className="flex-1 min-w-0">
                                    <span className="text-[14px] font-medium block" style={{ color: C.text }}>Recovery codes</span>
                                    <span className="text-[12px] block mt-0.5" style={{ color: B[600] }}>
                                        {recoveryGenerated ? 'Generated — keep these safe' : 'Backup access if you lose your device'}
                                    </span>
                                </div>
                                <ChevronDown size={14} strokeWidth={1.5}
                                    className="transition-transform duration-200"
                                    style={{ color: B[100], transform: showCodes ? 'rotate(180deg)' : 'rotate(0)' }} />
                            </div>

                            <AnimatePresence>
                                {showCodes && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden">
                                        <div className="rounded-[18px] p-4 mb-3" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                {recoveryCodes.map(code => (
                                                    <div key={code} className="flex items-center justify-center py-2.5 rounded-[10px] text-[13px] font-mono font-medium"
                                                        style={{ backgroundColor: 'rgba(0,0,0,0.03)', color: C.text }}>
                                                        {code}
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => { navigator.clipboard?.writeText(recoveryCodes.join('\n')); toast.success('Codes copied to clipboard'); }}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-[12px] font-medium border-none cursor-pointer transition-colors duration-150 hover:bg-black/[0.06]"
                                                style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: B[600] }}>
                                                <Copy size={13} strokeWidth={1.8} />
                                                Copy all codes
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </div>

            {/* ── Passkeys ── */}
            <SectionTitle>Passkeys</SectionTitle>
            <p className="text-[12px] mt-1 mb-4" style={{ color: B[600] }}>
                Biometric or device-based authentication for faster, more secure access.
            </p>

            <div className="space-y-2.5">
                {passkeys.map(pk => {
                    const DeviceIcon = pk.deviceType === 'laptop' ? Laptop : Smartphone;
                    return (
                        <div key={pk.id} className="rounded-[18px] p-4 flex items-center gap-3.5" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                            <DeviceIcon size={18} strokeWidth={1.5} style={{ color: B[600] }} />
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-medium" style={{ color: C.text }}>{pk.name}</p>
                                <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>Added {pk.addedDate}</p>
                            </div>
                            <button onClick={() => { setPasskeys(prev => prev.filter(p => p.id !== pk.id)); toast('Passkey removed'); }}
                                className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06] border-none cursor-pointer"
                                style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                                <Trash2 size={12} strokeWidth={2} style={{ color: C.danger }} />
                            </button>
                        </div>
                    );
                })}
                <button
                    onClick={() => { setPasskeys(prev => [...prev, { id: Date.now().toString(), name: 'New passkey', deviceType: 'laptop', addedDate: 'Mar 2026' }]); toast.success('Passkey added'); }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[18px] text-[13px] font-medium transition-colors duration-150 hover:bg-black/[0.04] cursor-pointer border-none outline-none"
                    style={{ backgroundColor: 'rgba(0,0,0,0.02)', color: B[600] }}>
                    <Fingerprint size={15} strokeWidth={1.8} />
                    Add a passkey
                </button>
            </div>

            {/* ── Trusted devices ── */}
            <SectionTitle>Trusted devices</SectionTitle>

            <div>
                <div role="button" tabIndex={0}
                    onClick={() => setShowDevices(!showDevices)}
                    className="w-full flex items-center gap-4 py-4 text-left cursor-pointer transition-opacity duration-150 hover:opacity-100 outline-none"
                    style={{ opacity: 0.88 }}>
                    <Laptop size={18} strokeWidth={1.5} style={{ color: B[600] }} />
                    <div className="flex-1 min-w-0">
                        <span className="text-[14px] font-medium block" style={{ color: C.text }}>{devices.length} devices</span>
                        <span className="text-[12px] block mt-0.5" style={{ color: B[600] }}>Manage trusted sign-in devices</span>
                    </div>
                    <ChevronDown size={14} strokeWidth={1.5}
                        className="transition-transform duration-200"
                        style={{ color: B[100], transform: showDevices ? 'rotate(180deg)' : 'rotate(0)' }} />
                </div>

                <AnimatePresence>
                    {showDevices && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden">
                            <div className="space-y-2.5 mb-3">
                                {devices.map(d => (
                                    <div key={d.id} className="rounded-[18px] p-4 flex items-center gap-3.5" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                        {d.os.includes('iOS') ? <Smartphone size={18} strokeWidth={1.5} style={{ color: B[600] }} /> : <Laptop size={18} strokeWidth={1.5} style={{ color: B[600] }} />}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[14px] font-medium" style={{ color: C.text }}>{d.name}</p>
                                                {d.current && (
                                                    <span className="text-[10px] font-semibold px-2 py-[2px] rounded-full"
                                                        style={{ backgroundColor: 'rgba(52,199,89,0.1)', color: C.success }}>
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>{d.os} · {d.browser} · {d.lastActive}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Session timeout ── */}
            <SectionTitle>Session</SectionTitle>

            <div>
                <div role="button" tabIndex={0}
                    onClick={() => setSessionExpanded(!sessionExpanded)}
                    className="w-full flex items-center gap-4 py-4 text-left cursor-pointer transition-opacity duration-150 hover:opacity-100 outline-none"
                    style={{ opacity: 0.88 }}>
                    <Clock size={18} strokeWidth={1.5} style={{ color: B[600] }} />
                    <div className="flex-1 min-w-0">
                        <span className="text-[14px] font-medium block" style={{ color: C.text }}>Auto-lock after inactivity</span>
                        <span className="text-[12px] block mt-0.5" style={{ color: B[600] }}>{privacy.sessionTimeout || '30 min'}</span>
                    </div>
                    <ChevronDown size={14} strokeWidth={1.5}
                        className="transition-transform duration-200"
                        style={{ color: B[100], transform: sessionExpanded ? 'rotate(180deg)' : 'rotate(0)' }} />
                </div>

                <AnimatePresence>
                    {sessionExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden">
                            <div className="rounded-[18px] overflow-hidden mb-3" style={{ backgroundColor: 'rgba(0,0,0,0.025)' }}>
                                {(['15 min', '30 min', '1 hour', '4 hours', 'never'] as const).map(opt => {
                                    const active = (privacy.sessionTimeout || '30 min') === opt;
                                    return (
                                        <div key={opt}
                                            role="button" tabIndex={0}
                                            onClick={() => { setPrivacy((p: any) => ({ ...p, sessionTimeout: opt })); setSessionExpanded(false); toast(`Auto-lock: ${opt}`); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-100 hover:bg-black/[0.03] cursor-pointer outline-none">
                                            <span className="text-[13px] flex-1" style={{ color: active ? C.text : B[600] }}>{opt === 'never' ? 'Never' : opt}</span>
                                            {active && <Check size={14} strokeWidth={2.5} style={{ color: C.success }} />}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Danger zone ── */}
            <SectionTitle>Danger zone</SectionTitle>

            <div className="rounded-[20px] p-4 mt-3" style={{ backgroundColor: 'rgba(255,59,48,0.03)' }}>
                <SettingRow
                    icon={ShieldAlert}
                    label="Deactivate seller account"
                    description="Pause or close your store permanently"
                    onClick={() => toast('Account deactivation', { description: 'Please contact support to deactivate your seller account.' })}
                    danger
                />
            </div>
        </div>
    );
}
