"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FactorPanel } from "@/components/FactorPanel";
import { FlagButton } from "@/components/FlagButton";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { RecordPanel } from "@/components/RecordPanel";
import { RiskVerdict } from "@/components/RiskVerdict";
import { STAGE_LABELS } from "@/lib/stages";
import { StageTracker } from "@/components/StageTracker";
import { WhatIfPanel } from "@/components/WhatIfPanel";
import { fetchProject } from "@/lib/api";
import type { ProjectDetail } from "@/lib/types";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProject(id)
      .then((p) => !cancelled && setProject(p))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <main className="mx-auto max-w-6xl space-y-4 px-6 py-8">
        <Link href="/dashboard" className="text-sm text-ink-2 underline hover:text-ink">
          ← Back to dashboard
        </Link>
        <div className="rounded-lg border border-risk-critical/30 bg-risk-criticalBg p-6 text-sm text-risk-critical">
          <p className="font-semibold">Could not load project {id}</p>
          <p className="mt-1">{error}</p>
          <p className="mt-3 text-xs text-risk-critical">
            This view needs the live API — start it with{" "}
            <code>uvicorn app.main:app --reload --port 8000</code>.
          </p>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="mx-auto max-w-6xl space-y-4 px-6 py-8">
        <div className="h-5 w-32 animate-pulse rounded bg-cream-deep" />
        <div className="h-24 animate-pulse rounded-card bg-cream-deep" />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-card bg-cream-deep" />
          <div className="h-80 animate-pulse rounded-card bg-cream-deep" />
        </div>
      </main>
    );
  }

  const openLitigation = project.litigations.filter((l) => l.status === "pending");

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-6 py-8">
      <Link href="/dashboard" className="inline-block text-sm text-ink-2 underline hover:text-ink">
        ← Back to dashboard
      </Link>

      {/* Identity, then the verdict. An officer reads what, then how bad, then why. */}
      <div className="rounded-card border border-line bg-cream-surface p-5 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-ink">{project.name}</h1>
            <p className="mt-1 text-sm text-ink-2">
              {project.location} · {project.sector} · Project #{project.project_id}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded bg-forest-800 px-2 py-1 font-mono font-semibold text-cream-surface">
                {project.current_stage}
              </span>
              <span className="rounded bg-cream-deep px-2 py-1 text-ink-2">
                {STAGE_LABELS[project.current_stage] ?? "Current stage"}
              </span>
              <span className="rounded bg-cream-deep px-2 py-1 text-ink-2">
                {project.paf_count ?? "—"} families
              </span>
              <span className="rounded bg-cream-deep px-2 py-1 text-ink-2">
                {project.area != null ? `${project.area} ha` : "—"}
              </span>
              {project.rehabilitation_progress_pct != null && (
                <span className="rounded bg-cream-deep px-2 py-1 text-ink-2">
                  R&amp;R {Math.round(project.rehabilitation_progress_pct)}%
                </span>
              )}
              <span className="rounded bg-cream-deep px-2 py-1 text-ink-2">
                Opened {formatDate(project.created_at)}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <FlagButton projectId={project.project_id} prediction={project.prediction} />
          </div>
        </div>
      </div>

      <RiskVerdict prediction={project.prediction} />

      <div className="grid gap-5 lg:grid-cols-2">
        <StageTracker history={project.stage_history} currentStage={project.current_stage} />
        <div className="space-y-5">
          <FactorPanel prediction={project.prediction} />
          <RecommendationPanel recommendations={project.prediction.recommendations} />
          <WhatIfPanel projectId={project.project_id} baseline={project.current_features} />
          <RecordPanel project={project} />
        </div>
      </div>

      {/* Supporting records */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-card border bg-cream-surface p-5 shadow-card">
          <h2 className="text-sm font-semibold text-ink">
            Litigation{" "}
            <span className="font-normal text-ink-3">
              ({openLitigation.length} open of {project.litigations.length})
            </span>
          </h2>
          {project.litigations.length === 0 ? (
            <p className="mt-3 text-xs text-ink-3">No litigation recorded.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line-soft">
              {project.litigations.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-ink-2">{l.type ?? "Unspecified"}</span>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                      l.status === "pending"
                        ? "bg-risk-highBg text-risk-high"
                        : "bg-risk-lowBg text-risk-low"
                    }`}
                  >
                    {l.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-card border bg-cream-surface p-5 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Compensation</h2>
          {project.compensation_records.length === 0 ? (
            <p className="mt-3 text-xs text-ink-3">No compensation recorded.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line-soft">
              {project.compensation_records.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-ink-2">{c.compensation_pct}% disbursed</span>
                  <span className="text-xs text-ink-3">{formatDate(c.updated_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-ink-3">
        Scored by <span className="font-mono">{project.prediction.model_version}</span>,
        trained on synthetic data — this score demonstrates the pipeline rather than
        validated real-world accuracy.
      </p>
    </main>
  );
}
