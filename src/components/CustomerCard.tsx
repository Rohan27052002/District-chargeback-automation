"use client";

import { useState } from "react";
import { motion, useMotionValue, type PanInfo } from "framer-motion";
import {
  IndianRupee,
  Wallet,
  RotateCcw,
  ShieldAlert,
  Building2,
  Clock,
  GripVertical,
  CalendarDays,
  CalendarClock,
  MessageSquareQuote,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Customer } from "@/lib/types";
import { cn } from "@/lib/utils";

const personaAccent: Record<string, string> = {
  "Loyal Customer": "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  "Refund Abuse Pattern": "border-amber-400/40 bg-amber-400/10 text-amber-300",
  "Merchant Window Closed": "border-rose-400/40 bg-rose-400/10 text-rose-300",
};

const personaDot: Record<string, string> = {
  "Loyal Customer": "bg-emerald-400",
  "Refund Abuse Pattern": "bg-amber-400",
  "Merchant Window Closed": "bg-rose-400",
};

function currency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "danger" | "warn" | "good";
}

function Stat({ icon, label, value, tone = "default" }: StatProps) {
  const toneClass =
    tone === "danger"
      ? "text-rose-300"
      : tone === "warn"
      ? "text-amber-300"
      : tone === "good"
      ? "text-emerald-300"
      : "text-slate-200";
  return (
    <div className="flex items-start gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2 ring-1 ring-white/[0.05]">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
        <p className={cn("truncate text-[13px] font-semibold", toneClass)}>{value}</p>
      </div>
    </div>
  );
}

function CustomerDetails({ customer }: { customer: Customer }) {
  return (
    <>
      <div className="mb-3 rounded-lg bg-white/[0.03] px-2.5 py-2 ring-1 ring-white/[0.05]">
        <p className="truncate text-[13px] font-medium text-slate-100">{customer.eventName}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" /> {formatDate(customer.eventDate)}
          </span>
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3" /> Requested {formatDate(customer.refundRequestDate)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <Stat icon={<Clock className="h-3.5 w-3.5" />} label="Merchant Window" value={customer.merchantWindowOpen ? "Open" : "Closed"} tone={customer.merchantWindowOpen ? "good" : "danger"} />
        <Stat icon={<IndianRupee className="h-3.5 w-3.5" />} label="Booking Amount" value={currency(customer.bookingAmount)} />
        <Stat icon={<Wallet className="h-3.5 w-3.5" />} label="Lifetime Spend" value={currency(customer.lifetimeSpend)} />
        <Stat icon={<RotateCcw className="h-3.5 w-3.5" />} label="Refunded To Date" value={currency(customer.lifetimeRefundAmount)} />
        <Stat icon={<Building2 className="h-3.5 w-3.5" />} label="Completed Bookings" value={`${customer.completedBookings}`} />
        <Stat icon={<ShieldAlert className="h-3.5 w-3.5" />} label="Chargebacks" value={`${customer.previousChargebacks}`} tone={customer.previousChargebacks > 0 ? "danger" : "good"} />
        <Stat icon={<RotateCcw className="h-3.5 w-3.5" />} label="Refund Requests" value={`${customer.previousRefundRequests}`} />
        <Stat
          icon={<Building2 className="h-3.5 w-3.5" />}
          label="Merchant Risk"
          value={customer.merchantRisk[0].toUpperCase() + customer.merchantRisk.slice(1)}
          tone={customer.merchantRisk === "low" ? "good" : customer.merchantRisk === "medium" ? "warn" : "danger"}
        />
      </div>

      <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-violet-500/[0.06] px-2.5 py-2 ring-1 ring-violet-400/10">
        <MessageSquareQuote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-violet-300/70">Refund reason</p>
          <p className="truncate text-[12px] text-slate-200">{customer.refundReason}</p>
        </div>
        <div className="ml-auto shrink-0 text-right">
          <p className="text-[10px] uppercase tracking-wide text-violet-300/70">Requested</p>
          <p className="text-[13px] font-bold text-white">{currency(customer.refundAmount)}</p>
        </div>
      </div>
    </>
  );
}

export function CustomerCard({
  customer,
  isEngineHover,
  onDragMove,
  onDrop,
  disabled,
}: {
  customer: Customer;
  isEngineHover: boolean;
  onDragMove: (point: { x: number; y: number }) => void;
  onDrop: (customerId: string, point: { x: number; y: number }) => void;
  disabled?: boolean;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [detailsOpen, setDetailsOpen] = useState(false);

  function handleDrag(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    onDragMove(info.point);
  }

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    onDrop(customer.id, info.point);
  }

  return (
    <>
      <motion.div
        drag={!disabled}
        dragSnapToOrigin
        dragElastic={0.35}
        dragMomentum={false}
        whileDrag={{ scale: 1.06, zIndex: 50, boxShadow: "0 25px 60px -15px rgba(0,0,0,0.6)" }}
        whileHover={!disabled ? { y: -3 } : undefined}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x, y, touchAction: "none" }}
        className={cn(
          "relative w-full cursor-grab select-none rounded-2xl border border-white/10 bg-slate-900/60 p-2.5 shadow-xl backdrop-blur-xl transition-colors active:cursor-grabbing md:p-4",
          disabled && "pointer-events-none opacity-40",
          isEngineHover && "ring-2 ring-violet-400/70"
        )}
      >
        {/* Compact mobile view */}
        <div className="flex flex-col gap-1 md:hidden">
          <div className="flex items-center justify-between">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", personaDot[customer.persona])} />
            <button
              type="button"
              aria-label="View full details"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setDetailsOpen(true);
              }}
              className="-m-1 rounded-full p-1 text-slate-500 active:text-violet-300"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="truncate text-[12px] font-semibold leading-tight text-white">{customer.name}</p>
          <p className="truncate text-[9px] leading-tight text-slate-500">{customer.persona}</p>
          <p className="mt-0.5 text-[13px] font-bold leading-tight text-white">{currency(customer.refundAmount)}</p>
        </div>

        {/* Full desktop view */}
        <div className="hidden md:block">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-[15px] font-semibold text-white">{customer.name}</div>
              <p className="text-xs text-slate-400">{customer.customerId}</p>
            </div>
            <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
          </div>

          <Badge variant="outline" className={cn("mb-3 border text-[11px] font-medium", personaAccent[customer.persona])}>
            {customer.persona}
          </Badge>

          <CustomerDetails customer={customer} />
        </div>
      </motion.div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-sm md:hidden">
          <DialogHeader>
            <DialogTitle>{customer.name}</DialogTitle>
            <p className="text-xs text-slate-400">{customer.customerId}</p>
            <Badge variant="outline" className={cn("w-fit border text-[11px] font-medium", personaAccent[customer.persona])}>
              {customer.persona}
            </Badge>
          </DialogHeader>
          <CustomerDetails customer={customer} />
        </DialogContent>
      </Dialog>
    </>
  );
}
