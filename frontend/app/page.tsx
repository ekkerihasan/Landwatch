import Link from "next/link";

const STAGES = ["3A", "3C", "3D", "3G", "3H", "3E"];

export default function LandingPage() {
  return (
    <main>
      {/* Hero — the thesis: status tracking tells you where a project is, not where it's going */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
            SIH26017 · Ministry of Road Transport &amp; Highways
          </p>
          <h1 className="mt-5 max-w-3xl text-balance text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl">
            Land acquisition delays are visible long before they are official.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            Existing systems record where a project stands today. LANDWATCH reads the same
            process data and estimates where it is heading — early enough for an officer to
            act, with the reasoning shown every time.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
            >
              Open the risk dashboard
            </Link>
            <Link
              href="/projects/new"
              className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Assess a site before it starts
            </Link>
          </div>

          {/* The statutory sequence, as a quiet piece of domain furniture */}
          <div className="mt-14 flex flex-wrap items-center gap-x-2 gap-y-3 border-t border-slate-100 pt-8">
            <span className="mr-2 text-xs font-medium uppercase tracking-wider text-slate-400">
              Tracked across
            </span>
            {STAGES.map((stage, i) => (
              <span key={stage} className="flex items-center gap-2">
                <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                  {stage}
                </span>
                {i < STAGES.length - 1 && (
                  <span className="text-slate-300" aria-hidden>
                    →
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* The distinction that justifies the product */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden px-6 py-16 sm:py-20">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
                A system of record answers
              </p>
              <p className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                &ldquo;Where is this project now?&rdquo;
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Notifications issued, payments released, current stage. Accurate, necessary, and
                entirely retrospective — by the time a delay appears here, it has already happened.
              </p>
            </div>
            <div className="rounded-lg border-2 border-slate-900 bg-white p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
                LANDWATCH answers
              </p>
              <p className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                &ldquo;Which of these will slip, and why?&rdquo;
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                A ranked caseload, the factors behind every flag, and a simulator for testing an
                intervention before committing to it. It recommends; the officer decides.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three capabilities */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded bg-slate-900 font-mono text-xs font-bold text-white">
                01
              </div>
              <h2 className="mt-4 text-base font-semibold tracking-tight text-slate-900">
                Rank the caseload
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Every project scored Low to Critical, hardest-hit first, so limited attention goes
                where it changes an outcome.
              </p>
            </div>
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded bg-slate-900 font-mono text-xs font-bold text-white">
                02
              </div>
              <h2 className="mt-4 text-base font-semibold tracking-tight text-slate-900">
                Show the reasoning
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                No risk score appears without the factors behind it — compensation stalled,
                litigation open, a stage running past its statutory duration.
              </p>
            </div>
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded bg-slate-900 font-mono text-xs font-bold text-white">
                03
              </div>
              <h2 className="mt-4 text-base font-semibold tracking-tight text-slate-900">
                Test the intervention
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Move compensation or clear a case in the simulator and watch the score respond,
                before spending anything in the field.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Honest disclosure — the thing that earns credibility rather than losing it */}
      <section className="border-t border-slate-200 bg-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
            What this prototype does not claim
          </h2>
          <div className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
            <p className="text-sm leading-relaxed text-slate-300">
              <strong className="text-white">It is not validated on real data.</strong> Every
              project here is synthetic, and the model is trained on synthetic data. That
              demonstrates the pipeline works end to end — it is not evidence that the system
              predicts real delays.
            </p>
            <p className="text-sm leading-relaxed text-slate-300">
              <strong className="text-white">It does not prove cause.</strong> The factors behind a
              score show what moved it, not what will fix it. Low compensation may be the cause of a
              stall, or a symptom of the dispute causing it.
            </p>
            <p className="text-sm leading-relaxed text-slate-300">
              <strong className="text-white">It does not predict dates.</strong> The output is a
              risk band and a probability, never a completion date or an exact number of days late.
            </p>
            <p className="text-sm leading-relaxed text-slate-300">
              <strong className="text-white">It does not act.</strong> No endpoint triggers anything
              in the outside world. Every path ends in a decision a human officer makes.
            </p>
          </div>

          <div className="mt-10 border-t border-slate-700 pt-6">
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-white underline underline-offset-4 hover:text-slate-300"
            >
              See it working on the demo caseload →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
