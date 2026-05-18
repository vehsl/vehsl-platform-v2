"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
    ChevronRight, Phone, MessageSquare, ArrowLeft,
    Rocket, ShoppingBag, Store, Truck, ShieldCheck, BadgeCheck,
    CreditCard, RefreshCw, Scale, Lock, Wrench, Tag,
    Paperclip, Smile, Send, ThumbsUp, ThumbsDown, X,
    ExternalLink,
} from 'lucide-react';
import { B, C } from './constants';

/* ═══════════════════════════════════════════════
   DATA
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

interface Conversation {
    id: string;
    title: string;
    agent: string;
    preview: string;
    status: string;
    statusColor: string;
    date: string;
    messages: ChatMessage[];
}

const CONVERSATIONS: Conversation[] = [
    {
        id: 'conv-1',
        title: 'Order #VH-28491 delivery issue',
        agent: 'Priya',
        preview: 'Vehsl handles all customs documentation. If the customs office needs anything additional, our team will provide it directly.',
        status: 'In progress',
        statusColor: '#0071e3',
        date: '12 May 2026',
        messages: [
            { id: 'm1', from: 'user', text: 'Hi, my order #VH-28491 hasn\'t arrived yet. It\'s been 3 weeks.', time: '7:12 AM' },
            { id: 'm2', from: 'agent', text: 'Hi! I\'m looking into order #VH-28491 for you now. I can see it\'s currently at the customs checkpoint in your destination country.', time: '7:15 AM' },
            { id: 'm3', from: 'user', text: 'Do I need to provide any documentation for customs?', time: '7:28 AM' },
            { id: 'm4', from: 'agent', text: 'Nothing at all — Vehsl handles all customs documentation. If the customs office needs anything additional, our team will provide it directly. I\'ll follow up tomorrow with a status update.', time: '7:32 AM' },
        ],
    },
    {
        id: 'conv-2',
        title: 'Product quality review request',
        agent: 'Marcus',
        preview: 'I can see a noticeable difference in the fabric weight between our inspection sample and your photos.',
        status: 'Under review',
        statusColor: '#e8a000',
        date: '15 May 2026',
        messages: [
            { id: 'm1', from: 'user', text: 'The fabric quality doesn\'t match the product listing. It feels much thinner.', time: '3:10 PM' },
            { id: 'm2', from: 'agent', text: 'I\'m sorry to hear that. Could you share some photos? This will help our QA team compare it against the inspection sample.', time: '3:14 PM' },
            { id: 'm3', from: 'user', text: 'Sure, I\'ve attached photos showing the fabric weight difference.', time: '3:25 PM' },
            { id: 'm4', from: 'agent', text: 'I can see a noticeable difference. I\'m escalating this to our Quality Assurance team. You can wait for the review (2-3 days) or initiate an immediate return. Which would you prefer?', time: '3:32 PM' },
        ],
    },
];

const TOPICS: Topic[] = [
    { icon: Rocket, title: 'Getting started', articles: [
        { title: 'How Vehsl works', description: 'An overview of the platform.', body: ['Vehsl connects verified buyers with trusted sellers. Every product goes through quality assurance before it reaches you.', 'We handle everything — verification, quality checks, payments, and worldwide shipping.'], steps: ['Browse or search for products', 'Review seller badges and quality ratings', 'Place your order with secure checkout', 'Track through inspection and shipping', 'Receive with buyer protection guarantee'], tip: 'New users get exclusive onboarding offers.' },
        { title: 'Creating your account', description: 'Sign up in under 2 minutes.', body: ['Sign up with email, phone, or social login. Verify your identity to start buying or selling.'], steps: ['Click "Sign Up"', 'Choose email, phone, or social', 'Verify your details', 'Complete your profile'], tip: 'Enable two-factor authentication for security.' },
        { title: 'Placing your first order', description: 'A step-by-step buying guide.', body: ['Search, review the seller, add to cart, checkout. You\'ll receive real-time updates throughout.'], steps: ['Find a product and add to cart', 'Review and checkout', 'Choose delivery and payment', 'Track in real-time'], tip: 'First orders include complimentary express shipping.' },
    ] },
    { icon: ShoppingBag, title: 'Buying on Vehsl', articles: [
        { title: 'Searching and buying', description: 'Find products with filters and smart search.', body: ['Use categories, keywords, price filters, and seller ratings to find what you need.'], steps: ['Search or browse categories', 'Apply filters', 'Review seller verification', 'Add to cart and checkout'], tip: 'Save searches for notifications on new listings.' },
        { title: 'Order tracking', description: 'Follow your order in real-time.', body: ['Every order has real-time tracking from purchase to delivery.'], steps: ['Go to My Orders', 'Select an order', 'View the status timeline', 'Click Track Shipment for details'], tip: 'Enable push notifications for updates.' },
        { title: 'Cancelling or modifying', description: 'Change your order before it ships.', body: ['Modify or cancel any time before shipping.'], steps: ['Open the order', 'Tap Modify or Cancel', 'Select your reason', 'Confirm'], tip: 'Free cancellation within 1 hour.' },
    ] },
    { icon: Store, title: 'Selling on Vehsl', articles: [
        { title: 'Listing products', description: 'Create listings that convert.', body: ['Great photos, detailed descriptions, and accurate specs are key.'], steps: ['Go to New Listing', 'Upload photos (minimum 3)', 'Write title and description', 'Set pricing and shipping', 'Submit for review'], tip: '5+ photos get 3x more views.' },
        { title: 'Inventory management', description: 'Keep stock accurate.', body: ['Track levels, set alerts, prevent overselling.'], steps: ['Set quantities', 'Enable low-stock alerts', 'Configure auto-reorder', 'Sync across channels'], tip: 'Use bulk import for multiple products.' },
        { title: 'Fees and commissions', description: 'Understand the fee structure.', body: ['Small commission per sale. No listing fees on the free plan.'], steps: ['Review commission rates', 'Factor in shipping costs', 'Set competitive prices', 'Monitor margins'], tip: 'Pro sellers get 40% lower rates.' },
    ] },
    { icon: Truck, title: 'Shipping & delivery', articles: [
        { title: 'Worldwide delivery', description: 'Coverage and timelines.', body: ['Ships to 190+ countries. 2-5 days domestic, 7-21 international.'], steps: ['Check estimates at checkout', 'Select shipping speed', 'Track in real-time', 'Contact support if delayed'], tip: 'Free express over $200.' },
        { title: 'Shipping rates', description: 'Estimate costs before ordering.', body: ['Based on weight, dimensions, destination, and speed.'], steps: ['Add items to cart', 'Enter address', 'View options and costs', 'Select preferred option'], tip: 'Bundle orders to save.' },
        { title: 'Customs & duties', description: 'International shipping explained.', body: ['Vehsl handles all customs documentation automatically.'], steps: ['Review duties at checkout', 'We prepare all documents', 'Customs clears automatically', 'Contact support if held'], tip: 'Choose DDP to avoid surprise charges.' },
    ] },
    { icon: ShieldCheck, title: 'Quality assurance', articles: [
        { title: 'Quality checks', description: 'Our inspection process.', body: ['Every product undergoes multi-step quality inspection.'], steps: ['Product shipped to inspection', 'Visual and physical check', 'Spec verification', 'Grade assigned', 'Approved or flagged'], tip: 'Passing products get a Quality Verified badge.' },
        { title: 'Quality ratings', description: 'What each rating means.', body: ['5-tier system: Excellent, Very Good, Good, Fair, Below Standard.'], steps: ['Check rating on product page', 'Read inspection report', 'Compare across products', 'Report disagreements'], tip: 'Filter by minimum quality rating.' },
        { title: 'Reporting issues', description: 'Flag quality concerns.', body: ['File a quality dispute within 14 days of delivery.'], steps: ['Select the order', 'Tap Report Quality Issue', 'Upload photos', 'Team reviews in 24 hours'], tip: 'Include comparison photos for fastest resolution.' },
    ] },
    { icon: BadgeCheck, title: 'Verification & trust', articles: [
        { title: 'Seller verification', description: 'How trust badges are earned.', body: ['Identity checks, business validation, and quality sampling.'], steps: ['Submit documents', 'Identity verification', 'Quality sampling', 'Receive badge'], tip: 'Verified sellers get 60% more trust.' },
        { title: 'Buyer verification', description: 'Quick and secure KYC.', body: ['Email and phone confirmation. Optional government ID for higher limits.'], steps: ['Verify email', 'Confirm phone', 'Optional: Add government ID', 'Full access'], tip: 'Full KYC unlocks higher limits.' },
        { title: 'Trust badges', description: 'What badges mean.', body: ['Different levels of verification, quality history, and satisfaction.'], steps: ['Look for badges', 'Hover for details', 'Compare sellers', 'Report misuse'], tip: 'Gold badge = 99%+ satisfaction.' },
    ] },
    { icon: CreditCard, title: 'Payments & billing', articles: [
        { title: 'Payment methods', description: 'All accepted payment options.', body: ['Cards, bank transfers, PayPal, Apple Pay, Google Pay, and Vehsl credits.'], steps: ['Select method at checkout', 'Enter details securely', 'Confirm purchase', 'Receive confirmation'], tip: 'Save a method for faster checkout.' },
        { title: 'Invoices & history', description: 'Access purchase records.', body: ['Download PDFs or export CSV from your account.'], steps: ['Go to Transaction History', 'Filter by date or status', 'Click for details', 'Download or export'], tip: 'Set up automatic monthly emails.' },
        { title: 'Multi-currency', description: 'Pay in your local currency.', body: ['40+ currencies with transparent exchange rates.'], steps: ['Set preferred currency', 'View local prices', 'No hidden fees', 'Refunds in original currency'], tip: 'Rates locked at checkout.' },
    ] },
    { icon: RefreshCw, title: 'Returns & refunds', articles: [
        { title: 'Return policy', description: '30-day return window.', body: ['Return most items within 30 days in original condition.'], steps: ['Check eligibility', 'Initiate within 30 days', 'Pack in original packaging', 'Use prepaid label', 'Refund in 5-7 days'], tip: '"Easy Return" items — no questions asked.' },
        { title: 'Initiating a return', description: 'Start in a few taps.', body: ['Go to order history, select the item, follow the wizard.'], steps: ['Go to My Orders', 'Select the order', 'Choose Return Item', 'Select reason', 'Print prepaid label'], tip: 'Within 7 days = priority processing.' },
        { title: 'Refund timelines', description: 'Track your refund.', body: ['3-5 business days after receiving your return. Bank may add 2-5 days.'], steps: ['Return received', 'Refund processed', 'Sent to payment method', 'Appears in account'], tip: 'Vehsl Credits = instant refund.' },
    ] },
    { icon: Scale, title: 'Disputes & protection', articles: [
        { title: 'Raising a dispute', description: 'When seller resolution fails.', body: ['Raise a formal dispute through Vehsl if direct resolution doesn\'t work.'], steps: ['Go to the order', 'Tap Raise a Dispute', 'Describe the issue', 'Upload evidence', 'Mediation in 48 hours'], tip: 'Contact the seller first — most issues resolve quickly.' },
        { title: 'Buyer protection', description: 'Every purchase is guaranteed.', body: ['Refund or replacement if your order doesn\'t match the listing.'], steps: ['Auto-activates at checkout', 'File within 30 days', 'Provide evidence', 'Resolution in 5 days'], tip: 'Covers quality, non-delivery, and not-as-described.' },
        { title: 'Seller protection', description: 'Fair protection for sellers.', body: ['Prevents fraudulent returns and chargebacks.'], steps: ['Claims reviewed neutrally', 'Seller evidence considered', 'False claims penalized', 'Compensation for fraud'], tip: 'Keep detailed shipping records.' },
    ] },
    { icon: Lock, title: 'Account & security', articles: [
        { title: 'Profile settings', description: 'Update your information.', body: ['Control personal info, preferences, and privacy.'], steps: ['Go to Settings > Profile', 'Update details', 'Set preferences', 'Configure privacy'], tip: 'Complete profiles get better support.' },
        { title: 'Two-factor authentication', description: 'Extra security layer.', body: ['Second verification step when logging in.'], steps: ['Go to Settings > Security', 'Enable 2FA', 'Choose method', 'Save backup codes'], tip: 'Authenticator apps are more secure than SMS.' },
        { title: 'Reporting fraud', description: 'Keep the marketplace safe.', body: ['Report unauthorized access or suspicious activity immediately.'], steps: ['Go to Security > Report', 'Select activity type', 'Provide details', 'Team investigates within hours'], tip: 'Change your password immediately if compromised.' },
    ] },
    { icon: Wrench, title: 'Business tools', articles: [
        { title: 'Bulk ordering', description: 'Wholesale pricing and quotes.', body: ['Request custom quotes and place large orders with flexible delivery.'], steps: ['Find a product', 'Click Request Quote', 'Specify quantity', 'Negotiate pricing', 'Confirm order'], tip: 'Orders over $10K get dedicated management.' },
        { title: 'API & integrations', description: 'Connect with your tools.', body: ['REST API for ERP, inventory, and e-commerce integration.'], steps: ['Apply for API access', 'Generate keys', 'Review documentation', 'Build and test', 'Go live'], tip: 'Start with sandbox for risk-free testing.' },
        { title: 'Custom invoicing', description: 'Professional documentation.', body: ['Branded invoices and digital contract management.'], steps: ['Set up company details', 'Generate from orders', 'Manage contracts digitally'], tip: 'Auto-generate for recurring orders.' },
    ] },
    { icon: Tag, title: 'Plans & pricing', articles: [
        { title: 'Plans overview', description: 'Free, Pro, and Enterprise.', body: ['Each plan includes different features, support levels, and commission rates.'], steps: ['Visit Plans page', 'Compare side by side', 'Select your plan', 'Start free trial'], tip: '14-day free trial on all paid plans.' },
        { title: 'Comparing plans', description: 'Detailed feature comparison.', body: ['Free: Basic access. Pro: Lower commissions, priority support. Enterprise: Custom everything.'], steps: ['Review usage', 'Identify needs', 'Calculate savings', 'Contact sales for Enterprise'], tip: 'Pro pays for itself at $5K/month in sales.' },
        { title: 'Changing your plan', description: 'Upgrade or downgrade anytime.', body: ['Changes take effect immediately with prorated billing.'], steps: ['Go to Plans & Billing', 'Select new plan', 'Review charges', 'Confirm'], tip: 'Downgrading retains all your data.' },
    ] },
];

const QUICK_SUGGESTIONS = [
    'I need help with an order',
    'I have a shipping question',
    'I want to return a product',
    'Something else',
];

/* ═══════════════════════════════════════════════
   CHAT VIEW
   ══════════════════════════════════════════════ */

function ChatView({ onBack, existingMessages, title }: { onBack: () => void; existingMessages?: ChatMessage[]; title?: string }) {
    const [messages, setMessages] = useState<ChatMessage[]>(existingMessages || [
        { id: 'bot-1', from: 'agent', text: 'Hi there! How can I help you today?', time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) },
    ]);
    const [input, setInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(!existingMessages);
    const [typing, setTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, typing]);

    const sendMessage = useCallback((text: string) => {
        if (!text.trim()) return;
        const userMsg: ChatMessage = { id: `u-${Date.now()}`, from: 'user', text, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setShowSuggestions(false);
        setTyping(true);

        const responses: Record<string, string> = {
            'I need help with an order': 'Sure! Could you share your order number? It starts with #VH-.',
            'I have a shipping question': 'Of course. Are you asking about timelines, rates, or tracking?',
            'I want to return a product': 'I can help. Share your order number and I\'ll check eligibility.',
            'Something else': 'Please describe what you need and I\'ll do my best to help.',
        };

        setTimeout(() => {
            setTyping(false);
            const reply = responses[text] || 'Thanks for reaching out. Could you provide a bit more detail?';
            setMessages(prev => [...prev, { id: `b-${Date.now()}`, from: 'agent', text: reply, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }]);
        }, 1200 + Math.random() * 800);
    }, []);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col" style={{ margin: '-48px', height: 'calc(100% + 96px)', minHeight: 600 }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', backgroundColor: 'rgba(255,255,255,0.8)' }}>
                <button onClick={onBack} className="w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer border-none" style={{ backgroundColor: B[50] }}>
                    <ArrowLeft size={15} strokeWidth={1.5} style={{ color: C.text }} />
                </button>
                <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(180deg, #0071e3, #34a0ff)' }}>
                    <span className="text-[10px] font-bold text-white">V</span>
                </div>
                <div>
                    <p className="text-[13px] font-semibold" style={{ color: C.text }}>{title || 'Vehsl Support'}</p>
                    <div className="flex items-center gap-1.5">
                        <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: '#34c759' }} />
                        <span className="text-[10px]" style={{ color: B[600] }}>Replies in ~2 min</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ backgroundColor: B[50] }}>
                <div className="flex justify-center mb-3">
                    <span className="text-[10px] px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(232,232,237,0.6)', color: B[600] }}>Today</span>
                </div>
                {messages.map(msg => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.from === 'user' ? 'justify-end' : 'items-start gap-2'}`}>
                        {msg.from === 'agent' && (
                            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(180deg, #0071e3, #34a0ff)' }}>
                                <span className="text-[8px] font-bold text-white">V</span>
                            </div>
                        )}
                        <div className="max-w-[75%]">
                            <div className="px-4 py-2.5 text-[13px]" style={{
                                backgroundColor: msg.from === 'user' ? '#0071e3' : 'white',
                                color: msg.from === 'user' ? 'white' : C.text,
                                borderRadius: msg.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                boxShadow: msg.from === 'user' ? '0 2px 10px rgba(0,113,227,0.18)' : '0 1px 6px rgba(0,0,0,0.03)',
                                lineHeight: '1.5',
                            }}>
                                {msg.text}
                            </div>
                            <p className={`text-[9.5px] mt-1 px-1.5 ${msg.from === 'user' ? 'text-right' : ''}`} style={{ color: '#c7c7cc' }}>{msg.time}</p>
                        </div>
                    </motion.div>
                ))}
                {typing && (
                    <div className="flex items-start gap-2">
                        <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(180deg, #0071e3, #34a0ff)' }}>
                            <span className="text-[8px] font-bold text-white">V</span>
                        </div>
                        <div className="px-4 py-3 rounded-[16px] bg-white" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.03)' }}>
                            <div className="flex gap-1">
                                {[0, 1, 2].map(i => (
                                    <motion.div key={i} className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: B[100] }}
                                        animate={{ y: [0, -3, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {showSuggestions && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-1.5 ml-8 mt-1">
                        {QUICK_SUGGESTIONS.map(s => (
                            <button key={s} onClick={() => sendMessage(s)}
                                className="px-3.5 py-2 rounded-full text-[11.5px] font-medium cursor-pointer transition-all duration-150"
                                style={{ backgroundColor: 'white', color: C.accent, border: '1px solid #e8e8ed', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                {s}
                            </button>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Input */}
            <div className="px-4 pt-2 pb-2" style={{ backgroundColor: 'rgba(245,245,247,0.8)', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                <div className="flex items-center gap-2 bg-white rounded-full px-3" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                    <button className="w-[30px] h-[30px] flex items-center justify-center rounded-full cursor-pointer border-none bg-transparent">
                        <Paperclip size={15} strokeWidth={1.5} style={{ color: B[600] }} />
                    </button>
                    <input value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                        placeholder="Message..." className="flex-1 py-2.5 text-[13px] outline-none bg-transparent border-none" style={{ color: C.text }} />
                    <button className="w-[30px] h-[30px] flex items-center justify-center rounded-full cursor-pointer border-none bg-transparent">
                        <Smile size={15} strokeWidth={1.5} style={{ color: B[600] }} />
                    </button>
                    <button onClick={() => sendMessage(input)}
                        className="w-[30px] h-[30px] flex items-center justify-center rounded-full cursor-pointer border-none transition-all duration-150"
                        style={{ backgroundColor: input.trim() ? '#0071e3' : '#e8e8ed' }}>
                        <Send size={13} strokeWidth={1.5} style={{ color: input.trim() ? 'white' : '#c7c7cc' }} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════
   TOPIC VIEW
   ═══════════════════════════════════════════════ */

function TopicView({ topic, onBack, onArticle }: { topic: Topic; onBack: () => void; onArticle: (a: Article) => void }) {
    const Icon = topic.icon;
    return (
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <button onClick={onBack} className="flex items-center gap-2 mb-10 cursor-pointer bg-transparent border-none p-0">
                <ArrowLeft size={15} strokeWidth={1.5} style={{ color: C.accent }} />
                <span className="text-[12.5px] font-medium" style={{ color: C.accent }}>Back</span>
            </button>

            <div className="flex items-center gap-3 mb-10">
                <Icon size={20} strokeWidth={1.5} style={{ color: B[700] }} />
                <h2 className="text-[20px] font-bold tracking-[-0.4px]" style={{ color: C.text }}>{topic.title}</h2>
            </div>

            <div className="space-y-1">
                {topic.articles.map((article, i) => (
                    <button key={article.title} onClick={() => onArticle(article)}
                        className="w-full flex items-center justify-between py-4 px-1 cursor-pointer bg-transparent border-none text-left group"
                        style={{ borderBottom: i < topic.articles.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-medium group-hover:underline" style={{ color: C.text }}>{article.title}</p>
                            <p className="text-[12px] mt-0.5" style={{ color: B[600] }}>{article.description}</p>
                        </div>
                        <ChevronRight size={13} strokeWidth={1.5} className="flex-shrink-0 ml-3 transition-transform duration-150 group-hover:translate-x-0.5" style={{ color: '#d1d1d6' }} />
                    </button>
                ))}
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════
   ARTICLE VIEW
   ═══════��═══════════════════════════════════════ */

function ArticleView({ article, topic, onBack, onArticle }: {
    article: Article; topic: Topic; onBack: () => void; onArticle: (a: Article) => void;
}) {
    const [helpful, setHelpful] = useState<'yes' | 'no' | null>(null);
    const related = topic.articles.filter(a => a.title !== article.title).slice(0, 2);

    return (
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <button onClick={onBack} className="flex items-center gap-2 mb-10 cursor-pointer bg-transparent border-none p-0">
                <ArrowLeft size={15} strokeWidth={1.5} style={{ color: C.accent }} />
                <span className="text-[12.5px] font-medium" style={{ color: C.accent }}>{topic.title}</span>
            </button>

            <h1 className="text-[20px] font-bold tracking-[-0.4px] mb-8" style={{ color: C.text }}>{article.title}</h1>

            {article.body?.map((p, i) => (
                <p key={i} className="text-[13.5px] mb-5" style={{ color: B[800], lineHeight: '1.7' }}>{p}</p>
            ))}

            {article.steps && (
                <div className="mt-8 mb-8">
                    {article.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 mb-3">
                            <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: i === 0 ? '#0071e3' : B[50] }}>
                                <span className="text-[10px] font-semibold" style={{ color: i === 0 ? 'white' : B[600] }}>{i + 1}</span>
                            </div>
                            <p className="text-[13px] pt-0.5" style={{ color: B[800] }}>{step}</p>
                        </div>
                    ))}
                </div>
            )}

            {article.tip && (
                <div className="rounded-[14px] px-4 py-3 mb-10" style={{ backgroundColor: 'rgba(0,113,227,0.04)' }}>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.3px] mb-1" style={{ color: C.accent }}>Tip</p>
                    <p className="text-[12.5px]" style={{ color: B[800] }}>{article.tip}</p>
                </div>
            )}

            {/* Helpful */}
            <div className="text-center py-6 mb-6" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                <p className="text-[13px] font-medium mb-3" style={{ color: C.text }}>Was this helpful?</p>
                <div className="flex items-center justify-center gap-2.5">
                    <button onClick={() => setHelpful('yes')}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] cursor-pointer border-none"
                        style={{ backgroundColor: helpful === 'yes' ? 'rgba(0,113,227,0.08)' : B[50], color: helpful === 'yes' ? C.accent : C.text }}>
                        <ThumbsUp size={13} strokeWidth={1.5} /> Yes
                    </button>
                    <button onClick={() => setHelpful('no')}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] cursor-pointer border-none"
                        style={{ backgroundColor: helpful === 'no' ? 'rgba(255,59,48,0.06)' : B[50], color: helpful === 'no' ? C.danger : C.text }}>
                        <ThumbsDown size={13} strokeWidth={1.5} /> No
                    </button>
                </div>
                {helpful && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11.5px] mt-2.5" style={{ color: B[600] }}>
                        {helpful === 'yes' ? 'Glad it helped.' : 'We\'ll work on improving this.'}
                    </motion.p>
                )}
            </div>

            {/* Related */}
            {related.length > 0 && (
                <div>
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.4px] mb-3" style={{ color: B[600] }}>Related</p>
                    {related.map(a => (
                        <button key={a.title} onClick={() => onArticle(a)}
                            className="w-full flex items-center justify-between py-3 cursor-pointer bg-transparent border-none text-left group"
                            style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                            <span className="text-[13px] font-medium group-hover:underline" style={{ color: C.text }}>{a.title}</span>
                            <ChevronRight size={12} strokeWidth={1.5} style={{ color: '#d1d1d6' }} />
                        </button>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════
   TOPICS BROWSE VIEW
   ═══════════════════════════════════════════════ */

function TopicsBrowseView({ onBack, onTopic, onArticle }: {
    onBack: () => void; onTopic: (i: number) => void; onArticle: (ti: number, a: Article) => void;
}) {
    return (
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <button onClick={onBack} className="flex items-center gap-2 mb-10 cursor-pointer bg-transparent border-none p-0">
                <ArrowLeft size={15} strokeWidth={1.5} style={{ color: C.accent }} />
                <span className="text-[12.5px] font-medium" style={{ color: C.accent }}>Back</span>
            </button>

            <h2 className="text-[20px] font-bold tracking-[-0.4px] mb-2" style={{ color: C.text }}>Help topics</h2>
            <p className="text-[13px] mb-10" style={{ color: B[600] }}>Browse by category</p>

            <div className="space-y-1">
                {TOPICS.map((topic, i) => {
                    const Icon = topic.icon;
                    return (
                        <button key={topic.title} onClick={() => onTopic(i)}
                            className="w-full flex items-center gap-3.5 py-4 cursor-pointer bg-transparent border-none text-left group"
                            style={{ borderBottom: i < TOPICS.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                            <div className="w-[32px] h-[32px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
                                <Icon size={16} strokeWidth={1.5} style={{ color: B[700] }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13.5px] font-medium" style={{ color: C.text }}>{topic.title}</p>
                                <p className="text-[11.5px]" style={{ color: B[600] }}>{topic.articles.length} articles</p>
                            </div>
                            <ChevronRight size={13} strokeWidth={1.5} className="flex-shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" style={{ color: '#d1d1d6' }} />
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════
   MAIN HELP TAB — Settings-first, minimal
   ═══════════════════════════════════════════════ */

type HelpView =
    | { type: 'settings' }
    | { type: 'chat'; conversationId?: string; title?: string }
    | { type: 'conversations' }
    | { type: 'topics' }
    | { type: 'topic'; topicIndex: number }
    | { type: 'article'; topicIndex: number; article: Article };

export function HelpTab({ openSupportChat }: { openSupportChat?: () => void | Promise<void> }) {
    const [view, setView] = useState<HelpView>({ type: 'settings' });
    const [showPhone, setShowPhone] = useState(false);

    /* Sub-views */
    if (view.type === 'chat') {
        const conv = view.conversationId ? CONVERSATIONS.find(c => c.id === view.conversationId) : undefined;
        return <ChatView onBack={() => setView(view.conversationId ? { type: 'conversations' } : { type: 'settings' })} existingMessages={conv?.messages} title={conv?.title || view.title} />;
    }

    if (view.type === 'conversations') {
        return (
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <button onClick={() => setView({ type: 'settings' })} className="flex items-center gap-2 mb-10 cursor-pointer bg-transparent border-none p-0">
                    <ArrowLeft size={15} strokeWidth={1.5} style={{ color: C.accent }} />
                    <span className="text-[12.5px] font-medium" style={{ color: C.accent }}>Back</span>
                </button>
                <h2 className="text-[20px] font-bold tracking-[-0.4px] mb-10" style={{ color: C.text }}>Open requests</h2>
                <div>
                    {CONVERSATIONS.map((conv, i) => (
                        <button key={conv.id} onClick={() => setView({ type: 'chat', conversationId: conv.id, title: conv.title })}
                            className="w-full text-left cursor-pointer border-none bg-transparent p-0 group"
                            style={{ borderBottom: i < CONVERSATIONS.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                            <div className="flex items-center justify-between py-5">
                                <div className="flex-1 min-w-0 pr-4">
                                    <p className="text-[13.5px] font-medium line-clamp-1" style={{ color: C.text }}>{conv.title}</p>
                                    <p className="text-[12px] mt-1.5" style={{ color: '#86868b' }}>
                                        {conv.status} · {conv.date}
                                    </p>
                                </div>
                                <ChevronRight size={14} strokeWidth={1.5} className="flex-shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" style={{ color: '#d1d1d6' }} />
                            </div>
                        </button>
                    ))}
                </div>
            </motion.div>
        );
    }

    if (view.type === 'topics') {
        return (
            <TopicsBrowseView
                onBack={() => setView({ type: 'settings' })}
                onTopic={(i) => setView({ type: 'topic', topicIndex: i })}
                onArticle={(ti, a) => setView({ type: 'article', topicIndex: ti, article: a })}
            />
        );
    }

    if (view.type === 'topic') {
        return (
            <TopicView
                topic={TOPICS[view.topicIndex]}
                onBack={() => setView({ type: 'topics' })}
                onArticle={(a) => setView({ type: 'article', topicIndex: view.topicIndex, article: a })}
            />
        );
    }

    if (view.type === 'article') {
        return (
            <ArticleView
                article={view.article}
                topic={TOPICS[view.topicIndex]}
                onBack={() => setView({ type: 'topic', topicIndex: view.topicIndex })}
                onArticle={(a) => setView({ type: 'article', topicIndex: view.topicIndex, article: a })}
            />
        );
    }

    /* ═══ SETTINGS VIEW ═══ */
    return (
        <div>
            {/* ── Contact ── */}
            <div className="flex items-center justify-center gap-3 mb-14">
                <motion.button
                    onClick={() => {
                        if (showPhone) {
                            toast('Phone number: +1 (800) 834-7571');
                        }
                        setShowPhone(!showPhone);
                    }}
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                    className="flex items-center justify-center gap-2 py-[10px] px-5 rounded-full text-[13px] font-semibold cursor-pointer border-none"
                    style={{ backgroundColor: '#0071e3', color: 'white' }}>
                    <Phone size={14} strokeWidth={1.5} />
                    <AnimatePresence mode="wait">
                        {showPhone ? (
                            <motion.span key="number" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }}>
                                +1 (800) 834-7571
                            </motion.span>
                        ) : (
                            <motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                                Call
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
                <button onClick={() => {
                    if (openSupportChat) { void openSupportChat(); return; }
                    try { window.location.href = '/messages'; } catch { }
                }}
                    className="flex items-center justify-center gap-2 py-[10px] px-5 rounded-full text-[13px] font-semibold cursor-pointer border-none"
                    style={{ backgroundColor: '#1d1d1f', color: 'white' }}>
                    <MessageSquare size={14} strokeWidth={1.5} />
                    Chat
                </button>
            </div>

            {/* ── Phone hours (revealed) ── */}
            <AnimatePresence>
                {showPhone && (
                    <motion.p
                        initial={{ opacity: 0, height: 0, marginTop: -14, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: -6, marginBottom: 14 }}
                        exit={{ opacity: 0, height: 0, marginTop: -14, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[11px] text-center overflow-hidden"
                        style={{ color: '#aeaeb2' }}>
                        Mon – Fri, 8 am – 8 pm EST
                    </motion.p>
                )}
            </AnimatePresence>

            {/* ── Open requests ── */}
            {CONVERSATIONS.length > 0 && (
                <div className="mb-14">
                    {CONVERSATIONS.map((conv, i) => (
                        <button key={conv.id} onClick={() => setView({ type: 'chat', conversationId: conv.id, title: conv.title })}
                            className="w-full text-left cursor-pointer border-none bg-transparent p-0 group"
                            style={{ borderBottom: i < CONVERSATIONS.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                            <div className="flex items-center justify-between py-4">
                                <div className="flex-1 min-w-0 pr-3">
                                    <p className="text-[13.5px] font-medium line-clamp-1" style={{ color: C.text }}>{conv.title}</p>
                                    <p className="text-[12px] mt-1" style={{ color: '#aeaeb2' }}>{conv.status} · {conv.date}</p>
                                </div>
                                <ChevronRight size={14} strokeWidth={1.5} className="flex-shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" style={{ color: '#d1d1d6' }} />
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* ── Help topics ── */}
            <div className="mb-14">
                {TOPICS.slice(0, 6).map((topic, i) => {
                    const Icon = topic.icon;
                    return (
                        <button key={topic.title} onClick={() => setView({ type: 'topic', topicIndex: i })}
                            className="w-full flex items-center justify-between cursor-pointer bg-transparent border-none p-0 text-left group"
                            style={{ borderBottom: i < 5 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                            <div className="flex items-center gap-3 py-4">
                                <Icon size={16} strokeWidth={1.5} style={{ color: '#86868b' }} />
                                <span className="text-[13.5px] font-medium" style={{ color: C.text }}>{topic.title}</span>
                            </div>
                            <ChevronRight size={14} strokeWidth={1.5} className="flex-shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" style={{ color: '#d1d1d6' }} />
                        </button>
                    );
                })}
                {TOPICS.length > 6 && (
                    <button onClick={() => setView({ type: 'topics' })}
                        className="w-full text-center py-4 cursor-pointer bg-transparent border-none">
                        <span className="text-[12.5px] font-medium" style={{ color: C.accent }}>View all topics</span>
                    </button>
                )}
            </div>

            {/* ── Legal ── */}
            <div className="mb-6">
                {[
                    { label: 'Terms of service', action: () => toast('Opening terms...') },
                    { label: 'Privacy policy', action: () => toast('Opening privacy policy...') },
                ].map((item, i) => (
                    <button key={item.label} onClick={item.action}
                        className="w-full flex items-center justify-between py-3.5 cursor-pointer bg-transparent border-none text-left"
                        style={{ borderBottom: i === 0 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                        <span className="text-[13px]" style={{ color: '#86868b' }}>{item.label}</span>
                        <ExternalLink size={13} strokeWidth={1.5} style={{ color: '#d1d1d6' }} />
                    </button>
                ))}
            </div>

            <p className="text-[11px] text-center" style={{ color: '#c7c7cc' }}>
                Vehsl v3.2.1
            </p>
        </div>
    );
}
