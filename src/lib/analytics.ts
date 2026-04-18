import type {
  AppStatus,
  ApplicationRow,
  InterviewRow,
  OfferRow,
  StatusHistoryRow,
} from "@/types/database";

export type DateRange = "30d" | "60d" | "90d" | "all";

const GHOST_DAYS = 21;

export function rangeToCutoff(range: DateRange): Date | null {
  if (range === "all") return null;
  const days = range === "30d" ? 30 : range === "60d" ? 60 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export function filterApplicationsByRange<T extends Pick<ApplicationRow, "applied_at" | "created_at">>(
  apps: T[],
  range: DateRange,
): T[] {
  const cutoff = rangeToCutoff(range);
  if (!cutoff) return apps;
  return apps.filter((a) => {
    const d = new Date(a.applied_at ?? a.created_at);
    return d >= cutoff;
  });
}

export type FunnelStage = {
  label: string;
  count: number;
  rateFromPrevious: number | null;
  rateFromTop: number | null;
};

const STATUS_RANK: Record<AppStatus, number> = {
  saved: 0,
  applied: 1,
  screening: 2,
  interview: 3,
  offer: 4,
  accepted: 5,
  // Terminal non-advance states default to their current rank. Rejection stage
  // is used to infer how far they actually got.
  rejected: 0,
  withdrawn: 0,
  ghosted: 1,
};

const REJECTION_STAGE_RANK: Record<string, number> = {
  no_response: 1,
  after_screen: 2,
  after_tech: 3,
  after_onsite: 3,
  after_offer: 4,
  after_withdraw: 1,
};

function maxReachedRank(app: ApplicationRow): number {
  const base = STATUS_RANK[app.status] ?? 0;
  if ((app.status === "rejected" || app.status === "withdrawn") && app.rejection_stage) {
    return Math.max(base, REJECTION_STAGE_RANK[app.rejection_stage] ?? 0);
  }
  return base;
}

export function computeFunnel(apps: ApplicationRow[]): FunnelStage[] {
  const applied = apps.filter((a) => maxReachedRank(a) >= 1).length;
  const screen = apps.filter((a) => maxReachedRank(a) >= 2).length;
  const interview = apps.filter((a) => maxReachedRank(a) >= 3).length;
  const offer = apps.filter((a) => maxReachedRank(a) >= 4).length;
  const accepted = apps.filter((a) => a.status === "accepted").length;

  const stages = [
    { label: "Applied", count: applied },
    { label: "Screen", count: screen },
    { label: "Interview", count: interview },
    { label: "Offer", count: offer },
    { label: "Accepted", count: accepted },
  ];

  const top = stages[0].count || 0;
  return stages.map((s, i) => {
    const prev = i === 0 ? null : stages[i - 1].count;
    return {
      ...s,
      rateFromPrevious: prev && prev > 0 ? s.count / prev : null,
      rateFromTop: top > 0 ? s.count / top : null,
    };
  });
}

export type ActivityPoint = {
  weekStart: Date;
  label: string;
  count: number;
};

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  const day = out.getDay();
  const diff = (day + 6) % 7; // Monday = 0
  out.setDate(out.getDate() - diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function computeActivity(
  apps: ApplicationRow[],
  range: DateRange,
): ActivityPoint[] {
  const cutoff = rangeToCutoff(range) ?? new Date(0);
  const buckets = new Map<string, ActivityPoint>();

  // Seed the last N weeks so the chart shows continuous bars even when zero
  const weeks = range === "30d" ? 5 : range === "60d" ? 9 : range === "90d" ? 13 : 26;
  const now = startOfWeek(new Date());
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, {
      weekStart: d,
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: 0,
    });
  }

  for (const a of apps) {
    const d = new Date(a.applied_at ?? a.created_at);
    if (d < cutoff) continue;
    const w = startOfWeek(d);
    const key = w.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) bucket.count += 1;
  }

  return [...buckets.values()].sort(
    (a, b) => a.weekStart.getTime() - b.weekStart.getTime(),
  );
}

export type SourceRow = {
  source: string;
  total: number;
  reachedInterview: number;
  offers: number;
  interviewRate: number;
  offerRate: number;
};

export function computeSourceEffectiveness(
  apps: ApplicationRow[],
): SourceRow[] {
  const groups = new Map<string, ApplicationRow[]>();
  for (const a of apps) {
    const key = a.source ?? "unspecified";
    const list = groups.get(key) ?? [];
    list.push(a);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .map(([source, list]) => {
      const reachedInterview = list.filter((a) => maxReachedRank(a) >= 3).length;
      const offers = list.filter((a) => maxReachedRank(a) >= 4).length;
      return {
        source,
        total: list.length,
        reachedInterview,
        offers,
        interviewRate: list.length > 0 ? reachedInterview / list.length : 0,
        offerRate: list.length > 0 ? offers / list.length : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export type RejectionBreakdown = {
  stage: string;
  count: number;
};

export function computeRejectionBreakdown(
  apps: ApplicationRow[],
): RejectionBreakdown[] {
  const groups = new Map<string, number>();
  for (const a of apps) {
    if (a.status !== "rejected" && a.status !== "ghosted") continue;
    const key = a.rejection_stage ?? (a.status === "ghosted" ? "ghosted" : "unspecified");
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  return [...groups.entries()]
    .map(([stage, count]) => ({ stage: stage.replaceAll("_", " "), count }))
    .sort((a, b) => b.count - a.count);
}

export function computeResponseMetrics(
  apps: ApplicationRow[],
  history: StatusHistoryRow[],
): { medianDays: number | null; ghostRate: number; ghosted: number; pendingResponse: number } {
  const firstResponse = new Map<string, number>();
  for (const h of history) {
    if (h.from_status === "applied" && h.to_status !== "applied") {
      const existing = firstResponse.get(h.application_id);
      const t = new Date(h.changed_at).getTime();
      if (existing === undefined || t < existing) firstResponse.set(h.application_id, t);
    }
  }

  const diffsDays: number[] = [];
  for (const a of apps) {
    if (!a.applied_at) continue;
    const r = firstResponse.get(a.id);
    if (r === undefined) continue;
    const appliedMs = new Date(a.applied_at).getTime();
    diffsDays.push(Math.max(0, (r - appliedMs) / (1000 * 60 * 60 * 24)));
  }

  diffsDays.sort((a, b) => a - b);
  const median = diffsDays.length === 0 ? null : diffsDays[Math.floor(diffsDays.length / 2)];

  const cutoff = Date.now() - GHOST_DAYS * 24 * 60 * 60 * 1000;
  const appliedApps = apps.filter((a) => a.status === "applied" && a.applied_at);
  const ghosted = appliedApps.filter(
    (a) => new Date(a.applied_at!).getTime() < cutoff,
  ).length;
  const pendingResponse = appliedApps.length - ghosted;

  return {
    medianDays: median,
    ghostRate: appliedApps.length > 0 ? ghosted / appliedApps.length : 0,
    ghosted,
    pendingResponse,
  };
}

export type KpiSummary = {
  activeCount: number;
  interviewsThisWeek: number;
  pendingOffers: number;
  responseRate: number;
};

export function computeKpis(
  apps: ApplicationRow[],
  interviews: InterviewRow[],
  offers: OfferRow[],
  history: StatusHistoryRow[],
): KpiSummary {
  const active = apps.filter(
    (a) =>
      !a.archived_at &&
      !a.deleted_at &&
      !["rejected", "withdrawn", "accepted", "ghosted"].includes(a.status),
  ).length;

  const now = new Date();
  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const interviewsThisWeek = interviews.filter((iv) => {
    if (!iv.scheduled_at) return false;
    const d = new Date(iv.scheduled_at);
    return d >= now && d <= weekAhead;
  }).length;

  const pendingOffers = offers.filter(
    (o) => o.decision === "pending" || o.decision === "negotiating",
  ).length;

  // Response rate: of applications that were ever "applied", what share got past applied?
  const appliedIds = new Set<string>();
  const movedIds = new Set<string>();
  for (const h of history) {
    if (h.to_status === "applied") appliedIds.add(h.application_id);
    if (h.from_status === "applied") movedIds.add(h.application_id);
  }
  const responseRate =
    appliedIds.size > 0 ? movedIds.size / appliedIds.size : 0;

  return { activeCount: active, interviewsThisWeek, pendingOffers, responseRate };
}

export function formatPercent(n: number): string {
  return `${Math.round(n * 100)}%`;
}
