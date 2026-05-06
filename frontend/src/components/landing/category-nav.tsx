"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Car,
  CarFront,
  Factory,
  Hammer,
  Monitor,
  Armchair,
  Sun,
  Shirt,
  Sparkles,
  Pickaxe,
  Wheat,
  Scissors,
  Truck,
  Laptop,
  Smartphone,
  Tablet,
  Camera,
  Headphones,
  Radio,
  Gamepad2,
  Watch,
  Sofa,
  Lamp,
  LampFloor,
  LampDesk,
  Bed,
  Umbrella,
  Wrench,
  Zap,
  Link,
  Droplet,
  Droplets,
  Plug,
  Paintbrush,
  TreePine,
  TreePalm,
  Paperclip,
  Battery,
  BatteryCharging,
  Wind,
  Power,
  Briefcase,
  Dumbbell,
  Glasses,
  Palette,
  Heart,
  HeartPulse,
  Gem,
  Layers,
  Shield,
  Package,
  Cpu,
  FlaskConical,
  Footprints,
  Baby,
  CircleDot,
  Square,
  Apple,
  Carrot,
  Sprout,
  Tractor,
  Beef,
  Milk,
  Mountain,
  Crown,
  Compass,
  Star,
  Flame,
  Rocket,
  Anchor,
  Flag,
  Feather,
  Users,
  Home,
  Tent,
  MapPin,
  Globe,
  Gauge,
  Ruler,
  Box,
  Boxes,
  Eye,
  Volume2,
  Tv,
  Music,
  Hand,
  PenTool,
  PenLine,
  BookOpen,
  Coffee,
  Grape,
  Fish,
  Cloud,
  CloudRain,
  Leaf,
  Minimize,
  Target,
  Tag,
  Film,
  Snowflake,
  Fuel,
  Weight,
  HardHat,
  Forklift,
  Construction,
  Shovel,
  Drill,
  Bolt,
  Nut,
  Cable,
  Map,
  History,
  Diamond,
  Hexagon,
  Triangle,
  Cylinder,
  Building,
  Lightbulb,
  SprayCan,
  PaintBucket,
  PaintRoller,
  ShowerHead,
  Flashlight,
  Backpack,
  Luggage,
  ShoppingBag,
  Wallet,
  Ribbon,
  Pill,
  PillBottle,
  Bath,
  Brain,
  Atom,
  TestTube,
  Waves,
  Webcam,
  Usb,
  Microchip,
  Mouse,
  Keyboard,
  Joystick,
  Speaker,
  AudioLines,
  Ear,
  Disc,
  Mic,
  SlidersHorizontal,
  Bot,
  CircuitBoard,
  ScanEye,
  MoveHorizontal,
  Aperture,
  Clapperboard,
  Cctv,
  Image,
  Signal,
  GraduationCap,
  ToyBrick,
  Smile,
  RotateCcw,
  RotateCw,
  SwatchBook,
  Sticker,
  Flower,
  Flower2,
  Moon,
  Fan,
  Radar,
  Cross,
  LifeBuoy,
  FireExtinguisher,
  Antenna,
  Magnet,
  Filter,
  Heater,
  ToggleLeft,
  Folder,
  DoorClosed,
  RockingChair,
  Beer,
  Utensils,
  Blocks,
  Timer,
  Bird,
  PiggyBank,
  CupSoda,
  IceCreamCone,
  BicepsFlexed,
  Citrus,
  Cherry,
  Banana,
  LeafyGreen,
  Bean,
  AirVent,
  FlipHorizontal,
  Wifi,
  Thermometer,
  Archive,
  Printer,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { categories } from "./category-data";
import { useBounce } from "./bounce-context";
import {
  CarIcon,
  FactoryIcon,
  HammerIcon,
  MonitorIcon,
  CouchIcon,
  SolarPanelIcon,
  ShirtIcon,
  LipstickIcon,
  MineCartIcon,
  WheatIcon,
  BasketballIcon,
  subcategoryIconMap,
} from "./custom-icons";

// ── Lucide icon map for product-level (3rd stage) icons ──
const lucideIconMap: Record<string, LucideIcon> = {
  car: Car, "car-front": CarFront, factory: Factory, hammer: Hammer, monitor: Monitor,
  sofa: Sofa, sun: Sun, shirt: Shirt, sparkles: Sparkles,
  pickaxe: Pickaxe, wheat: Wheat, scissors: Scissors, truck: Truck,
  laptop: Laptop, smartphone: Smartphone, tablet: Tablet, camera: Camera,
  headphones: Headphones, radio: Radio, gamepad: Gamepad2, watch: Watch,
  armchair: Armchair, lamp: Lamp, "lamp-floor": LampFloor, "lamp-desk": LampDesk,
  bed: Bed, table: Sofa, desk: Monitor,
  archive: Archive, umbrella: Umbrella, wrench: Wrench, zap: Zap,
  link: Link, droplet: Droplet, droplets: Droplets, plug: Plug, paintbrush: Paintbrush,
  tree: TreePine, "tree-pine": TreePine, "tree-palm": TreePalm,
  paperclip: Paperclip, battery: Battery, "battery-charging": BatteryCharging,
  wind: Wind, power: Power, briefcase: Briefcase, dumbbell: Dumbbell, glasses: Glasses,
  baby: Baby, footprints: Footprints, palette: Palette,
  flower: Flower, "flower-2": Flower2,
  heart: Heart, "heart-pulse": HeartPulse, gem: Gem, layers: Layers, shield: Shield, package: Package,
  cpu: Cpu, flask: FlaskConical, cog: Wrench,
  apple: Apple, carrot: Carrot, sprout: Sprout, tractor: Tractor,
  beef: Beef, milk: Milk, circle: CircleDot, square: Square,
  suv: Car, jeep: Car, "pickup-truck": Truck, "monster-truck": Truck,
  van: Truck, caravan: Truck, "open-roof": Car, "sports-car": Car, "exotic-car": Car,
  mountain: Mountain, crown: Crown, compass: Compass, star: Star,
  flame: Flame, rocket: Rocket, anchor: Anchor, flag: Flag,
  feather: Feather, users: Users, home: Home, tent: Tent,
  "map-pin": MapPin, globe: Globe, gauge: Gauge, ruler: Ruler,
  box: Box, boxes: Boxes, eye: Eye, volume: Volume2, "volume-2": Volume2, tv: Tv, music: Music,
  hand: Hand, "pen-tool": PenTool, "pen-line": PenLine,
  "book-open": BookOpen, coffee: Coffee,
  grape: Grape, fish: Fish, cloud: Cloud, "cloud-rain": CloudRain,
  leaf: Leaf, minimize: Minimize,
  target: Target, tag: Tag, film: Film,
  snowflake: Snowflake, fuel: Fuel, weight: Weight,
  "hard-hat": HardHat, forklift: Forklift, construction: Construction,
  shovel: Shovel, drill: Drill, bolt: Bolt, nut: Nut,
  cable: Cable, map: Map, history: History,
  diamond: Diamond, hexagon: Hexagon, triangle: Triangle, cylinder: Cylinder,
  building: Building, lightbulb: Lightbulb,
  "spray-can": SprayCan, "paint-bucket": PaintBucket, "paint-roller": PaintRoller,
  "shower-head": ShowerHead, flashlight: Flashlight,
  backpack: Backpack, luggage: Luggage, "shopping-bag": ShoppingBag, wallet: Wallet, ribbon: Ribbon,
  pill: Pill, "pill-bottle": PillBottle, bath: Bath, brain: Brain,
  atom: Atom, "test-tube": TestTube, waves: Waves,
  webcam: Webcam, usb: Usb, microchip: Microchip,
  mouse: Mouse, keyboard: Keyboard, joystick: Joystick,
  speaker: Speaker, "audio-lines": AudioLines, ear: Ear, disc: Disc, mic: Mic,
  "sliders-horizontal": SlidersHorizontal,
  bot: Bot, "circuit-board": CircuitBoard, "scan-eye": ScanEye, "move-horizontal": MoveHorizontal,
  aperture: Aperture, clapperboard: Clapperboard, cctv: Cctv, image: Image,
  signal: Signal, "graduation-cap": GraduationCap, "toy-brick": ToyBrick,
  smile: Smile, "rotate-ccw": RotateCcw, "rotate-cw": RotateCw,
  "swatch-book": SwatchBook, sticker: Sticker,
  moon: Moon, fan: Fan, radar: Radar,
  cross: Cross, "life-buoy": LifeBuoy, "fire-extinguisher": FireExtinguisher, antenna: Antenna,
  magnet: Magnet, filter: Filter,
  heater: Heater, "toggle-left": ToggleLeft, folder: Folder,
  "door-closed": DoorClosed, "rocking-chair": RockingChair, beer: Beer, utensils: Utensils,
  blocks: Blocks, timer: Timer,
  bird: Bird, "piggy-bank": PiggyBank, "cup-soda": CupSoda, "ice-cream-cone": IceCreamCone,
  "biceps-flexed": BicepsFlexed,
  citrus: Citrus, cherry: Cherry, banana: Banana, "leafy-green": LeafyGreen, bean: Bean,
  "air-vent": AirVent, "flip-horizontal": FlipHorizontal, wifi: Wifi,
  thermometer: Thermometer, printer: Printer, container: Box,
};

export function getIcon(iconName: string): LucideIcon {
  return lucideIconMap[iconName] || CircleDot;
}

// ── Custom Figma SVG icons for main categories ──
const mainCategoryIconMap: Record<string, React.FC<{ size?: number; className?: string }>> = {
  car: CarIcon,
  factory: FactoryIcon,
  hammer: HammerIcon,
  monitor: MonitorIcon,
  sofa: CouchIcon,
  sun: SolarPanelIcon,
  shirt: ShirtIcon,
  sparkles: LipstickIcon,
  pickaxe: MineCartIcon,
  wheat: WheatIcon,
  basketball: BasketballIcon,
};

interface CategoryNavProps {
  activeCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  onSubcategorySelect: (categoryId: string, subcategoryId: string) => void;
}

export function CategoryNav({
  activeCategory,
  onCategorySelect,
  onSubcategorySelect,
}: CategoryNavProps) {
  const { triggerBounce } = useBounce();
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [clickLocked, setClickLocked] = useState(false);
  const [subClickLocked, setSubClickLocked] = useState(false);

  const activeCat = categories.find((c) => c.id === activeCategory);
  const activeSub = activeCat?.subcategories.find((s) => s.id === activeSubcategory);

  // Reset subcategory when main category changes
  useEffect(() => {
    setActiveSubcategory(null);
    setSubClickLocked(false);
  }, [activeCategory]);

  // Reset click locks when category closes
  useEffect(() => {
    if (!activeCategory) {
      setClickLocked(false);
      setSubClickLocked(false);
    }
  }, [activeCategory]);

  // Hover intent: open on enter, close with grace period on leave
  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    if (clickLocked) return;
    cancelClose();
    closeTimer.current = setTimeout(() => {
      onCategorySelect(null);
    }, 220);
  }, [cancelClose, onCategorySelect, clickLocked]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  // Also close on outside click as a fallback
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest("[data-category-btn]")) {
          cancelClose();
          setClickLocked(false);
          setSubClickLocked(false);
          onCategorySelect(null);
        }
      }
    }
    if (activeCategory) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [activeCategory, onCategorySelect, cancelClose]);

  return (
    <div ref={containerRef} className="relative">
      {/* Main category icons row in navbar */}
      <div className="hidden lg:flex items-center gap-1">
        {categories.map((cat) => {
          const CustomIcon = mainCategoryIconMap[cat.icon];
          const LucideIcon = lucideIconMap[cat.icon];
          const isActive = activeCategory === cat.id;
          return (
            <motion.button
              key={cat.id}
              data-category-btn
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => {
                cancelClose();
                if (!clickLocked && activeCategory !== cat.id) {
                  onCategorySelect(cat.id);
                }
              }}
              onMouseLeave={scheduleClose}
              onClick={() => {
                triggerBounce();
                if (isActive && clickLocked) {
                  setClickLocked(false);
                  onCategorySelect(null);
                } else {
                  setClickLocked(true);
                  onCategorySelect(cat.id);
                }
              }}
              className={`relative w-[48px] h-[40px] rounded-[20px] flex items-center justify-center cursor-pointer transition-all duration-300
                ${
                  isActive
                    ? "bg-gradient-to-br from-[#e1e3f4]/70 to-[#faf7ed]/70 shadow-[0_4px_14px_rgba(0,0,0,0.1)]"
                    : "bg-white/40 hover:bg-white/70 shadow-[0_1px_6px_rgba(0,0,0,0.04)]"
                }`}
            >
              {isActive && (
                <>
                  <motion.div
                    layoutId="category-active-glow"
                    className="absolute inset-0 rounded-[20px] pointer-events-none"
                    style={{
                      background: "radial-gradient(circle at center, rgba(0, 143, 247, 0.12) 0%, transparent 70%)",
                    }}
                    transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
                  />
                  <motion.div
                    layoutId="category-active-border"
                    className="absolute inset-[-1.5px] rounded-[21.5px] pointer-events-none"
                    style={{
                      padding: "1.5px",
                      background: "linear-gradient(135deg, rgba(0, 143, 247, 0.6), rgba(0, 200, 255, 0.3), rgba(0, 143, 247, 0.6))",
                      WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                    }}
                    transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
                  />
                </>
              )}
              {CustomIcon ? (
                <CustomIcon
                  size={20}
                  className={`transition-colors duration-200 ${
                    isActive ? "text-[#0d1117]" : "text-[#56585D]"
                  }`}
                />
              ) : LucideIcon ? (
                <LucideIcon
                  size={18}
                  strokeWidth={1.3}
                  className={`transition-colors duration-200 ${
                    isActive ? "text-[#0d1117]" : "text-[#56585D]"
                  }`}
                />
              ) : null}
            </motion.button>
          );
        })}
      </div>

      {/* Expanded dropdown panel */}
      <AnimatePresence>
        {activeCat && (
          <>
            {/* Invisible hover bridge from navbar icons to panel */}
            <div
              className="fixed top-[60px] left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[20px] z-39"
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ transformOrigin: "top center" }}
              className="fixed top-[72px] left-1/2 -translate-x-1/2 z-40 w-full max-w-[1200px]"
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
              <div
                className="relative rounded-[32px] px-7 pt-6 pb-8 backdrop-blur-[16px]"
                style={{
                  backgroundImage:
                    "linear-gradient(164deg, rgba(225,227,244,0.78) 20%, rgba(250,247,237,0.78) 85%)",
                }}
              >
                {/* Glass inner highlight */}
                <div className="absolute inset-0 rounded-[32px] shadow-[inset_0_2px_24px_rgba(255,255,255,0.7)] pointer-events-none" />
                {/* Glass outer border + shadow */}
                <div
                  aria-hidden
                  className="absolute inset-[-0.5px] border-[0.5px] border-white/40 rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.15)] pointer-events-none"
                />

                <div className="relative flex flex-col items-center">
                  {/* Subcategory row — full width, centered, no category label */}
                  <div className="w-full flex flex-wrap justify-center gap-5">
                    {activeCat.subcategories.map((sub, i) => {
                      const CustomSubIcon = subcategoryIconMap[sub.icon];
                      const LucideSubIcon = getIcon(sub.icon);
                      const isSelected = activeSubcategory === sub.id;
                      const hasSiblingSelected = activeSubcategory !== null && !isSelected;
                      return (
                        <motion.button
                          key={sub.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{
                            opacity: hasSiblingSelected ? 0.65 : 1,
                            y: 0,
                            scale: hasSiblingSelected ? 0.97 : 1,
                          }}
                          transition={{
                            delay: i * 0.035,
                            duration: 0.35,
                            ease: [0.25, 0.46, 0.45, 0.94],
                          }}
                          whileHover={{ scale: hasSiblingSelected ? 1.0 : 1.08, y: -3 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => {
                            triggerBounce();
                            setActiveSubcategory(isSelected ? null : sub.id);
                          }}
                          onMouseEnter={() => {
                            if (activeSubcategory !== null && !isSelected) {
                              setActiveSubcategory(sub.id);
                            }
                          }}
                          className="flex flex-col items-center gap-2.5 cursor-pointer group"
                        >
                          <motion.div
                            animate={{
                              borderRadius: isSelected ? "50%" : "20px",
                              width: isSelected ? 56 : 56,
                              height: isSelected ? 56 : 52,
                            }}
                            transition={{ type: "spring", bounce: 0.3, duration: 0.45 }}
                            className={`relative backdrop-blur-sm border shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-center overflow-visible
                              ${
                                isSelected
                                  ? "bg-white/75 border-[#008ff7]/30 shadow-[0_6px_24px_rgba(0,143,247,0.12)]"
                                  : "bg-white/45 border-white/60 group-hover:bg-white/75 group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]"
                              }`}
                            style={{ transition: "background-color 0.3s, box-shadow 0.3s, border-color 0.3s" }}
                          >
                            {isSelected && (
                              <>
                                <motion.div
                                  layoutId="subcategory-selected-glow"
                                  animate={{ borderRadius: "50%" }}
                                  className="absolute inset-0 pointer-events-none"
                                  style={{
                                    borderRadius: "50%",
                                    background: "radial-gradient(circle at center, rgba(0, 143, 247, 0.12) 0%, transparent 70%)",
                                  }}
                                  transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
                                />
                                <motion.div
                                  layoutId="subcategory-selected-ring"
                                  animate={{ borderRadius: "50%" }}
                                  className="absolute inset-[-1.5px] pointer-events-none"
                                  transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
                                  style={{
                                    borderRadius: "50%",
                                    padding: "1.5px",
                                    background: "linear-gradient(135deg, rgba(0, 143, 247, 0.6), rgba(0, 200, 255, 0.3), rgba(0, 143, 247, 0.6))",
                                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                    WebkitMaskComposite: "xor",
                                    maskComposite: "exclude",
                                  }}
                                />
                              </>
                            )}
                            {CustomSubIcon ? (
                              <CustomSubIcon
                                size={36}
                                className={`transition-colors duration-200 ${
                                  isSelected ? "text-[#0d1117]" : "text-[#3a3c41] group-hover:text-[#0d1117]"
                                }`}
                              />
                            ) : (
                              <LucideSubIcon
                                size={22}
                                strokeWidth={1.2}
                                className={`transition-colors duration-200 ${
                                  isSelected ? "text-[#0d1117]" : "text-[#3a3c41] group-hover:text-[#0d1117]"
                                }`}
                              />
                            )}
                          </motion.div>
                          <span
                            className={`font-['Urbanist',sans-serif] text-[12.5px] text-[#3a3c41] transition-opacity text-center max-w-[76px] leading-tight
                              ${isSelected ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}
                            style={{ fontWeight: 600 }}
                          >
                            {sub.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* ── Products: expand inline below subcategories ── */}
                  <AnimatePresence>
                    {activeSub && (
                      <motion.div
                        key={`prod-${activeSub.id}`}
                        initial={{ opacity: 0, height: 0, clipPath: "inset(0 -20px -20px -20px)" }}
                        animate={{ opacity: 1, height: "auto", clipPath: "inset(0 -20px -20px -20px)" }}
                        exit={{ opacity: 0, height: 0, clipPath: "inset(0 -20px -20px -20px)" }}
                        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="w-full"
                      >
                        {/* Divider line */}
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.4, delay: 0.05 }}
                          className="mt-6 mb-5 h-[1px] bg-gradient-to-r from-transparent via-[#56585d]/10 to-transparent origin-center"
                        />

                        {/* Products grid — vertical layout matching subcategory row */}
                        <div className="relative w-full">
                          <div
                            className="max-h-[280px] overflow-y-auto overflow-x-visible pr-1 -m-3"
                            style={{
                              scrollbarWidth: "thin",
                              scrollbarColor: "rgba(86,88,93,0.15) transparent",
                            }}
                          >
                            <div className="flex flex-wrap justify-center gap-5 p-3">
                              {activeSub.products.map((product, i) => {
                                const ProdIcon = getIcon(product.icon);
                                return (
                                  <motion.button
                                    key={product.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                      delay: 0.08 + i * 0.035,
                                      duration: 0.35,
                                      ease: [0.25, 0.46, 0.45, 0.94],
                                    }}
                                    whileHover={{ scale: 1.08, y: -3 }}
                                    whileTap={{ scale: 0.94 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      triggerBounce();
                                      onSubcategorySelect(activeCat.id, activeSub.id);
                                    }}
                                    className="flex flex-col items-center gap-2 cursor-pointer group"
                                  >
                                    <div
                                      className="relative w-[48px] h-[48px] rounded-[18px] backdrop-blur-sm border shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-center transition-all duration-300 bg-white/45 border-white/60 group-hover:bg-white/75 group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]"
                                    >
                                      <ProdIcon
                                        size={18}
                                        strokeWidth={1.2}
                                        className="text-[#3a3c41] group-hover:text-[#0d1117] transition-colors duration-200"
                                      />
                                    </div>
                                    <span
                                      className="font-['Urbanist',sans-serif] text-[12px] text-[#3a3c41] opacity-70 group-hover:opacity-100 transition-opacity text-center max-w-[72px] leading-tight"
                                      style={{ fontWeight: 600 }}
                                    >
                                      {product.name}
                                    </span>
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Bottom fade hint when scrollable */}
                          {activeSub.products.length > 8 && (
                            <div className="absolute bottom-0 left-0 right-2 h-[40px] bg-gradient-to-t from-[rgba(237,236,232,0.6)] to-transparent pointer-events-none rounded-b-[18px]" />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}