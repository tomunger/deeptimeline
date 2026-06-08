import { maToBp, type GtsInterval, type GtsRank } from "@dtl/shared";
import type { Viewport } from "./useViewport";

const RANK_ORDER: GtsRank[] = ["eon", "era", "period", "epoch", "age"];

/** Text color (black/white) for legibility against a hex background. */
function textColor(hex: string): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#222" : "#fff";
}

function RankColumn({
  rank,
  intervals,
  vp,
}: {
  rank: GtsRank;
  intervals: GtsInterval[];
  vp: Viewport;
}) {
  return (
    <div className="gts-rank" data-rank={rank}>
      {intervals.map((iv) => {
        const top = vp.bpToY(maToBp(iv.startMa));
        const bottom = vp.bpToY(maToBp(iv.endMa));
        // Clamp the drawn box to the viewport (plus a small pad). A long span
        // zoomed into can be tens of millions of px tall — beyond the browser's
        // max element size — which makes the box fail to render. Clamping keeps
        // it bounded so every covering interval always renders.
        const PAD = 8;
        const drawTop = Math.max(top, -PAD);
        const drawBottom = Math.min(bottom, vp.height + PAD);
        if (drawBottom <= drawTop) return null; // fully outside the viewport
        const h = drawBottom - drawTop;
        // Keep the label in the visible slice of the box, so a box taller than
        // the viewport stays identified instead of scrolling its name off.
        const visibleTop = Math.max(top, 0);
        const visibleBottom = Math.min(bottom, vp.height);
        const labelTop = (visibleTop + visibleBottom) / 2 - drawTop;
        return (
          <div
            key={iv.id}
            className="gts-box"
            style={{
              top: drawTop,
              height: h,
              background: iv.color,
              color: textColor(iv.color),
            }}
            title={`${iv.name} (${iv.startMa}–${iv.endMa} Ma) — double-click to fit`}
            onDoubleClick={() =>
              vp.focusBpRange(maToBp(iv.startMa), maToBp(iv.endMa))
            }
          >
            {h > 16 && (
              <span className="gts-label" style={{ top: labelTop }}>
                {iv.url ? (
                  <a
                    href={iv.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
                    {iv.name}
                  </a>
                ) : (
                  iv.name
                )}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function GtsColumn({
  intervals,
  vp,
}: {
  intervals: GtsInterval[];
  vp: Viewport;
}) {
  const ranksPresent = RANK_ORDER.filter((r) =>
    intervals.some((iv) => iv.rank === r),
  );
  return (
    <div className="gts-column">
      {ranksPresent.map((rank) => (
        <RankColumn
          key={rank}
          rank={rank}
          intervals={intervals.filter((iv) => iv.rank === rank)}
          vp={vp}
        />
      ))}
    </div>
  );
}
