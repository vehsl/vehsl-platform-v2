import React from 'react';
import { C } from './constants';

/**
 * OxygenOS 16-inspired multi-layered progressive blue focus glow system.
 *
 * Design principles:
 * - Focused input has a deep 8-layer shadow stack with inner illumination + outer ambient bloom
 * - Neighbors receive "spill light" — visible blue-tinted border, soft gradient, and a convincing
 *   outer glow that looks like photons leaking from the focused source
 * - Next-nearest boxes get a whisper of the same energy — enough to feel connected, not enough
 *   to compete with the focus
 * - All transitions use a 360ms spring-like easing for organic, non-mechanical movement
 */

const BLUE = '0,113,227';
const TRANSITION = 'box-shadow 360ms cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 360ms cubic-bezier(0.25, 0.46, 0.45, 0.94), background 360ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)';

export function getPinInputStyle(
    i: number,
    focusedIdx: number,
    isFilled: boolean,
): React.CSSProperties {
    const isFocused = focusedIdx === i;
    const dist = focusedIdx >= 0 ? Math.abs(focusedIdx - i) : 99;
    const isNeighbor = dist === 1;
    const isNearby = dist === 2;

    /* ── Focused ── */
    if (isFocused) {
        return {
            background: `linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(232,243,255,1) 100%)`,
            border: `1.5px solid rgba(${BLUE},0.5)`,
            color: C.text,
            boxShadow: [
                // Inner illumination — the input looks lit from within
                `inset 0 1px 2px rgba(${BLUE},0.08)`,
                `inset 0 0 8px rgba(${BLUE},0.04)`,
                // Tight ring
                `0 0 0 1.5px rgba(${BLUE},0.10)`,
                // Layered outer bloom (progressive blur radius, decreasing opacity)
                `0 0 3px rgba(${BLUE},0.12)`,
                `0 0 8px rgba(${BLUE},0.10)`,
                `0 0 16px rgba(${BLUE},0.07)`,
                `0 0 28px rgba(${BLUE},0.04)`,
                `0 0 44px rgba(${BLUE},0.02)`,
                // Subtle depth
                `0 1px 3px rgba(0,0,0,0.03)`,
            ].join(', '),
            transform: 'scale(1.05)',
            transition: TRANSITION,
        };
    }

    /* ── Immediate Neighbor ── */
    if (isNeighbor) {
        // Direction-aware: the side facing the focused input gets slightly more light
        const facingSide = i < focusedIdx ? 'right' : 'left';
        const gradientAngle = facingSide === 'right' ? '135deg' : '225deg';

        return {
            background: `linear-gradient(${gradientAngle}, rgba(255,255,255,1) 0%, rgba(240,247,255,1) 60%, rgba(235,244,255,1) 100%)`,
            border: `1.5px solid rgba(${BLUE},0.20)`,
            color: C.text,
            boxShadow: [
                `inset 0 0.5px 1px rgba(${BLUE},0.04)`,
                `0 0 0 0.5px rgba(${BLUE},0.05)`,
                `0 0 6px rgba(${BLUE},0.10)`,
                `0 0 14px rgba(${BLUE},0.06)`,
                `0 0 24px rgba(${BLUE},0.03)`,
                `0 0.5px 1.5px rgba(0,0,0,0.02)`,
            ].join(', '),
            transform: 'scale(1.02)',
            transition: TRANSITION,
        };
    }

    /* ── Nearby (distance 2) ── */
    if (isNearby) {
        return {
            background: `linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,251,255,1) 100%)`,
            border: `1.5px solid rgba(${BLUE},0.09)`,
            color: C.text,
            boxShadow: [
                `inset 0 0.5px 1px rgba(0,0,0,0.015)`,
                `0 0 4px rgba(${BLUE},0.05)`,
                `0 0 10px rgba(${BLUE},0.025)`,
                `0 0.5px 1px rgba(0,0,0,0.02)`,
            ].join(', '),
            transform: 'scale(1.005)',
            transition: TRANSITION,
        };
    }

    /* ── Filled (not near focus) ── */
    if (isFilled) {
        return {
            background: `linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(249,251,255,1) 100%)`,
            border: `1.5px solid rgba(${BLUE},0.24)`,
            color: C.text,
            boxShadow: [
                `inset 0 1px 2px rgba(${BLUE},0.04)`,
                `0 0 0 0.5px rgba(${BLUE},0.06)`,
                `0 0 4px rgba(${BLUE},0.03)`,
                `0 1px 2px rgba(0,0,0,0.02)`,
            ].join(', '),
            transform: 'scale(1)',
            transition: TRANSITION,
        };
    }

    /* ── Default / empty / unfocused ── */
    return {
        background: 'white',
        border: '1.5px solid rgba(0,0,0,0.07)',
        color: C.text,
        boxShadow: [
            'inset 0 0.5px 1.5px rgba(0,0,0,0.025)',
            '0 0.5px 1px rgba(0,0,0,0.02)',
            '0 1px 3px rgba(0,0,0,0.01)',
        ].join(', '),
        transform: 'scale(1)',
        transition: TRANSITION,
    };
}

/** Returns the style for the ambient light pool that sits behind the entire PIN row.
 *  It's a radial gradient that shifts horizontally to follow the focused input. */
export function getAmbientPoolStyle(focusedIdx: number): React.CSSProperties {
    // Each input is ~48px wide + 12px gap = 60px per slot, centered
    // Total width = 4*48 + 3*12 = 228px, so center offset for each:
    const offsets = [24, 84, 144, 204]; // center of each input within ~228px row
    const isActive = focusedIdx >= 0 && focusedIdx <= 3;

    return {
        position: 'absolute' as const,
        inset: '-12px -16px',
        borderRadius: '24px',
        background: isActive
            ? `radial-gradient(ellipse 120px 80px at ${offsets[focusedIdx]}px 50%, rgba(0,113,227,0.06) 0%, rgba(0,113,227,0.02) 50%, transparent 100%)`
            : 'transparent',
        opacity: isActive ? 1 : 0,
        transition: 'all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        pointerEvents: 'none' as const,
        zIndex: 0,
    };
}

/** Returns the style for the individual halo ring behind each input container. */
export function getInputHaloStyle(
    i: number,
    focusedIdx: number,
): React.CSSProperties {
    const isFocused = focusedIdx === i;
    const dist = focusedIdx >= 0 ? Math.abs(focusedIdx - i) : 99;
    const isNeighbor = dist === 1;

    return {
        position: 'absolute' as const,
        inset: isFocused ? '-4px' : isNeighbor ? '-2px' : '-1px',
        borderRadius: '16px',
        background: isFocused
            ? `radial-gradient(ellipse at 50% 40%, rgba(0,113,227,0.08) 0%, transparent 70%)`
            : isNeighbor
                ? `radial-gradient(ellipse at 50% 50%, rgba(0,113,227,0.035) 0%, transparent 70%)`
                : 'transparent',
        opacity: isFocused || isNeighbor ? 1 : 0,
        transition: 'all 360ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        pointerEvents: 'none' as const,
        zIndex: 0,
    };
}
