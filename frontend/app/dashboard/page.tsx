"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardStats } from "@/components/DashboardStats";
import { HighRiskTable } from "@/components/HighRiskTable";
import { PhotoFrame } from "@/components/PhotoFrame";
import { ProjectCard } from "@/components/ProjectCard";
import { RiskOverview } from "@/components/RiskOverview";
import { RISK_ORDER } from "@/components/RiskBadge";
import { IMAGES } from "@/lib/assets";
import { fetchProjects } from "@/lib/api";
import type { Project } from "@/lib/types";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [source, setSource] = useState<"api" | "mock" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProjects()
      .then(({ projects, source }) => {
        if (cancelled) return;
        setProjects(projects);
        setSource(source);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  const ranked = useMemo(() => {
    if (!projects) return [];
    return [...projects].sort(
      (a, b) =>
        RISK_ORDER[b.prediction.risk_class] - RISK_ORDER[a.prediction.risk_class] ||
        b.prediction.probability - a.prediction.probability
    );
  }, [projects]);

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-card border border-risk-critical/30 bg-risk-criticalBg p-6 text-sm text-risk-critical">
          <p className="font-semibold">Could not load the portfolio</p>
          <p className="mt-1">{error}</p>
          <p className="mt-3 text-xs opacity-80">
            The monitoring API is not responding. Start it with{" "}
            <code className="rounded bg-cream-surface px-1 py-0.5">
              uvicorn app.main:app --port 8000
            </code>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* ---------- Hero ---------- */}
      <PhotoFrame slot={IMAGES.dashboardHero} drawnScale="h-56">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
          <p className="lw-rise lw-d1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
            Ministry of Road Transport &amp; Highways · Prototype
          </p>
          <h1 className="lw-rise lw-d2 mt-4 max-w-2xl text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl">
            Transparent land acquisition.
            <br />
            Timely infrastructure.
          </h1>
          <p className="lw-rise lw-d3 mt-4 max-w-xl text-sm leading-relaxed text-white/75">
            Real-time monitoring and AI-driven insights for delay risk prediction and
            decision support across National Highway acquisition.
          </p>
          <div className="lw-rise lw-d4 mt-7 flex flex-wrap gap-3">
            <Link
              href="/projects"
              className="rounded bg-cream-surface px-5 py-2.5 text-sm font-semibold text-forest-800 transition-colors hover:bg-white"
            >
              View projects
            </Link>
            <Link
              href="/map"
              className="rounded border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Map view
            </Link>
          </div>
        </div>
      </PhotoFrame>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-7">
        {/* Provenance — stated once, near the numbers it qualifies */}
        <p className="flex flex-wrap items-center gap-2 text-[11px] text-ink-3">
          <span className="inline-flex items-center gap-1.5 rounded bg-risk-mediumBg px-2 py-1 font-medium text-risk-medium ring-1 ring-risk-medium/20">
            <span className="h-1.5 w-1.5 rounded-full bg-risk-medium" />
            Synthetic data
          </span>
          <span>
            {source === "api" ? "Live monitoring API" : "Offline sample"} · figures below are
            computed from the projects on record, not illustrative placeholders.
          </span>
        </p>

        {projects === null ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-card bg-cream-deep" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-card bg-cream-deep" />
          </div>
        ) : (
          <>
            <DashboardStats projects={projects} />

            <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
              <RiskOverview projects={projects} />
              <HighRiskTable projects={projects} />
            </div>

            {/* ---------- Prediction banner ---------- */}
            <PhotoFrame slot={IMAGES.predictionBanner} className="rounded-card" drawnScale="h-48">
              <div className="flex flex-col gap-5 px-7 py-10 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
                    Decision support
                  </p>
                  <h2 className="mt-2.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
                    AI-powered delay risk prediction
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">
                    Identify potential delays early and take proactive action to keep
                    infrastructure projects on track. Every prediction shows the factors
                    behind it and the officer who owns the response.
                  </p>
                </div>
                <Link
                  href="/projects/new"
                  className="shrink-0 self-start rounded bg-cream-surface px-5 py-2.5 text-sm font-semibold text-forest-800 transition-colors hover:bg-white md:self-auto"
                >
                  Analyse a new site →
                </Link>
              </div>
            </PhotoFrame>

            {/* ---------- Full portfolio ---------- */}
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold text-ink">Portfolio</h2>
                <Link
                  href="/projects"
                  className="text-xs font-semibold text-forest-600 hover:underline"
                >
                  Filter and sort →
                </Link>
              </div>
              <div className="mt-3 grid gap-4 xl:grid-cols-2">
                {ranked.slice(0, 4).map((p) => (
                  <ProjectCard key={p.project_id} project={p} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
