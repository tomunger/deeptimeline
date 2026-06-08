import type { DtlEvent } from "@dtl/shared";

export interface SearchResult {
  event: DtlEvent;
  score: number;
}

/**
 * Lightweight ranked search over the loaded events. At this dataset size a
 * dependency-free token matcher is plenty: every query token must appear in the
 * event (AND), and matches in the name outweigh tags, which outweigh the
 * description. If this ever needs typo tolerance / large scale, swap in a real
 * index (MiniSearch/FlexSearch) behind this same signature.
 */
export function searchEvents(
  events: DtlEvent[],
  query: string,
  limit = 20,
): SearchResult[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const results: SearchResult[] = [];
  for (const event of events) {
    const name = event.name.toLowerCase();
    const tags = (event.tags ?? []).join(" ").toLowerCase();
    const desc = (event.descriptionMd ?? "").toLowerCase();

    let score = 0;
    let allMatch = true;
    for (const t of tokens) {
      let s = 0;
      if (name.includes(t)) s += name.startsWith(t) ? 12 : 8;
      if (tags.includes(t)) s += 5;
      if (desc.includes(t)) s += 2;
      if (s === 0) {
        allMatch = false;
        break;
      }
      score += s;
    }
    if (allMatch) results.push({ event, score });
  }

  results.sort(
    (a, b) => b.score - a.score || a.event.name.localeCompare(b.event.name),
  );
  return results.slice(0, limit);
}
