"use client";

import { forwardRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Workflow,
  Check,
  X,
  Minus,
  Loader2,
  Clock,
  RotateCcw,
  CalendarX,
  Copy,
  Ban,
  Heart,
  IndianRupee,
  History,
  PieChart,
  ShieldAlert,
  Building2,
  Sparkles,
  Target,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Customer, DecisionResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const ELIGIBILITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock,
  RotateCcw,
  CalendarX,
  Copy,
  Ban,
};

const RISK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart,
  IndianRupee,
  History,
  PieChart,
  ShieldAlert,
  Building2,
};

function StepRow({
  icon,
  label,
  detail,
  status,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  status: "pass" | "fail" | "skipped" | "positive-fail";
  highlight?: string;
}) {
  const statusStyles =
    status === "pass" || status === "positive-fail"
      ? "border-emerald-400/30 bg-emerald-400/[0.07]"
      : status === "fail"
      ? "border-rose-400/30 bg-rose-400/[0.07]"
      : "border-white/10 bg-white/[0.02]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-1.5 md:gap-3 md:rounded-xl md:px-3.5 md:py-2.5", statusStyles)}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full md:h-7 md:w-7",
          status === "pass" || status === "positive-fail"
            ? "bg-emerald-400/15 text-emerald-300"
            : status === "fail"
            ? "bg-rose-400/15 text-rose-300"
            : "bg-white/5 text-slate-500"
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-slate-100 md:text-[13px]">{label}</p>
        <p className="hidden truncate text-[11px] text-slate-400 md:block">{detail}</p>
      </div>
      {highlight && (
        <span className="hidden shrink-0 rounded-full bg-violet-400/15 px-2 py-0.5 text-[10px] font-medium text-violet-300 md:inline-block">
          {highlight}
        </span>
      )}
      {status === "pass" || status === "positive-fail" ? (
        <Check className="h-4 w-4 shrink-0 text-emerald-400" />
      ) : status === "fail" ? (
        <X className="h-4 w-4 shrink-0 text-rose-400" />
      ) : (
        <Minus className="h-4 w-4 shrink-0 text-slate-600" />
      )}
    </motion.div>
  );
}

export const RuleEngineView = forwardRef<
  HTMLDivElement,
  {
    customer: Customer | null;
    result: DecisionResult | null;
    visibleEligibility: number;
    showRiskRunning: boolean;
    visibleRisk: number;
    showDecision: boolean;
    isDragActive: boolean;
    progressPct: number;
  }
>(function RuleEngineView(
  { customer, result, visibleEligibility, showRiskRunning, visibleRisk, showDecision, isDragActive, progressPct },
  ref
) {
  const relevantEligibility = result
    ? result.eligibilityShortCircuited
      ? result.eligibility.slice(0, result.eligibility.findIndex((s) => s.status === "fail") + 1)
      : result.eligibility
    : [];

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-full min-h-[110px] flex-col rounded-2xl border p-3 transition-all duration-300 md:min-h-[560px] md:rounded-3xl md:p-6",
        "border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-2xl",
        isDragActive && "border-violet-400/60 shadow-[0_0_0_4px_rgba(167,139,250,0.15)]"
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300 md:h-9 md:w-9 md:rounded-xl">
          <Workflow className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-[12px] font-semibold text-white md:text-[15px]">Rule Engine</h2>
          <p className="hidden text-[11px] text-slate-500 md:block">Policy-first evaluation · eligibility before risk</p>
        </div>
      </div>

      <div className="mt-2 md:mt-4">
        <Progress value={customer ? progressPct : 0} className="h-1.5 bg-white/5" />
      </div>

      <div className="mt-2 max-h-[180px] flex-1 space-y-1.5 overflow-y-auto pr-1 md:mt-5 md:max-h-none md:space-y-2">
        {!customer && (
          <motion.div
            animate={isDragActive ? { scale: 1.02 } : { scale: 1 }}
            className={cn(
              "flex h-full min-h-[86px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-center md:min-h-[420px] md:gap-3 md:rounded-2xl",
              isDragActive ? "border-violet-400/60 bg-violet-400/5" : "border-white/10"
            )}
          >
            <Sparkles className={cn("h-5 w-5 md:h-8 md:w-8", isDragActive ? "text-violet-300" : "text-slate-600")} />
            <p className="max-w-[220px] px-2 text-[11px] text-slate-400 md:text-sm">
              Drag a customer card here to run it through the rule engine
            </p>
          </motion.div>
        )}

        <AnimatePresence>
          {customer &&
            relevantEligibility.slice(0, visibleEligibility).map((step) => {
              const Icon = ELIGIBILITY_ICONS[step.icon] ?? Clock;
              const status =
                step.status === "fail" && step.shortCircuit === "auto_refund" ? "positive-fail" : step.status;
              return (
                <StepRow
                  key={step.id}
                  icon={<Icon className="h-3.5 w-3.5" />}
                  label={step.label}
                  detail={step.detail}
                  status={status}
                  highlight={step.shortCircuit === "auto_refund" && step.status === "fail" ? "Auto-refund trigger" : undefined}
                />
              );
            })}

          {showRiskRunning && (
            <motion.div
              key="risk-running"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-lg border border-violet-400/20 bg-violet-400/[0.06] px-2.5 py-1.5 md:gap-3 md:rounded-xl md:px-3.5 md:py-2.5"
            >
              {result && visibleRisk >= result.riskMetrics.length ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-violet-300 md:h-4 md:w-4" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-violet-300 md:h-4 md:w-4" />
              )}
              <p className="truncate text-[11px] font-medium text-violet-200 md:text-[13px]">
                {result && visibleRisk >= result.riskMetrics.length ? "Risk Engine Complete" : "Risk Engine Running…"}
              </p>
            </motion.div>
          )}

          {result &&
            result.riskMetrics.slice(0, visibleRisk).map((metric) => {
              const Icon = RISK_ICONS[metric.icon] ?? Heart;
              return (
                <StepRow
                  key={metric.id}
                  icon={<Icon className="h-3.5 w-3.5" />}
                  label={`${metric.label} — ${metric.value}`}
                  detail={metric.detail}
                  status={metric.tier === "low" ? "pass" : "fail"}
                  highlight={`+${metric.points} pts`}
                />
              );
            })}

          {showDecision && (
            <motion.div
              key="decision-reached"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 md:gap-3 md:rounded-xl md:px-3.5 md:py-2.5"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-200 md:h-7 md:w-7">
                <Target className="h-3 w-3 md:h-3.5 md:w-3.5" />
              </span>
              <p className="truncate text-[11px] font-medium text-slate-100 md:text-[13px]">Decision reached — see results</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
