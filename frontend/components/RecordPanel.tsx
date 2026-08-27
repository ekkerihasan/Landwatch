"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  addCompensation,
  addLitigation,
  advanceStage,
  deleteProject,
  updateLitigation,
} from "@/lib/api";
import type { ProjectDetail } from "@/lib/types";

const STAGES = ["3A", "3C", "3D", "3G", "3H", "3E"];

/**
 * Recording real progress against a project. Every action here changes the inputs the
 * model reads, so the risk score moves as a consequence — that is the point of it.
 */
export function RecordPanel({ project }: { project: ProjectDetail }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const currentIndex = STAGES.indexOf(project.current_stage);
  const nextStage = currentIndex >= 0 && currentIndex < STAGES.length - 1 ? STAGES[currentIndex + 1] : null;

  const latestCompensation = project.compensation_records.length
    ? [...project.compensation_records].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0].compensation_pct
    : 0;
  const [compensation, setCompensation] = useState(latestCompensation);
  const [caseType, setCaseType] = useState("Title dispute");

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      router.refresh();
      // The detail page fetches client-side, so a refresh alone won't re-run it.
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  }

  const btn =
    "rounded border border-line px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-cream-alt disabled:cursor-not-allowed disabled:opacity-50";
  const openCases = project.litigations.filter((l) => l.status === "pending");

  return (
    <div className="rounded-card border bg-cream-surface p-5 shadow-card">
      <h2 className="text-sm font-semibold text-ink">Record progress</h2>
      <p className="mt-0.5 text-xs text-ink-3">
        Updating these changes what the model sees, so the risk score responds.
      </p>

      {error && (
        <p className="mt-3 rounded border border-risk-critical/30 bg-risk-criticalBg p-2.5 text-xs text-risk-critical">
          {error}
        </p>
      )}

      <div className="mt-4 space-y-4">
        {/* Stage */}
        <div className="border-t pt-3.5">
          <p className="text-xs font-semibold text-ink-2">Legal stage</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-forest-800 px-2 py-1 font-mono text-xs font-semibold text-cream-surface">
              {project.current_stage}
            </span>
            {nextStage ? (
              <button
                className={btn}
                disabled={busy !== null}
                onClick={() => run("stage", () => advanceStage(project.project_id, nextStage))}
              >
                {busy === "stage" ? "Advancing…" : `Advance to ${nextStage} →`}
              </button>
            ) : (
              <span className="text-xs text-ink-3">Final stage reached</span>
            )}
          </div>
        </div>

        {/* Compensation */}
        <div className="border-t pt-3.5">
          <label className="text-xs font-semibold text-ink-2" htmlFor="comp-input">
            Compensation disbursed
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              id="comp-input"
              type="number"
              min={0}
              max={100}
              value={compensation}
              onChange={(e) => setCompensation(Number(e.target.value))}
              className="w-24 rounded border border-line px-2 py-1.5 text-sm text-ink"
            />
            <span className="text-xs text-ink-3">%</span>
            <button
              className={btn}
              disabled={busy !== null || compensation === latestCompensation}
              onClick={() => run("comp", () => addCompensation(project.project_id, compensation))}
            >
              {busy === "comp" ? "Recording…" : "Record reading"}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-ink-3">
            {project.compensation_records.length
              ? `Currently ${latestCompensation}%. Each reading is appended, not overwritten.`
              : "No reading recorded yet — the model is using a neutral assumption."}
          </p>
        </div>

        {/* Litigation */}
        <div className="border-t pt-3.5">
          <p className="text-xs font-semibold text-ink-2">
            Litigation{" "}
            <span className="font-normal text-ink-3">({openCases.length} open)</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              value={caseType}
              onChange={(e) => setCaseType(e.target.value)}
              className="rounded border border-line px-2 py-1.5 text-xs text-ink"
            >
              <option>Title dispute</option>
              <option>Compensation dispute</option>
              <option>Valuation challenge</option>
              <option>Rehabilitation claim</option>
            </select>
            <button
              className={btn}
              disabled={busy !== null}
              onClick={() => run("lit", () => addLitigation(project.project_id, caseType))}
            >
              {busy === "lit" ? "Filing…" : "File case"}
            </button>
          </div>

          {openCases.length > 0 && (
            <ul className="mt-2.5 space-y-1.5">
              {openCases.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-ink-2">{l.type ?? "Unspecified"}</span>
                  <button
                    className={btn}
                    disabled={busy !== null}
                    onClick={() =>
                      run(`res-${l.id}`, () =>
                        updateLitigation(project.project_id, l.id, "resolved")
                      )
                    }
                  >
                    {busy === `res-${l.id}` ? "…" : "Mark resolved"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Destructive — behind an explicit confirmation, per Design Brief §4 */}
        <div className="border-t pt-3.5">
          {confirmDelete ? (
            <div className="rounded border border-risk-critical/30 bg-risk-criticalBg p-3">
              <p className="text-xs font-semibold text-risk-critical">
                Delete {project.name} permanently?
              </p>
              <p className="mt-1 text-[11px] text-risk-critical">
                Its stage history, litigation, compensation records, predictions and flags are
                deleted with it. This cannot be undone.
              </p>
              <div className="mt-2.5 flex gap-2">
                <button
                  className="rounded bg-risk-critical px-3 py-1.5 text-xs font-semibold text-cream-surface hover:bg-risk-critical disabled:opacity-50"
                  disabled={busy !== null}
                  onClick={async () => {
                    setBusy("del");
                    setError(null);
                    try {
                      await deleteProject(project.project_id);
                      window.location.href = "/dashboard";
                    } catch (e) {
                      setError(e instanceof Error ? e.message : String(e));
                      setBusy(null);
                    }
                  }}
                >
                  {busy === "del" ? "Deleting…" : "Delete permanently"}
                </button>
                <button className={btn} onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="text-xs font-medium text-risk-critical hover:underline"
              onClick={() => setConfirmDelete(true)}
            >
              Delete this project
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
