"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, ShieldX, ChevronRight, Gauge } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Customer, DecisionResult, FinalDecision } from "@/lib/types";
import { cn } from "@/lib/utils";

const DECISION_META: Record<
  FinalDecision,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string; barColor: string }
> = {
  auto_refund: {
    label: "Auto Refund",
    icon: CheckCircle2,
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    barColor: "bg-emerald-400",
  },
  manual_review: {
    label: "Manual Review",
    icon: AlertTriangle,
    className: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    barColor: "bg-amber-400",
  },
  fraud_review: {
    label: "Fraud Review Required",
    icon: ShieldX,
    className: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    barColor: "bg-rose-500",
  },
  reject: {
    label: "Reject Refund",
    icon: XCircle,
    className: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    barColor: "bg-rose-500",
  },
};

export function DecisionPanel({
  customer,
  result,
  showDecision,
  visibleReasons,
}: {
  customer: Customer | null;
  result: DecisionResult | null;
  showDecision: boolean;
  visibleReasons: number;
}) {
  if (!customer || !result) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 text-center backdrop-blur-2xl md:min-h-[560px] md:rounded-3xl md:p-6">
        <Gauge className="h-7 w-7 text-slate-600 md:h-8 md:w-8" />
        <p className="max-w-[200px] text-sm text-slate-500">Decision output will appear here</p>
      </div>
    );
  }

  const meta = DECISION_META[result.decision];
  const Icon = meta.icon;

  return (
    <div className="flex h-full min-h-[420px] flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4 backdrop-blur-2xl md:min-h-[560px] md:rounded-3xl md:p-6">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">Decision for</p>
      <h3 className="mb-4 text-[15px] font-semibold text-white">{customer.name}</h3>

      <AnimatePresence mode="wait">
        {showDecision ? (
          <motion.div
            key="badge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
            className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3.5", meta.className)}
          >
            <Icon className="h-7 w-7 shrink-0" />
            <span className="text-lg font-bold">{meta.label}</span>
          </motion.div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-slate-600">
            <span className="text-sm">Evaluating…</span>
          </div>
        )}
      </AnimatePresence>

      <div className="mt-5">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">Risk Score</span>
          <AnimatePresence>
            {showDecision && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-bold text-white"
              >
                {result.riskScore}
                <span className="text-sm font-normal text-slate-500"> / 100</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <Progress
          value={showDecision ? result.riskScore : 0}
          className="h-2 bg-white/5"
          indicatorClassName={meta.barColor}
        />
      </div>

      <div className="mt-5 flex-1">
        <span className="text-[11px] uppercase tracking-wide text-slate-500">Reasoning</span>
        <ul className="mt-2 space-y-2">
          <AnimatePresence>
            {result.reasoning.slice(0, visibleReasons).map((reason, i) => (
              <motion.li
                key={reason + i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.02 }}
                className="flex items-start gap-2 text-[13px] text-slate-300"
              >
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
                <span>{reason}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      {showDecision && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4">
          <Accordion>
            <AccordionItem value="trace" className="rounded-xl border border-white/10 bg-white/[0.02] px-3">
              <AccordionTrigger className="text-[13px] font-medium text-slate-200 hover:no-underline">
                View Decision Trace
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1.5 pb-1">
                  {result.trace.map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-[12px]">
                      {t.passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                      )}
                      <span className={t.passed ? "text-slate-300" : "text-slate-400"}>{t.label}</span>
                    </li>
                  ))}
                  <li className="mt-2 border-t border-white/10 pt-2 text-[12px] font-semibold text-slate-100">
                    Decision: {meta.label}
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      )}
    </div>
  );
}
