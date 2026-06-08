import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatYearWithPrecision,
  bpToYear,
  eventBpRange,
  type Category,
  type DtlEvent,
  type GtsInterval,
} from "@dtl/shared";
import { useViewport } from "./useViewport";
import { AxisTicks } from "./AxisTicks";
import { GtsColumn } from "./GtsColumn";
import { EventColumn } from "./EventColumn";
import { EventPopup } from "./EventPopup";
import { SearchBox } from "./SearchBox";
import { TagFilter } from "./TagFilter";
import { Connectors, type ConnectorLine } from "./Connectors";
import { TimeScrollbar } from "./TimeScrollbar";
import {
  CATEGORY_META,
  focusSpanForPrecision,
  layoutColumn,
  type ColumnLayout,
} from "./eventLayout";

const AXIS_W = 120;
const GTS_W = 360;
const CATEGORIES: Category[] = ["cultural", "biological", "geological"];

function zoomReadout(timeAtTop: number, span: number): string {
  const top = formatYearWithPrecision(bpToYear(timeAtTop), "mya");
  const bottomBp = Math.max(0, timeAtTop - span);
  const bottom =
    bottomBp <= 0 ? "present" : formatYearWithPrecision(bpToYear(bottomBp), "mya");
  return `${top} → ${bottom}`;
}

/** Axis-facing edge x (in viewport px) for each event column, plus the axis x. */
function columnGeometry(width: number) {
  const fr = (width - AXIS_W - GTS_W) / 3;
  return {
    axisX: 2 * fr + AXIS_W / 2,
    edge: {
      cultural: fr,
      biological: 2 * fr,
      geological: 2 * fr + AXIS_W,
    } as Record<Category, number>,
  };
}

function buildConnectors(
  category: Category,
  layout: ColumnLayout,
  edgeX: number,
  axisX: number,
): ConnectorLine[] {
  const color = CATEGORY_META[category].color;
  const lines: ConnectorLine[] = [];
  for (const p of layout.points) {
    lines.push({
      key: p.event.id,
      x1: edgeX,
      y1: p.cardY,
      x2: axisX,
      y2: p.anchorY,
      color,
    });
  }
  for (const r of layout.ranges) {
    const midY = (r.topY + r.bottomY) / 2;
    lines.push({
      key: r.event.id,
      x1: edgeX,
      y1: midY,
      x2: axisX,
      y2: midY,
      color,
    });
  }
  return lines;
}

export function TimelineViewport({
  gts,
  events,
}: {
  gts: GtsInterval[];
  events: DtlEvent[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vp = useViewport(containerRef);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedEvent = selectedId
    ? (events.find((e) => e.id === selectedId) ?? null)
    : null;

  // Tag filter (read-side). Empty = show everything; otherwise keep events that
  // carry any selected tag (OR).
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) for (const t of e.tags ?? []) set.add(t);
    return [...set].sort();
  }, [events]);
  const filteredEvents = useMemo(
    () =>
      selectedTags.length === 0
        ? events
        : events.filter((e) => e.tags?.some((t) => selectedTags.includes(t))),
    [events, selectedTags],
  );
  const toggleTag = (tag: string) =>
    setSelectedTags((cur) =>
      cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag],
    );

  function jumpToEvent(event: DtlEvent) {
    const { startBp, endBp } = eventBpRange(event);
    if (event.endYear == null) {
      const s = focusSpanForPrecision(event.precision);
      vp.focusBpRange(startBp + s / 2, startBp - s / 2);
    } else {
      vp.focusBpRange(startBp, endBp);
    }
  }

  function openEvent(id: string) {
    history.replaceState(null, "", `#event=${encodeURIComponent(id)}`);
    setSelectedId(id);
  }
  function closeEvent() {
    history.replaceState(null, "", location.pathname + location.search);
    setSelectedId(null);
  }

  // Deep link: on first load, open + jump to the event named in the URL hash.
  useEffect(() => {
    const m = location.hash.match(/^#event=(.+)$/);
    if (!m) return;
    const ev = events.find((e) => e.id === decodeURIComponent(m[1]));
    if (ev) {
      setSelectedId(ev.id);
      jumpToEvent(ev);
    }
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape closes the popup.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEvent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const geom = columnGeometry(vp.width);
  const layouts: Record<Category, ColumnLayout> = {
    cultural: layoutColumn(
      filteredEvents.filter((e) => e.category === "cultural"),
      vp,
    ),
    biological: layoutColumn(
      filteredEvents.filter((e) => e.category === "biological"),
      vp,
    ),
    geological: layoutColumn(
      filteredEvents.filter((e) => e.category === "geological"),
      vp,
    ),
  };
  const connectors = CATEGORIES.flatMap((c) =>
    buildConnectors(c, layouts[c], geom.edge[c], geom.axisX),
  );

  return (
    <div className="timeline">
      <div className="controls">
        <button onClick={vp.zoomOut} disabled={!vp.canZoomOut}>
          −
        </button>
        <label className="zoom-select">
          zoom
          <select
            value={vp.zoom}
            onChange={(e) => vp.setZoomLevel(Number(e.target.value))}
          >
            {Array.from({ length: vp.maxZoom }, (_, i) => i + 1).map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </label>
        <button onClick={vp.zoomIn} disabled={!vp.canZoomIn}>
          +
        </button>
        <span className="readout">{zoomReadout(vp.timeAtTop, vp.span)}</span>
        <TagFilter
          allTags={allTags}
          selected={selectedTags}
          onToggle={toggleTag}
          onClear={() => setSelectedTags([])}
        />
        <SearchBox
          events={events}
          onPick={(ev) => {
            openEvent(ev.id);
            jumpToEvent(ev);
          }}
        />
      </div>

      <div className="viewport" ref={containerRef}>
        <div className="col">
          <EventColumn
            category="cultural"
            layout={layouts.cultural}
            vp={vp}
            selectedId={selectedId}
            onSelect={openEvent}
          />
        </div>
        <div className="col">
          <EventColumn
            category="biological"
            layout={layouts.biological}
            vp={vp}
            selectedId={selectedId}
            onSelect={openEvent}
          />
        </div>
        <div className="col col-axis">
          <AxisTicks vp={vp} />
        </div>
        <div className="col">
          <EventColumn
            category="geological"
            layout={layouts.geological}
            vp={vp}
            selectedId={selectedId}
            onSelect={openEvent}
          />
        </div>
        <div className="col col-gts">
          <GtsColumn intervals={gts} vp={vp} />
        </div>

        <Connectors lines={connectors} />
        <TimeScrollbar vp={vp} />
      </div>

      {selectedEvent && (
        <EventPopup
          event={selectedEvent}
          onClose={closeEvent}
          onJump={() => jumpToEvent(selectedEvent)}
        />
      )}
    </div>
  );
}
