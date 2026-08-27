"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FactorPanel } from "@/components/FactorPanel";
import { FlagButton } from "@/components/FlagButton";
import { RiskBadge } from "@/components/RiskBadge";
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
      <div className="space-y-4">
        <Link href="/" className="text-sm text-slate-600 underline hover:text-slate-900">
          ← Back to dashboard
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="font-semibold">Could not load project {id}</p>
          <p className="mt-1">{error}</p>
          <p className="mt-3 text-xs text-red-600">
            This view needs the live API — start it with{" "}
            <code>uvicorn app.main:app --reload --port 8000</code>.
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  const openLitigation = project.litigations.filter((l) => l.status === "pending");

  return (
    <div className="space-y-5">
      <Link href="/" className="inline-block text-sm text-slate-600 underline hover:text-slate-900">
        ← Back to dashboard
      </Link>

      {/* Header — risk never appears without a path to "why" (Design Brief §1) */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{project.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {project.location} · {project.sector} · ID #{project.project_id}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
                Stage <span className="font-mono font-semibold">{project.current_stage}</span>
              </span>
              <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
                {project.paf_count ?? "—"} PAFs
              </span>
              <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
                {project.area != null ? `${project.area} ha` : "—"}
              </span>
              <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
                Opened {formatDate(project.created_at)}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <RiskBadge level={project.prediction.risk_class} probability={project.prediction.probability} />
            <span className="text-[11px] text-slate-400">{project.prediction.model_version}</span>
            <FlagButton projectId={project.project_id} prediction={project.prediction} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <StageTracker history={project.stage_history} currentStage={project.current_stage} />
        <div className="space-y-5">
          <FactorPanel prediction={project.prediction} />
          <WhatIfPanel projectId={project.project_id} baseline={project.current_features} />
        </div>
      </div>

      {/* Supporting records */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Litigation{" "}
            <span className="font-normal text-slate-500">
              ({openLitigation.length} open of {project.litigations.length})
            </span>
          </h2>
          {project.litigations.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">No litigation recorded.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {project.litigations.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-slate-700">{l.type ?? "Unspecified"}</span>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                      l.status === "pending"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-teal-100 text-teal-800"
                    }`}
                  >
                    {l.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Compensation</h2>
          {project.compensation_records.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">No compensation recorded.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {project.compensation_records.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-slate-700">{c.compensation_pct}% disbursed</span>
                  <span className="text-xs text-slate-500">{formatDate(c.updated_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
