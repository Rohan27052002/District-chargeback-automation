import { Customer, DecisionResult, EligibilityStep, RiskMetric, Tier } from "@/lib/types";

const TIER_FRACTION: Record<Tier, number> = {
  low: 0,
  medium: 0.45,
  high: 0.75,
};

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function currency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Runs eligibility gate first. Only when eligibility clears does risk scoring occur. */
export function evaluateRefund(customer: Customer): DecisionResult {
  const eligibility: EligibilityStep[] = [];
  let shortCircuit: { decision: "reject" | "auto_refund"; reason: string } | null = null;

  // Rule 1 — merchant refund window
  if (!customer.merchantWindowOpen) {
    eligibility.push({
      id: "window",
      label: "Merchant Refund Window Open",
      icon: "Clock",
      status: "fail",
      shortCircuit: "reject",
      detail: "Merchant refund policy window has expired for this booking.",
    });
    shortCircuit = { decision: "reject", reason: "Merchant policy expired" };
  } else {
    eligibility.push({
      id: "window",
      label: "Merchant Refund Window Open",
      icon: "Clock",
      status: "pass",
      detail: "Refund request falls within the merchant's active refund window.",
    });
  }

  // Rule 2 — already refunded
  if (!shortCircuit) {
    if (customer.alreadyRefunded) {
      eligibility.push({
        id: "already-refunded",
        label: "Not Already Refunded",
        icon: "RotateCcw",
        status: "fail",
        shortCircuit: "reject",
        detail: "This booking has already been refunded once.",
      });
      shortCircuit = { decision: "reject", reason: "Booking was already refunded" };
    } else {
      eligibility.push({
        id: "already-refunded",
        label: "Not Already Refunded",
        icon: "RotateCcw",
        status: "pass",
        detail: "No prior refund exists against this booking.",
      });
    }
  } else {
    eligibility.push({
      id: "already-refunded",
      label: "Not Already Refunded",
      icon: "RotateCcw",
      status: "skipped",
      detail: "Skipped — request already rejected.",
    });
  }

  // Rule 3 — event cancelled by merchant
  if (!shortCircuit) {
    if (customer.eventCancelledByMerchant) {
      eligibility.push({
        id: "event-cancelled",
        label: "Event Cancelled By Merchant",
        icon: "CalendarX",
        status: "fail",
        shortCircuit: "auto_refund",
        detail: "The merchant cancelled this event outright.",
      });
      shortCircuit = { decision: "auto_refund", reason: "Event was cancelled by the merchant" };
    } else {
      eligibility.push({
        id: "event-cancelled",
        label: "Event Cancelled By Merchant",
        icon: "CalendarX",
        status: "pass",
        detail: "Event is confirmed and proceeding as scheduled.",
      });
    }
  } else {
    eligibility.push({
      id: "event-cancelled",
      label: "Event Cancelled By Merchant",
      icon: "CalendarX",
      status: "skipped",
      detail: "Skipped — decision already reached.",
    });
  }

  // Rule 4 — duplicate payment
  if (!shortCircuit) {
    if (customer.duplicatePayment) {
      eligibility.push({
        id: "duplicate-payment",
        label: "Duplicate Payment Check",
        icon: "Copy",
        status: "fail",
        shortCircuit: "auto_refund",
        detail: "Customer was charged twice for the same booking.",
      });
      shortCircuit = { decision: "auto_refund", reason: "Duplicate payment detected" };
    } else {
      eligibility.push({
        id: "duplicate-payment",
        label: "Duplicate Payment Check",
        icon: "Copy",
        status: "pass",
        detail: "No duplicate charge found for this booking.",
      });
    }
  } else {
    eligibility.push({
      id: "duplicate-payment",
      label: "Duplicate Payment Check",
      icon: "Copy",
      status: "skipped",
      detail: "Skipped — decision already reached.",
    });
  }

  // Rule 5 — merchant cancelled booking
  if (!shortCircuit) {
    if (customer.merchantCancelledBooking) {
      eligibility.push({
        id: "merchant-cancelled-booking",
        label: "Booking Cancelled By Merchant",
        icon: "Ban",
        status: "fail",
        shortCircuit: "auto_refund",
        detail: "The merchant cancelled this specific booking.",
      });
      shortCircuit = { decision: "auto_refund", reason: "Booking was cancelled by the merchant" };
    } else {
      eligibility.push({
        id: "merchant-cancelled-booking",
        label: "Booking Cancelled By Merchant",
        icon: "Ban",
        status: "pass",
        detail: "Merchant has not cancelled this booking.",
      });
    }
  } else {
    eligibility.push({
      id: "merchant-cancelled-booking",
      label: "Booking Cancelled By Merchant",
      icon: "Ban",
      status: "skipped",
      detail: "Skipped — decision already reached.",
    });
  }

  const trace = eligibility.map((step) => ({
    label: step.label,
    passed: step.status !== "fail",
  }));

  if (shortCircuit) {
    const reasoning =
      shortCircuit.decision === "reject"
        ? [shortCircuit.reason, "Risk engine was not invoked — request failed eligibility."]
        : [shortCircuit.reason, "Eligibility rule guarantees refund regardless of risk profile."];

    return {
      customerId: customer.id,
      eligibility,
      eligibilityShortCircuited: true,
      riskMetrics: [],
      riskScore: shortCircuit.decision === "reject" ? 100 : 0,
      decision: shortCircuit.decision,
      reasoning,
      trace,
    };
  }

  // ---- Risk Engine (only reached once eligibility clears) ----
  const riskMetrics: RiskMetric[] = [];

  // Metric 1 — Customer Loyalty (weight 10)
  {
    const weight = 10;
    const b = customer.completedBookings;
    const tier: Tier = b >= 15 ? "low" : b >= 8 ? "medium" : "high";
    riskMetrics.push({
      id: "loyalty",
      label: "Customer Loyalty",
      icon: "Heart",
      tier,
      weight,
      points: Math.round(TIER_FRACTION[tier] * weight),
      value: `${b} completed bookings`,
      detail:
        tier === "low"
          ? `Loyal customer (${b} bookings) — represents repeat engagement.`
          : `Limited booking history (${b} bookings) reduces trust signal.`,
    });
  }

  // Metric 2 — Refund Amount (weight 15)
  {
    const weight = 15;
    const amt = customer.refundAmount;
    const tier: Tier = amt <= 5000 ? "low" : "high";
    riskMetrics.push({
      id: "amount",
      label: "Refund Amount",
      icon: "IndianRupee",
      tier,
      weight,
      points: Math.round(TIER_FRACTION[tier] * weight),
      value: currency(amt),
      detail:
        tier === "low"
          ? `${currency(amt)} is below the review threshold.`
          : `${currency(amt)} exceeds ₹5,000 — flagged for manual review.`,
    });
  }

  // Metric 3 — Refund Frequency, rolling 12 months (weight 20)
  {
    const weight = 20;
    const freq = customer.previousRefundRequests;
    const tier: Tier = freq <= 2 ? "low" : freq <= 4 ? "medium" : "high";
    riskMetrics.push({
      id: "frequency",
      label: "Refund Frequency",
      icon: "History",
      tier,
      weight,
      points: Math.round(TIER_FRACTION[tier] * weight),
      value: `${freq} in last 12 months`,
      detail:
        tier === "low"
          ? `Only ${freq} refund request(s) in the last 12 months.`
          : `${freq} refund requests in the last 12 months is elevated.`,
    });
  }

  // Metric 4 — Refund Ratio (weight 25)
  {
    const weight = 25;
    const ratio = customer.lifetimeSpend > 0 ? customer.lifetimeRefundAmount / customer.lifetimeSpend : 0;
    const tier: Tier = ratio < 0.05 ? "low" : ratio <= 0.1 ? "medium" : "high";
    riskMetrics.push({
      id: "ratio",
      label: "Refund Ratio",
      icon: "PieChart",
      tier,
      weight,
      points: Math.round(TIER_FRACTION[tier] * weight),
      value: pct(ratio),
      detail:
        tier === "low"
          ? `Refund ratio only ${pct(ratio)} of lifetime spend.`
          : `Refund ratio at ${pct(ratio)} of lifetime spend is a concern.`,
    });
  }

  // Metric 5 — Previous Chargebacks (weight 20)
  {
    const weight = 20;
    const cb = customer.previousChargebacks;
    const tier: Tier = cb === 0 ? "low" : cb === 1 ? "medium" : "high";
    riskMetrics.push({
      id: "chargebacks",
      label: "Previous Chargebacks",
      icon: "ShieldAlert",
      tier,
      weight,
      points: Math.round(TIER_FRACTION[tier] * weight),
      value: `${cb}`,
      detail:
        tier === "low"
          ? "No previous chargebacks on record."
          : `${cb} previous chargeback(s) on record — increases fraud likelihood.`,
    });
  }

  // Metric 6 — Merchant Risk (weight 10)
  {
    const weight = 10;
    const tier: Tier = customer.merchantRisk;
    riskMetrics.push({
      id: "merchant-risk",
      label: "Merchant Risk",
      icon: "Building2",
      tier,
      weight,
      points: Math.round(TIER_FRACTION[tier] * weight),
      value: tier[0].toUpperCase() + tier.slice(1),
      detail:
        tier === "low"
          ? "Merchant carries a low historical risk profile."
          : "Elevated merchant risk profile increases review priority.",
    });
  }

  const riskScore = riskMetrics.reduce((sum, m) => sum + m.points, 0);
  const decision = riskScore >= 60 ? "fraud_review" : riskScore >= 30 ? "manual_review" : "auto_refund";

  const reasoning: string[] = [
    "Merchant refund window is still open",
    ...riskMetrics
      .filter((m) => m.tier === "low")
      .map((m) => m.detail),
    ...riskMetrics
      .filter((m) => m.tier !== "low")
      .map((m) => m.detail),
  ];

  if (decision === "auto_refund") {
    reasoning.push("Combined risk score qualifies this request for automatic approval.");
  } else if (decision === "manual_review") {
    reasoning.push("Combined risk score requires a human agent to review before deciding.");
  } else {
    reasoning.push("Combined risk score indicates a high likelihood of fraud or abuse.");
  }

  return {
    customerId: customer.id,
    eligibility,
    eligibilityShortCircuited: false,
    riskMetrics,
    riskScore,
    decision,
    reasoning,
    trace: [
      ...trace,
      ...riskMetrics.map((m) => ({ label: m.label, passed: m.tier === "low" })),
    ],
  };
}
