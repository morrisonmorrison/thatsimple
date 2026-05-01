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

function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function pct(n: number): string {
  return `${n.toFixed(2)}%`;
}

interface Field {
  key: keyof Inputs;
  label: string;
  prefix?: string;
  suffix?: string;
  step?: number;
}
const FIELDS: Field[] = [
  { key: "price", label: "Purchase price", prefix: "$", step: 1000 },
  { key: "grossMonthlyRent", label: "Gross monthly rent", prefix: "$", step: 50 },
  { key: "vacancyPct", label: "Vacancy", suffix: "%", step: 0.5 },
  { key: "monthlyOpEx", label: "Monthly operating expenses", prefix: "$", step: 25 },
  { key: "downPaymentPct", label: "Down payment", suffix: "%", step: 1 },
  { key: "interestRatePct", label: "Interest rate", suffix: "%", step: 0.125 },
  { key: "loanTermYears", label: "Loan term (years)", step: 1 },
];

const CapRate: React.FC = () => {
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);

  const results = useMemo(() => {
    const grossAnnual = inputs.grossMonthlyRent * 12;
    const vacancyLoss = grossAnnual * (inputs.vacancyPct / 100);
    const effectiveGrossIncome = grossAnnual - vacancyLoss;
    const annualOpEx = inputs.monthlyOpEx * 12;
    const noi = effectiveGrossIncome - annualOpEx;
    const capRate = inputs.price > 0 ? (noi / inputs.price) * 100 : 0;
    const downPayment = inputs.price * (inputs.downPaymentPct / 100);
    const loanAmount = inputs.price - downPayment;
    const piMonthly = monthlyPI(loanAmount, inputs.interestRatePct, inputs.loanTermYears);
    const annualDebtService = piMonthly * 12;
    const monthlyCashFlow = noi / 12 - piMonthly;
    const annualCashFlow = monthlyCashFlow * 12;
    const cashOnCash = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;
    const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;
    return { noi, capRate, downPayment, loanAmount, piMonthly, monthlyCashFlow, annualCashFlow, cashOnCash, dscr };
  }, [inputs]);

  const update = (key: keyof Inputs, value: string) => {
    const num = parseFloat(value);
    setInputs((s) => ({ ...s, [key]: isNaN(num) ? 0 : num }));
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Cap Rate Calculator</h1>
          <p className="mt-1 text-gray-600">Quick rental property analysis — NOI, Cap Rate, Cash-on-Cash, DSCR.</p>
        </header>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
          {FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col text-sm">
              <span className="mb-1 font-medium text-gray-700">{f.label}</span>
              <div className="relative">
                {f.prefix && (<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{f.prefix}</span>)}
                <input type="number" step={f.step} value={inputs[f.key]} onChange={(e) => update(f.key, e.target.value)} className={`w-full rounded border border-gray-300 py-2 ${f.prefix ? "pl-7" : "pl-3"} ${f.suffix ? "pr-8" : "pr-3"} focus:border-black focus:outline-none`} />
                {f.suffix && (<span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">{f.suffix}</span>)}
              </div>
            </label>
          ))}
        </section>
        <section className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Results</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Result label="Net Operating Income (NOI)" value={money(results.noi)} />
            <Result label="Cap Rate" value={pct(results.capRate)} highlight />
            <Result label="Down payment" value={money(results.downPayment)} />
            <Result label="Loan amount" value={money(results.loanAmount)} />
            <Result label="Monthly P&I" value={money(results.piMonthly)} />
            <Result label="Monthly cash flow" value={money(results.monthlyCashFlow)} highlight />
            <Result label="Annual cash flow" value={money(results.annualCashFlow)} />
            <Result label="Cash-on-Cash return" value={pct(results.cashOnCash)} highlight />
            <Result label="DSCR" value={results.dscr.toFixed(2)} />
          </dl>
          <p className="mt-4 text-xs text-gray-500">Estimates only. Excludes capex reserves, closing costs, escrows beyond op-ex, and tax effects.</p>
        </section>
        <div className="mt-8 text-sm"><a href="/" className="text-blue-600 hover:underline">← Back to home</a></div>
      </div>
    </div>
  );
};

const Result: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
    <dd className={`mt-1 text-lg ${highlight ? "font-bold text-black" : "font-medium text-gray-900"}`}>{value}</dd>
  </div>
);

export default CapRate;
