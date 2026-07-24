"use client";

import { useState } from "react";
import { motion, useMotionValue, type PanInfo } from "framer-motion";
import { SlidersHorizontal, GripVertical, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Customer, MerchantRisk } from "@/lib/types";
import { cn } from "@/lib/utils";

function currency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wide text-slate-500">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 text-[13px]"
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 ring-1 ring-white/[0.05]"
    >
      <span className="text-[12px] text-slate-300">{label}</span>
      <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", checked ? "bg-violet-500" : "bg-white/10")}>
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}

function RiskSegment({ value, onChange }: { value: MerchantRisk; onChange: (v: MerchantRisk) => void }) {
  const options: MerchantRisk[] = ["low", "medium", "high"];
  return (
    <div className="flex gap-1 rounded-lg bg-white/[0.03] p-1 ring-1 ring-white/[0.05]">
      {options.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            "flex-1 rounded-md py-1 text-[11px] font-medium capitalize transition-colors",
            value === r ? "bg-violet-500 text-white" : "text-slate-400"
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

export function CustomScenarioCard({
  customer,
  onSave,
  isEngineHover,
  onDragMove,
  onDrop,
  disabled,
  className,
}: {
  customer: Customer;
  onSave: (c: Customer) => void;
  isEngineHover: boolean;
  onDragMove: (point: { x: number; y: number }) => void;
  onDrop: (customerId: string, point: { x: number; y: number }) => void;
  disabled?: boolean;
  className?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Customer>(customer);

  function handleDrag(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    onDragMove(info.point);
  }

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    onDrop(customer.id, info.point);
  }

  function openEditor() {
    setDraft(customer);
    setOpen(true);
  }

  function handleSave() {
    onSave(draft);
    setOpen(false);
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
          "relative w-full cursor-grab select-none rounded-2xl border border-dashed border-violet-400/30 bg-violet-500/[0.04] p-2.5 shadow-xl backdrop-blur-xl transition-colors active:cursor-grabbing md:p-4",
          disabled && "pointer-events-none opacity-40",
          isEngineHover && "ring-2 ring-violet-400/70",
          className
        )}
      >
        {/* Compact mobile view */}
        <div className="flex flex-col gap-1 md:hidden">
          <div className="flex items-center justify-between">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
            <button
              type="button"
              aria-label="Configure custom scenario"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                openEditor();
              }}
              className="-m-1 rounded-full p-1 text-violet-300 active:text-violet-200"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="truncate text-[12px] font-semibold leading-tight text-white">Custom</p>
          <p className="truncate text-[9px] leading-tight text-violet-300/70">Tap to configure</p>
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

          <Badge variant="outline" className="mb-3 border border-violet-400/40 bg-violet-400/10 text-[11px] font-medium text-violet-300">
            {customer.persona}
          </Badge>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              openEditor();
            }}
            className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-violet-400/30 bg-violet-500/10 px-2.5 py-1.5 text-[12px] font-medium text-violet-300"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Configure values
          </button>

          <div className="grid grid-cols-2 gap-1.5 text-[13px]">
            <div className="rounded-lg bg-white/[0.03] px-2.5 py-2 ring-1 ring-white/[0.05]">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Refund Amount</p>
              <p className="font-semibold text-white">{currency(customer.refundAmount)}</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] px-2.5 py-2 ring-1 ring-white/[0.05]">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Merchant Window</p>
              <p className={cn("font-semibold", customer.merchantWindowOpen ? "text-emerald-300" : "text-rose-300")}>
                {customer.merchantWindowOpen ? "Open" : "Closed"}
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.03] px-2.5 py-2 ring-1 ring-white/[0.05]">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Bookings</p>
              <p className="font-semibold text-white">{customer.completedBookings}</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] px-2.5 py-2 ring-1 ring-white/[0.05]">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Chargebacks</p>
              <p className="font-semibold text-white">{customer.previousChargebacks}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-sm overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Custom Scenario</DialogTitle>
            <p className="text-xs text-slate-400">Set any combination of values, then drag this card into the engine.</p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wide text-slate-500">Label</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-8 text-[13px]" />
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-300">This Request</p>
              <div className="grid grid-cols-2 gap-2">
                <NumberField label="Refund Amount (₹)" value={draft.refundAmount} onChange={(v) => setDraft({ ...draft, refundAmount: v })} />
                <NumberField label="Booking Amount (₹)" value={draft.bookingAmount} onChange={(v) => setDraft({ ...draft, bookingAmount: v })} />
              </div>
              <ToggleRow
                label="Merchant refund window open"
                checked={draft.merchantWindowOpen}
                onChange={(v) => setDraft({ ...draft, merchantWindowOpen: v })}
              />
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-300">Customer Profile</p>
              <div className="grid grid-cols-2 gap-2">
                <NumberField label="Completed Bookings" value={draft.completedBookings} onChange={(v) => setDraft({ ...draft, completedBookings: v })} />
                <NumberField label="Lifetime Spend (₹)" value={draft.lifetimeSpend} onChange={(v) => setDraft({ ...draft, lifetimeSpend: v })} />
                <NumberField
                  label="Lifetime Refunded (₹)"
                  value={draft.lifetimeRefundAmount}
                  onChange={(v) => setDraft({ ...draft, lifetimeRefundAmount: v })}
                />
                <NumberField
                  label="Refund Requests (12mo)"
                  value={draft.previousRefundRequests}
                  onChange={(v) => setDraft({ ...draft, previousRefundRequests: v })}
                />
                <NumberField label="Chargebacks" value={draft.previousChargebacks} onChange={(v) => setDraft({ ...draft, previousChargebacks: v })} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-slate-500">Merchant Risk</Label>
                <RiskSegment value={draft.merchantRisk} onChange={(v) => setDraft({ ...draft, merchantRisk: v })} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-300">Special Conditions (eligibility short-circuits)</p>
              <ToggleRow label="Booking already refunded" checked={draft.alreadyRefunded} onChange={(v) => setDraft({ ...draft, alreadyRefunded: v })} />
              <ToggleRow
                label="Event cancelled by merchant"
                checked={draft.eventCancelledByMerchant}
                onChange={(v) => setDraft({ ...draft, eventCancelledByMerchant: v })}
              />
              <ToggleRow label="Duplicate payment detected" checked={draft.duplicatePayment} onChange={(v) => setDraft({ ...draft, duplicatePayment: v })} />
              <ToggleRow
                label="Booking cancelled by merchant"
                checked={draft.merchantCancelledBooking}
                onChange={(v) => setDraft({ ...draft, merchantCancelledBooking: v })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wide text-slate-500">Refund Reason</Label>
              <Input value={draft.refundReason} onChange={(e) => setDraft({ ...draft, refundReason: e.target.value })} className="h-8 text-[13px]" />
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-500 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-violet-400"
            >
              <Save className="h-3.5 w-3.5" />
              Save &amp; Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
