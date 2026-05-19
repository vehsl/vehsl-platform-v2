"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
    ChevronRight, Phone, MessageSquare, ArrowLeft,
    Rocket, Store, Truck, ShieldCheck, BadgeCheck,
    CreditCard, RefreshCw, Scale, Lock, Wrench, Tag,
    Paperclip, Smile, Send, ThumbsUp, ThumbsDown, X,
    ExternalLink, Package, Factory, ClipboardCheck,
    Boxes, FileText, BarChart3,
} from 'lucide-react';
import { B, C } from './constants';

/* ═══════════════════════════════════════════════
   SELLER HELP DATA
   ═══════════════════════════════════════════════ */

interface Article {
    title: string;
    description: string;
    subtitle?: string;
    body?: string[];
    steps?: string[];
    tip?: string;
}

interface Topic {
    icon: React.ElementType;
    title: string;
    articles: Article[];
}

interface ChatMessage {
    id: string;
    from: 'agent' | 'user';
    text: string;
    time: string;
}

interface ApiThreadListItem {
    id: number;
    type: string;
    participants: number[];
    created_at: string;
    updated_at: string;
    unread_count?: number;
    last_message?: {
        id: number;
        sender_id: number;
        sender_name: string;
        content: string;
        sent_at: string;
    } | null;
    other_participants?: Array<{ id: number; name: string; is_manager?: boolean }> | null;
}

interface ApiMessage {
    id: number;
    thread: number;
    sender_id: number;
    sender_name: string;
    content: string;
    attachments: any[];
    sent_at: string;
    read_by: number[];
    deleted_at: string | null;
}

const SELLER_TOPICS: Topic[] = [
    { icon: Rocket, title: 'Getting started as seller', articles: [
        { title: 'How selling on Vehsl works', description: 'Overview of the seller experience.', body: ['Vehsl connects verified sellers with global buyers. Every product goes through quality assurance before delivery.', 'We handle inspections, secure payments, and worldwide logistics.'], steps: ['Complete your seller profile', 'Upload business certifications', 'List your first product', 'Pass quality inspection', 'Start receiving orders'], tip: 'Verified sellers with all certifications get 3x more buyer trust.' },
        { title: 'Setting up your store', description: 'Configure your manufacturing profile.', body: ['Add your factory details, production capabilities, certifications, and payout accounts.'], steps: ['Go to Settings > Business', 'Add your business details', 'Upload ISO/GMP certificates', 'Set production capacity and lead times', 'Add payout bank accounts'], tip: 'Complete profiles get priority in search results.' },
        { title: 'Your first listing', description: 'Create a listing that converts.', body: ['Great photos, accurate specifications, and competitive pricing are key to getting approved quickly.'], steps: ['Tap New Listing', 'Upload 5+ high-quality photos', 'Write detailed specifications', 'Set pricing and MOQ', 'Submit for review'], tip: 'Listings with 5+ photos get approved 2x faster.' },
    ] },
    { icon: Package, title: 'Listing & approval', articles: [
        { title: 'Listing approval process', description: 'How we review new products.', body: ['Every listing goes through a multi-step review: content check, specification verification, and sample quality assessment.'], steps: ['Submit your listing', 'Content team reviews details', 'QA requests a sample if needed', 'Listing approved or feedback given', 'Product goes live'], tip: 'Most listings are reviewed within 24-48 hours.' },
        { title: 'Under review status', description: 'What happens during review.', body: ['Your listing is being evaluated by our content and quality teams. You\'ll receive notifications at each stage.'], steps: ['Listing submitted — content check begins', 'Photos and descriptions verified', 'Pricing and specs confirmed', 'Sample may be requested', 'Approved or revisions requested'], tip: 'Respond to revision requests quickly to avoid delays.' },
        { title: 'Testing & pickup flow', description: 'From approval to active listing.', body: ['After approval, we may request a product sample for quality testing. Once passed, your listing goes live.'], steps: ['Listing approved', 'Sample pickup scheduled', 'Quality testing (2-3 days)', 'Results shared with you', 'Product goes live on marketplace'], tip: 'Products passing quality testing get a "Quality Verified" badge.' },
    ] },
    { icon: ClipboardCheck, title: 'Fulfillment pipeline', articles: [
        { title: 'Order lifecycle', description: 'From new order to delivery.', body: ['Each order moves through stages: New → Accepted → Sample → QC → Making → Pickup → Shipped → Delivered.'], steps: ['Receive new order notification', 'Review and accept (negotiate if needed)', 'Begin production', 'QC inspection at your facility', 'Arrange pickup/shipping', 'Track until delivered'], tip: 'Accept orders within 24 hours for best buyer experience.' },
        { title: 'Production milestones', description: 'Track and update progress.', body: ['Keep buyers informed by updating production stages. This builds trust and reduces support inquiries.'], steps: ['Mark "Sample Ready"', 'Update "QC In Progress"', 'Confirm "Making"', 'Set "Ready for Pickup"', 'Upload shipping details'], tip: 'Regular updates reduce buyer complaints by 60%.' },
        { title: 'Quality inspections', description: 'What to expect from inspectors.', body: ['Inspectors visit your facility to verify product quality matches listing specifications.'], steps: ['Inspector scheduled (you\'ll be notified)', 'Prepare batch for inspection', 'Random sampling of units', 'Visual and functional checks', 'Pass/fail determination'], tip: 'Keep a clean, organized production area for inspections.' },
    ] },
    { icon: CreditCard, title: 'Payouts & earnings', articles: [
        { title: 'Payout schedule', description: 'When and how you get paid.', body: ['Payouts are processed after buyer confirmation. Standard processing takes 3-5 business days.'], steps: ['Order delivered and confirmed', 'Payout initiated automatically', 'Processing (3-5 business days)', 'Deposited to your default account', 'Receipt available in earnings'], tip: 'Large orders ($10K+) may have an additional verification step.' },
        { title: 'Commission structure', description: 'Understand the fee breakdown.', body: ['Small commission per sale based on your plan. No listing fees on the free tier.'], steps: ['Review your plan\'s commission rate', 'Commission deducted from sale price', 'Net amount deposited to you', 'Detailed breakdown in each payout'], tip: 'Pro sellers get 40% lower commission rates.' },
        { title: 'Security deposits', description: 'For high-value orders.', body: ['Orders above certain thresholds require a 9% security deposit, held until successful delivery.'], steps: ['Large order accepted', 'Security deposit held (9%)', 'Production and QC completed', 'Order delivered successfully', 'Deposit released with payout'], tip: 'Security deposits protect both parties and build trust.' },
    ] },
    { icon: Truck, title: 'Shipping & logistics', articles: [
        { title: 'Pickup scheduling', description: 'Arrange courier collection.', body: ['Set your pickup address and preferred time slots. Couriers collect from your facility.'], steps: ['Set pickup address in Settings', 'Mark order "Ready for Pickup"', 'Choose preferred time slot', 'Courier arrives for collection', 'Tracking number generated'], tip: 'Set up a recurring pickup schedule for regular orders.' },
        { title: 'Shipping documentation', description: 'Required export paperwork.', body: ['Vehsl generates most shipping documents. You provide product-specific certifications.'], steps: ['Commercial invoice (auto-generated)', 'Packing list (auto-generated)', 'Certificate of origin (if required)', 'Product-specific certs', 'Customs declaration'], tip: 'Keep export certificates up to date to avoid delays.' },
        { title: 'International shipping', description: 'Cross-border logistics explained.', body: ['Vehsl partners with global logistics providers. We handle customs documentation.'], steps: ['Order confirmed', 'Shipping method selected', 'Pickup arranged', 'Customs clearance handled', 'Delivery tracking active'], tip: 'DDP shipments have higher buyer satisfaction.' },
    ] },
    { icon: Scale, title: 'Disputes & protection', articles: [
        { title: 'Handling buyer disputes', description: 'Respond professionally and quickly.', body: ['When a buyer raises a dispute, you have 48 hours to respond with evidence.'], steps: ['Notification received', 'Review buyer\'s claim', 'Gather evidence (photos, docs)', 'Submit your response', 'Mediation if needed'], tip: 'Respond within 24 hours for best outcomes.' },
        { title: 'Seller protection', description: 'Your rights as a seller.', body: ['Vehsl protects sellers against fraudulent returns, false claims, and unjustified chargebacks.'], steps: ['All claims reviewed neutrally', 'Your evidence is considered equally', 'False claims are penalized', 'Compensation for proven fraud'], tip: 'Keep detailed production records and shipping proof.' },
        { title: 'Delivery bonuses & penalties', description: 'Incentive system explained.', body: ['Deliver early to earn up to 10% bonus. Late deliveries incur penalties up to 9% with progressive warnings.'], steps: ['Bonus: Up to 10% for early delivery', 'On time: No adjustment', '1-3 days late: Warning + 3% penalty', '4-7 days late: 6% penalty', '7+ days late: 9% max penalty'], tip: 'Set realistic lead times to avoid penalties.' },
    ] },
    { icon: BarChart3, title: 'Analytics & trends', articles: [
        { title: 'Seller dashboard analytics', description: 'Understand your performance.', body: ['Track orders, revenue, production efficiency, and buyer satisfaction.'], steps: ['View monthly revenue trends', 'Monitor order acceptance rates', 'Track production milestones', 'Review buyer ratings', 'Compare with industry benchmarks'], tip: 'Check analytics weekly to spot trends early.' },
        { title: 'Product trends', description: 'Discover what buyers want.', body: ['Use Seller Trends to find high-demand products and emerging market opportunities.'], steps: ['Go to Seller Trends tab', 'Search by product category', 'Filter by industry and country', 'Review demand indicators', 'Plan your product line accordingly'], tip: 'Focus on trending products for faster sales.' },
        { title: 'Performance optimization', description: 'Improve your seller metrics.', body: ['Higher ratings, faster fulfillment, and better communication lead to more orders.'], steps: ['Maintain high acceptance rate', 'Update production milestones regularly', 'Respond to messages within 4 hours', 'Keep certifications current', 'Ask buyers for reviews'], tip: 'Top-rated sellers get featured placement.' },
    ] },
    { icon: Lock, title: 'Account & security', articles: [
        { title: 'Payout protection', description: 'Secure your earnings.', body: ['Enable payout PIN and two-factor authentication to protect your earnings.'], steps: ['Go to Settings > Security', 'Enable payout protection PIN', 'Set up two-factor authentication', 'Add trusted devices', 'Keep recovery codes safe'], tip: 'Always enable payout PIN for maximum protection.' },
        { title: 'Listing modification lock', description: 'Prevent unauthorized changes.', body: ['Require password verification before editing live product listings.'], steps: ['Go to Settings > Security', 'Enable listing modification lock', 'Password required for all edits', 'Protects against unauthorized access'], tip: 'Essential if multiple team members access your account.' },
        { title: 'Order cancellation security', description: 'Password-verified cancellations.', body: ['Prevent accidental or unauthorized order cancellations with password verification.'], steps: ['Enable in Security settings', 'Password required to cancel', 'Applies to all accepted orders', 'Audit trail maintained'], tip: 'Recommended for all sellers with active orders.' },
    ] },
    { icon: Wrench, title: 'Business tools', articles: [
        { title: 'Bulk order management', description: 'Handle large orders efficiently.', body: ['Manage MOQ, production schedules, and bulk pricing all in one place.'], steps: ['Set MOQ in product listing', 'Configure bulk pricing tiers', 'Manage production queue', 'Track batch progress', 'Coordinate inspections'], tip: 'Bulk orders over $10K get dedicated account management.' },
        { title: 'API & integrations', description: 'Connect with your systems.', body: ['REST API for ERP, inventory, and production management integration.'], steps: ['Apply for API access', 'Generate API keys', 'Review documentation', 'Build and test', 'Go live'], tip: 'Start with sandbox for risk-free testing.' },
        { title: 'Certificate management', description: 'Keep certifications current.', body: ['Upload, track expiry dates, and get renewal reminders for all certifications.'], steps: ['Upload certificates in Business settings', 'Monitor expiry dates', 'Receive renewal reminders', 'Upload renewed certificates', 'Maintain listing eligibility'], tip: 'Set calendar reminders 30 days before expiry.' },
    ] },
    { icon: Tag, title: 'Plans & pricing', articles: [
        { title: 'Seller plans', description: 'Free, Pro, and Enterprise.', body: ['Each plan offers different commission rates, features, and support levels.'], steps: ['Free: Basic selling features', 'Pro: Lower commissions + analytics', 'Enterprise: Custom terms + dedicated support'], tip: 'Pro pays for itself at $5K/month in sales.' },
        { title: 'Understanding commissions', description: 'Detailed fee breakdown.', body: ['Commission is calculated on the net sale price after any negotiated discounts.'], steps: ['Review your plan rate', 'Commission applied per order', 'Deducted from payout', 'Monthly statement available'], tip: 'Higher volume = lower effective rate with Pro plan.' },
        { title: 'Upgrading your plan', description: 'Scale your selling.', body: ['Upgrade anytime with prorated billing. Downgrade retains all data.'], steps: ['Go to Plans & Billing', 'Compare plans', 'Select new plan', 'Instant activation'], tip: 'Try Pro free for 14 days.' },
    ] },
];

const SELLER_QUICK_SUGGESTIONS = [
    'I need help with an order',
    'Question about payouts',
    'Listing got rejected',
    'Something else',
];

/* ═══════════════════════════════════════════════
   CHAT VIEW (same structure as buyer)
   ═══════════════════════════════════════════════ */
function ChatView({
    onBack,
    title,
    existingMessages,
    authedFetch,
    threadId,
    currentUserId,
}: {
    onBack: () => void;
    title?: string;
    existingMessages?: ChatMessage[];
    authedFetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    threadId?: number;
    currentUserId?: number;
}) {
    const [messages, setMessages] = useState<ChatMessage[]>(existingMessages || [
        { id: 'bot-1', from: 'agent', text: 'Hi! I\'m your seller support specialist. How can I help you today?', time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) },
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, typing]);

    useEffect(() => {
        if (!authedFetch || !threadId) return;
        let cancelled = false;
        void (async () => {
            try {
                setLoading(true);
                const res = await authedFetch(`/api/v1/chat/threads/${threadId}/messages/?limit=120`);
                const data = await res.json().catch(() => null);
                if (!res.ok) return;
                const apiMsgs: ApiMessage[] = Array.isArray(data) ? data : [];
                const mapped: ChatMessage[] = apiMsgs
                    .filter(m => !m.deleted_at && (m.content || '').trim())
                    .map(m => ({
                        id: `m-${m.id}`,
                        from: currentUserId && m.sender_id === currentUserId ? 'user' : 'agent',
                        text: (m.content || '').toString(),
                        time: new Date(m.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
                    }));
                if (!cancelled) setMessages(prev => mapped.length ? mapped : prev);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [authedFetch, threadId, currentUserId]);

    const sendMessage = useCallback((text: string) => {
        if (!text.trim()) return;
        const trimmed = text.trim();
        const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        if (!authedFetch || !threadId) {
            setMessages(prev => [...prev, { id: `u-${Date.now()}`, from: 'user', text: trimmed, time: now }]);
            setInput('');
            setTyping(true);
            setTimeout(() => {
                setTyping(false);
                const replies = [
                    'I\'m pulling up your seller account details now. One moment.',
                    'That\'s a great question. Let me check with our fulfillment team.',
                    'I can see the issue. Let me work on getting this resolved for you right away.',
                    'I\'ve escalated this to our seller operations team. You\'ll hear back within 4 hours.',
                ];
                setMessages(prev => [...prev, {
                    id: `a-${Date.now()}`,
                    from: 'agent',
                    text: replies[Math.floor(Math.random() * replies.length)],
                    time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
                }]);
            }, 1200 + Math.random() * 800);
            return;
        }
        const optimisticId = `u-${Date.now()}`;
        setMessages(prev => [...prev, { id: optimisticId, from: 'user', text: trimmed, time: now }]);
        setInput('');
        void (async () => {
            try {
                setTyping(true);
                const res = await authedFetch(`/api/v1/chat/threads/${threadId}/messages/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: trimmed }),
                });
                const data = await res.json().catch(() => null);
                if (!res.ok) {
                    const msg = (data?.detail || data?.error || '').toString().trim() || 'Failed to send message.';
                    toast.error(msg);
                    return;
                }
                const created = data as ApiMessage;
                const mapped: ChatMessage = {
                    id: `m-${created.id || Date.now()}`,
                    from: currentUserId && created.sender_id === currentUserId ? 'user' : 'agent',
                    text: (created.content || '').toString(),
                    time: created.sent_at ? new Date(created.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : now,
                };
                setMessages(prev => prev.map(m => m.id === optimisticId ? mapped : m));
            } finally {
                setTyping(false);
            }
        })();
    }, [authedFetch, threadId, currentUserId]);

    return (
        <div className="flex flex-col h-full" style={{ minHeight: 420 }}>
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 mb-1" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <button onClick={onBack}
                    className="w-[32px] h-[32px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.04] border-none cursor-pointer"
                    style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <ArrowLeft size={16} strokeWidth={1.8} style={{ color: B[600] }} />
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold" style={{ color: C.text }}>{title || 'Seller Support'}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: C.success }} />
                        <span className="text-[11px]" style={{ color: B[600] }}>Online · Usually replies in minutes</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
                {loading && (
                    <div className="flex justify-center">
                        <span className="text-[11px] px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.03)', color: B[600] }}>
                            Loading conversation…
                        </span>
                    </div>
                )}
                {messages.map(msg => (
                    <motion.div key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[80%]">
                            <div className="rounded-[16px] px-3.5 py-2.5"
                                style={{
                                    backgroundColor: msg.from === 'user' ? C.accent : 'rgba(0,0,0,0.04)',
                                    color: msg.from === 'user' ? 'white' : C.text,
                                }}>
                                <p className="text-[13px]" style={{ lineHeight: 1.5 }}>{msg.text}</p>
                            </div>
                            <p className="text-[10px] mt-1 px-1" style={{ color: B[100], textAlign: msg.from === 'user' ? 'right' : 'left' }}>{msg.time}</p>
                        </div>
                    </motion.div>
                ))}
                {typing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="rounded-[16px] px-4 py-3" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map(i => (
                                    <motion.div key={i}
                                        className="w-[6px] h-[6px] rounded-full"
                                        style={{ backgroundColor: B[100] }}
                                        animate={{ y: [0, -4, 0] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
                {messages.length === 1 && !typing && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {SELLER_QUICK_SUGGESTIONS.map(s => (
                            <button key={s} onClick={() => sendMessage(s)}
                                className="text-[12px] px-3 py-2 rounded-full border-none cursor-pointer transition-all duration-150 hover:bg-black/[0.06]"
                                style={{ backgroundColor: 'rgba(0,0,0,0.03)', color: C.text }}>
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') sendMessage(input); }}
                    placeholder="Type a message..."
                    className="flex-1 text-[13px] rounded-full px-4 py-2.5 outline-none transition-all duration-200"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.03)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        color: C.text,
                        fontFamily: "'Urbanist', sans-serif",
                    }}
                />
                <button onClick={() => sendMessage(input)}
                    disabled={!input.trim()}
                    className="w-[36px] h-[36px] rounded-full flex items-center justify-center border-none cursor-pointer transition-all duration-150"
                    style={{
                        backgroundColor: input.trim() ? C.accent : 'rgba(0,0,0,0.04)',
                        opacity: input.trim() ? 1 : 0.5,
                    }}>
                    <Send size={15} strokeWidth={2} style={{ color: input.trim() ? 'white' : B[100] }} />
                </button>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   SELLER HELP TAB
   ═══════════════════════════════════════════════ */
export function SellerHelpTab({
    openSupportChat,
    authedFetch,
    me,
}: {
    openSupportChat?: () => void | Promise<void>;
    authedFetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    me?: any;
}) {
    const [view, setView] = useState<'home' | 'topic' | 'article' | 'chat' | 'conversations' | 'conversation'>('home');
    const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
    const [activeArticle, setActiveArticle] = useState<Article | null>(null);
    const [activeThread, setActiveThread] = useState<ApiThreadListItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [helpfulness, setHelpfulness] = useState<Record<string, 'up' | 'down' | null>>({});
    const [threads, setThreads] = useState<ApiThreadListItem[]>([]);
    const [threadsLoading, setThreadsLoading] = useState(false);
    const [threadsError, setThreadsError] = useState<string>('');
    const currentUserId = Number(me?.id || 0) || undefined;

    const filteredTopics = searchQuery.trim()
        ? SELLER_TOPICS.filter(t =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.articles.some(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : SELLER_TOPICS;

    const goBack = () => {
        if (view === 'article') setView('topic');
        else if (view === 'topic') setView('home');
        else if (view === 'conversation') setView('conversations');
        else if (view === 'conversations') setView('home');
        else if (view === 'chat') setView('home');
    };

    const fetchThreads = useCallback(async () => {
        if (!authedFetch) return;
        try {
            setThreadsError('');
            setThreadsLoading(true);
            const res = await authedFetch('/api/v1/chat/threads/');
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                const msg = (data?.detail || data?.error || '').toString().trim() || 'Failed to load conversations.';
                setThreadsError(msg);
                setThreads([]);
                return;
            }
            const items: ApiThreadListItem[] = Array.isArray(data) ? data : [];
            const filtered = items.filter(t => ((t.type || '').toString().toLowerCase().includes('vehsl')));
            setThreads(filtered);
        } catch (e: any) {
            setThreadsError((e?.message || '').toString().trim() || 'Failed to load conversations.');
            setThreads([]);
        } finally {
            setThreadsLoading(false);
        }
    }, [authedFetch]);

    const openSupport = useCallback(async () => {
        if (!authedFetch) {
            if (openSupportChat) { await openSupportChat(); return; }
            try {
                const rt = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
                window.location.href = `/messages?returnTo=${rt}`;
            } catch { }
            return;
        }
        try {
            const res = await authedFetch('/api/v1/chat/threads/support/', { method: 'POST' });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                const msg = (data?.detail || data?.error || '').toString().trim() || 'No support agent available.';
                toast.error(msg);
                return;
            }
            const thread = data as ApiThreadListItem;
            setActiveThread(thread);
            setView('conversation');
        } catch (e: any) {
            toast.error((e?.message || '').toString().trim() || 'Failed to open support chat.');
        }
    }, [authedFetch, openSupportChat]);

    useEffect(() => {
        if (authedFetch) {
            void fetchThreads();
        }
    }, [authedFetch, fetchThreads]);

    return (
        <div>
            <AnimatePresence mode="wait">
                {/* ── HOME ── */}
                {view === 'home' && (
                    <motion.div key="home"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}>

                        {/* Header */}
                        <div className="mb-6">
                            <p className="text-[22px] font-semibold tracking-[-0.02em]" style={{ color: C.text }}>Seller Help</p>
                            <p className="text-[13px] mt-1" style={{ color: B[600] }}>Everything you need to manage and grow your store.</p>
                        </div>

                        {/* Search */}
                        <div className="relative mb-6">
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search seller help..."
                                className="w-full text-[13px] rounded-[14px] pl-4 pr-10 py-3 outline-none transition-all duration-200"
                                style={{
                                    backgroundColor: 'rgba(0,0,0,0.03)',
                                    border: '1px solid rgba(0,0,0,0.06)',
                                    color: C.text,
                                    fontFamily: "'Urbanist', sans-serif",
                                }}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-[20px] h-[20px] rounded-full flex items-center justify-center border-none cursor-pointer"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
                                    <X size={11} strokeWidth={2.5} style={{ color: B[600] }} />
                                </button>
                            )}
                        </div>

                        {/* Quick actions */}
                        <div className="flex gap-2.5 mb-6">
                            <button onClick={() => { void openSupport(); }}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[16px] text-[13px] font-medium border-none cursor-pointer transition-all duration-150 hover:opacity-85"
                                style={{ backgroundColor: C.accent, color: 'white' }}>
                                <MessageSquare size={15} strokeWidth={1.8} />
                                Chat with support
                            </button>
                            <button onClick={() => { void fetchThreads(); setView('conversations'); }}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[16px] text-[13px] font-medium border-none cursor-pointer transition-colors duration-150 hover:bg-black/[0.06]"
                                style={{ backgroundColor: 'rgba(0,0,0,0.03)', color: C.text }}>
                                <Phone size={15} strokeWidth={1.8} />
                                Past conversations
                            </button>
                        </div>

                        {/* Topics */}
                        <div className="space-y-1.5">
                            {filteredTopics.map((topic, i) => (
                                <motion.div key={topic.title}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03, duration: 0.3 }}
                                    role="button" tabIndex={0}
                                    onClick={() => { setActiveTopic(topic); setView('topic'); }}
                                    className="flex items-center gap-4 p-4 rounded-[18px] transition-all duration-150 hover:bg-black/[0.03] cursor-pointer outline-none"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.01)' }}>
                                    <div className="w-[36px] h-[36px] rounded-[12px] flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: 'rgba(0,113,227,0.06)' }}>
                                        <topic.icon size={17} strokeWidth={1.5} style={{ color: C.accent }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-medium" style={{ color: C.text }}>{topic.title}</p>
                                        <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>{topic.articles.length} articles</p>
                                    </div>
                                    <ChevronRight size={15} strokeWidth={1.5} style={{ color: B[100] }} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── TOPIC ── */}
                {view === 'topic' && activeTopic && (
                    <motion.div key="topic"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}>
                        <div className="flex items-center gap-3 mb-6">
                            <button onClick={goBack}
                                className="w-[32px] h-[32px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.04] border-none cursor-pointer"
                                style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                <ArrowLeft size={16} strokeWidth={1.8} style={{ color: B[600] }} />
                            </button>
                            <p className="text-[18px] font-semibold tracking-[-0.01em]" style={{ color: C.text }}>{activeTopic.title}</p>
                        </div>
                        <div className="space-y-1.5">
                            {activeTopic.articles.map((article, i) => (
                                <motion.div key={article.title}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04, duration: 0.3 }}
                                    role="button" tabIndex={0}
                                    onClick={() => { setActiveArticle(article); setView('article'); }}
                                    className="flex items-center gap-4 p-4 rounded-[18px] transition-all duration-150 hover:bg-black/[0.03] cursor-pointer outline-none"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.01)' }}>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-medium" style={{ color: C.text }}>{article.title}</p>
                                        <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>{article.description}</p>
                                    </div>
                                    <ChevronRight size={15} strokeWidth={1.5} style={{ color: B[100] }} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── ARTICLE ── */}
                {view === 'article' && activeArticle && (
                    <motion.div key="article"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}>
                        <div className="flex items-center gap-3 mb-6">
                            <button onClick={goBack}
                                className="w-[32px] h-[32px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.04] border-none cursor-pointer"
                                style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                <ArrowLeft size={16} strokeWidth={1.8} style={{ color: B[600] }} />
                            </button>
                            <p className="text-[18px] font-semibold tracking-[-0.01em] flex-1" style={{ color: C.text }}>{activeArticle.title}</p>
                        </div>

                        {activeArticle.body?.map((p, i) => (
                            <p key={i} className="text-[13.5px] mb-3" style={{ color: B[700], lineHeight: 1.65 }}>{p}</p>
                        ))}

                        {activeArticle.steps && (
                            <div className="mt-5 mb-5">
                                <p className="text-[12px] font-semibold uppercase tracking-[0.4px] mb-3" style={{ color: B[600] }}>Steps</p>
                                <div className="space-y-2">
                                    {activeArticle.steps.map((step, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-[14px]" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                            <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-semibold"
                                                style={{ backgroundColor: 'rgba(0,113,227,0.08)', color: C.accent }}>{i + 1}</span>
                                            <p className="text-[13px] pt-0.5" style={{ color: C.text }}>{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeArticle.tip && (
                            <div className="rounded-[16px] p-4 mb-5" style={{ backgroundColor: 'rgba(52,199,89,0.05)' }}>
                                <p className="text-[12px] font-semibold mb-1" style={{ color: C.success }}>Tip</p>
                                <p className="text-[13px]" style={{ color: B[700] }}>{activeArticle.tip}</p>
                            </div>
                        )}

                        {/* Helpfulness */}
                        <div className="rounded-[18px] p-5 text-center" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                            <p className="text-[13px] font-medium mb-3" style={{ color: C.text }}>Was this helpful?</p>
                            <div className="flex justify-center gap-3">
                                {([
                                    { key: 'up' as const, icon: ThumbsUp, label: 'Yes' },
                                    { key: 'down' as const, icon: ThumbsDown, label: 'No' },
                                ]).map(opt => {
                                    const selected = helpfulness[activeArticle.title] === opt.key;
                                    return (
                                        <button key={opt.key}
                                            onClick={() => {
                                                setHelpfulness(prev => ({ ...prev, [activeArticle.title]: opt.key }));
                                                toast(opt.key === 'up' ? 'Glad it helped!' : 'Thanks for the feedback');
                                            }}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[12px] font-medium border-none cursor-pointer transition-all duration-150"
                                            style={{
                                                backgroundColor: selected
                                                    ? (opt.key === 'up' ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.08)')
                                                    : 'rgba(0,0,0,0.03)',
                                                color: selected
                                                    ? (opt.key === 'up' ? C.success : C.danger)
                                                    : B[600],
                                            }}>
                                            <opt.icon size={14} strokeWidth={1.8} />
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── CHAT ── */}
                {view === 'chat' && (
                    <motion.div key="chat"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}>
                        <ChatView onBack={() => setView('home')} />
                    </motion.div>
                )}

                {/* ── CONVERSATIONS LIST ── */}
                {view === 'conversations' && (
                    <motion.div key="conversations"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}>
                        <div className="flex items-center gap-3 mb-6">
                            <button onClick={goBack}
                                className="w-[32px] h-[32px] rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/[0.04] border-none cursor-pointer"
                                style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                <ArrowLeft size={16} strokeWidth={1.8} style={{ color: B[600] }} />
                            </button>
                            <p className="text-[18px] font-semibold tracking-[-0.01em]" style={{ color: C.text }}>Past conversations</p>
                        </div>
                        <div className="space-y-2">
                            {threadsLoading && (
                                <div className="p-4 rounded-[18px]" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                    <p className="text-[12px]" style={{ color: B[600] }}>Loading conversations…</p>
                                </div>
                            )}
                            {!!threadsError && !threadsLoading && (
                                <div className="p-4 rounded-[18px]" style={{ backgroundColor: 'rgba(255,59,48,0.06)' }}>
                                    <p className="text-[12px]" style={{ color: C.danger }}>{threadsError}</p>
                                </div>
                            )}
                            {!threadsLoading && !threadsError && threads.length === 0 && (
                                <div className="p-4 rounded-[18px]" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                    <p className="text-[12px]" style={{ color: B[600] }}>No conversations yet.</p>
                                </div>
                            )}
                            {threads.map((t, i) => (
                                <motion.div key={t.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05, duration: 0.3 }}
                                    role="button" tabIndex={0}
                                    onClick={() => { setActiveThread(t); setView('conversation'); }}
                                    className="p-4 rounded-[18px] transition-all duration-150 hover:bg-black/[0.03] cursor-pointer outline-none"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.01)' }}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-[14px] font-medium" style={{ color: C.text }}>
                                            {(t.other_participants && t.other_participants[0]?.name) ? t.other_participants[0].name : (t.type === 'seller_vehsl' ? 'Seller Support' : 'Conversation')}
                                        </p>
                                        {!!(t.unread_count || 0) && (
                                            <span className="text-[10px] font-semibold px-2 py-[3px] rounded-full flex-shrink-0"
                                                style={{ backgroundColor: 'rgba(0,113,227,0.10)', color: C.accent }}>
                                                {t.unread_count} new
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[12px] truncate" style={{ color: B[600] }}>
                                        {(t.last_message && t.last_message.content) ? t.last_message.content : 'No messages yet'}
                                    </p>
                                    <p className="text-[11px] mt-1.5" style={{ color: B[100] }}>
                                        {new Date(t.updated_at).toLocaleDateString()}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── SINGLE CONVERSATION ── */}
                {view === 'conversation' && activeThread && (
                    <motion.div key="conversation"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}>
                        <ChatView
                            onBack={() => setView('conversations')}
                            title={(activeThread.other_participants && activeThread.other_participants[0]?.name) ? activeThread.other_participants[0].name : (activeThread.type === 'seller_vehsl' ? 'Seller Support' : 'Conversation')}
                            threadId={activeThread.id}
                            authedFetch={authedFetch}
                            currentUserId={currentUserId}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
