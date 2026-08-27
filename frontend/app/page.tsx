import Link from "next/link";
import { PhotoFrame } from "@/components/PhotoFrame";
import { IMAGES } from "@/lib/assets";
import { STAGE_LABELS, STAGE_SEQUENCE } from "@/lib/stages";

const CAPABILITIES = [
  {
    n: "01",
    title: "Rank the caseload",
    body: "Every project scored Low to Critical, worst first, so limited attention goes where it changes an outcome.",
  },
  {
    n: "02",
    title: "Show the reasoning",
    body: "No score appears without the factors behind it — compensation stalled, litigation open, a stage past its statutory duration.",
  },
  {
    n: "03",
    title: "Recommend the response",
    body: "Each condition maps to an owned action: verify compensation, escalate to the legal cell, convene a district review.",
  },
  {
    n: "04",
    title: "Test it before committing",
    body: "Move compensation or clear a case in the simulator and watch the score respond, before spending anything in the field.",
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
    body: "The output is a risk band and a range of days, never a completion date or an exact figure.",
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
      <PhotoFrame slot={IMAGES.landingHero} drawnScale="h-80">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <p className="lw-rise lw-d1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
            SIH26017 · Ministry of Road Transport &amp; Highways · Prototype
          </p>
          <h1 className="lw-rise lw-d2 mt-5 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
            Land acquisition delays are visible long before they become official.
          </h1>
          <p className="lw-rise lw-d3 mt-5 max-w-xl text-base leading-relaxed text-white/75">
            Existing systems record where a project stands today. LANDWATCH reads the same
            process data and estimates where it is heading — early enough for an officer to
            act, with the reasoning shown every time.
          </p>
          <div className="lw-rise lw-d4 mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded bg-cream-surface px-6 py-3 text-sm font-bold text-forest-800 transition-colors hover:bg-white"
            >
              Open the monitoring dashboard
            </Link>
            <Link
              href="/projects/new"
              className="rounded border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Assess a site
            </Link>
          </div>

          {/* Statutory sequence */}
          <div className="lw-rise lw-d4 mt-14 border-t border-white/10 pt-7">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
              Tracked across the statutory sequence
            </p>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
              {STAGE_SEQUENCE.map((stage, i) => (
                <span key={stage} className="flex items-center gap-1.5">
                  <span
                    className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] font-semibold text-white/85"
                    title={STAGE_LABELS[stage]}
                  >
                    {stage}
                  </span>
                  {i < STAGE_SEQUENCE.length - 1 && (
                    <span className="text-white/25" aria-hidden>
                      →
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </PhotoFrame>

      {/* ---------- The distinction ---------- */}
      <section className="lw-paper border-y border-line">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-card border border-line bg-cream-surface p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                A system of record answers
              </p>
              <p className="mt-4 text-xl font-semibold tracking-tight text-ink">
                &ldquo;Where is this project now?&rdquo;
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">
                Notifications issued, payments released, current stage. Accurate, necessary,
                and entirely retrospective — by the time a delay appears here, it has already
                happened.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-card border-2 border-forest-800 bg-cream-surface p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-forest-600">
                LANDWATCH answers
              </p>
              <p className="mt-4 text-xl font-semibold tracking-tight text-ink">
                &ldquo;Which of these will slip, and why?&rdquo;
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">
                A ranked caseload, the factors behind every flag, an owned action for each,
                and a simulator for testing an intervention before committing to it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Capabilities ---------- */}
      <section className="bg-cream">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="max-w-lg text-2xl font-bold tracking-tight text-ink">
            Four things it does, in the order an officer does them.
          </h2>
          <div className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2">
            {CAPABILITIES.map((c) => (
              <div key={c.n} className="border-t border-line pt-4">
                <span className="font-mono text-xs font-bold text-forest-600">{c.n}</span>
                <h3 className="mt-2.5 text-base font-semibold tracking-tight text-ink">
                  {c.title}
                </h3>
                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-2">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Honest disclosure ---------- */}
      <section className="lw-forest lw-grain relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-6 py-14">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            What this prototype does not claim
          </h2>
          <div className="mt-7 grid gap-x-12 gap-y-6 sm:grid-cols-2">
            {DISCLAIMERS.map((d) => (
              <div key={d.head}>
                <p className="text-sm font-semibold text-white">{d.head}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/65">{d.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-11 border-t border-white/10 pt-6">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-white"
            >
              See it working on the demo caseload
              <span className="transition-transform group-hover:translate-x-1" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
