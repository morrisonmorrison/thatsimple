import React, { useMemo, useState } from "react";

// That Simple — Cap Rate / Cash Flow calculator (standalone, no backend)

type Inputs = {
  price: number;
  grossMonthlyRent: number;
  vacancyPct: number;
  monthlyOpEx: number;
  downPaymentPct: number;
  interestRatePct: number;
  loanTermYears: number;
};

const DEFAULTS: Inputs = {
  price: 500000,
  grossMonthlyRent: 4000,
  vacancyPct: 5,
  monthlyOpEx: 800,
  downPaymentPct: 25,
  interestRatePct: 7.0,
  loanTermYears: 30,
};

function monthlyPI(principal: number, annualRatePct: number, years: number): number {
  if (principal <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    isFinite(n) ? n : 0
  );
const fmtPct = (n: number) => `${(isFinite(n) ? n : 0).toFixed(2)}%`;
const fmtRatio = (n: number) => (isFinite(n) ? n : 0).toFixed(2);

const CapRate: React.FC = () => {
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);

  const set = <K extends keyof Inputs>(key: K) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputs((prev) => ({ ...prev, [key]: v === "" ? 0 : Number(v) }));
  };

  const results = useMemo(() => {
    const grossAnnualRent = inputs.grossMonthlyRent * 12;
    const vacancyLoss = grossAnnualRent * (inputs.vacancyPct / 100);
    const effectiveGrossIncome = grossAnnualRent - vacancyLoss;
    const annualOpEx = inputs.monthlyOpEx * 12;
    const noi = effectiveGrossIncome - annualOpEx;
    const capRatePct = inputs.price > 0 ? (noi / inputs.price) * 100 : 0;

    const downPayment = inputs.price * (inputs.downPaymentPct / 100);
    const loanAmount = inputs.price - downPayment;
    const mPI = monthlyPI(loanAmount, inputs.interestRatePct, inputs.loanTermYears);
    const annualDebtService = mPI * 12;

    const monthlyCashFlow = noi / 12 - mPI;
    const annualCashFlow = monthlyCashFlow * 12;
    const cocReturnPct = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;
    const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;

    return {
      noi,
      capRatePct,
      downPayment,
      loanAmount,
      mPI,
      monthlyCashFlow,
      annualCashFlow,
      cocReturnPct,
      dscr,
    };
  }, [inputs]);

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", color: "#111" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #eaeaea",
          background: "#fff",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "#111",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            T
          </div>
          <strong style={{ fontSize: 16 }}>That Simple</strong>
          <span style={{ color: "#888", fontSize: 13 }}>— Rental Property Calculator</span>
        </div>
        <a href="/?view=plaid-demo" style={{ fontSize: 12, color: "#888", textDecoration: "none" }}>
          plaid demo →
        </a>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 920, margin: "32px auto", padding: "0 24px" }}>
        <h1 style={{ fontSize: 28, margin: "0 0 6px" }}>Cap Rate Calculator</h1>
        <p style={{ color: "#555", margin: "0 0 24px" }}>
          Quick rental property analysis — NOI, Cap Rate, Cash-on-Cash, DSCR.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            background: "#fff",
            border: "1px solid #eaeaea",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <Field label="Purchase price" prefix="$" value={inputs.price} onChange={set("price")} />
          <Field label="Gross monthly rent" prefix="$" value={inputs.grossMonthlyRent} onChange={set("grossMonthlyRent")} />
          <Field label="Vacancy" suffix="%" value={inputs.vacancyPct} onChange={set("vacancyPct")} />
          <Field label="Monthly operating expenses" prefix="$" value={inputs.monthlyOpEx} onChange={set("monthlyOpEx")} />
          <Field label="Down payment" suffix="%" value={inputs.downPaymentPct} onChange={set("downPaymentPct")} />
          <Field label="Interest rate" suffix="%" value={inputs.interestRatePct} onChange={set("interestRatePct")} />
          <Field label="Loan term (years)" value={inputs.loanTermYears} onChange={set("loanTermYears")} />
        </div>

        {/* Results */}
        <section
          style={{
            marginTop: 20,
            background: "#fff",
            border: "1px solid #eaeaea",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h2 style={{ fontSize: 18, margin: "0 0 16px" }}>Results</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            <Stat label="Net Operating Income (NOI)" value={fmtUSD(results.noi)} />
            <Stat label="Cap Rate" value={fmtPct(results.capRatePct)} highlight />
            <Stat label="Down Payment" value={fmtUSD(results.downPayment)} />
            <Stat label="Loan Amount" value={fmtUSD(results.loanAmount)} />
            <Stat label="Monthly P&I" value={fmtUSD(results.mPI)} />
            <Stat label="Monthly Cash Flow" value={fmtUSD(results.monthlyCashFlow)} highlight />
            <Stat label="Annual Cash Flow" value={fmtUSD(results.annualCashFlow)} />
            <Stat label="Cash-on-Cash Return" value={fmtPct(results.cocReturnPct)} highlight />
            <Stat label="DSCR" value={fmtRatio(results.dscr)} />
          </div>
          <p style={{ color: "#888", fontSize: 12, marginTop: 16 }}>
            Estimates only. Excludes capex reserves, closing costs, escrows beyond op-ex, and tax effects.
          </p>
        </section>

        <footer style={{ color: "#999", fontSize: 12, textAlign: "center", margin: "32px 0 24px" }}>
          © {new Date().getFullYear()} That Simple — built for real-estate investors.
        </footer>
      </main>
    </div>
  );
};

const Field: React.FC<{
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  prefix?: string;
  suffix?: string;
}> = ({ label, value, onChange, prefix, suffix }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#444" }}>
    {label}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "8px 10px",
        background: "#fff",
      }}
    >
      {prefix && <span style={{ color: "#888", marginRight: 6 }}>{prefix}</span>}
      <input
        type="number"
        value={value}
        onChange={onChange}
        style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#111", background: "transparent" }}
      />
      {suffix && <span style={{ color: "#888", marginLeft: 6 }}>{suffix}</span>}
    </div>
  </label>
);

const Stat: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div>
    <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: highlight ? 700 : 500, color: highlight ? "#0a7" : "#111", marginTop: 2 }}>
      {value}
    </div>
  </div>
);

export default CapRate;
