import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_ZOOM, T_TOTAL, spanForZoom, zoomToFit } from "@dtl/shared";

/**
 * Geometry + controls for the virtualized timeline.
 *
 * Pan state is stored as `centerBp` (years-before-present at the vertical
 * center of the viewport) rather than a scroll offset, so it stays stable
 * across zoom and resize. The full content height is astronomically large at
 * high zoom, so there is no real scroll container: positions are computed from
 * `centerBp` + `zoom` and only visible items are rendered.
 */
export interface Viewport {
  height: number;
  width: number;
  zoom: number;
  /** Visible span in years. */
  span: number;
  /** Years-before-present at the top edge (the oldest visible time). */
  timeAtTop: number;
  pxPerYear: number;
  /** Map a BP value to a y pixel within the viewport. */
  bpToY: (bp: number) => number;
  /** Map a y pixel to a BP value. */
  yToBp: (y: number) => number;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoomLevel: (zoom: number) => void;
  /** Zoom + pan so the given BP range fills the screen (with a little margin). */
  focusBpRange: (startBp: number, endBp: number) => void;
  /** Pan so the given BP is at the vertical center (keeps zoom). */
  panTo: (bp: number) => void;
  maxZoom: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

/** Overscroll allowance at each end (px) so events at the very first/last
 * instant can scroll fully onto the screen instead of being half-clipped. */
const EDGE_PAD_PX = 28;

function clampCenter(centerBp: number, span: number, height: number): number {
  const pad = (EDGE_PAD_PX * span) / height;
  const lo = span / 2 - pad;
  const hi = T_TOTAL - span / 2 + pad;
  return Math.min(hi, Math.max(lo, centerBp));
}

export function useViewport(
  containerRef: React.RefObject<HTMLElement | null>,
): Viewport {
  const [height, setHeight] = useState(800);
  const [width, setWidth] = useState(1200);
  const [zoom, setZoom] = useState(1);
  const [centerBp, setCenterBp] = useState(T_TOTAL / 2);

  const span = spanForZoom(zoom);
  const safeHeight = height || 800;
  const pxPerYear = safeHeight / span;
  const center = clampCenter(centerBp, span, safeHeight);
  const timeAtTop = center + span / 2;

  // Latest geometry for imperative handlers (wheel/keyboard), so their effects
  // don't need to re-subscribe on every pan.
  const geomRef = useRef({ zoom, center, span, height: safeHeight });
  geomRef.current = { zoom, center, span, height: safeHeight };
  const zoomAccRef = useRef(0);

  const bpToY = useCallback(
    (bp: number) => (timeAtTop - bp) * pxPerYear,
    [timeAtTop, pxPerYear],
  );
  const yToBp = useCallback(
    (y: number) => timeAtTop - y / pxPerYear,
    [timeAtTop, pxPerYear],
  );

  const zoomIn = useCallback(
    () => setZoom((z) => Math.min(MAX_ZOOM, z + 1)),
    [],
  );
  const zoomOut = useCallback(() => setZoom((z) => Math.max(1, z - 1)), []);
  const setZoomLevel = useCallback(
    (z: number) => setZoom(Math.min(MAX_ZOOM, Math.max(1, z))),
    [],
  );
  const focusBpRange = useCallback((startBp: number, endBp: number) => {
    const duration = Math.abs(startBp - endBp);
    const targetCenter = (startBp + endBp) / 2;
    const z = zoomToFit(duration);
    setZoom(z);
    setCenterBp(
      clampCenter(targetCenter, spanForZoom(z), geomRef.current.height),
    );
  }, []);
  const panTo = useCallback((bp: number) => {
    const g = geomRef.current;
    setCenterBp(clampCenter(bp, g.span, g.height));
  }, []);

  // Measure the container.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setHeight(entries[0].contentRect.height);
      setWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    setHeight(el.clientHeight);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [containerRef]);

  // Wheel: pan normally; with Ctrl/⌘ held (or trackpad pinch) zoom toward the
  // cursor, keeping the time under the pointer fixed. Native non-passive
  // listener so we can preventDefault and read geometry from geomRef.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ZOOM_STEP = 100; // accumulated px per discrete zoom level
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const g = geomRef.current;
      // Normalize delta to pixels regardless of wheel mode.
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;
      else if (e.deltaMode === 2) dy *= g.height;

      if (e.ctrlKey || e.metaKey) {
        zoomAccRef.current += dy;
        let steps = 0;
        while (zoomAccRef.current <= -ZOOM_STEP) {
          steps += 1;
          zoomAccRef.current += ZOOM_STEP;
        }
        while (zoomAccRef.current >= ZOOM_STEP) {
          steps -= 1;
          zoomAccRef.current -= ZOOM_STEP;
        }
        if (steps === 0) return;
        const newZoom = Math.min(MAX_ZOOM, Math.max(1, g.zoom + steps));
        if (newZoom === g.zoom) {
          zoomAccRef.current = 0;
          return;
        }
        // Keep the BP under the cursor anchored at the same y.
        const oldSpan = spanForZoom(g.zoom);
        const y = e.clientY - el.getBoundingClientRect().top;
        const bpAtCursor = g.center + oldSpan / 2 - (y / g.height) * oldSpan;
        const newSpan = spanForZoom(newZoom);
        const newTimeAtTop = bpAtCursor + (y / g.height) * newSpan;
        setZoom(newZoom);
        setCenterBp(clampCenter(newTimeAtTop - newSpan / 2, newSpan, g.height));
        return;
      }

      // Scrolling down (dy > 0) moves toward the present (smaller BP).
      const yearsPerPixel = g.span / g.height;
      setCenterBp((c) => clampCenter(c - dy * yearsPerPixel, g.span, g.height));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [containerRef]);

  // Keyboard navigation. Ignored while typing in a form control.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) {
        return;
      }
      const g = geomRef.current;
      switch (e.key) {
        case "PageDown":
          setCenterBp((c) => clampCenter(c - g.span, g.span, g.height));
          break;
        case "PageUp":
          setCenterBp((c) => clampCenter(c + g.span, g.span, g.height));
          break;
        case "ArrowDown":
          setCenterBp((c) => clampCenter(c - g.span * 0.1, g.span, g.height));
          break;
        case "ArrowUp":
          setCenterBp((c) => clampCenter(c + g.span * 0.1, g.span, g.height));
          break;
        case "Home":
          setZoom(1);
          setCenterBp(T_TOTAL / 2);
          break;
        case "+":
        case "=":
          setZoom((z) => Math.min(MAX_ZOOM, z + 1));
          break;
        case "-":
        case "_":
          setZoom((z) => Math.max(1, z - 1));
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return {
    height: safeHeight,
    width,
    zoom,
    span,
    timeAtTop,
    pxPerYear,
    bpToY,
    yToBp,
    zoomIn,
    zoomOut,
    setZoomLevel,
    focusBpRange,
    panTo,
    maxZoom: MAX_ZOOM,
    canZoomIn: zoom < MAX_ZOOM,
    canZoomOut: zoom > 1,
  };
}
