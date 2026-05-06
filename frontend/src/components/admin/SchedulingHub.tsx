"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar, Clock, Truck, ClipboardCheck, MapPin, User,
  ChevronLeft, ChevronRight, Plus, CheckCircle2, AlertCircle,
  X, Phone, Package, ArrowRight, Eye, Timer, Flag
} from "lucide-react";
import { BounceButton } from "./BounceButton";
import { StatusPill } from "./StatusPill";
import { StatCard } from "./StatCard";

// ─── Types ──────────────────────────────────────────────

type ScheduleType = "pickup" | "inspection";

interface ScheduleSlot {
  id: string;
  type: ScheduleType;
  title: string;
  subtitle: string;
  location: string;
  sellerCity: string;
  sellerCountry: string;
  countryFlag: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  assignedWorker: string;
  workerAvatar: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled" | "rescheduled";
  priority: "high" | "medium" | "low";
  listingId: string;
  notes?: string;
}

// ─── Mock Schedule Data ─────────────────────────────────

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const currentWeekDates = ["Mar 9", "Mar 10", "Mar 11", "Mar 12", "Mar 13", "Mar 14", "Mar 15"];

const mockSchedule: ScheduleSlot[] = [
  {
    id: "SCH-001", type: "pickup", title: "Sample Pickup - Herbal Tea", subtitle: "GreenLeaf Organics",
    location: "Kyoto, Japan (Local warehouse)", sellerCity: "Kyoto", sellerCountry: "Japan", countryFlag: "🇯🇵",
    date: "Mar 13", timeStart: "9:00 AM", timeEnd: "10:30 AM",
    assignedWorker: "Marcus Thompson", workerAvatar: "MT", status: "completed", priority: "high",
    listingId: "LST-1001", notes: "Contact seller 30 min before arrival"
  },
  {
    id: "SCH-002", type: "pickup", title: "Sample Pickup - Composite Sheets", subtitle: "Atlas Materials",
    location: "Stuttgart, Germany (DHL pickup point)", sellerCity: "Stuttgart", sellerCountry: "Germany", countryFlag: "🇩🇪",
    date: "Mar 13", timeStart: "11:00 AM", timeEnd: "12:00 PM",
    assignedWorker: "Aisha Rahman", workerAvatar: "AR", status: "in-progress", priority: "medium",
    listingId: "LST-1005"
  },
  {
    id: "SCH-003", type: "inspection", title: "Quality Inspection - HEPA Filters", subtitle: "Meridian Corp",
    location: "QC Lab - Section B", sellerCity: "Shenzhen", sellerCountry: "China", countryFlag: "🇨🇳",
    date: "Mar 13", timeStart: "1:00 PM", timeEnd: "3:00 PM",
    assignedWorker: "Priya Sharma", workerAvatar: "PS", status: "scheduled", priority: "high",
    listingId: "LST-1002", notes: "Focus on filtration efficiency and packaging consistency"
  },
  {
    id: "SCH-004", type: "inspection", title: "Quality Audit - Protein Bars", subtitle: "FreshPack Foods",
    location: "QC Lab - Section A", sellerCity: "Auckland", sellerCountry: "New Zealand", countryFlag: "🇳🇿",
    date: "Mar 13", timeStart: "3:30 PM", timeEnd: "5:00 PM",
    assignedWorker: "James Liu", workerAvatar: "JL", status: "scheduled", priority: "medium",
    listingId: "LST-1004"
  },
  {
    id: "SCH-005", type: "pickup", title: "Order Pickup - Tea Batch #290", subtitle: "GreenLeaf Organics",
    location: "Warehouse District 3, Kyoto", sellerCity: "Kyoto", sellerCountry: "Japan", countryFlag: "🇯🇵",
    date: "Mar 14", timeStart: "9:00 AM", timeEnd: "10:00 AM",
    assignedWorker: "Lin Wei", workerAvatar: "LW", status: "scheduled", priority: "low",
    listingId: "LST-1001"
  },
  {
    id: "SCH-006", type: "inspection", title: "Re-inspection - LED Panel B200", subtitle: "BrightStar Electronics",
    location: "QC Lab - Section C", sellerCity: "Taipei", sellerCountry: "Taiwan", countryFlag: "🇹🇼",
    date: "Mar 14", timeStart: "11:00 AM", timeEnd: "1:00 PM",
    assignedWorker: "Priya Sharma", workerAvatar: "PS", status: "scheduled", priority: "high",
    listingId: "LST-1003", notes: "FCC compliance check pending"
  },
  {
    id: "SCH-007", type: "pickup", title: "Sample Return - Ceramic Set", subtitle: "Terra Clay Studio",
    location: "Oaxaca, Mexico (Courier)", sellerCity: "Oaxaca", sellerCountry: "Mexico", countryFlag: "🇲🇽",
    date: "Mar 15", timeStart: "10:00 AM", timeEnd: "11:00 AM",
    assignedWorker: "Carlos Mendez", workerAvatar: "CM", status: "scheduled", priority: "low",
    listingId: "LST-1006"
  },
];

const timeSlots = ["8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"];

// ─── Schedule Card ──────────────────────────────────────

function ScheduleCard({ slot, onClick }: { slot: ScheduleSlot; onClick: () => void }) {
  const priorityColors = {
    high: { bg: "bg-[#E5484D]/6", text: "text-[#E5484D]", dot: "bg-[#E5484D]" },
    medium: { bg: "bg-[#FFB224]/6", text: "text-[#FFB224]", dot: "bg-[#FFB224]" },
    low: { bg: "bg-[#30A46C]/6", text: "text-[#30A46C]", dot: "bg-[#30A46C]" },
  };
  const pc = priorityColors[slot.priority];
  const isPickup = slot.type === "pickup";

  return (
    <motion.div
      className={`p-4 rounded-2xl border cursor-pointer group transition-all hover:shadow-md ${
        slot.status === "completed"
          ? "bg-[#30A46C]/3 border-[#30A46C]/15 opacity-70"
          : slot.status === "in-progress"
          ? "bg-primary/3 border-primary/20"
          : "bg-card border-border/30"
      }`}
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Type indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
            isPickup ? "bg-[#3B82F6]/10 text-[#3B82F6]" : "bg-[#0171E3]/10 text-[#0171E3]"
          }`}>
            {isPickup ? <Truck size={13} /> : <ClipboardCheck size={13} />}
          </div>
          <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider">
            {isPickup ? "Pickup" : "Inspection"}
          </span>
        </div>
        <span className={`w-2 h-2 rounded-full ${pc.dot}`} />
      </div>

      <h4 className="text-[0.8125rem] text-foreground leading-snug mb-1">{slot.title}</h4>
      <p className="text-[0.6875rem] text-muted-foreground mb-1">{slot.subtitle}</p>
      <p className="text-[0.6875rem] text-muted-foreground mb-3 flex items-center gap-1">
        <span>{slot.countryFlag}</span>
        {slot.sellerCity}, {slot.sellerCountry}
      </p>

      {/* Time & Location */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
          <Clock size={11} />
          <span>{slot.timeStart} - {slot.timeEnd}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
          <MapPin size={11} />
          <span className="truncate">{slot.location}</span>
        </div>
      </div>

      {/* Worker */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/15">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-white text-[0.5rem]">
            {slot.workerAvatar}
          </div>
          <span className="text-[0.6875rem] text-foreground">{slot.assignedWorker}</span>
        </div>
        <StatusPill
          status={
            slot.status === "completed" ? "success" :
            slot.status === "in-progress" ? "info" :
            slot.status === "cancelled" ? "error" : "pending"
          }
          label={
            slot.status === "completed" ? "Done" :
            slot.status === "in-progress" ? "Active" :
            slot.status === "cancelled" ? "Cancelled" : "Scheduled"
          }
          pulse={slot.status === "in-progress"}
        />
      </div>
    </motion.div>
  );
}

// ─── Detail Drawer ──────────────────────────────────────

function ScheduleDetail({ slot, onClose }: { slot: ScheduleSlot; onClose: () => void }) {
  const isPickup = slot.type === "pickup";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/15 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="absolute right-0 top-0 bottom-0 w-full max-w-[480px] bg-background overflow-y-auto shadow-2xl"
        initial={{ x: 480 }}
        animate={{ x: 0 }}
        exit={{ x: 480 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
      >
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                isPickup ? "bg-[#3B82F6]" : "bg-[#0171E3]"
              }`}>
                {isPickup ? <Truck size={18} /> : <ClipboardCheck size={18} />}
              </div>
              <div>
                <p className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider">{slot.id}</p>
                <h3 className="text-foreground tracking-tight">{isPickup ? "Pickup" : "Inspection"} Details</h3>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/40 cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-foreground tracking-tight">{slot.title}</h2>
            <p className="text-[0.8125rem] text-muted-foreground mt-1">{slot.subtitle}</p>
            <p className="text-[0.75rem] text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="text-[0.875rem]">{slot.countryFlag}</span>
              <MapPin size={12} />
              {slot.sellerCity}, {slot.sellerCountry}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-muted/15">
              <p className="text-[0.6875rem] text-muted-foreground mb-0.5">Date</p>
              <p className="text-[0.8125rem] text-foreground">{slot.date}, 2026</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-muted/15">
              <p className="text-[0.6875rem] text-muted-foreground mb-0.5">Time</p>
              <p className="text-[0.8125rem] text-foreground">{slot.timeStart} - {slot.timeEnd}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-muted/15">
              <p className="text-[0.6875rem] text-muted-foreground mb-0.5">Seller Origin</p>
              <p className="text-[0.8125rem] text-foreground flex items-center gap-1">
                <span>{slot.countryFlag}</span> {slot.sellerCity}, {slot.sellerCountry}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-muted/15">
              <p className="text-[0.6875rem] text-muted-foreground mb-0.5">{slot.type === "pickup" ? "Pickup" : "Inspection"} Location</p>
              <p className="text-[0.8125rem] text-foreground">{slot.location}</p>
            </div>
          </div>

          {/* Assigned Worker */}
          <div className="p-4 rounded-2xl bg-muted/10 border border-border/20">
            <p className="text-[0.6875rem] text-muted-foreground mb-3">Assigned Worker</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-white text-[0.6875rem]">
                {slot.workerAvatar}
              </div>
              <div className="flex-1">
                <p className="text-[0.875rem] text-foreground">{slot.assignedWorker}</p>
                <p className="text-[0.6875rem] text-muted-foreground capitalize">{isPickup ? "Driver" : "QC Inspector"}</p>
              </div>
              <BounceButton variant="ghost" size="sm" icon={<Phone size={13} />}>Call</BounceButton>
            </div>
          </div>

          {/* Notes */}
          {slot.notes && (
            <div className="p-3.5 rounded-2xl bg-[#FFB224]/5 border border-[#FFB224]/10">
              <p className="text-[0.6875rem] text-[#D97706] mb-1">Notes</p>
              <p className="text-[0.8125rem] text-foreground">{slot.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {slot.status === "scheduled" && (
              <>
                <BounceButton variant="primary" size="md" icon={<CheckCircle2 size={16} />} energyWeight={3}>
                  Start {isPickup ? "Pickup" : "Inspection"}
                </BounceButton>
                <BounceButton variant="secondary" size="md" icon={<Calendar size={16} />}>
                  Reschedule
                </BounceButton>
                <BounceButton variant="ghost" size="md" icon={<X size={16} />}>
                  Cancel
                </BounceButton>
              </>
            )}
            {slot.status === "in-progress" && (
              <>
                <BounceButton variant="success" size="md" icon={<CheckCircle2 size={16} />} energyWeight={5}>
                  Mark Complete
                </BounceButton>
                <BounceButton variant="warning" size="md" icon={<AlertCircle size={16} />}>
                  Report Issue
                </BounceButton>
              </>
            )}
            {slot.status === "completed" && (
              <BounceButton variant="secondary" size="md" icon={<Eye size={16} />}>
                View Report
              </BounceButton>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Scheduling Hub ────────────────────────────────

export function SchedulingHub() {
  const [view, setView] = useState<"list" | "week">("list");
  const [typeFilter, setTypeFilter] = useState<"all" | "pickup" | "inspection">("all");
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [selectedDay, setSelectedDay] = useState("Mar 13");

  const filtered = mockSchedule.filter(s => {
    if (typeFilter !== "all" && s.type !== typeFilter) return false;
    return true;
  });

  const todaySlots = filtered.filter(s => s.date === "Mar 13");
  const tomorrowSlots = filtered.filter(s => s.date === "Mar 14");
  const laterSlots = filtered.filter(s => s.date !== "Mar 13" && s.date !== "Mar 14");

  const todayPickups = mockSchedule.filter(s => s.date === "Mar 13" && s.type === "pickup").length;
  const todayInspections = mockSchedule.filter(s => s.date === "Mar 13" && s.type === "inspection").length;

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1">Scheduling</h1>
          <p className="text-muted-foreground text-[0.875rem]">
            Schedule and track sample pickups and quality inspections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BounceButton variant="primary" size="sm" icon={<Plus size={15} />} energyWeight={2}>
            New Schedule
          </BounceButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Today's Pickups"
          value={todayPickups.toString()}
          icon={<Truck size={20} className="text-[#3B82F6]" />}
          iconBg="bg-[#3B82F6]/8"
          index={0}
          subtitle="Sample & order pickups"
          accentColor="#3B82F6"
        />
        <StatCard
          label="Today's Inspections"
          value={todayInspections.toString()}
          icon={<ClipboardCheck size={20} className="text-[#0171E3]" />}
          iconBg="bg-[#0171E3]/8"
          index={1}
          subtitle="Quality checks scheduled"
          accentColor="#0171E3"
        />
        <StatCard
          label="This Week"
          value={mockSchedule.length.toString()}
          change="3 remaining"
          changeType="neutral"
          icon={<Calendar size={20} className="text-[#D97706]" />}
          iconBg="bg-[#D97706]/8"
          index={2}
          subtitle="Total scheduled events"
          sparklineData={[5, 8, 6, 7, 9, 7, mockSchedule.length]}
          sparklineColor="#D97706"
          accentColor="#D97706"
        />
        <StatCard
          label="Completion Rate"
          value="92%"
          change="+4% vs last week"
          changeType="positive"
          icon={<CheckCircle2 size={20} className="text-[#30A46C]" />}
          iconBg="bg-[#30A46C]/8"
          index={3}
          subtitle="On-time completion"
          sparklineData={[82, 85, 86, 88, 89, 91, 92]}
          sparklineColor="#30A46C"
          accentColor="#30A46C"
        />
      </div>

      {/* Week Timeline */}
      <div className="bg-card rounded-3xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-foreground tracking-tight">Week of March 9 - 15, 2026</h3>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-xl hover:bg-muted/40 cursor-pointer"><ChevronLeft size={16} /></button>
            <button className="px-3 py-1.5 rounded-xl text-[0.75rem] text-primary hover:bg-primary/6 cursor-pointer">Today</button>
            <button className="p-2 rounded-xl hover:bg-muted/40 cursor-pointer"><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const date = currentWeekDates[i];
            const isToday = date === "Mar 13";
            const daySlots = mockSchedule.filter(s => s.date === date);
            const pickups = daySlots.filter(s => s.type === "pickup").length;
            const inspections = daySlots.filter(s => s.type === "inspection").length;

            return (
              <motion.button
                key={day}
                onClick={() => setSelectedDay(date)}
                className={`p-3 rounded-2xl text-center transition-all cursor-pointer ${
                  selectedDay === date
                    ? "bg-primary/8 border-2 border-primary/30"
                    : isToday
                    ? "bg-primary/4 border border-primary/10"
                    : "border border-border/20 hover:border-border/40"
                }`}
                whileTap={{ scale: 0.97 }}
              >
                <p className={`text-[0.6875rem] ${isToday ? "text-primary" : "text-muted-foreground"}`}>{day}</p>
                <p className={`text-[0.9375rem] mt-0.5 ${isToday ? "text-primary" : "text-foreground"}`}>
                  {date.split(" ")[1]}
                </p>
                {daySlots.length > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {pickups > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />}
                    {inspections > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#0171E3]" />}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/15">
          <div className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" /> Pickups
          </div>
          <div className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-[#0171E3]" /> Inspections
          </div>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-2">
        {([
          { key: "all", label: "All Events", icon: <Calendar size={14} /> },
          { key: "pickup", label: "Pickups", icon: <Truck size={14} /> },
          { key: "inspection", label: "Inspections", icon: <ClipboardCheck size={14} /> },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setTypeFilter(f.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] transition-all cursor-pointer ${
              typeFilter === f.key
                ? "bg-primary/8 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      {/* Schedule List by Day */}
      {todaySlots.length > 0 && (
        <div>
          <h3 className="text-foreground tracking-tight mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Today — March 13
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaySlots.map((slot, i) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ScheduleCard slot={slot} onClick={() => setSelectedSlot(slot)} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {tomorrowSlots.length > 0 && (
        <div>
          <h3 className="text-foreground tracking-tight mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            Tomorrow — March 14
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tomorrowSlots.map((slot, i) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ScheduleCard slot={slot} onClick={() => setSelectedSlot(slot)} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {laterSlots.length > 0 && (
        <div>
          <h3 className="text-foreground tracking-tight mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/20" />
            Later This Week
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {laterSlots.map((slot, i) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ScheduleCard slot={slot} onClick={() => setSelectedSlot(slot)} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedSlot && (
          <ScheduleDetail slot={selectedSlot} onClose={() => setSelectedSlot(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}