/** Which vertical column an event renders in. */
export type Category = "cultural" | "biological" | "geological";

/**
 * Display resolution of an event's time. Drives BOTH the formatted string and
 * the implied uncertainty band. The stored numeric value is always a full
 * astronomical year (see {@link DtlEvent.startYear}); precision only governs how
 * much of it is meaningful / how it is rendered.
 */
export type TimePrecision =
  | "mya" // millions of years ago
  | "kya" // thousands of years ago
  | "century"
  | "decade"
  | "year"
  | "date" // year-month-day
  | "datetime"; // year-month-day + time of day

/** A link to further information about an event. */
export interface EventLink {
  label: string;
  url: string;
}

/**
 * One timeline event. Times use astronomical year numbering: year 0 = 1 BCE,
 * negative = BCE. `startYear` may be a large negative float for deep time
 * (e.g. Earth's formation ≈ -4.54e9). Sub-year fields are only present for
 * high-resolution events (precision "date" / "datetime").
 */
export interface DtlEvent {
  id: string;
  name: string;
  category: Category;

  startYear: number;
  startMonth?: number; // 1-12
  startDay?: number; // 1-31
  startTime?: string; // "HH:MM" (UTC), only with precision "datetime"

  /** null/undefined end => point event; otherwise a range. */
  endYear?: number | null;
  endMonth?: number;
  endDay?: number;
  endTime?: string;

  precision: TimePrecision;
  /** Importance tier; lower = more significant. Maps to a min zoom level. */
  importance: number;

  tags?: string[];
  descriptionMd?: string;
  links?: EventLink[];

  imageUrl?: string;
  source?: string;
  sourceDataset?: string;
  confidence?: number; // 0-1
  disputed?: boolean;
}

/** Rank in the geological time scale hierarchy, coarse → fine. */
export type GtsRank = "eon" | "era" | "period" | "epoch" | "age";

/** One interval of the International Chronostratigraphic Chart. */
export interface GtsInterval {
  id: string;
  name: string;
  rank: GtsRank;
  /** Older boundary, in millions of years ago. */
  startMa: number;
  /** Younger boundary, in millions of years ago (0 = present). */
  endMa: number;
  parentId: string | null;
  /** ICS color, hex string. */
  color: string;
  /** Link to the span's reference article (e.g. Wikipedia). */
  url?: string;
}

/** Top-level shape of the published static JSON artifacts. */
export interface EventsArtifact {
  version: number;
  events: DtlEvent[];
}

export interface GtsArtifact {
  version: number;
  intervals: GtsInterval[];
}
