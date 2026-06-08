import {
  eventBpRange,
  minZoomForImportance,
  type Category,
  type DtlEvent,
  type TimePrecision,
} from "@dtl/shared";
import type { Viewport } from "./useViewport";

/** Comfortable visible span (years) when jumping to a point event, by how
 * precisely its time is known. Used so "jump to event" lands at a useful zoom
 * instead of the deepest level. */
const FOCUS_SPAN_BY_PRECISION: Record<TimePrecision, number> = {
  mya: 50_000_000,
  kya: 50_000,
  century: 2_000,
  decade: 300,
  year: 60,
  date: 6,
  datetime: 2,
};

export function focusSpanForPrecision(precision: TimePrecision): number {
  return FOCUS_SPAN_BY_PRECISION[precision];
}

export const CATEGORY_META: Record<
  Category,
  { label: string; color: string; side: "left" | "right" }
> = {
  cultural: { label: "Cultural", color: "#c9a0ff", side: "left" },
  biological: { label: "Biological", color: "#7fd1a6", side: "left" },
  geological: { label: "Geological", color: "#f0a868", side: "right" },
};

/** Approximate label height in px; used for stacking and culling. */
export const CARD_HEIGHT = 22;
const CULL_PAD = 40;

/** A point event placed in a column. `anchorY` is its true time; `cardY` may be
 * displaced downward so labels don't overlap. */
export interface PositionedPoint {
  event: DtlEvent;
  anchorY: number;
  cardY: number;
}

/** A range event placed in a column, occupying its true vertical extent. */
export interface PositionedRange {
  event: DtlEvent;
  topY: number;
  bottomY: number;
  lane: number;
}

export interface ColumnLayout {
  points: PositionedPoint[];
  ranges: PositionedRange[];
  laneCount: number;
}

function isVisibleAtZoom(event: DtlEvent, zoom: number): boolean {
  return minZoomForImportance(event.importance) <= zoom;
}

/**
 * Filter a category's events by level-of-detail + viewport, then position them:
 * points are stacked to avoid label overlap, ranges are packed into lanes.
 */
export function layoutColumn(
  events: DtlEvent[],
  vp: Viewport,
): ColumnLayout {
  const points: PositionedPoint[] = [];
  const rangeInputs: { event: DtlEvent; topY: number; bottomY: number }[] = [];

  for (const event of events) {
    if (!isVisibleAtZoom(event, vp.zoom)) continue;
    const { startBp, endBp } = eventBpRange(event);
    const isPoint = event.endYear == null;

    if (isPoint) {
      const y = vp.bpToY(startBp);
      if (y < -CULL_PAD || y > vp.height + CULL_PAD) continue;
      points.push({ event, anchorY: y, cardY: y });
    } else {
      // startBp is older => smaller y (top); endBp younger => larger y (bottom).
      const topY = vp.bpToY(startBp);
      const bottomY = vp.bpToY(endBp);
      if (bottomY < 0 || topY > vp.height) continue;
      rangeInputs.push({ event, topY, bottomY });
    }
  }

  // Stack points downward by true position so labels don't collide.
  points.sort((a, b) => a.anchorY - b.anchorY);
  let lastCardY = -Infinity;
  for (const p of points) {
    p.cardY = Math.max(p.anchorY, lastCardY + CARD_HEIGHT);
    lastCardY = p.cardY;
  }

  // Greedy lane packing for ranges (first lane whose previous bar has ended).
  rangeInputs.sort((a, b) => a.topY - b.topY);
  const laneEnds: number[] = [];
  const ranges: PositionedRange[] = rangeInputs.map((r) => {
    let lane = laneEnds.findIndex((end) => end <= r.topY);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(r.bottomY);
    } else {
      laneEnds[lane] = r.bottomY;
    }
    return { event: r.event, topY: r.topY, bottomY: r.bottomY, lane };
  });

  return { points, ranges, laneCount: Math.max(1, laneEnds.length) };
}
