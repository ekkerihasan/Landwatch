"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { RiskBadge } from "@/components/RiskBadge";
import { FactorPanel } from "@/components/FactorPanel";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { createProject, estimateNewProject, fetchProjects } from "@/lib/api";
import { STAGE_LABELS } from "@/lib/stages";
import type { NewProjectEstimate, Project } from "@/lib/types";

// Leaflet touches window on import, so it can never run during SSR.
const SiteMap = dynamic(() => import("@/components/SiteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-cream-deep text-sm text-ink-3">
      Loading map…
    </div>
  ),
});

const STAGES = ["3A", "3C", "3D", "3G", "3H", "3E"];

// Mirrors TYPICAL in app/routers/estimate.py — shown as placeholders so the officer
// can see what will be assumed before deciding whether to override it.
const TYPICAL = {
  area: 60,
  paf_count: 133,
  expected_litigations: 1,
  planned_compensation_pct: 58,
  planned_rehabilitation_pct: 49,
};

const FIELD_LABELS: Record<string, string> = {
  area: "land area",
  paf_count: "affected families",
  days_in_current_stage: "time in stage",
  expected_litigations: "anticipated disputes",
  planned_compensation_pct: "compensation at start",
  planned_rehabilitation_pct: "rehabilitation progress",
};

type Blank = number | "";

export default function AssessSitePage() {
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [existing, setExisting] = useState<Project[]>([]);
  const [result, setResult] = useState<NewProjectEstimate | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<number | null>(null);

  const [location, setLocation] = useState("");
  const [name, setName] = useState("");
  const [stage, setStage] = useState("3A");
  const [form, setForm] = useState<Record<string, Blank>>({
    area: "",
    paf_count: "",
    expected_litigations: "",
    planned_compensation_pct: "",
    planned_rehabilitation_pct: "",
  });

  useEffect(() => {
    fetchProjects()
      .then(({ projects }) => setExisting(projects))
      .catch(() => setExisting([]));
  }, []);

  const canScore = picked !== null && location.trim().length > 0;
  const set = (key: string, value: Blank) => setForm((f) => ({ ...f, [key]: value }));

  /** Only send what was actually filled in — blanks become server-side assumptions. */
  function filledOnly() {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) if (v !== "") out[k] = v;
    return out;
  }

  async function score() {
    if (!picked) return;
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      setResult(
        await estimateNewProject({
          location,
          latitude: picked.lat,
          longitude: picked.lng,
          current_stage: stage,
          ...filledOnly(),
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveAsProject() {
    if (!picked) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createProject({
        name: name.trim() || `Proposed site — ${location}`,
        location,
        sector: "National Highway",
        area: form.area === "" ? null : Number(form.area),
        paf_count: form.paf_count === "" ? null : Number(form.paf_count),
        current_stage: stage,
        latitude: picked.lat,
        longitude: picked.lng,
        rehabilitation_progress_pct:
          form.planned_rehabilitation_pct === ""
            ? null
            : Number(form.planned_rehabilitation_pct),
      });
      setSaved(created.project_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded border border-line px-2.5 py-1.5 text-sm text-ink placeholder:text-slate-400 focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600";
  const labelCls = "block text-xs font-medium text-ink-2";

  const legend = useMemo(
    () => [
      ["Low", "#0d9488"],
      ["Medium", "#d97706"],
      ["High", "#ea580c"],
      ["Critical", "#dc2626"],
    ],
    []
  );

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-6 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Assess a site</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-2">
          Place a pin and score it. Every field below is optional — leave one blank and a
          typical value is assumed, and the result says which.
        </p>
      </div>

      {/* Stated before the number, not under it */}
      <div className="rounded-lg border border-risk-medium/30 bg-risk-mediumBg p-3.5 text-xs leading-relaxed text-risk-medium">
        <strong>An estimate, not a prediction about a real project.</strong> The location is
        recorded but <em>not used in scoring</em> — the model has no location feature, so this
        says nothing about this district specifically. What it answers is &ldquo;what would a
        project with these characteristics look like&rdquo;.
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        {/* Map */}
        <div className="overflow-hidden rounded-card border bg-cream-surface shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-cream-alt px-4 py-2.5">
            <span className="text-xs font-medium text-ink-2">
              {picked
                ? `Selected: ${picked.lat}, ${picked.lng}`
                : "Click anywhere on the map to place the site"}
            </span>
            <div className="flex items-center gap-2.5">
              {legend.map(([label, colour]) => (
                <span key={label} className="flex items-center gap-1 text-[10px] text-ink-3">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: colour }}
                    aria-hidden
                  />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="h-[26rem]">
            <SiteMap
              picked={picked}
              onPick={(lat, lng) => setPicked({ lat, lng })}
              existing={existing}
            />
          </div>
          <p className="border-t bg-cream-alt px-4 py-2 text-[11px] text-ink-3">
            Coloured pins are the {existing.length} existing projects, at their current risk level.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-card border bg-cream-surface p-5 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Expected characteristics</h2>
          <p className="mt-0.5 text-xs text-ink-3">
            Optional. Placeholders show what will be assumed if you skip a field.
          </p>

          <div className="mt-4 space-y-3.5">
            <div>
              <label className={labelCls} htmlFor="location">
                Location <span className="text-risk-critical">*</span>
              </label>
              <input
                id="location"
                className={`mt-1 ${inputCls}`}
                placeholder="e.g. Hubballi, Karnataka"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <p className="mt-1 text-[11px] leading-relaxed text-ink-3">
                District and state. Recorded for the map — not used in scoring.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="area">
                  Area (hectares)
                </label>
                <input
                  id="area"
                  type="number"
                  min={0}
                  className={`mt-1 ${inputCls}`}
                  placeholder={`typical: ${TYPICAL.area}`}
                  value={form.area}
                  onChange={(e) => set("area", e.target.value === "" ? "" : Number(e.target.value))}
                />
                <p className="mt-1 text-[11px] leading-relaxed text-ink-3">Total land proposed for acquisition.</p>
              </div>
              <div>
                <label className={labelCls} htmlFor="paf">
                  Affected families
                </label>
                <input
                  id="paf"
                  type="number"
                  min={0}
                  className={`mt-1 ${inputCls}`}
                  placeholder={`typical: ${TYPICAL.paf_count}`}
                  value={form.paf_count}
                  onChange={(e) =>
                    set("paf_count", e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
                <p className="mt-1 text-[11px] leading-relaxed text-ink-3">
                  Families displaced. Larger displacement slows acquisition.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="lit">
                  Anticipated disputes
                </label>
                <input
                  id="lit"
                  type="number"
                  min={0}
                  className={`mt-1 ${inputCls}`}
                  placeholder={`typical: ${TYPICAL.expected_litigations}`}
                  value={form.expected_litigations}
                  onChange={(e) =>
                    set("expected_litigations", e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
                <p className="mt-1 text-[11px] leading-relaxed text-ink-3">
                  Title or valuation challenges you expect. The strongest single signal.
                </p>
              </div>
              <div>
                <label className={labelCls} htmlFor="comp">
                  Compensation ready (%)
                </label>
                <input
                  id="comp"
                  type="number"
                  min={0}
                  max={100}
                  className={`mt-1 ${inputCls}`}
                  placeholder={`typical: ${TYPICAL.planned_compensation_pct}`}
                  value={form.planned_compensation_pct}
                  onChange={(e) =>
                    set(
                      "planned_compensation_pct",
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
                <p className="mt-1 text-[11px] leading-relaxed text-ink-3">
                  Share of compensation cases already processed at the outset.
                </p>
              </div>
            </div>

            <div>
              <label className={labelCls} htmlFor="rehab">
                Rehabilitation progress (%)
              </label>
              <input
                id="rehab"
                type="number"
                min={0}
                max={100}
                className={`mt-1 ${inputCls}`}
                placeholder={`typical: ${TYPICAL.planned_rehabilitation_pct}`}
                value={form.planned_rehabilitation_pct}
                onChange={(e) =>
                  set(
                    "planned_rehabilitation_pct",
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
              <p className="mt-1 text-[11px] text-ink-3">
                R&amp;R below 50% blocks possession regardless of how the award progresses.
              </p>
            </div>

            <div>
              <label className={labelCls} htmlFor="stage">
                Starting stage
              </label>
              <select
                id="stage"
                className={`mt-1 ${inputCls}`}
                value={stage}
                onChange={(e) => setStage(e.target.value)}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s} — {STAGE_LABELS[s] ?? ""}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-3">
                Where the acquisition would begin in the statutory sequence.
              </p>
            </div>
          </div>

          <button
            onClick={score}
            disabled={!canScore || busy}
            className="mt-5 w-full rounded bg-forest-800 px-4 py-2.5 text-sm font-semibold text-cream-surface hover:bg-forest-700 disabled:cursor-not-allowed disabled:bg-line"
          >
            {busy ? "Scoring…" : "Estimate delay risk"}
          </button>
          {!canScore && (
            <p className="mt-2 text-center text-xs text-ink-3">
              {picked ? "Enter a location name" : "Place a pin on the map first"}
            </p>
          )}
          {error && (
            <p className="mt-3 rounded border border-risk-critical/30 bg-risk-criticalBg p-2.5 text-xs text-risk-critical">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="rounded-card border bg-cream-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-ink">Estimated risk</h2>
                  <p className="mt-0.5 text-xs text-ink-3">{location}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <RiskBadge
                    level={result.prediction.risk_class}
                    probability={result.prediction.probability}
                  />
                  {result.prediction.delay_estimate && (
                    <span className="font-mono text-[11px] text-ink-2">
                      delay {result.prediction.delay_estimate.lower_days}–
                      {result.prediction.delay_estimate.upper_days} days
                    </span>
                  )}
                </div>
              </div>

              {/* Saving is the step people miss — an estimate writes no record at all. */}
              {!saved && (
                <div className="mt-4 rounded-lg border border-slate-900 bg-cream-alt p-3.5">
                  <p className="text-xs font-semibold text-ink">
                    This estimate has not been saved.
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-2">
                    Nothing appears on the dashboard until you track it as a project.
                  </p>
                  <button
                    onClick={saveAsProject}
                    disabled={busy}
                    className="mt-2.5 w-full rounded bg-forest-800 px-4 py-2 text-sm font-semibold text-cream-surface hover:bg-forest-700 disabled:bg-line"
                  >
                    {busy ? "Saving…" : "Track this as a project"}
                  </button>
                </div>
              )}

              {result.assumed_inputs.length > 0 && (
                <p className="mt-3 rounded border border-line bg-cream-alt p-2.5 text-[11px] leading-relaxed text-ink-2">
                  Typical values were assumed for{" "}
                  <strong>
                    {result.assumed_inputs.map((k) => FIELD_LABELS[k] ?? k).join(", ")}
                  </strong>
                  . Fill those in above for an estimate specific to this site.
                </p>
              )}

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-4 text-xs">
                <dt className="text-ink-3">Coordinates</dt>
                <dd className="font-mono text-ink">
                  {picked?.lat}, {picked?.lng}
                </dd>
                <dt className="text-ink-3">Model</dt>
                <dd className="font-mono text-ink">{result.prediction.model_version}</dd>
              </dl>

              <p className="mt-4 rounded border border-line bg-cream-alt p-3 text-[11px] leading-relaxed text-ink-2">
                {result.disclaimer}
              </p>

              <div className="mt-4 border-t pt-4">
                {saved ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded border border-risk-low/30 bg-risk-lowBg px-3 py-1.5 text-xs font-medium text-risk-low">
                      ✓ Saved as project #{saved}
                    </span>
                    <Link
                      href={`/projects/${saved}`}
                      className="text-xs font-medium text-ink-2 underline hover:text-ink"
                    >
                      Open it
                    </Link>
                    <Link
                      href="/dashboard"
                      className="text-xs font-medium text-ink-2 underline hover:text-ink"
                    >
                      Back to dashboard
                    </Link>
                  </div>
                ) : (
                  <>
                    <label className={labelCls} htmlFor="pname">
                      Project name (optional — used when you save)
                    </label>
                    <input
                      id="pname"
                      className={`mt-1 ${inputCls}`}
                      placeholder={`Proposed site — ${location}`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <p className="mt-1.5 text-[11px] text-ink-3">
                      Saving creates a real record on the dashboard. Its score is then
                      recalculated from actual data as stages, litigation and compensation
                      are entered.
                    </p>
                  </>
                )}
              </div>
            </div>

            <RecommendationPanel recommendations={result.prediction.recommendations} />
          </div>

          <FactorPanel prediction={result.prediction} />
        </div>
      )}
    </main>
  );
}
