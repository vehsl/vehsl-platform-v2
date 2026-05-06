"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { B, C } from './constants';

export { B, C };

/* ── Toggle — Apple-style ── */
export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button role="switch" aria-checked={checked}
            onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
            className="w-[51px] h-[31px] relative flex-shrink-0 transition-all duration-300"
            style={{
                borderRadius: 100,
                backgroundColor: checked ? C.success : 'rgba(60,60,67,0.3)',
                boxShadow: checked
                    ? 'inset 0 0 0 0.5px rgba(0,0,0,0.04), inset 0 1px 4px rgba(0,0,0,0.06)'
                    : 'inset 0 0 0 0.5px rgba(0,0,0,0.06), inset 0 2px 4px rgba(0,0,0,0.06)',
            }}>
            <motion.div
                layout
                transition={{ type: 'spring', stiffness: 440, damping: 28, mass: 0.85 }}
                className="absolute top-[2px] w-[27px] h-[27px]"
                style={{
                    borderRadius: 100,
                    left: checked ? 22 : 2,
                    background: 'linear-gradient(180deg, #fff 0%, #f5f5f7 100%)',
                    boxShadow: `
                        0 0 0 0.5px rgba(0,0,0,0.04),
                        0 3px 8px rgba(0,0,0,0.12),
                        0 1px 2px rgba(0,0,0,0.08),
                        0 6px 16px -4px rgba(0,0,0,0.06)
                    `,
                }} />
        </button>
    );
}

/* ── Setting Row ── */
export function SettingRow({
    icon: Icon, label, description, right, onClick, danger = false,
}: {
    icon: React.ElementType; label: string; description?: string;
    right?: React.ReactNode; onClick?: () => void; danger?: boolean;
}) {
    const [hovered, setHovered] = useState(false);
    const interactive = !!onClick;
    return (
        <div onClick={interactive ? onClick : undefined}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined}
            onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); } : undefined}
            className={`w-full flex items-center gap-4 py-4 text-left transition-opacity duration-150 ${interactive ? 'cursor-pointer' : ''}`}
            style={{ opacity: interactive && hovered ? 1 : interactive ? 0.88 : 1 }}>

            <Icon size={18} strokeWidth={1.5}
                className="flex-shrink-0"
                style={{ color: danger ? C.danger : B[600] }} />

            <div className="flex-1 min-w-0">
                <span className="text-[14px] font-medium block"
                    style={{ color: danger ? C.danger : C.text }}>
                    {label}
                </span>
                {description && (
                    <span className="text-[13px] block mt-0.5"
                        style={{ color: B[600] }}>
                        {description}
                    </span>
                )}
            </div>

            <div className="flex-shrink-0">
                {right || (interactive
                    ? <ChevronRight size={16} strokeWidth={1.5} style={{ color: B[100] }} />
                    : null
                )}
            </div>
        </div>
    );
}

/* ── Section Title ── */
export function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] mt-10 mb-2 first:mt-0"
            style={{ color: B[600] }}>
            {children}
        </h3>
    );
}

/* ── Separator ── */
export function Sep() {
    return <div className="h-px my-1" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />;
}

/* ── Activity Row ── */
export function ActivityRow({ text, time, active }: { text: string; time: string; active?: boolean }) {
    return (
        <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
                {active && <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: C.success }} />}
                <span className="text-[13px] font-normal" style={{ color: C.text }}>{text}</span>
            </div>
            <span className="text-[12px]" style={{ color: B[600] }}>{time}</span>
        </div>
    );
}

/* ── Clean Input ── */
export function CleanInput({ label, type = 'text', placeholder }: { label: string; type?: string; placeholder?: string }) {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <label className="text-[12px] font-medium block mb-2" style={{ color: B[600] }}>{label}</label>
            <input type={type} placeholder={placeholder}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                className="w-full rounded-[10px] px-4 py-3 text-[14px] font-normal transition-all duration-200 outline-none"
                style={{
                    backgroundColor: 'white',
                    border: `1px solid ${focused ? C.accent : 'rgba(0,0,0,0.1)'}`,
                    color: C.text,
                    boxShadow: focused ? `0 0 0 3px rgba(0,113,227,0.12)` : 'none',
                }} />
        </div>
    );
}
