import { useRef } from "react";
import { T_TOTAL } from "@dtl/shared";
import type { Viewport } from "./useViewport";

/** Minimum thumb height (px) so it stays visible/clickable at deep zoom. */
const MIN_THUMB = 24;

/**
 * Right-edge position indicator. The track spans the whole timeline (top =
 * oldest, bottom = present); the thumb's position shows where the view is and
 * its height shows how much of the timeline is visible. Click anywhere (or drag
 * the thumb) to snap the view's center to that time.
 */
export function TimeScrollbar({ vp }: { vp: Viewport }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const centerBp = vp.timeAtTop - vp.span / 2;
  const centerFrac = (T_TOTAL - centerBp) / T_TOTAL;
  const sizeFrac = vp.span / T_TOTAL;
  const thumbH = Math.max(MIN_THUMB, Math.min(vp.height, sizeFrac * vp.height));
  const thumbTop = Math.max(
    0,
    Math.min(vp.height - thumbH, centerFrac * vp.height - thumbH / 2),
  );

  function bpAtPointer(clientY: number): number {
    const rect = trackRef.current!.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return T_TOTAL * (1 - frac);
  }

  return (
    <div
      className="scrollbar"
      ref={trackRef}
      onPointerDown={(e) => vp.panTo(bpAtPointer(e.clientY))}
      onPointerMove={(e) => {
        if (dragging.current) vp.panTo(bpAtPointer(e.clientY));
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
    >
      <div
        className="scrollbar-thumb"
        style={{ top: thumbTop, height: thumbH }}
        onPointerDown={(e) => {
          e.stopPropagation();
          dragging.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
      />
    </div>
  );
}
