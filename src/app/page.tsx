"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles } from "lucide-react";
import { CustomerCard } from "@/components/CustomerCard";
import { CustomScenarioCard } from "@/components/CustomScenarioCard";
import { RuleEngineView } from "@/components/RuleEngineView";
import { DecisionPanel } from "@/components/DecisionPanel";
import { customers, createDefaultCustomCustomer } from "@/data/customers";
import { evaluateRefund } from "@/lib/ruleEngine";
import { Customer, DecisionResult } from "@/lib/types";

const STEP_MS = 480;

export default function Home() {
  const engineRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [customCustomer, setCustomCustomer] = useState<Customer>(createDefaultCustomCustomer());
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isEngineHover, setIsEngineHover] = useState(false);

  const [visibleEligibility, setVisibleEligibility] = useState(0);
  const [showRiskRunning, setShowRiskRunning] = useState(false);
  const [visibleRisk, setVisibleRisk] = useState(0);
  const [showDecision, setShowDecision] = useState(false);
  const [visibleReasons, setVisibleReasons] = useState(0);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  function schedule(fn: () => void, delay: number) {
    timeoutsRef.current.push(setTimeout(fn, delay));
  }

  function isPointOverEngine(point: { x: number; y: number }) {
    const rect = engineRef.current?.getBoundingClientRect();
    if (!rect) return false;
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
  }

  function handleDragMove(point: { x: number; y: number }) {
    const hover = isPointOverEngine(point);
    setIsDragActive(true);
    setIsEngineHover(hover);
  }

  function handleDrop(customerId: string, point: { x: number; y: number }) {
    setIsDragActive(false);
    setIsEngineHover(false);
    if (!isPointOverEngine(point)) return;

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    const customer =
      customers.find((c) => c.id === customerId) ?? (customCustomer.id === customerId ? customCustomer : null);
    if (!customer) return;
    const r = evaluateRefund(customer);

    setActiveCustomer(customer);
    setResult(r);
    setVisibleEligibility(0);
    setShowRiskRunning(false);
    setVisibleRisk(0);
    setShowDecision(false);
    setVisibleReasons(0);

    const relevantEligibility = r.eligibilityShortCircuited
      ? r.eligibility.slice(0, r.eligibility.findIndex((s) => s.status === "fail") + 1)
      : r.eligibility;

    let t = 0;
    relevantEligibility.forEach((_, i) => {
      t += STEP_MS;
      schedule(() => setVisibleEligibility(i + 1), t);
    });

    if (!r.eligibilityShortCircuited) {
      t += STEP_MS * 0.7;
      schedule(() => setShowRiskRunning(true), t);
      t += STEP_MS * 1.3;
      r.riskMetrics.forEach((_, i) => {
        t += STEP_MS * 0.85;
        schedule(() => setVisibleRisk(i + 1), t);
      });
    }

    t += STEP_MS;
    schedule(() => setShowDecision(true), t);

    r.reasoning.forEach((_, i) => {
      t += STEP_MS * 0.55;
      schedule(() => setVisibleReasons(i + 1), t);
    });
  }

  const totalSteps = result
    ? (result.eligibilityShortCircuited
        ? result.eligibility.findIndex((s) => s.status === "fail") + 1
        : result.eligibility.length + result.riskMetrics.length + 1) + 1
    : 1;
  const doneSteps =
    visibleEligibility + (showRiskRunning ? 1 : 0) + visibleRisk + (showDecision ? 1 : 0);
  const progressPct = Math.min(100, Math.round((doneSteps / totalSteps) * 100));

  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(124,58,237,0.18),transparent),radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(16,185,129,0.08),transparent)]" />

      <div className="relative mx-auto max-w-[1500px] px-3 py-4 sm:px-6 sm:py-8 lg:px-10">
        <header className="mb-3 flex items-center justify-between gap-2 md:mb-8">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/20 md:h-11 md:w-11 md:rounded-2xl">
              <ShieldCheck className="h-4 w-4 md:h-6 md:w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[13px] font-semibold tracking-tight text-white sm:text-base md:text-lg">
                District — Refund &amp; Chargeback Automation
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">Explainable AI prototype · policy-first rule engine</p>
            </div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 lg:flex">
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            Drag a customer card into the engine to begin
          </div>
        </header>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[280px_1fr_320px] md:gap-6 lg:grid-cols-[300px_1fr_340px] xl:grid-cols-[320px_1fr_360px]">
          <div className="grid grid-cols-3 gap-2 md:flex md:flex-col md:gap-4">
            {customers.map((c) => (
              <CustomerCard
                key={c.id}
                customer={c}
                isEngineHover={isEngineHover && activeCustomer?.id !== c.id}
                onDragMove={handleDragMove}
                onDrop={handleDrop}
              />
            ))}
            <CustomScenarioCard
              customer={customCustomer}
              onSave={setCustomCustomer}
              isEngineHover={isEngineHover && activeCustomer?.id !== customCustomer.id}
              onDragMove={handleDragMove}
              onDrop={handleDrop}
              className="col-span-3"
            />
          </div>

          {!activeCustomer && (
            <p className="-mt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 md:hidden">
              <Sparkles className="h-3 w-3 text-violet-300" />
              Drag a card down into the engine
            </p>
          )}

          <motion.div layout>
            <RuleEngineView
              ref={engineRef}
              customer={activeCustomer}
              result={result}
              visibleEligibility={visibleEligibility}
              showRiskRunning={showRiskRunning}
              visibleRisk={visibleRisk}
              showDecision={showDecision}
              isDragActive={isDragActive && isEngineHover}
              progressPct={progressPct}
            />
          </motion.div>

          <DecisionPanel
            customer={activeCustomer}
            result={result}
            showDecision={showDecision}
            visibleReasons={visibleReasons}
          />
        </div>
      </div>
    </div>
  );
}
