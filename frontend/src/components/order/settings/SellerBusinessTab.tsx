// @ts-nocheck -- legacy port; tighten incrementally
"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
    Building2, Factory, MapPin, FileText, CreditCard, Plus, Check, Pencil, Trash2,
    Truck, Globe, Languages, ChevronDown, Sun, Moon, Monitor, Upload,
    BadgeCheck, ShieldCheck, ClipboardCheck, Package, Boxes, Gauge,
    MailCheck, MailX, User, Wallet, AlertTriangle, Calendar,
} from 'lucide-react';
import { B, C } from './constants';
import { SectionTitle, Sep, Toggle } from './shared';

/* ═══════════════════════════════════════════════
   SELLER BUSINESSES DATA
   ═══════════════════════════════════════════════ */

const SELLER_BUSINESSES_INIT = [
    {
        id: 'novatech', name: 'NovaTech Manufacturing Co.', regNo: 'MFG-2020/071829', vat: 'VAT-6614208937',
        address: '88 Industrial Park Road, Shenzhen 518055, China', rep: 'Noah Wilson — Managing Director',
        email: 'operations@novatech-mfg.com', emailVerified: true,
        payoutAccounts: [
            { id: 'pa1', bankName: 'HSBC Business', accountNo: '••••6129', isDefault: true },
            { id: 'pa2', bankName: 'Bank of China', accountNo: '••••8834', isDefault: false },
        ],
        factoryAddress: '88 Industrial Park Road, Building C, Shenzhen 518055',
        pickupAddress: '12 Logistics Lane, Warehouse 7, Shenzhen Free Trade Zone',
        productionCapacity: '5,000 units/month',
        leadTime: '14-21 days',
        moq: '100 units',
        certifications: {
            iso9001: { name: 'ISO_9001_Certificate.pdf', status: 'verified' as const, expiry: 'Mar 2027' },
            gmp: { name: 'GMP_Compliance.pdf', status: 'verified' as const, expiry: 'Nov 2026' },
            exportLicense: { name: 'Export_License_2025.pdf', status: 'pending' as const, expiry: 'Jun 2026' },
            productSafety: { name: '', status: 'none' as const, expiry: '' },
        },
    },
    {
        id: 'artisanworks', name: 'Artisan Works Ltd.', regNo: 'AW-2022/034188', vat: 'VAT-2209841366',
        address: '15 Craft District, Block B, Istanbul 34122', rep: 'Noah Wilson — Partner',
        email: 'supply@artisanworks.co', emailVerified: false,
        payoutAccounts: [
            { id: 'aw1', bankName: 'Garanti BBVA', accountNo: '••••4417', isDefault: true },
        ],
        factoryAddress: '15 Craft District, Workshop Level, Istanbul 34122',
        pickupAddress: '',
        productionCapacity: '800 units/month',
        leadTime: '21-30 days',
        moq: '50 units',
        certifications: {
            iso9001: { name: '', status: 'none' as const, expiry: '' },
            gmp: { name: '', status: 'none' as const, expiry: '' },
            exportLicense: { name: 'Turkey_Export_Cert.pdf', status: 'verified' as const, expiry: 'Sep 2026' },
            productSafety: { name: '', status: 'none' as const, expiry: '' },
        },
    },
];

/* ═══════════════════════════════════════════════
   DOCUMENT ROW
   ═══════════════════════════════════════════════ */
function CertRow({ label, description, doc, expiry, onUpload, required = false }: {
    label: string; description: string;
    doc: { name: string; status: 'verified' | 'pending' | 'none' };
    expiry?: string; onUpload: () => void; required?: boolean;
}) {
    return (
        <div className="rounded-[20px] p-4" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
            <div className="flex items-start gap-3.5">
                <FileText size={18} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: B[600] }} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-[14px] font-medium" style={{ color: C.text }}>{label}</p>
                        {required && <span className="text-[9px] font-semibold tracking-[0.04em] px-1.5 py-[2px] rounded-full" style={{ backgroundColor: 'rgba(255,59,48,0.07)', color: C.danger }}>Required</span>}
                    </div>
                    <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>{description}</p>
                    {doc.status !== 'none' && (
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[11px] font-semibold tracking-[0.02em] px-2 py-[3px] rounded-full inline-flex items-center gap-1`}
                                style={{
                                    backgroundColor: doc.status === 'verified' ? 'rgba(52,199,89,0.1)' : 'rgba(255,149,0,0.1)',
                                    color: doc.status === 'verified' ? C.success : '#e8a000',
                                }}>
                                {doc.status === 'verified' ? <Check size={9} strokeWidth={3} /> : <AlertTriangle size={9} strokeWidth={2.5} />}
                                {doc.status === 'verified' ? 'Verified' : 'Under review'}
                            </span>
                            {expiry && (
                                <span className="text-[10.5px]" style={{ color: B[600] }}>Exp. {expiry}</span>
                            )}
                        </div>
                    )}
                    {doc.name && <p className="text-[11px] mt-1.5 truncate" style={{ color: B[100] }}>{doc.name}</p>}
                </div>
                <button onClick={onUpload}
                    className="flex-shrink-0 text-[11.5px] font-medium px-3 py-1.5 rounded-full transition-all duration-150 hover:opacity-80 cursor-pointer border-none"
                    style={{
                        backgroundColor: doc.status === 'none' ? C.accent : 'rgba(0,0,0,0.04)',
                        color: doc.status === 'none' ? 'white' : B[600],
                    }}>
                    {doc.status === 'none' ? 'Upload' : 'Replace'}
                </button>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   SELLER BUSINESS TAB
   ═══════════════════════════════════════════════ */
export function SellerBusinessTab({ display, setDisplay }: { display: any; setDisplay: any }) {
    const [businesses, setBusinesses] = useState(SELLER_BUSINESSES_INIT);
    const [activeBizId, setActiveBizId] = useState('novatech');
    const [langOpen, setLangOpen] = useState(false);
    const [currOpen, setCurrOpen] = useState(false);

    /* ── Payout account editing ── */
    const [editingPayoutId, setEditingPayoutId] = useState<string | null>(null);
    const [payoutDraft, setPayoutDraft] = useState({ bankName: '', accountNo: '' });
    const [addingPayout, setAddingPayout] = useState(false);

    /* ── Factory/pickup address editing ── */
    const [editingFactory, setEditingFactory] = useState(false);
    const [factoryDraft, setFactoryDraft] = useState('');
    const [editingPickup, setEditingPickup] = useState(false);
    const [pickupDraft, setPickupDraft] = useState('');

    const activeBiz = businesses.find(b => b.id === activeBizId) || businesses[0];

    const certsVerified = Object.values(activeBiz.certifications).filter(d => d.status === 'verified').length;
    const certsTotal = Object.values(activeBiz.certifications).length;

    /* ── Payout helpers ── */
    const savePayout = (bizId: string, payId: string) => {
        if (!payoutDraft.bankName.trim() || !payoutDraft.accountNo.trim()) return;
        setBusinesses(prev => prev.map(b => b.id === bizId
            ? { ...b, payoutAccounts: b.payoutAccounts.map(a => a.id === payId ? { ...a, bankName: payoutDraft.bankName.trim(), accountNo: payoutDraft.accountNo.trim() } : a) }
            : b));
        setEditingPayoutId(null); toast('Payout account updated');
    };
    const addPayout = (bizId: string) => {
        if (!payoutDraft.bankName.trim() || !payoutDraft.accountNo.trim()) return;
        const newId = 'po' + Date.now();
        setBusinesses(prev => prev.map(b => b.id === bizId
            ? { ...b, payoutAccounts: [...b.payoutAccounts, { id: newId, bankName: payoutDraft.bankName.trim(), accountNo: payoutDraft.accountNo.trim(), isDefault: b.payoutAccounts.length === 0 }] }
            : b));
        setAddingPayout(false); setPayoutDraft({ bankName: '', accountNo: '' }); toast('Payout account added');
    };
    const deletePayout = (bizId: string, payId: string) => {
        setBusinesses(prev => prev.map(b => {
            if (b.id !== bizId) return b;
            const next = b.payoutAccounts.filter(a => a.id !== payId);
            if (next.length && !next.some(a => a.isDefault)) next[0].isDefault = true;
            return { ...b, payoutAccounts: next };
        }));
        toast('Payout account removed');
    };
    const setDefaultPayout = (bizId: string, payId: string) => {
        setBusinesses(prev => prev.map(b => b.id === bizId
            ? { ...b, payoutAccounts: b.payoutAccounts.map(a => ({ ...a, isDefault: a.id === payId })) }
            : b));
        toast('Default payout account updated');
    };
    const saveFactory = (bizId: string) => {
        setBusinesses(prev => prev.map(b => b.id === bizId ? { ...b, factoryAddress: factoryDraft.trim() } : b));
        setEditingFactory(false); toast('Factory address saved');
    };
    const savePickup = (bizId: string) => {
        setBusinesses(prev => prev.map(b => b.id === bizId ? { ...b, pickupAddress: pickupDraft.trim() } : b));
        setEditingPickup(false); toast(pickupDraft.trim() ? 'Pickup address saved' : 'Pickup address removed');
    };

    const handleUpload = (bizId: string, certKey: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.jpg,.jpeg,.png';
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
                setBusinesses(prev => prev.map(b =>
                    b.id === bizId
                        ? { ...b, certifications: { ...b.certifications, [certKey]: { name: file.name, status: 'pending' as const, expiry: b.certifications[certKey as keyof typeof b.certifications].expiry } } }
                        : b
                ));
                toast('Certificate uploaded', { description: 'Review typically takes 24-48 hours.' });
            }
        };
        input.click();
    };

    return (
        <div>
            {/* ── You ── */}
            <div className="flex items-center gap-5 mb-10">
                <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center text-[24px] font-semibold flex-shrink-0"
                    style={{ backgroundColor: B[50], color: C.text }}>
                    N
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                        <p className="text-[20px] font-semibold tracking-[-0.01em]" style={{ color: C.text }}>Noah Wilson</p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{ backgroundColor: 'rgba(0,113,227,0.08)', color: C.accent }}>
                            <BadgeCheck size={10} strokeWidth={2} />
                            Seller
                        </span>
                    </div>
                    <p className="text-[14px] mt-1" style={{ color: B[600] }}>noah@acme.store</p>
                </div>
            </div>

            {/* ── Select a business ── */}
            <SectionTitle>Your businesses</SectionTitle>
            <p className="text-[12px] mb-4" style={{ color: B[600] }}>
                Tap the business you want to manage. Each has its own certifications and payouts.
            </p>

            <div className="space-y-2.5">
                {businesses.map(biz => {
                    const selected = activeBizId === biz.id;
                    const verified = Object.values(biz.certifications).filter(d => d.status === 'verified').length;
                    const total = Object.values(biz.certifications).length;
                    return (
                        <div key={biz.id}
                            role="button" tabIndex={0}
                            onClick={() => { setActiveBizId(biz.id); setEditingPayoutId(null); setAddingPayout(false); setEditingFactory(false); setEditingPickup(false); toast(`Selected: ${biz.name}`); }}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveBizId(biz.id); } }}
                            className="w-full flex items-center gap-4 p-4 rounded-[20px] text-left transition-all duration-200 cursor-pointer outline-none"
                            style={{
                                backgroundColor: selected ? 'rgba(0,113,227,0.05)' : 'rgba(0,0,0,0.025)',
                                boxShadow: selected ? 'inset 0 0 0 1.5px rgba(0,113,227,0.25)' : 'none',
                            }}>
                            <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: selected ? C.accent : 'rgba(0,0,0,0.06)' }}>
                                {selected && <Check size={13} strokeWidth={3} color="white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-medium" style={{ color: selected ? C.text : B[600] }}>{biz.name}</p>
                                <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>{verified}/{total} certs verified</p>
                            </div>
                            {!biz.emailVerified && (
                                <span className="text-[10px] font-semibold tracking-[0.02em] px-2 py-[3px] rounded-full flex-shrink-0 inline-flex items-center gap-1"
                                    style={{ backgroundColor: 'rgba(255,59,48,0.07)', color: '#D42A2A' }}>
                                    <MailX size={10} strokeWidth={2.2} />
                                    Verify
                                </span>
                            )}
                        </div>
                    );
                })}

                {/* Add business */}
                <div role="button" tabIndex={0}
                    onClick={() => toast('Add a new business', { description: 'Business registration form coming soon.' })}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toast('Add a new business'); } }}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-[20px] text-[13px] font-medium transition-colors duration-150 hover:bg-black/[0.04] cursor-pointer outline-none"
                    style={{ backgroundColor: 'rgba(0,0,0,0.02)', color: B[600] }}>
                    <Plus size={15} strokeWidth={1.8} />
                    Add a business
                </div>
            </div>

            {/* ── Business identity ── */}
            <SectionTitle>Business details</SectionTitle>
            <p className="text-[12px] mt-1 mb-4" style={{ color: B[600] }}>
                To change company details, contact us via Help.
            </p>

            <div className="space-y-3">
                {/* Company identity card */}
                <div className="rounded-[20px] p-4" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <div className="flex items-start gap-3.5">
                        <Factory size={18} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: B[600] }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium" style={{ color: C.text }}>{activeBiz.name}</p>
                            <p className="text-[12px] mt-1" style={{ color: B[600] }}>{activeBiz.regNo}</p>
                            <div className="flex items-start gap-1.5 mt-2.5 pt-2.5 border-t border-black/5">
                                <MapPin size={13} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: B[600] }} />
                                <p className="text-[12px]" style={{ color: B[600] }}>{activeBiz.address}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tax ID */}
                <div className="rounded-[20px] p-4" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <div className="flex items-start gap-3.5">
                        <FileText size={18} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: B[600] }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium" style={{ color: C.text }}>Tax ID / VAT</p>
                            <p className="text-[12px] mt-1" style={{ color: B[600] }}>{activeBiz.vat}</p>
                        </div>
                    </div>
                </div>

                {/* Business email */}
                <div className="rounded-[20px] p-4 cursor-pointer transition-colors duration-150 hover:bg-black/[0.03]"
                    style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                    onClick={() => toast('Edit business email')}>
                    <div className="flex items-center gap-3.5">
                        <MailCheck size={18} strokeWidth={1.5} className="flex-shrink-0" style={{ color: B[600] }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium" style={{ color: C.text }}>Business email</p>
                            <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>{activeBiz.email}</p>
                        </div>
                        {activeBiz.emailVerified
                            ? <span className="text-[12px] font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(52,199,89,0.08)', color: C.success }}>Verified</span>
                            : <button className="text-[12px] font-medium px-3 py-1 rounded-full flex-shrink-0 border-none cursor-pointer" style={{ backgroundColor: C.accent, color: 'white' }} onClick={(e) => { e.stopPropagation(); toast('Verification email sent to ' + activeBiz.email); }}>Verify</button>
                        }
                    </div>
                </div>

                {/* Production capabilities */}
                <div className="rounded-[20px] p-4" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <div className="flex items-center gap-2.5 mb-3">
                        <Gauge size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                        <p className="text-[14px] font-medium" style={{ color: C.text }}>Production capabilities</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Capacity', value: activeBiz.productionCapacity, icon: Boxes },
                            { label: 'Lead time', value: activeBiz.leadTime, icon: Calendar },
                            { label: 'Min. order', value: activeBiz.moq, icon: Package },
                        ].map(item => (
                            <div key={item.label} className="rounded-[14px] p-3 text-center" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                <item.icon size={14} strokeWidth={1.5} style={{ color: B[600] }} className="mx-auto mb-1.5" />
                                <p className="text-[12px] font-semibold" style={{ color: C.text }}>{item.value}</p>
                                <p className="text-[10px] mt-0.5" style={{ color: B[600] }}>{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Factory address ── */}
            <SectionTitle>Factory address</SectionTitle>
            <p className="text-[12px] mt-1 mb-4" style={{ color: B[600] }}>
                Where your products are manufactured. Inspectors visit this location.
            </p>

            <div className="rounded-[20px] p-4" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                {!editingFactory ? (
                    <div className="flex items-start gap-3.5">
                        <Factory size={18} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: B[600] }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium" style={{ color: C.text }}>Manufacturing facility</p>
                            <p className="text-[12px] mt-1" style={{ color: B[600] }}>{activeBiz.factoryAddress || 'No address set'}</p>
                        </div>
                        <button onClick={() => { setFactoryDraft(activeBiz.factoryAddress); setEditingFactory(true); }}
                            className="flex-shrink-0 w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06] border-none cursor-pointer"
                            style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                            <Pencil size={12} strokeWidth={2} style={{ color: B[600] }} />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Factory size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                            <p className="text-[13px] font-medium" style={{ color: C.text }}>Edit factory address</p>
                        </div>
                        <textarea
                            value={factoryDraft}
                            onChange={e => setFactoryDraft(e.target.value)}
                            rows={2}
                            placeholder="Building, street, city, postal code..."
                            className="w-full text-[13px] rounded-[12px] px-3.5 py-2.5 outline-none resize-none transition-all duration-200"
                            style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" }}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingFactory(false)}
                                className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 hover:bg-black/[0.06] border-none cursor-pointer"
                                style={{ color: B[600] }}>Cancel</button>
                            <button onClick={() => saveFactory(activeBiz.id)}
                                className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 border-none cursor-pointer"
                                style={{ backgroundColor: C.accent, color: 'white' }}>Save</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Pickup / dispatch address ── */}
            <SectionTitle>Pickup & dispatch</SectionTitle>
            <p className="text-[12px] mt-1 mb-4" style={{ color: B[600] }}>
                Where couriers collect shipments. Can differ from factory address.
            </p>

            <div className="rounded-[20px] p-4" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                {!editingPickup && !activeBiz.pickupAddress ? (
                    <div role="button" tabIndex={0}
                        onClick={() => { setPickupDraft(''); setEditingPickup(true); }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-[13px] font-medium transition-colors duration-150 hover:bg-black/[0.04] cursor-pointer outline-none"
                        style={{ color: B[600] }}>
                        <Plus size={15} strokeWidth={1.8} />
                        Add pickup address
                    </div>
                ) : !editingPickup && activeBiz.pickupAddress ? (
                    <div className="flex items-start gap-3.5">
                        <Truck size={18} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: B[600] }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium" style={{ color: C.text }}>Dispatch location</p>
                            <p className="text-[12px] mt-1" style={{ color: B[600] }}>{activeBiz.pickupAddress}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => { setPickupDraft(activeBiz.pickupAddress); setEditingPickup(true); }}
                                className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06] border-none cursor-pointer"
                                style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                                <Pencil size={12} strokeWidth={2} style={{ color: B[600] }} />
                            </button>
                            <button onClick={() => { setBusinesses(prev => prev.map(b => b.id === activeBiz.id ? { ...b, pickupAddress: '' } : b)); toast('Pickup address removed'); }}
                                className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06] border-none cursor-pointer"
                                style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                                <Trash2 size={12} strokeWidth={2} style={{ color: C.danger }} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Truck size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                            <p className="text-[13px] font-medium" style={{ color: C.text }}>{activeBiz.pickupAddress ? 'Edit pickup address' : 'New pickup address'}</p>
                        </div>
                        <textarea
                            value={pickupDraft}
                            onChange={e => setPickupDraft(e.target.value)}
                            rows={2}
                            placeholder="Warehouse, loading dock, postal code..."
                            className="w-full text-[13px] rounded-[12px] px-3.5 py-2.5 outline-none resize-none transition-all duration-200"
                            style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" }}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingPickup(false)}
                                className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 hover:bg-black/[0.06] border-none cursor-pointer"
                                style={{ color: B[600] }}>Cancel</button>
                            <button onClick={() => savePickup(activeBiz.id)}
                                className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 border-none cursor-pointer"
                                style={{ backgroundColor: C.accent, color: 'white' }}>Save</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Payout accounts ── */}
            <SectionTitle>Payout accounts — {activeBiz.name.split(' ')[0]}</SectionTitle>
            <p className="text-[12px] mt-1 mb-4" style={{ color: B[600] }}>
                Where your earnings are deposited. Tap to set default.
            </p>

            <div className="space-y-2.5">
                {activeBiz.payoutAccounts.map(acct => (
                    <div key={acct.id}>
                        {editingPayoutId === acct.id ? (
                            <div className="rounded-[20px] p-4 space-y-3" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                <div className="flex items-center gap-2">
                                    <CreditCard size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                                    <p className="text-[13px] font-medium" style={{ color: C.text }}>Edit payout account</p>
                                </div>
                                <input
                                    value={payoutDraft.bankName}
                                    onChange={e => setPayoutDraft(d => ({ ...d, bankName: e.target.value }))}
                                    placeholder="Bank name"
                                    className="w-full text-[13px] rounded-[12px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                    style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" }}
                                    autoFocus
                                />
                                <input
                                    value={payoutDraft.accountNo}
                                    onChange={e => setPayoutDraft(d => ({ ...d, accountNo: e.target.value }))}
                                    placeholder="Account number"
                                    className="w-full text-[13px] rounded-[12px] px-3.5 py-2.5 outline-none transition-all duration-200"
                                    style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" }}
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingPayoutId(null)}
                                        className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 hover:bg-black/[0.06] border-none cursor-pointer"
                                        style={{ color: B[600] }}>Cancel</button>
                                    <button onClick={() => savePayout(activeBiz.id, acct.id)}
                                        className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 border-none cursor-pointer"
                                        style={{ backgroundColor: C.accent, color: 'white' }}>Save</button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => setDefaultPayout(activeBiz.id, acct.id)}
                                className="w-full rounded-[20px] p-4 text-left transition-all duration-200 cursor-pointer"
                                style={{
                                    backgroundColor: acct.isDefault ? 'rgba(52,199,89,0.06)' : 'rgba(0,0,0,0.02)',
                                    boxShadow: acct.isDefault ? 'inset 0 0 0 1.5px rgba(52,199,89,0.3)' : 'none',
                                }}>
                                <div className="flex items-start gap-3.5">
                                    <CreditCard size={18} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" style={{ color: B[600] }} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[14px] font-medium" style={{ color: C.text }}>{acct.bankName}</p>
                                            {acct.isDefault && (
                                                <span className="text-[10px] font-semibold tracking-[0.02em] px-2 py-[3px] rounded-full"
                                                    style={{ backgroundColor: 'rgba(52,199,89,0.1)', color: C.success }}>
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>Account ending {acct.accountNo}</p>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                        <button onClick={(e) => { e.stopPropagation(); setPayoutDraft({ bankName: acct.bankName, accountNo: acct.accountNo }); setEditingPayoutId(acct.id); }}
                                            className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06] border-none cursor-pointer"
                                            style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                                            <Pencil size={12} strokeWidth={2} style={{ color: B[600] }} />
                                        </button>
                                        {activeBiz.payoutAccounts.length > 1 && (
                                            <button onClick={(e) => { e.stopPropagation(); deletePayout(activeBiz.id, acct.id); }}
                                                className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.06] border-none cursor-pointer"
                                                style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                                                <Trash2 size={12} strokeWidth={2} style={{ color: C.danger }} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Add payout account */}
                {addingPayout ? (
                    <div className="rounded-[20px] p-4 space-y-3" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                        <div className="flex items-center gap-2">
                            <CreditCard size={16} strokeWidth={1.5} style={{ color: B[600] }} />
                            <p className="text-[13px] font-medium" style={{ color: C.text }}>New payout account</p>
                        </div>
                        <input
                            value={payoutDraft.bankName}
                            onChange={e => setPayoutDraft(d => ({ ...d, bankName: e.target.value }))}
                            placeholder="Bank name"
                            className="w-full text-[13px] rounded-[12px] px-3.5 py-2.5 outline-none transition-all duration-200"
                            style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" }}
                            autoFocus
                        />
                        <input
                            value={payoutDraft.accountNo}
                            onChange={e => setPayoutDraft(d => ({ ...d, accountNo: e.target.value }))}
                            placeholder="Account number"
                            className="w-full text-[13px] rounded-[12px] px-3.5 py-2.5 outline-none transition-all duration-200"
                            style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: C.text, fontFamily: "'Urbanist', sans-serif" }}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setAddingPayout(false); setPayoutDraft({ bankName: '', accountNo: '' }); }}
                                className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 hover:bg-black/[0.06] border-none cursor-pointer"
                                style={{ color: B[600] }}>Cancel</button>
                            <button onClick={() => addPayout(activeBiz.id)}
                                className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 border-none cursor-pointer"
                                style={{ backgroundColor: C.accent, color: 'white' }}>Add</button>
                        </div>
                    </div>
                ) : (
                    <div role="button" tabIndex={0}
                        onClick={() => { setPayoutDraft({ bankName: '', accountNo: '' }); setAddingPayout(true); }}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-[20px] text-[13px] font-medium transition-colors duration-150 hover:bg-black/[0.04] cursor-pointer outline-none"
                        style={{ backgroundColor: 'rgba(0,0,0,0.02)', color: B[600] }}>
                        <Plus size={15} strokeWidth={1.8} />
                        Add payout account
                    </div>
                )}
            </div>

            {/* ── Certifications ── */}
            <SectionTitle>Certifications & licenses — {activeBiz.name.split(' ')[0]}</SectionTitle>
            <p className="text-[12px] mt-1 mb-4" style={{ color: B[600] }}>
                {certsVerified}/{certsTotal} verified. Keep these current to avoid listing suspension.
            </p>

            <div className="space-y-3">
                <CertRow label="ISO 9001" description="Quality management system certification"
                    doc={activeBiz.certifications.iso9001} expiry={activeBiz.certifications.iso9001.expiry}
                    onUpload={() => handleUpload(activeBiz.id, 'iso9001')} required />
                <CertRow label="GMP Compliance" description="Good manufacturing practices"
                    doc={activeBiz.certifications.gmp} expiry={activeBiz.certifications.gmp.expiry}
                    onUpload={() => handleUpload(activeBiz.id, 'gmp')} required />
                <CertRow label="Export License" description="Authorization to export goods"
                    doc={activeBiz.certifications.exportLicense} expiry={activeBiz.certifications.exportLicense.expiry}
                    onUpload={() => handleUpload(activeBiz.id, 'exportLicense')} required />
                <CertRow label="Product Safety" description="CE, UL, or regional safety certifications"
                    doc={activeBiz.certifications.productSafety} expiry={activeBiz.certifications.productSafety.expiry}
                    onUpload={() => handleUpload(activeBiz.id, 'productSafety')} />
            </div>

            {/* ── Appearance ── */}
            <SectionTitle>Appearance</SectionTitle>
            <div className="py-4">
                <div className="flex gap-3">
                    {([
                        { key: 'light' as const, label: 'Light', icon: Sun },
                        { key: 'dark' as const, label: 'Dark', icon: Moon },
                        { key: 'system' as const, label: 'Auto', icon: Monitor },
                    ]).map(opt => {
                        const active = display.theme === opt.key;
                        const Icon = opt.icon;
                        return (
                            <div key={opt.key}
                                role="button" tabIndex={0}
                                onClick={() => { setDisplay((p: any) => ({ ...p, theme: opt.key })); toast(`Appearance: ${opt.label}`); }}
                                className={`flex-1 flex flex-col items-center gap-3 py-6 rounded-[20px] transition-all duration-300 cursor-pointer outline-none`}
                                style={{
                                    backgroundColor: active ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.015)',
                                    boxShadow: active ? 'inset 0 0 0 1.5px rgba(0,0,0,0.08)' : 'none',
                                }}>
                                <Icon size={22} strokeWidth={1.4} style={{ color: active ? C.text : B[600] }} />
                                <span className="text-[12px] font-medium" style={{ color: active ? C.text : B[600] }}>{opt.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <SectionTitle>Display</SectionTitle>

            {/* Language picker */}
            <div className="mt-3">
                <div role="button" tabIndex={0}
                    onClick={() => { setLangOpen(!langOpen); setCurrOpen(false); }}
                    className="w-full flex items-center gap-4 py-3.5 text-left cursor-pointer transition-opacity duration-150 hover:opacity-100 outline-none"
                    style={{ opacity: 0.88 }}>
                    <Languages size={18} strokeWidth={1.5} style={{ color: B[600] }} />
                    <span className="flex-1 text-[14px] font-medium" style={{ color: C.text }}>Language</span>
                    <span className="text-[13px] font-medium" style={{ color: B[600] }}>{display.language || 'English'}</span>
                    <ChevronDown size={14} strokeWidth={1.5}
                        className="transition-transform duration-200"
                        style={{ color: B[600], transform: langOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </div>
                {langOpen && (
                    <div className="rounded-[20px] overflow-hidden mb-2" style={{ backgroundColor: 'rgba(0,0,0,0.025)' }}>
                        {(['English', 'French', 'Spanish', 'German', 'Arabic', 'Chinese'] as const).map(lang => {
                            const active = (display.language || 'English') === lang;
                            return (
                                <div key={lang}
                                    role="button" tabIndex={0}
                                    onClick={() => { setDisplay((p: any) => ({ ...p, language: lang })); setLangOpen(false); toast(`Language: ${lang}`); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-100 hover:bg-black/[0.03] cursor-pointer outline-none">
                                    <span className="text-[13px] flex-1" style={{ color: active ? C.text : B[600] }}>{lang}</span>
                                    {active && <Check size={14} strokeWidth={2.5} style={{ color: C.success }} />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Sep />

            {/* Currency picker */}
            <div>
                <div role="button" tabIndex={0}
                    onClick={() => { setCurrOpen(!currOpen); setLangOpen(false); }}
                    className="w-full flex items-center gap-4 py-3.5 text-left cursor-pointer transition-opacity duration-150 hover:opacity-100 outline-none"
                    style={{ opacity: 0.88 }}>
                    <Globe size={18} strokeWidth={1.5} style={{ color: B[600] }} />
                    <span className="flex-1 text-[14px] font-medium" style={{ color: C.text }}>Currency</span>
                    <span className="text-[13px] font-medium" style={{ color: B[600] }}>{display.currency}</span>
                    <ChevronDown size={14} strokeWidth={1.5}
                        className="transition-transform duration-200"
                        style={{ color: B[600], transform: currOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </div>
                {currOpen && (
                    <div className="rounded-[20px] overflow-hidden mb-2" style={{ backgroundColor: 'rgba(0,0,0,0.025)' }}>
                        {([
                            { code: 'USD', label: 'US Dollar', symbol: '$' },
                            { code: 'EUR', label: 'Euro', symbol: '\u20ac' },
                            { code: 'GBP', label: 'British Pound', symbol: '\u00a3' },
                        ] as const).map(cur => {
                            const active = display.currency === cur.code;
                            return (
                                <div key={cur.code}
                                    role="button" tabIndex={0}
                                    onClick={() => { setDisplay((p: any) => ({ ...p, currency: cur.code })); setCurrOpen(false); toast(`Currency: ${cur.code}`); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-100 hover:bg-black/[0.03] cursor-pointer outline-none">
                                    <span className="text-[13px] flex-1" style={{ color: active ? C.text : B[600] }}>{cur.symbol} {cur.label}</span>
                                    {active && <Check size={14} strokeWidth={2.5} style={{ color: C.success }} />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
