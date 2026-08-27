"use client";

import { useState } from "react";
import { flagProject } from "@/lib/api";
import type { Prediction } from "@/lib/types";

/**
 * Officer flags a project for investigation (PRD §6).
 * Design Brief §4: officer actions always require an explicit confirmation step —
 * no silent automated action.
 */
export function FlagButton({
  projectId,
  prediction,
}: {
  projectId: number;
  prediction: Prediction;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await flagProject(projectId, note);
      setDone(true);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-risk-low/30 bg-risk-lowBg px-3 py-2 text-sm font-medium text-risk-low">
        ✓ Flagged for review
      </span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded border border-line px-3.5 py-2 text-sm font-medium text-ink-2 hover:bg-cream-alt"
      >
        Flag for review
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-line bg-cream-surface p-4 shadow-card">
      <p className="text-sm font-semibold text-ink">Flag this project for investigation?</p>
      <p className="mt-1 text-xs text-ink-2">
        The current rationale is attached automatically:{" "}
        <strong>
          {prediction.risk_class} ({Math.round(prediction.probability * 100)}%)
        </strong>
        , top factor <strong>{prediction.factors[0]?.explanation}</strong>.
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Optional note for the reviewing officer…"
        className="mt-3 w-full rounded border border-line p-2 text-sm text-ink placeholder:text-ink-3"
      />
      {error && <p className="mt-2 text-xs text-risk-critical">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          onClick={confirm}
          disabled={busy}
          className="rounded bg-forest-800 px-3.5 py-2 text-sm font-medium text-cream-surface hover:bg-forest-700 disabled:bg-line"
        >
          {busy ? "Flagging…" : "Confirm flag"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded border border-line px-3.5 py-2 text-sm font-medium text-ink-2 hover:bg-cream-alt"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
