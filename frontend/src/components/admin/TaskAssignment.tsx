"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Users, ChevronDown, Clock, ArrowRight, CheckCircle2,
  RotateCcw, AlertCircle, History, UserCheck, UserMinus,
  Truck, ClipboardCheck, Camera, Scale, Package, X
} from "lucide-react";
import { BounceButton } from "./BounceButton";
import { StatusPill } from "./StatusPill";

// ─── Types ──────────────────────────────────────────────

export interface Worker {
  id: string;
  name: string;
  avatar: string;
  role: "driver" | "inspector" | "photographer" | "packaging";
  available: boolean;
  currentLoad: number;
  maxLoad: number;
  rating: number;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  fromWorker?: string;
  toWorker?: string;
  changedBy: string;
  stage: string;
  note?: string;
}

export interface StageAssignment {
  stage: string;
  stageLabel: string;
  assignedWorker?: Worker;
  scheduledDate?: string;
  completedDate?: string;
  status: "pending" | "assigned" | "in-progress" | "completed" | "skipped";
}

// ─── Mock Workers ───────────────────────────────────────

export const mockWorkers: Worker[] = [
  { id: "W001", name: "Marcus Thompson", avatar: "MT", role: "driver", available: true, currentLoad: 3, maxLoad: 6, rating: 4.8 },
  { id: "W002", name: "Aisha Rahman", avatar: "AR", role: "driver", available: true, currentLoad: 2, maxLoad: 6, rating: 4.9 },
  { id: "W003", name: "Carlos Mendez", avatar: "CM", role: "driver", available: false, currentLoad: 6, maxLoad: 6, rating: 4.6 },
  { id: "W004", name: "Priya Sharma", avatar: "PS", role: "inspector", available: true, currentLoad: 1, maxLoad: 4, rating: 4.9 },
  { id: "W005", name: "James Liu", avatar: "JL", role: "inspector", available: true, currentLoad: 2, maxLoad: 4, rating: 4.7 },
  { id: "W006", name: "Sarah Kim", avatar: "SK", role: "photographer", available: true, currentLoad: 1, maxLoad: 3, rating: 4.8 },
  { id: "W007", name: "Raj Patel", avatar: "RP", role: "packaging", available: true, currentLoad: 4, maxLoad: 8, rating: 4.5 },
  { id: "W008", name: "Lin Wei", avatar: "LW", role: "driver", available: true, currentLoad: 1, maxLoad: 6, rating: 4.7 },
];

// ─── Mock Audit Log ─────────────────────────────────────

export const mockAuditLog: AuditEntry[] = [
  { id: "AUD-001", timestamp: "Mar 13, 2026 · 9:14 AM", action: "assigned", toWorker: "Marcus Thompson", changedBy: "System (Auto)", stage: "Sample Pickup", note: "Auto-assigned based on availability and route proximity" },
  { id: "AUD-002", timestamp: "Mar 13, 2026 · 10:30 AM", action: "reassigned", fromWorker: "Marcus Thompson", toWorker: "Aisha Rahman", changedBy: "Admin (John D.)", stage: "Sample Pickup", note: "Marcus reassigned to urgent delivery DEL-4826" },
  { id: "AUD-003", timestamp: "Mar 13, 2026 · 11:00 AM", action: "stage_completed", changedBy: "Aisha Rahman", stage: "Sample Pickup", note: "Sample collected successfully. Condition: Good" },
  { id: "AUD-004", timestamp: "Mar 13, 2026 · 11:15 AM", action: "assigned", toWorker: "Priya Sharma", changedBy: "System (Auto)", stage: "Quality Testing", note: "Auto-assigned. Inspector specializes in Food & Beverage" },
  { id: "AUD-005", timestamp: "Mar 13, 2026 · 2:45 PM", action: "stage_advanced", changedBy: "Priya Sharma", stage: "Quality Testing", note: "Quality score: 4.5/5. Passed all checkpoints." },
];

// ─── Stage Icons Map ────────────────────────────────────

const stageIcons: Record<string, React.ReactNode> = {
  "received": <Package size={14} />,
  "sample_pickup": <Truck size={14} />,
  "quality_testing": <ClipboardCheck size={14} />,
  "legal_review": <Scale size={14} />,
  "photography": <Camera size={14} />,
  "published": <CheckCircle2 size={14} />,
};

// ─── Worker Picker Component ────────────────────────────

function WorkerPicker({
  workers,
  currentWorker,
  roleFilter,
  onSelect,
  onClose,
}: {
  workers: Worker[];
  currentWorker?: Worker;
  roleFilter: string;
  onSelect: (worker: Worker) => void;
  onClose: () => void;
}) {
  const filtered = workers.filter(w => {
    if (roleFilter === "driver") return w.role === "driver";
    if (roleFilter === "inspector") return w.role === "inspector";
    if (roleFilter === "photographer") return w.role === "photographer";
    return true;
  });

  return (
    <motion.div
      className="absolute z-20 top-full left-0 right-0 mt-2 bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden"
      initial={{ opacity: 0, y: -5, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -5, scale: 0.98 }}
    >
      <div className="p-3 border-b border-border/30 flex items-center justify-between">
        <span className="text-[0.75rem] text-muted-foreground">Select Worker</span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/40 cursor-pointer">
          <X size={14} />
        </button>
      </div>
      <div className="max-h-[220px] overflow-y-auto p-2 space-y-1">
        {filtered.map((worker) => (
          <button
            key={worker.id}
            onClick={() => onSelect(worker)}
            disabled={!worker.available}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
              currentWorker?.id === worker.id
                ? "bg-primary/8 border border-primary/20"
                : worker.available
                ? "hover:bg-muted/30"
                : "opacity-40 cursor-not-allowed"
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.625rem] ${
              worker.available ? "bg-gradient-to-br from-primary/60 to-primary text-white" : "bg-muted text-muted-foreground"
            }`}>
              {worker.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[0.8125rem] text-foreground truncate">{worker.name}</p>
              <p className="text-[0.625rem] text-muted-foreground">
                {worker.currentLoad}/{worker.maxLoad} tasks · {worker.rating} rating
              </p>
            </div>
            {worker.available ? (
              <span className="w-2 h-2 rounded-full bg-[#30A46C]" />
            ) : (
              <span className="text-[0.625rem] text-muted-foreground">Busy</span>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Assignment Card (per stage) ────────────────────────

export function AssignmentCard({
  assignment,
  canReassign = true,
  workers,
  onReassign,
}: {
  assignment: StageAssignment;
  canReassign?: boolean;
  workers: Worker[];
  onReassign?: (stage: string, worker: Worker) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const statusColors = {
    pending: { bg: "bg-muted/20", text: "text-muted-foreground", label: "Pending" },
    assigned: { bg: "bg-[#3B82F6]/6", text: "text-[#3B82F6]", label: "Assigned" },
    "in-progress": { bg: "bg-[#0171E3]/6", text: "text-[#0171E3]", label: "In Progress" },
    completed: { bg: "bg-[#30A46C]/6", text: "text-[#30A46C]", label: "Completed" },
    skipped: { bg: "bg-muted/20", text: "text-muted-foreground", label: "Skipped" },
  };

  const sc = statusColors[assignment.status];

  return (
    <div className="relative">
      <div className={`p-4 rounded-2xl border border-border/20 ${assignment.status === "completed" ? "bg-[#30A46C]/3" : "bg-muted/8"}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{stageIcons[assignment.stage] || <Package size={14} />}</span>
            <span className="text-[0.8125rem] text-foreground">{assignment.stageLabel}</span>
          </div>
          <span className={`text-[0.6875rem] px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
            {sc.label}
          </span>
        </div>

        {assignment.assignedWorker ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-white text-[0.625rem]">
              {assignment.assignedWorker.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[0.8125rem] text-foreground">{assignment.assignedWorker.name}</p>
              <p className="text-[0.625rem] text-muted-foreground capitalize">{assignment.assignedWorker.role}</p>
            </div>
            {canReassign && assignment.status !== "completed" && (
              <BounceButton
                variant="ghost"
                size="sm"
                icon={<RotateCcw size={13} />}
                onClick={() => setShowPicker(!showPicker)}
              >
                Reassign
              </BounceButton>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-border/40 text-[0.8125rem] text-muted-foreground hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
          >
            <UserCheck size={14} />
            <span>Assign Worker</span>
          </button>
        )}

        {assignment.scheduledDate && (
          <div className="flex items-center gap-1.5 mt-2.5 text-[0.6875rem] text-muted-foreground">
            <Clock size={11} />
            <span>Scheduled: {assignment.scheduledDate}</span>
          </div>
        )}
        {assignment.completedDate && (
          <div className="flex items-center gap-1.5 mt-1 text-[0.6875rem] text-[#30A46C]">
            <CheckCircle2 size={11} />
            <span>Completed: {assignment.completedDate}</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPicker && (
          <WorkerPicker
            workers={workers}
            currentWorker={assignment.assignedWorker}
            roleFilter={
              assignment.stage === "sample_pickup" ? "driver" :
              assignment.stage === "quality_testing" ? "inspector" :
              assignment.stage === "photography" ? "photographer" : ""
            }
            onSelect={(worker) => {
              onReassign?.(assignment.stage, worker);
              setShowPicker(false);
            }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Audit Trail Component ──────────────────────────────

export function AuditTrail({ entries }: { entries: AuditEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleEntries = expanded ? entries : entries.slice(0, 3);

  const actionIcons: Record<string, { icon: React.ReactNode; color: string }> = {
    assigned: { icon: <UserCheck size={13} />, color: "#3B82F6" },
    reassigned: { icon: <RotateCcw size={13} />, color: "#D97706" },
    stage_completed: { icon: <CheckCircle2 size={13} />, color: "#30A46C" },
    stage_advanced: { icon: <ArrowRight size={13} />, color: "#0171E3" },
    cost_applied: { icon: <AlertCircle size={13} />, color: "#E5484D" },
    note_added: { icon: <History size={13} />, color: "#7A7D80" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[0.8125rem] text-muted-foreground flex items-center gap-1.5">
          <History size={14} />
          Activity Log
        </h4>
        <span className="text-[0.6875rem] text-muted-foreground">{entries.length} entries</span>
      </div>

      <div className="space-y-1">
        {visibleEntries.map((entry, i) => {
          const config = actionIcons[entry.action] || actionIcons.note_added;
          return (
            <motion.div
              key={entry.id}
              className="flex gap-3 py-3 px-3 rounded-xl hover:bg-muted/15 transition-colors"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              {/* Timeline */}
              <div className="flex flex-col items-center pt-0.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: `${config.color}12`, color: config.color }}
                >
                  {config.icon}
                </div>
                {i < visibleEntries.length - 1 && (
                  <div className="w-[1px] flex-1 bg-border/40 mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[0.8125rem] text-foreground leading-snug">
                  {entry.action === "assigned" && (
                    <>Assigned to <span className="text-primary">{entry.toWorker}</span></>
                  )}
                  {entry.action === "reassigned" && (
                    <>Reassigned from <span className="text-muted-foreground">{entry.fromWorker}</span> to <span className="text-primary">{entry.toWorker}</span></>
                  )}
                  {entry.action === "stage_completed" && (
                    <><span className="text-[#30A46C]">{entry.stage}</span> completed</>
                  )}
                  {entry.action === "stage_advanced" && (
                    <>Advanced past <span className="text-[#0171E3]">{entry.stage}</span></>
                  )}
                  {entry.action === "cost_applied" && (
                    <>Cost deduction applied at <span className="text-[#E5484D]">{entry.stage}</span></>
                  )}
                </p>
                {entry.note && (
                  <p className="text-[0.6875rem] text-muted-foreground mt-0.5 leading-relaxed">{entry.note}</p>
                )}
                <p className="text-[0.625rem] text-muted-foreground/60 mt-1">{entry.changedBy} · {entry.timestamp}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {entries.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center text-[0.75rem] text-primary hover:underline cursor-pointer py-2"
        >
          {expanded ? "Show less" : `Show all ${entries.length} entries`}
        </button>
      )}
    </div>
  );
}
