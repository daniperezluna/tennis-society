export const MATCH_STATUSES = ["pending", "played", "walkover"] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const CUP_ROUNDS = ["roundOf64", "roundOf32", "roundOf16", "quarterfinal", "semifinal", "final"] as const;
export type CupRound = (typeof CUP_ROUNDS)[number];

export const CUP_ROUND_LABELS: Record<CupRound, string> = {
  roundOf64: "Treintaidosavos",
  roundOf32: "Dieciseisavos",
  roundOf16: "Octavos",
  quarterfinal: "Cuartos",
  semifinal: "Semifinales",
  final: "Final",
};

export const CUP_ROUND_ORDER: Record<CupRound, number> = {
  roundOf64: 1,
  roundOf32: 2,
  roundOf16: 3,
  quarterfinal: 4,
  semifinal: 5,
  final: 6,
};

export const DIVISION_NAMES: Record<number, string> = {
  1: "Hierba",
  2: "Arcilla",
  3: "Dura",
};

export const DIVISION_COLORS: Record<number, {
  text: string;
  badgeBg: string;
  badgeText: string;
  border: string;
  rankGold: string;
  rankSilver: string;
  rankBronze: string;
}> = {
  1: {
    text: "text-emerald-400",
    badgeBg: "bg-emerald-500",
    badgeText: "text-emerald-950",
    border: "border-emerald-400/40",
    rankGold: "border-l-emerald-400",
    rankSilver: "border-l-emerald-200",
    rankBronze: "border-l-emerald-700",
  },
  2: {
    text: "text-orange-400",
    badgeBg: "bg-orange-500",
    badgeText: "text-orange-950",
    border: "border-orange-400/40",
    rankGold: "border-l-orange-400",
    rankSilver: "border-l-orange-200",
    rankBronze: "border-l-orange-700",
  },
  3: {
    text: "text-sky-400",
    badgeBg: "bg-sky-500",
    badgeText: "text-sky-950",
    border: "border-sky-400/40",
    rankGold: "border-l-sky-400",
    rankSilver: "border-l-sky-200",
    rankBronze: "border-l-sky-700",
  },
};

export const STATUS_LABELS: Record<MatchStatus, string> = {
  pending: "Pendiente",
  played: "Jugado",
  walkover: "W/O",
};
