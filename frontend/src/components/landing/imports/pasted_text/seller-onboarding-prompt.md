Good catch. That removes an entire screen and makes Screen 2 cleaner. Here's the revised full prompt:

---

**FIGMA AI PROMPT — Seller Onboarding v2: Global, Caring, Frictionless**

---

**Design philosophy for this entire flow:**
This is not a form. It is a conversation between the platform and a human being who wants to grow their livelihood. Every screen should feel warm, encouraging, and respectful. The seller could be a farmer in rural India, a textile maker in Turkey, a food producer in Nigeria, or a home baker in Indonesia. They may never have registered on a digital platform before. They may be nervous. The design must make them feel: "this platform is on my side."

Visual style: soft white and warm off-white backgrounds (#FAFAF8), rounded organic shapes, gentle teal-green accent (#1D9E75), warm amber for encouragement (#F59E0B), soft red only for genuine errors (#E24B4A). No hard edges, no corporate coldness. Simple, diverse, human illustrations throughout. Font: Inter. All screens 390×844px. Every screen has a persistent soft teal progress bar at top. Every screen has a persistent "Need help?" floating button at bottom-right (chat bubble icon, 44×44px, soft teal fill, white icon). Language is already set from the landing page — never ask for it again.

---

**SCREEN 1 — Welcome: You Belong Here**

Full warm off-white screen. Top center: a friendly illustration of diverse hands holding different products — a vegetable, a fabric swatch, a small box, a jar — simple, colorful, joyful.

Heading below illustration in 22px/500, centered: "Let's set up your seller profile."

Body text 15px gray (#5F5E5A), centered, 2 lines max: "We'll guide you through every step. Takes about 10–15 minutes and you can pause anytime."

Three soft reassurance pills in a horizontal row, each a rounded chip with light gray fill and 12px text: "We explain everything" · "Save & resume anytime" · "Works anywhere in the world"

Primary CTA full-width at bottom: "Let's start →" teal, 52px tall, 12px radius. Below button in 12px gray: "Already started? Tap here to resume."

---

**SCREEN 2 — Your Country (Context Setting, One Field)**

Progress bar 8%.

No form heading. Just a warm conversational question in 20px/500: "Where are you based?"

Single explanation line below in 14px gray: "This helps us show the right documents and terms for your country. Nothing else changes."

One large search field — 56px tall, soft border, flag emoji auto-appears on selection, placeholder text: "Search your country…" Covers 190+ countries. On selection the platform silently adapts all future document labels, currency symbols, date formats, and example values to match that country. The user never notices this happening — it just feels right.

Below the field, a single soft amber tip card appears after country is selected, e.g.: "In Nigeria, your CAC number works as your business ID." or "In India, we'll use your GSTIN." or "In Germany, your Steuernummer is what we need." — always in plain language, never jargon. If the country has no common business ID (e.g. informal economies), the tip reads: "In [Country], you can register without a business ID. We'll guide you."

CTA: "This is my country →" — activates only after selection.

Ghost link below: "I sell from multiple countries" in teal — opens a small explainer bottom sheet.

---

**SCREEN 3 — Identity Already Confirmed**

Progress bar 14%.

Top: a gentle celebratory illustration — a small person with a soft checkmark halo above them. Warm, not corporate.

Heading 20px/500: "Good news — we already know you." Subheading 14px gray: "Because you shop with us, your identity is already verified. You don't have to do it again."

A warm card below with light teal fill (#E1F5EE) and soft teal border. Shows their name in 16px/500 and a green "Identity verified ✓" badge. One line below: "Verified on [date]."

Below card, a human reassurance note in 13px gray italic: "Your personal details stay private. Buyers will never see your personal information — only your business name."

Primary CTA: "Yes, that's me — let's go →"

Ghost link below in small gray: "Something looks wrong — get help"

---

**SCREEN 4 — What Do You Sell?**

Progress bar 22%.

Heading: "What kinds of things do you want to sell?" — natural language, not "Select product categories."

Subtext 13px gray: "Pick everything that applies. You can always change this later."

A 2×4 grid of large illustrated category cards, each 160×90px, warm pastel background per category, simple centered illustration, label in the user's selected language:

- Fresh food & vegetables (green pastel)
- Packaged & processed food (yellow pastel)
- Clothing & textiles (pink pastel)
- Electronics & gadgets (blue pastel)
- Home & household goods (orange pastel)
- Health & wellness (mint pastel)
- Farm & agri products (earthy pastel)
- Something else (soft gray)

Tapping a card: soft spring animation, card fills teal, label turns white, checkmark appears top-right. Multi-select. If "Something else" tapped: a smooth text field expands below — "Describe what you sell in your own words…" in 14px, warm placeholder.

Below the grid: a small warm amber note — "Not sure which to pick? Just choose the closest one. Our team will help you refine it."

CTA: "These are my products →" — disabled until at least 1 selected.

---

**SCREEN 5 — How Do You Run Your Business?**

Progress bar 30%.

Heading: "How do you run your business?" Subtext: "There's no right or wrong answer here. Just pick what feels closest to you."

Four large choice cards, stacked vertically, each 80px:

Card 1 — small person illustration: "Just me" · "I sell on my own"
Card 2 — two people illustration: "Me and a partner or family" · "We run it together"
Card 3 — small building illustration: "A registered company" · "My business is officially registered"
Card 4 — question mark illustration: "I'm not sure yet" · "Help me figure this out"

Selected card: teal left-border 3px + very light teal background fill. Unselected: white with soft gray border.

If "I'm not sure yet" is tapped: a gentle accordion expands below — "Do you have any business registration document, even just one?" → Yes / No. Yes routes to Screen 6. No routes to a simplified path that skips all business ID fields and flags for manual review later.

Soft amber tip card below all choices: "Whatever you choose, we'll guide you through the documents step by step. You won't be left to figure it out alone."

CTA: "This is how I work →"

---

**SCREEN 6 — Business Identity (Adaptive by Country)**

Progress bar 38%.

Heading: "Let's identify your business." No jargon. No asterisks. No legal language.

Top: a soft amber tip card that changes dynamically by the country selected in Screen 2. Examples:
- India: "Your GSTIN is a 15-digit number on any tax invoice or your GST certificate. If you don't have one, tap below."
- Nigeria: "Your CAC Registration Number is on your certificate from the Corporate Affairs Commission."
- Germany: "Your Steuernummer is on any letter from your Finanzamt (tax office)."
- Informal / no-ID country: "In [Country], you can proceed without a business ID. We'll verify you another way."

The tip always includes: where to find the document, what it looks like, and what to do if they don't have it.

One large primary input field — labeled "Business ID / Tax Number" in plain English + local language equivalent below it. Placeholder shows a locally formatted example (masked). 

On entry — three visual states, all non-alarming:
- Checking: small spinner inside field right side + "Checking…" in gray
- Found: field border turns teal, a green card slides in below showing business name, registered address, active status. Heading on card: "Is this your business?" Yes / No that's not me
- Not found: field border stays neutral (not red), message below in gray: "We couldn't find that automatically. No problem — you can upload a photo of your document instead." Upload button appears.

Below primary field: "I don't have a business ID number" — a clearly visible teal text link, not hidden, not shamed. Tapping routes to a document upload path.

CTA: "Yes, this is my business →" (activates after successful fetch or document upload)

---

**SCREEN 7 — Business Location & Pickup Address**

Progress bar 46%.

Heading: "Where should we pick up from?" Subtext: "This is the address our driver will come to collect your products."

If GSTIN / business ID was verified on Screen 6: the registered address auto-populates in a soft teal pre-filled card with a small note: "From your business registration." Below it: a toggle — "Pickup address is the same ●○" — default ON.

If toggled OFF or no business ID: a simple address form appears — Address line 1 · Address line 2 (optional, labeled "Apartment, floor, landmark — optional") · City · Postal code (auto-fills region/state) · Country (pre-filled from Screen 2).

Below the form: a small embedded map thumbnail with a draggable pin. Label above map: "Drag the pin to your exact location so our driver doesn't get lost." A friendly small note below map: "Many addresses don't match perfectly on maps. The pin helps us find you."

Below map: "Best days for pickup" — a row of 7 day chips (Mon–Sun), tap to toggle, teal when selected. Below: "Preferred time" — three large chips: Morning (9am–12pm) · Afternoon (12pm–5pm) · Evening (5pm–8pm).

Soft amber note at bottom: "Can't always be available? Just pick your most common days. You can change this anytime."

CTA: "Save this location →"

---

**SCREEN 8 — Premises Proof (Gentle, Options-Based)**

Progress bar 52%.

Heading: "Can you show us a document for this address?" Subtext in warm gray: "This helps us confirm we're picking up from the right place."

Not a hard requirement screen. Three clearly equal options shown as three stacked choice cards, each 80px:

Card 1 — document icon: "Upload a document" · "Rent agreement, utility bill, or lease — any recent one works"
Card 2 — camera icon: "Our driver will verify it" · "When we come for your first sample pickup, our driver can note it down. Nothing to upload now."
Card 3 — photo icon: "Take a photo of your premises" · "A quick photo of your entrance or storefront works too"

All three shown as equals — no "recommended" label, no pressure. Whatever works for the seller.

If Card 1 selected: a dashed upload box expands — "Upload any one document. A photo from your phone is fine." Accepted formats shown as soft gray chips: "📄 PDF · 📷 Photo · 🖼 Image" 

Soft amber reassurance note below: "This document is only seen by our verification team. It's never shared with buyers."

CTA: "Continue →" — active for all three choices including driver-verify.

---

**SCREEN 9 — Bank Account for Payouts**

Progress bar 60%.

Heading: "Where should we send your earnings?" Subtext: "We'll transfer your payments here after each order."

A warm friendly note card at top — soft teal fill: "We pay out every [X] days. Your first payout will arrive after your first completed order."

Two fields: Account / IBAN number (show/hide toggle for security) + Bank code (IFSC / SWIFT / Sort code — label adapts by country). On bank code entry: bank name and branch auto-resolve and appear in 12px gray below the field — "HDFC Bank, Andheri West Branch" or equivalent.

Verification status row below the fields — three states:
- Waiting: gray circle + "Enter details above to verify"
- Verifying: animated teal spinner + "Sending a test transfer of [local micro-amount]…"
- Verified: green check + "Transfer received! Account verified." Small celebration micro-animation (confetti burst, 0.5s).

Below verification row: a dashed upload area — "Upload a bank document (optional)" · "Not needed if the test transfer above works." Label soft, not demanding.

Warm amber note below: "Don't have a bank account? You can add one later before your first payout. Tap 'Skip for now.'"

"Skip for now →" ghost link, clearly visible below CTA.

Primary CTA: "Continue →"

---

**SCREEN 10 — Add Your First Product**

Progress bar 70%.

Heading: "Show us what you sell." Subtext in warm gray: "Just the basics for now — we'll help you improve the listing later."

Three fields only — clean, generous spacing:

Field 1: Product name — large text input, 52px, placeholder: "e.g. Fresh mangoes, Handwoven scarf, Ceramic mugs…" — real examples in their category.

Field 2: Photos — three soft dashed squares in a row (120×120px each), tap to open camera or gallery. First square has a camera icon and label "Add photo." Min 1 required, shown gently with a soft note below: "Even one clear photo on a plain background works great." No red asterisks. No hard warnings.

Field 3: Price — number input with local currency symbol pre-filled from country selection. Unit type selector inline as a small pill: "per piece ▾" — tapping opens a bottom sheet: per piece · per kg · per litre · per box · per dozen · other.

Below all fields, a soft teal info card: "Not sure about pricing? Just enter what you'd normally sell it for. You can update it anytime before going live."

CTA: "Save this product →"

Ghost link below: "I'll add products later →" — allowed, routes to Screen 11 directly.

---

**SCREEN 11 — QA Sample Pickup Scheduler**

Progress bar 80%.

Heading: "When can we collect a small sample?" Subtext: "Our quality team tests your product before it goes live. We come to you — no need to send anything."

A simple warm explanation card in soft teal fill, 3 short lines: "We collect 5–10 units · Test quality in our lab · Let you know the result in 24–72 hours"

Below: a horizontally scrollable date strip showing next 7 working days. Each date chip: day name (Mon) above, date (24) large, month small below. Selected: teal fill, white text, soft scale-up. Unavailable dates: gray, strikethrough.

Below date strip: time slot selector — three cards side by side: Morning · Afternoon · Evening. Selected: teal fill.

A warm "What to keep ready" checklist card below — soft amber fill, 3 items with soft checkboxes (pre-checked, decorative): "5–10 units of your product · Original packaging if you have it · You or someone you trust at the address"

Small reassurance note at bottom in 12px gray italic: "If the time doesn't work out, our driver will call you to reschedule. No stress."

CTA: "Confirm pickup →"

---

**SCREEN 12 — Agreement in Plain Language**

Progress bar 90%.

Heading: "Before we begin — a quick agreement." Subtext: "We've written this in plain language. No legal jargon, we promise."

A scrollable card (max 320px visible, soft scroll indicator at bottom) with 5 sections, each with a warm icon and 2 plain-language lines:

🚚 "We do the delivery" — "We pick up from you and deliver to the buyer. You don't need to arrange shipping."
💰 "You get paid per order" — "We deduct a small commission and transfer the rest to your bank account within [X] days."
✅ "Products need to pass quality" — "Your sample goes through a quality check before going live. We'll let you know the result."
🔄 "You can pause or leave anytime" — "If you ever want to stop selling, just let us know 7 days in advance. No penalty."
🔒 "Your data stays safe" — "We never sell your personal or business information to anyone."

Below the card: a single checkbox — a large 24px tappable checkbox with label: "I've read and agree to the above." Checking it triggers a warm microinteraction (checkbox fills teal with a soft spring bounce).

After checkbox: an OTP sign section slides in smoothly. Pre-filled mobile number shown, "Send OTP →" ghost button. 6-digit OTP input appears. Below OTP field: "This is a legally valid digital signature in [Country]."

CTA: "Sign & complete →" — activates only after OTP entered.

---

**SCREEN 13 — You're In! Confirmation & What Happens Next**

Progress bar 100%, fills with a soft teal animation.

Top center: a large warm illustration — a person at a door handing a box to a smiling delivery person. Celebratory but calm. Below illustration: heading in 22px/500: "You're registered as a seller!" Subheading in 14px teal: "Welcome to the [Platform] family."

A vertical timeline below, 4 steps, each row has a circle indicator on the left and label + friendly subtext on the right:

Step 1 — teal filled circle + checkmark: "Registration done" · "You're all set up"
Step 2 — teal outline, pulsing gently (active): "Sample pickup" · "[Day, Date] between [Time window]" · A small "Add to calendar →" teal link below
Step 3 — gray empty circle: "Quality check" · "We'll notify you within 24–72 hours"
Step 4 — gray empty circle: "Your products go live" · "Buyers can start finding and ordering from you"

Below timeline: a soft teal card — "Complete your seller profile to earn the Verified Seller badge. Verified sellers get 3× more orders." A ghost white "Complete profile →" button inside the card.

At the very bottom: "Go to my seller dashboard →" full-width primary CTA.

---

**SCREEN 14 — Seller Dashboard (Pending / Deferred State)**

This is the home screen of the seller dashboard before their first product goes live.

Top: a warm amber status banner — "Your sample pickup is on [Date]. We'll notify you the moment results are ready." Not a warning — a reassurance.

Below banner: a "Complete your profile" progress card. A horizontal progress bar in teal showing e.g. 60%. Below the bar: a simple grouped checklist.

Group label "Needed before your first order" in 12px gray uppercase: each item a row with status pill on left, label in center, action on right:
- FSSAI Licence · [Upload →] (for food sellers)
- Trade Licence · [Upload →]

Group label "Adds trust, brings more orders" in 12px gray uppercase:
- Storage photos · [Add →]
- Quality certification · [Add →]
- Business insurance · [Add →]

Each row: 52px tall, soft bottom border, status pill states — "To do" (gray) · "Under review" (amber) · "Verified ✓" (green).

Below the checklist card: the rest of the dashboard in a soft locked state — Orders section shows "Your first order will appear here once your product goes live" with a gentle illustration of an empty inbox. Earnings section shows "₹0" with a soft note: "Your first payout will arrive 2 days after your first delivered order."

Bottom navigation bar: Home · Products · Orders · Earnings · Profile.

---

**Global design tokens for all screens:**

CTA buttons: full-width, 52px tall, 12px border-radius, teal fill (#1D9E75), white Inter 15px/500, 0 shadow.
Ghost buttons: same size, white fill, 1px teal border, teal text.
Input fields: 52px tall, 8px radius, 0.5px border #D3D1C7, 14px placeholder (#B4B2A9), focus border teal 1.5px.
Pre-filled fields: light teal background (#E1F5EE), small lock or checkmark icon right-aligned inside field.
Auto-verified fields: green checkmark badge inline right side of field.
Amber tip cards: #FAEEDA fill, 0px border, 10px radius, 13px Inter, #633806 text, left border 3px #F59E0B, border-radius 0 on left side.
Teal info cards: #E1F5EE fill, teal left border 3px, same treatment as amber but teal.
Error states: never red borders alone — always pair with a warm inline message starting with "No worries —" or "That's okay —".
Body text: Inter 14px, #3D3D3A. Secondary: 12px, #888780. Headings: 20–22px, #2C2C2A, weight 500.
Bottom safe area padding: 34px all screens.
"Need help?" FAB: 44×44px circle, teal fill, white chat icon, bottom-right 20px margin, always on top.
Floating save indicator: appears at top after any field is filled — "Progress saved ✓" in 11px gray, fades after 2 seconds.
All error and warning messages start with empathetic openers: "No worries," · "That's okay," · "Not sure? Here's how to find it." Never: "Invalid," "Error," "Required field missing."
Use Auto Layout on all components. Every screen should feel like it has room to breathe — generous padding (24px horizontal, 20px between sections). Nothing cramped.

---

This prompt is ready to paste directly into Figma AI. After generation, swap in your real brand name, final copy in each target language, and your actual illustration assets.