import type { DtlEvent, TimePrecision } from "./types.js";

/**
 * Time model for the deep timeline.
 *
 * The whole app positions things on a single continuous axis measured in
 * **years before present (BP)**: 0 = present, increasing into the past. The top
 * of the timeline is Earth's formation; the bottom is the present.
 *
 * Astronomical year numbering is used everywhere a calendar year appears:
 * year 0 = 1 BCE, negative = BCE. float64 represents billions of years at ≥1yr
 * precision and recent calendar dates at sub-second precision, so one axis
 * covers the entire range.
 */

/** Reference "present" year. Fixed for deterministic positioning/formatting. */
export const PRESENT_YEAR = 2026;

/** Earth's formation, in millions of years ago. Top of the timeline. */
export const EARTH_FORMATION_MA = 4540;

/** Total span of the timeline, in years before present. */
export const T_TOTAL = EARTH_FORMATION_MA * 1_000_000;

/**
 * Number of discrete zoom levels. Level 1 shows the whole span; each level
 * halves the visible span until it reaches ~1 year.
 * ceil(log2(T_TOTAL)) so the deepest level spans <= 1 year.
 */
export const MAX_ZOOM = Math.ceil(Math.log2(T_TOTAL)); // ~33

// --- year <-> BP -----------------------------------------------------------

/** Convert an astronomical year to years before present. */
export function yearToBp(year: number): number {
  return PRESENT_YEAR - year;
}

/** Convert years before present to an astronomical year. */
export function bpToYear(bp: number): number {
  return PRESENT_YEAR - bp;
}

/** Convert millions-of-years-ago to years before present. */
export function maToBp(ma: number): number {
  return ma * 1_000_000;
}

// --- zoom ------------------------------------------------------------------

/** Visible span (in years) at a given 1-based zoom level. */
export function spanForZoom(zoom: number): number {
  return T_TOTAL / 2 ** (zoom - 1);
}

/** Pixels-per-year for a viewport of `height` px at `zoom`. */
export function pxPerYear(zoom: number, height: number): number {
  return height / spanForZoom(zoom);
}

/**
 * Choose a zoom level so a time span of `durationYears` fills the screen with a
 * little room to spare. Because zoom levels are discrete (each halves the span),
 * we pick the most zoomed-in level whose span still covers `durationYears`
 * scaled by `marginFactor` — biasing toward a lower zoom so a bit of the
 * neighbouring spans stays visible. Result span lands in
 * [duration·margin, 2·duration·margin).
 */
export function zoomToFit(durationYears: number, marginFactor = 1.2): number {
  if (durationYears <= 0) return MAX_ZOOM;
  const target = durationYears * marginFactor;
  const z = 1 + Math.floor(Math.log2(T_TOTAL / target));
  return Math.min(MAX_ZOOM, Math.max(1, z));
}

/**
 * Coarsest zoom level at which an event of the given importance tier should
 * appear. Importance 1 (most significant) is visible from level 1; each tier
 * down requires roughly four more zoom levels of detail.
 */
export function minZoomForImportance(importance: number): number {
  return Math.max(1, 1 + (importance - 1) * 4);
}

// --- event positioning -----------------------------------------------------

/** Start/end of an event on the BP axis. For a point event, start === end. */
export interface EventBpRange {
  startBp: number;
  endBp: number;
}

/**
 * Map an event onto the BP axis. Note that on the BP axis the *older* boundary
 * (the event's start year) has the *larger* BP value.
 */
export function eventBpRange(event: DtlEvent): EventBpRange {
  const startBp = yearToBp(event.startYear);
  const endBp =
    event.endYear == null ? startBp : yearToBp(event.endYear);
  return { startBp, endBp };
}

// --- formatting ------------------------------------------------------------

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Render a calendar year with era suffix, e.g. 1969 -> "1969 CE", -3499 -> "3500 BCE". */
function formatCalendarYear(year: number): string {
  if (year > 0) return `${year} CE`;
  // Astronomical year 0 = 1 BCE, -1 = 2 BCE, ...
  return `${1 - year} BCE`;
}

/**
 * Human-readable time string for an event, derived from its precision and
 * stored value. Never hand-stored, so formatting stays consistent.
 */
export function formatEventTime(event: DtlEvent): string {
  const { startYear, precision } = event;
  return formatYearWithPrecision(startYear, precision, {
    month: event.startMonth,
    day: event.startDay,
    time: event.startTime,
  });
}

export interface DateParts {
  month?: number;
  day?: number;
  time?: string;
}

export function formatYearWithPrecision(
  year: number,
  precision: TimePrecision,
  parts: DateParts = {},
): string {
  switch (precision) {
    case "mya": {
      const bp = yearToBp(year);
      if (bp >= 1_000_000_000) {
        return `${(bp / 1_000_000_000).toFixed(2)} billion years ago`;
      }
      return `${Math.round(bp / 1_000_000)} million years ago`;
    }
    case "kya": {
      const bp = yearToBp(year);
      return `${Math.round(bp / 1_000)} thousand years ago`;
    }
    case "century": {
      const rounded = Math.round(year / 100) * 100;
      return formatCalendarYear(rounded);
    }
    case "decade": {
      const rounded = Math.round(year / 10) * 10;
      return formatCalendarYear(rounded);
    }
    case "year":
      return formatCalendarYear(year);
    case "date": {
      if (parts.month && parts.day) {
        return `${year}-${pad2(parts.month)}-${pad2(parts.day)}`;
      }
      if (parts.month) return `${MONTHS[parts.month]} ${formatCalendarYear(year)}`;
      return formatCalendarYear(year);
    }
    case "datetime": {
      const date =
        parts.month && parts.day
          ? `${year}-${pad2(parts.month)}-${pad2(parts.day)}`
          : formatCalendarYear(year);
      return parts.time ? `${date} ${parts.time}` : date;
    }
  }
}
