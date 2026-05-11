"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { DIVISION_NAMES, DIVISION_COLORS, type MatchStatus } from "@/lib/constants";

type ScheduleMatch = {
  id: number;
  division: number;
  matchday: number | null;
  homeSets: number | null;
  awaySets: number | null;
  status: MatchStatus;
  homeTeam: { name: string; logoUrl: string | null };
  awayTeam: { name: string; logoUrl: string | null };
};

type LeagueScheduleProps = {
  matches: ScheduleMatch[];
  teamCounts: Record<number, number>;
};

function regularRounds(teamCount: number) {
  if (teamCount <= 1) return 1;
  const evenCount = teamCount % 2 === 0 ? teamCount : teamCount + 1;
  return evenCount - 1;
}

function TeamLogo({ src, name }: { src: string | null; name: string }) {
  return (
    <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10">
      {src ? <Image alt={name} className="object-cover" fill sizes="28px" src={src} /> : null}
    </span>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-250 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
    </svg>
  );
}

function MatchRow({ match }: { match: ScheduleMatch }) {
  const homeWon = match.status === "played" && (match.homeSets ?? 0) > (match.awaySets ?? 0);
  const awayWon = match.status === "played" && (match.awaySets ?? 0) > (match.homeSets ?? 0);

  return (
    <article className="rounded-xl border border-white/8 bg-black/20 p-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <p className={`flex min-w-0 items-center gap-2 ${homeWon ? "text-emerald-300" : "text-white"}`}>
          <TeamLogo name={match.homeTeam.name} src={match.homeTeam.logoUrl} />
          <span className="min-w-0 truncate text-sm font-semibold">{match.homeTeam.name}</span>
        </p>
        <p className="text-center text-xl font-black tabular-nums text-amber-300">
          {match.homeSets ?? "-"}:{match.awaySets ?? "-"}
        </p>
        <p className={`flex min-w-0 items-center justify-end gap-2 ${awayWon ? "text-emerald-300" : "text-white"}`}>
          <span className="min-w-0 truncate text-right text-sm font-semibold">{match.awayTeam.name}</span>
          <TeamLogo name={match.awayTeam.name} src={match.awayTeam.logoUrl} />
        </p>
      </div>
      <div className="mt-2 flex justify-center">
        <StatusBadge status={match.status} />
      </div>
    </article>
  );
}

function MatchdayCard({ title, rows }: { title: string; rows: ScheduleMatch[] }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
      <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-amber-300">{title}</h4>
      <div className="space-y-2">
        {rows.length ? (
          rows.map((match) => <MatchRow key={match.id} match={match} />)
        ) : (
          <p className="py-3 text-center text-sm text-slate-600">Sin partidos.</p>
        )}
      </div>
    </div>
  );
}

type AccordionItemProps = {
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

function AccordionItem({ title, subtitle, defaultOpen = false, children }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
      <button
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/4"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-black text-slate-100">{title}</span>
          <span className="text-sm font-medium text-slate-600">{subtitle}</span>
        </div>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="grid gap-4 p-4 pt-0 2xl:grid-cols-2">
          {children}
        </div>
      )}
    </div>
  );
}

export function LeagueSchedule({ matches, teamCounts }: LeagueScheduleProps) {
  const [division, setDivision] = useState(1);
  const divisionMatches = useMemo(
    () => matches.filter((match) => match.division === division),
    [matches, division],
  );
  const rounds = regularRounds(teamCounts[division] ?? 0);
  const firstLegDays = Array.from({ length: rounds }, (_, i) => i + 1);

  return (
    <section className="glass mt-10 rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-amber-300">Jornadas</h2>
          <p className="mt-1 text-sm text-slate-400">
            Selecciona división y despliega cada par ida/vuelta.
          </p>
        </div>
        <div className="flex rounded-full border border-white/10 bg-black/20 p-1">
          {[1, 2, 3].map((item) => (
            <button
              className={`rounded-full px-4 py-2 text-sm font-black transition-colors ${
                division === item
                  ? `${DIVISION_COLORS[item].badgeBg} ${DIVISION_COLORS[item].badgeText}`
                  : "text-slate-400 hover:bg-white/8 hover:text-white"
              }`}
              key={item}
              onClick={() => setDivision(item)}
              type="button"
            >
              {DIVISION_NAMES[item]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {firstLegDays.map((day, index) => {
          const returnDay = day + rounds;
          const firstLeg = divisionMatches.filter((m) => m.matchday === day);
          const secondLeg = divisionMatches.filter((m) => m.matchday === returnDay);

          return (
            <AccordionItem
              defaultOpen={index === 0}
              key={day}
              subtitle="ida y vuelta"
              title={`Jornada ${day} / ${returnDay}`}
            >
              <MatchdayCard rows={firstLeg} title={`Ida · Jornada ${day}`} />
              <MatchdayCard rows={secondLeg} title={`Vuelta · Jornada ${returnDay}`} />
            </AccordionItem>
          );
        })}
      </div>
    </section>
  );
}
