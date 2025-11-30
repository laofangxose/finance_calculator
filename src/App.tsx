type Calculator = {
  title: string
  status: 'Planned' | 'In progress' | 'Ready soon'
  summary: string
}

const calculators: Calculator[] = [
  {
    title: 'Novated lease calculator',
    status: 'In progress',
    summary:
      'Compare your provider quote against buying outright or taking a standard car loan, factoring GST and tax savings.',
  },
  {
    title: 'Pay calculator',
    status: 'Planned',
    summary:
      'Model take-home pay under different tax brackets, salary sacrifice amounts, and super contributions.',
  },
  {
    title: 'Home loan calculator',
    status: 'Planned',
    summary:
      'Project repayments and total interest, and compare offsets or redraw scenarios in one view.',
  },
]

const highlights = [
  'Client-side only: fast, private, no sign-up.',
  'Built to be extensible: add calculators via config, not rewrites.',
  'Clear comparison outputs: total cost, monthly net cost, and savings.',
]

function StatusPill({ status }: { status: Calculator['status'] }) {
  const colors: Record<Calculator['status'], string> = {
    'In progress': 'bg-amber-500/20 text-amber-200 border-amber-500/60',
    Planned: 'bg-slate-500/20 text-slate-200 border-slate-500/60',
    'Ready soon': 'bg-emerald-500/20 text-emerald-100 border-emerald-500/60',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${colors[status]}`}
    >
      {status}
    </span>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 lg:py-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Finance calculators
            </p>
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">
              Novated lease savings, done transparently
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
              Start with your provider quote. We will compare against buying
              outright and a standard car loan, including tax and GST effects.
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
              href="#roadmap"
              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
            >
              View roadmap
            </a>
          </div>
        </header>

        <main className="mt-10 space-y-12">
          <section
            id="get-started"
            className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-slate-950/60"
          >
            <div className="grid gap-10 border-b border-slate-800 px-6 py-8 md:grid-cols-2 md:px-10">
              <div>
                <h2 className="text-2xl font-semibold sm:text-3xl">
                  Novated lease calculator
                </h2>
                <p className="mt-3 text-sm text-slate-300 sm:text-base">
                  Coming next: enter your quote, lease term, residual, running
                  costs, fees, and your tax bracket. We will show monthly net
                  cost, total cost over term, and compare against buying
                  outright or taking a standard loan.
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-200 sm:text-sm">
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 font-semibold text-emerald-200">
                    GST & tax savings
                  </span>
                  <span className="rounded-full bg-blue-500/15 px-3 py-1 font-semibold text-blue-200">
                    Residual/balloon impact
                  </span>
                  <span className="rounded-full bg-fuchsia-500/15 px-3 py-1 font-semibold text-fuchsia-200">
                    Running cost bundles
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-inner shadow-slate-950/50">
                <h3 className="text-lg font-semibold text-slate-100">
                  Input checklist
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Vehicle price, lease term, and residual/balloon.</li>
                  <li>• Provider fees and bundled running costs.</li>
                  <li>• Your marginal tax rate and payroll frequency.</li>
                  <li>• Expected annual kms, fuel/charging and insurance.</li>
                </ul>
                <p className="mt-4 text-xs text-slate-400">
                  We keep everything client-side. No sign-up, no storage unless
                  you opt-in later for “remember my inputs”.
                </p>
              </div>
            </div>
            <div className="grid gap-6 px-6 py-6 md:grid-cols-3 md:px-10">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-200 shadow shadow-slate-950/40"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section
            id="roadmap"
            className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-2xl shadow-slate-950/50 sm:p-8"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold sm:text-3xl">
                  Calculator roadmap
                </h2>
                <p className="mt-2 text-sm text-slate-300 sm:text-base">
                  We are starting with novated leases and keeping the framework
                  modular so new calculators slot in without a rewrite.
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {calculators.map((calculator) => (
                <article
                  key={calculator.title}
                  className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow shadow-slate-950/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-slate-100">
                      {calculator.title}
                    </h3>
                    <StatusPill status={calculator.status} />
                  </div>
                  <p className="mt-3 text-sm text-slate-300">
                    {calculator.summary}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/50 sm:p-8">
              <h2 className="text-2xl font-semibold">How you can help</h2>
              <p className="mt-3 text-sm text-slate-300">
                Send a sample novated lease quote or the fields your provider
                asks for. We will tune the defaults and assumptions to match
                real-world scenarios.
              </p>
              <div className="mt-4 space-y-2 text-sm text-slate-200">
                <p>• Common providers and fees we should include.</p>
                <p>• Typical residual percentages by term.</p>
                <p>• Fuel vs EV charging costs, maintenance bundles.</p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/50 sm:p-8">
              <h2 className="text-2xl font-semibold">Launch checklist</h2>
              <ol className="mt-4 space-y-2 text-sm text-slate-200">
                <li>1) Implement calculator core and validation.</li>
                <li>2) Add comparison views and assumptions panel.</li>
                <li>3) Write FAQ/disclaimer content.</li>
                <li>4) Ship responsive polish and accessibility pass.</li>
                <li>5) Deploy on GitHub Pages or Vercel.</li>
              </ol>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
