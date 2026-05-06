"use client";

/**
 * Icon Resolver — Maps string icon names from category-data to lucide-react components.
 * Complete coverage for all 1100+ icon references across categories, subcategories, and products.
 */

import {
  Car, CarFront, Truck, Ship, Plane, Train, Bike,
  Mountain, Compass, Users, Crown, Leaf, Zap, Minimize2, Gauge, Layers, Shield,
  Fuel, Tent, Building2, Star, Sun, Wrench, Anchor, Map, Snowflake, Globe,
  History, HardHat, Weight, Package, Box, Container, Cog, Factory, Hammer,
  Scissors, Bolt, CircleDot, Pipette, FlaskConical, Cpu, Monitor, Smartphone,
  Tablet, Camera, Headphones, Speaker, Tv, Wifi, Radio, Bot, Printer,
  HardDrive, Server, CircuitBoard, Microchip, Battery, Cable, Sofa, Lamp,
  BedDouble, Armchair, Table, DoorOpen, DoorClosed, Frame, Utensils, Flower2,
  Gem, Droplets, Droplet, Wind, Flame, Lightbulb, SunMedium, CloudSun,
  ThermometerSun, Shirt, Footprints, Glasses, Watch, Briefcase, Ribbon, Heart,
  Sparkles, Palette, Eye, SprayCan, Cherry, Apple, Banana, Grape, Carrot,
  Wheat, Sprout, TreePalm, TreePine, Trees, Fish, Bird, Bug, Hexagon,
  PiggyBank, Milk, IceCreamCone, Dumbbell, Target, Feather, Waves, Moon,
  Flashlight, LifeBuoy, HeartPulse, Hand, Timer, Atom, Pickaxe, Shovel,
  Rocket, BicepsFlexed, CupSoda, Umbrella, Cloud, Square, Circle, Link, Flag,
  // Additional icons for full coverage
  Ruler, Baby, MapPin, Gamepad2, Diamond, PenTool, MoveHorizontal,
  FlipHorizontal2, Cylinder, Paintbrush, PaintBucket, PaintRoller, Drill, Fan,
  Construction, ScanEye, Ear, AirVent, Plug, ToggleLeft, RotateCcw,
  RotateCw, Paperclip, Tag, Laptop, GraduationCap, BookOpen, PenLine, Aperture,
  Image, Clapperboard, Webcam, AudioLines, Mic, Disc, SlidersHorizontal,
  Volume2, Mouse, Keyboard, Joystick, BatteryCharging, Usb, Signal, Coffee,
  Beer, Folder, Power, Smile, Triangle, Luggage, ShoppingBag, Wallet,
  CloudRain, Brain, Magnet, TestTube,
  type LucideIcon,
} from "lucide-react";

import React from "react";

// ─── Icon Map ──────────────────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  // Vehicles
  car: Car, "car-front": CarFront, truck: Truck, ship: Ship, plane: Plane,
  train: Train, bike: Bike, suv: Car, jeep: Car, "pickup-truck": Truck,
  "monster-truck": Truck, bus: Truck, van: Truck, caravan: Truck,
  "open-roof": Car, "sports-car": Car, "exotic-car": Car,
  motorcycle: Bike, bicycle: Bike, scooter: Bike, trailer: Container,

  // Navigation / Nature
  mountain: Mountain, compass: Compass, map: Map, "map-pin": MapPin,
  globe: Globe, tent: Tent, anchor: Anchor, waves: Waves,

  // People / Status
  users: Users, crown: Crown, star: Star, shield: Shield, history: History,
  flag: Flag, baby: Baby,

  // Energy / Nature
  leaf: Leaf, zap: Zap, sun: Sun, "sun-medium": SunMedium, "cloud-sun": CloudSun,
  "thermometer-sun": ThermometerSun, flame: Flame, lightbulb: Lightbulb,
  wind: Wind, snowflake: Snowflake, moon: Moon, droplet: Droplet,
  droplets: Droplets, cloud: Cloud, "cloud-rain": CloudRain,
  thermometer: ThermometerSun,

  // Tools / Industrial
  wrench: Wrench, hammer: Hammer, cog: Cog, scissors: Scissors, bolt: Bolt,
  "hard-hat": HardHat, shovel: Shovel, pickaxe: Pickaxe, factory: Factory,
  weight: Weight, fuel: Fuel, "spray-can": SprayCan, drill: Drill, fan: Fan,
  construction: Construction, ruler: Ruler, "pen-tool": PenTool,
  paintbrush: Paintbrush, "paint-bucket": PaintBucket, "paint-roller": PaintRoller,
  "air-vent": AirVent, filter: Layers, plug: Plug, power: Power,

  // Tech / Electronics
  cpu: Cpu, monitor: Monitor, smartphone: Smartphone, tablet: Tablet,
  laptop: Laptop, camera: Camera, headphones: Headphones, speaker: Speaker,
  tv: Tv, wifi: Wifi, radio: Radio, bot: Bot, printer: Printer,
  "hard-drive": HardDrive, server: Server, "circuit-board": CircuitBoard,
  microchip: Microchip, battery: Battery, "battery-charging": BatteryCharging,
  cable: Cable, mouse: Mouse, keyboard: Keyboard, joystick: Joystick,
  gamepad: Gamepad2, usb: Usb, signal: Signal, antenna: Radio,
  radar: ScanEye, webcam: Webcam, aperture: Aperture, image: Image,
  clapperboard: Clapperboard, "audio-lines": AudioLines, mic: Mic,
  disc: Disc, "sliders-horizontal": SlidersHorizontal, "volume-2": Volume2,
  "scan-eye": ScanEye, "toggle-left": ToggleLeft, cctv: Eye,

  // Furniture / Home
  sofa: Sofa, lamp: Lamp, "lamp-floor": Lamp, "lamp-desk": Lamp,
  bed: BedDouble, "bed-double": BedDouble, armchair: Armchair, table: Table,
  desk: Monitor, "door-open": DoorOpen, "door-closed": DoorClosed,
  frame: Frame, utensils: Utensils, home: Building2, coffee: Coffee,
  beer: Beer, "rocking-chair": Armchair, archive: Box, folder: Folder,

  // Fashion / Apparel
  shirt: Shirt, footprints: Footprints, glasses: Glasses, watch: Watch,
  briefcase: Briefcase, ribbon: Ribbon, backpack: Briefcase, wallet: Wallet,
  luggage: Luggage, "shopping-bag": ShoppingBag,
  "graduation-cap": GraduationCap,

  // General shapes / layout
  minimize: Minimize2, gauge: Gauge, layers: Layers, package: Package,
  box: Box, boxes: Package, blocks: Layers, container: Container,
  circle: CircleDot, square: Square, hexagon: Hexagon, triangle: Triangle,
  diamond: Diamond, target: Target, link: Link, paperclip: Paperclip,
  tag: Tag, nut: Cog, grip: Hand, scale: Ruler,
  "move-horizontal": MoveHorizontal, "flip-horizontal": FlipHorizontal2,
  cylinder: Cylinder, "rotate-ccw": RotateCcw, "rotate-cw": RotateCw,
  fence: Wrench, forklift: Truck,

  // Science / Chemistry
  flask: FlaskConical, pipette: Pipette, atom: Atom, "test-tube": TestTube,
  magnet: Magnet, brain: Brain,

  // Nature / Agriculture
  flower: Flower2, "flower-2": Flower2, wheat: Wheat, sprout: Sprout,
  "tree-palm": TreePalm, "tree-pine": TreePine, tree: Trees, carrot: Carrot,
  apple: Apple, cherry: Cherry, banana: Banana, grape: Grape, citrus: Sun,
  "leafy-green": Leaf, bean: Sprout, tractor: Truck,

  // Animals / Farm
  fish: Fish, bird: Bird, bug: Bug, beef: CircleDot, "piggy-bank": PiggyBank,
  milk: Milk, "ice-cream-cone": IceCreamCone,

  // Sports / Fitness
  dumbbell: Dumbbell, "biceps-flexed": BicepsFlexed, feather: Feather,
  basketball: CircleDot, "racing-helmet": Shield,

  // Ears / Body
  ear: Ear, smile: Smile, "heart-pulse": HeartPulse, hand: Hand,

  // Beauty
  "swatch-book": Palette, sticker: Sparkles, pill: Tablet,
  "pill-bottle": FlaskConical, bath: Droplets, "shower-head": Droplets,
  heater: Flame, "fire-extinguisher": Shield, cross: Target,

  // Books / Learning
  "book-open": BookOpen, "pen-line": PenLine,

  // Misc
  rocket: Rocket, gem: Gem, heart: Heart, sparkles: Sparkles, palette: Palette,
  eye: Eye, "life-buoy": LifeBuoy, timer: Timer, "cup-soda": CupSoda,
  umbrella: Umbrella, flashlight: Flashlight, building: Building2,
  "toy-brick": Gamepad2,
};

// ─── Global Soft-Edge Filter ───────────────────────────────────────────
// Rendered once in the DOM. Icons reference this filter by ID.
// Uses morphological closing (dilate → erode) to gently round every corner,
// then composites with a whisper-thin glow so nothing feels sharp.
let filterInjected = false;

function ensureSoftFilter() {
  if (filterInjected || typeof document === "undefined") return;
  filterInjected = true;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  svg.style.pointerEvents = "none";
  svg.innerHTML = `
    <defs>
      <filter id="vehsl-icon-soft" x="-10%" y="-10%" width="120%" height="120%">
        <!-- Gentle morphological closing: rounds sharp joins & endpoints -->
        <feMorphology operator="dilate" radius="0.25" in="SourceGraphic" result="dilated"/>
        <feMorphology operator="erode" radius="0.25" in="dilated" result="closed"/>
        <!-- Whisper-thin glow to wrap edges in warmth -->
        <feGaussianBlur in="closed" stdDeviation="0.15" result="softened"/>
        <!-- Blend the softened version back with original for crispness -->
        <feComposite in="SourceGraphic" in2="softened" operator="over"/>
      </filter>
    </defs>`;
  document.body.appendChild(svg);
}

// ─── Resolver Component ────────────────────────────────────────────────
interface IconResolverProps {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export function IconResolver({
  name,
  size = 16,
  className = "",
  strokeWidth = 1.5,
  style,
}: IconResolverProps) {
  // Inject the global filter once on first render
  React.useEffect(() => { ensureSoftFilter(); }, []);

  const Icon = ICON_MAP[name];
  if (!Icon) {
    return (
      <div
        className={`rounded-full bg-current opacity-30 shrink-0 ${className}`}
        style={{ width: size * 0.4, height: size * 0.4, ...style }}
      />
    );
  }

  // Softened aesthetic:
  // - Round caps & joins (lucide default, reinforced here)
  // - Slightly gentler stroke weight for breathing room
  // - SVG filter for morphologically rounded corners
  // - Delicate drop-shadow halo to wrap edges in warmth
  const softStroke = strokeWidth * 0.92;
  const softStyle: React.CSSProperties = {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    filter: "url(#vehsl-icon-soft) drop-shadow(0 0 0.4px currentColor)",
    ...style,
  };

  return (
    <Icon
      size={size}
      strokeWidth={softStroke}
      className={`shrink-0 ${className}`}
      style={softStyle}
    />
  );
}