"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { authedFetch } from '@/lib/api';
import {
    Plus, Play, Eye, Heart, MessageCircle, Share2, MoreHorizontal,
    Video, Upload, X, Edit3, Trash2, CheckCircle2, Clock, AlertTriangle,
    Tag, Type, Sparkles, Film, Pause, Volume2, VolumeX, ChevronDown, ChevronUp,
    ImageIcon, Scissors, RotateCcw, Bookmark, Globe2, Lock, Send,
    TrendingUp, Music2, Hash, Reply, ThumbsUp, Pin,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const FONT = "'Urbanist', sans-serif";
const EASE = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

/* ═══════════════════════════════════════ */
/*  TYPES & DATA                           */
/* ═══════════════════════════════════════ */

type ReelStatus = 'published' | 'pending' | 'draft';

interface Reel {
    id: string;
    thumbnail: string;
    caption: string;
    product: string;
    productId: string;
    status: ReelStatus;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    duration: string;
    postedAt: string;
    hashtags: string[];
    music?: string;
    visibility: 'public' | 'followers' | 'private';
}

interface SellerProductOption {
    id: string;
    name: string;
}

const INITIAL_REELS: Reel[] = [
    {
        id: 'r1',
        thumbnail: 'https://images.unsplash.com/photo-1766499670904-edab815e8fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3R0ZXJ5JTIwd29ya3Nob3AlMjBjcmFmdGluZyUyMGhhbmRzfGVufDF8fHx8MTc3MzQwNjQ4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        caption: 'Hand-throwing each vase on the wheel. Every piece is unique — from our workshop to your home.',
        product: 'Handmade Ceramic Vase',
        productId: 'p4',
        status: 'published',
        views: 12400,
        likes: 840,
        comments: 56,
        shares: 128,
        duration: '0:28',
        postedAt: '2d ago',
        hashtags: ['handmade', 'ceramics', 'madeinworkshop'],
        music: 'Lo-fi Craft Beats',
        visibility: 'public',
    },
    {
        id: 'r2',
        thumbnail: 'https://images.unsplash.com/photo-1670341445838-57d1bc01340e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9kdWN0JTIwcGFja2FnaW5nJTIwdW5ib3hpbmclMjBhZXN0aGV0aWN8ZW58MXx8fHwxNzczNDA2NDc5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        caption: 'Packing 300 units with love. Custom tissue wrap + handwritten QC tags for every box.',
        product: 'Wireless NC Headphones',
        productId: 'p1',
        status: 'published',
        views: 8200,
        likes: 510,
        comments: 34,
        shares: 72,
        duration: '0:15',
        postedAt: '5d ago',
        hashtags: ['packaging', 'unboxing', 'qualitycontrol'],
        visibility: 'public',
    },
    {
        id: 'r3',
        thumbnail: 'https://images.unsplash.com/photo-1695740630057-21ecb4027b1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZXJhbWljJTIwc3R1ZGlvJTIwcHJvZHVjdGlvbiUyMHByb2Nlc3N8ZW58MXx8fHwxNzczNDA2NDgwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        caption: 'Glazing day at the studio. The matte finish that everyone asks about.',
        product: 'Handmade Ceramic Vase',
        productId: 'p4',
        status: 'pending',
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        duration: '0:22',
        postedAt: 'Pending review',
        hashtags: ['glazing', 'matteFinish', 'behindthescenes'],
        music: 'Studio Ambient',
        visibility: 'public',
    },
    {
        id: 'r4',
        thumbnail: 'https://images.unsplash.com/photo-1682718619781-252f23e21132?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwY3JhZnRpbmclMjB3b3Jrc2hvcCUyMGFydGlzYW58ZW58MXx8fHwxNzczNDA2NDgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        caption: 'Stitching the messenger bags by hand. Italian vegetable-tanned leather.',
        product: 'Leather Messenger Bag',
        productId: 'p5',
        status: 'draft',
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        duration: '0:35',
        postedAt: 'Draft',
        hashtags: ['leather', 'handstitched', 'artisan'],
        visibility: 'private',
    },
    {
        id: 'r5',
        thumbnail: 'https://images.unsplash.com/photo-1761005653827-9cd95fa1faee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFkcGhvbmVzJTIwcHJvZHVjdCUyMHBob3RvZ3JhcGh5JTIwc3R1ZGlvfGVufDF8fHx8MTc3MzQwNjQ4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        caption: 'ANC test: 40dB noise reduction demo. Watch with sound on.',
        product: 'Wireless NC Headphones',
        productId: 'p1',
        status: 'published',
        views: 22100,
        likes: 1820,
        comments: 142,
        shares: 340,
        duration: '0:45',
        postedAt: '1w ago',
        hashtags: ['ANC', 'noisecancel', 'productdemo'],
        music: 'Sound Test',
        visibility: 'public',
    },
    {
        id: 'r6',
        thumbnail: 'https://images.unsplash.com/photo-1685119166946-d4050647b0e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXJlaG91c2UlMjBzaGlwcGluZyUyMGJveGVzJTIwcHJvZHVjdHN8ZW58MXx8fHwxNzczNDA2NDgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        caption: 'Warehouse tour: How we store & ship 10K+ units monthly.',
        product: 'Aluminum Laptop Stand',
        productId: 'p3',
        status: 'published',
        views: 5600,
        likes: 320,
        comments: 28,
        shares: 55,
        duration: '1:02',
        postedAt: '2w ago',
        hashtags: ['warehouse', 'logistics', 'behindthescenes'],
        visibility: 'public',
    },
];

const STATUS_STYLES: Record<ReelStatus, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
    published: { label: 'Live', bg: 'rgba(46,170,87,0.08)', color: '#2eaa57', icon: <CheckCircle2 size={9} strokeWidth={2.5} /> },
    pending: { label: 'In Review', bg: 'rgba(230,126,34,0.08)', color: '#e67e22', icon: <Clock size={9} strokeWidth={2.5} /> },
    draft: { label: 'Draft', bg: 'rgba(142,142,147,0.08)', color: '#8e8e93', icon: <Edit3 size={9} strokeWidth={2.5} /> },
};

/* ─── Buyer comments / messages ─── */

interface BuyerComment {
    id: string;
    buyerName: string;
    buyerAvatar: string;
    buyerCountry: string;
    message: string;
    timestamp: string;
    likes: number;
    pinned?: boolean;
    sellerReply?: { message: string; timestamp: string };
}

const REEL_COMMENTS: Record<string, BuyerComment[]> = {
    r1: [
        { id: 'c1', buyerName: 'Emily Carter', buyerAvatar: 'EC', buyerCountry: '🇺🇸', message: 'These are beautiful! Can you do a custom glaze color? Looking for a dusty rose.', timestamp: '1d ago', likes: 12, pinned: true, sellerReply: { message: 'Absolutely! DM us your Pantone ref and we\'ll send a sample swatch within 48h 🎨', timestamp: '22h ago' } },
        { id: 'c2', buyerName: 'Marcus Johansson', buyerAvatar: 'MJ', buyerCountry: '🇸🇪', message: 'What\'s the MOQ for wholesale? We have a chain of 14 home stores in Scandinavia.', timestamp: '1d ago', likes: 8 },
        { id: 'c3', buyerName: 'Aiko Tanaka', buyerAvatar: 'AT', buyerCountry: '🇯🇵', message: 'The craftsmanship is incredible. Is each piece signed by the artist?', timestamp: '2d ago', likes: 5, sellerReply: { message: 'Yes! Every piece has the potter\'s mark stamped on the base.', timestamp: '1d ago' } },
        { id: 'c4', buyerName: 'Fatima Al-Rashid', buyerAvatar: 'FA', buyerCountry: '🇦🇪', message: 'Do you ship to Dubai? Interested in bulk order for our boutique hotel lobby.', timestamp: '2d ago', likes: 3 },
    ],
    r2: [
        { id: 'c5', buyerName: 'David Chen', buyerAvatar: 'DC', buyerCountry: '🇨🇦', message: 'The packaging quality is next level. Our customers will love the unboxing experience!', timestamp: '3d ago', likes: 15, pinned: true, sellerReply: { message: 'Thank you David! We can also add custom branded tissue paper for orders over 500 units.', timestamp: '2d ago' } },
        { id: 'c6', buyerName: 'Sophie Laurent', buyerAvatar: 'SL', buyerCountry: '🇫🇷', message: 'Are the QC tags recyclable? Sustainability is important for our brand.', timestamp: '4d ago', likes: 6 },
    ],
    r5: [
        { id: 'c7', buyerName: 'James Wilson', buyerAvatar: 'JW', buyerCountry: '🇬🇧', message: 'Tested these against Sony XM5s — your ANC is actually competitive. What chipset?', timestamp: '5d ago', likes: 42, pinned: true, sellerReply: { message: 'We use a custom-tuned Qualcomm QCC5171 with our proprietary filter algorithm. Happy to send tech specs!', timestamp: '4d ago' } },
        { id: 'c8', buyerName: 'Priya Sharma', buyerAvatar: 'PS', buyerCountry: '🇮🇳', message: 'Can you make these with our brand logo? Need 2000 units for Diwali gifting.', timestamp: '5d ago', likes: 18 },
        { id: 'c9', buyerName: 'Roberto Silva', buyerAvatar: 'RS', buyerCountry: '🇧🇷', message: 'Battery life? And do they support LDAC/aptX HD?', timestamp: '6d ago', likes: 9, sellerReply: { message: '38h battery, aptX HD + LDAC supported. We can send you a sample unit!', timestamp: '5d ago' } },
        { id: 'c10', buyerName: 'Anna Kowalski', buyerAvatar: 'AK', buyerCountry: '🇵🇱', message: 'Great demo! What\'s the lead time for 500 units with custom packaging?', timestamp: '6d ago', likes: 7 },
        { id: 'c11', buyerName: 'Li Wei', buyerAvatar: 'LW', buyerCountry: '🇨🇳', message: 'Impressive noise cancellation. Is there a distributor program available?', timestamp: '1w ago', likes: 4 },
        { id: 'c12', buyerName: 'Olga Petrov', buyerAvatar: 'OP', buyerCountry: '🇷🇺', message: 'Would love to see a comfort test video too — how do they feel after 4+ hours?', timestamp: '1w ago', likes: 11 },
    ],
    r6: [
        { id: 'c13', buyerName: 'Tom Nielsen', buyerAvatar: 'TN', buyerCountry: '🇩🇰', message: 'Very organized warehouse! What\'s your avg fulfillment time?', timestamp: '1w ago', likes: 6, sellerReply: { message: 'Thanks Tom! We ship within 24h of order confirmation, 3-5 days transit to EU.', timestamp: '1w ago' } },
        { id: 'c14', buyerName: 'Maria Garcia', buyerAvatar: 'MG', buyerCountry: '🇪🇸', message: 'Do you offer dropshipping? Would love to add these to our online store.', timestamp: '2w ago', likes: 3 },
    ],
};

function fmtNum(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
}

/* ═══════════════════════════════════════ */
/*  MAIN COMPONENT                         */
/* ═══════════════════════════════════════ */
export function SellerReels() {
    const [expanded, setExpanded] = useState(false);
    const [reels, setReels] = useState<Reel[]>([]);
    const [filter, setFilter] = useState<'all' | ReelStatus>('all');
    const [showUpload, setShowUpload] = useState(false);
    const [editingReel, setEditingReel] = useState<Reel | null>(null);
    const [menuOpen, setMenuOpen] = useState<string | null>(null);
    const [commentsOpenId, setCommentsOpenId] = useState<string | null>(null);
    const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
    const [localComments, setLocalComments] = useState<Record<string, BuyerComment[]>>({});
    const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
    const menuRef = useRef<HTMLDivElement>(null);
    const replyInputRef = useRef<HTMLInputElement>(null);

    // Edit form state
    const [editCaption, setEditCaption] = useState('');
    const [editHashtags, setEditHashtags] = useState('');
    const [editVisibility, setEditVisibility] = useState<'public' | 'followers' | 'private'>('public');

    // Upload form state
    const [uploadCaption, setUploadCaption] = useState('');
    const [uploadProductId, setUploadProductId] = useState('');
    const [uploadHashtags, setUploadHashtags] = useState('');
    const [uploadVisibility, setUploadVisibility] = useState<'public' | 'followers' | 'private'>('public');
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    const [sellerProducts, setSellerProducts] = useState<SellerProductOption[]>([]);
    const [editReplaceFile, setEditReplaceFile] = useState<File | null>(null);

    const uploadInputRef = useRef<HTMLInputElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    const fetchReels = useCallback(async () => {
        try {
            const res = await authedFetch('/api/v1/seller/dashboard/reels/');
            if (!res.ok) return;
            const data = await res.json().catch(() => null);
            if (Array.isArray(data)) setReels(data as Reel[]);
        } catch {
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        try {
            const res = await authedFetch('/api/v1/products/?ordering=-created_at');
            if (!res.ok) return;
            const data = await res.json().catch(() => null);
            const results = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
            const mapped: SellerProductOption[] = results
                .map((p: any) => ({ id: String(p?.id || ''), name: String(p?.name || p?.title || '').trim() }))
                .filter((p: any) => p.id && p.name);
            setSellerProducts(mapped);
        } catch {
        }
    }, []);

    useEffect(() => {
        void (async () => {
            await Promise.all([fetchReels(), fetchProducts()]);
        })();
    }, [fetchReels, fetchProducts]);

    const filtered = filter === 'all' ? reels : reels.filter(r => r.status === filter);
    const publishedCount = reels.filter(r => r.status === 'published').length;
    const totalViews = reels.reduce((s, r) => s + r.views, 0);
    const totalLikes = reels.reduce((s, r) => s + r.likes, 0);

    const toggleComments = useCallback((reelId: string) => {
        setCommentsOpenId(prev => prev === reelId ? null : reelId);
        setMenuOpen(null);
    }, []);

    const sendReply = useCallback((reelId: string, commentId: string) => {
        const text = replyTexts[commentId]?.trim();
        if (!text) return;
        setLocalComments(prev => {
            const updated = { ...prev };
            updated[reelId] = (updated[reelId] || []).map(c =>
                c.id === commentId ? { ...c, sellerReply: { message: text, timestamp: 'Just now' } } : c
            );
            return updated;
        });
        setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
        toast.success('Reply sent', { description: 'Your response is now visible to the buyer' });
    }, [replyTexts]);

    const toggleLikeComment = useCallback((commentId: string) => {
        setLikedComments(prev => {
            const next = new Set(prev);
            if (next.has(commentId)) next.delete(commentId); else next.add(commentId);
            return next;
        });
    }, []);

    const openEdit = useCallback((reel: Reel) => {
        setEditingReel(reel);
        setEditCaption(reel.caption);
        setEditHashtags(reel.hashtags.join(', '));
        setEditVisibility(reel.visibility);
        setEditReplaceFile(null);
        setMenuOpen(null);
    }, []);

    const mediaIdFromReelId = useCallback((rid: string) => {
        const raw = (rid || '').toString();
        if (raw.startsWith('r')) {
            const n = raw.slice(1);
            if (/^\d+$/.test(n)) return n;
        }
        return raw;
    }, []);

    const saveEdit = useCallback(async () => {
        if (!editingReel) return;
        const mediaId = mediaIdFromReelId(editingReel.id);
        try {
            if (editReplaceFile) {
                const fd = new FormData();
                fd.append('title', editCaption);
                fd.append('file', editReplaceFile);
                const res = await authedFetch(`/api/v1/product-media/${mediaId}/`, { method: 'PATCH', body: fd });
                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    throw new Error((err?.detail || '').toString() || 'Failed to update reel.');
                }
            } else {
                const res = await authedFetch(`/api/v1/product-media/${mediaId}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: editCaption }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    throw new Error((err?.detail || '').toString() || 'Failed to update reel.');
                }
            }
            toast.success('Post updated', { description: 'Changes saved' });
            setEditingReel(null);
            setEditReplaceFile(null);
            setReels(prev => prev.map(r =>
                r.id === editingReel.id
                    ? {
                        ...r,
                        caption: editCaption,
                        hashtags: editHashtags.split(',').map(h => h.trim().replace('#', '')).filter(Boolean),
                        visibility: editVisibility,
                    }
                    : r
            ));
            await fetchReels();
        } catch (e: any) {
            toast.error('Update failed', { description: (e?.message || '').toString() || 'Could not update reel.' });
        }
    }, [editingReel, editCaption, editHashtags, editVisibility, editReplaceFile, fetchReels, mediaIdFromReelId]);

    const deleteReel = useCallback(async (id: string) => {
        const mediaId = mediaIdFromReelId(id);
        try {
            const res = await authedFetch(`/api/v1/product-media/${mediaId}/`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error((err?.detail || '').toString() || 'Failed to delete reel.');
            }
            setReels(prev => prev.filter(r => r.id !== id));
            setMenuOpen(null);
            toast('Post deleted', { description: 'The reel has been removed' });
            await fetchReels();
        } catch (e: any) {
            toast.error('Delete failed', { description: (e?.message || '').toString() || 'Could not delete reel.' });
        }
    }, [fetchReels, mediaIdFromReelId]);

    const publishDraft = useCallback((id: string) => {
        setReels(prev => prev.map(r => r.id === id ? { ...r, status: 'pending' as ReelStatus, postedAt: 'Pending review' } : r));
        setMenuOpen(null);
        toast.success('Submitted for review', { description: 'Your reel will be reviewed within 24 hours' });
    }, []);

    const handleSaveDraft = useCallback(() => {
        const newReel: Reel = {
            id: `r${Date.now()}`,
            thumbnail: 'https://images.unsplash.com/photo-1766499670904-edab815e8fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3R0ZXJ5JTIwd29ya3Nob3AlMjBjcmFmdGluZyUyMGhhbmRzfGVufDF8fHx8MTc3MzQwNjQ4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            caption: uploadCaption || 'New product reel',
            product: (sellerProducts.find(p => p.id === uploadProductId)?.name || 'General'),
            productId: uploadProductId || '',
            status: 'draft',
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            duration: '0:00',
            postedAt: 'Draft',
            hashtags: uploadHashtags.split(',').map(h => h.trim().replace('#', '')).filter(Boolean),
            visibility: uploadVisibility,
        };
        setReels(prev => [newReel, ...prev]);
        setShowUpload(false);
        setUploadCaption('');
        setUploadProductId('');
        setUploadHashtags('');
        setUploadFile(null);
        toast.success('Draft saved', { description: 'Upload a video to submit it for review.' });
    }, [sellerProducts, uploadCaption, uploadHashtags, uploadProductId, uploadVisibility]);

    const handleSubmitUpload = useCallback(async () => {
        if (!uploadFile) {
            toast.error('Select a video file to submit.');
            return;
        }
        if (!uploadProductId) {
            toast.error('Select a product for this reel.');
            return;
        }
        try {
            const fd = new FormData();
            fd.append('product', uploadProductId);
            fd.append('media_type', 'video');
            fd.append('title', uploadCaption);
            fd.append('file', uploadFile);
            const res = await authedFetch('/api/v1/product-media/upload/', { method: 'POST', body: fd });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error((data?.detail || '').toString() || 'Failed to upload.');
            }
            setShowUpload(false);
            setUploadCaption('');
            setUploadProductId('');
            setUploadHashtags('');
            setUploadFile(null);
            toast.success('Reel uploaded', { description: 'Your video is now attached to your product.' });
            await fetchReels();
        } catch (e: any) {
            toast.error('Upload failed', { description: (e?.message || '').toString() || 'Could not upload reel.' });
        }
    }, [fetchReels, uploadCaption, uploadFile, uploadProductId]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.55, ease: EASE }}
            className="mb-10"
            style={{ fontFamily: FONT }}
        >
            {/* Section header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <p className="text-[12px] font-semibold text-[#1A1A1A]/30 tracking-wide">
                        Product Reels
                    </p>
                    <span className="text-[9px] font-bold text-[#e74444]/40 bg-[#e74444]/[0.05] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <Film size={8} strokeWidth={2.5} /> {publishedCount} live
                    </span>
                </div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-[#1A1A1A]/25 uppercase tracking-wider border-none bg-transparent cursor-pointer hover:text-[#1A1A1A]/40 transition-colors px-0"
                >
                    {expanded ? 'Collapse' : 'Manage'}
                    {expanded ? <ChevronUp size={10} strokeWidth={2.5} /> : <ChevronDown size={10} strokeWidth={2.5} />}
                </button>
            </div>

            {/* ── Collapsed: horizontal scroll preview ── */}
            {!expanded && (
                <motion.div layout className="overflow-hidden">
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {/* New reel button */}
                        <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { setExpanded(true); setShowUpload(true); }}
                            className="flex-shrink-0 w-[80px] h-[112px] rounded-[14px] border-2 border-dashed border-black/[0.06] flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-[#0171E3]/20 hover:bg-[#0171E3]/[0.01] transition-all"
                        >
                            <div className="w-[28px] h-[28px] rounded-full bg-[#0171E3]/[0.06] flex items-center justify-center">
                                <Plus size={14} color="#0171E3" strokeWidth={2.5} />
                            </div>
                            <span className="text-[9px] font-bold text-[#1A1A1A]/25 uppercase tracking-wider">New</span>
                        </motion.div>

                        {/* Reel thumbnails */}
                        {reels.slice(0, 6).map((reel, i) => (
                            <motion.div
                                key={reel.id}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04, duration: 0.35 }}
                                className="flex-shrink-0 w-[80px] h-[112px] rounded-[14px] overflow-hidden relative cursor-pointer group"
                                onClick={() => setExpanded(true)}
                            >
                                <ImageWithFallback src={reel.thumbnail} alt="" className="w-full h-full object-cover" />
                                {/* Gradient overlay */}
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />
                                {/* Duration pill */}
                                <div className="absolute top-1.5 right-1.5 px-1.5 py-[1px] rounded-full bg-black/40 backdrop-blur-sm">
                                    <span className="text-[8px] font-bold text-white tabular-nums">{reel.duration}</span>
                                </div>
                                {/* Status */}
                                {reel.status !== 'published' && (
                                    <div className="absolute top-1.5 left-1.5 px-1.5 py-[1px] rounded-full flex items-center gap-0.5" style={{ background: STATUS_STYLES[reel.status].bg, backdropFilter: 'blur(6px)' }}>
                                        {STATUS_STYLES[reel.status].icon}
                                        <span className="text-[7px] font-bold uppercase" style={{ color: STATUS_STYLES[reel.status].color }}>{STATUS_STYLES[reel.status].label}</span>
                                    </div>
                                )}
                                {/* Views */}
                                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                                    {reel.status === 'published' && (
                                        <div className="flex items-center gap-1">
                                            <Play size={8} color="white" fill="white" strokeWidth={0} />
                                            <span className="text-[9px] font-bold text-white tabular-nums">{fmtNum(reel.views)}</span>
                                        </div>
                                    )}
                                </div>
                                {/* Play hover */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                                    <div className="w-[24px] h-[24px] rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                        <Play size={10} color="#1A1A1A" fill="#1A1A1A" strokeWidth={0} className="ml-[1px]" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Quick stats bar */}
                    <div className="flex items-center gap-4 mt-2 px-1">
                        <span className="text-[10px] font-medium text-[#1A1A1A]/25">
                            <span className="font-bold text-[#1A1A1A]/40 tabular-nums">{fmtNum(totalViews)}</span> total views
                        </span>
                        <span className="text-[10px] font-medium text-[#1A1A1A]/25">
                            <span className="font-bold text-[#1A1A1A]/40 tabular-nums">{fmtNum(totalLikes)}</span> likes
                        </span>
                        <span className="text-[10px] font-medium text-[#1A1A1A]/25">
                            <span className="font-bold text-[#1A1A1A]/40 tabular-nums">{reels.length}</span> reels
                        </span>
                    </div>
                </motion.div>
            )}

            {/* ── Expanded: full management panel ── */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.98 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.98 }}
                        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                        className="overflow-hidden"
                    >
                        <div
                            className="rounded-[22px] bg-white/75 backdrop-blur-2xl border border-white/40 overflow-hidden"
                            style={{
                                boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.75), 0 0 0 0.5px rgba(0,0,0,0.02), 0 1px 3px 0 rgba(0,0,0,0.018), 0 6px 24px -6px rgba(0,0,0,0.04), 0 28px 64px -20px rgba(0,0,0,0.055)',
                            }}
                        >
                            {/* ── Top bar: stats + actions ── */}
                            <div className="px-4 pt-4 pb-3 border-b border-black/[0.03]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-4">
                                        {[
                                            { label: 'Views', value: fmtNum(totalViews), icon: <Eye size={10} strokeWidth={2} /> },
                                            { label: 'Likes', value: fmtNum(totalLikes), icon: <Heart size={10} strokeWidth={2} /> },
                                            { label: 'Reels', value: reels.length.toString(), icon: <Film size={10} strokeWidth={2} /> },
                                        ].map(s => (
                                            <div key={s.label} className="flex items-center gap-1.5">
                                                <span className="text-[#1A1A1A]/20">{s.icon}</span>
                                                <span className="text-[13px] font-black text-[#1A1A1A]/65 tabular-nums">{s.value}</span>
                                                <span className="text-[9px] font-semibold text-[#1A1A1A]/25 uppercase">{s.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setShowUpload(true)}
                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border-none cursor-pointer"
                                        style={{
                                            background: '#1A1A1A',
                                            color: '#fff',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.1), 0 6px 16px -6px rgba(0,0,0,0.14)',
                                        }}
                                    >
                                        <Video size={12} strokeWidth={2.5} />
                                        <span className="text-[11px] font-bold">New Reel</span>
                                    </motion.button>
                                </div>

                                {/* Filter pills */}
                                <div className="flex items-center gap-1.5">
                                    {(['all', 'published', 'pending', 'draft'] as const).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`px-2.5 py-[5px] rounded-full text-[10px] font-semibold border-none cursor-pointer transition-all duration-200 ${
                                                filter === f
                                                    ? 'bg-[#1A1A1A] text-white'
                                                    : 'bg-transparent text-[#1A1A1A]/30 hover:text-[#1A1A1A]/50 hover:bg-black/[0.03]'
                                            }`}
                                        >
                                            {f === 'all' ? `All (${reels.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${reels.filter(r => r.status === f).length})`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── Reels grid ── */}
                            <div className="p-4">
                                {filtered.length === 0 && (
                                    <div className="py-10 text-center">
                                        <Film size={24} color="rgba(26,26,26,0.1)" strokeWidth={1.5} className="mx-auto mb-2" />
                                        <p className="text-[12px] font-medium text-[#1A1A1A]/25">No reels in this category</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {filtered.map((reel, i) => (
                                        <motion.div
                                            key={reel.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04, duration: 0.35 }}
                                            className="relative group"
                                        >
                                            {/* Thumbnail */}
                                            <div className="aspect-[9/14] rounded-[14px] overflow-hidden relative bg-[#F5F5F7] cursor-pointer"
                                                onClick={() => commentsOpenId === reel.id ? undefined : openEdit(reel)}
                                            >
                                                <ImageWithFallback src={reel.thumbnail} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.6) 100%)' }} />

                                                {/* Duration */}
                                                <div className="absolute top-2 right-2 px-2 py-[2px] rounded-full bg-black/40 backdrop-blur-sm z-10">
                                                    <span className="text-[9px] font-bold text-white tabular-nums">{reel.duration}</span>
                                                </div>

                                                {/* Status badge */}
                                                <div className="absolute top-2 left-2 px-2 py-[2px] rounded-full flex items-center gap-1 z-10" style={{ background: reel.status === 'published' ? 'rgba(46,170,87,0.15)' : STATUS_STYLES[reel.status].bg, backdropFilter: 'blur(8px)' }}>
                                                    <span style={{ color: STATUS_STYLES[reel.status].color }}>{STATUS_STYLES[reel.status].icon}</span>
                                                    <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: STATUS_STYLES[reel.status].color }}>
                                                        {STATUS_STYLES[reel.status].label}
                                                    </span>
                                                </div>

                                                {/* Bottom info — hidden when comments open */}
                                                <AnimatePresence>
                                                    {commentsOpenId !== reel.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="absolute bottom-0 left-0 right-0 p-2.5 z-10"
                                                        >
                                                            <p className="text-[10px] font-semibold text-white/90 leading-snug line-clamp-2 mb-1.5">{reel.caption}</p>
                                                            <div className="flex items-center gap-0.5 mb-1">
                                                                <Tag size={8} color="white" strokeWidth={2} style={{ opacity: 0.5 }} />
                                                                <span className="text-[9px] font-medium text-white/60 truncate">{reel.product}</span>
                                                            </div>
                                                            {reel.status === 'published' && (
                                                                <div className="flex items-center gap-2.5">
                                                                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-white/70 tabular-nums">
                                                                        <Play size={8} fill="white" strokeWidth={0} />{fmtNum(reel.views)}
                                                                    </span>
                                                                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-white/70 tabular-nums">
                                                                        <Heart size={8} strokeWidth={2} />{fmtNum(reel.likes)}
                                                                    </span>
                                                                    <span
                                                                        className="flex items-center gap-0.5 text-[9px] font-bold text-white/70 tabular-nums cursor-pointer hover:text-white/90 transition-colors"
                                                                        onClick={(e) => { e.stopPropagation(); toggleComments(reel.id); }}
                                                                    >
                                                                        <MessageCircle size={8} strokeWidth={2} />{localComments[reel.id]?.length || reel.comments}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Hover play overlay — hidden when comments open */}
                                                {commentsOpenId !== reel.id && (
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                                                        <div className="w-[36px] h-[36px] rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                                            <Play size={14} color="#1A1A1A" fill="#1A1A1A" strokeWidth={0} className="ml-[1px]" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ─── Instagram-style Comments Overlay ─── */}
                                                <AnimatePresence>
                                                    {commentsOpenId === reel.id && (localComments[reel.id]?.length || 0) > 0 && (
                                                        <motion.div
                                                            initial={{ y: '100%' }}
                                                            animate={{ y: 0 }}
                                                            exit={{ y: '100%' }}
                                                            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
                                                            className="absolute inset-0 z-20 flex flex-col"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {/* Frosted background */}
                                                            <div className="absolute inset-0 bg-black/70" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }} />

                                                            {/* Drag handle + header */}
                                                            <div className="relative z-10 pt-2 pb-1.5 px-3 flex-shrink-0">
                                                                <div className="w-8 h-[3px] rounded-full bg-white/25 mx-auto mb-2" />
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[11px] font-bold text-white/80">
                                                                        Comments
                                                                        <span className="text-white/30 ml-1 font-semibold">{localComments[reel.id]?.length}</span>
                                                                    </span>
                                                                    <button
                                                                        onClick={() => setCommentsOpenId(null)}
                                                                        className="w-[22px] h-[22px] rounded-full bg-white/10 flex items-center justify-center border-none cursor-pointer hover:bg-white/20 transition-colors"
                                                                    >
                                                                        <X size={10} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Scrollable comment thread */}
                                                            <div className="relative z-10 flex-1 overflow-y-auto px-3 pb-1" style={{ scrollbarWidth: 'none' }}>
                                                                <div className="flex flex-col gap-0">
                                                                    {(localComments[reel.id] || []).map((comment, ci) => (
                                                                        <motion.div
                                                                            key={comment.id}
                                                                            initial={{ opacity: 0, y: 10 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            transition={{ delay: ci * 0.04, duration: 0.3 }}
                                                                            className="mb-1"
                                                                        >
                                                                            {/* Buyer comment row */}
                                                                            <div className="flex items-start gap-1.5 mb-0.5">
                                                                                {/* Avatar ring */}
                                                                                <div className="w-[22px] h-[22px] rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)', padding: '1.5px' }}>
                                                                                    <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center">
                                                                                        <span className="text-[7px] font-black text-white/80">{comment.buyerAvatar}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-baseline gap-1 flex-wrap">
                                                                                        <span className="text-[10px] font-bold text-white/85">{comment.buyerName}</span>
                                                                                        <span className="text-[8px]">{comment.buyerCountry}</span>
                                                                                        <span className="text-[8px] font-medium text-white/25">{comment.timestamp}</span>
                                                                                        {comment.pinned && (
                                                                                            <span className="text-[7px] font-bold text-[#0171E3]/80 bg-[#0171E3]/15 px-1.5 py-[0.5px] rounded-full flex items-center gap-0.5">
                                                                                                <Pin size={5} strokeWidth={3} /> Pinned
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <p className="text-[10px] font-medium text-white/65 leading-[1.45] mt-0.5">{comment.message}</p>
                                                                                    {/* Like + reply actions */}
                                                                                    <div className="flex items-center gap-3 mt-1 mb-1">
                                                                                        <button
                                                                                            onClick={() => toggleLikeComment(comment.id)}
                                                                                            className={`flex items-center gap-1 text-[8px] font-bold border-none bg-transparent cursor-pointer transition-colors ${
                                                                                                likedComments.has(comment.id) ? 'text-[#FF3040]' : 'text-white/25 hover:text-white/50'
                                                                                            }`}
                                                                                        >
                                                                                            <Heart size={9} strokeWidth={2} fill={likedComments.has(comment.id) ? 'currentColor' : 'none'} />
                                                                                            {comment.likes + (likedComments.has(comment.id) ? 1 : 0)}
                                                                                        </button>
                                                                                        {!comment.sellerReply && (
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    setReplyTexts(prev => ({ ...prev, [comment.id]: prev[comment.id] ?? '' }));
                                                                                                    setTimeout(() => replyInputRef.current?.focus(), 100);
                                                                                                }}
                                                                                                className="text-[8px] font-bold text-white/25 border-none bg-transparent cursor-pointer hover:text-white/50 transition-colors"
                                                                                            >
                                                                                                Reply
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Seller reply — indented like IG reply thread */}
                                                                            {comment.sellerReply && (
                                                                                <div className="flex items-start gap-1.5 ml-7 mb-1.5">
                                                                                    <div className="w-[18px] h-[18px] rounded-full bg-[#0171E3] flex-shrink-0 flex items-center justify-center mt-0.5">
                                                                                        <span className="text-[6px] font-black text-white">You</span>
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <div className="flex items-baseline gap-1">
                                                                                            <span className="text-[9px] font-bold text-[#0171E3]/90">You</span>
                                                                                            <span className="text-[7px] font-medium text-white/20">{comment.sellerReply.timestamp}</span>
                                                                                        </div>
                                                                                        <p className="text-[9px] font-medium text-white/55 leading-[1.4] mt-0.5">{comment.sellerReply.message}</p>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Inline reply input for unreplied */}
                                                                            {!comment.sellerReply && replyTexts[comment.id] !== undefined && (
                                                                                <motion.div
                                                                                    initial={{ opacity: 0, height: 0 }}
                                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                                    className="ml-7 mb-2 overflow-hidden"
                                                                                >
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <div className="w-[18px] h-[18px] rounded-full bg-[#0171E3] flex-shrink-0 flex items-center justify-center">
                                                                                            <span className="text-[6px] font-black text-white">You</span>
                                                                                        </div>
                                                                                        <input
                                                                                            ref={replyInputRef}
                                                                                            value={replyTexts[comment.id] || ''}
                                                                                            onChange={e => setReplyTexts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                                                                            onKeyDown={e => { if (e.key === 'Enter') sendReply(reel.id, comment.id); }}
                                                                                            placeholder={`Reply to ${comment.buyerName.split(' ')[0]}...`}
                                                                                            className="flex-1 min-w-0 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-[9px] font-medium text-white/80 placeholder:text-white/20 outline-none focus:border-[#0171E3]/50 transition-colors"
                                                                                        />
                                                                                        <motion.button
                                                                                            whileTap={{ scale: 0.85 }}
                                                                                            onClick={() => sendReply(reel.id, comment.id)}
                                                                                            disabled={!replyTexts[comment.id]?.trim()}
                                                                                            className="w-[22px] h-[22px] rounded-full flex items-center justify-center border-none cursor-pointer flex-shrink-0 transition-all duration-200"
                                                                                            style={{ background: replyTexts[comment.id]?.trim() ? '#0171E3' : 'rgba(255,255,255,0.08)' }}
                                                                                        >
                                                                                            <Send size={9} strokeWidth={2.5} color={replyTexts[comment.id]?.trim() ? '#fff' : 'rgba(255,255,255,0.2)'} />
                                                                                        </motion.button>
                                                                                    </div>
                                                                                </motion.div>
                                                                            )}
                                                                        </motion.div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Bottom bar — unreplied count */}
                                                            <div className="relative z-10 flex-shrink-0 px-3 pt-1.5 pb-2.5">
                                                                {(() => {
                                                                    const unreplied = (localComments[reel.id] || []).filter(c => !c.sellerReply).length;
                                                                    return unreplied > 0 ? (
                                                                        <div className="flex items-center gap-1.5 mb-0">
                                                                            <div className="w-[4px] h-[4px] rounded-full bg-[#FF9500] animate-pulse" />
                                                                            <span className="text-[8px] font-bold text-[#FF9500]/80">
                                                                                {unreplied} awaiting reply
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <CheckCircle2 size={8} strokeWidth={2.5} color="rgba(46,170,87,0.7)" />
                                                                            <span className="text-[8px] font-bold text-[#2eaa57]/60">All replied</span>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Actions row below thumbnail */}
                                            <div className="flex items-center justify-between mt-2 px-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] font-medium text-[#1A1A1A]/25">{reel.postedAt}</span>
                                                    {/* Comment count button */}
                                                    {reel.status === 'published' && (localComments[reel.id]?.length || 0) > 0 && (
                                                        <button
                                                            onClick={() => toggleComments(reel.id)}
                                                            className={`flex items-center gap-1 px-2 py-[3px] rounded-full border-none cursor-pointer transition-all duration-200 ${
                                                                commentsOpenId === reel.id
                                                                    ? 'bg-[#0171E3]/[0.1] text-[#0171E3]/80'
                                                                    : 'bg-black/[0.03] text-[#1A1A1A]/35 hover:bg-[#0171E3]/[0.06] hover:text-[#0171E3]/60'
                                                            }`}
                                                        >
                                                            <MessageCircle size={9} strokeWidth={2} />
                                                            <span className="text-[9px] font-bold tabular-nums">{localComments[reel.id]?.length || 0}</span>
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1" ref={menuOpen === reel.id ? menuRef : undefined}>
                                                    {reel.status === 'draft' && (
                                                        <button
                                                            onClick={() => publishDraft(reel.id)}
                                                            className="px-2 py-[3px] rounded-full bg-[#0171E3]/[0.06] text-[9px] font-bold text-[#0171E3]/60 border-none cursor-pointer hover:bg-[#0171E3]/[0.1] transition-colors"
                                                        >
                                                            Publish
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => openEdit(reel)}
                                                        className="w-[22px] h-[22px] rounded-full bg-black/[0.03] flex items-center justify-center border-none cursor-pointer hover:bg-black/[0.06] transition-colors"
                                                    >
                                                        <Edit3 size={10} color="rgba(26,26,26,0.3)" strokeWidth={2} />
                                                    </button>
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setMenuOpen(menuOpen === reel.id ? null : reel.id)}
                                                            className="w-[22px] h-[22px] rounded-full bg-black/[0.03] flex items-center justify-center border-none cursor-pointer hover:bg-black/[0.06] transition-colors"
                                                        >
                                                            <MoreHorizontal size={10} color="rgba(26,26,26,0.3)" strokeWidth={2} />
                                                        </button>
                                                        <AnimatePresence>
                                                            {menuOpen === reel.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                                                                    transition={{ duration: 0.15 }}
                                                                    className="absolute right-0 top-full mt-1 z-50 min-w-[130px] rounded-[12px] bg-white/95 backdrop-blur-2xl border border-white/50 py-1 overflow-hidden"
                                                                    style={{ boxShadow: '0 8px 32px -4px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
                                                                >
                                                                    <button
                                                                        onClick={() => openEdit(reel)}
                                                                        className="w-full text-left px-3 py-2 text-[11px] font-medium text-[#1A1A1A]/60 border-none bg-transparent cursor-pointer hover:bg-black/[0.03] flex items-center gap-2 transition-colors"
                                                                    >
                                                                        <Edit3 size={11} strokeWidth={2} /> Edit post
                                                                    </button>
                                                                    {reel.status === 'published' && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => { toast('Link copied!'); setMenuOpen(null); }}
                                                                                className="w-full text-left px-3 py-2 text-[11px] font-medium text-[#1A1A1A]/60 border-none bg-transparent cursor-pointer hover:bg-black/[0.03] flex items-center gap-2 transition-colors"
                                                                            >
                                                                                <Share2 size={11} strokeWidth={2} /> Share link
                                                                            </button>
                                                                            <button
                                                                                onClick={() => { toggleComments(reel.id); setMenuOpen(null); }}
                                                                                className="w-full text-left px-3 py-2 text-[11px] font-medium text-[#1A1A1A]/60 border-none bg-transparent cursor-pointer hover:bg-black/[0.03] flex items-center gap-2 transition-colors"
                                                                            >
                                                                                <MessageCircle size={11} strokeWidth={2} /> View messages
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                    <button
                                                                        onClick={() => deleteReel(reel.id)}
                                                                        className="w-full text-left px-3 py-2 text-[11px] font-medium text-[#ff3b30]/70 border-none bg-transparent cursor-pointer hover:bg-[#ff3b30]/[0.04] flex items-center gap-2 transition-colors"
                                                                    >
                                                                        <Trash2 size={11} strokeWidth={2} /> Delete
                                                                    </button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>


                                        </motion.div>
                                    ))}
                                </div>

                                {/* Performance insight */}
                                {reels.some(r => r.status === 'published') && (
                                    <div className="flex items-start gap-2 mt-4 px-3 py-2.5 rounded-[12px] bg-[#0171E3]/[0.03] border border-[#0171E3]/[0.06]">
                                        <TrendingUp size={12} color="#0171E3" strokeWidth={2} className="flex-shrink-0 mt-0.5 opacity-50" />
                                        <p className="text-[11px] font-medium text-[#1A1A1A]/40 leading-[1.5]">
                                            Your <span className="font-bold text-[#0171E3]/60">ANC test demo</span> reel is your top performer with 22.1K views. Reels with product demos get <span className="font-bold text-[#0171E3]/60">3.2x more engagement</span>.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════ */}
            {/*  UPLOAD MODAL                           */}
            {/* ═══════════════════════════════════════ */}
            <AnimatePresence>
                {showUpload && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-5"
                        style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)' }}
                        onClick={(e) => { if (e.target === e.currentTarget) setShowUpload(false); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 5 }}
                            transition={{ duration: 0.3, ease: EASE }}
                            className="w-full max-w-[440px] rounded-[24px] bg-white/95 backdrop-blur-2xl border border-white/40 overflow-hidden max-h-[90vh] overflow-y-auto"
                            style={{ boxShadow: '0 24px 80px -12px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
                        >
                            <div className="p-5 md:p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-[32px] h-[32px] rounded-[10px] bg-gradient-to-br from-[#FF3B5C] to-[#FF8A00] flex items-center justify-center">
                                            <Video size={16} color="white" strokeWidth={2} />
                                        </div>
                                        <div>
                                            <p className="text-[16px] font-bold text-[#1A1A1A]/85">New Reel</p>
                                            <p className="text-[10px] font-medium text-[#1A1A1A]/30">Short video of your product</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowUpload(false)}
                                        className="w-[30px] h-[30px] rounded-full bg-black/[0.04] flex items-center justify-center border-none cursor-pointer hover:bg-black/[0.08] transition-colors"
                                    >
                                        <X size={14} color="rgba(26,26,26,0.4)" />
                                    </button>
                                </div>

                                {/* Video upload zone */}
                                <input
                                    ref={uploadInputRef}
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0] || null;
                                        setUploadFile(f);
                                        if (f) toast('Video selected', { description: `${f.name}` });
                                    }}
                                />
                                <div
                                    onClick={() => uploadInputRef.current?.click()}
                                    className={`rounded-[16px] border-2 border-dashed p-6 mb-4 cursor-pointer transition-all duration-200 flex flex-col items-center gap-2 ${
                                        uploadFile
                                            ? 'border-[#2eaa57]/30 bg-[#2eaa57]/[0.03]'
                                            : 'border-black/[0.06] hover:border-[#0171E3]/20 hover:bg-[#0171E3]/[0.01]'
                                    }`}
                                >
                                    {uploadFile ? (
                                        <>
                                            <div className="w-[40px] h-[40px] rounded-full bg-[#2eaa57]/10 flex items-center justify-center">
                                                <CheckCircle2 size={20} color="#2eaa57" strokeWidth={2} />
                                            </div>
                                            <p className="text-[12px] font-semibold text-[#2eaa57]/70">Video selected</p>
                                            <p className="text-[10px] font-medium text-[#1A1A1A]/25">{uploadFile.name} · {(uploadFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-[40px] h-[40px] rounded-full bg-black/[0.03] flex items-center justify-center">
                                                <Upload size={18} color="rgba(26,26,26,0.25)" strokeWidth={2} />
                                            </div>
                                            <p className="text-[12px] font-semibold text-[#1A1A1A]/35">Tap to upload video</p>
                                            <p className="text-[10px] font-medium text-[#1A1A1A]/20">MP4, MOV · Max 60s · 9:16 recommended</p>
                                        </>
                                    )}
                                </div>

                                {/* Caption */}
                                <div className="mb-3">
                                    <label className="text-[11px] font-semibold text-[#1A1A1A]/35 block mb-1.5">
                                        Caption
                                    </label>
                                    <textarea
                                        value={uploadCaption}
                                        onChange={e => setUploadCaption(e.target.value)}
                                        placeholder="What's happening in this video?"
                                        rows={2}
                                        className="w-full px-4 py-2.5 rounded-[12px] border border-black/[0.06] bg-white/80 text-[13px] font-medium text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/20 outline-none focus:border-[#0071e3]/30 transition-colors resize-none"
                                    />
                                </div>

                                {/* Product + Hashtags row */}
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-[#1A1A1A]/35 block mb-1.5">
                                            Tag product
                                        </label>
                                        <div className="relative">
                                            <Tag size={12} color="rgba(26,26,26,0.25)" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2" />
                                            <select
                                                value={uploadProductId}
                                                onChange={e => setUploadProductId(e.target.value)}
                                                className="w-full pl-8 pr-3 py-2.5 rounded-[12px] border border-black/[0.06] bg-white/80 text-[12px] font-medium text-[#1A1A1A]/65 outline-none focus:border-[#0071e3]/30 transition-colors appearance-none cursor-pointer"
                                            >
                                                <option value="">Select product</option>
                                                {sellerProducts.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={10} color="rgba(26,26,26,0.25)" strokeWidth={2.5} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-[#1A1A1A]/35 block mb-1.5">
                                            Hashtags
                                        </label>
                                        <div className="relative">
                                            <Hash size={12} color="rgba(26,26,26,0.25)" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                value={uploadHashtags}
                                                onChange={e => setUploadHashtags(e.target.value)}
                                                placeholder="handmade, craft"
                                                className="w-full pl-8 pr-3 py-2.5 rounded-[12px] border border-black/[0.06] bg-white/80 text-[12px] font-medium text-[#1A1A1A]/65 placeholder:text-[#1A1A1A]/20 outline-none focus:border-[#0071e3]/30 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Visibility */}
                                <div className="mb-4">
                                    <label className="text-[11px] font-semibold text-[#1A1A1A]/35 block mb-1.5">
                                        Visibility
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {([
                                            { id: 'public' as const, label: 'Public', icon: <Globe2 size={11} strokeWidth={2} /> },
                                            { id: 'followers' as const, label: 'Followers', icon: <Heart size={11} strokeWidth={2} /> },
                                            { id: 'private' as const, label: 'Private', icon: <Lock size={11} strokeWidth={2} /> },
                                        ]).map(v => (
                                            <button
                                                key={v.id}
                                                onClick={() => setUploadVisibility(v.id)}
                                                className={`flex items-center gap-1.5 px-3 py-[6px] rounded-full text-[10px] font-semibold border cursor-pointer transition-all duration-200 ${
                                                    uploadVisibility === v.id
                                                        ? 'border-[#0171E3]/20 bg-[#0171E3]/[0.05] text-[#0171E3]'
                                                        : 'border-black/[0.06] bg-transparent text-[#1A1A1A]/30 hover:bg-black/[0.02]'
                                                }`}
                                            >
                                                {v.icon}{v.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Compliance note */}
                                <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-[12px] mb-4" style={{ background: 'rgba(1,113,227,0.03)', border: '1px solid rgba(1,113,227,0.08)' }}>
                                    <Sparkles size={12} color="#0171E3" strokeWidth={2} className="flex-shrink-0 mt-0.5 opacity-50" />
                                    <p className="text-[10px] font-medium text-[#1A1A1A]/40 leading-[1.5]">
                                        Videos are reviewed for quality and compliance before going live. Approved listings only. Review takes <span className="font-bold text-[#0171E3]/60">up to 24 hours</span>.
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            handleSaveDraft();
                                        }}
                                        className="flex-1 py-3 rounded-full cursor-pointer text-[12px] font-semibold text-[#1A1A1A]/50 bg-transparent border border-black/[0.08] hover:bg-black/[0.02] transition-colors"
                                    >
                                        Save as Draft
                                    </button>
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={handleSubmitUpload}
                                        className="flex-1 py-3 rounded-full border-none cursor-pointer flex items-center justify-center gap-2"
                                        style={{
                                            background: uploadFile ? '#1A1A1A' : 'rgba(26,26,26,0.15)',
                                            color: '#fff',
                                            boxShadow: uploadFile ? '0 2px 8px rgba(0,0,0,0.1), 0 8px 20px -8px rgba(0,0,0,0.15)' : 'none',
                                        }}
                                    >
                                        <Send size={13} strokeWidth={2.5} />
                                        <span className="text-[12px] font-bold">Submit for Review</span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════ */}
            {/*  EDIT POST MODAL                        */}
            {/* ═══════════════════════════════════════ */}
            <AnimatePresence>
                {editingReel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-5"
                        style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)' }}
                        onClick={(e) => { if (e.target === e.currentTarget) setEditingReel(null); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 5 }}
                            transition={{ duration: 0.3, ease: EASE }}
                            className="w-full max-w-[440px] rounded-[24px] bg-white/95 backdrop-blur-2xl border border-white/40 overflow-hidden max-h-[90vh] overflow-y-auto"
                            style={{ boxShadow: '0 24px 80px -12px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
                        >
                            <div className="p-5 md:p-6">
                                {/* Header with preview */}
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[16px] font-bold text-[#1A1A1A]/85">Edit Post</p>
                                    <button
                                        onClick={() => setEditingReel(null)}
                                        className="w-[30px] h-[30px] rounded-full bg-black/[0.04] flex items-center justify-center border-none cursor-pointer hover:bg-black/[0.08] transition-colors"
                                    >
                                        <X size={14} color="rgba(26,26,26,0.4)" />
                                    </button>
                                </div>

                                {/* Video preview */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-[72px] h-[100px] rounded-[10px] overflow-hidden flex-shrink-0 relative">
                                        <ImageWithFallback src={editingReel.thumbnail} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-[24px] h-[24px] rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                                                <Play size={10} color="white" fill="white" strokeWidth={0} className="ml-[1px]" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1 right-1 px-1.5 py-[1px] rounded-full bg-black/40">
                                            <span className="text-[8px] font-bold text-white tabular-nums">{editingReel.duration}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-full" style={{ background: STATUS_STYLES[editingReel.status].bg }}>
                                                <span style={{ color: STATUS_STYLES[editingReel.status].color }}>{STATUS_STYLES[editingReel.status].icon}</span>
                                                <span className="text-[8px] font-bold uppercase" style={{ color: STATUS_STYLES[editingReel.status].color }}>{STATUS_STYLES[editingReel.status].label}</span>
                                            </span>
                                            <span className="text-[9px] font-medium text-[#1A1A1A]/25">{editingReel.postedAt}</span>
                                        </div>
                                        <p className="text-[12px] font-semibold text-[#1A1A1A]/60 mb-1">{editingReel.product}</p>
                                        {editingReel.status === 'published' && (
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#1A1A1A]/30 tabular-nums">
                                                    <Eye size={10} strokeWidth={2} />{fmtNum(editingReel.views)}
                                                </span>
                                                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#1A1A1A]/30 tabular-nums">
                                                    <Heart size={10} strokeWidth={2} />{fmtNum(editingReel.likes)}
                                                </span>
                                                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#1A1A1A]/30 tabular-nums">
                                                    <Share2 size={10} strokeWidth={2} />{fmtNum(editingReel.shares)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Caption edit */}
                                <div className="mb-3">
                                    <label className="text-[11px] font-semibold text-[#1A1A1A]/35 block mb-1.5">
                                        Caption
                                    </label>
                                    <textarea
                                        value={editCaption}
                                        onChange={e => setEditCaption(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-[12px] border border-black/[0.06] bg-white/80 text-[13px] font-medium text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/20 outline-none focus:border-[#0071e3]/30 transition-colors resize-none"
                                    />
                                    <p className="text-[9px] font-medium text-[#1A1A1A]/20 mt-1 text-right tabular-nums">{editCaption.length}/500</p>
                                </div>

                                {/* Hashtags edit */}
                                <div className="mb-3">
                                    <label className="text-[11px] font-semibold text-[#1A1A1A]/35 block mb-1.5">
                                        Hashtags
                                    </label>
                                    <div className="relative">
                                        <Hash size={12} color="rgba(26,26,26,0.25)" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            value={editHashtags}
                                            onChange={e => setEditHashtags(e.target.value)}
                                            className="w-full pl-8 pr-3 py-2.5 rounded-[12px] border border-black/[0.06] bg-white/80 text-[12px] font-medium text-[#1A1A1A]/65 outline-none focus:border-[#0071e3]/30 transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Visibility edit */}
                                <div className="mb-4">
                                    <label className="text-[11px] font-semibold text-[#1A1A1A]/35 block mb-1.5">
                                        Visibility
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {([
                                            { id: 'public' as const, label: 'Public', icon: <Globe2 size={11} strokeWidth={2} /> },
                                            { id: 'followers' as const, label: 'Followers', icon: <Heart size={11} strokeWidth={2} /> },
                                            { id: 'private' as const, label: 'Private', icon: <Lock size={11} strokeWidth={2} /> },
                                        ]).map(v => (
                                            <button
                                                key={v.id}
                                                onClick={() => setEditVisibility(v.id)}
                                                className={`flex items-center gap-1.5 px-3 py-[6px] rounded-full text-[10px] font-semibold border cursor-pointer transition-all duration-200 ${
                                                    editVisibility === v.id
                                                        ? 'border-[#0171E3]/20 bg-[#0171E3]/[0.05] text-[#0171E3]'
                                                        : 'border-black/[0.06] bg-transparent text-[#1A1A1A]/30 hover:bg-black/[0.02]'
                                                }`}
                                            >
                                                {v.icon}{v.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Replace video option */}
                                <input
                                    ref={editInputRef}
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0] || null;
                                        setEditReplaceFile(f);
                                        if (f) toast('Video selected', { description: `${f.name}` });
                                    }}
                                />
                                <div
                                    onClick={() => editInputRef.current?.click()}
                                    className="flex items-center gap-3 px-4 py-3 rounded-[14px] border border-black/[0.04] mb-4 cursor-pointer hover:bg-black/[0.01] transition-colors"
                                >
                                    <div className="w-[28px] h-[28px] rounded-full bg-black/[0.03] flex items-center justify-center flex-shrink-0">
                                        <RotateCcw size={13} color="rgba(26,26,26,0.3)" strokeWidth={2} />
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-semibold text-[#1A1A1A]/45">Replace video</p>
                                        <p className="text-[10px] font-medium text-[#1A1A1A]/20">{editReplaceFile ? editReplaceFile.name : 'Upload a new video for this post'}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setEditingReel(null)}
                                        className="flex-1 py-3 rounded-full cursor-pointer text-[12px] font-semibold text-[#1A1A1A]/50 bg-transparent border border-black/[0.08] hover:bg-black/[0.02] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={saveEdit}
                                        className="flex-1 py-3 rounded-full border-none cursor-pointer flex items-center justify-center gap-2"
                                        style={{
                                            background: '#1A1A1A',
                                            color: '#fff',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1), 0 8px 20px -8px rgba(0,0,0,0.15)',
                                        }}
                                    >
                                        <CheckCircle2 size={13} strokeWidth={2.5} />
                                        <span className="text-[12px] font-bold">Save Changes</span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
