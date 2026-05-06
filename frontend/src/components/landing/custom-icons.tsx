"use client";

// Custom SVG icons extracted from Figma design for premium, platonic feel
// Each icon is a detailed line-art illustration matching the Vehsl brand

import svgPaths from "./imports/svg-9s54a6bmu5";

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const defaultProps = { size: 24, className: "text-[#56585D]", strokeWidth: 1 };

// ── MAIN CATEGORY ICONS (Navbar) ──────────────────────────────────────────

export function CarIcon({ size = 28, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" className={className}>
      <path d={svgPaths.p370c6580} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d={svgPaths.p25f5e900} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M11.4062 20.9896H18.5938" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d={svgPaths.p68985f2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

export function FactoryIcon({ size = 24, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <g clipPath="url(#factory-clip)" strokeWidth="1.2">
        <path d={svgPaths.p2754c900} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d={svgPaths.p1dc0a280} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d={svgPaths.p7a7f300} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d={svgPaths.pe26c0e0} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d={svgPaths.pae174a0} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d={svgPaths.pf228700} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d={svgPaths.p21fa1200} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d={svgPaths.p1fad4d00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d={svgPaths.p355fff00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d={svgPaths.p2a6a49c0} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1.45833 22.7822H22.5417" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d={svgPaths.pc0fed00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="factory-clip"><rect fill="white" height="24" width="24" /></clipPath>
      </defs>
    </svg>
  );
}

export function HammerIcon({ size = 24, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d={svgPaths.p38dbe000} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
      <path d={svgPaths.p3c42abc0} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  );
}

export function MonitorIcon({ size = 26, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path d={svgPaths.p10637300} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M9.52778 24.0625H18.4722" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M14 19.5903V24.0625" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export function CouchIcon({ size = 26, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 22 / 32)} viewBox="0 0 32 22" fill="none" className={className}>
      <path d={svgPaths.p342cec40} stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.6" />
      <path d={svgPaths.p29bd96c0} stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.6" />
      <path d={svgPaths.p25f54700} stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.6" />
      <path d="M4.0625 17.5828V15.9414" stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.6" />
      <path d="M26.7375 17.5828V15.9414" stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.6" />
    </svg>
  );
}

export function SolarPanelIcon({ size = 26, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path d={svgPaths.p18cee200} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M5.05556 3.9375H6.17361" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M21.8264 3.9375H22.9444" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M14 10.6458V11.7639" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d={svgPaths.p3fde1700} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d={svgPaths.p2a3cd140} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d={svgPaths.p2caf1a80} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M5.05556 19.5903H22.9444" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d={svgPaths.p321b8080} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d={svgPaths.p69a8e00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export function ShirtIcon({ size = 22, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 24 / 22)} viewBox="0 0 22 24" fill="none" className={className}>
      <path d={svgPaths.p28e8f680} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" />
      <path d="M6.33548 5.21541V1.82306" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" />
      <path d="M15.6644 5.21541V1.82306" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" />
    </svg>
  );
}

export function LipstickIcon({ size = 22, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 23.5 / 23)} viewBox="0 0 23.0012 23.502" fill="none" className={className}>
      <path d={svgPaths.p27bc4e00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.15" />
      <path d={svgPaths.p22634f80} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.15" />
      <path d={svgPaths.ped4b320} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.15" />
    </svg>
  );
}

export function MineCartIcon({ size = 20, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 19.45 / 18.58)} viewBox="0 0 18.5788 19.4527" fill="none" className={className}>
      <path d={svgPaths.p36de3180} stroke="currentColor" strokeWidth="0.93" />
      <path d={svgPaths.p2fc9a00} stroke="currentColor" strokeWidth="0.93" />
      <path d={svgPaths.p13af0c40} stroke="currentColor" strokeWidth="0.93" />
      <path d="M5.93523 16.5568H12.6436" stroke="currentColor" strokeWidth="0.93" />
      <path d={svgPaths.p1e26bbc0} stroke="currentColor" strokeWidth="0.93" />
    </svg>
  );
}

export function WheatIcon({ size = 20, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d={svgPaths.pb82cdc0} stroke="currentColor" strokeMiterlimit="10" />
      <path d={svgPaths.p1dad3680} stroke="currentColor" strokeMiterlimit="10" />
      <path d={svgPaths.p19b66d70} stroke="currentColor" strokeMiterlimit="10" />
      <path d={svgPaths.p295a2800} stroke="currentColor" strokeMiterlimit="10" />
      <path d={svgPaths.pbc69e00} stroke="currentColor" strokeMiterlimit="10" />
      <path d={svgPaths.p2f123d00} stroke="currentColor" strokeMiterlimit="10" />
      <path d={svgPaths.p3bb6ae00} stroke="currentColor" strokeMiterlimit="10" />
      <path d={svgPaths.p8bc4080} stroke="currentColor" strokeMiterlimit="10" />
    </svg>
  );
}

// ── VEHICLE SUBCATEGORY ICONS (2nd stage) ─────────────────────────────────

export function SuvIcon({ size = 60, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 41 / 60)} viewBox="0 0 61 35" fill="none" className={className}>
      <path d={svgPaths.p25a46700} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

export function SuvWheelFrontIcon({ size = 13, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 15 / 13)} viewBox="0 0 13 15" fill="none" className={className}>
      <path d={svgPaths.p255ff300} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function JeepIcon({ size = 50, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 31 / 50)} viewBox="0 0 50 31" fill="none" className={className}>
      <path d={svgPaths.p17ceb400} stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.4" />
    </svg>
  );
}

export function PickupTruckIcon({ size = 61, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 34 / 61)} viewBox="0 0 61 34" fill="none" className={className}>
      <path d={svgPaths.p23ca4700} stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.7" />
    </svg>
  );
}

export function MonsterTruckIcon({ size = 61, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 19.5 / 61)} viewBox="0 0 61 19.5" fill="none" className={className}>
      <path d={svgPaths.p33d0b080} stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.7" />
    </svg>
  );
}

export function VanIcon({ size = 60, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 36 / 60)} viewBox="0 0 60 36" fill="none" className={className}>
      <path d={svgPaths.p1ddf92e0} stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.7" />
    </svg>
  );
}

export function CaravanIcon({ size = 61, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 30 / 61)} viewBox="0 0 61 30" fill="none" className={className}>
      <path d={svgPaths.pc07c180} stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.7" />
    </svg>
  );
}

export function OpenRoofIcon({ size = 61, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 29.73 / 61)} viewBox="0 0 61 29.7298" fill="none" className={className}>
      <path d={svgPaths.p2a904c00} stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.7" />
    </svg>
  );
}

export function SportsCarIcon({ size = 61, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 18 / 61)} viewBox="0 0 61 18" fill="none" className={className}>
      <path d={svgPaths.p93e4c00} stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.7" />
    </svg>
  );
}

export function ExoticCarIcon({ size = 58, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 19 / 58)} viewBox="0 0 58 19" fill="none" className={className}>
      <path d={svgPaths.p3faf1d00} stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.6" />
    </svg>
  );
}

export function SedanIcon({ size = 61, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 26.44 / 61)} viewBox="0 0 61 26.4396" fill="none" className={className}>
      <path d={svgPaths.pfbee100} stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.7" />
    </svg>
  );
}

// ── 2nd stage transport icons from Figma ──────────────────────────────────

export function GreenCarIcon({ size = 30, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" className={className}>
      <path d={svgPaths.p20c9ca00} stroke="currentColor" strokeMiterlimit="10" />
      <path d={svgPaths.p273c0ef0} stroke="currentColor" strokeMiterlimit="10" />
      <path d="M19.4766 25.0664H9.41016" stroke="currentColor" strokeMiterlimit="10" />
      <path d={svgPaths.p37dee380} stroke="currentColor" strokeMiterlimit="10" />
      <path d="M22.8281 18.3516H10.5234" stroke="currentColor" strokeMiterlimit="10" />
      <path d="M16.1133 15V18.3516" stroke="currentColor" strokeMiterlimit="10" />
      <path d={svgPaths.pec7580} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DeliveryTruckIcon({ size = 30, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 32 / 34)} viewBox="0 0 34 32" fill="none" className={className}>
      <path d={svgPaths.p1cbcbe00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MotorcycleIcon({ size = 30, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" className={className}>
      <path d={svgPaths.p25e97c00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.pfdb6900} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p20a4c180} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p3f7fcd00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p3a29e700} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.pb6affc0} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ScooterIcon({ size = 30, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" className={className}>
      <path d={svgPaths.p1bcd5500} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p35ba1600} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p31b33a80} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p3586faa0} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShipIcon({ size = 28, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path d={svgPaths.p19701918} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p26460680} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p291cc180} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11.7639V16.2361" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2.81944V6.17361" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CementTruckIcon({ size = 30, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 28 / 30)} viewBox="0 0 30 28" fill="none" className={className}>
      <path d={svgPaths.p20f43f00} stroke="currentColor" strokeMiterlimit="10" />
      <path d={svgPaths.p37c2b700} stroke="currentColor" strokeMiterlimit="10" />
      <path d={svgPaths.p1f22ffc0} stroke="currentColor" strokeMiterlimit="10" />
      <path d="M23.9531 16.0891H27.3047" stroke="currentColor" strokeMiterlimit="10" />
      <path d={svgPaths.p23af34e8} stroke="currentColor" strokeMiterlimit="10" />
      <path d={svgPaths.pa1f9400} stroke="currentColor" strokeMiterlimit="10" />
      <path d={svgPaths.pfd392c0} stroke="currentColor" strokeMiterlimit="10" />
      <path d="M15 5.64375L11.6484 16.0891" stroke="currentColor" strokeMiterlimit="10" />
    </svg>
  );
}

export function HelicopterIcon({ size = 30, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path d={svgPaths.p9570800} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p14423000} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.2778 12.1667V8.33333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.05556 8.33333H26.2222" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p2e96ae40} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.8333 24.9444V21.1111" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24.9444 24.9444H14.7222" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DroneIcon({ size = 28, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <g clipPath="url(#drone-clip)">
        <path d={svgPaths.p194ec598} stroke="currentColor" strokeMiterlimit="10" />
        <path d={svgPaths.p2eb00780} stroke="currentColor" strokeMiterlimit="10" />
        <path d="M8.76094 12.95H1.42188" stroke="currentColor" strokeMiterlimit="10" />
        <path d="M26.5781 12.95H19.2391" stroke="currentColor" strokeMiterlimit="10" />
        <path d="M-0.933333 7.46667H10.2667" stroke="currentColor" strokeMiterlimit="10" />
        <path d="M17.7333 7.46667H28.9333" stroke="currentColor" strokeMiterlimit="10" />
        <path d="M4.57188 7.71094V12.95" stroke="currentColor" strokeMiterlimit="10" />
        <path d="M23.4391 7.71094V12.95" stroke="currentColor" strokeMiterlimit="10" />
        <path d={svgPaths.p3977df40} stroke="currentColor" strokeMiterlimit="10" />
        <path d={svgPaths.p2ebd55c0} stroke="currentColor" strokeMiterlimit="10" />
      </g>
      <defs>
        <clipPath id="drone-clip"><rect fill="white" height="28" rx="1" width="28" /></clipPath>
      </defs>
    </svg>
  );
}

export function EngineIcon({ size = 28, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path d="M3.9375 11.7639V18.4722" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 6.17361V9.52778" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.7639 6.17361H16.2361" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.17361 15.1181H3.9375" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p4bffa80} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RacingHelmetIcon({ size = 22, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className}>
      <path d={svgPaths.p24872000} stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.1" />
      <path d={svgPaths.p13f18540} stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.1" />
      <path d={svgPaths.p220a6000} stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.1" />
    </svg>
  );
}

// ── Basketball Icon (Sports & Accessories) ────────────────────────────────
export function BasketballIcon({ size = 22, className = defaultProps.className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Outer circle */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2" />
      {/* Vertical seam */}
      <path d="M12 2C12 2 8.5 7 8.5 12C8.5 17 12 22 12 22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12 2C12 2 15.5 7 15.5 12C15.5 17 12 22 12 22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* Horizontal seam */}
      <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* Diagonal seams */}
      <path d="M4.5 4.5C4.5 4.5 9 8 12 8C15 8 19.5 4.5 19.5 4.5" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round" />
      <path d="M4.5 19.5C4.5 19.5 9 16 12 16C15 16 19.5 19.5 19.5 19.5" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round" />
    </svg>
  );
}

// ── Icon Registry ─────────────────────────────────────────────────────────
// Maps icon string names to custom SVG components

export const customIconMap: Record<string, React.FC<IconProps>> = {
  // Main categories
  "custom-car": CarIcon,
  "custom-factory": FactoryIcon,
  "custom-hammer": HammerIcon,
  "custom-monitor": MonitorIcon,
  "custom-couch": CouchIcon,
  "custom-solar": SolarPanelIcon,
  "custom-shirt": ShirtIcon,
  "custom-lipstick": LipstickIcon,
  "custom-minecart": MineCartIcon,
  "custom-wheat": WheatIcon,
  // Vehicle subcategories
  "custom-suv": SuvIcon,
  "custom-jeep": JeepIcon,
  "custom-pickup": PickupTruckIcon,
  "custom-monster": MonsterTruckIcon,
  "custom-van": VanIcon,
  "custom-caravan": CaravanIcon,
  "custom-openroof": OpenRoofIcon,
  "custom-sports": SportsCarIcon,
  "custom-exotic": ExoticCarIcon,
  // Transport
  "custom-greencar": GreenCarIcon,
  "custom-deliverytruck": DeliveryTruckIcon,
  "custom-motorcycle": MotorcycleIcon,
  "custom-scooter": ScooterIcon,
  "custom-ship": ShipIcon,
  "custom-cementtruck": CementTruckIcon,
  "custom-helicopter": HelicopterIcon,
  "custom-drone": DroneIcon,
  "custom-engine": EngineIcon,
  "custom-helmet": RacingHelmetIcon,
  // Sports & Accessories
  "custom-basketball": BasketballIcon,
};

// ── Subcategory icon map ──────────────────────────────────────────────────
// Maps subcategory icon strings from category-data.ts to custom SVG components
export const subcategoryIconMap: Record<string, React.FC<IconProps>> = {
  // Vehicle subcategories
  "suv": SuvIcon,
  "jeep": JeepIcon,
  "pickup-truck": PickupTruckIcon,
  "monster-truck": MonsterTruckIcon,
  "van": VanIcon,
  "caravan": CaravanIcon,
  "open-roof": OpenRoofIcon,
  "car": CarIcon,
  "sports-car": SportsCarIcon,
  "exotic-car": ExoticCarIcon,
};