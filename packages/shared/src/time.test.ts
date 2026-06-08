import { describe, it, expect } from "vitest";
import {
  PRESENT_YEAR,
  T_TOTAL,
  spanForZoom,
  yearToBp,
  bpToYear,
  eventBpRange,
  formatYearWithPrecision,
  formatEventTime,
  minZoomForImportance,
  zoomToFit,
} from "./time.js";
import type { DtlEvent } from "./types.js";

describe("year <-> BP", () => {
  it("round-trips", () => {
    expect(yearToBp(PRESENT_YEAR)).toBe(0);
    expect(bpToYear(0)).toBe(PRESENT_YEAR);
    expect(bpToYear(yearToBp(-3499))).toBe(-3499);
  });
});

describe("zoom", () => {
  it("level 1 spans the whole timeline; each level halves it", () => {
    expect(spanForZoom(1)).toBe(T_TOTAL);
    expect(spanForZoom(2)).toBe(T_TOTAL / 2);
    expect(spanForZoom(3)).toBe(T_TOTAL / 4);
  });

  it("maps importance tiers to coarsest visible zoom", () => {
    expect(minZoomForImportance(1)).toBe(1);
    expect(minZoomForImportance(2)).toBe(5);
  });

  it("zoomToFit covers the span with margin but not too loosely", () => {
    const duration = 100_000_000; // 100 Myr
    const z = zoomToFit(duration);
    expect(spanForZoom(z)).toBeGreaterThanOrEqual(duration * 1.2);
    expect(spanForZoom(z)).toBeLessThan(duration * 1.2 * 2);
  });

  it("zoomToFit clamps a whole-timeline span to level 1", () => {
    expect(zoomToFit(T_TOTAL)).toBe(1);
  });
});

describe("formatYearWithPrecision", () => {
  it("formats deep time", () => {
    const formationYear = PRESENT_YEAR - 4_540_000_000;
    expect(formatYearWithPrecision(formationYear, "mya")).toBe(
      "4.54 billion years ago",
    );
    const tenMa = PRESENT_YEAR - 10_000_000;
    expect(formatYearWithPrecision(tenMa, "mya")).toBe("10 million years ago");
  });

  it("formats calendar years with era", () => {
    expect(formatYearWithPrecision(-3499, "year")).toBe("3500 BCE");
    expect(formatYearWithPrecision(1969, "year")).toBe("1969 CE");
  });

  it("formats exact dates", () => {
    expect(
      formatYearWithPrecision(1969, "date", { month: 7, day: 20 }),
    ).toBe("1969-07-20");
  });
});

describe("eventBpRange", () => {
  it("treats a missing end as a point event", () => {
    const e: DtlEvent = {
      id: "x",
      name: "X",
      category: "geological",
      startYear: PRESENT_YEAR - 66_000_000,
      precision: "mya",
      importance: 1,
    };
    const { startBp, endBp } = eventBpRange(e);
    expect(startBp).toBe(66_000_000);
    expect(endBp).toBe(66_000_000);
  });

  it("older boundary has the larger BP value for a range", () => {
    const e: DtlEvent = {
      id: "r",
      name: "Range",
      category: "biological",
      startYear: PRESENT_YEAR - 230_000_000,
      endYear: PRESENT_YEAR - 66_000_000,
      precision: "mya",
      importance: 1,
    };
    const { startBp, endBp } = eventBpRange(e);
    expect(startBp).toBeGreaterThan(endBp);
  });
});

describe("formatEventTime", () => {
  it("uses the moon landing date", () => {
    const e: DtlEvent = {
      id: "moon",
      name: "Moon landing",
      category: "cultural",
      startYear: 1969,
      startMonth: 7,
      startDay: 20,
      precision: "date",
      importance: 1,
    };
    expect(formatEventTime(e)).toBe("1969-07-20");
  });
});
