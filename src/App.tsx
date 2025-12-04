import { useMemo, useState } from 'react'
import './index.css'

type Inputs = {
  vehiclePrice: number
  leaseTermYears: number
  residualPercent: number
  leaseRate: number
  runningCostsAnnual: number
  providerFeesAnnual: number
  taxRate: number
  gstRate: number
  loanTermYears: number
  loanRate: number
}

type Result = {
  monthly: number
  total: number
  details: Record<string, number>
}

const currency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
})

const defaultInputs: Inputs = {
  vehiclePrice: 65000,
  leaseTermYears: 4,
  residualPercent: 37.5,
  leaseRate: 8.5,
  runningCostsAnnual: 5500,
  providerFeesAnnual: 400,
  taxRate: 0.37,
  gstRate: 0.1,
  loanTermYears: 5,
  loanRate: 9.0,
}

function paymentWithResidual(
  principal: number,
  annualRatePct: number,
  months: number,
  residual: number,
): number {
  const monthlyRate = annualRatePct / 100 / 12
  if (monthlyRate === 0) {
    return (principal - residual) / months
  }
  const discountResidual = residual / Math.pow(1 + monthlyRate, months)
  const adjustedPrincipal = principal - discountResidual
  return (
    (adjustedPrincipal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
  )
}

function paymentNoResidual(
  principal: number,
  annualRatePct: number,
  months: number,
): number {
  const monthlyRate = annualRatePct / 100 / 12
  if (monthlyRate === 0) {
    return principal / months
  }
  return (
    (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
  )
}

function calculateNovated(inputs: Inputs): Result {
  const months = inputs.leaseTermYears * 12
  const residual = inputs.vehiclePrice * (inputs.residualPercent / 100)
  const gstSavings = inputs.vehiclePrice * inputs.gstRate
  const financedPrincipal = inputs.vehiclePrice - gstSavings
  const leaseMonthly = paymentWithResidual(
    financedPrincipal,
    inputs.leaseRate,
    months,
    residual,
  )

  const runningMonthly = inputs.runningCostsAnnual / 12
  const feesMonthly = inputs.providerFeesAnnual / 12
  const bundlePreTax = leaseMonthly + runningMonthly + feesMonthly
  const netMonthly = bundlePreTax * (1 - inputs.taxRate)
  const total = netMonthly * months + residual

  return {
    monthly: netMonthly,
    total,
    details: {
      leaseMonthly,
      runningMonthly,
      feesMonthly,
      residual,
      gstSavings,
    },
  }
}

function calculateOutright(inputs: Inputs): Result {
  const totalRunning = inputs.runningCostsAnnual * inputs.leaseTermYears
  const total = inputs.vehiclePrice + totalRunning
  return {
    monthly: total / (inputs.leaseTermYears * 12),
    total,
    details: { totalRunning },
  }
}

function calculateLoan(inputs: Inputs): Result {
  const months = inputs.loanTermYears * 12
  const monthlyPayment = paymentNoResidual(
    inputs.vehiclePrice,
    inputs.loanRate,
    months,
  )
  const runningMonthly = inputs.runningCostsAnnual / 12
  const total = (monthlyPayment + runningMonthly) * months
  return {
    monthly: monthlyPayment + runningMonthly,
    total,
    details: { monthlyPayment, runningMonthly },
  }
}

function Card({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow shadow-slate-950/40">
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      <div className="mt-3 space-y-2 text-sm text-slate-200">{children}</div>
    </div>
  )
}

function App() {
  const [inputValues, setInputValues] = useState<
    Record<keyof Inputs, string>
  >({
    vehiclePrice: defaultInputs.vehiclePrice.toString(),
    leaseTermYears: defaultInputs.leaseTermYears.toString(),
    residualPercent: defaultInputs.residualPercent.toString(),
    leaseRate: defaultInputs.leaseRate.toString(),
    runningCostsAnnual: defaultInputs.runningCostsAnnual.toString(),
    providerFeesAnnual: defaultInputs.providerFeesAnnual.toString(),
    taxRate: defaultInputs.taxRate.toString(),
    gstRate: defaultInputs.gstRate.toString(),
    loanTermYears: defaultInputs.loanTermYears.toString(),
    loanRate: defaultInputs.loanRate.toString(),
  })

  const inputs: Inputs = useMemo(() => {
    const parse = (value: string) => {
      const n = parseFloat(value)
      return Number.isFinite(n) ? n : 0
    }
    return {
      vehiclePrice: parse(inputValues.vehiclePrice),
      leaseTermYears: parse(inputValues.leaseTermYears),
      residualPercent: parse(inputValues.residualPercent),
      leaseRate: parse(inputValues.leaseRate),
      runningCostsAnnual: parse(inputValues.runningCostsAnnual),
      providerFeesAnnual: parse(inputValues.providerFeesAnnual),
      taxRate: parse(inputValues.taxRate),
      gstRate: parse(inputValues.gstRate),
      loanTermYears: parse(inputValues.loanTermYears),
      loanRate: parse(inputValues.loanRate),
    }
  }, [inputValues])

  const novated = useMemo(() => calculateNovated(inputs), [inputs])
  const outright = useMemo(() => calculateOutright(inputs), [inputs])
  const loan = useMemo(() => calculateLoan(inputs), [inputs])

  const comparisons = [
    { label: 'Novated lease (net after tax)', result: novated },
    { label: 'Buy outright', result: outright },
    { label: 'Standard car loan', result: loan },
  ]

  const best = comparisons.reduce((prev, curr) =>
    curr.result.total < prev.result.total ? curr : prev,
  )

  const handleNumberChange = (key: keyof Inputs) => (value: string) => {
    setInputValues((prev) => ({ ...prev, [key]: value }))
  }

  const inputFields: {
    label: string
    key: keyof Inputs
    hint?: string
    step?: number
    min?: number
  }[] = [
    { label: 'Vehicle price (incl. GST)', key: 'vehiclePrice', step: 1000 },
    { label: 'Lease term (years)', key: 'leaseTermYears', step: 0.5, min: 1 },
    { label: 'Residual/balloon (%)', key: 'residualPercent', step: 0.5 },
    { label: 'Lease interest rate (%)', key: 'leaseRate', step: 0.1 },
    { label: 'Running costs per year', key: 'runningCostsAnnual', step: 250 },
    { label: 'Provider fees per year', key: 'providerFeesAnnual', step: 50 },
    {
      label: 'Marginal tax rate (decimal, e.g. 0.37)',
      key: 'taxRate',
      step: 0.01,
    },
    {
      label: 'GST rate (decimal)',
      key: 'gstRate',
      step: 0.01,
    },
    { label: 'Loan term (years)', key: 'loanTermYears', step: 0.5, min: 1 },
    {
      label: 'Standard car loan rate (%)',
      key: 'loanRate',
      step: 0.1,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 lg:py-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Novated lease calculator
            </p>
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">
              Compare novated lease vs buying outright or a car loan
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
              Enter your provider quote and assumptions. We estimate monthly net
              cost (after tax), total cost over the term, and how it compares to
              buying outright or taking a standard loan. All calculations run in
              your browser—nothing is stored.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="#get-started"
              className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:translate-y-px hover:bg-emerald-400"
            >
              Get started
            </a>
            <a
              href="#disclaimers"
              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
            >
              Read assumptions
            </a>
          </div>
        </header>

        <main className="mt-10 space-y-10">
          <section
            id="get-started"
            className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/60 sm:p-8">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl font-semibold sm:text-3xl">
                  Enter your numbers
                </h2>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Client-side only
                </span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {inputFields.map((field) => (
                  <label
                    key={field.key}
                    className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm"
                  >
                    <span className="text-slate-200">{field.label}</span>
                    <input
                      type="number"
                      step={field.step ?? 1}
                      min={field.min}
                      value={inputValues[field.key]}
                      onChange={(e) => handleNumberChange(field.key)(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                    {field.hint && (
                      <span className="text-xs text-slate-400">{field.hint}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Card title="Highlights">
                <p>
                  Best option right now: <strong>{best.label}</strong>
                </p>
                <p>
                  Estimated monthly net cost: {currency.format(best.result.monthly)}
                </p>
                <p>
                  Estimated total over term: {currency.format(best.result.total)}
                </p>
              </Card>
              <Card title="Quick assumptions">
                <ul className="space-y-1 text-slate-300">
                  <li>- GST saving is applied upfront to the financed amount.</li>
                  <li>
                    - Novated bundle (lease + running + fees) is salary sacrificed
                    pre-tax; net cost multiplies by (1 - tax rate).
                  </li>
                  <li>- Residual is paid at end of lease and added to total.</li>
                  <li>- Running costs are treated evenly across months.</li>
                </ul>
              </Card>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {comparisons.map(({ label, result }) => (
              <div
                key={label}
                className={`rounded-2xl border p-5 shadow shadow-slate-950/40 ${
                  best.label === label
                    ? 'border-emerald-500/60 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-slate-100">
                    {label}
                  </h3>
                  {best.label === label && (
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                      Lowest total
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-200">
                  <p>Monthly: {currency.format(result.monthly)}</p>
                  <p>Total over term: {currency.format(result.total)}</p>
                </div>
              </div>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card title="Breakdown (novated)">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-400">Lease monthly (pre-tax)</p>
                  <p className="font-semibold text-slate-100">
                    {currency.format(novated.details.leaseMonthly)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Running monthly</p>
                  <p className="font-semibold text-slate-100">
                    {currency.format(novated.details.runningMonthly)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Fees monthly</p>
                  <p className="font-semibold text-slate-100">
                    {currency.format(novated.details.feesMonthly)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Residual at end</p>
                  <p className="font-semibold text-slate-100">
                    {currency.format(novated.details.residual)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">GST saving</p>
                  <p className="font-semibold text-emerald-200">
                    {currency.format(novated.details.gstSavings)}
                  </p>
                </div>
              </div>
            </Card>

            <Card title="Notes">
              <p>
                This is a simplified estimate. It does not account for Fringe
                Benefits Tax, ECM split, insurance specifics, early termination,
                or sale proceeds at end of term. Use your provider paperwork for
                final numbers.
              </p>
              <p>
                Tax and GST treatment can change by jurisdiction. Confirm your
                marginal tax rate and any caps with your payroll/HR or tax
                adviser.
              </p>
              <p>
                Running costs are averaged; in reality, fuel/charging and
                maintenance will vary by month.
              </p>
            </Card>
          </section>

          <section
            id="disclaimers"
            className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/50 sm:p-8"
          >
            <h2 className="text-2xl font-semibold">Disclaimer</h2>
            <p className="mt-3 text-sm text-slate-300">
              This tool is for illustration only and is not financial advice. It
              relies on the numbers you enter and simplified assumptions about
              GST and tax savings. Always validate against your provider quote
              and speak with a qualified adviser before committing to a lease
              or loan.
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
