import { eventBpRange, formatEventTime } from "@dtl/shared";
import type { ColumnLayout } from "./eventLayout";
import { CATEGORY_META } from "./eventLayout";
import type { Viewport } from "./useViewport";
import type { Category } from "@dtl/shared";

export function EventColumn({
  category,
  layout,
  vp,
  selectedId,
  onSelect,
}: {
  category: Category;
  layout: ColumnLayout;
  vp: Viewport;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const meta = CATEGORY_META[category];
  const laneWidthPct = 100 / layout.laneCount;

  return (
    <div className={`event-column side-${meta.side}`}>
      <span className="col-header">{meta.label}</span>

      {layout.ranges.map((r) => {
        // Clamp the drawn bar to the viewport (plus a small pad). A long range
        // zoomed into can be tens of millions of px tall — beyond the browser's
        // max element size — which makes the bar fail to render.
        const PAD = 8;
        const drawTop = Math.max(r.topY, -PAD);
        const drawBottom = Math.min(r.bottomY, vp.height + PAD);
        if (drawBottom <= drawTop) return null; // fully outside the viewport
        // Keep the label in the bar's visible slice so a bar taller than the
        // viewport stays identified instead of scrolling its name off.
        const visibleTop = Math.max(r.topY, 0);
        const visibleBottom = Math.min(r.bottomY, vp.height);
        const labelTop = (visibleTop + visibleBottom) / 2 - drawTop;
        return (
          <div
            key={r.event.id}
            className={`event-range${selectedId === r.event.id ? " selected" : ""}`}
            style={{
              top: drawTop,
              height: Math.max(2, drawBottom - drawTop),
              left: `${r.lane * laneWidthPct}%`,
              width: `${laneWidthPct}%`,
              background: meta.color,
            }}
            title={`${r.event.name} (${formatEventTime(r.event)})`}
            onClick={() => onSelect(r.event.id)}
            onDoubleClick={() => {
              const { startBp, endBp } = eventBpRange(r.event);
              vp.focusBpRange(startBp, endBp);
            }}
          >
            <span className="event-range-label" style={{ top: labelTop }}>
              {r.event.name}
            </span>
          </div>
        );
      })}

      {layout.points.map((p) => (
        <div
          key={p.event.id}
          className={`event-point${selectedId === p.event.id ? " selected" : ""}`}
          style={{ top: p.cardY, borderColor: meta.color }}
          title={`${p.event.name} (${formatEventTime(p.event)})`}
          onClick={() => onSelect(p.event.id)}
        >
          <span className="event-dot" style={{ background: meta.color }} />
          <span className="event-name">{p.event.name}</span>
        </div>
      ))}
    </div>
  );
}
