"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { X, Check, CreditCard } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import paymentSvgPaths from './imports/svg-bdwoyeteyk';
import { EASE, fmt } from './seller-dashboard-data';
import type { ListedProduct } from './seller-dashboard-data';

interface PaymentSheetProps {
    paymentProductId: string | null;
    products: ListedProduct[];
    paymentStep: 'summary' | 'methods' | 'processing' | 'done';
    selectedPayMethod: string | null;
    cardNumber: string;
    cardExpiry: string;
    cardCvv: string;
    setPaymentProductId: (id: string | null) => void;
    setPaymentStep: (step: 'summary' | 'methods' | 'processing' | 'done') => void;
    setSelectedPayMethod: (method: string | null) => void;
    setCardNumber: (value: string) => void;
    setCardExpiry: (value: string) => void;
    setCardCvv: (value: string) => void;
    setProducts: React.Dispatch<React.SetStateAction<ListedProduct[]>>;
}

export function PaymentSheet({
    paymentProductId,
    products,
    paymentStep,
    selectedPayMethod,
    cardNumber,
    cardExpiry,
    cardCvv,
    setPaymentProductId,
    setPaymentStep,
    setSelectedPayMethod,
    setCardNumber,
    setCardExpiry,
    setCardCvv,
    setProducts,
}: PaymentSheetProps) {
    if (!paymentProductId) return null;

    const payProduct = products.find(pr => pr.id === paymentProductId);
    if (!payProduct) return null;

    const testingFee = Math.round(payProduct.price * 0.12 * 100) / 100;
    const pickupFee = 45.00;
    const platformFee = 12.50;
    const totalFee = Math.round((testingFee + pickupFee + platformFee) * 100) / 100;

    const closePayment = () => {
        setPaymentProductId(null);
        setPaymentStep('summary');
        setSelectedPayMethod(null);
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
    };

    const handleConfirmPayment = () => {
        setPaymentStep('processing');
        setTimeout(() => {
            setPaymentStep('done');
            setTimeout(() => {
                setProducts(prev => prev.map(pr =>
                    pr.id === paymentProductId ? { ...pr, status: 'active' as const, isOnline: true } : pr
                ));
                toast.success(`${payProduct.name} is now live!`, {
                    description: 'Payment confirmed. Your product is visible to buyers.',
                });
                closePayment();
            }, 1400);
        }, 2000);
    };

    const payMethods = [
        { id: 'bank', label: 'Bank transfer', icon: (op: number) => (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d={paymentSvgPaths.p2d63980} fill={`rgba(134,134,139,${op})`} /><path d={paymentSvgPaths.p3a541200} fill={`rgba(134,134,139,${op})`} /></svg>
        )},
        { id: 'wire', label: 'Wire transfer', icon: (op: number) => (
            <svg width="16" height="11" viewBox="0 0 24 16" fill="none"><path d={paymentSvgPaths.p1303ec80} fill={`rgba(134,134,139,${op})`} /></svg>
        )},
        { id: 'card', label: 'Credit or debit cards', icon: (op: number) => (
            <svg width="16" height="16" viewBox="0 0 21.11 6.47" fill="none"><path d={paymentSvgPaths.p9297d40} fill={`rgba(134,134,139,${op})`} /><path d={paymentSvgPaths.p1092900} fill={`rgba(134,134,139,${op})`} /><path d={paymentSvgPaths.pd1c4100} fill={`rgba(134,134,139,${op})`} /><path d={paymentSvgPaths.p3c462b40} fill={`rgba(134,134,139,${op})`} /></svg>
        )},
        { id: 'paypal', label: 'PayPal', icon: (op: number) => (
            <svg width="16" height="16" viewBox="0 0 20.4 24" fill="none"><path clipRule="evenodd" d={paymentSvgPaths.p3fe6a800} fill={`rgba(134,134,139,${op})`} fillRule="evenodd" /></svg>
        )},
        { id: 'apple', label: 'Apple Pay', icon: (op: number) => (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d={paymentSvgPaths.p2ea0ab80} fill={`rgba(134,134,139,${op})`} /></svg>
        )},
        { id: 'alipay', label: 'Alipay', icon: (op: number) => (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d={paymentSvgPaths.p25774c80} stroke={`rgba(134,134,139,${op})`} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" fill="none" /></svg>
        )},
        { id: 'google', label: 'Google Pay', icon: (op: number) => (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d={paymentSvgPaths.p2f5ca980} fill={`rgba(134,134,139,${op})`} /></svg>
        )},
    ];

    return (
        <motion.div
            key="payment-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (e.target === e.currentTarget && paymentStep !== 'processing') closePayment(); }}
        >
            <motion.div
                initial={{ opacity: 0, y: 80 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 60 }}
                transition={{ type: 'spring', damping: 32, stiffness: 380 }}
                className="w-full max-w-full sm:max-w-[420px] rounded-t-[24px] overflow-hidden"
                style={{
                    background: 'rgba(255,255,255,0.97)',
                    backdropFilter: 'blur(40px)',
                    WebkitBackdropFilter: 'blur(40px)',
                    boxShadow: '0 -8px 40px -8px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.04)',
                }}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-9 h-[4px] rounded-full bg-black/[0.08]" />
                </div>

                {/* Header */}
                <div className="px-6 pt-2 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-[40px] h-[40px] rounded-[12px] bg-[#f4f5f6] flex items-center justify-center overflow-hidden">
                                <ImageWithFallback src={payProduct.image} alt={payProduct.name} className="w-[80%] h-[80%] object-contain" />
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-[#1A1A1A]/85">{payProduct.name}</p>
                                <p className="text-[11px] font-medium text-[#1A1A1A]/35 mt-0.5">{fmt(payProduct.price)}/unit · {payProduct.inWarehouse} units ready</p>
                            </div>
                        </div>
                        {paymentStep !== 'processing' && (
                            <button
                                onClick={closePayment}
                                className="w-[28px] h-[28px] rounded-full bg-black/[0.04] flex items-center justify-center border-none cursor-pointer"
                            >
                                <X size={14} strokeWidth={2} className="text-[#1A1A1A]/35" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content — changes per step */}
                <div className="px-6 pb-6">
                    <AnimatePresence mode="wait">
                        {paymentStep === 'summary' && (
                            <motion.div
                                key="pay-summary"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25, ease: EASE }}
                            >
                                {/* Total */}
                                <div className="rounded-[12px] px-3.5 py-3 mb-4 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.02)' }}>
                                    <span className="text-[12px] font-bold text-[#1A1A1A]/40">Total due</span>
                                    <span className="text-[18px] font-bold text-[#1A1A1A]/80 tabular-nums">{fmt(totalFee)}</span>
                                </div>

                                <p className="text-[10.5px] font-medium text-[#1A1A1A]/30 leading-relaxed mb-5 px-0.5">
                                    Includes QC testing, pickup logistics, and platform listing fee.
                                </p>

                                {/* CTA */}
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setPaymentStep('methods')}
                                    className="w-full py-3.5 rounded-[14px] border-none cursor-pointer text-[14px] font-bold text-white"
                                    style={{
                                        background: '#0171E3',
                                        boxShadow: '0 2px 8px rgba(1,113,227,0.3), 0 6px 20px -4px rgba(1,113,227,0.25)',
                                    }}
                                >
                                    Pay {fmt(totalFee)}
                                </motion.button>
                            </motion.div>
                        )}

                        {paymentStep === 'methods' && (
                            <motion.div
                                key="pay-methods"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25, ease: EASE }}
                            >
                                <p className="text-[16px] font-bold text-[#202425] text-center mb-5">Select payment method</p>

                                <div className="flex flex-col gap-2.5">
                                    {payMethods.map((m) => {
                                        const isSelected = selectedPayMethod === m.id;
                                        const isCard = m.id === 'card';
                                        const isOther = selectedPayMethod && selectedPayMethod !== m.id;

                                        return (
                                            <motion.div
                                                key={m.id}
                                                layout
                                                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                                            >
                                                <motion.button
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => {
                                                        setSelectedPayMethod(m.id);
                                                        if (!isCard) {
                                                            // Non-card methods go straight to processing
                                                            setTimeout(() => handleConfirmPayment(), 400);
                                                        }
                                                    }}
                                                    className="w-full border-none cursor-pointer bg-transparent p-0"
                                                >
                                                    <div
                                                        className="relative rounded-[14px] overflow-hidden transition-all duration-300"
                                                        style={{
                                                            border: isSelected ? '2px solid #0171E3' : '1px solid rgba(134,134,139,0.25)',
                                                            borderRadius: isSelected && isCard ? 20 : 14,
                                                            boxShadow: isSelected ? '0 4px 15px rgba(1,113,227,0.15)' : 'none',
                                                            padding: isSelected ? 0 : 1,
                                                        }}
                                                    >
                                                        <div className="flex items-center justify-between px-4 py-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="flex-shrink-0">{m.icon(isOther ? 0.4 : 1)}</div>
                                                                <span className={`text-[12px] font-semibold transition-colors ${isOther ? 'text-[#86868b]/40' : 'text-[#86868b]'}`}>{m.label}</span>
                                                            </div>
                                                            <span className={`text-[12px] font-semibold tabular-nums text-right transition-colors ${isOther ? 'text-[#86868b]/40' : 'text-[#86868b]'}`}>{fmt(totalFee)}</span>
                                                        </div>

                                                        {/* Expanded card form */}
                                                        <AnimatePresence>
                                                            {isSelected && isCard && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="px-4 pb-4 pt-1" onClick={(e) => e.stopPropagation()}>
                                                                        <div className="flex flex-col gap-2.5">
                                                                            <input
                                                                                type="text"
                                                                                value={cardNumber}
                                                                                onChange={(e) => {
                                                                                    const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                                                                                    setCardNumber(v.replace(/(\d{4})/g, '$1 ').trim());
                                                                                }}
                                                                                placeholder="Card number"
                                                                                className="w-full px-3.5 py-2.5 rounded-[10px] border border-black/[0.08] bg-white/80 text-[12px] font-medium text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/20 outline-none focus:border-[#0171e3]/30 transition-colors"
                                                                                autoFocus
                                                                            />
                                                                            <div className="flex gap-2.5">
                                                                                <input
                                                                                    type="text"
                                                                                    value={cardExpiry}
                                                                                    onChange={(e) => {
                                                                                        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                                                        if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                                                                                        setCardExpiry(v);
                                                                                    }}
                                                                                    placeholder="MM/YY"
                                                                                    className="flex-1 px-3.5 py-2.5 rounded-[10px] border border-black/[0.08] bg-white/80 text-[12px] font-medium text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/20 outline-none focus:border-[#0171e3]/30 transition-colors"
                                                                                />
                                                                                <input
                                                                                    type="text"
                                                                                    value={cardCvv}
                                                                                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                                                    placeholder="CVV"
                                                                                    className="w-[80px] px-3.5 py-2.5 rounded-[10px] border border-black/[0.08] bg-white/80 text-[12px] font-medium text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/20 outline-none focus:border-[#0171e3]/30 transition-colors"
                                                                                />
                                                                            </div>

                                                                            <motion.button
                                                                                whileHover={{ scale: 1.01 }}
                                                                                whileTap={{ scale: 0.97 }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (cardNumber.replace(/\s/g, '').length >= 12 && cardExpiry.length >= 4 && cardCvv.length >= 3) {
                                                                                        handleConfirmPayment();
                                                                                    } else {
                                                                                        toast.error('Please fill in all card details');
                                                                                    }
                                                                                }}
                                                                                className="w-full py-3 rounded-[12px] border-none cursor-pointer text-[13px] font-bold text-white mt-1"
                                                                                style={{
                                                                                    background: '#0171E3',
                                                                                    boxShadow: '0 2px 8px rgba(1,113,227,0.3)',
                                                                                }}
                                                                            >
                                                                                Pay {fmt(totalFee)}
                                                                            </motion.button>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </motion.button>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {paymentStep === 'processing' && (
                            <motion.div
                                key="pay-processing"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3, ease: EASE }}
                                className="flex flex-col items-center py-8"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                                    className="w-[40px] h-[40px] rounded-full border-[3px] border-[#0171E3]/15 border-t-[#0171E3]/70 mb-4"
                                />
                                <p className="text-[14px] font-bold text-[#1A1A1A]/60">Processing payment…</p>
                                <p className="text-[11px] font-medium text-[#1A1A1A]/30 mt-1">This may take a moment</p>
                            </motion.div>
                        )}

                        {paymentStep === 'done' && (
                            <motion.div
                                key="pay-done"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                className="flex flex-col items-center py-8"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.15 }}
                                    className="w-[48px] h-[48px] rounded-full flex items-center justify-center mb-4"
                                    style={{ background: 'rgba(46,170,87,0.1)' }}
                                >
                                    <Check size={22} strokeWidth={2.5} className="text-[#2eaa57]" />
                                </motion.div>
                                <p className="text-[15px] font-bold text-[#1A1A1A]/75">Payment successful</p>
                                <p className="text-[11px] font-medium text-[#1A1A1A]/35 mt-1 text-center">Your product is going live now</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
}
