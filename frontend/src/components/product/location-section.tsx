"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, MapPin, Star, SlidersHorizontal, ArrowRight, Thermometer, Shield, Forklift, Clock, Package, Navigation } from "lucide-react";
import { useBounce } from "./bounce-context";
import { useProductSelection, type DeliveryLocation } from "./product-selection-context";

/* ───── Warehouse Data ─────────────────────────────────── */

interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number; // per spot per week
  rating: number;
  reviews: number;
  distance: number; // miles from user
  portDistance: number; // miles from nearest port
  spotsAvailable: number;
  isOpen: boolean;
  closingTime: string | null; // null = 24/7
  features: string[];
}

const warehouses: Warehouse[] = [
  {
    id: "junaid",
    name: "Junaid Logistics",
    address: "4501 Pleasanton Ave",
    city: "Pleasanton",
    state: "CA",
    zip: "94566",
    price: 28,
    rating: 4.9,
    reviews: 20,
    distance: 3.2,
    portDistance: 1.4,
    spotsAvailable: 10,
    isOpen: true,
    closingTime: null,
    features: ["Climate", "Security", "Forklift"],
  },
  {
    id: "greenstore",
    name: "Greenstore G1",
    address: "142 Harbor Blvd",
    city: "Oakland",
    state: "CA",
    zip: "94607",
    price: 35,
    rating: 4.2,
    reviews: 52,
    distance: 5.8,
    portDistance: 0.8,
    spotsAvailable: 38,
    isOpen: true,
    closingTime: "10 PM",
    features: ["Climate", "Security", "Forklift"],
  },
  {
    id: "nordic",
    name: "Nordic Supply Depot",
    address: "775 Estudillo Ave",
    city: "San Leandro",
    state: "CA",
    zip: "94577",
    price: 40,
    rating: 4.0,
    reviews: 204,
    distance: 7.1,
    portDistance: 4.6,
    spotsAvailable: 40,
    isOpen: true,
    closingTime: "11 PM",
    features: ["Security", "Tracking"],
  },
  {
    id: "james",
    name: "James ZS Hub",
    address: "890 Industrial Pkwy",
    city: "San Leandro",
    state: "CA",
    zip: "94577",
    price: 45,
    rating: 4.8,
    reviews: 58,
    distance: 8.4,
    portDistance: 5.2,
    spotsAvailable: 116,
    isOpen: true,
    closingTime: "9 PM",
    features: ["Climate", "Security", "24hr"],
  },
  {
    id: "jackrock",
    name: "Jack Rock Storage",
    address: "2210 Webster St",
    city: "Alameda",
    state: "CA",
    zip: "94501",
    price: 50,
    rating: 3.6,
    reviews: 14,
    distance: 12.3,
    portDistance: 9.7,
    spotsAvailable: 55,
    isOpen: false,
    closingTime: "9 AM",
    features: ["Climate", "Tracking"],
  },
];

const featureIcons: Record<string, React.ReactNode> = {
  Climate: <Thermometer size={11} />,
  Security: <Shield size={11} />,
  Forklift: <Forklift size={11} />,
  "24hr": <Clock size={11} />,
  Tracking: <Navigation size={11} />,
  Dock: <Package size={11} />,
};

const featureColors: Record<string, string> = {
  Climate: "#e74c3c",
  Security: "#2ecc71",
  Forklift: "#3498db",
  "24hr": "#e74c3c",
  Tracking: "#e74c3c",
  Dock: "#9b59b6",
};

/* ───── Port Distance → Surcharge ─────────────────────── */

const PORT_NAME = "Port of Oakland";

/** Calculate per-unit inland-transport surcharge based on miles from port */
function calcLocationSurcharge(distanceMiles: number): number {
  // Base $0.15/unit + $0.06 per mile from port
  return Math.round((0.15 + distanceMiles * 0.06) * 100) / 100;
}

type SortFilter = "all" | "nearest" | "cheapest" | "top";

/* ───── Primary Address ───────────────────────────────── */

const PRIMARY_ADDRESS_PORT_DISTANCE = 14.2; // SF to Port of Oakland, miles

const primaryAddress = {
  name: "Sarah Chen",
  line1: "1847 Folsom St, Suite 200",
  city: "San Francisco",
  state: "CA",
  zip: "94103",
  country: "United States",
};

const SECONDARY_ADDRESS_PORT_DISTANCE = 8.6; // San Leandro to Port of Oakland, miles

const secondaryAddress = {
  name: "Sarah Chen",
  line1: "690 Floresta Blvd",
  city: "San Leandro",
  state: "CA",
  zip: "94578",
  country: "United States",
};

/* ───── Component ─────────────────────────────────────── */

export function LocationSection() {
  const { selectedLocation, setSelectedLocation } = useProductSelection();
  const { triggerBounce } = useBounce();

  const [locationType, setLocationType] = useState<"address" | "address2" | "warehouse" | null>(
    selectedLocation?.type === "address" ? "address" : selectedLocation?.type === "warehouse" ? "warehouse" : null
  );
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortFilter, setSortFilter] = useState<SortFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredWarehouse, setHoveredWarehouse] = useState<string | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [filterDistance, setFilterDistance] = useState<string>("any");
  const [filterPrice, setFilterPrice] = useState<string>("any");
  const [filterRating, setFilterRating] = useState<string>("any");
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);
  const [filterFeatures, setFilterFeatures] = useState<string[]>([]);

  const filteredWarehouses = useMemo(() => {
    let result = [...warehouses];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.city.toLowerCase().includes(q) ||
          w.address.toLowerCase().includes(q) ||
          w.zip.includes(q)
      );
    }

    // Filters
    if (filterOpenOnly) result = result.filter((w) => w.isOpen);
    if (filterDistance !== "any") {
      const max = parseFloat(filterDistance);
      result = result.filter((w) => w.distance <= max);
    }
    if (filterPrice !== "any") {
      const max = parseFloat(filterPrice);
      result = result.filter((w) => w.price <= max);
    }
    if (filterRating !== "any") {
      const min = parseFloat(filterRating);
      result = result.filter((w) => w.rating >= min);
    }
    if (filterFeatures.length > 0) {
      result = result.filter((w) =>
        filterFeatures.every((f) => w.features.includes(f))
      );
    }

    // Sort
    switch (sortFilter) {
      case "nearest":
        result.sort((a, b) => a.distance - b.distance);
        break;
      case "cheapest":
        result.sort((a, b) => a.price - b.price);
        break;
      case "top":
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        result.sort((a, b) => a.price - b.price);
    }

    return result;
  }, [searchQuery, sortFilter, filterDistance, filterPrice, filterRating, filterOpenOnly, filterFeatures]);

  // Search dropdown suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return warehouses
      .filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.city.toLowerCase().includes(q) ||
          w.zip.includes(q)
      )
      .slice(0, 8);
  }, [searchQuery]);

  const handleSelectAddress = () => {
    setLocationType("address");
    setShowWarehousePicker(false);
    const surcharge = calcLocationSurcharge(PRIMARY_ADDRESS_PORT_DISTANCE);
    setSelectedLocation({
      type: "address",
      distanceFromPort: PRIMARY_ADDRESS_PORT_DISTANCE,
      locationSurcharge: surcharge,
    });
    triggerBounce("location");
    triggerBounce("price");
  };

  const handleSelectSecondaryAddress = () => {
    setLocationType("address2");
    setShowWarehousePicker(false);
    const surcharge = calcLocationSurcharge(SECONDARY_ADDRESS_PORT_DISTANCE);
    setSelectedLocation({
      type: "address",
      distanceFromPort: SECONDARY_ADDRESS_PORT_DISTANCE,
      locationSurcharge: surcharge,
    });
    triggerBounce("location");
    triggerBounce("price");
  };

  const handleSelectWarehouseOption = () => {
    setLocationType("warehouse");
    setShowWarehousePicker(true);
    // Don't set location yet - user needs to pick a warehouse
    if (!selectedLocation || selectedLocation.type !== "warehouse") {
      setSelectedLocation(null);
    }
  };

  const handleSelectWarehouse = (w: Warehouse) => {
    const surcharge = calcLocationSurcharge(w.portDistance);
    const loc: DeliveryLocation = {
      type: "warehouse",
      warehouseId: w.id,
      warehouseName: w.name,
      warehousePrice: w.price,
      distanceFromPort: w.portDistance,
      locationSurcharge: surcharge,
    };
    setSelectedLocation(loc);
    triggerBounce("location");
    triggerBounce("price");
  };

  const isWarehouseSelected = (id: string) =>
    selectedLocation?.type === "warehouse" && selectedLocation.warehouseId === id;

  const toggleFeatureFilter = (f: string) => {
    setFilterFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <h3
        style={{
          fontFamily: "'Urbanist', sans-serif",
          fontSize: 20,
          fontWeight: 600,
          color: "#2c2c2e",
          letterSpacing: "-0.4px",
        }}
      >
        Delivery Location
      </h3>
      <p
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 12,
          fontWeight: 500,
          color: "#c7c7cc",
          lineHeight: 1.5,
          marginTop: -4,
        }}
      >
        Ship to your address, or store at a platform warehouse near you.
      </p>

      {/* ── Two options: My Address vs Platform Storage ── */}
      <div className="flex flex-col gap-2.5">
        {/* My Address */}
        <motion.button
          onClick={handleSelectAddress}
          className="cursor-pointer flex items-center gap-4 text-left w-full transition-all duration-200"
          style={{
            padding: "16px 20px",
            borderRadius: 22,
            backgroundColor: locationType === "address" ? "rgba(211, 227, 253, 0.3)" : "#f9f8f5",
            border: locationType === "address" ? "1.6px solid #0171e3" : "1.6px solid #eff1f2",
          }}
          whileTap={{ scale: 0.99 }}
        >
          <div
            className="shrink-0"
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              border: locationType === "address" ? "4.8px solid #0171e3" : "1.6px solid #c7c7cc",
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontFamily: "'Urbanist', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#202425",
                }}
              >
                Ship to my address
              </span>
              <span
                style={{
                  fontFamily: "'Urbanist', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#34c759",
                  padding: "2px 8px",
                  borderRadius: 20,
                }}
              >
                Primary
              </span>
            </div>
            <p
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: "#aeaeb2",
                marginTop: 3,
              }}
            >
              {primaryAddress.line1}, {primaryAddress.city}, {primaryAddress.state} {primaryAddress.zip}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <MapPin size={16} className="text-[#c7c7cc]" />
            <span
              style={{
                fontFamily: "'Urbanist', sans-serif",
                fontSize: 10,
                fontWeight: 600,
                color: "#c0695a",
              }}
            >
              +${calcLocationSurcharge(PRIMARY_ADDRESS_PORT_DISTANCE).toFixed(2)}/unit
            </span>
          </div>
        </motion.button>

        {/* Secondary Address */}
        <motion.button
          onClick={handleSelectSecondaryAddress}
          className="cursor-pointer flex items-center gap-4 text-left w-full transition-all duration-200"
          style={{
            padding: "16px 20px",
            borderRadius: 22,
            backgroundColor: locationType === "address2" ? "rgba(211, 227, 253, 0.3)" : "#f9f8f5",
            border: locationType === "address2" ? "1.6px solid #0171e3" : "1.6px solid #eff1f2",
          }}
          whileTap={{ scale: 0.99 }}
        >
          <div
            className="shrink-0"
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              border: locationType === "address2" ? "4.8px solid #0171e3" : "1.6px solid #c7c7cc",
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontFamily: "'Urbanist', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#202425",
                }}
              >
                Ship to my address
              </span>
              <span
                style={{
                  fontFamily: "'Urbanist', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#aeaeb2",
                  padding: "2px 8px",
                  borderRadius: 20,
                }}
              >
                Secondary
              </span>
            </div>
            <p
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: "#aeaeb2",
                marginTop: 3,
              }}
            >
              {secondaryAddress.line1}, {secondaryAddress.city}, {secondaryAddress.state} {secondaryAddress.zip}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <MapPin size={16} className="text-[#c7c7cc]" />
            <span
              style={{
                fontFamily: "'Urbanist', sans-serif",
                fontSize: 10,
                fontWeight: 600,
                color: "#c0695a",
              }}
            >
              +${calcLocationSurcharge(SECONDARY_ADDRESS_PORT_DISTANCE).toFixed(2)}/unit
            </span>
          </div>
        </motion.button>

        {/* Platform Storage */}
        <motion.button
          onClick={handleSelectWarehouseOption}
          className="cursor-pointer flex items-center gap-4 text-left w-full transition-all duration-200"
          style={{
            padding: "16px 20px",
            borderRadius: 22,
            backgroundColor: locationType === "warehouse" ? "rgba(211, 227, 253, 0.3)" : "#f9f8f5",
            border: locationType === "warehouse" ? "1.6px solid #0171e3" : "1.6px solid #eff1f2",
          }}
          whileTap={{ scale: 0.99 }}
        >
          <div
            className="shrink-0"
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              border: locationType === "warehouse" ? "4.8px solid #0171e3" : "1.6px solid #c7c7cc",
            }}
          />
          <div className="flex-1 min-w-0">
            <span
              style={{
                fontFamily: "'Urbanist', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                color: "#202425",
              }}
            >
              Vehsl storage
            </span>
            <p
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: "#aeaeb2",
                marginTop: 3,
              }}
            >
              {selectedLocation?.type === "warehouse" && selectedLocation.warehouseName
                ? `${selectedLocation.warehouseName} · $${selectedLocation.warehousePrice}/spot/wk`
                : "Select a warehouse near your customers"}
            </p>
          </div>
          <Package size={16} className="shrink-0 text-[#c7c7cc]" />
        </motion.button>
      </div>

      {/* ── Warehouse Picker ──────────────────────────── */}
      <AnimatePresence>
        {showWarehousePicker && locationType === "warehouse" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 pt-2">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4
                    style={{
                      fontFamily: "'Urbanist', sans-serif",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#002d5b",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Select Location
                  </h4>
                  <p
                    style={{
                      fontFamily: "'Urbanist', sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "rgba(0,45,91,0.35)",
                      marginTop: 2,
                    }}
                  >
                    {filteredWarehouses.length} option{filteredWarehouses.length !== 1 ? "s" : ""} near you
                  </p>
                </div>
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: "rgba(1,113,227,0.08)",
                    border: "1px solid rgba(1,113,227,0.15)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Urbanist', sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "rgba(0,45,91,0.4)",
                    }}
                  >
                    Features for
                  </span>
                  <span
                    style={{
                      fontFamily: "'Urbanist', sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#0171e3",
                    }}
                  >
                    Electronics
                  </span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <div
                  className="flex items-center gap-3 px-4"
                  style={{
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: "#ffffff",
                    border: "1.5px solid #e8ecf0",
                    transition: "border-color 0.2s",
                  }}
                >
                  <Search size={16} className="text-[#b0b8c1] shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search by name, address, or zip..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchDropdown(e.target.value.length > 0);
                    }}
                    onFocus={() => {
                      if (searchQuery.length > 0) setShowSearchDropdown(true);
                    }}
                    onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                    className="flex-1 bg-transparent outline-none"
                    style={{
                      fontFamily: "'Urbanist', sans-serif",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#1d1d1f",
                    }}
                  />
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => {
                        setSearchQuery("");
                        setShowSearchDropdown(false);
                      }}
                      className="cursor-pointer"
                    >
                      <X size={14} className="text-[#c7c7cc]" />
                    </motion.button>
                  )}
                  <motion.button
                    onClick={() => setShowFilters(!showFilters)}
                    className="cursor-pointer shrink-0 p-1.5 rounded-lg"
                    style={{
                      backgroundColor: showFilters ? "#0171e3" : "transparent",
                      transition: "background-color 0.2s",
                    }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <SlidersHorizontal size={16} className={showFilters ? "text-white" : "text-[#b0b8c1]"} />
                  </motion.button>
                </div>

                {/* Search Dropdown */}
                <AnimatePresence>
                  {showSearchDropdown && searchSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="absolute z-20 left-0 right-0 mt-1.5 rounded-2xl overflow-hidden"
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1.5px solid #e8ecf0",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                      }}
                    >
                      {searchSuggestions.map((w, i) => (
                        <motion.button
                          key={w.id}
                          onClick={() => {
                            handleSelectWarehouse(w);
                            setSearchQuery("");
                            setShowSearchDropdown(false);
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 cursor-pointer text-left"
                          style={{
                            backgroundColor: i === 0 ? "#1b3a5c" : "transparent",
                            borderBottom: i < searchSuggestions.length - 1 ? "1px solid #f0f2f4" : "none",
                          }}
                          whileHover={{ backgroundColor: i === 0 ? "#1b3a5c" : "#f8f9fa" }}
                        >
                          <div>
                            <span
                              style={{
                                fontFamily: "'Urbanist', sans-serif",
                                fontSize: 13.5,
                                fontWeight: 600,
                                color: i === 0 ? "#ffffff" : "#1d1d1f",
                              }}
                            >
                              {w.name}
                            </span>
                            {i === 0 && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <MapPin size={10} className="text-white/50" />
                                <span
                                  style={{
                                    fontFamily: "'Urbanist', sans-serif",
                                    fontSize: 11,
                                    fontWeight: 500,
                                    color: "rgba(255,255,255,0.5)",
                                  }}
                                >
                                  {w.distance} miles away
                                </span>
                                <span
                                  style={{
                                    fontFamily: "'Urbanist', sans-serif",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: "rgba(255,255,255,0.6)",
                                    marginLeft: 4,
                                  }}
                                >
                                  A+
                                </span>
                              </div>
                            )}
                          </div>
                          <span
                            style={{
                              fontFamily: "'Urbanist', sans-serif",
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: i === 0 ? "rgba(255,255,255,0.8)" : "#86868b",
                            }}
                          >
                            ${w.price}/week
                          </span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Filters Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="flex flex-col gap-5 p-5 rounded-2xl"
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1.5px solid #e8ecf0",
                      }}
                    >
                      <h5
                        style={{
                          fontFamily: "'Urbanist', sans-serif",
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#1d1d1f",
                        }}
                      >
                        Filters
                      </h5>

                      {/* Distance */}
                      <div className="flex flex-col gap-2">
                        <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 10.5, fontWeight: 700, color: "#aeaeb2", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          Distance
                        </span>
                        <div className="flex gap-1.5">
                          {[
                            { label: "Any", value: "any" },
                            { label: "< 5 mi", value: "5" },
                            { label: "< 10 mi", value: "10" },
                            { label: "< 15 mi", value: "15" },
                          ].map((opt) => (
                            <motion.button
                              key={opt.value}
                              onClick={() => setFilterDistance(opt.value)}
                              className="px-3 py-1.5 rounded-full cursor-pointer"
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                fontFamily: "'Urbanist', sans-serif",
                                backgroundColor: filterDistance === opt.value ? "#0171e3" : "#f5f5f7",
                                color: filterDistance === opt.value ? "#ffffff" : "#6e6e73",
                                border: "none",
                                transition: "all 0.2s",
                              }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {opt.label}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Max Price */}
                      <div className="flex flex-col gap-2">
                        <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 10.5, fontWeight: 700, color: "#aeaeb2", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          Max price /spot/wk
                        </span>
                        <div className="flex gap-1.5">
                          {[
                            { label: "Any", value: "any" },
                            { label: "< $30", value: "30" },
                            { label: "< $40", value: "40" },
                            { label: "< $50", value: "50" },
                          ].map((opt) => (
                            <motion.button
                              key={opt.value}
                              onClick={() => setFilterPrice(opt.value)}
                              className="px-3 py-1.5 rounded-full cursor-pointer"
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                fontFamily: "'Urbanist', sans-serif",
                                backgroundColor: filterPrice === opt.value ? "#0171e3" : "#f5f5f7",
                                color: filterPrice === opt.value ? "#ffffff" : "#6e6e73",
                                border: "none",
                                transition: "all 0.2s",
                              }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {opt.label}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Min Rating */}
                      <div className="flex flex-col gap-2">
                        <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 10.5, fontWeight: 700, color: "#aeaeb2", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          Min rating
                        </span>
                        <div className="flex gap-1.5">
                          {[
                            { label: "Any", value: "any" },
                            { label: "3.5+", value: "3.5" },
                            { label: "4.0+", value: "4.0" },
                            { label: "4.5+", value: "4.5" },
                          ].map((opt) => (
                            <motion.button
                              key={opt.value}
                              onClick={() => setFilterRating(opt.value)}
                              className="px-3 py-1.5 rounded-full cursor-pointer"
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                fontFamily: "'Urbanist', sans-serif",
                                backgroundColor: filterRating === opt.value ? "#0171e3" : "#f5f5f7",
                                color: filterRating === opt.value ? "#ffffff" : "#6e6e73",
                                border: "none",
                                transition: "all 0.2s",
                              }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {opt.label}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Open Now */}
                      <div className="flex items-center justify-between">
                        <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 10.5, fontWeight: 700, color: "#aeaeb2", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          Open now only
                        </span>
                        <motion.button
                          onClick={() => setFilterOpenOnly(!filterOpenOnly)}
                          className="relative cursor-pointer"
                          style={{
                            width: 44,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: filterOpenOnly ? "#0171e3" : "#e0e0e0",
                            transition: "background-color 0.2s",
                            border: "none",
                          }}
                        >
                          <motion.div
                            animate={{ x: filterOpenOnly ? 20 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: "#ffffff",
                              position: "absolute",
                              top: 2,
                              left: 2,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                            }}
                          />
                        </motion.button>
                      </div>

                      {/* Required Features */}
                      <div className="flex flex-col gap-2">
                        <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 10.5, fontWeight: 700, color: "#aeaeb2", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          Required features
                        </span>
                        <div className="flex gap-1.5 flex-wrap">
                          {["Climate", "Security", "Forklift", "24hr", "Dock", "Tracking"].map((f) => {
                            const isActive = filterFeatures.includes(f);
                            return (
                              <motion.button
                                key={f}
                                onClick={() => toggleFeatureFilter(f)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer"
                                style={{
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  fontFamily: "'Urbanist', sans-serif",
                                  backgroundColor: isActive ? "rgba(1,113,227,0.1)" : "#f5f5f7",
                                  color: isActive ? "#0171e3" : "#86868b",
                                  border: isActive ? "1px solid rgba(1,113,227,0.3)" : "1px solid transparent",
                                  transition: "all 0.2s",
                                }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <span style={{ color: featureColors[f] || "#86868b" }}>{featureIcons[f]}</span>
                                {f}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sort Pills */}
              <div className="flex gap-2">
                {(
                  [
                    { label: "All", value: "all" },
                    { label: "Nearest", value: "nearest" },
                    { label: "Cheapest", value: "cheapest" },
                    { label: "Top Rated", value: "top" },
                  ] as const
                ).map((pill) => (
                  <motion.button
                    key={pill.value}
                    onClick={() => setSortFilter(pill.value)}
                    className="px-4 py-2 rounded-full cursor-pointer"
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "'Urbanist', sans-serif",
                      backgroundColor: sortFilter === pill.value ? "#0171e3" : "transparent",
                      color: sortFilter === pill.value ? "#ffffff" : "#6e6e73",
                      border: sortFilter === pill.value ? "none" : "1px solid #e0e0e0",
                      transition: "all 0.2s",
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {pill.label}
                  </motion.button>
                ))}
              </div>

              {/* Sort label */}
              <p
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#c7c7cc",
                  marginTop: -4,
                }}
              >
                Sorted by weekly rate, lowest first
              </p>

              {/* Warehouse Cards */}
              <div className="flex flex-col gap-3">
                {filteredWarehouses.length === 0 && (
                  <div
                    className="flex items-center justify-center py-12 rounded-2xl"
                    style={{ backgroundColor: "#f9f8f5", border: "1.5px solid #eff1f2" }}
                  >
                    <p style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 14, fontWeight: 500, color: "#aeaeb2" }}>
                      No warehouses match your criteria
                    </p>
                  </div>
                )}

                {filteredWarehouses.map((w, i) => {
                  const isSelected = isWarehouseSelected(w.id);
                  const isHovered = hoveredWarehouse === w.id;

                  return (
                    <motion.div
                      key={w.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      onMouseEnter={() => setHoveredWarehouse(w.id)}
                      onMouseLeave={() => setHoveredWarehouse(null)}
                      className="relative"
                      style={{
                        padding: "18px 20px",
                        borderRadius: 20,
                        backgroundColor: isSelected
                          ? "rgba(211, 227, 253, 0.25)"
                          : isHovered
                            ? "rgba(255,255,255,0.9)"
                            : "#ffffff",
                        border: isSelected
                          ? "1.6px solid #0171e3"
                          : "1.5px solid #eff1f2",
                        boxShadow: isSelected
                          ? "0 4px 15px rgba(1,113,227,0.1)"
                          : isHovered
                            ? "0 4px 15px rgba(0,0,0,0.05)"
                            : "0 2px 8px rgba(0,0,0,0.02)",
                        transition: "all 0.25s",
                        cursor: "pointer",
                      }}
                      onClick={() => handleSelectWarehouse(w)}
                    >
                      {/* Top row: Name + Reviews + Rating */}
                      <div className="flex items-start justify-between mb-2">
                        <h5
                          style={{
                            fontFamily: "'Urbanist', sans-serif",
                            fontSize: 15,
                            fontWeight: 700,
                            color: isSelected ? "#0171e3" : "#002d5b",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {w.name}
                        </h5>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Reviews badge */}
                          <div
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: w.reviews > 100 ? "rgba(231,76,60,0.08)" : "rgba(1,113,227,0.06)",
                              border: `1px solid ${w.reviews > 100 ? "rgba(231,76,60,0.15)" : "rgba(1,113,227,0.12)"}`,
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <rect x="1" y="2" width="8" height="6" rx="1" stroke={w.reviews > 100 ? "#e74c3c" : "#0171e3"} strokeWidth="0.8" />
                              <path d="M1 5.5L5 4L9 5.5" stroke={w.reviews > 100 ? "#e74c3c" : "#0171e3"} strokeWidth="0.6" />
                            </svg>
                            <span
                              style={{
                                fontFamily: "'Urbanist', sans-serif",
                                fontSize: 10.5,
                                fontWeight: 700,
                                color: w.reviews > 100 ? "#e74c3c" : "#0171e3",
                              }}
                            >
                              +${w.reviews}
                            </span>
                          </div>
                          {/* Rating */}
                          <div className="flex items-center gap-0.5">
                            <Star size={12} fill="#f5a623" stroke="#f5a623" />
                            <span
                              style={{
                                fontFamily: "'Urbanist', sans-serif",
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#6e6e73",
                              }}
                            >
                              {w.rating}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <MapPin size={11} className="text-[#0171e3] shrink-0" />
                        <span
                          style={{
                            fontFamily: "'Urbanist', sans-serif",
                            fontSize: 12,
                            fontWeight: 500,
                            color: "#86868b",
                          }}
                        >
                          {w.address}, {w.city}, {w.state} {w.zip}
                        </span>
                      </div>

                      {/* Open status + spots */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: w.isOpen ? "#34c759" : "#ff3b30" }}
                          />
                          <span
                            style={{
                              fontFamily: "'Urbanist', sans-serif",
                              fontSize: 11,
                              fontWeight: 600,
                              color: w.isOpen ? "#34c759" : "#ff3b30",
                            }}
                          >
                            {w.isOpen ? "Open" : "Closed"}
                          </span>
                          {w.closingTime && (
                            <span
                              style={{
                                fontFamily: "'Urbanist', sans-serif",
                                fontSize: 11,
                                fontWeight: 500,
                                color: w.isOpen ? "#0171e3" : "#ff9500",
                              }}
                            >
                              {w.isOpen ? `Until ${w.closingTime}` : `Opens ${w.closingTime}`}
                            </span>
                          )}
                          {!w.closingTime && (
                            <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 11, fontWeight: 500, color: "#0171e3" }}>
                              24/7
                            </span>
                          )}
                        </div>
                        <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 11, fontWeight: 500, color: w.spotsAvailable <= 10 ? "#ff3b30" : "#86868b" }}>
                          {w.spotsAvailable <= 10 ? `🔥 ${w.spotsAvailable} left` : `${w.spotsAvailable} spots`}
                        </span>
                        <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 11, fontWeight: 500, color: "#c7c7cc" }}>·</span>
                        <span
                          style={{
                            fontFamily: "'Urbanist', sans-serif",
                            fontSize: 11,
                            fontWeight: 600,
                            color: w.portDistance <= 2 ? "#34c759" : w.portDistance <= 5 ? "#ff9500" : "#c0695a",
                          }}
                        >
                          {w.portDistance} mi from {PORT_NAME.replace("Port of ", "")} · +${calcLocationSurcharge(w.portDistance).toFixed(2)}/unit
                        </span>
                      </div>

                      {/* Price + Features + Select */}
                      <div className="flex items-end justify-between">
                        <div className="flex items-baseline gap-1">
                          <span
                            style={{
                              fontFamily: "'Urbanist', sans-serif",
                              fontSize: 22,
                              fontWeight: 800,
                              color: "#002d5b",
                              letterSpacing: "-0.02em",
                            }}
                          >
                            ${w.price}
                          </span>
                          <span
                            style={{
                              fontFamily: "'Urbanist', sans-serif",
                              fontSize: 11,
                              fontWeight: 500,
                              color: "#aeaeb2",
                            }}
                          >
                            /spot /wk
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Feature pills */}
                          {w.features.slice(0, 3).map((f) => (
                            <div
                              key={f}
                              className="flex items-center gap-1 px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: "#f5f5f7",
                                border: "0.5px solid #e8e8ed",
                              }}
                            >
                              <span style={{ color: featureColors[f] || "#86868b" }}>{featureIcons[f]}</span>
                              <span
                                style={{
                                  fontFamily: "'Urbanist', sans-serif",
                                  fontSize: 10,
                                  fontWeight: 600,
                                  color: "#86868b",
                                }}
                              >
                                {f}
                              </span>
                            </div>
                          ))}
                          {w.features.length > 3 && (
                            <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 10, fontWeight: 500, color: "#c7c7cc" }}>
                              +{w.features.length - 3}
                            </span>
                          )}

                          {/* Select button */}
                          <motion.div
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer"
                            style={{
                              backgroundColor: isSelected ? "#0171e3" : "transparent",
                              border: isSelected ? "none" : "1px solid #e0e0e0",
                              transition: "all 0.2s",
                            }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <span
                              style={{
                                fontFamily: "'Urbanist', sans-serif",
                                fontSize: 12,
                                fontWeight: 600,
                                color: isSelected ? "#ffffff" : "#86868b",
                              }}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </span>
                            <ArrowRight size={11} className={isSelected ? "text-white" : "text-[#86868b]"} />
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}