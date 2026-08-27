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
      <span className="inline-flex items-center gap-1.5 rounded border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800">
        ✓ Flagged for review
      </span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Flag for review
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">Flag this project for investigation?</p>
      <p className="mt-1 text-xs text-slate-600">
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
        className="mt-3 w-full rounded border border-slate-200 p-2 text-sm text-slate-900 placeholder:text-slate-400"
      />
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          onClick={confirm}
          disabled={busy}
          className="rounded bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-300"
        >
          {busy ? "Flagging…" : "Confirm flag"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
