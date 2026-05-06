// @ts-nocheck -- legacy port; tighten incrementally
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, Shield, FileText, DollarSign,
  ChevronDown, Download, CheckCircle2, AlertTriangle,
  Clock, Hash, Phone, Mail, Edit3,
  Sparkles, RefreshCw, MessageSquare, Save, X,
  Package, ArrowUpRight, ArrowDownRight,
  Truck, Activity, Globe, Users, Check, Ship,
  Star, MapPin, Plus, UserPlus, ChevronRight, ChevronLeft, Search,
  Upload, Trash2, CalendarDays, Timer, Link2, ExternalLink
} from "lucide-react";
import { StatusPill } from "./StatusPill";

/* ════════════════════════════════════════════════════════════
 *  TRADE COMPLIANCE CENTER — PLATONIC
 *
 *  One sentence. One answer.
 *
 *  "Ship [Bluetooth Headphones] from [India] to [USA]"
 *
 *  → $67.42 total landed cost
 *  → Here's what you need, who to call, and what changed.
 *
 *  That's it.
 * ════════════════════════════════════════════════════════════ */

// ─── DATA ───────────────────────────────────────────────────

interface OriginRegion {
  country: string;
  states: { name: string; cities: string[] }[];
}

interface Product {
  id: string;
  name: string;
  hsCode: string;
  category: string;
  basePrice: number;
  origins: string[];
  regions?: OriginRegion[];
}

const products: Product[] = [
  { id: "P001", name: "Wireless Bluetooth Headphones", hsCode: "8518.30.20", category: "Electronics", basePrice: 45.00, origins: ["India", "China", "Vietnam"] },
  { id: "P002", name: "Organic Green Tea (Loose Leaf)", hsCode: "0902.20.00", category: "Food & Beverage", basePrice: 18.50, origins: ["India", "Sri Lanka", "Kenya"] },
  { id: "P003", name: "LED Panel Light (Commercial)", hsCode: "9405.40.80", category: "Lighting", basePrice: 125.00, origins: ["India", "China", "Taiwan"] },
  { id: "P004", name: "Natural Herbal Supplement", hsCode: "2106.90.92", category: "Health", basePrice: 22.00, origins: ["India", "Nepal", "Thailand"] },
  { id: "P005", name: "Organic Cotton T-Shirts (×3)", hsCode: "6109.10.00", category: "Textiles", basePrice: 35.00, origins: ["India", "Bangladesh", "Egypt"] },
];

const destinations = [
  { name: "United States", code: "USA", flag: String.fromCodePoint(0x1F1FA, 0x1F1F8) },
  { name: "European Union", code: "EU", flag: String.fromCodePoint(0x1F1EA, 0x1F1FA) },
  { name: "United Kingdom", code: "UK", flag: String.fromCodePoint(0x1F1EC, 0x1F1E7) },
  { name: "Japan", code: "JP", flag: String.fromCodePoint(0x1F1EF, 0x1F1F5) },
  { name: "Canada", code: "CA", flag: String.fromCodePoint(0x1F1E8, 0x1F1E6) },
  { name: "Australia", code: "AU", flag: String.fromCodePoint(0x1F1E6, 0x1F1FA) },
  { name: "Germany", code: "DE", flag: String.fromCodePoint(0x1F1E9, 0x1F1EA) },
];

// Helper: ISO 2-letter code → flag emoji
const isoFlag = (iso: string) => String.fromCodePoint(...[...iso.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));

// Helper: country name → ISO 2-letter code (lowercase) for flagcdn.com
const countryToIso: Record<string, string> = {
  "India": "in", "China": "cn", "Vietnam": "vn", "Sri Lanka": "lk", "Kenya": "ke",
  "Taiwan": "tw", "Nepal": "np", "Thailand": "th", "Bangladesh": "bd", "Egypt": "eg",
  "United States": "us", "European Union": "eu", "United Kingdom": "gb", "Japan": "jp",
  "Canada": "ca", "Australia": "au", "Germany": "de", "France": "fr", "Brazil": "br",
  "Mexico": "mx", "South Korea": "kr", "Singapore": "sg", "Indonesia": "id",
  "Malaysia": "my", "Philippines": "ph", "South Africa": "za", "Nigeria": "ng",
  "Turkey": "tr", "Russia": "ru", "Saudi Arabia": "sa", "United Arab Emirates": "ae",
  "Pakistan": "pk", "Italy": "it", "Spain": "es", "Netherlands": "nl", "Sweden": "se",
  "Switzerland": "ch", "Poland": "pl", "Belgium": "be", "Austria": "at", "Norway": "no",
  "Denmark": "dk", "Finland": "fi", "Ireland": "ie", "New Zealand": "nz", "Israel": "il",
  "Portugal": "pt", "Greece": "gr", "Czech Republic": "cz", "Romania": "ro", "Hungary": "hu",
  "Chile": "cl", "Colombia": "co", "Argentina": "ar", "Peru": "pe",
};

// Helper: destination code → ISO 2-letter code (lowercase)
const destCodeToIso: Record<string, string> = {
  "USA": "us", "EU": "eu", "UK": "gb", "JP": "jp", "CA": "ca", "AU": "au", "DE": "de",
};

// Helper: get flag image URL from country name
const getFlagUrl = (country: string, size: number = 20) => {
  const iso = countryToIso[country];
  if (!iso) return null;
  return `https://flagcdn.com/w${size}/${iso}.png`;
};

// Helper: get flag image URL from dest code
const getDestFlagUrl = (code: string, size: number = 20) => {
  const iso = destCodeToIso[code];
  if (!iso) return null;
  return `https://flagcdn.com/w${size}/${iso}.png`;
};

const originFlags: Record<string, string> = {
  "Afghanistan": isoFlag("AF"), "Albania": isoFlag("AL"), "Algeria": isoFlag("DZ"), "Andorra": isoFlag("AD"),
  "Angola": isoFlag("AO"), "Antigua and Barbuda": isoFlag("AG"), "Argentina": isoFlag("AR"), "Armenia": isoFlag("AM"),
  "Australia": isoFlag("AU"), "Austria": isoFlag("AT"), "Azerbaijan": isoFlag("AZ"), "Bahamas": isoFlag("BS"),
  "Bahrain": isoFlag("BH"), "Bangladesh": isoFlag("BD"), "Barbados": isoFlag("BB"), "Belarus": isoFlag("BY"),
  "Belgium": isoFlag("BE"), "Belize": isoFlag("BZ"), "Benin": isoFlag("BJ"), "Bhutan": isoFlag("BT"),
  "Bolivia": isoFlag("BO"), "Bosnia and Herzegovina": isoFlag("BA"), "Botswana": isoFlag("BW"), "Brazil": isoFlag("BR"),
  "Brunei": isoFlag("BN"), "Bulgaria": isoFlag("BG"), "Burkina Faso": isoFlag("BF"), "Burundi": isoFlag("BI"),
  "Cabo Verde": isoFlag("CV"), "Cambodia": isoFlag("KH"), "Cameroon": isoFlag("CM"), "Canada": isoFlag("CA"),
  "Central African Republic": isoFlag("CF"), "Chad": isoFlag("TD"), "Chile": isoFlag("CL"), "China": isoFlag("CN"),
  "Colombia": isoFlag("CO"), "Comoros": isoFlag("KM"), "Congo": isoFlag("CG"), "DR Congo": isoFlag("CD"),
  "Costa Rica": isoFlag("CR"), "Croatia": isoFlag("HR"), "Cuba": isoFlag("CU"), "Cyprus": isoFlag("CY"),
  "Czech Republic": isoFlag("CZ"), "Denmark": isoFlag("DK"), "Djibouti": isoFlag("DJ"), "Dominica": isoFlag("DM"),
  "Dominican Republic": isoFlag("DO"), "Ecuador": isoFlag("EC"), "Egypt": isoFlag("EG"), "El Salvador": isoFlag("SV"),
  "Equatorial Guinea": isoFlag("GQ"), "Eritrea": isoFlag("ER"), "Estonia": isoFlag("EE"), "Eswatini": isoFlag("SZ"),
  "Ethiopia": isoFlag("ET"), "Fiji": isoFlag("FJ"), "Finland": isoFlag("FI"), "France": isoFlag("FR"),
  "Gabon": isoFlag("GA"), "Gambia": isoFlag("GM"), "Georgia": isoFlag("GE"), "Germany": isoFlag("DE"),
  "Ghana": isoFlag("GH"), "Greece": isoFlag("GR"), "Grenada": isoFlag("GD"), "Guatemala": isoFlag("GT"),
  "Guinea": isoFlag("GN"), "Guinea-Bissau": isoFlag("GW"), "Guyana": isoFlag("GY"), "Haiti": isoFlag("HT"),
  "Honduras": isoFlag("HN"), "Hungary": isoFlag("HU"), "Iceland": isoFlag("IS"), "India": isoFlag("IN"),
  "Indonesia": isoFlag("ID"), "Iran": isoFlag("IR"), "Iraq": isoFlag("IQ"), "Ireland": isoFlag("IE"),
  "Israel": isoFlag("IL"), "Italy": isoFlag("IT"), "Ivory Coast": isoFlag("CI"), "Jamaica": isoFlag("JM"),
  "Japan": isoFlag("JP"), "Jordan": isoFlag("JO"), "Kazakhstan": isoFlag("KZ"), "Kenya": isoFlag("KE"),
  "Kiribati": isoFlag("KI"), "Kosovo": isoFlag("XK"), "Kuwait": isoFlag("KW"), "Kyrgyzstan": isoFlag("KG"),
  "Laos": isoFlag("LA"), "Latvia": isoFlag("LV"), "Lebanon": isoFlag("LB"), "Lesotho": isoFlag("LS"),
  "Liberia": isoFlag("LR"), "Libya": isoFlag("LY"), "Liechtenstein": isoFlag("LI"), "Lithuania": isoFlag("LT"),
  "Luxembourg": isoFlag("LU"), "Madagascar": isoFlag("MG"), "Malawi": isoFlag("MW"), "Malaysia": isoFlag("MY"),
  "Maldives": isoFlag("MV"), "Mali": isoFlag("ML"), "Malta": isoFlag("MT"), "Marshall Islands": isoFlag("MH"),
  "Mauritania": isoFlag("MR"), "Mauritius": isoFlag("MU"), "Mexico": isoFlag("MX"), "Micronesia": isoFlag("FM"),
  "Moldova": isoFlag("MD"), "Monaco": isoFlag("MC"), "Mongolia": isoFlag("MN"), "Montenegro": isoFlag("ME"),
  "Morocco": isoFlag("MA"), "Mozambique": isoFlag("MZ"), "Myanmar": isoFlag("MM"), "Namibia": isoFlag("NA"),
  "Nauru": isoFlag("NR"), "Nepal": isoFlag("NP"), "Netherlands": isoFlag("NL"), "New Zealand": isoFlag("NZ"),
  "Nicaragua": isoFlag("NI"), "Niger": isoFlag("NE"), "Nigeria": isoFlag("NG"), "North Korea": isoFlag("KP"),
  "North Macedonia": isoFlag("MK"), "Norway": isoFlag("NO"), "Oman": isoFlag("OM"), "Pakistan": isoFlag("PK"),
  "Palau": isoFlag("PW"), "Palestine": isoFlag("PS"), "Panama": isoFlag("PA"), "Papua New Guinea": isoFlag("PG"),
  "Paraguay": isoFlag("PY"), "Peru": isoFlag("PE"), "Philippines": isoFlag("PH"), "Poland": isoFlag("PL"),
  "Portugal": isoFlag("PT"), "Qatar": isoFlag("QA"), "Romania": isoFlag("RO"), "Russia": isoFlag("RU"),
  "Rwanda": isoFlag("RW"), "Saint Kitts and Nevis": isoFlag("KN"), "Saint Lucia": isoFlag("LC"),
  "Saint Vincent and the Grenadines": isoFlag("VC"), "Samoa": isoFlag("WS"), "San Marino": isoFlag("SM"),
  "Sao Tome and Principe": isoFlag("ST"), "Saudi Arabia": isoFlag("SA"), "Senegal": isoFlag("SN"),
  "Serbia": isoFlag("RS"), "Seychelles": isoFlag("SC"), "Sierra Leone": isoFlag("SL"), "Singapore": isoFlag("SG"),
  "Slovakia": isoFlag("SK"), "Slovenia": isoFlag("SI"), "Solomon Islands": isoFlag("SB"), "Somalia": isoFlag("SO"),
  "South Africa": isoFlag("ZA"), "South Korea": isoFlag("KR"), "South Sudan": isoFlag("SS"), "Spain": isoFlag("ES"),
  "Sri Lanka": isoFlag("LK"), "Sudan": isoFlag("SD"), "Suriname": isoFlag("SR"), "Sweden": isoFlag("SE"),
  "Switzerland": isoFlag("CH"), "Syria": isoFlag("SY"), "Taiwan": isoFlag("TW"), "Tajikistan": isoFlag("TJ"),
  "Tanzania": isoFlag("TZ"), "Thailand": isoFlag("TH"), "Timor-Leste": isoFlag("TL"), "Togo": isoFlag("TG"),
  "Tonga": isoFlag("TO"), "Trinidad and Tobago": isoFlag("TT"), "Tunisia": isoFlag("TN"), "Turkey": isoFlag("TR"),
  "Turkmenistan": isoFlag("TM"), "Tuvalu": isoFlag("TV"), "Uganda": isoFlag("UG"), "Ukraine": isoFlag("UA"),
  "United Arab Emirates": isoFlag("AE"), "United Kingdom": isoFlag("GB"), "United States": isoFlag("US"),
  "Uruguay": isoFlag("UY"), "Uzbekistan": isoFlag("UZ"), "Vanuatu": isoFlag("VU"), "Vatican City": isoFlag("VA"),
  "Venezuela": isoFlag("VE"), "Vietnam": isoFlag("VN"), "Yemen": isoFlag("YE"), "Zambia": isoFlag("ZM"),
  "Zimbabwe": isoFlag("ZW"), "Hong Kong": isoFlag("HK"), "Macau": isoFlag("MO"), "Puerto Rico": isoFlag("PR"),
};

interface AIAlert {
  id: string;
  type: "critical" | "warning" | "info" | "update";
  title: string;
  description: string;
  country: string;
  time: string;
  isNew: boolean;
}

// Cost calculation
function calcCosts(base: number, destCode: string) {
  const tariffs: Record<string, number> = {
    "USA": 0.037, "EU": 0.042, "UK": 0.040, "JP": 0.048,
    "CA": 0.035, "AU": 0.050, "DE": 0.042,
  };
  const tariff = tariffs[destCode] || 0.05;

  const exportCost = +(base * 0.035 + base * 0.04 + 0.45 + base * 0.055).toFixed(2); // QC + cert + docs + packaging
  const duty = +(base * tariff).toFixed(2);
  const freight = +(base * 0.18).toFixed(2);
  const clearance = 1.15;
  const importCost = +(duty + freight + clearance).toFixed(2);
  const total = +(base + exportCost + importCost).toFixed(2);

  return {
    exportCost, importCost, duty, freight, clearance, total, tariff,
    tariffLabel: `${(tariff * 100).toFixed(1)}%`,
    markup: +(((total - base) / base) * 100).toFixed(1),
  };
}

// Compliance items
interface ComplianceItem {
  rule: string;
  status: "done" | "pending" | "overdue";
  due: string;
  side: "export" | "import";
  docs: { name: string; size: string }[];
  description: string;
  estimatedTime?: string;
  estimatedCost?: string;
  legislations?: { name: string; url: string }[];
  completionDocs?: { name: string; size: string }[];
  completedAt?: string;
  completionNote?: string;
}

function getCompliance(category: string, destCode: string): ComplianceItem[] {
  const items: ComplianceItem[] = [];

  if (category === "Electronics") {
    items.push({ rule: "CE / FCC Certification", status: destCode === "EU" || destCode === "DE" ? "pending" : "done", due: "Apr 15", side: "import", description: "Product must meet electromagnetic compatibility and safety standards for the destination market.", docs: [{ name: "CE Declaration of Conformity", size: "240 KB" }, { name: "FCC Grant of Equipment", size: "180 KB" }, { name: "Test Report EN 55032", size: "1.2 MB" }], estimatedTime: "10–15 business days", estimatedCost: "$1,200 – $3,500", legislations: [{ name: "EU Directive 2014/30/EU (EMC)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32014L0030" }, { name: "FCC Part 15", url: "https://www.ecfr.gov/current/title-47/chapter-I/subchapter-A/part-15" }] });
    items.push({ rule: "RoHS Compliance", status: "done", due: "Feb 28", side: "import", description: "Restriction of hazardous substances — lead, mercury, cadmium, and other materials must be below threshold.", docs: [{ name: "RoHS Test Certificate", size: "320 KB" }, { name: "Material Declaration (IPC-1752)", size: "95 KB" }] });
    items.push({ rule: "Battery Shipping (UN38.3)", status: "pending", due: "Apr 1", side: "export", description: "Lithium battery safety testing per UN Manual of Tests and Criteria. Required for air and sea freight.", docs: [{ name: "UN38.3 Test Summary", size: "450 KB" }, { name: "MSDS / SDS Sheet", size: "210 KB" }, { name: "Shipper's Declaration", size: "85 KB" }], estimatedTime: "5–7 business days", estimatedCost: "$800 – $1,500", legislations: [{ name: "UN Manual of Tests & Criteria", url: "https://unece.org/transport/standards/transport/dangerous-goods/un-manual-tests-and-criteria" }, { name: "IATA DGR Section II", url: "" }] });
  } else if (category === "Food & Beverage") {
    items.push({ rule: "Phytosanitary Certificate", status: "done", due: "Mar 10", side: "export", description: "Issued by plant quarantine authority confirming products are free from pests and diseases.", docs: [{ name: "Phytosanitary Certificate", size: "120 KB" }, { name: "Fumigation Certificate", size: "90 KB" }] });
    items.push({ rule: "FDA / FSSAI Approval", status: destCode === "USA" ? "pending" : "done", due: "Mar 25", side: "import", description: "Food safety registration and prior notice filing required before shipment arrives at port.", docs: [{ name: "FDA Prior Notice Confirmation", size: "65 KB" }, { name: "FSSAI Import License", size: "150 KB" }, { name: "Lab Analysis Report", size: "380 KB" }] });
    items.push({ rule: "Pesticide Residue Test", status: "pending", due: "Apr 5", side: "export", description: "Maximum residue levels (MRL) must comply with destination country standards.", docs: [{ name: "Pesticide Analysis Report", size: "290 KB" }, { name: "Sampling Protocol", size: "45 KB" }] });
  } else if (category === "Health") {
    items.push({ rule: "GMP Certificate", status: "done", due: "Feb 15", side: "export", description: "Good Manufacturing Practice certification ensures consistent production quality.", docs: [{ name: "GMP Certificate (WHO)", size: "180 KB" }, { name: "Facility Audit Report", size: "520 KB" }] });
    items.push({ rule: "NDI / NPN Notification", status: "pending", due: "Apr 10", side: "import", description: "New Dietary Ingredient notification or Natural Product Number required before market entry.", docs: [{ name: "NDI Notification (FDA)", size: "340 KB" }, { name: "Product Monograph", size: "210 KB" }, { name: "Stability Study Data", size: "890 KB" }] });
  } else if (category === "Lighting") {
    items.push({ rule: "UL / CE Safety Cert", status: "pending", due: "Apr 12", side: "import", description: "Electrical safety certification for luminaires — covers insulation, grounding, and thermal tests.", docs: [{ name: "UL Certification Report", size: "620 KB" }, { name: "CE Test Report (LVD)", size: "440 KB" }] });
    items.push({ rule: "Energy Efficiency (ErP)", status: destCode === "EU" || destCode === "DE" ? "pending" : "done", due: "Apr 8", side: "import", description: "EU Energy-related Products directive — minimum efficacy and standby power requirements.", docs: [{ name: "ErP Compliance Declaration", size: "95 KB" }, { name: "Energy Label (EU 2019/2015)", size: "130 KB" }] });
  } else {
    items.push({ rule: "GOTS Organic Cert", status: "done", due: "Feb 20", side: "export", description: "Global Organic Textile Standard — covers processing, manufacturing, and labeling of organic fibers.", docs: [{ name: "GOTS Scope Certificate", size: "280 KB" }, { name: "Transaction Certificate", size: "120 KB" }] });
    items.push({ rule: "REACH Chemical Test", status: destCode === "EU" || destCode === "DE" ? "pending" : "done", due: "Mar 30", side: "import", description: "Registration, Evaluation, and Authorization of Chemicals — SVHC screening required.", docs: [{ name: "REACH SVHC Declaration", size: "185 KB" }, { name: "Azo Dye Test Report", size: "310 KB" }, { name: "Formaldehyde Test", size: "140 KB" }], estimatedTime: "15–20 business days", estimatedCost: "$2,000 – $5,000", legislations: [{ name: "EC Regulation 1907/2006 (REACH)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32006R1907" }] });
    items.push({ rule: "Care Label Compliance", status: "done", due: "Mar 5", side: "import", description: "Textile labeling must include fiber content, care instructions, and country of origin per local law.", docs: [{ name: "Label Compliance Checklist", size: "55 KB" }, { name: "Fiber Content Certificate", size: "90 KB" }] });
  }
  return items;
}

function getRequiredDocs(category: string, destCode: string) {
  const base = ["Commercial Invoice", "Packing List", "Bill of Lading", "Certificate of Origin"];
  const map: Record<string, string[]> = {
    "USA": ["FCC/FDA Certificate", "ISF Filing"],
    "EU": ["CE Declaration", "EUR.1 Form", "REACH Registration"],
    "UK": ["UKCA Declaration"],
    "JP": ["PSE / JAS Certificate", "Food Import Notification"],
    "CA": ["CFIA Permit", "Bilingual Labels"],
    "AU": ["Biosecurity Certificate"],
    "DE": ["VerpackG Registration", "CE Declaration"],
  };
  return [...base, ...(map[destCode] || [])];
}

function getAlerts(hsCode: string): AIAlert[] {
  return [
    { id: "A1", type: "critical", title: "EU tariff revision for HS 85xx — effective Apr 1, 2026", description: "Import duty increases from 4.2% to 5.1% for wireless audio devices.", country: "EU", time: "2h ago", isNew: true },
    { id: "A2", type: "warning", title: "FDA updated SAR labeling guidance", description: "New SAR info requirements for wireless consumer electronics by June 2026.", country: "USA", time: "6h ago", isNew: true },
    { id: "A3", type: "info", title: "India-Australia ECTA — 0% duty on organic cotton", description: "Preferential tariff available with Certificate of Origin Form AI.", country: "AU", time: "1d ago", isNew: false },
    { id: "A4", type: "update", title: "Japan PSE standard alignment updated", description: "Existing certifications valid until Dec 2026.", country: "JP", time: "2d ago", isNew: false },
  ];
}

const workers = [
  { id: "W1", name: "Arjun Mehta", role: "Compliance Lead", phone: "+91 98765 43210", email: "arjun@tradeflow.io", initials: "AM", country: "India", countryFlag: String.fromCodePoint(0x1F1EE, 0x1F1F3), side: "export" as const, rating: 4.9, ordersCompleted: 847 },
  { id: "W2", name: "Sarah Chen", role: "Docs Specialist", phone: "+1 (415) 555-0142", email: "sarah@tradeflow.io", initials: "SC", country: "United States", countryFlag: String.fromCodePoint(0x1F1FA, 0x1F1F8), side: "import" as const, rating: 4.7, ordersCompleted: 623 },
  { id: "W3", name: "Raj Patel", role: "Customs Broker", phone: "+91 87654 32109", email: "raj@tradeflow.io", initials: "RP", country: "India", countryFlag: String.fromCodePoint(0x1F1EE, 0x1F1F3), side: "export" as const, rating: 4.8, ordersCompleted: 512 },
];

const employeePool = [
  { id: "W4", name: "Yuki Tanaka", role: "Customs Officer", phone: "+81 90-1234-5678", email: "yuki@tradeflow.io", initials: "YT", country: "Japan", countryFlag: String.fromCodePoint(0x1F1EF, 0x1F1F5), side: "import" as const, rating: 4.6, ordersCompleted: 389 },
  { id: "W5", name: "Hans Müller", role: "EU Compliance Advisor", phone: "+49 170 1234567", email: "hans@tradeflow.io", initials: "HM", country: "Germany", countryFlag: String.fromCodePoint(0x1F1E9, 0x1F1EA), side: "import" as const, rating: 4.5, ordersCompleted: 274 },
  { id: "W6", name: "Priya Sharma", role: "QC Inspector", phone: "+91 99887 76655", email: "priya@tradeflow.io", initials: "PS", country: "India", countryFlag: String.fromCodePoint(0x1F1EE, 0x1F1F3), side: "export" as const, rating: 4.8, ordersCompleted: 456 },
  { id: "W7", name: "James Liu", role: "Freight Coordinator", phone: "+86 138 0013 8000", email: "james@tradeflow.io", initials: "JL", country: "China", countryFlag: String.fromCodePoint(0x1F1E8, 0x1F1F3), side: "export" as const, rating: 4.4, ordersCompleted: 198 },
  { id: "W8", name: "Emma Wilson", role: "Import Specialist", phone: "+44 7911 123456", email: "emma@tradeflow.io", initials: "EW", country: "United Kingdom", countryFlag: String.fromCodePoint(0x1F1EC, 0x1F1E7), side: "import" as const, rating: 4.7, ordersCompleted: 531 },
  { id: "W9", name: "Aisha Okafor", role: "Trade Analyst", phone: "+1 (647) 555-0198", email: "aisha@tradeflow.io", initials: "AO", country: "Canada", countryFlag: String.fromCodePoint(0x1F1E8, 0x1F1E6), side: "import" as const, rating: 4.3, ordersCompleted: 167 },
  { id: "W10", name: "Vikram Nair", role: "Packaging Lead", phone: "+91 94561 23456", email: "vikram@tradeflow.io", initials: "VN", country: "India", countryFlag: String.fromCodePoint(0x1F1EE, 0x1F1F3), side: "export" as const, rating: 4.6, ordersCompleted: 342 },
];

// ─── QUANTITY TIERS ─────────────────────────────────────────
interface QuantityTier {
  label: string;
  units: number;
  discount: number; // percentage discount on per-unit landed cost
}

const quantityTiers: QuantityTier[] = [
  { label: "1 unit", units: 1, discount: 0 },
  { label: "10 units", units: 10, discount: 0.032 },
  { label: "4 Cartons (80 units)", units: 80, discount: 0.055 },
  { label: "Full pallet (12 cartons)", units: 240, discount: 0.085 },
  { label: "Full container 20ft (6 pallets)", units: 1440, discount: 0.112 },
  { label: "Full container HC 40ft (12 pallets)", units: 2880, discount: 0.13 },
];

// ─── CUSTOM SELECT ──────────────────────────────────────────

function InlineSelect({ 
  value, 
  onChange, 
  options, 
  placeholder,
  accent = "primary",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; sub?: string }[];
  placeholder: string;
  accent?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find(o => o.value === value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = search.trim()
    ? options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        (o.sub && o.sub.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    if (!open) setSearch("");
  }, [open]);

  return (
    <div className="relative inline-block">
      <motion.button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[0.9375rem] cursor-pointer transition-all border-2 ${
          selected 
            ? "bg-primary/[0.06] border-primary/15 text-foreground/85" 
            : "bg-muted/20 border-transparent text-muted-foreground/40 hover:border-muted/30"
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
      >
        {(() => {
          if (!selected) return <span>{placeholder}</span>;
          // Try to extract flag emoji from label and show CDN image instead
          const lbl = selected.label;
          const cp1 = lbl.codePointAt(0);
          const cp2 = cp1 && cp1 > 0xFFFF ? lbl.codePointAt(2) : null;
          if (cp1 && cp2 && cp1 >= 0x1F1E6 && cp1 <= 0x1F1FF && cp2 >= 0x1F1E6 && cp2 <= 0x1F1FF) {
            const flagCode = String.fromCharCode(cp1 - 0x1F1E6 + 97) + String.fromCharCode(cp2 - 0x1F1E6 + 97);
            const textPart = lbl.slice(4).trim();
            return (
              <span className="inline-flex items-center gap-2">
                <img src={`https://flagcdn.com/w20/${flagCode}.png`} alt="" className="w-[16px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                {textPart}
              </span>
            );
          }
          // Try from sub field
          const sub = selected.sub;
          if (sub) {
            const scp1 = sub.codePointAt(0);
            const scp2 = scp1 && scp1 > 0xFFFF ? sub.codePointAt(2) : null;
            if (scp1 && scp2 && scp1 >= 0x1F1E6 && scp1 <= 0x1F1FF && scp2 >= 0x1F1E6 && scp2 <= 0x1F1FF) {
              const flagCode = String.fromCharCode(scp1 - 0x1F1E6 + 97) + String.fromCharCode(scp2 - 0x1F1E6 + 97);
              return (
                <span className="inline-flex items-center gap-2">
                  <img src={`https://flagcdn.com/w20/${flagCode}.png`} alt="" className="w-[16px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                  {lbl}
                </span>
              );
            }
          }
          return <span>{lbl}</span>;
        })()}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-muted-foreground/30" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              className="absolute top-full left-0 mt-2 min-w-[280px] bg-card rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.04)] z-50 overflow-hidden max-h-[360px] flex flex-col"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {/* Search input */}
              <div className="px-3 pt-3 pb-2 border-b border-black/[0.04] flex-shrink-0">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/10">
                  <Search size={13} className="text-muted-foreground/30 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Type to search..."
                    className="bg-transparent text-[0.8125rem] text-foreground/70 placeholder:text-muted-foreground/25 focus:outline-none w-full"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="cursor-pointer">
                      <X size={11} className="text-muted-foreground/30" />
                    </button>
                  )}
                </div>
              </div>

              {/* Options list */}
              <div className="overflow-y-auto py-1.5 flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/10 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                {filtered.length > 0 ? filtered.map((opt) => {
                  let labelText = opt.label;
                  let subText = opt.sub;
                  let flagCode = null;

                  // Evaluate if the flag emoji is inside the primary label (e.g., origin dropdowns)
                  if (typeof opt.label === 'string') {
                    const cp1 = opt.label.codePointAt(0);
                    const cp2 = cp1 && cp1 > 0xFFFF ? opt.label.codePointAt(2) : null;
                    if (cp1 && cp2 && cp1 >= 0x1F1E6 && cp1 <= 0x1F1FF && cp2 >= 0x1F1E6 && cp2 <= 0x1F1FF) {
                      flagCode = String.fromCharCode(cp1 - 0x1F1E6 + 97) + String.fromCharCode(cp2 - 0x1F1E6 + 97);
                      labelText = opt.label.slice(4).trim();
                    }
                  }

                  // Evaluate if the flag emoji is inside the sub text (e.g., destination dropdowns)
                  if (!flagCode && typeof opt.sub === 'string') {
                    const scp1 = opt.sub.codePointAt(0);
                    const scp2 = scp1 && scp1 > 0xFFFF ? opt.sub.codePointAt(2) : null;
                    if (scp1 && scp2 && scp1 >= 0x1F1E6 && scp1 <= 0x1F1FF && scp2 >= 0x1F1E6 && scp2 <= 0x1F1FF) {
                      flagCode = String.fromCharCode(scp1 - 0x1F1E6 + 97) + String.fromCharCode(scp2 - 0x1F1E6 + 97);
                      subText = opt.sub.length > 4 ? opt.sub.slice(4).trim() : null;
                    }
                  }

                  return (
                    <motion.button
                      key={opt.value}
                      onClick={() => { onChange(opt.value); setOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer transition-colors ${
                        value === opt.value ? "bg-primary/[0.06]" : "hover:bg-muted/20"
                      }`}
                      whileHover={{ x: 2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="flex items-center gap-2.5">
                        {flagCode && (
                          <img src={`https://flagcdn.com/w20/${flagCode}.png`} alt="" className="w-[18px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)] flex-shrink-0" />
                        )}
                        <div>
                          <p className={`text-[0.8125rem] ${value === opt.value ? "text-primary" : "text-foreground/70"}`}>
                            {labelText}
                          </p>
                          {subText && (
                            <p className="text-[0.625rem] text-muted-foreground/35 mt-0.5">{subText}</p>
                          )}
                        </div>
                      </div>
                      {value === opt.value && <Check size={14} className="text-primary flex-shrink-0" />}
                    </motion.button>
                  );
                }) : (
                  <p className="px-4 py-4 text-[0.75rem] text-muted-foreground/25 text-center">No matches found</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════

// ─── HS CODES DATABASE (21 Global Sections) ─────────────────
interface HSCode { code: string; desc: string; }
interface HSSection { id: string; title: string; chapters: string; emoji: string; codes: HSCode[]; }

const hsSections: HSSection[] = [
  {
    id: "I", title: "Live Animals & Animal Products", chapters: "Ch. 01–05", emoji: "🐄",
    codes: [
      { code: "0101.21.00", desc: "Live horses, purebred breeding" },
      { code: "0101.29.00", desc: "Live horses, other" },
      { code: "0102.21.00", desc: "Live bovine, purebred breeding" },
      { code: "0102.29.00", desc: "Live bovine, other" },
      { code: "0104.10.00", desc: "Live sheep" },
      { code: "0105.11.00", desc: "Live fowls, ≤185g" },
      { code: "0201.10.00", desc: "Bovine meat, carcasses, fresh/chilled" },
      { code: "0201.20.00", desc: "Bovine meat, bone-in cuts, fresh/chilled" },
      { code: "0201.30.00", desc: "Bovine meat, boneless, fresh/chilled" },
      { code: "0202.10.00", desc: "Bovine meat, carcasses, frozen" },
      { code: "0203.11.00", desc: "Pig carcasses & half-carcasses, frozen" },
      { code: "0207.12.00", desc: "Chicken, whole, frozen" },
      { code: "0207.14.00", desc: "Chicken cuts & offal, frozen" },
      { code: "0302.11.00", desc: "Trout, fresh or chilled" },
      { code: "0303.89.00", desc: "Fish, frozen, other" },
      { code: "0306.17.00", desc: "Shrimps & prawns, frozen" },
      { code: "0306.16.00", desc: "Cold-water shrimps, frozen" },
      { code: "0307.43.00", desc: "Cuttlefish & squid, frozen" },
      { code: "0401.10.00", desc: "Milk, fat content ≤1%" },
      { code: "0402.10.00", desc: "Milk powder, ≤1.5% fat" },
      { code: "0402.21.00", desc: "Milk powder, >1.5% fat" },
      { code: "0403.10.00", desc: "Yogurt" },
      { code: "0405.10.00", desc: "Butter" },
      { code: "0406.10.00", desc: "Fresh cheese" },
      { code: "0406.90.00", desc: "Other cheese" },
      { code: "0407.11.00", desc: "Fertile eggs for incubation, fowls" },
      { code: "0408.19.00", desc: "Egg yolks, other" },
      { code: "0410.10.00", desc: "Edible insects" },
      { code: "0501.00.00", desc: "Human hair, unworked" },
      { code: "0511.91.00", desc: "Fish eggs, milt & fish waste" },
    ]
  },
  {
    id: "II", title: "Vegetable Products", chapters: "Ch. 06–14", emoji: "🌿",
    codes: [
      { code: "0601.10.00", desc: "Bulbs, tubers, for planting" },
      { code: "0603.11.00", desc: "Fresh cut roses" },
      { code: "0603.19.00", desc: "Fresh cut flowers, other" },
      { code: "0604.90.00", desc: "Foliage, branches for bouquets" },
      { code: "0701.90.00", desc: "Potatoes, fresh or chilled, other" },
      { code: "0702.00.00", desc: "Tomatoes, fresh or chilled" },
      { code: "0703.10.00", desc: "Onions & shallots, fresh" },
      { code: "0704.10.00", desc: "Cauliflower & broccoli, fresh" },
      { code: "0709.20.00", desc: "Asparagus, fresh or chilled" },
      { code: "0709.60.00", desc: "Capsicum/peppers, fresh" },
      { code: "0714.10.00", desc: "Manioc (cassava), fresh or dried" },
      { code: "0803.10.00", desc: "Plantains, fresh or dried" },
      { code: "0804.10.00", desc: "Dates, fresh or dried" },
      { code: "0804.30.00", desc: "Pineapples, fresh or dried" },
      { code: "0804.40.00", desc: "Avocados, fresh or dried" },
      { code: "0805.10.00", desc: "Oranges, fresh or dried" },
      { code: "0805.20.00", desc: "Mandarins, clementines, fresh" },
      { code: "0806.10.00", desc: "Grapes, fresh" },
      { code: "0807.11.00", desc: "Watermelons, fresh" },
      { code: "0808.10.00", desc: "Apples, fresh" },
      { code: "0901.11.00", desc: "Coffee, not roasted, not decaf" },
      { code: "0901.21.00", desc: "Coffee, roasted, not decaf" },
      { code: "0902.10.00", desc: "Green tea, packets ≤3kg" },
      { code: "0902.20.00", desc: "Green tea, packets >3kg" },
      { code: "0902.30.00", desc: "Black tea, packets ≤3kg" },
      { code: "0902.40.00", desc: "Black tea, packets >3kg" },
      { code: "0904.21.00", desc: "Pepper, dried, not crushed" },
      { code: "0905.10.00", desc: "Vanilla beans" },
      { code: "0906.11.00", desc: "Cinnamon, not crushed" },
      { code: "0907.10.00", desc: "Cloves, whole" },
      { code: "0908.11.00", desc: "Nutmeg" },
      { code: "0910.11.00", desc: "Ginger, not crushed" },
      { code: "0910.30.00", desc: "Turmeric (curcuma)" },
      { code: "0910.99.00", desc: "Mixed spices" },
      { code: "1001.19.00", desc: "Durum wheat, other" },
      { code: "1005.90.00", desc: "Maize (corn), other" },
      { code: "1006.10.00", desc: "Rice in the husk (paddy)" },
      { code: "1006.30.00", desc: "Semi-milled or wholly milled rice" },
      { code: "1201.90.00", desc: "Soya beans, other" },
      { code: "1207.40.00", desc: "Sesame seeds" },
      { code: "1209.91.00", desc: "Vegetable seeds for sowing" },
      { code: "1211.20.00", desc: "Ginseng roots" },
      { code: "1211.90.00", desc: "Plants for pharmaceutical use, other" },
      { code: "1212.94.00", desc: "Chicory, fresh or dried" },
    ]
  },
  {
    id: "III", title: "Animal & Vegetable Fats & Oils", chapters: "Ch. 15", emoji: "🫒",
    codes: [
      { code: "1507.10.00", desc: "Soya-bean oil, crude" },
      { code: "1507.90.00", desc: "Soya-bean oil, refined" },
      { code: "1509.10.00", desc: "Virgin olive oil" },
      { code: "1509.90.00", desc: "Olive oil, other" },
      { code: "1511.10.00", desc: "Palm oil, crude" },
      { code: "1511.90.00", desc: "Palm oil, refined" },
      { code: "1512.11.00", desc: "Sunflower-seed oil, crude" },
      { code: "1513.11.00", desc: "Coconut (copra) oil, crude" },
      { code: "1514.11.00", desc: "Rapeseed/canola oil, crude" },
      { code: "1515.11.00", desc: "Linseed oil, crude" },
      { code: "1515.30.00", desc: "Castor oil & its fractions" },
      { code: "1516.10.00", desc: "Animal fats & oils, hydrogenated" },
      { code: "1516.20.00", desc: "Vegetable fats & oils, hydrogenated" },
      { code: "1517.10.00", desc: "Margarine, excluding liquid" },
      { code: "1518.00.00", desc: "Inedible animal/vegetable fats & oils" },
    ]
  },
  {
    id: "IV", title: "Prepared Foodstuffs, Beverages & Tobacco", chapters: "Ch. 16–24", emoji: "🍷",
    codes: [
      { code: "1601.00.00", desc: "Sausages & similar products" },
      { code: "1602.41.00", desc: "Hams, shoulders, bone-in, swine" },
      { code: "1604.14.00", desc: "Tunas, skipjack, prepared/preserved" },
      { code: "1605.21.00", desc: "Shrimps & prawns, not in airtight containers" },
      { code: "1701.12.00", desc: "Raw beet sugar" },
      { code: "1701.14.00", desc: "Raw cane sugar" },
      { code: "1702.30.00", desc: "Glucose & glucose syrup" },
      { code: "1704.10.00", desc: "Chewing gum" },
      { code: "1704.90.00", desc: "Sugar confectionery, other" },
      { code: "1801.00.00", desc: "Cocoa beans, whole or broken" },
      { code: "1805.00.00", desc: "Cocoa powder, no added sugar" },
      { code: "1806.20.00", desc: "Chocolate preparations >2kg" },
      { code: "1806.31.00", desc: "Chocolate tablets/bars, filled" },
      { code: "1806.32.00", desc: "Chocolate tablets/bars, not filled" },
      { code: "1901.10.00", desc: "Infant formula preparations" },
      { code: "1902.11.00", desc: "Pasta, uncooked, with eggs" },
      { code: "1902.30.00", desc: "Pasta, other" },
      { code: "1905.31.00", desc: "Sweet biscuits" },
      { code: "1905.90.00", desc: "Bread, pastry, biscuits, other" },
      { code: "2005.20.00", desc: "Potatoes, prepared/preserved" },
      { code: "2007.99.00", desc: "Jams, jellies, marmalades, other" },
      { code: "2009.11.00", desc: "Frozen orange juice, Brix ≤20" },
      { code: "2009.12.00", desc: "Frozen orange juice, Brix >20" },
      { code: "2009.90.00", desc: "Mixtures of fruit juices" },
      { code: "2101.11.00", desc: "Coffee extracts & concentrates" },
      { code: "2101.20.00", desc: "Tea & maté extracts" },
      { code: "2106.10.00", desc: "Protein concentrates & textured protein" },
      { code: "2106.90.92", desc: "Food supplements & preparations" },
      { code: "2202.10.00", desc: "Water with added sugar/flavoring" },
      { code: "2202.91.00", desc: "Non-alcoholic beer" },
      { code: "2203.00.00", desc: "Beer made from malt" },
      { code: "2204.10.00", desc: "Sparkling wine" },
      { code: "2204.21.00", desc: "Wine in containers ≤2L" },
      { code: "2204.22.00", desc: "Wine in containers 2–10L" },
      { code: "2205.10.00", desc: "Vermouth in containers ≤2L" },
      { code: "2207.10.00", desc: "Undenatured ethyl alcohol ≥80%" },
      { code: "2208.20.00", desc: "Spirits from grapes" },
      { code: "2208.30.00", desc: "Whiskies" },
      { code: "2208.40.00", desc: "Rum & tafia" },
      { code: "2208.60.00", desc: "Vodka" },
      { code: "2302.10.00", desc: "Bran, sharps, from maize" },
      { code: "2309.90.00", desc: "Preparations for animal feeding, other" },
      { code: "2401.10.00", desc: "Tobacco, unstemmed/unstripped" },
      { code: "2402.20.00", desc: "Cigarettes containing tobacco" },
      { code: "2403.11.00", desc: "Water pipe tobacco" },
    ]
  },
  {
    id: "V", title: "Mineral Products", chapters: "Ch. 25–27", emoji: "⛏️",
    codes: [
      { code: "2501.00.00", desc: "Salt & pure sodium chloride" },
      { code: "2504.10.00", desc: "Natural graphite, powder/flakes" },
      { code: "2505.10.00", desc: "Silica sands & quartz sands" },
      { code: "2508.10.00", desc: "Bentonite" },
      { code: "2516.11.00", desc: "Granite, crude or roughly trimmed" },
      { code: "2523.21.00", desc: "White Portland cement" },
      { code: "2601.11.00", desc: "Iron ores, non-agglomerated" },
      { code: "2603.00.00", desc: "Copper ores & concentrates" },
      { code: "2606.00.00", desc: "Aluminium ores & concentrates" },
      { code: "2607.00.00", desc: "Lead ores & concentrates" },
      { code: "2608.00.00", desc: "Zinc ores & concentrates" },
      { code: "2609.00.00", desc: "Tin ores & concentrates" },
      { code: "2612.10.00", desc: "Uranium ores & concentrates" },
      { code: "2614.00.00", desc: "Titanium ores & concentrates" },
      { code: "2616.10.00", desc: "Silver ores & concentrates" },
      { code: "2616.90.00", desc: "Precious metal ores, other" },
      { code: "2620.11.00", desc: "Hard zinc spelter (residues)" },
      { code: "2701.12.00", desc: "Bituminous coal, not agglomerated" },
      { code: "2702.10.00", desc: "Lignite, not agglomerated" },
      { code: "2704.00.00", desc: "Coke & semi-coke of coal" },
      { code: "2709.00.00", desc: "Petroleum oils, crude" },
      { code: "2710.12.25", desc: "Motor gasoline" },
      { code: "2710.12.90", desc: "Other light petroleum oils" },
      { code: "2710.19.00", desc: "Medium/heavy petroleum oils" },
      { code: "2711.11.00", desc: "Natural gas, liquefied" },
      { code: "2711.12.00", desc: "Propane, liquefied" },
      { code: "2711.13.00", desc: "Butanes, liquefied" },
      { code: "2716.00.00", desc: "Electrical energy" },
    ]
  },
  {
    id: "VI", title: "Chemical & Allied Industry Products", chapters: "Ch. 28–38", emoji: "⚗️",
    codes: [
      { code: "2804.10.00", desc: "Hydrogen" },
      { code: "2804.61.00", desc: "Silicon, ≥99.99% pure" },
      { code: "2806.10.00", desc: "Hydrogen chloride (HCl)" },
      { code: "2814.10.00", desc: "Anhydrous ammonia" },
      { code: "2836.20.00", desc: "Disodium carbonate (soda ash)" },
      { code: "2901.10.00", desc: "Saturated acyclic hydrocarbons" },
      { code: "2902.20.00", desc: "Benzene" },
      { code: "2902.30.00", desc: "Toluene" },
      { code: "2905.11.00", desc: "Methanol (methyl alcohol)" },
      { code: "2905.31.00", desc: "Ethylene glycol" },
      { code: "2915.21.00", desc: "Acetic acid" },
      { code: "2916.12.00", desc: "Esters of acrylic acid" },
      { code: "2917.32.00", desc: "Dioctyl orthophthalates (plasticisers)" },
      { code: "2921.11.00", desc: "Methylamine & salts" },
      { code: "2933.59.00", desc: "Compounds with pyrimidine ring, other" },
      { code: "2941.10.00", desc: "Penicillins & streptomycins" },
      { code: "3002.12.00", desc: "COVID-19 vaccines" },
      { code: "3002.20.00", desc: "Vaccines for human medicine" },
      { code: "3003.20.00", desc: "Medicaments, antibiotics" },
      { code: "3004.20.00", desc: "Medicaments containing antibiotics" },
      { code: "3004.90.00", desc: "Medicaments, mixed/unmixed, other" },
      { code: "3102.10.00", desc: "Urea (fertilizer)" },
      { code: "3102.30.00", desc: "Ammonium nitrate (fertilizer)" },
      { code: "3105.20.00", desc: "Mineral NPK fertilizers" },
      { code: "3204.17.00", desc: "Synthetic organic pigments" },
      { code: "3301.29.00", desc: "Essential oils, other" },
      { code: "3304.10.00", desc: "Lip make-up preparations" },
      { code: "3304.91.00", desc: "Face powders & skin powders" },
      { code: "3304.99.00", desc: "Beauty/make-up preparations, other" },
      { code: "3305.10.00", desc: "Shampoos" },
      { code: "3305.30.00", desc: "Hair lacquers" },
      { code: "3307.10.00", desc: "Shaving preparations" },
      { code: "3307.20.00", desc: "Personal deodorants & antiperspirants" },
      { code: "3401.11.00", desc: "Soap for toilet use" },
      { code: "3402.50.00", desc: "Organic surface-active products, retail" },
      { code: "3808.52.00", desc: "DDT (insecticides)" },
      { code: "3808.91.00", desc: "Insecticides, retail" },
      { code: "3811.19.00", desc: "Anti-knock preparations, other" },
      { code: "3824.99.00", desc: "Chemical products & preparations, other" },
      { code: "3826.00.00", desc: "Biodiesel & mixtures" },
    ]
  },
  {
    id: "VII", title: "Plastics & Rubber", chapters: "Ch. 39–40", emoji: "🧴",
    codes: [
      { code: "3901.10.00", desc: "Polyethylene, density <0.94" },
      { code: "3901.20.00", desc: "Polyethylene, density ≥0.94" },
      { code: "3902.10.00", desc: "Polypropylene" },
      { code: "3903.11.00", desc: "Expansible polystyrene" },
      { code: "3904.10.00", desc: "PVC, not mixed with substances" },
      { code: "3904.21.00", desc: "PVC, non-plasticised" },
      { code: "3906.90.00", desc: "Acrylic polymers, other" },
      { code: "3907.20.00", desc: "Polyether polyols" },
      { code: "3909.50.00", desc: "Polyurethanes" },
      { code: "3916.90.00", desc: "Monofilaments of plastics, other" },
      { code: "3919.10.00", desc: "Self-adhesive plates, rolls, plastic" },
      { code: "3920.10.00", desc: "Plates, sheets, film, polyethylene" },
      { code: "3923.10.00", desc: "Boxes, cases, crates of plastic" },
      { code: "3923.30.00", desc: "Carboys, bottles, flasks (plastic)" },
      { code: "3926.10.00", desc: "Office/school articles of plastic" },
      { code: "3926.20.00", desc: "Articles of apparel, plastic" },
      { code: "3926.90.00", desc: "Articles of plastic, other" },
      { code: "4001.10.00", desc: "Natural rubber latex" },
      { code: "4002.11.00", desc: "Styrene-butadiene rubber (SBR)" },
      { code: "4005.10.00", desc: "Rubber compounded with carbon black" },
      { code: "4011.10.00", desc: "New pneumatic tires, motor cars" },
      { code: "4011.20.00", desc: "New pneumatic tires, buses/lorries" },
      { code: "4011.40.00", desc: "New pneumatic tires, motorcycles" },
      { code: "4016.99.00", desc: "Articles of vulcanised rubber, other" },
    ]
  },
  {
    id: "VIII", title: "Hides, Skins, Leather & Travel Goods", chapters: "Ch. 41–43", emoji: "👜",
    codes: [
      { code: "4101.20.00", desc: "Raw hides, whole bovine" },
      { code: "4101.50.00", desc: "Raw hides, equine, whole" },
      { code: "4104.11.00", desc: "Full grain leather, bovine, wet-blue" },
      { code: "4107.11.00", desc: "Full grain leather, bovine, finished" },
      { code: "4113.10.00", desc: "Leather of goats or kids" },
      { code: "4202.11.00", desc: "Trunks, suitcases, of leather" },
      { code: "4202.12.00", desc: "Trunks, cases, plastic/textile" },
      { code: "4202.21.00", desc: "Handbags, of leather" },
      { code: "4202.22.00", desc: "Handbags, of plastic/textile" },
      { code: "4202.31.00", desc: "Articles of a kind for pocket, of leather" },
      { code: "4203.10.00", desc: "Leather apparel" },
      { code: "4203.21.00", desc: "Gloves, mittens, leather (sport)" },
      { code: "4205.00.00", desc: "Articles of leather, other" },
      { code: "4302.19.00", desc: "Tanned/dressed fur skins, other" },
    ]
  },
  {
    id: "IX", title: "Wood, Cork & Basketwork", chapters: "Ch. 44–46", emoji: "🪵",
    codes: [
      { code: "4403.21.00", desc: "Wood, rough, coniferous, pine" },
      { code: "4403.41.00", desc: "Wood, rough, tropical, dark red meranti" },
      { code: "4407.10.00", desc: "Wood sawn lengthwise, coniferous" },
      { code: "4407.29.00", desc: "Wood sawn lengthwise, tropical, other" },
      { code: "4408.10.00", desc: "Sheets for veneering, coniferous" },
      { code: "4412.10.00", desc: "Plywood, bamboo" },
      { code: "4412.33.00", desc: "Plywood, tropical wood faces" },
      { code: "4418.10.00", desc: "Doors & frames of wood" },
      { code: "4418.20.00", desc: "Windows, french windows, frames" },
      { code: "4419.11.00", desc: "Bread boards, chopping boards, bamboo" },
      { code: "4419.90.00", desc: "Tableware & kitchenware of wood" },
      { code: "4421.91.00", desc: "Articles of bamboo, other" },
      { code: "4421.99.00", desc: "Articles of wood, other" },
      { code: "4501.10.00", desc: "Natural cork, raw" },
      { code: "4601.21.00", desc: "Mats, matting, bamboo" },
    ]
  },
  {
    id: "X", title: "Pulp, Paper & Paperboard", chapters: "Ch. 47–49", emoji: "📄",
    codes: [
      { code: "4702.00.00", desc: "Chemical wood pulp, dissolving grade" },
      { code: "4703.11.00", desc: "Chemical wood pulp, sulphate, coniferous" },
      { code: "4703.21.00", desc: "Chemical wood pulp, sulphate, non-coniferous" },
      { code: "4801.00.00", desc: "Newsprint, rolls or sheets" },
      { code: "4804.11.00", desc: "Uncoated Kraft paper, unbleached" },
      { code: "4810.13.00", desc: "Paper coated with kaolin, ≤150g/m²" },
      { code: "4811.59.00", desc: "Paper coated/covered with plastic, other" },
      { code: "4819.10.00", desc: "Cartons, boxes of corrugated paper" },
      { code: "4819.20.00", desc: "Cartons, boxes of non-corrugated paper" },
      { code: "4820.10.00", desc: "Registers, account books, note books" },
      { code: "4901.10.00", desc: "Printed books, in single sheets" },
      { code: "4901.99.00", desc: "Printed books, brochures, other" },
      { code: "4902.10.00", desc: "Newspapers, appearing ≥4× per week" },
      { code: "4907.00.00", desc: "Unused postage/revenue stamps" },
      { code: "4911.10.00", desc: "Trade advertising material, catalogues" },
      { code: "4911.91.00", desc: "Printed pictures, designs, photographs" },
    ]
  },
  {
    id: "XI", title: "Textiles & Textile Articles", chapters: "Ch. 50–63", emoji: "🧵",
    codes: [
      { code: "5007.20.00", desc: "Woven fabrics of silk/silk waste" },
      { code: "5201.00.00", desc: "Cotton, not carded or combed" },
      { code: "5205.11.00", desc: "Cotton yarn, ≥85%, single, uncombed" },
      { code: "5208.11.00", desc: "Plain weave cotton, ≤100g/m²" },
      { code: "5209.11.00", desc: "Denim, ≥85% cotton, unbleached" },
      { code: "5306.10.00", desc: "Flax yarn, single" },
      { code: "5402.47.00", desc: "Other yarn of polyesters, single" },
      { code: "5407.10.00", desc: "Woven fabrics of nylon" },
      { code: "5513.11.00", desc: "Woven polyester fabric, plain weave, <170g/m²" },
      { code: "5601.21.00", desc: "Cotton wadding" },
      { code: "5806.32.00", desc: "Narrow woven fabric, polyester" },
      { code: "5903.10.00", desc: "Textile fabrics impregnated with PVC" },
      { code: "6001.22.00", desc: "Looped pile fabrics, cut, cotton" },
      { code: "6101.20.00", desc: "Men's overcoats, cotton, knitted" },
      { code: "6104.43.00", desc: "Women's dresses, synthetic, knitted" },
      { code: "6105.10.00", desc: "Men's shirts, cotton, knitted" },
      { code: "6106.10.00", desc: "Women's blouses, cotton, knitted" },
      { code: "6109.10.00", desc: "T-shirts, singlets, cotton knit" },
      { code: "6109.90.00", desc: "T-shirts, other fibres, knitted" },
      { code: "6110.20.00", desc: "Jerseys, pullovers, cotton knit" },
      { code: "6110.30.00", desc: "Jerseys, pullovers, manmade fibres" },
      { code: "6115.22.00", desc: "Hosiery, ≥67% nylon, <67dtex" },
      { code: "6201.93.00", desc: "Men's anoraks, synthetic fibres" },
      { code: "6203.42.00", desc: "Men's trousers, cotton" },
      { code: "6203.43.00", desc: "Men's trousers, synthetic fibres" },
      { code: "6204.62.00", desc: "Women's trousers, cotton" },
      { code: "6211.43.00", desc: "Women's track suits, synthetic" },
      { code: "6217.10.00", desc: "Clothing accessories, other" },
      { code: "6301.20.00", desc: "Electric blankets" },
      { code: "6302.21.00", desc: "Bed linen, cotton, printed" },
      { code: "6302.60.00", desc: "Toilet/kitchen linen, terry, cotton" },
      { code: "6305.33.00", desc: "Sacks & bags, flexible, polyethylene/polypropylene" },
      { code: "6306.22.00", desc: "Tents, synthetic fibres" },
    ]
  },
  {
    id: "XII", title: "Footwear, Headgear & Umbrellas", chapters: "Ch. 64–67", emoji: "👟",
    codes: [
      { code: "6401.92.00", desc: "Waterproof footwear, rubber/plastic" },
      { code: "6402.19.00", desc: "Sports footwear, rubber/plastic" },
      { code: "6402.91.00", desc: "Footwear, rubber/plastic, ankle covering" },
      { code: "6402.99.00", desc: "Footwear, rubber/plastic, other" },
      { code: "6403.19.00", desc: "Sports footwear, leather uppers" },
      { code: "6403.51.00", desc: "Footwear, leather uppers, ankle covering" },
      { code: "6403.59.00", desc: "Footwear, leather uppers, other" },
      { code: "6404.11.00", desc: "Sports footwear, textile uppers" },
      { code: "6404.20.00", desc: "Footwear, textile uppers, rubber sole" },
      { code: "6405.20.00", desc: "Footwear, textile uppers, other sole" },
      { code: "6406.10.00", desc: "Uppers & parts thereof" },
      { code: "6506.10.00", desc: "Safety headgear (helmets)" },
      { code: "6506.99.00", desc: "Headgear, other" },
      { code: "6601.10.00", desc: "Garden & similar umbrellas" },
      { code: "6601.91.00", desc: "Umbrellas with telescopic shaft" },
    ]
  },
  {
    id: "XIII", title: "Stone, Plaster, Cement, Ceramics & Glass", chapters: "Ch. 68–70", emoji: "🪟",
    codes: [
      { code: "6802.21.00", desc: "Marble, travertine, alabaster, worked" },
      { code: "6802.23.00", desc: "Granite, cut or sawn" },
      { code: "6806.10.00", desc: "Slag wool & rock wool insulation" },
      { code: "6901.00.00", desc: "Bricks, blocks, tiles, siliceous" },
      { code: "6902.10.00", desc: "Refractory bricks, MgO/CaO/Cr" },
      { code: "6907.21.00", desc: "Ceramic tiles, absorption ≤0.5%" },
      { code: "6907.22.00", desc: "Ceramic tiles, absorption 0.5–10%" },
      { code: "6907.23.00", desc: "Ceramic tiles, absorption >10%" },
      { code: "6910.10.00", desc: "Ceramic sinks, wash basins, baths" },
      { code: "6911.10.00", desc: "Tableware of porcelain" },
      { code: "6912.00.00", desc: "Ceramic tableware, not porcelain" },
      { code: "7005.10.00", desc: "Float glass, non-wired, coloured/tinted" },
      { code: "7005.21.00", desc: "Float glass, non-wired, clear" },
      { code: "7013.22.00", desc: "Drinking glasses, lead crystal" },
      { code: "7013.49.00", desc: "Glassware for table/kitchen, other" },
      { code: "7019.14.00", desc: "Glass wool insulation products" },
    ]
  },
  {
    id: "XIV", title: "Precious Metals, Pearls & Jewellery", chapters: "Ch. 71", emoji: "💎",
    codes: [
      { code: "7101.21.00", desc: "Cultured pearls, worked" },
      { code: "7102.10.00", desc: "Diamonds, unsorted" },
      { code: "7102.31.00", desc: "Non-industrial diamonds, unworked" },
      { code: "7102.39.00", desc: "Non-industrial diamonds, worked" },
      { code: "7103.10.00", desc: "Precious stones, unworked/roughly" },
      { code: "7103.91.00", desc: "Rubies, sapphires, emeralds, worked" },
      { code: "7105.10.00", desc: "Diamond dust & powder" },
      { code: "7106.91.00", desc: "Silver, unwrought" },
      { code: "7106.92.00", desc: "Silver, semi-manufactured" },
      { code: "7108.12.00", desc: "Gold, non-monetary, unwrought" },
      { code: "7108.20.00", desc: "Gold, monetary" },
      { code: "7110.11.00", desc: "Platinum, unwrought" },
      { code: "7113.11.00", desc: "Jewellery of silver" },
      { code: "7113.19.00", desc: "Jewellery of other precious metal" },
      { code: "7114.11.00", desc: "Goldsmiths' articles of silver" },
      { code: "7116.20.00", desc: "Jewellery of precious/semi-precious stones" },
      { code: "7117.19.00", desc: "Imitation jewellery, base metal, other" },
      { code: "7117.90.00", desc: "Imitation jewellery, other materials" },
    ]
  },
  {
    id: "XV", title: "Base Metals & Articles of Base Metal", chapters: "Ch. 72–83", emoji: "⚙️",
    codes: [
      { code: "7206.10.00", desc: "Iron ingots, non-alloy" },
      { code: "7207.11.00", desc: "Semi-finished products, non-alloy iron" },
      { code: "7210.30.00", desc: "Flat-rolled iron/steel, zinc coated" },
      { code: "7213.10.00", desc: "Steel wire rod, iron" },
      { code: "7217.10.00", desc: "Wire of non-alloy steel, not coated" },
      { code: "7225.11.00", desc: "Flat-rolled silicon-electrical steel" },
      { code: "7228.30.00", desc: "Bars/rods of alloy steel, other" },
      { code: "7304.31.00", desc: "Seamless steel tubes, cold-drawn" },
      { code: "7306.30.00", desc: "Line pipe, welded, for oil/gas" },
      { code: "7318.15.00", desc: "Other screws, bolts, base metal" },
      { code: "7326.90.00", desc: "Articles of iron or steel, other" },
      { code: "7403.11.00", desc: "Copper, cathodes, refined" },
      { code: "7404.00.00", desc: "Copper waste & scrap" },
      { code: "7408.11.00", desc: "Copper wire, >6mm" },
      { code: "7601.10.00", desc: "Aluminium, not alloyed, unwrought" },
      { code: "7604.10.00", desc: "Aluminium bars & rods, not alloyed" },
      { code: "7606.12.00", desc: "Aluminium plates, alloy, rectangular" },
      { code: "7607.11.00", desc: "Aluminium foil, rolled, not backed" },
      { code: "7801.10.00", desc: "Refined lead, unwrought" },
      { code: "7901.11.00", desc: "Zinc, not alloyed, ≥99.99% pure" },
      { code: "8001.10.00", desc: "Tin, not alloyed, unwrought" },
      { code: "8105.20.00", desc: "Cobalt alloys, unwrought" },
      { code: "8302.41.00", desc: "Mountings, fittings for buildings" },
      { code: "8308.10.00", desc: "Hooks, eyes & eyelets of base metal" },
      { code: "8309.10.00", desc: "Crown corks of base metal" },
      { code: "8311.10.00", desc: "Coated electrodes for welding" },
    ]
  },
  {
    id: "XVI", title: "Machinery, Mechanical & Electrical Appliances", chapters: "Ch. 84–85", emoji: "💻",
    codes: [
      { code: "8408.20.00", desc: "Diesel engines for vehicles" },
      { code: "8411.11.00", desc: "Turbojets, thrust ≤25kN" },
      { code: "8414.30.00", desc: "Compressors for refrigeration" },
      { code: "8414.51.00", desc: "Table, floor, wall fans, motor ≤125W" },
      { code: "8415.10.00", desc: "Window/wall type AC units" },
      { code: "8418.10.00", desc: "Combined refrigerator-freezers" },
      { code: "8418.21.00", desc: "Household refrigerators, compression" },
      { code: "8419.89.00", desc: "Machinery for heat treatment, other" },
      { code: "8421.21.00", desc: "Water filtering/purifying machinery" },
      { code: "8422.11.00", desc: "Dishwashing machines, household" },
      { code: "8443.32.00", desc: "Inkjet printers" },
      { code: "8450.11.00", desc: "Household washing machines, ≤10kg" },
      { code: "8451.21.00", desc: "Drying machines, ≤10kg" },
      { code: "8467.11.00", desc: "Drills, pneumatic, for working metal" },
      { code: "8471.30.00", desc: "Portable digital computers <10kg" },
      { code: "8471.41.00", desc: "Other digital data processing units" },
      { code: "8471.49.00", desc: "Computer systems, other" },
      { code: "8473.30.00", desc: "Parts & accessories for computers" },
      { code: "8481.80.00", desc: "Taps, cocks, valves, other" },
      { code: "8483.10.00", desc: "Transmission shafts & cranks" },
      { code: "8501.10.00", desc: "Electric motors, output ≤37.5W" },
      { code: "8501.52.00", desc: "AC motors, multi-phase, 750W–75kW" },
      { code: "8504.40.00", desc: "Static converters (inverters/UPS)" },
      { code: "8507.60.00", desc: "Lithium-ion batteries" },
      { code: "8507.80.00", desc: "Electric accumulators, other" },
      { code: "8515.11.00", desc: "Brazing or soldering machines" },
      { code: "8517.11.00", desc: "Line telephone sets, cordless" },
      { code: "8517.12.00", desc: "Telephones for cellular networks" },
      { code: "8517.62.00", desc: "Base stations for cellular networks" },
      { code: "8517.69.00", desc: "Apparatus for data transmission, other" },
      { code: "8518.21.00", desc: "Single loudspeakers, mounted" },
      { code: "8518.30.20", desc: "Headphones, earphones, combined" },
      { code: "8518.40.00", desc: "Audio-frequency electric amplifiers" },
      { code: "8521.90.00", desc: "Video recording/reproducing apparatus" },
      { code: "8523.51.00", desc: "Solid-state non-volatile storage" },
      { code: "8523.52.00", desc: "Smart cards" },
      { code: "8525.80.00", desc: "Digital cameras & camcorders" },
      { code: "8528.52.00", desc: "Monitors, LCD, capable of connecting to ADP" },
      { code: "8528.72.00", desc: "Color TV sets, LCD/LED" },
      { code: "8536.50.00", desc: "Switches for ≤1000V circuits" },
      { code: "8539.50.00", desc: "LED lamps" },
      { code: "8541.40.00", desc: "Photosensitive semiconductors (solar cells)" },
      { code: "8541.51.00", desc: "Photovoltaic cells, assembled modules" },
      { code: "8542.31.00", desc: "Processors & controllers, ICs" },
      { code: "8542.32.00", desc: "Memory ICs" },
      { code: "8544.42.00", desc: "Electric conductors, ≤1000V, connectors" },
      { code: "8544.60.00", desc: "Electric conductors, >1000V" },
    ]
  },
  {
    id: "XVII", title: "Vehicles, Aircraft, Vessels & Transport", chapters: "Ch. 86–89", emoji: "🚗",
    codes: [
      { code: "8601.10.00", desc: "Rail locomotives, powered externally" },
      { code: "8609.00.00", desc: "Containers for multimodal transport" },
      { code: "8701.20.00", desc: "Road tractors for semi-trailers" },
      { code: "8702.10.00", desc: "Motor vehicles ≥10 persons, diesel" },
      { code: "8703.22.00", desc: "Motor cars, 1000cc–1500cc" },
      { code: "8703.23.00", desc: "Motor cars, 1500cc–3000cc" },
      { code: "8703.24.00", desc: "Motor cars, >3000cc" },
      { code: "8703.40.00", desc: "Motor cars, hybrid electric" },
      { code: "8703.80.00", desc: "Motor vehicles, fully electric" },
      { code: "8704.21.00", desc: "Trucks, diesel, GVW ≤5 tonnes" },
      { code: "8704.22.00", desc: "Trucks, diesel, GVW 5–20 tonnes" },
      { code: "8706.00.00", desc: "Chassis fitted with engines, motor vehicles" },
      { code: "8708.29.00", desc: "Parts of vehicle bodies, other" },
      { code: "8708.99.00", desc: "Parts & accessories for motor vehicles, other" },
      { code: "8711.20.00", desc: "Motorcycles, 50cc–250cc" },
      { code: "8711.50.00", desc: "Motorcycles, >800cc" },
      { code: "8711.60.00", desc: "Electric motorcycles" },
      { code: "8712.00.00", desc: "Bicycles, not motorized" },
      { code: "8713.90.00", desc: "Carriages for disabled persons, other" },
      { code: "8714.99.00", desc: "Parts for bicycles, other" },
      { code: "8716.10.00", desc: "Trailers for agricultural purposes" },
      { code: "8802.20.00", desc: "Aeroplanes, unladen weight ≤2 tonnes" },
      { code: "8802.30.00", desc: "Aeroplanes, unladen weight 2–15 tonnes" },
      { code: "8803.30.00", desc: "Parts of aeroplanes, other" },
      { code: "8806.21.00", desc: "Unmanned aircraft (drones), ≤250g" },
      { code: "8806.22.00", desc: "Unmanned aircraft (drones), 250g–7kg" },
      { code: "8901.10.00", desc: "Cruise ships, excursion boats" },
      { code: "8901.20.00", desc: "Tankers" },
      { code: "8906.10.00", desc: "Warships" },
    ]
  },
  {
    id: "XVIII", title: "Optical, Photographic, Medical & Musical Instruments", chapters: "Ch. 90–92", emoji: "🔬",
    codes: [
      { code: "9001.50.00", desc: "Spectacle lenses, other materials" },
      { code: "9003.11.00", desc: "Frames for spectacles, plastic" },
      { code: "9003.19.00", desc: "Frames for spectacles, other" },
      { code: "9004.10.00", desc: "Sunglasses" },
      { code: "9006.53.00", desc: "Digital cameras, other" },
      { code: "9013.80.00", desc: "Liquid crystal devices, other" },
      { code: "9014.10.00", desc: "Direction finding compasses" },
      { code: "9015.10.00", desc: "Rangefinders" },
      { code: "9018.11.00", desc: "Electrocardiographs" },
      { code: "9018.19.00", desc: "Electro-medical apparatus, other" },
      { code: "9018.90.00", desc: "Medical/surgical instruments, other" },
      { code: "9019.10.00", desc: "Mechano-therapy/massage appliances" },
      { code: "9021.10.00", desc: "Orthopaedic appliances" },
      { code: "9021.31.00", desc: "Artificial joints" },
      { code: "9021.39.00", desc: "Orthopaedic/surgical implants, other" },
      { code: "9025.11.00", desc: "Thermometers, liquid-filled, non-electronic" },
      { code: "9026.10.00", desc: "Flow/level measurement instruments" },
      { code: "9027.10.00", desc: "Gas or smoke analysers" },
      { code: "9032.10.00", desc: "Thermostats" },
      { code: "9101.11.00", desc: "Wrist-watches, mechanical, automatic" },
      { code: "9102.11.00", desc: "Wrist-watches, mechanical, automatic (non-precious)" },
      { code: "9102.12.00", desc: "Wrist-watches, other, automatic" },
      { code: "9205.10.00", desc: "Brass-wind instruments" },
      { code: "9207.10.00", desc: "String musical instruments, electronic" },
      { code: "9209.30.00", desc: "Musical instrument strings" },
    ]
  },
  {
    id: "XIX", title: "Arms & Ammunition", chapters: "Ch. 93", emoji: "🛡️",
    codes: [
      { code: "9301.00.00", desc: "Military weapons (not sidearms)" },
      { code: "9302.00.00", desc: "Revolvers & pistols" },
      { code: "9303.20.00", desc: "Sporting shotguns, double-barrelled" },
      { code: "9303.30.00", desc: "Sporting, hunting rifles" },
      { code: "9305.10.00", desc: "Parts & accessories for revolvers/pistols" },
      { code: "9305.21.00", desc: "Shotgun barrels" },
      { code: "9306.21.00", desc: "Cartridges for shotguns" },
      { code: "9306.30.00", desc: "Other cartridges & parts" },
      { code: "9307.00.00", desc: "Swords, cutlasses, bayonets & similar" },
    ]
  },
  {
    id: "XX", title: "Miscellaneous Manufactured Articles", chapters: "Ch. 94–96", emoji: "🪑",
    codes: [
      { code: "9401.20.00", desc: "Seats for motor vehicles" },
      { code: "9401.61.00", desc: "Seats, upholstered, wooden frame" },
      { code: "9401.71.00", desc: "Seats, upholstered, metal frame" },
      { code: "9401.80.00", desc: "Seats, other" },
      { code: "9403.10.00", desc: "Metal furniture for offices" },
      { code: "9403.20.00", desc: "Metal furniture, other" },
      { code: "9403.30.00", desc: "Wooden furniture for offices" },
      { code: "9403.60.00", desc: "Wooden furniture, other" },
      { code: "9403.91.00", desc: "Parts of furniture, wood" },
      { code: "9404.21.00", desc: "Mattresses of foam rubber/plastic" },
      { code: "9404.29.00", desc: "Mattresses, other" },
      { code: "9405.11.00", desc: "Chandeliers & ceiling lighting, metal" },
      { code: "9405.40.80", desc: "Electric lamps, LED panels" },
      { code: "9405.50.00", desc: "Non-electrical lamps & lighting" },
      { code: "9503.00.00", desc: "Toys, scale models & similar" },
      { code: "9504.50.00", desc: "Video game consoles & machines" },
      { code: "9504.90.00", desc: "Video games, other" },
      { code: "9506.11.00", desc: "Skis & ski-fastenings" },
      { code: "9506.62.00", desc: "Inflatable balls" },
      { code: "9506.91.00", desc: "Articles for general physical exercise" },
      { code: "9507.10.00", desc: "Fishing rods" },
      { code: "9508.10.00", desc: "Travelling circuses & fairs" },
      { code: "9612.10.00", desc: "Typewriter/printer ribbons" },
      { code: "9613.10.00", desc: "Pocket lighters, gas fuelled" },
      { code: "9616.10.00", desc: "Perfume sprayers & mountings" },
      { code: "9619.00.00", desc: "Sanitary towels, tampons, nappies" },
    ]
  },
  {
    id: "XXI", title: "Works of Art, Collectors' Pieces & Antiques", chapters: "Ch. 97–99", emoji: "🎨",
    codes: [
      { code: "9701.10.00", desc: "Paintings & drawings, entirely hand-made" },
      { code: "9701.90.00", desc: "Collages, decorative plaques, other" },
      { code: "9702.00.00", desc: "Original engravings, prints & lithographs" },
      { code: "9703.10.00", desc: "Original sculptures & statuary, any material" },
      { code: "9704.00.00", desc: "Postage/revenue stamps, collections" },
      { code: "9705.11.00", desc: "Numismatic coins, gold" },
      { code: "9705.21.00", desc: "Collections of zoological specimens" },
      { code: "9706.00.00", desc: "Antiques of an age exceeding 100 years" },
    ]
  },
];

// Flat list derived from sections (for search & backward compatibility)
const hsCodesDB = hsSections.flatMap(s => s.codes);

// All available origin countries for new products (comprehensive world list, alphabetical)
const allCountries = Object.entries(originFlags)
  .map(([name, flag]) => ({ name, flag }))
  .sort((a, b) => a.name.localeCompare(b.name));

const productCategories = ["Electronics", "Food & Beverage", "Lighting", "Health", "Textiles", "Automotive", "Chemicals", "Machinery", "Furniture", "Other"];

export function TradeCompliance() {
  const [productId, setProductId] = useState("");
  const [origin, setOrigin] = useState("");
  const [originState, setOriginState] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [destCode, setDestCode] = useState("");
  const [notes, setNotes] = useState("");
  const [editingWorker, setEditingWorker] = useState<string | null>(null);
  const [workerState, setWorkerState] = useState(workers);
  const [aiScanning, setAiScanning] = useState(false);
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [showAI, setShowAI] = useState(false);
  const [selectedTierIdx, setSelectedTierIdx] = useState(0);
  const [customQty, setCustomQty] = useState<string>("");
  const [showTiers, setShowTiers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [expandedOfficer, setExpandedOfficer] = useState<string | null>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [productList, setProductList] = useState<Product[]>(products);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "", hsCode: "", category: "Electronics", basePrice: "", origins: [] as string[],
    regions: [] as OriginRegion[],
  });
  const [hsSearch, setHsSearch] = useState("");
  const [showHsDropdown, setShowHsDropdown] = useState(false);
  const [hsSection, setHsSection] = useState<string | null>(null);
  const hsInputRef = React.useRef<HTMLInputElement>(null);

  // Origin country management
  const [availableCountries, setAvailableCountries] = useState(allCountries);
  const [originSearch, setOriginSearch] = useState("");
  const [newCountryName, setNewCountryName] = useState("");
  const [expandedOrigin, setExpandedOrigin] = useState<string | null>(null);
  const [addingStateFor, setAddingStateFor] = useState<string | null>(null);
  const [newStateName, setNewStateName] = useState("");
  const [addingCityFor, setAddingCityFor] = useState<{ country: string; state: string } | null>(null);
  const [newCityName, setNewCityName] = useState("");

  const filteredCountries = originSearch.trim()
    ? availableCountries.filter(c => c.name.toLowerCase().includes(originSearch.toLowerCase()))
    : availableCountries;
  const canAddCustomCountry = originSearch.trim().length > 1 &&
    !availableCountries.some(c => c.name.toLowerCase() === originSearch.trim().toLowerCase());

  const filteredHsCodes = hsSearch.trim()
    ? hsCodesDB.filter(hs =>
        hs.code.includes(hsSearch) || hs.desc.toLowerCase().includes(hsSearch.toLowerCase())
      ).slice(0, 40)
    : [];

  const product = productList.find(p => p.id === productId) || null;
  const dest = destinations.find(d => d.code === destCode);

  // When product changes, auto-set origin to first listed country
  useEffect(() => {
    if (product) {
      setOrigin(product.origins[0] || "India");
      setOriginState("");
      setOriginCity("");
    }
  }, [productId]);

  // Reset state/city when origin country changes
  useEffect(() => {
    setOriginState("");
    setOriginCity("");
  }, [origin]);

  // Reset city when state changes
  useEffect(() => {
    setOriginCity("");
  }, [originState]);

  // Add/edit compliance rule state
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRuleIdx, setEditingRuleIdx] = useState<string | null>(null);
  const [lastRulesUpdate, setLastRulesUpdate] = useState<Date | null>(null);
  const [completingRuleIdx, setCompletingRuleIdx] = useState<number | null>(null);
  const [completionDocs, setCompletionDocs] = useState<{ name: string; size: string }[]>([]);
  const [completionNote, setCompletionNote] = useState("");
  const [newRule, setNewRule] = useState<{rule: string; side: "export" | "import"; due: string; description: string; estimatedTime: string; estimatedCost: string; legislations: { name: string; url: string }[]; newLegName: string; newLegUrl: string; documents: { name: string; size: string }[]}>({
    rule: "", side: "export", due: "", description: "", estimatedTime: "", estimatedCost: "", legislations: [], newLegName: "", newLegUrl: "", documents: []
  });

  // Compute
  const costs = product && destCode ? calcCosts(product.basePrice, destCode) : null;
  const baseCompliance = product && destCode ? getCompliance(product.category, destCode) : [];
  const [complianceOverrides, setComplianceOverrides] = useState<ComplianceItem[]>([]);
  const [complianceKey, setComplianceKey] = useState("");

  // Sync compliance state when product/dest changes
  const currentKey = `${product?.id}-${destCode}`;
  if (currentKey !== complianceKey && currentKey !== "-") {
    setComplianceOverrides(baseCompliance);
    setComplianceKey(currentKey);
  }
  const compliance = complianceKey ? complianceOverrides : baseCompliance;

  const docs = product && destCode ? getRequiredDocs(product.category, destCode) : [];
  const pending = compliance.filter(c => c.status !== "done").length;

  // Compliance CRUD helpers
  const addComplianceRule = () => {
    if (!newRule.rule.trim()) return;
    setComplianceOverrides(prev => [...prev, {
      rule: newRule.rule,
      status: "pending",
      due: newRule.due || "TBD",
      side: newRule.side,
      description: newRule.description || "Custom compliance requirement.",
      docs: newRule.documents.length > 0 ? newRule.documents : [],
      estimatedTime: newRule.estimatedTime || undefined,
      estimatedCost: newRule.estimatedCost || undefined,
      legislations: newRule.legislations.length > 0 ? newRule.legislations : undefined,
    }]);
    setNewRule({ rule: "", side: "export", due: "", description: "", estimatedTime: "", estimatedCost: "", legislations: [], newLegName: "", newLegUrl: "", documents: [] });
    setShowAddRule(false);
    setLastRulesUpdate(new Date());
  };

  const updateComplianceRule = (idx: number, field: keyof ComplianceItem, value: any) => {
    // Intercept status → "done" to open completion modal with doc attachment
    if (field === "status" && value === "done") {
      openCompletionModal(idx);
      return;
    }
    setComplianceOverrides(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    setLastRulesUpdate(new Date());
  };

  const deleteComplianceRule = (idx: number) => {
    setComplianceOverrides(prev => prev.filter((_, i) => i !== idx));
    setEditingRuleIdx(null);
    setExpandedRule(null);
    setLastRulesUpdate(new Date());
  };

  const uploadDocToRule = (idx: number, fileName: string, fileSize: string) => {
    setComplianceOverrides(prev => prev.map((c, i) => i === idx ? { ...c, docs: [...c.docs, { name: fileName, size: fileSize }] } : c));
    setLastRulesUpdate(new Date());
  };

  const removeDocFromRule = (ruleIdx: number, docIdx: number) => {
    setComplianceOverrides(prev => prev.map((c, i) => i === ruleIdx ? { ...c, docs: c.docs.filter((_, di) => di !== docIdx) } : c));
    setLastRulesUpdate(new Date());
  };

  const openCompletionModal = (idx: number) => {
    setCompletingRuleIdx(idx);
    setCompletionDocs(compliance[idx].completionDocs || []);
    setCompletionNote(compliance[idx].completionNote || "");
  };

  const confirmCompletion = () => {
    if (completingRuleIdx === null) return;
    setComplianceOverrides(prev => prev.map((c, i) => i === completingRuleIdx ? {
      ...c,
      status: "done" as const,
      completionDocs: completionDocs,
      completedAt: new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
      completionNote: completionNote,
    } : c));
    setCompletingRuleIdx(null);
    setCompletionDocs([]);
    setCompletionNote("");
    setLastRulesUpdate(new Date());
  };

  const ready = product && origin && destCode;

  const handleComplianceStatusToggle = (realIdx: number, currentStatus: string) => {
    if (currentStatus === "done") {
      updateComplianceRule(realIdx, "status", "pending");
    } else {
      openCompletionModal(realIdx);
    }
  };

  // Origin options based on selected product
  const getFlag = (name: string) => {
    const c = allCountries.find(c => c.name === name);
    return c?.flag || originFlags[name] || "🏳️";
  };
  const originOptions = product
    ? product.origins.map(o => ({ value: o, label: `${getFlag(o)}  ${o}`, sub: "Listed origin" }))
    : [];

  // State/city options derived from product regions for the selected origin
  const originRegion = product?.regions?.find(r => r.country === origin);
  const stateOptions = originRegion
    ? originRegion.states.map(s => ({ value: s.name, label: s.name, sub: `${s.cities.length} ${s.cities.length === 1 ? "city" : "cities"}` }))
    : [];
  const selectedState = originRegion?.states.find(s => s.name === originState);
  const cityOptions = selectedState
    ? selectedState.cities.map(c => ({ value: c, label: c, sub: "" }))
    : [];

  const runScan = useCallback(() => {
    setAiScanning(true);
    setShowAI(true);
    setTimeout(() => {
      setAlerts(product ? getAlerts(product.hsCode) : []);
      setAiScanning(false);
    }, 2200);
  }, [product]);

  const updateWorker = (id: string, field: string, val: string) => {
    setWorkerState(prev => prev.map(w => w.id === id ? { ...w, [field]: val } : w));
  };

  const alertColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    critical: { bg: "bg-[#E5484D]/8", text: "text-[#E5484D]", icon: <AlertTriangle size={12} /> },
    warning: { bg: "bg-[#FFB224]/8", text: "text-[#D97706]", icon: <AlertTriangle size={12} /> },
    info: { bg: "bg-[#0171E3]/8", text: "text-[#0171E3]", icon: <Globe size={12} /> },
    update: { bg: "bg-[#30A46C]/8", text: "text-[#30A46C]", icon: <RefreshCw size={12} /> },
  };

  return (
    <div className="max-w-[1100px] space-y-8">

      {/* ─── UNIFIED CARD: SENTENCE + HERO ANSWER ──────
       *  One single card that expands when all selections are made.
       * ──────────────────────────────────────────────── */}
      <motion.div
        className="bg-card rounded-[1.75rem] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_4px_24px_rgba(0,0,0,0.04)] relative"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 0.68, 0.36, 1] }}
        layout
      >
        {/* ─── THE SENTENCE ───────────────────────────── */}
        <div className="p-8 sm:p-10">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[0.625rem] text-muted-foreground/30 uppercase tracking-[0.1em]">Trade Compliance Center</p>
            <motion.button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/6 text-primary/60 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer text-[0.6875rem]"
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={12} />
              Add Product
            </motion.button>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-[1.125rem] sm:text-[1.25rem] text-muted-foreground/30 leading-relaxed">
            <span className="text-foreground/50">Ship</span>

            <InlineSelect
              value={productId}
              onChange={setProductId}
              placeholder="select product"
              options={productList.map(p => ({
                value: p.id,
                label: `${p.name}`,
                sub: `HS ${p.hsCode}  ·  $${p.basePrice.toFixed(2)} base`,
              }))}
            />

            <span className="text-foreground/50">from</span>

            <InlineSelect
              value={origin}
              onChange={setOrigin}
              placeholder="origin"
              options={originOptions}
            />

            {/* State selector — appears when selected origin has states */}
            {origin && stateOptions.length > 0 && (
              <>
                <span className="text-muted-foreground/20 text-[0.875rem]">·</span>
                <InlineSelect
                  value={originState}
                  onChange={setOriginState}
                  placeholder="state / province"
                  options={stateOptions}
                />
              </>
            )}

            {/* City selector — appears when selected state has cities */}
            {originState && cityOptions.length > 0 && (
              <>
                <span className="text-muted-foreground/20 text-[0.875rem]">·</span>
                <InlineSelect
                  value={originCity}
                  onChange={setOriginCity}
                  placeholder="city"
                  options={cityOptions}
                />
              </>
            )}

            <span className="text-foreground/50">to</span>

            <InlineSelect
              value={destCode}
              onChange={setDestCode}
              placeholder="destination"
              options={destinations.map(d => ({
                value: d.code,
                label: d.name,
                sub: d.flag,
              }))}
            />
          </div>

          {/* Quick context when product is selected */}
          {product && (
            <motion.div
              className="mt-5 pt-5 border-t border-black/[0.03] flex flex-wrap items-center gap-4 text-[0.6875rem] text-muted-foreground/35"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <span className="flex items-center gap-1.5">
                <Hash size={11} className="text-primary/40" />
                <span className="font-mono text-foreground/50">{product.hsCode}</span>
              </span>
              <span>·</span>
              <span>{product.category}</span>
              <span>·</span>
              <span className="tabular-nums text-foreground/45">${product.basePrice.toFixed(2)} base cost</span>
              {(originState || originCity) && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-primary/50">
                    <MapPin size={10} />
                    {originState}{originCity ? `, ${originCity}` : ""}
                  </span>
                </>
              )}
              {costs && (
                <>
                  <span>·</span>
                  <span className="text-primary/60 tabular-nums">${costs.total.toFixed(2)} landed</span>
                </>
              )}
            </motion.div>
          )}
        </div>

        {/* ─── ADD PRODUCT MODAL ─────────────────────── */}
        <AnimatePresence>
          {showAddProduct && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddProduct(false)}
              />
              <motion.div
                className="fixed inset-0 z-[61] flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
              <motion.div
                className="w-[520px] max-w-[calc(100vw-2rem)] bg-card rounded-[1.5rem] shadow-[0_16px_64px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden max-h-[85vh] flex flex-col pointer-events-auto"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                {/* Header (Sticky) */}
                <div className="px-6 sm:px-8 py-6 border-b border-black/[0.04] bg-card flex-shrink-0 z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Package size={16} className="text-primary/50" />
                    <p className="text-[0.9375rem] text-foreground/80">Add New Product</p>
                  </div>
                  <motion.button
                    onClick={() => setShowAddProduct(false)}
                    className="text-muted-foreground/30 hover:text-foreground/50 transition-colors cursor-pointer p-1"
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={16} />
                  </motion.button>
                </div>

                {/* Scrollable Body */}
                <div className="p-6 sm:p-8 overflow-y-auto pr-2 sm:pr-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/10 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                  <div className="space-y-4">
                    {/* Product name */}
                    <div>
                      <label className="text-[0.625rem] text-muted-foreground/30 uppercase tracking-widest mb-1.5 block">Product Name</label>
                      <input
                        value={newProduct.name}
                        onChange={(e) => setNewProduct(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Organic Turmeric Powder"
                        className="w-full px-4 py-3 rounded-xl bg-muted/10 text-[0.8125rem] text-foreground/70 placeholder:text-muted-foreground/20 border border-black/[0.03] focus:border-primary/15 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* HS Code — two-level section picker */}
                    <div className="relative">
                      <label className="text-[0.625rem] text-muted-foreground/30 uppercase tracking-widest mb-1.5 block">HS Code</label>

                      {/* Trigger */}
                      <div
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/10 border transition-colors ${
                          showHsDropdown ? "border-primary/15" : "border-black/[0.03]"
                        }`}
                      >
                        <Search size={13} className="text-muted-foreground/25 flex-shrink-0" />
                        <input
                          ref={hsInputRef}
                          type="text"
                          value={
                            showHsDropdown
                              ? hsSearch
                              : newProduct.hsCode
                                ? `${newProduct.hsCode} — ${hsCodesDB.find(h => h.code === newProduct.hsCode)?.desc || "Custom"}`
                                : ""
                          }
                          onChange={(e) => {
                            setHsSearch(e.target.value);
                            setHsSection(null);
                            if (!showHsDropdown) setShowHsDropdown(true);
                          }}
                          onFocus={() => {
                            setShowHsDropdown(true);
                            setHsSearch("");
                          }}
                          placeholder="Search all codes, or browse by section…"
                          className="bg-transparent text-[0.8125rem] text-foreground/70 placeholder:text-muted-foreground/20 focus:outline-none w-full"
                        />
                        {newProduct.hsCode && !showHsDropdown && (
                          <button
                            onClick={() => {
                              setNewProduct(p => ({ ...p, hsCode: "" }));
                              setHsSearch("");
                              setHsSection(null);
                              setShowHsDropdown(true);
                              hsInputRef.current?.focus();
                            }}
                            className="cursor-pointer flex-shrink-0"
                          >
                            <X size={12} className="text-muted-foreground/30" />
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {showHsDropdown && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => { setShowHsDropdown(false); setHsSection(null); }}
                            />
                            <motion.div
                              className="absolute top-full left-0 right-0 mt-1.5 bg-card rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.05)] z-40 overflow-hidden flex flex-col"
                              style={{ maxHeight: 296 }}
                              initial={{ opacity: 0, y: -6, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.98 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              {/* Breadcrumb bar — only shown when drilling into a section */}
                              <AnimatePresence>
                                {hsSection && !hsSearch.trim() && (
                                  <motion.div
                                    className="flex items-center gap-2 px-3 py-2 border-b border-black/[0.04] flex-shrink-0 bg-muted/5"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                  >
                                    <motion.button
                                      onClick={() => setHsSection(null)}
                                      className="flex items-center gap-1 text-[0.6875rem] text-primary/60 hover:text-primary transition-colors cursor-pointer"
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <ChevronLeft size={12} />
                                      All Sections
                                    </motion.button>
                                    <span className="text-muted-foreground/20 text-[0.625rem]">/</span>
                                    <span className="text-[0.6875rem] text-foreground/50 truncate flex items-center gap-1.5">
                                      <span>{hsSections.find(s => s.id === hsSection)?.emoji}</span>
                                      {hsSections.find(s => s.id === hsSection)?.title}
                                    </span>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Scrollable content */}
                              <div className="overflow-y-auto flex-1 py-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/10 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                                <AnimatePresence mode="wait">
                                  {hsSearch.trim() ? (
                                    /* ── SEARCH RESULTS (flat, across all sections) ── */
                                    <motion.div
                                      key="search"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.1 }}
                                    >
                                      {filteredHsCodes.length > 0 ? filteredHsCodes.map(hs => {
                                        const sec = hsSections.find(s => s.codes.some(c => c.code === hs.code));
                                        return (
                                          <motion.button
                                            key={hs.code}
                                            onClick={() => {
                                              const catMap: Record<string,string> = {"I":"Food & Beverage","II":"Food & Beverage","III":"Food & Beverage","IV":"Food & Beverage","V":"Chemicals","VI":"Chemicals","VII":"Chemicals","VIII":"Other","IX":"Other","X":"Other","XI":"Textiles","XII":"Textiles","XIII":"Other","XIV":"Other","XV":"Machinery","XVI":"Electronics","XVII":"Automotive","XVIII":"Health","XIX":"Other","XX":"Furniture","XXI":"Other"};
                                              setNewProduct(p => ({ ...p, hsCode: hs.code, category: catMap[sec?.id || ""] || "Other" }));
                                              setHsSearch("");
                                              setHsSection(null);
                                              setShowHsDropdown(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors ${
                                              newProduct.hsCode === hs.code ? "bg-primary/[0.06]" : "hover:bg-muted/15"
                                            }`}
                                            whileHover={{ x: 2 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                          >
                                            <span className="text-[0.8125rem] flex-shrink-0">{sec?.emoji || "📦"}</span>
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-2">
                                                <span className={`font-mono text-[0.75rem] flex-shrink-0 ${newProduct.hsCode === hs.code ? "text-primary" : "text-foreground/60"}`}>
                                                  {hs.code}
                                                </span>
                                              </div>
                                              <p className="text-[0.625rem] text-muted-foreground/40 truncate mt-0.5">{hs.desc}</p>
                                            </div>
                                            {newProduct.hsCode === hs.code && <Check size={12} className="text-primary flex-shrink-0" />}
                                          </motion.button>
                                        );
                                      }) : (
                                        <div className="px-4 py-4">
                                          <p className="text-[0.75rem] text-muted-foreground/25 text-center mb-2">No matches found</p>
                                          <motion.button
                                            onClick={() => {
                                              setNewProduct(p => ({ ...p, hsCode: hsSearch.trim() }));
                                              setShowHsDropdown(false);
                                              setHsSearch("");
                                              setHsSection(null);
                                            }}
                                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/6 text-primary/60 text-[0.6875rem] cursor-pointer hover:bg-primary/10 transition-colors"
                                            whileTap={{ scale: 0.97 }}
                                          >
                                            <Plus size={11} />
                                            Use custom code: <span className="font-mono ml-1">{hsSearch.trim()}</span>
                                          </motion.button>
                                        </div>
                                      )}
                                    </motion.div>
                                  ) : hsSection ? (
                                    /* ── SECTION CODES ── */
                                    <motion.div
                                      key={`section-${hsSection}`}
                                      initial={{ opacity: 0, x: 12 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: -12 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    >
                                      {(hsSections.find(s => s.id === hsSection)?.codes || []).map(hs => (
                                        <motion.button
                                          key={hs.code}
                                          onClick={() => {
                                            const catMap: Record<string,string> = {"I":"Food & Beverage","II":"Food & Beverage","III":"Food & Beverage","IV":"Food & Beverage","V":"Chemicals","VI":"Chemicals","VII":"Chemicals","VIII":"Other","IX":"Other","X":"Other","XI":"Textiles","XII":"Textiles","XIII":"Other","XIV":"Other","XV":"Machinery","XVI":"Electronics","XVII":"Automotive","XVIII":"Health","XIX":"Other","XX":"Furniture","XXI":"Other"};
                                            setNewProduct(p => ({ ...p, hsCode: hs.code, category: catMap[hsSection || ""] || "Other" }));
                                            setHsSearch("");
                                            setHsSection(null);
                                            setShowHsDropdown(false);
                                          }}
                                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors ${
                                            newProduct.hsCode === hs.code ? "bg-primary/[0.06]" : "hover:bg-muted/15"
                                          }`}
                                          whileHover={{ x: 2 }}
                                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        >
                                          <div className="min-w-0 flex-1">
                                            <span className={`font-mono text-[0.75rem] ${newProduct.hsCode === hs.code ? "text-primary" : "text-foreground/60"}`}>
                                              {hs.code}
                                            </span>
                                            <p className="text-[0.625rem] text-muted-foreground/40 mt-0.5 truncate">{hs.desc}</p>
                                          </div>
                                          {newProduct.hsCode === hs.code && <Check size={12} className="text-primary flex-shrink-0" />}
                                        </motion.button>
                                      ))}
                                    </motion.div>
                                  ) : (
                                    /* ── SECTION LIST (21 global sections) ── */
                                    <motion.div
                                      key="sections"
                                      initial={{ opacity: 0, x: -12 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: 12 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    >
                                      {hsSections.map(section => {
                                        const hasSelected = section.codes.some(c => c.code === newProduct.hsCode);
                                        return (
                                          <motion.button
                                            key={section.id}
                                            onClick={() => setHsSection(section.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors ${
                                              hasSelected ? "bg-primary/[0.04]" : "hover:bg-muted/15"
                                            }`}
                                            whileHover={{ x: 2 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                          >
                                            <span className="text-base flex-shrink-0 w-6 text-center">{section.emoji}</span>
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-2">
                                                <span className="font-mono text-[0.5625rem] text-primary/35 flex-shrink-0">§{section.id}</span>
                                                <span className={`text-[0.75rem] truncate ${hasSelected ? "text-primary/70" : "text-foreground/70"}`}>
                                                  {section.title}
                                                </span>
                                              </div>
                                              <p className="text-[0.5625rem] text-muted-foreground/25 mt-0.5">
                                                {section.chapters} · {section.codes.length} codes
                                              </p>
                                            </div>
                                            {hasSelected
                                              ? <Check size={11} className="text-primary flex-shrink-0" />
                                              : <ChevronRight size={12} className="text-muted-foreground/20 flex-shrink-0" />
                                            }
                                          </motion.button>
                                        );
                                      })}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>

                      {newProduct.hsCode && (
                        <motion.div
                          className="flex items-center gap-2 mt-1.5 flex-wrap"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Check size={10} className="text-[#30A46C]/60 flex-shrink-0" />
                          <span className="text-[0.5625rem] text-[#30A46C]/50">
                            HS {newProduct.hsCode} · {hsCodesDB.find(h => h.code === newProduct.hsCode)?.desc || "Custom code"}
                          </span>
                          <span className="text-[0.5625rem] text-primary/50 bg-primary/6 px-2 py-0.5 rounded-full border border-primary/10 font-medium">
                            {newProduct.category}
                          </span>
                        </motion.div>
                      )}
                    </div>

                    {/* Base Price */}
                    <div>
                      <label className="text-[0.625rem] text-muted-foreground/30 uppercase tracking-widest mb-1.5 block">Base Price (USD)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newProduct.basePrice}
                        onChange={(e) => setNewProduct(p => ({ ...p, basePrice: e.target.value }))}
                        placeholder="0.00"
                        className="w-full px-4 py-3 rounded-xl bg-muted/10 text-[0.8125rem] text-foreground/70 placeholder:text-muted-foreground/20 border border-black/[0.03] focus:border-primary/15 focus:outline-none tabular-nums transition-colors"
                      />
                    </div>

                    {/* Origin countries */}
                    <div>
                      <label className="text-[0.625rem] text-muted-foreground/30 uppercase tracking-widest mb-1.5 block">
                        Origin Countries <span className="text-muted-foreground/20 normal-case">(select or add where this product can ship from)</span>
                      </label>

                      {/* Search / Add country input */}
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/10 border border-black/[0.03] focus-within:border-primary/15 transition-colors mb-2">
                        <Search size={13} className="text-muted-foreground/25 flex-shrink-0" />
                        <input
                          value={originSearch}
                          onChange={(e) => setOriginSearch(e.target.value)}
                          placeholder="Search or type new country name…"
                          className="bg-transparent text-[0.8125rem] text-foreground/70 placeholder:text-muted-foreground/20 focus:outline-none w-full"
                        />
                        {originSearch && (
                          <button onClick={() => setOriginSearch("")} className="cursor-pointer flex-shrink-0">
                            <X size={12} className="text-muted-foreground/30" />
                          </button>
                        )}
                      </div>

                      {/* Country chips (filtered) */}
                      <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto py-1 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/10 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {filteredCountries.map(country => {
                          const isSelected = newProduct.origins.includes(country.name);
                          return (
                            <motion.button
                              key={country.name}
                              onClick={() => {
                                setNewProduct(p => ({
                                  ...p,
                                  origins: isSelected
                                    ? p.origins.filter(o => o !== country.name)
                                    : [...p.origins, country.name],
                                  regions: isSelected
                                    ? p.regions.filter(r => r.country !== country.name)
                                    : [...p.regions, { country: country.name, states: [] }],
                                }));
                                if (isSelected && expandedOrigin === country.name) setExpandedOrigin(null);
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] cursor-pointer transition-all border ${
                                isSelected
                                  ? "bg-primary/8 border-primary/15 text-primary"
                                  : "bg-muted/8 border-transparent text-muted-foreground/40 hover:text-foreground/50"
                              }`}
                              whileTap={{ scale: 0.95 }}
                            >
                              {(() => {
                                const cp1 = country.flag.codePointAt(0);
                                const cp2 = country.flag.codePointAt(cp1 && cp1 > 0xFFFF ? 2 : 1);
                                if (cp1 && cp2 && cp1 >= 0x1F1E6 && cp1 <= 0x1F1FF && cp2 >= 0x1F1E6 && cp2 <= 0x1F1FF) {
                                  const code = String.fromCharCode(cp1 - 0x1F1E6 + 97) + String.fromCharCode(cp2 - 0x1F1E6 + 97);
                                  return (
                                    <img 
                                      src={`https://flagcdn.com/w20/${code}.png`} 
                                      alt={country.name} 
                                      className="w-[14px] rounded-[1.5px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)] flex-shrink-0" 
                                    />
                                  );
                                }
                                return <span className="text-[0.8125rem] flex-shrink-0 leading-none">{country.flag}</span>;
                              })()}
                              <span className="truncate">{country.name}</span>
                              {isSelected && <Check size={10} className="text-primary flex-shrink-0" />}
                            </motion.button>
                          );
                        })}

                        {/* Add custom country button (appears when search doesn't match) */}
                        {canAddCustomCountry && (
                          <motion.button
                            onClick={() => {
                              const name = originSearch.trim();
                              const newC = { name, flag: "🏳️" };
                              setAvailableCountries(prev => [...prev, newC]);
                              setNewProduct(p => ({
                                ...p,
                                origins: [...p.origins, name],
                                regions: [...p.regions, { country: name, states: [] }],
                              }));
                              originFlags[name] = "🏳️";
                              setOriginSearch("");
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] cursor-pointer transition-all border border-dashed border-primary/20 bg-primary/4 text-primary/60 hover:bg-primary/8"
                            whileTap={{ scale: 0.95 }}
                          >
                            <Plus size={10} />
                            Add "{originSearch.trim()}"
                          </motion.button>
                        )}
                      </div>

                      {newProduct.origins.length > 0 && (
                        <p className="text-[0.5625rem] text-primary/40 mt-1.5">
                          {newProduct.origins.length} {newProduct.origins.length === 1 ? "country" : "countries"} selected
                        </p>
                      )}

                      {/* Selected origins with state/city sub-categories */}
                      <AnimatePresence>
                        {newProduct.origins.length > 0 && (
                          <motion.div
                            className="mt-3 space-y-1.5"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <p className="text-[0.5625rem] text-muted-foreground/25 uppercase tracking-widest mb-1">
                              Regional laws (optional — add states & cities)
                            </p>
                            <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/10 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                              {newProduct.origins.map(countryName => {
                                const region = newProduct.regions.find(r => r.country === countryName);
                                const isExpanded = expandedOrigin === countryName;
                                const flag = availableCountries.find(c => c.name === countryName)?.flag || originFlags[countryName] || "🏳️";

                                return (
                                  <motion.div
                                    key={countryName}
                                    className="rounded-xl border border-black/[0.04] bg-muted/5 overflow-hidden"
                                    layout
                                  >
                                    {/* Country header */}
                                    <motion.button
                                      onClick={() => setExpandedOrigin(isExpanded ? null : countryName)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer hover:bg-muted/10 transition-colors"
                                      whileTap={{ scale: 0.99 }}
                                    >
                                      <span className="text-[0.8125rem]">{flag}</span>
                                      <span className="text-[0.75rem] text-foreground/60 flex-1">{countryName}</span>
                                      {region && region.states.length > 0 && (
                                        <span className="text-[0.5625rem] text-primary/40 bg-primary/6 px-1.5 py-0.5 rounded-full">
                                          {region.states.length} {region.states.length === 1 ? "state" : "states"}
                                        </span>
                                      )}
                                      <motion.span
                                        animate={{ rotate: isExpanded ? 90 : 0 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                      >
                                        <ChevronRight size={11} className="text-muted-foreground/25" />
                                      </motion.span>
                                    </motion.button>

                                    {/* Expanded: states & cities */}
                                    <AnimatePresence>
                                      {isExpanded && (
                                        <motion.div
                                          className="px-3 pb-3 pt-1 border-t border-black/[0.03]"
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: "auto" }}
                                          exit={{ opacity: 0, height: 0 }}
                                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        >
                                          {/* Existing states */}
                                          {region?.states.map(st => (
                                            <div key={st.name} className="mt-1.5">
                                              <div className="flex items-center gap-2">
                                                <MapPin size={9} className="text-primary/30" />
                                                <span className="text-[0.6875rem] text-foreground/55">{st.name}</span>
                                                <button
                                                  onClick={() => setNewProduct(p => ({
                                                    ...p,
                                                    regions: p.regions.map(r =>
                                                      r.country === countryName
                                                        ? { ...r, states: r.states.filter(s => s.name !== st.name) }
                                                        : r
                                                    ),
                                                  }))}
                                                  className="cursor-pointer ml-auto"
                                                >
                                                  <X size={9} className="text-muted-foreground/20 hover:text-destructive/50 transition-colors" />
                                                </button>
                                              </div>

                                              {/* Cities under this state */}
                                              {st.cities.length > 0 && (
                                                <div className="ml-4 mt-1 flex flex-wrap gap-1">
                                                  {st.cities.map(city => (
                                                    <span key={city} className="flex items-center gap-1 text-[0.625rem] text-muted-foreground/40 bg-muted/10 px-2 py-0.5 rounded-md">
                                                      {city}
                                                      <button
                                                        onClick={() => setNewProduct(p => ({
                                                          ...p,
                                                          regions: p.regions.map(r =>
                                                            r.country === countryName
                                                              ? { ...r, states: r.states.map(s =>
                                                                  s.name === st.name
                                                                    ? { ...s, cities: s.cities.filter(c => c !== city) }
                                                                    : s
                                                                ) }
                                                              : r
                                                          ),
                                                        }))}
                                                        className="cursor-pointer"
                                                      >
                                                        <X size={7} className="text-muted-foreground/20 hover:text-destructive/40" />
                                                      </button>
                                                    </span>
                                                  ))}
                                                </div>
                                              )}

                                              {/* Add city input */}
                                              {addingCityFor?.country === countryName && addingCityFor?.state === st.name ? (
                                                <div className="ml-4 mt-1 flex items-center gap-1.5">
                                                  <input
                                                    autoFocus
                                                    value={newCityName}
                                                    onChange={e => setNewCityName(e.target.value)}
                                                    onKeyDown={e => {
                                                      if (e.key === "Enter" && newCityName.trim()) {
                                                        setNewProduct(p => ({
                                                          ...p,
                                                          regions: p.regions.map(r =>
                                                            r.country === countryName
                                                              ? { ...r, states: r.states.map(s =>
                                                                  s.name === st.name
                                                                    ? { ...s, cities: [...s.cities, newCityName.trim()] }
                                                                    : s
                                                                ) }
                                                              : r
                                                          ),
                                                        }));
                                                        setNewCityName("");
                                                        setAddingCityFor(null);
                                                      } else if (e.key === "Escape") {
                                                        setNewCityName("");
                                                        setAddingCityFor(null);
                                                      }
                                                    }}
                                                    placeholder="City name…"
                                                    className="px-2 py-1 rounded-md bg-muted/10 text-[0.625rem] text-foreground/60 placeholder:text-muted-foreground/20 border border-black/[0.03] focus:border-primary/15 focus:outline-none w-28"
                                                  />
                                                  <button
                                                    onClick={() => {
                                                      if (newCityName.trim()) {
                                                        setNewProduct(p => ({
                                                          ...p,
                                                          regions: p.regions.map(r =>
                                                            r.country === countryName
                                                              ? { ...r, states: r.states.map(s =>
                                                                  s.name === st.name
                                                                    ? { ...s, cities: [...s.cities, newCityName.trim()] }
                                                                    : s
                                                                ) }
                                                              : r
                                                          ),
                                                        }));
                                                        setNewCityName("");
                                                        setAddingCityFor(null);
                                                      }
                                                    }}
                                                    className="text-[0.625rem] text-primary/50 cursor-pointer hover:text-primary/70"
                                                  >
                                                    <Check size={10} />
                                                  </button>
                                                  <button
                                                    onClick={() => { setNewCityName(""); setAddingCityFor(null); }}
                                                    className="text-[0.625rem] text-muted-foreground/25 cursor-pointer"
                                                  >
                                                    <X size={10} />
                                                  </button>
                                                </div>
                                              ) : (
                                                <button
                                                  onClick={() => setAddingCityFor({ country: countryName, state: st.name })}
                                                  className="ml-4 mt-1 flex items-center gap-1 text-[0.5625rem] text-primary/35 hover:text-primary/55 cursor-pointer transition-colors"
                                                >
                                                  <Plus size={8} /> Add city
                                                </button>
                                              )}
                                            </div>
                                          ))}

                                          {/* Add state input */}
                                          {addingStateFor === countryName ? (
                                            <div className="mt-2 flex items-center gap-1.5">
                                              <input
                                                autoFocus
                                                value={newStateName}
                                                onChange={e => setNewStateName(e.target.value)}
                                                onKeyDown={e => {
                                                  if (e.key === "Enter" && newStateName.trim()) {
                                                    setNewProduct(p => ({
                                                      ...p,
                                                      regions: p.regions.map(r =>
                                                        r.country === countryName
                                                          ? { ...r, states: [...r.states, { name: newStateName.trim(), cities: [] }] }
                                                          : r
                                                      ),
                                                    }));
                                                    setNewStateName("");
                                                    setAddingStateFor(null);
                                                  } else if (e.key === "Escape") {
                                                    setNewStateName("");
                                                    setAddingStateFor(null);
                                                  }
                                                }}
                                                placeholder="State / Province name…"
                                                className="px-2.5 py-1.5 rounded-lg bg-muted/10 text-[0.6875rem] text-foreground/60 placeholder:text-muted-foreground/20 border border-black/[0.03] focus:border-primary/15 focus:outline-none flex-1"
                                              />
                                              <motion.button
                                                onClick={() => {
                                                  if (newStateName.trim()) {
                                                    setNewProduct(p => ({
                                                      ...p,
                                                      regions: p.regions.map(r =>
                                                        r.country === countryName
                                                          ? { ...r, states: [...r.states, { name: newStateName.trim(), cities: [] }] }
                                                          : r
                                                      ),
                                                    }));
                                                    setNewStateName("");
                                                    setAddingStateFor(null);
                                                  }
                                                }}
                                                className="text-primary/50 cursor-pointer hover:text-primary/70"
                                                whileTap={{ scale: 0.9 }}
                                              >
                                                <Check size={12} />
                                              </motion.button>
                                              <button
                                                onClick={() => { setNewStateName(""); setAddingStateFor(null); }}
                                                className="text-muted-foreground/25 cursor-pointer"
                                              >
                                                <X size={12} />
                                              </button>
                                            </div>
                                          ) : (
                                            <motion.button
                                              onClick={() => setAddingStateFor(countryName)}
                                              className="mt-2 flex items-center gap-1.5 text-[0.625rem] text-primary/40 hover:text-primary/60 cursor-pointer transition-colors"
                                              whileTap={{ scale: 0.97 }}
                                            >
                                              <Plus size={9} />
                                              Add state / province
                                            </motion.button>
                                          )}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Actions (Sticky) */}
                  <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-black/[0.04] bg-card sticky bottom-0 z-10 pb-2">
                    <motion.button
                      onClick={() => setShowAddProduct(false)}
                      className="px-4 py-2.5 rounded-xl text-[0.8125rem] text-muted-foreground/40 hover:text-foreground/60 cursor-pointer transition-colors"
                      whileTap={{ scale: 0.97 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        if (!newProduct.name || !newProduct.hsCode || !newProduct.basePrice || newProduct.origins.length === 0) return;
                        const id = `P${String(productList.length + 1).padStart(3, "0")}`;
                        const created: Product = {
                          id,
                          name: newProduct.name,
                          hsCode: newProduct.hsCode,
                          category: newProduct.category,
                          basePrice: parseFloat(newProduct.basePrice),
                          origins: newProduct.origins,
                          regions: newProduct.regions.filter(r => r.states.length > 0),
                        };
                        setProductList(prev => [...prev, created]);
                        setProductId(id);
                        setNewProduct({ name: "", hsCode: "", category: "Electronics", basePrice: "", origins: [], regions: [] });
                        setShowAddProduct(false);
                        setExpandedOrigin(null);
                        setOriginSearch("");
                      }}
                      disabled={!newProduct.name || !newProduct.hsCode || !newProduct.basePrice || newProduct.origins.length === 0}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.8125rem] cursor-pointer transition-all ${
                        newProduct.name && newProduct.hsCode && newProduct.basePrice && newProduct.origins.length > 0
                          ? "bg-primary text-white hover:bg-primary/90"
                          : "bg-muted/15 text-muted-foreground/25 cursor-not-allowed"
                      }`}
                      whileTap={newProduct.name && newProduct.hsCode && newProduct.basePrice && newProduct.origins.length > 0 ? { scale: 0.97 } : {}}
                    >
                      <Plus size={13} />
                      Add Product
                    </motion.button>
                  </div>
                </div>
              </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ─── HERO ANSWER (expands within same card) ── */}
        <AnimatePresence>
          {ready && costs && product && dest && (
            <motion.div
              key={`hero-${productId}-${origin}-${destCode}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="overflow-hidden"
            >
              {/* Divider */}
              <div className="mx-8 sm:mx-10 border-t border-black/[0.04]" />

              <div className="p-8 sm:p-10 relative">
                {/* Subtle glow */}
                <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(circle, rgba(1,113,227,0.05) 0%, transparent 70%)" }} />

                {/* Route strip */}
                <div className="flex items-center gap-3 mb-6 text-[0.75rem] text-muted-foreground/40">
                  <span className="flex items-center gap-1.5">
                    {getFlagUrl(origin) ? (
                      <img src={getFlagUrl(origin)!} alt={origin} className="w-[18px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                    ) : (
                      <span className="text-[1rem]">{originFlags[origin] || "🏳️"}</span>
                    )}
                    {origin}
                  </span>
                  <div className="flex items-center gap-1 text-muted-foreground/15">
                    <div className="w-5 h-[1.5px] bg-current rounded-full" />
                    <Ship size={12} />
                    <div className="w-5 h-[1.5px] bg-current rounded-full" />
                  </div>
                  <span className="flex items-center gap-1.5">
                    {getDestFlagUrl(destCode) ? (
                      <img src={getDestFlagUrl(destCode)!} alt={dest.name} className="w-[18px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                    ) : (
                      <span className="text-[1rem]">{dest.flag}</span>
                    )}
                    {dest.name}
                  </span>
                </div>

                {/* The hero number — responds to selected tier */}
                <div className="flex items-baseline gap-3 flex-wrap">
                  <motion.div
                    className="flex items-baseline gap-3"
                    key={`hero-${selectedTierIdx}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.12 }}
                  >
                    <span className="text-[4rem] sm:text-[5rem] lg:text-[5.5rem] tracking-[-0.04em] leading-[0.9] text-foreground/90 tabular-nums">
                      ${(costs.total * (1 - quantityTiers[selectedTierIdx].discount)).toFixed(2)}
                    </span>
                  </motion.div>
                </div>
                <p className="text-[0.75rem] text-muted-foreground/30 mt-2 mb-6">
                  landed cost per unit · {quantityTiers[selectedTierIdx].label}
                  {selectedTierIdx < quantityTiers.length - 1 && (
                    <span className="ml-2 text-[#30A46C]/50">
                      (lowest: ${(costs.total * (1 - quantityTiers[quantityTiers.length - 1].discount)).toFixed(2)} at {quantityTiers[quantityTiers.length - 1].label})
                    </span>
                  )}
                </p>

                {/* Compact quantity selector */}
                <div className="mb-6 relative">
                  <div className="flex items-center gap-3 mb-2.5">
                    <Package size={12} className="text-muted-foreground/25" />
                    <p className="text-[0.6875rem] text-muted-foreground/40">Quantity</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {quantityTiers.map((tier, idx) => {
                      const isSelected = selectedTierIdx === idx;
                      return (
                        <motion.button
                          key={tier.units}
                          onClick={() => setSelectedTierIdx(idx)}
                          className={`px-3 py-1.5 rounded-lg text-[0.625rem] cursor-pointer transition-all ${
                            isSelected
                              ? "bg-primary/8 text-primary border border-primary/15"
                              : "bg-muted/8 text-muted-foreground/40 border border-transparent hover:bg-muted/15 hover:text-foreground/50"
                          }`}
                          whileTap={{ scale: 0.96 }}
                        >
                          {tier.label}
                          {tier.discount > 0 && <span className="ml-1 text-[#30A46C]/60">-{(tier.discount * 100).toFixed(0)}%</span>}
                        </motion.button>
                      );
                    })}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/8 border border-transparent focus-within:border-primary/15 transition-colors">
                      <Hash size={9} className="text-muted-foreground/20" />
                      <input
                        type="number"
                        min="1"
                        value={customQty}
                        onChange={(e) => {
                          setCustomQty(e.target.value);
                          const qty = parseInt(e.target.value);
                          if (qty > 0) {
                            let bestIdx = 0;
                            for (let i = quantityTiers.length - 1; i >= 0; i--) {
                              if (qty >= quantityTiers[i].units) { bestIdx = i; break; }
                            }
                            setSelectedTierIdx(bestIdx);
                          }
                        }}
                        placeholder="Custom"
                        className="bg-transparent text-[0.625rem] text-foreground/50 placeholder:text-muted-foreground/20 focus:outline-none w-[60px] tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                {/* Cost flow — the story of the price */}
                <div className="flex flex-wrap items-center gap-3 text-[0.8125rem]">
                  <div className="px-4 py-2.5 rounded-xl bg-muted/20">
                    <p className="text-[0.5rem] text-muted-foreground/30 uppercase tracking-widest mb-0.5">Base</p>
                    <p className="tabular-nums text-foreground/60">${product.basePrice.toFixed(2)}</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground/15" />
                  <div className="px-4 py-2.5 rounded-xl bg-[#30A46C]/[0.05]">
                    <p className="text-[0.5rem] text-[#30A46C]/50 uppercase tracking-widest mb-0.5">+ Export</p>
                    <p className="tabular-nums text-[#30A46C]/70">${costs.exportCost.toFixed(2)}</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground/15" />
                  <div className="px-4 py-2.5 rounded-xl bg-[#D97706]/[0.05]">
                    <p className="text-[0.5rem] text-[#D97706]/50 uppercase tracking-widest mb-0.5">+ Import</p>
                    <p className="tabular-nums text-[#D97706]/70">${costs.importCost.toFixed(2)}</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground/15" />
                  <div className="px-4 py-2.5 rounded-xl bg-primary/[0.06] border border-primary/10">
                    <p className="text-[0.5rem] text-primary/50 uppercase tracking-widest mb-0.5">= Total</p>
                    <p className="tabular-nums text-primary">${(costs.total * (1 - quantityTiers[selectedTierIdx].discount)).toFixed(2)}</p>
                  </div>
                  <span className="text-[0.6875rem] text-muted-foreground/25 ml-1">+{(((costs.total * (1 - quantityTiers[selectedTierIdx].discount)) - product.basePrice) / product.basePrice * 100).toFixed(1)}%</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══════════════════════════════════════════════
       *  DETAIL CARDS (below the unified card)
       *  Only appears when all three selections are made
       * ═══════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {ready && costs && product && dest && (
          <motion.div
            key={`details-${productId}-${origin}-${destCode}`}
            className="space-y-5"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.1 }}
          >

            {/* ─── TWO COLUMNS: What you need + Who to call ── */}
            <div>

              {/* Compliance, Docs, Notes */}
              <div className="space-y-5">

                {/* Compliance checklist */}
                <motion.div
                  className="bg-card rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.02)]"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <Shield size={16} className={pending > 0 ? "text-[#D97706]" : "text-[#30A46C]"} />
                      <div>
                        <p className="text-[0.8125rem] text-foreground/70">Compliance Summary</p>
                        {lastRulesUpdate && (
                          <p className="text-[0.5rem] text-muted-foreground/30 flex items-center gap-1 mt-0.5">
                            <RefreshCw size={7} className="opacity-50" />
                            Last updated {lastRulesUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {lastRulesUpdate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => setShowAddRule(!showAddRule)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/6 text-primary/60 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer text-[0.5625rem]"
                        whileTap={{ scale: 0.95 }}
                      >
                        <Plus size={10} />
                        Add Rule
                      </motion.button>
                      <span className={`text-[0.6875rem] px-2.5 py-1 rounded-full ${
                        pending > 0 ? "bg-[#FFB224]/8 text-[#D97706]" : "bg-[#30A46C]/8 text-[#30A46C]"
                      }`}>
                        {pending > 0 ? `${pending} pending` : "All clear"}
                      </span>
                    </div>
                  </div>

                  {/* Add Rule Panel */}
                  <AnimatePresence>
                    {showAddRule && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="overflow-hidden mb-5"
                      >
                        <div className="rounded-xl border border-primary/10 bg-primary/[0.02] p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[0.6875rem] text-foreground/60">New Compliance Rule</p>
                            <motion.button onClick={() => setShowAddRule(false)} className="text-muted-foreground/30 hover:text-muted-foreground/60 cursor-pointer" whileTap={{ scale: 0.9 }}>
                              <X size={12} />
                            </motion.button>
                          </div>
                          <input
                            value={newRule.rule}
                            onChange={(e) => setNewRule(prev => ({ ...prev, rule: e.target.value }))}
                            placeholder="Rule name (e.g., REACH Compliance)"
                            className="w-full px-3 py-2 rounded-lg bg-card text-[0.75rem] text-foreground/70 border border-black/[0.04] focus:border-primary/15 focus:outline-none placeholder:text-muted-foreground/25"
                          />
                          <textarea
                            value={newRule.description}
                            onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Description..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg bg-card text-[0.6875rem] text-foreground/60 border border-black/[0.04] focus:border-primary/15 focus:outline-none resize-none placeholder:text-muted-foreground/25"
                          />
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="text-[0.5rem] text-muted-foreground/30 uppercase tracking-widest mb-1 block">Side</label>
                              <div className="flex gap-1">
                                <motion.button
                                  onClick={() => setNewRule(prev => ({ ...prev, side: "export" }))}
                                  className={`flex-1 py-1.5 rounded-lg text-[0.5625rem] cursor-pointer transition-colors ${
                                    newRule.side === "export" ? "bg-[#30A46C]/10 text-[#30A46C] border border-[#30A46C]/20" : "bg-muted/10 text-muted-foreground/40 border border-transparent"
                                  }`}
                                  whileTap={{ scale: 0.97 }}
                                >
                                  Export
                                </motion.button>
                                <motion.button
                                  onClick={() => setNewRule(prev => ({ ...prev, side: "import" }))}
                                  className={`flex-1 py-1.5 rounded-lg text-[0.5625rem] cursor-pointer transition-colors ${
                                    newRule.side === "import" ? "bg-[#0171E3]/10 text-[#0171E3] border border-[#0171E3]/20" : "bg-muted/10 text-muted-foreground/40 border border-transparent"
                                  }`}
                                  whileTap={{ scale: 0.97 }}
                                >
                                  Import
                                </motion.button>
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="text-[0.5rem] text-muted-foreground/30 uppercase tracking-widest mb-1 block">Due Date</label>
                              <input
                                value={newRule.due}
                                onChange={(e) => setNewRule(prev => ({ ...prev, due: e.target.value }))}
                                placeholder="e.g., Apr 30"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-card text-[0.6875rem] text-foreground/60 border border-black/[0.04] focus:border-primary/15 focus:outline-none placeholder:text-muted-foreground/25"
                              />
                            </div>
                          </div>
                          {/* Estimated Time & Cost */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="text-[0.5rem] text-muted-foreground/30 uppercase tracking-widest mb-1 flex items-center gap-1"><Timer size={8} className="opacity-40" />Est. Time</label>
                              <input
                                value={newRule.estimatedTime}
                                onChange={(e) => setNewRule(prev => ({ ...prev, estimatedTime: e.target.value }))}
                                placeholder="e.g., 3–5 business days"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-card text-[0.6875rem] text-foreground/60 border border-black/[0.04] focus:border-primary/15 focus:outline-none placeholder:text-muted-foreground/25"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[0.5rem] text-muted-foreground/30 uppercase tracking-widest mb-1 flex items-center gap-1"><DollarSign size={8} className="opacity-40" />Est. Cost</label>
                              <input
                                value={newRule.estimatedCost}
                                onChange={(e) => setNewRule(prev => ({ ...prev, estimatedCost: e.target.value }))}
                                placeholder="e.g., $250 – $400"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-card text-[0.6875rem] text-foreground/60 border border-black/[0.04] focus:border-primary/15 focus:outline-none placeholder:text-muted-foreground/25"
                              />
                            </div>
                          </div>
                          {/* Relevant Legislations */}
                          <div>
                            <label className="text-[0.5rem] text-muted-foreground/30 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Link2 size={8} className="opacity-40" />Relevant Legislations</label>
                            {newRule.legislations.length > 0 && (
                              <div className="space-y-1 mb-2">
                                {newRule.legislations.map((leg, li) => (
                                  <div key={li} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-card border border-black/[0.03]">
                                    <FileText size={10} className="text-primary/40 shrink-0" />
                                    <span className="text-[0.625rem] text-foreground/60 flex-1 truncate">{leg.name}</span>
                                    {leg.url && (
                                      <a href={leg.url} target="_blank" rel="noopener noreferrer" className="text-primary/40 hover:text-primary/70 shrink-0">
                                        <ExternalLink size={9} />
                                      </a>
                                    )}
                                    <motion.button
                                      onClick={() => setNewRule(prev => ({ ...prev, legislations: prev.legislations.filter((_, i) => i !== li) }))}
                                      className="text-muted-foreground/25 hover:text-red-400 cursor-pointer shrink-0"
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      <X size={9} />
                                    </motion.button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <input
                                value={newRule.newLegName}
                                onChange={(e) => setNewRule(prev => ({ ...prev, newLegName: e.target.value }))}
                                placeholder="Legislation name"
                                className="flex-1 px-2.5 py-1.5 rounded-lg bg-card text-[0.625rem] text-foreground/60 border border-black/[0.04] focus:border-primary/15 focus:outline-none placeholder:text-muted-foreground/25"
                              />
                              <input
                                value={newRule.newLegUrl}
                                onChange={(e) => setNewRule(prev => ({ ...prev, newLegUrl: e.target.value }))}
                                placeholder="URL (optional)"
                                className="flex-1 px-2.5 py-1.5 rounded-lg bg-card text-[0.625rem] text-foreground/60 border border-black/[0.04] focus:border-primary/15 focus:outline-none placeholder:text-muted-foreground/25"
                              />
                              <motion.button
                                onClick={() => {
                                  if (!newRule.newLegName.trim()) return;
                                  setNewRule(prev => ({
                                    ...prev,
                                    legislations: [...prev.legislations, { name: prev.newLegName.trim(), url: prev.newLegUrl.trim() }],
                                    newLegName: "",
                                    newLegUrl: "",
                                  }));
                                }}
                                disabled={!newRule.newLegName.trim()}
                                className="p-1.5 rounded-lg bg-primary/8 text-primary cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed shrink-0"
                                whileTap={{ scale: 0.92 }}
                              >
                                <Plus size={10} />
                              </motion.button>
                            </div>
                          </div>
                          {/* Document Upload */}
                          <div>
                            <label className="text-[0.5rem] text-muted-foreground/30 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Upload size={8} className="opacity-40" />Attach Documents</label>
                            {newRule.documents.length > 0 && (
                              <div className="space-y-1 mb-2">
                                {newRule.documents.map((doc, di) => (
                                  <div key={di} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-card border border-black/[0.03]">
                                    <FileText size={10} className="text-primary/40 shrink-0" />
                                    <span className="text-[0.625rem] text-foreground/60 flex-1 truncate">{doc.name}</span>
                                    <span className="text-[0.5rem] text-muted-foreground/30 shrink-0">{doc.size}</span>
                                    <motion.button
                                      onClick={() => setNewRule(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== di) }))}
                                      className="text-muted-foreground/25 hover:text-red-400 cursor-pointer shrink-0"
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      <X size={9} />
                                    </motion.button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <label className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-dashed border-primary/15 bg-primary/[0.02] cursor-pointer hover:bg-primary/[0.04] hover:border-primary/25 transition-colors group">
                              <Upload size={11} className="text-primary/30 group-hover:text-primary/50 transition-colors" />
                              <span className="text-[0.5625rem] text-muted-foreground/35 group-hover:text-muted-foreground/55 transition-colors">Choose files or drag & drop</span>
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (!files) return;
                                  const newDocs = Array.from(files).map(f => ({
                                    name: f.name,
                                    size: f.size < 1024 ? `${f.size} B`
                                      : f.size < 1048576 ? `${(f.size / 1024).toFixed(1)} KB`
                                      : `${(f.size / 1048576).toFixed(1)} MB`,
                                  }));
                                  setNewRule(prev => ({ ...prev, documents: [...prev.documents, ...newDocs] }));
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </div>
                          <div className="flex justify-end">
                            <motion.button
                              onClick={addComplianceRule}
                              disabled={!newRule.rule.trim()}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[0.625rem] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              whileTap={{ scale: 0.95 }}
                            >
                              <Plus size={10} />
                              Add Rule
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Route context strip */}
                  <div className="flex items-center gap-4 mb-5 px-3.5 py-2.5 rounded-xl bg-muted/8 border border-black/[0.02]">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight size={11} className="text-[#30A46C]/50" />
                      {getFlagUrl(origin) && (
                        <img src={getFlagUrl(origin)!} alt={origin} className="w-[16px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                      )}
                      <span className="text-[0.6875rem] text-foreground/50">{origin}</span>
                      <span className="text-[0.5rem] px-1.5 py-0.5 rounded-full bg-[#30A46C]/8 text-[#30A46C]/60">Origin</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground/15">
                      <div className="w-4 h-[1px] bg-current" />
                      <Ship size={10} />
                      <div className="w-4 h-[1px] bg-current" />
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowDownRight size={11} className="text-[#0171E3]/50" />
                      {getDestFlagUrl(destCode) && (
                        <img src={getDestFlagUrl(destCode)!} alt={dest.name} className="w-[16px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                      )}
                      <span className="text-[0.6875rem] text-foreground/50">{dest.name}</span>
                      <span className="text-[0.5rem] px-1.5 py-0.5 rounded-full bg-[#0171E3]/8 text-[#0171E3]/60">Destination</span>
                    </div>
                  </div>

                  {/* Overall progress */}
                  {(() => {
                    const total = compliance.length;
                    const done = compliance.filter(c => c.status === "done").length;
                    const overdue = compliance.filter(c => c.status === "overdue").length;
                    const pendingCount = compliance.filter(c => c.status === "pending").length;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[0.6875rem] text-foreground/50">Overall Readiness</span>
                          <span className={`text-[0.8125rem] tabular-nums ${pct === 100 ? "text-[#30A46C]" : "text-foreground/60"}`}>{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/15 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${pct === 100 ? "bg-[#30A46C]" : overdue > 0 ? "bg-[#FFB224]" : "bg-primary/50"}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ type: "spring", stiffness: 200, damping: 30, delay: 0.3 }}
                          />
                        </div>
                        <div className="flex items-center gap-4 mt-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#30A46C]" />
                            <span className="text-[0.5625rem] text-muted-foreground/40">{done} completed</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FFB224]" />
                            <span className="text-[0.5625rem] text-muted-foreground/40">{pendingCount} pending</span>
                          </div>
                          {overdue > 0 && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#E5484D]" />
                              <span className="text-[0.5625rem] text-muted-foreground/40">{overdue} overdue</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Side-by-side: Export (Origin) + Import (Destination) rules */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  {/* Export-side rules with inline docs */}
                  {(() => {
                    const exportItemsWithIdx = compliance.map((c, idx) => ({ ...c, _idx: idx })).filter(c => c.side === "export");
                    const exportDone = exportItemsWithIdx.filter(c => c.status === "done").length;
                    const exportPct = exportItemsWithIdx.length > 0 ? Math.round((exportDone / exportItemsWithIdx.length) * 100) : 100;
                    const exportWorker = workerState.find(w => w.side === "export");
                    return (
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-3 px-1">
                          <ArrowUpRight size={12} className="text-[#30A46C]/50" />
                          {getFlagUrl(origin) && (
                            <img src={getFlagUrl(origin)!} alt={origin} className="w-[14px] rounded-[1.5px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                          )}
                          <span className="text-[0.5625rem] text-[#30A46C]/60 uppercase tracking-widest">Origin — {origin}</span>
                          <span className="text-[0.5rem] tabular-nums text-[#30A46C]/50 ml-auto">{exportPct}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-[#30A46C]/8 mb-3 mx-1 overflow-hidden">
                          <motion.div className="h-full rounded-full bg-[#30A46C]/40" initial={{ width: 0 }} animate={{ width: `${exportPct}%` }} transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 30 }} />
                        </div>
                        <div className="space-y-2">
                          {exportItemsWithIdx.map((item) => {
                            const realIdx = item._idx;
                            const ruleKey = `rule-${realIdx}`;
                            const isExpanded = expandedRule === ruleKey;
                            const isEditingThis = editingRuleIdx === ruleKey;
                            return (
                              <motion.div
                                key={ruleKey}
                                layout
                                className={`rounded-xl transition-all overflow-hidden ${
                                  item.status !== "done"
                                    ? "bg-[#30A46C]/[0.03] border border-[#30A46C]/8"
                                    : "bg-muted/8 border border-transparent"
                                }`}
                              >
                                <motion.button
                                  onClick={() => { setExpandedRule(isExpanded ? null : ruleKey); if (isEditingThis) setEditingRuleIdx(null); }}
                                  className="w-full flex items-center gap-2 py-3 px-3.5 text-left cursor-pointer"
                                  whileTap={{ scale: 0.995 }}
                                >
                                  <motion.div
                                    onClick={(e) => { e.stopPropagation(); const next = item.status === "done" ? "pending" : item.status === "pending" ? "overdue" : "done"; updateComplianceRule(realIdx, "status", next); }}
                                    className="flex-shrink-0 cursor-pointer"
                                    whileTap={{ scale: 0.85 }}
                                    title="Click to cycle status"
                                  >
                                    {item.status === "done" ? (
                                      <CheckCircle2 size={13} className="text-[#30A46C]/60" />
                                    ) : item.status === "overdue" ? (
                                      <AlertTriangle size={13} className="text-[#E5484D]/60" />
                                    ) : (
                                      <Clock size={13} className="text-[#FFB224]/60" />
                                    )}
                                  </motion.div>
                                  <span className={`text-[0.75rem] flex-1 min-w-0 truncate ${item.status === "done" ? "text-muted-foreground/35" : "text-foreground/65"}`}>{item.rule}</span>
                                  <span className="text-[0.5rem] text-muted-foreground/25 flex-shrink-0">{item.due}</span>
                                  <ChevronDown size={11} className={`text-muted-foreground/20 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                </motion.button>
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-3.5 pb-3.5 pt-0.5">
                                        {/* Action bar */}
                                        <div className="flex items-center gap-1.5 mb-3">
                                          <motion.button
                                            onClick={() => setEditingRuleIdx(isEditingThis ? null : ruleKey)}
                                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[0.5rem] cursor-pointer transition-colors ${isEditingThis ? "bg-primary/10 text-primary" : "bg-muted/10 text-muted-foreground/40 hover:text-foreground/50"}`}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <Edit3 size={8} />
                                            {isEditingThis ? "Done" : "Edit"}
                                          </motion.button>
                                          <motion.button
                                            onClick={() => { const next = item.status === "done" ? "pending" : "done"; updateComplianceRule(realIdx, "status", next); }}
                                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[0.5rem] cursor-pointer transition-colors ${item.status === "done" ? "bg-[#30A46C]/10 text-[#30A46C]" : "bg-muted/10 text-muted-foreground/40 hover:text-[#30A46C]"}`}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <Check size={8} />
                                            {item.status === "done" ? "Completed" : "Mark Done"}
                                          </motion.button>
                                          <motion.button
                                            onClick={() => deleteComplianceRule(realIdx)}
                                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[0.5rem] cursor-pointer bg-muted/10 text-muted-foreground/30 hover:text-[#E5484D]/60 transition-colors ml-auto"
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <Trash2 size={8} />
                                          </motion.button>
                                        </div>
                                        {isEditingThis ? (
                                          <div className="space-y-2 mb-3">
                                            <input
                                              value={item.rule}
                                              onChange={(e) => updateComplianceRule(realIdx, "rule", e.target.value)}
                                              className="w-full px-2.5 py-1.5 rounded-lg bg-card text-[0.6875rem] text-foreground/60 border border-black/[0.04] focus:border-primary/15 focus:outline-none"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            <textarea
                                              value={item.description}
                                              onChange={(e) => updateComplianceRule(realIdx, "description", e.target.value)}
                                              rows={2}
                                              className="w-full px-2.5 py-1.5 rounded-lg bg-card text-[0.625rem] text-foreground/50 border border-black/[0.04] focus:border-primary/15 focus:outline-none resize-none"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            <div className="flex items-center gap-2">
                                              <div className="flex items-center gap-1.5 flex-1">
                                                <CalendarDays size={9} className="text-muted-foreground/25" />
                                                <input
                                                  value={item.due}
                                                  onChange={(e) => updateComplianceRule(realIdx, "due", e.target.value)}
                                                  className="flex-1 px-2 py-1 rounded-lg bg-card text-[0.625rem] text-foreground/50 border border-black/[0.04] focus:border-primary/15 focus:outline-none"
                                                  onClick={(e) => e.stopPropagation()}
                                                  placeholder="Due date"
                                                />
                                              </div>
                                              <select
                                                value={item.status}
                                                onChange={(e) => updateComplianceRule(realIdx, "status", e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="px-2 py-1 rounded-lg bg-card text-[0.625rem] text-foreground/50 border border-black/[0.04] focus:border-primary/15 focus:outline-none"
                                              >
                                                <option value="pending">Pending</option>
                                                <option value="done">Done</option>
                                                <option value="overdue">Overdue</option>
                                              </select>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <p className="text-[0.6875rem] text-muted-foreground/40 leading-relaxed mb-2">{item.description}</p>
                                            {(item.estimatedTime || item.estimatedCost) && (
                                              <div className="flex items-center gap-3 mb-2">
                                                {item.estimatedTime && (
                                                  <span className="flex items-center gap-1 text-[0.5625rem] text-muted-foreground/35">
                                                    <Timer size={9} className="opacity-50" />{item.estimatedTime}
                                                  </span>
                                                )}
                                                {item.estimatedCost && (
                                                  <span className="flex items-center gap-1 text-[0.5625rem] text-muted-foreground/35">
                                                    <DollarSign size={9} className="opacity-50" />{item.estimatedCost}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                            {item.legislations && item.legislations.length > 0 && (
                                              <div className="flex flex-wrap gap-1 mb-2">
                                                {item.legislations.map((leg, li) => (
                                                  <a
                                                    key={li}
                                                    href={leg.url || "#"}
                                                    target={leg.url ? "_blank" : undefined}
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/[0.04] text-[0.5625rem] text-primary/50 hover:text-primary/70 hover:bg-primary/[0.07] transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    <FileText size={8} />{leg.name}{leg.url && <ExternalLink size={7} className="opacity-40" />}
                                                  </a>
                                                ))}
                                              </div>
                                            )}
                                            {item.completedAt && item.status === "done" && (
                                              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#30A46C]/[0.04] border border-[#30A46C]/10 mb-2">
                                                <CheckCircle2 size={10} className="text-[#30A46C]/50 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                  <span className="text-[0.5625rem] text-[#30A46C]/60">Completed {item.completedAt}</span>
                                                  {item.completionNote && <p className="text-[0.5625rem] text-muted-foreground/35 mt-0.5 truncate">{item.completionNote}</p>}
                                                </div>
                                                {item.completionDocs && item.completionDocs.length > 0 && (
                                                  <span className="text-[0.5rem] text-[#30A46C]/40 flex items-center gap-0.5"><FileText size={8} />{item.completionDocs.length} doc{item.completionDocs.length > 1 ? "s" : ""}</span>
                                                )}
                                              </div>
                                            )}
                                          </>
                                        )}
                                        {item.status !== "done" && exportWorker && !isEditingThis && (
                                          <div className="flex items-center gap-2 mb-3">
                                            <div className="w-5 h-5 rounded-full bg-[#30A46C]/10 flex items-center justify-center text-[0.4375rem] text-[#30A46C] flex-shrink-0">
                                              {exportWorker.initials}
                                            </div>
                                            <span className="text-[0.5625rem] text-foreground/40">{exportWorker.name}</span>
                                            <span className="text-[0.5rem] text-muted-foreground/20">·</span>
                                            <span className="text-[0.5rem] text-muted-foreground/30">{exportWorker.role}</span>
                                          </div>
                                        )}
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between mb-1.5">
                                            <p className="text-[0.5rem] text-muted-foreground/25 uppercase tracking-widest">Documents</p>
                                            <label className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/6 text-primary/50 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer text-[0.5rem]">
                                              <Upload size={8} />
                                              Upload
                                              <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    const size = file.size < 1024 * 1024 ? `${Math.round(file.size / 1024)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
                                                    uploadDocToRule(realIdx, file.name, size);
                                                  }
                                                  e.target.value = "";
                                                }}
                                              />
                                            </label>
                                          </div>
                                          {item.docs.map((doc, di) => (
                                            <div key={di} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-card hover:bg-muted/10 transition-colors group">
                                              <FileText size={10} className="text-muted-foreground/25 flex-shrink-0" />
                                              <span className="text-[0.625rem] text-foreground/50 flex-1 min-w-0 truncate">{doc.name}</span>
                                              <span className="text-[0.5rem] text-muted-foreground/20 flex-shrink-0">{doc.size}</span>
                                              <motion.button className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0" whileTap={{ scale: 0.9 }}>
                                                <Download size={10} className="text-primary/40 hover:text-primary/70" />
                                              </motion.button>
                                              <motion.button
                                                onClick={() => removeDocFromRule(realIdx, di)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0"
                                                whileTap={{ scale: 0.9 }}
                                              >
                                                <Trash2 size={9} className="text-muted-foreground/25 hover:text-[#E5484D]/50" />
                                              </motion.button>
                                            </div>
                                          ))}
                                          {item.docs.length === 0 && (
                                            <p className="text-[0.5625rem] text-muted-foreground/20 text-center py-2">No documents yet</p>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                          {exportItemsWithIdx.length === 0 && (
                            <p className="text-[0.625rem] text-muted-foreground/25 text-center py-4">No export requirements</p>
                          )}
                        </div>

                      </div>
                    );
                  })()}

                  {/* Import-side rules with inline docs */}
                  {(() => {
                    const importItemsWithIdx = compliance.map((c, idx) => ({ ...c, _idx: idx })).filter(c => c.side === "import");
                    const importDone = importItemsWithIdx.filter(c => c.status === "done").length;
                    const importPct = importItemsWithIdx.length > 0 ? Math.round((importDone / importItemsWithIdx.length) * 100) : 100;
                    const importWorker = workerState.find(w => w.side === "import");
                    return (
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-3 px-1">
                          <ArrowDownRight size={12} className="text-[#0171E3]/50" />
                          {getDestFlagUrl(destCode) && (
                            <img src={getDestFlagUrl(destCode)!} alt={dest.name} className="w-[14px] rounded-[1.5px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                          )}
                          <span className="text-[0.5625rem] text-[#0171E3]/60 uppercase tracking-widest">Destination — {dest.name}</span>
                          <span className="text-[0.5rem] tabular-nums text-[#0171E3]/50 ml-auto">{importPct}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-[#0171E3]/8 mb-3 mx-1 overflow-hidden">
                          <motion.div className="h-full rounded-full bg-[#0171E3]/40" initial={{ width: 0 }} animate={{ width: `${importPct}%` }} transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 30 }} />
                        </div>
                        <div className="space-y-2">
                          {importItemsWithIdx.map((item) => {
                            const realIdx = item._idx;
                            const ruleKey = `rule-${realIdx}`;
                            const isExpanded = expandedRule === ruleKey;
                            const isEditingThis = editingRuleIdx === ruleKey;
                            return (
                              <motion.div
                                key={ruleKey}
                                layout
                                className={`rounded-xl transition-all overflow-hidden ${
                                  item.status !== "done"
                                    ? "bg-[#0171E3]/[0.03] border border-[#0171E3]/8"
                                    : "bg-muted/8 border border-transparent"
                                }`}
                              >
                                <motion.button
                                  onClick={() => { setExpandedRule(isExpanded ? null : ruleKey); if (isEditingThis) setEditingRuleIdx(null); }}
                                  className="w-full flex items-center gap-2 py-3 px-3.5 text-left cursor-pointer"
                                  whileTap={{ scale: 0.995 }}
                                >
                                  <motion.div
                                    onClick={(e) => { e.stopPropagation(); const next = item.status === "done" ? "pending" : item.status === "pending" ? "overdue" : "done"; updateComplianceRule(realIdx, "status", next); }}
                                    className="flex-shrink-0 cursor-pointer"
                                    whileTap={{ scale: 0.85 }}
                                    title="Click to cycle status"
                                  >
                                    {item.status === "done" ? (
                                      <CheckCircle2 size={13} className="text-[#30A46C]/60" />
                                    ) : item.status === "overdue" ? (
                                      <AlertTriangle size={13} className="text-[#E5484D]/60" />
                                    ) : (
                                      <Clock size={13} className="text-[#FFB224]/60" />
                                    )}
                                  </motion.div>
                                  <span className={`text-[0.75rem] flex-1 min-w-0 truncate ${item.status === "done" ? "text-muted-foreground/35" : "text-foreground/65"}`}>{item.rule}</span>
                                  <span className="text-[0.5rem] text-muted-foreground/25 flex-shrink-0">{item.due}</span>
                                  <ChevronDown size={11} className={`text-muted-foreground/20 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                </motion.button>
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-3.5 pb-3.5 pt-0.5">
                                        {/* Action bar */}
                                        <div className="flex items-center gap-1.5 mb-3">
                                          <motion.button
                                            onClick={() => setEditingRuleIdx(isEditingThis ? null : ruleKey)}
                                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[0.5rem] cursor-pointer transition-colors ${isEditingThis ? "bg-primary/10 text-primary" : "bg-muted/10 text-muted-foreground/40 hover:text-foreground/50"}`}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <Edit3 size={8} />
                                            {isEditingThis ? "Done" : "Edit"}
                                          </motion.button>
                                          <motion.button
                                            onClick={() => { const next = item.status === "done" ? "pending" : "done"; updateComplianceRule(realIdx, "status", next); }}
                                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[0.5rem] cursor-pointer transition-colors ${item.status === "done" ? "bg-[#30A46C]/10 text-[#30A46C]" : "bg-muted/10 text-muted-foreground/40 hover:text-[#30A46C]"}`}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <Check size={8} />
                                            {item.status === "done" ? "Completed" : "Mark Done"}
                                          </motion.button>
                                          <motion.button
                                            onClick={() => deleteComplianceRule(realIdx)}
                                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[0.5rem] cursor-pointer bg-muted/10 text-muted-foreground/30 hover:text-[#E5484D]/60 transition-colors ml-auto"
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <Trash2 size={8} />
                                          </motion.button>
                                        </div>
                                        {isEditingThis ? (
                                          <div className="space-y-2 mb-3">
                                            <input
                                              value={item.rule}
                                              onChange={(e) => updateComplianceRule(realIdx, "rule", e.target.value)}
                                              className="w-full px-2.5 py-1.5 rounded-lg bg-card text-[0.6875rem] text-foreground/60 border border-black/[0.04] focus:border-primary/15 focus:outline-none"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            <textarea
                                              value={item.description}
                                              onChange={(e) => updateComplianceRule(realIdx, "description", e.target.value)}
                                              rows={2}
                                              className="w-full px-2.5 py-1.5 rounded-lg bg-card text-[0.625rem] text-foreground/50 border border-black/[0.04] focus:border-primary/15 focus:outline-none resize-none"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            <div className="flex items-center gap-2">
                                              <div className="flex items-center gap-1.5 flex-1">
                                                <CalendarDays size={9} className="text-muted-foreground/25" />
                                                <input
                                                  value={item.due}
                                                  onChange={(e) => updateComplianceRule(realIdx, "due", e.target.value)}
                                                  className="flex-1 px-2 py-1 rounded-lg bg-card text-[0.625rem] text-foreground/50 border border-black/[0.04] focus:border-primary/15 focus:outline-none"
                                                  onClick={(e) => e.stopPropagation()}
                                                  placeholder="Due date"
                                                />
                                              </div>
                                              <select
                                                value={item.status}
                                                onChange={(e) => updateComplianceRule(realIdx, "status", e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="px-2 py-1 rounded-lg bg-card text-[0.625rem] text-foreground/50 border border-black/[0.04] focus:border-primary/15 focus:outline-none"
                                              >
                                                <option value="pending">Pending</option>
                                                <option value="done">Done</option>
                                                <option value="overdue">Overdue</option>
                                              </select>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <p className="text-[0.6875rem] text-muted-foreground/40 leading-relaxed mb-2">{item.description}</p>
                                            {(item.estimatedTime || item.estimatedCost) && (
                                              <div className="flex items-center gap-3 mb-2">
                                                {item.estimatedTime && (
                                                  <span className="flex items-center gap-1 text-[0.5625rem] text-muted-foreground/35">
                                                    <Timer size={9} className="opacity-50" />{item.estimatedTime}
                                                  </span>
                                                )}
                                                {item.estimatedCost && (
                                                  <span className="flex items-center gap-1 text-[0.5625rem] text-muted-foreground/35">
                                                    <DollarSign size={9} className="opacity-50" />{item.estimatedCost}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                            {item.legislations && item.legislations.length > 0 && (
                                              <div className="flex flex-wrap gap-1 mb-2">
                                                {item.legislations.map((leg, li) => (
                                                  <a
                                                    key={li}
                                                    href={leg.url || "#"}
                                                    target={leg.url ? "_blank" : undefined}
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/[0.04] text-[0.5625rem] text-primary/50 hover:text-primary/70 hover:bg-primary/[0.07] transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    <FileText size={8} />{leg.name}{leg.url && <ExternalLink size={7} className="opacity-40" />}
                                                  </a>
                                                ))}
                                              </div>
                                            )}
                                            {item.completedAt && item.status === "done" && (
                                              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#30A46C]/[0.04] border border-[#30A46C]/10 mb-2">
                                                <CheckCircle2 size={10} className="text-[#30A46C]/50 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                  <span className="text-[0.5625rem] text-[#30A46C]/60">Completed {item.completedAt}</span>
                                                  {item.completionNote && <p className="text-[0.5625rem] text-muted-foreground/35 mt-0.5 truncate">{item.completionNote}</p>}
                                                </div>
                                                {item.completionDocs && item.completionDocs.length > 0 && (
                                                  <span className="text-[0.5rem] text-[#30A46C]/40 flex items-center gap-0.5"><FileText size={8} />{item.completionDocs.length} doc{item.completionDocs.length > 1 ? "s" : ""}</span>
                                                )}
                                              </div>
                                            )}
                                          </>
                                        )}
                                        {item.status !== "done" && importWorker && !isEditingThis && (
                                          <div className="flex items-center gap-2 mb-3">
                                            <div className="w-5 h-5 rounded-full bg-[#0171E3]/10 flex items-center justify-center text-[0.4375rem] text-[#0171E3] flex-shrink-0">
                                              {importWorker.initials}
                                            </div>
                                            <span className="text-[0.5625rem] text-foreground/40">{importWorker.name}</span>
                                            <span className="text-[0.5rem] text-muted-foreground/20">·</span>
                                            <span className="text-[0.5rem] text-muted-foreground/30">{importWorker.role}</span>
                                          </div>
                                        )}
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between mb-1.5">
                                            <p className="text-[0.5rem] text-muted-foreground/25 uppercase tracking-widest">Documents</p>
                                            <label className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/6 text-primary/50 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer text-[0.5rem]">
                                              <Upload size={8} />
                                              Upload
                                              <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    const size = file.size < 1024 * 1024 ? `${Math.round(file.size / 1024)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
                                                    uploadDocToRule(realIdx, file.name, size);
                                                  }
                                                  e.target.value = "";
                                                }}
                                              />
                                            </label>
                                          </div>
                                          {item.docs.map((doc, di) => (
                                            <div key={di} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-card hover:bg-muted/10 transition-colors group">
                                              <FileText size={10} className="text-muted-foreground/25 flex-shrink-0" />
                                              <span className="text-[0.625rem] text-foreground/50 flex-1 min-w-0 truncate">{doc.name}</span>
                                              <span className="text-[0.5rem] text-muted-foreground/20 flex-shrink-0">{doc.size}</span>
                                              <motion.button className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0" whileTap={{ scale: 0.9 }}>
                                                <Download size={10} className="text-primary/40 hover:text-primary/70" />
                                              </motion.button>
                                              <motion.button
                                                onClick={() => removeDocFromRule(realIdx, di)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0"
                                                whileTap={{ scale: 0.9 }}
                                              >
                                                <Trash2 size={9} className="text-muted-foreground/25 hover:text-[#E5484D]/50" />
                                              </motion.button>
                                            </div>
                                          ))}
                                          {item.docs.length === 0 && (
                                            <p className="text-[0.5625rem] text-muted-foreground/20 text-center py-2">No documents yet</p>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                          {importItemsWithIdx.length === 0 && (
                            <p className="text-[0.625rem] text-muted-foreground/25 text-center py-4">No import requirements</p>
                          )}
                        </div>

                      </div>
                    );
                  })()}

                  </div>

                  {/* In-Charge Officers — full team management */}
                  <div className="mt-4 pt-4 border-t border-black/[0.03]">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <Users size={11} className="text-muted-foreground/25" />
                      <span className="text-[0.5rem] text-muted-foreground/25 uppercase tracking-widest">In-Charge Officers</span>
                      <span className="text-[0.5625rem] text-muted-foreground/20 px-1.5 py-0.5 rounded-full bg-muted/15 ml-1">
                        {workerState.length}
                      </span>
                      <div className="relative ml-auto">
                        <motion.button
                          onClick={() => setShowAddMember(!showAddMember)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/6 text-primary/60 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer text-[0.5625rem]"
                          whileTap={{ scale: 0.95 }}
                        >
                          <UserPlus size={10} />
                          Add
                        </motion.button>
                        <AnimatePresence>
                          {showAddMember && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowAddMember(false)} />
                              <motion.div
                                className="absolute top-full right-0 mt-2 w-[280px] bg-card rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] z-50 py-2 max-h-[320px] overflow-y-auto"
                                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              >
                                <p className="px-4 py-2 text-[0.5rem] text-muted-foreground/30 uppercase tracking-widest">Available employees</p>
                                {employeePool
                                  .filter(ep => !workerState.some(w => w.id === ep.id))
                                  .map((ep) => (
                                    <motion.button
                                      key={ep.id}
                                      onClick={() => {
                                        setWorkerState(prev => [...prev, ep]);
                                        setShowAddMember(false);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left cursor-pointer hover:bg-muted/15 transition-colors"
                                      whileHover={{ x: 2 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                      <div className="w-7 h-7 rounded-full bg-primary/8 flex items-center justify-center text-[0.5rem] text-primary/60 flex-shrink-0">
                                        {ep.initials}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[0.6875rem] text-foreground/70">{ep.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className="text-[0.5rem] text-muted-foreground/35">{ep.role}</span>
                                          <span className={`text-[0.4375rem] px-1 py-0.5 rounded-full ${
                                            ep.side === "export" ? "bg-[#30A46C]/8 text-[#30A46C]/60" : "bg-[#0171E3]/8 text-[#0171E3]/60"
                                          }`}>
                                            {ep.side}
                                          </span>
                                        </div>
                                      </div>
                                      <Plus size={11} className="text-primary/30 flex-shrink-0" />
                                    </motion.button>
                                  ))}
                                {employeePool.filter(ep => !workerState.some(w => w.id === ep.id)).length === 0 && (
                                  <p className="px-4 py-3 text-[0.625rem] text-muted-foreground/25 text-center">All employees added</p>
                                )}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
                      {workerState.map((w) => {
                        const isExpanded = expandedOfficer === w.id;
                        const isEditing = editingWorker === w.id;
                        const sideColor = w.side === "export" ? "#30A46C" : "#0171E3";
                        return (
                          <motion.div
                            key={w.id}
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl bg-muted/8 hover:bg-muted/12 border border-transparent transition-all overflow-hidden"
                          >
                            <motion.button
                              onClick={() => {
                                setExpandedOfficer(isExpanded ? null : w.id);
                                if (isEditing) setEditingWorker(null);
                              }}
                              className="w-full flex items-center gap-2.5 py-2.5 px-3 text-left cursor-pointer"
                              whileTap={{ scale: 0.995 }}
                            >
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[0.4375rem] flex-shrink-0"
                                style={{ backgroundColor: `${sideColor}10`, color: sideColor }}
                              >
                                {w.initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[0.625rem] text-foreground/55 truncate">{w.name}</span>
                                  <span
                                    className="text-[0.4375rem] px-1.5 py-0.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: `${sideColor}12`, color: `${sideColor}99` }}
                                  >
                                    {w.side === "export" ? "Export" : "Import"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[0.5rem] text-muted-foreground/30 truncate">{w.role}</span>
                                  <span className="flex items-center gap-0.5 text-[0.5rem] text-[#FFB224]/70">
                                    <Star size={7} fill="currentColor" />
                                    {w.rating}
                                  </span>
                                  <span className="text-[0.4375rem] text-muted-foreground/20">·</span>
                                  <span className="flex items-center gap-0.5 text-[0.5rem] text-muted-foreground/30">
                                    <Package size={7} />
                                    {w.ordersCompleted}
                                  </span>
                                </div>
                              </div>
                              {getFlagUrl(w.country) ? (
                                <img src={getFlagUrl(w.country)!} alt={w.country} className="w-[14px] rounded-[1.5px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)] flex-shrink-0" />
                              ) : (
                                <span className="text-[0.75rem] flex-shrink-0">{w.countryFlag}</span>
                              )}
                              <ChevronDown size={10} className={`text-muted-foreground/20 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </motion.button>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-3 pb-3 pt-0.5">
                                    <div className="flex items-center gap-2 mb-2.5">
                                      {getFlagUrl(w.country) ? (
                                        <img src={getFlagUrl(w.country)!} alt={w.country} className="w-[14px] rounded-[1.5px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                                      ) : (
                                        <span className="text-[0.75rem]">{w.countryFlag}</span>
                                      )}
                                      <span className="text-[0.5625rem] text-muted-foreground/40">{w.country}</span>
                                      <div className="ml-auto flex items-center gap-1">
                                        {!workers.some(orig => orig.id === w.id) && (
                                          <motion.button
                                            onClick={(e) => { e.stopPropagation(); setWorkerState(prev => prev.filter(pw => pw.id !== w.id)); setExpandedOfficer(null); }}
                                            className="text-muted-foreground/20 hover:text-[#E5484D]/50 transition-colors cursor-pointer p-1"
                                            whileTap={{ scale: 0.9 }}
                                            title="Remove"
                                          >
                                            <X size={10} />
                                          </motion.button>
                                        )}
                                        <motion.button
                                          onClick={(e) => { e.stopPropagation(); setEditingWorker(isEditing ? null : w.id); }}
                                          className="text-muted-foreground/25 hover:text-primary transition-colors cursor-pointer p-1"
                                          whileTap={{ scale: 0.9 }}
                                        >
                                          {isEditing ? <X size={10} /> : <Edit3 size={10} />}
                                        </motion.button>
                                      </div>
                                    </div>
                                    {isEditing ? (
                                      <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                          <Phone size={9} className="text-muted-foreground/20 flex-shrink-0" />
                                          <input
                                            value={w.phone}
                                            onChange={(e) => updateWorker(w.id, "phone", e.target.value)}
                                            className="flex-1 px-2 py-1 rounded-lg bg-card text-[0.625rem] text-foreground/60 border border-black/[0.04] focus:border-primary/15 focus:outline-none"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Mail size={9} className="text-muted-foreground/20 flex-shrink-0" />
                                          <input
                                            value={w.email}
                                            onChange={(e) => updateWorker(w.id, "email", e.target.value)}
                                            className="flex-1 px-2 py-1 rounded-lg bg-card text-[0.625rem] text-foreground/60 border border-black/[0.04] focus:border-primary/15 focus:outline-none"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                        <motion.button
                                          onClick={(e) => { e.stopPropagation(); setEditingWorker(null); }}
                                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/8 text-primary text-[0.5625rem] cursor-pointer"
                                          whileTap={{ scale: 0.95 }}
                                        >
                                          <Save size={9} />
                                          Save
                                        </motion.button>
                                      </div>
                                    ) : (
                                      <div className="space-y-1 text-[0.5625rem] text-muted-foreground/35">
                                        <p className="flex items-center gap-1.5"><Phone size={9} /> {w.phone}</p>
                                        <p className="flex items-center gap-1.5"><Mail size={9} /> {w.email}</p>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cost Breakdown — side by side */}
                  <div className="mt-4 pt-4 border-t border-black/[0.03]">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <DollarSign size={11} className="text-muted-foreground/25" />
                      <span className="text-[0.5rem] text-muted-foreground/25 uppercase tracking-widest">Cost Breakdown</span>
                      <span className="text-[0.5rem] tabular-nums text-primary/50 ml-auto">
                        ${(costs.total * (1 - quantityTiers[selectedTierIdx].discount)).toFixed(2)} / unit
                      </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
                      {/* Origin (Export) costs */}
                      <div className="rounded-xl bg-[#30A46C]/[0.03] border border-[#30A46C]/8 p-3.5">
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowUpRight size={11} className="text-[#30A46C]/50" />
                          {getFlagUrl(origin) && (
                            <img src={getFlagUrl(origin)!} alt={origin} className="w-[14px] rounded-[1.5px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                          )}
                          <span className="text-[0.5rem] text-[#30A46C]/60 uppercase tracking-widest">Origin — {origin}</span>
                        </div>
                        <div className="space-y-2">
                          {[
                            { label: "Quality Control", val: +(product.basePrice * 0.035).toFixed(2) },
                            { label: "Certification", val: +(product.basePrice * 0.04).toFixed(2) },
                            { label: "Documentation", val: 0.45 },
                            { label: "Packaging", val: +(product.basePrice * 0.055).toFixed(2) },
                          ].map((row, i) => (
                            <div key={i} className="flex items-center justify-between text-[0.625rem]">
                              <span className="text-muted-foreground/35">{row.label}</span>
                              <span className="tabular-nums text-[#30A46C]/60">${row.val.toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between text-[0.625rem] pt-2 border-t border-[#30A46C]/8">
                            <span className="text-foreground/45">Export Total</span>
                            <span className="tabular-nums text-[#30A46C]/80">${costs.exportCost.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Destination (Import) costs */}
                      <div className="rounded-xl bg-[#0171E3]/[0.03] border border-[#0171E3]/8 p-3.5">
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowDownRight size={11} className="text-[#0171E3]/50" />
                          {getDestFlagUrl(destCode) && (
                            <img src={getDestFlagUrl(destCode)!} alt={dest.name} className="w-[14px] rounded-[1.5px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                          )}
                          <span className="text-[0.5rem] text-[#0171E3]/60 uppercase tracking-widest">Destination — {dest.name}</span>
                        </div>
                        <div className="space-y-2">
                          {[
                            { label: "Customs Duty", val: costs.duty },
                            { label: "Freight & Insurance", val: costs.freight },
                            { label: "Clearance", val: costs.clearance },
                          ].map((row, i) => (
                            <div key={i} className="flex items-center justify-between text-[0.625rem]">
                              <span className="text-muted-foreground/35">{row.label}</span>
                              <span className="tabular-nums text-[#0171E3]/60">${row.val.toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between text-[0.625rem]">
                            <span className="text-muted-foreground/35">Tariff Rate</span>
                            <span className="text-[#0171E3]/50">{costs.tariffLabel}</span>
                          </div>
                          <div className="flex items-center justify-between text-[0.625rem] pt-2 border-t border-[#0171E3]/8">
                            <span className="text-foreground/45">Import Total</span>
                            <span className="tabular-nums text-[#0171E3]/80">${costs.importCost.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Landed cost total */}
                    <div className="flex items-center justify-between text-[0.6875rem] mt-3 px-1">
                      <span className="text-foreground/50">Landed Cost / Unit</span>
                      <span className="tabular-nums text-primary">${(costs.total * (1 - quantityTiers[selectedTierIdx].discount)).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* General trade documents */}
                  <div className="mt-4 pt-4 border-t border-black/[0.03]">
                    <div className="flex items-center gap-2 mb-2.5 px-1">
                      <FileText size={11} className="text-muted-foreground/25" />
                      <span className="text-[0.5rem] text-muted-foreground/25 uppercase tracking-widest">General Trade Documents</span>
                      <span className="text-[0.5rem] text-muted-foreground/20 ml-auto">{docs.length} docs</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {docs.map((doc, i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-muted/8 hover:bg-muted/15 transition-colors group">
                          <FileText size={10} className="text-muted-foreground/20 flex-shrink-0" />
                          <span className="text-[0.625rem] text-foreground/45 flex-1 min-w-0 truncate">{doc}</span>
                          <motion.button className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0" whileTap={{ scale: 0.9 }}>
                            <Download size={10} className="text-primary/40" />
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Notes */}
                <motion.div
                  className="bg-card rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.02)]"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <MessageSquare size={16} className="text-[#8B5CF6]/50" />
                    <p className="text-[0.8125rem] text-foreground/70">Notes</p>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes for this trade route..."
                    className="w-full min-h-[80px] p-4 rounded-xl bg-muted/10 text-[0.8125rem] text-foreground/60 placeholder:text-muted-foreground/20 border border-black/[0.02] focus:border-primary/12 focus:outline-none resize-y transition-colors"
                  />
                </motion.div>
              </div>

            </div>

            {/* ─── AI REGULATION MONITOR ──────────────── */}
            <motion.div
              className="bg-card rounded-2xl overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.02)]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Sparkles size={16} className="text-[#8B5CF6]/60" />
                    {alerts.some(a => a.isNew) && !aiScanning && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#E5484D]" />
                    )}
                  </div>
                  <p className="text-[0.8125rem] text-foreground/70">AI Regulation Monitor</p>
                  {alerts.filter(a => a.isNew).length > 0 && (
                    <span className="text-[0.5625rem] text-[#E5484D]/60 px-2 py-0.5 rounded-full bg-[#E5484D]/6">
                      {alerts.filter(a => a.isNew).length} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!showAI && alerts.length > 0 && (
                    <motion.button
                      onClick={() => setShowAI(true)}
                      className="text-[0.6875rem] text-muted-foreground/30 hover:text-foreground/50 cursor-pointer transition-colors"
                    >
                      Show {alerts.length} alerts
                    </motion.button>
                  )}
                  {showAI && (
                    <motion.button
                      onClick={() => setShowAI(false)}
                      className="text-[0.6875rem] text-muted-foreground/30 hover:text-foreground/50 cursor-pointer transition-colors"
                    >
                      Hide
                    </motion.button>
                  )}
                  <motion.button
                    onClick={runScan}
                    disabled={aiScanning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.6875rem] bg-[#8B5CF6]/6 text-[#8B5CF6]/60 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 transition-colors cursor-pointer"
                    whileTap={!aiScanning ? { scale: 0.95 } : {}}
                  >
                    <motion.span
                      animate={aiScanning ? { rotate: 360 } : {}}
                      transition={{ duration: 1.2, repeat: aiScanning ? Infinity : 0, ease: "linear" }}
                    >
                      <RefreshCw size={11} />
                    </motion.span>
                    {aiScanning ? "Scanning..." : "Scan"}
                  </motion.button>
                </div>
              </div>

              {/* Scanning bar */}
              {aiScanning && (
                <div className="px-6 pb-4">
                  <div className="h-1 rounded-full bg-[#8B5CF6]/8 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[#8B5CF6]/30"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2.2, ease: "easeInOut" }}
                    />
                  </div>
                  <p className="text-[0.5625rem] text-[#8B5CF6]/30 mt-2">
                    Checking HS {product.hsCode} regulations across jurisdictions...
                  </p>
                </div>
              )}

              {/* Alerts */}
              <AnimatePresence>
                {showAI && !aiScanning && (
                  <motion.div
                    className="px-6 pb-6"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-2">
                      {alerts.map((alert, i) => {
                        const cfg = alertColors[alert.type];
                        return (
                          <motion.div
                            key={alert.id}
                            className="flex items-start gap-3 p-4 rounded-xl bg-muted/8 hover:bg-muted/15 transition-colors"
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            <div className={`mt-0.5 p-1 rounded-md ${cfg.bg}`}>
                              <span className={cfg.text}>{cfg.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-[0.75rem] text-foreground/65">{alert.title}</p>
                                {alert.isNew && (
                                  <span className="text-[0.5rem] px-1.5 py-0.5 rounded-full bg-[#E5484D]/8 text-[#E5484D]/70 uppercase">new</span>
                                )}
                              </div>
                              <p className="text-[0.625rem] text-muted-foreground/35 leading-relaxed">{alert.description}</p>
                              <p className="text-[0.5625rem] text-muted-foreground/20 mt-1.5">
                                {alert.country} · {alert.time}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ COMPLIANCE COMPLETION MODAL ═══ */}
      <AnimatePresence>
        {completingRuleIdx !== null && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setCompletingRuleIdx(null); setCompletionDocs([]); setCompletionNote(""); }}
            />
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[90vw] bg-card rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] z-50 overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              <div className="px-6 pt-6 pb-4 border-b border-black/[0.04]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#30A46C]/10 flex items-center justify-center">
                      <CheckCircle2 size={16} className="text-[#30A46C]" />
                    </div>
                    <div>
                      <h3 className="text-[0.875rem] text-foreground/80">Mark as Completed</h3>
                      <p className="text-[0.625rem] text-muted-foreground/40 mt-0.5">{compliance[completingRuleIdx]?.rule}</p>
                    </div>
                  </div>
                  <motion.button onClick={() => { setCompletingRuleIdx(null); setCompletionDocs([]); setCompletionNote(""); }} className="text-muted-foreground/30 hover:text-muted-foreground/60 cursor-pointer p-1" whileTap={{ scale: 0.9 }}><X size={14} /></motion.button>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-[0.5625rem] text-muted-foreground/35 uppercase tracking-widest mb-1.5 block">Completion Notes</label>
                  <textarea value={completionNote} onChange={e => setCompletionNote(e.target.value)} placeholder="Describe what was done to fulfill this requirement..." rows={3} className="w-full px-3.5 py-2.5 rounded-xl bg-muted/10 text-[0.8125rem] text-foreground/60 placeholder:text-muted-foreground/25 border border-black/[0.04] focus:border-primary/15 focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="text-[0.5625rem] text-muted-foreground/35 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Upload size={8} className="opacity-40" />Attach Completion Documents</label>
                  <p className="text-[0.625rem] text-muted-foreground/30 mb-2">Upload certificates, test reports, or signed approvals.</p>
                  {completionDocs.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {completionDocs.map((doc, di) => (
                        <div key={di} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#30A46C]/[0.04] border border-[#30A46C]/10">
                          <FileText size={11} className="text-[#30A46C]/50 flex-shrink-0" />
                          <span className="text-[0.6875rem] text-foreground/55 flex-1 truncate">{doc.name}</span>
                          <span className="text-[0.5625rem] text-muted-foreground/30 flex-shrink-0">{doc.size}</span>
                          <motion.button onClick={() => setCompletionDocs(prev => prev.filter((_, i) => i !== di))} className="text-muted-foreground/25 hover:text-[#E5484D]/50 cursor-pointer flex-shrink-0" whileTap={{ scale: 0.9 }}><X size={10} /></motion.button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-3.5 py-3 rounded-xl border border-dashed border-[#30A46C]/20 bg-[#30A46C]/[0.02] cursor-pointer hover:bg-[#30A46C]/[0.04] hover:border-[#30A46C]/30 transition-colors group">
                    <Upload size={13} className="text-[#30A46C]/30 group-hover:text-[#30A46C]/50 transition-colors" />
                    <span className="text-[0.6875rem] text-muted-foreground/35 group-hover:text-muted-foreground/55 transition-colors">Choose files or drag & drop</span>
                    <input type="file" multiple className="hidden" onChange={(e) => { const files = e.target.files; if (!files) return; const newDocs = Array.from(files).map(f => ({ name: f.name, size: f.size < 1024 ? `${f.size} B` : f.size < 1048576 ? `${(f.size / 1024).toFixed(1)} KB` : `${(f.size / 1048576).toFixed(1)} MB` })); setCompletionDocs(prev => [...prev, ...newDocs]); e.target.value = ""; }} />
                  </label>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-black/[0.04] flex items-center justify-between">
                <p className="text-[0.5625rem] text-muted-foreground/25">{completionDocs.length === 0 ? "You can complete without documents" : `${completionDocs.length} document${completionDocs.length > 1 ? "s" : ""} attached`}</p>
                <div className="flex gap-2">
                  <motion.button onClick={() => { setCompletingRuleIdx(null); setCompletionDocs([]); setCompletionNote(""); }} className="px-4 py-2 rounded-xl text-[0.75rem] text-muted-foreground/50 hover:text-foreground/60 hover:bg-muted/15 transition-colors cursor-pointer" whileTap={{ scale: 0.95 }}>Cancel</motion.button>
                  <motion.button onClick={confirmCompletion} className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#30A46C] text-white text-[0.75rem] shadow-[0_1px_8px_rgba(48,164,108,0.2)] cursor-pointer" whileTap={{ scale: 0.95 }}><CheckCircle2 size={13} />Mark Completed</motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
