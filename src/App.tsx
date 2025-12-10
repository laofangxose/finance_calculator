import { useMemo, useState } from 'react'
import './index.css'

type Inputs = {
  vehiclePrice: number
  leaseTermYears: number
  leaseMonthlyPreTax: number
  runningCostsAnnual: number
  providerFeesAnnual: number
  annualIncome: number
  loanRate: number
  savingsRate: number
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
  leaseMonthlyPreTax: 950,
  runningCostsAnnual: 5500,
  providerFeesAnnual: 400,
  annualIncome: 135000,
  loanRate: 9.0,
  savingsRate: 4.5,
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

function residualPercentForTerm(leaseTermYears: number): number {
  // Approximate Australian ATO minimum residual percentages
  const lookup: Record<number, number> = {
    1: 65,
    2: 56.25,
    3: 46.88,
    4: 37.5,
    5: 28.13,
  }
  return lookup[Math.round(leaseTermYears)] ?? 37.5
}

function marginalTaxRateForIncome(annualIncome: number): number {
  // 2024-25 stage 3 brackets (simplified, no Medicare levy)
  if (annualIncome <= 18200) return 0
  if (annualIncome <= 45000) return 0.16
  if (annualIncome <= 135000) return 0.3
  if (annualIncome <= 190000) return 0.37
  return 0.45
}

function calculateNovated(inputs: Inputs): Result {
  const months = inputs.leaseTermYears * 12
  const residualPercent = residualPercentForTerm(inputs.leaseTermYears)
  const residual = inputs.vehiclePrice * (residualPercent / 100)
  const gstSavings = inputs.vehiclePrice * 0.1
  const leaseMonthly = inputs.leaseMonthlyPreTax
  const runningMonthly = inputs.runningCostsAnnual / 12
  const feesMonthly = inputs.providerFeesAnnual / 12
  const bundlePreTax = leaseMonthly + runningMonthly + feesMonthly
  const taxRate = marginalTaxRateForIncome(inputs.annualIncome)
  const netMonthly = bundlePreTax * (1 - taxRate)
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
      residualPercent,
      taxRate,
    },
  }
}

function calculateOutright(inputs: Inputs): Result {
  const totalRunning = inputs.runningCostsAnnual * inputs.leaseTermYears
  const forgoneInterest =
    inputs.vehiclePrice *
    (Math.pow(1 + inputs.savingsRate / 100, inputs.leaseTermYears) - 1)
  const total = inputs.vehiclePrice + totalRunning + forgoneInterest
  return {
    monthly: total / (inputs.leaseTermYears * 12),
    total,
    details: { totalRunning, forgoneInterest },
  }
}

function calculateLoan(inputs: Inputs): Result {
  const months = inputs.leaseTermYears * 12
  const monthlyPayment = paymentNoResidual(
    inputs.vehiclePrice,
    inputs.loanRate,
    months,
  )
  const runningMonthly = inputs.runningCostsAnnual / 12
  const totalPayments = (monthlyPayment + runningMonthly) * months
  const interestEarned =
    inputs.vehiclePrice *
    (Math.pow(1 + inputs.savingsRate / 100, inputs.leaseTermYears) - 1)
  const total = totalPayments - interestEarned
  return {
    monthly: monthlyPayment + runningMonthly,
    total,
    details: { monthlyPayment, runningMonthly, interestEarned },
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
    leaseMonthlyPreTax: defaultInputs.leaseMonthlyPreTax.toString(),
    runningCostsAnnual: defaultInputs.runningCostsAnnual.toString(),
    providerFeesAnnual: defaultInputs.providerFeesAnnual.toString(),
    annualIncome: defaultInputs.annualIncome.toString(),
    loanRate: defaultInputs.loanRate.toString(),
    savingsRate: defaultInputs.savingsRate.toString(),
  })

  const inputs: Inputs = useMemo(() => {
    const parse = (value: string) => {
      const n = parseFloat(value)
      return Number.isFinite(n) ? n : 0
    }
    return {
      vehiclePrice: parse(inputValues.vehiclePrice),
      leaseTermYears: parse(inputValues.leaseTermYears),
      leaseMonthlyPreTax: parse(inputValues.leaseMonthlyPreTax),
      runningCostsAnnual: parse(inputValues.runningCostsAnnual),
      providerFeesAnnual: parse(inputValues.providerFeesAnnual),
      annualIncome: parse(inputValues.annualIncome),
      loanRate: parse(inputValues.loanRate),
      savingsRate: parse(inputValues.savingsRate),
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
  const cashOption = comparisons.find((c) => c.label === 'Buy outright')!

  const handleNumberChange = (key: keyof Inputs) => (value: string) => {
    setInputValues((prev) => ({ ...prev, [key]: value }))
  }

  const inputSections: {
    title: string
    fields: {
      label: string
      key: keyof Inputs
      hint?: string
      step?: number
      min?: number
      max?: number
      type?: 'range' | 'number'
    }[]
  }[] = [
    {
      title: 'Novated lease quote',
      fields: [
        { label: 'Vehicle price (incl. GST)', key: 'vehiclePrice', step: 1000 },
        {
          label: 'Lease term (years)',
          key: 'leaseTermYears',
          step: 1,
          min: 1,
          max: 5,
          type: 'range',
        },
        {
          label: 'Pre-tax monthly lease quote',
          key: 'leaseMonthlyPreTax',
          step: 10,
        },
        { label: 'Running costs per year', key: 'runningCostsAnnual', step: 250 },
        { label: 'Provider fees per year', key: 'providerFeesAnnual', step: 50 },
      ],
    },
    {
      title: 'Income (for tax saving)',
      fields: [
        {
          label: 'Annual income',
          key: 'annualIncome',
          step: 1000,
          hint: 'Used to derive marginal tax rate automatically.',
        },
      ],
    },
    {
      title: 'Car loan comparator',
      fields: [
        {
          label: 'Standard car loan rate (%)',
          key: 'loanRate',
          step: 0.1,
          hint: 'Loan term matches lease term automatically.',
        },
      ],
    },
    {
      title: 'Cash purchase comparator',
      fields: [
        {
          label: 'Savings interest rate (%)',
          key: 'savingsRate',
          step: 0.1,
          hint: 'Used to estimate opportunity cost of paying cash upfront.',
        },
      ],
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
              Compare lease vs cash vs loan
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
              Enter your quote and we&rsquo;ll show monthly and total costs for each path.
            </p>
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
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {inputSections.map((section) => (
                  <div
                    key={section.title}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3 sm:p-3"
                  >
                    <p className="text-sm font-semibold text-slate-100">
                      {section.title}
                    </p>
                    <div
                      className={`mt-3 grid grid-cols-1 gap-3 ${section.fields.length > 1 ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}
                    >
                      {section.fields.map((field) => (
                        <label
                          key={field.key}
                          className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                        >
                          <span className="text-slate-200">{field.label}</span>
                          {field.type === 'range' ? (
                            <>
                              <input
                                type="range"
                                min={field.min}
                                max={field.max}
                                step={field.step ?? 1}
                                value={inputValues[field.key]}
                                onChange={(e) =>
                                  handleNumberChange(field.key)(e.target.value)
                                }
                                className="accent-emerald-500"
                              />
                              <div className="text-xs text-slate-400">
                                {inputValues[field.key]} years
                              </div>
                            </>
                          ) : (
                            <input
                              type="number"
                              step={field.step ?? 1}
                              min={field.min}
                              max={field.max}
                              value={inputValues[field.key]}
                              onChange={(e) =>
                                handleNumberChange(field.key)(e.target.value)
                              }
                              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                            />
                          )}
                          {field.hint && (
                            <span className="text-xs text-slate-400">
                              {field.hint}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                {comparisons.map(({ label, result }) => (
                  <div
                    key={label}
                    className={`rounded-2xl border p-4 shadow shadow-slate-950/40 ${
                      best.label === label
                        ? 'border-emerald-500/60 bg-emerald-500/10'
                        : 'border-slate-800 bg-slate-950/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-slate-100">
                        {label}
                      </h3>
                      {best.label === label && (
                        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                          Lowest total
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-slate-200">
                      <p>Monthly: {currency.format(result.monthly)}</p>
                      <p className="text-xl font-semibold text-slate-50">
                        Total: {currency.format(result.total)}
                      </p>
                      <p
                        className={`text-xs ${
                          result.total === best.result.total
                            ? 'text-emerald-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {result.total === best.result.total
                          ? 'Lowest total'
                          : `${result.total - best.result.total > 0 ? '+' : ''}${currency.format(result.total - best.result.total)} vs lowest`}
                      </p>
                      {label !== 'Buy outright' && (
                        <p className="text-xs text-slate-400">
                          {`${result.total - cashOption.result.total > 0 ? '+' : ''}${currency.format(result.total - cashOption.result.total)} vs buy outright`}
                        </p>
                      )}
                      {label === 'Buy outright' &&
                        result.details.forgoneInterest !== undefined && (
                          <p className="text-xs text-slate-400">
                            Includes forgone interest:{' '}
                            {currency.format(result.details.forgoneInterest)}
                          </p>
                        )}
                      {label === 'Standard car loan' &&
                        result.details.interestEarned !== undefined && (
                          <p className="text-xs text-slate-400">
                            Cash kept earning:{' '}
                            {currency.format(result.details.interestEarned)}
                          </p>
                        )}
                    </div>
                  </div>
                ))}
              </div>
              <Card title="Quick assumptions">
                <ul className="space-y-1 text-slate-300">
                  <li>- GST saving is applied upfront to the financed amount.</li>
                  <li>
                    - Novated bundle (lease + running + fees) is salary sacrificed
                    pre-tax; net cost multiplies by (1 - tax rate).
                  </li>
                  <li>- Residual is paid at end of lease and added to total.</li>
                  <li>- Running costs are treated evenly across months.</li>
                  <li>- Loan term is matched to lease term for comparison.</li>
                  <li>
                    - Cash path includes forgone interest; loan path assumes you keep
                    the cash invested at the savings rate.
                  </li>
                </ul>
              </Card>
            </div>
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
                <div>
                  <p className="text-slate-400">Residual percentage</p>
                  <p className="font-semibold text-slate-100">
                    {novated.details.residualPercent?.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Marginal tax rate</p>
                  <p className="font-semibold text-slate-100">
                    {Math.round((novated.details.taxRate ?? 0) * 1000) / 10}%
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
                Tax treatment can change by jurisdiction. Confirm your marginal
                tax rate and any caps with your payroll/HR or tax adviser. GST is
                fixed at 10% here.
              </p>
              <p>
                Running costs are averaged; in reality, fuel/charging and
                maintenance will vary by month.
              </p>
              <p>
                Residual/balloon is derived from the lease term using ATO
                minimum percentages (1y: 65%, 2y: 56.25%, 3y: 46.88%, 4y:
                37.5%, 5y: 28.13%).
              </p>
              <p>
                Cash comparison includes the opportunity cost of cash at your
                entered savings rate over the lease term.
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
              or loan. Calculations run entirely in your browser; your inputs are
              not sent or stored anywhere.
            </p>
          </section>
        </main>
      </div>
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-6 text-center text-sm text-slate-400">
        <p>© {new Date().getFullYear()} Novated Lease Calculator. Client-side only.</p>
        <p>
          Source code:{' '}
          <a
            href="https://github.com/laofangxose/finance_calculator"
            className="text-emerald-300 underline"
            target="_blank"
            rel="noreferrer"
          >
            github.com/laofangxose/finance_calculator
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
