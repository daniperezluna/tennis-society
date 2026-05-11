import { STATUS_LABELS, type MatchStatus } from "@/lib/constants";

export function StatusBadge({ status }: { status: MatchStatus }) {
  const className =
    status === "played"
      ? "bg-emerald-400/15 text-emerald-200 ring-emerald-300/35"
      : status === "walkover"
        ? "bg-rose-400/15 text-rose-200 ring-rose-300/35"
        : "bg-amber-400/15 text-amber-200 ring-amber-300/35";

  return (
    <span className={`inline-flex min-w-24 items-center justify-center rounded-full px-3 py-1 text-center text-sm font-bold ring-1 ${className}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
