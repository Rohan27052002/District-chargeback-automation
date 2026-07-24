export type MerchantRisk = "low" | "medium" | "high";

export interface Customer {
  id: string;
  name: string;
  customerId: string;
  persona: string;
  eventName: string;
  bookingAmount: number;
  eventDate: string;
  refundRequestDate: string;
  merchantWindowOpen: boolean;
  completedBookings: number;
  lifetimeSpend: number;
  lifetimeRefundAmount: number;
  previousRefundRequests: number;
  previousChargebacks: number;
  merchantRisk: MerchantRisk;
  refundReason: string;
  refundAmount: number;
  // Eligibility edge-case flags (all false for the three baseline demo personas)
  alreadyRefunded: boolean;
  eventCancelledByMerchant: boolean;
  duplicatePayment: boolean;
  merchantCancelledBooking: boolean;
  expectedResult: string;
}

export type Tier = "low" | "medium" | "high";

export type FinalDecision =
  | "auto_refund"
  | "manual_review"
  | "fraud_review"
  | "reject";

export interface EligibilityStep {
  id: string;
  label: string;
  icon: string;
  status: "pass" | "fail" | "skipped";
  /** When a rule short-circuits the pipeline, this is the outcome it forces */
  shortCircuit?: "reject" | "auto_refund";
  detail: string;
}

export interface RiskMetric {
  id: string;
  label: string;
  icon: string;
  tier: Tier;
  weight: number;
  points: number;
  value: string;
  detail: string;
}

export interface DecisionResult {
  customerId: string;
  eligibility: EligibilityStep[];
  eligibilityShortCircuited: boolean;
  riskMetrics: RiskMetric[];
  riskScore: number;
  decision: FinalDecision;
  reasoning: string[];
  trace: { label: string; passed: boolean }[];
}
