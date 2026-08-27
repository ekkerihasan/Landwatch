import Link from "next/link";
import { HighwayScene } from "@/components/HighwayScene";

const STAGES = [
  { code: "3A", label: "Notification" },
  { code: "3C", label: "Declaration" },
  { code: "3D", label: "Land vests" },
  { code: "3G", label: "Compensation set" },
  { code: "3H", label: "Deposited" },
  { code: "3E", label: "Possession" },
];

const CAPABILITIES = [
  {
    n: "01",
    title: "Rank the caseload",
    body: "Every project scored Low to Critical, hardest-hit first, so limited attention goes where it changes an outcome.",
    accent: "text-amber-400",
  },
  {
    n: "02",
    title: "Show the reasoning",
    body: "No score appears without the factors behind it — compensation stalled, litigation open, a stage past its statutory duration.",
    accent: "text-teal-300",
  },
  {
    n: "03",
    title: "Recommend the response",
    body: "Each condition maps to an owned action: verify compensation, escalate to the legal cell, convene a district review.",
    accent: "text-amber-400",
  },
  {
    n: "04",
    title: "Test it before committing",
    body: "Move compensation or clear a case in the simulator and watch the score respond, before spending anything in the field.",
    accent: "text-teal-300",
  },
];

const DISCLAIMERS = [
  {
    head: "It is not validated on real data.",
    body: "Every project here is synthetic and the model is trained on synthetic data. That demonstrates the pipeline works — it is not evidence the system predicts real delays.",
  },
  {
    head: "It does not prove cause.",
    body: "The factors behind a score show what moved it, not what will fix it. Low compensation may be the cause of a stall, or a symptom of the dispute causing it.",
  },
  {
    head: "It does not predict dates.",
    body: "The output is a risk band and a probability, never a completion date or an exact number of days late.",
  },
  {
    head: "It does not act.",
    body: "No endpoint triggers anything in the outside world. Every path ends in a decision a human officer makes.",
  },
];

export default function LandingPage() {
  return (
    <main>
      {/* ---------- Hero ---------- */}
      <section className="lw-hero lw-grain relative overflow-hidden">
        {/* ambient glow, drifting slowly behind everything */}
        <div
          className="lw-drift pointer-events-none absolute -left-40 top-0 h-[34rem] w-[34rem] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(45,212,191,.28), transparent 70%)" }}
          aria-hidden
        />
        <div className="lw-grid absolute inset-0 opacity-60" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-6 pb-72 pt-20 sm:pt-28">
          <p className="lw-rise lw-d1 font-mono text-[11px] uppercase tracking-[0.22em] text-amber-400/90">
            SIH26017 · Ministry of Road Transport &amp; Highways
          </p>

          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.06] tracking-tight text-white sm:text-6xl">
            <span className="lw-rise lw-d2 block">Land acquisition delays</span>
            <span className="lw-rise lw-d3 block">are visible long before</span>
            <span className="lw-rise lw-d4 block">
              they become <span className="text-amber-400">official</span>.
            </span>
          </h1>

          <p className="lw-rise lw-d5 mt-7 max-w-xl text-lg leading-relaxed text-slate-300">
            Existing systems record where a project stands today. LANDWATCH reads the same
            process data and estimates where it is heading — early enough for an officer to
            act, with the reasoning shown every time.
          </p>

          <div className="lw-rise lw-d6 mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-md bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:bg-amber-300"
            >
              Open the risk dashboard
            </Link>
            <Link
              href="/projects/new"
              className="rounded-md border border-slate-500/60 px-6 py-3 text-sm font-semibold text-slate-100 backdrop-blur transition-colors hover:border-slate-300 hover:bg-white/5"
            >
              Assess a site on the map
            </Link>
          </div>
        </div>

        {/* the corridor itself */}
        <HighwayScene className="pointer-events-none absolute inset-x-0 bottom-0 h-72 w-full" />

        {/* statutory sequence, riding along the road */}
        <div className="relative mx-auto max-w-6xl px-6 pb-10">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-3">
            <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Tracked across
            </span>
            {STAGES.map((s, i) => (
              <span key={s.code} className={`lw-fade lw-d${Math.min(i + 1, 6)} flex items-center gap-1.5`}>
                <span
                  className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] font-semibold text-slate-200 backdrop-blur"
                  title={s.label}
                >
                  {s.code}
                </span>
                {i < STAGES.length - 1 && (
                  <span className="text-slate-600" aria-hidden>
                    →
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- The distinction ---------- */}
      <section className="lw-paper border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white/70 p-7 backdrop-blur">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
                A system of record answers
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
                &ldquo;Where is this project now?&rdquo;
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Notifications issued, payments released, current stage. Accurate, necessary, and
                entirely retrospective — by the time a delay appears here, it has already happened.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-xl border-2 border-slate-900 bg-white p-7">
              <span
                className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-amber-400/20 blur-2xl"
                aria-hidden
              />
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-600">
                LANDWATCH answers
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
                &ldquo;Which of these will slip, and why?&rdquo;
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                A ranked caseload, the factors behind every flag, an owned action for each, and a
                simulator for testing an intervention before committing to it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Capabilities ---------- */}
      <section className="relative overflow-hidden bg-[#0b1220]">
        <div className="lw-grid absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <h2 className="max-w-lg text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Four things it does, in the order an officer does them.
          </h2>

          <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2">
            {CAPABILITIES.map((c) => (
              <div key={c.n} className="border-t border-white/10 pt-5">
                <span className={`font-mono text-xs font-bold ${c.accent}`}>{c.n}</span>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-white">{c.title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Honest disclosure ---------- */}
      <section className="relative overflow-hidden bg-slate-950">
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-amber-400">
            What this prototype does not claim
          </h2>

          <div className="mt-8 grid gap-x-12 gap-y-7 sm:grid-cols-2">
            {DISCLAIMERS.map((d) => (
              <div key={d.head}>
                <p className="text-sm font-semibold text-white">{d.head}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{d.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-white/10 pt-7">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-white"
            >
              See it working on the demo caseload
              <span className="text-amber-400 transition-transform group-hover:translate-x-1" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
