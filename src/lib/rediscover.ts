// Rediscovery: which memories to bring back, computed from plain rows (no I/O, easy to test).

export type MemoryLite = {
  id: number;
  jarId: number;
  cover: string;
  title: string | null;
  memoryDate: number;
  createdAt: number;
  lastOpenedAt: number | null;
};

const DAY = 86_400_000;

const sameCalendarDay = (a: Date, b: Date) => a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Memories from this calendar day in earlier years, most recent year first. */
export function onThisDay(rows: MemoryLite[], now: number): MemoryLite[] {
  const today = new Date(now);
  return rows
    .filter((r) => {
      const d = new Date(r.memoryDate);
      return d.getFullYear() < today.getFullYear() && sameCalendarDay(d, today);
    })
    .sort((a, b) => b.memoryDate - a.memoryDate);
}

/** Memories within ±3 days of today's date in earlier years (excluding exact "on this day" matches). */
export function thisWeekInPastYears(rows: MemoryLite[], now: number): MemoryLite[] {
  const today = new Date(now);
  return rows
    .filter((r) => {
      const d = new Date(r.memoryDate);
      if (now - r.memoryDate < 300 * DAY || sameCalendarDay(d, today)) return false; // "past years" only
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      // Today's month/day in the memory's year and its neighbours, so late Dec ↔ early Jan still match.
      return [-1, 0, 1].some((k) => {
        const anchor = new Date(d.getFullYear() + k, today.getMonth(), today.getDate()).getTime();
        return Math.abs(Math.round((day - anchor) / DAY)) <= 3;
      });
    })
    .sort((a, b) => b.memoryDate - a.memoryDate);
}

/**
 * "Remember this?": one memory saved at least a week ago, preferring the ones opened least recently.
 * Stable for the whole day, so the card doesn't change every time Home is shown.
 */
export function rememberThis(rows: MemoryLite[], now: number): MemoryLite | null {
  const candidates = rows.filter((r) => r.createdAt <= now - 7 * DAY);
  if (!candidates.length) return null;
  const day = Math.floor(now / DAY);
  const staleness = (r: MemoryLite) => r.lastOpenedAt ?? 0;
  const seed = (r: MemoryLite) => (r.id * 7919 + day * 104729) % 1009;
  // Among the least-recently-opened third, pick by daily seed so it rotates.
  const sorted = [...candidates].sort((a, b) => staleness(a) - staleness(b) || a.id - b.id);
  const pool = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 3)));
  return pool.reduce((best, r) => (seed(r) > seed(best) ? r : best));
}

/** Whole years between the memory and now (for "2 years ago"). */
export function yearsAgo(memoryDate: number, now: number) {
  return new Date(now).getFullYear() - new Date(memoryDate).getFullYear();
}

export type Recap = {
  year: number;
  count: number;
  jarCount: number;
  topJarId: number | null;
  months: number[]; // memories per month, Jan..Dec
  busiestMonth: number | null; // 0-11
  memories: MemoryLite[]; // oldest first
};

export function recap(rows: MemoryLite[], year: number): Recap {
  const memories = rows
    .filter((r) => new Date(r.memoryDate).getFullYear() === year)
    .sort((a, b) => a.memoryDate - b.memoryDate || a.id - b.id);
  const months = Array(12).fill(0) as number[];
  const perJar = new Map<number, number>();
  for (const m of memories) {
    months[new Date(m.memoryDate).getMonth()]++;
    perJar.set(m.jarId, (perJar.get(m.jarId) ?? 0) + 1);
  }
  let topJarId: number | null = null;
  for (const [jar, n] of perJar) if (topJarId === null || n > (perJar.get(topJarId) ?? 0)) topJarId = jar;
  const max = Math.max(...months);
  return {
    year,
    count: memories.length,
    jarCount: perJar.size,
    topJarId,
    months,
    busiestMonth: max > 0 ? months.indexOf(max) : null,
    memories,
  };
}

/** Years that have memories, newest first. */
export function recapYears(rows: MemoryLite[]): number[] {
  return [...new Set(rows.map((r) => new Date(r.memoryDate).getFullYear()))].sort((a, b) => b - a);
}

/** Recap is promoted on Home from Dec 15 to Jan 31 (for the year that just ended / is ending). */
export function recapSeasonYear(now: number): number | null {
  const d = new Date(now);
  if (d.getMonth() === 11 && d.getDate() >= 15) return d.getFullYear();
  if (d.getMonth() === 0) return d.getFullYear() - 1;
  return null;
}
