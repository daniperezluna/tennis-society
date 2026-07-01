"use client";

import { useFormStatus } from "react-dom";

export function PredictionScoreButton({
  score,
  active,
}: {
  score: string;
  active: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums transition-colors ${
        active
          ? "bg-ball-500 text-court-950"
          : "bg-white/8 text-slate-300 hover:bg-white/14"
      } ${pending ? "opacity-60" : ""}`}
      disabled={pending}
      type="submit"
    >
      {pending && active ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {score}
        </span>
      ) : (
        score
      )}
    </button>
  );
}
