import { bpToYear } from "@dtl/shared";
import type { Viewport } from "./useViewport";

/** Round a raw step up to a "nice" 1/2/5 × 10^k value. */
function niceStep(raw: number): number {
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * pow;
}

function formatAxisBp(bp: number): string {
  if (bp >= 1_000_000) {
    const ma = bp / 1_000_000;
    return `${ma % 1 === 0 ? ma : ma.toFixed(1)} Ma`;
  }
  if (bp >= 1_000) {
    const ka = bp / 1_000;
    return `${ka % 1 === 0 ? ka : ka.toFixed(1)} ka`;
  }
  const year = Math.round(bpToYear(bp));
  if (year > 0) return `${year} CE`;
  if (year === 0) return "1 BCE";
  return `${1 - year} BCE`;
}

export function AxisTicks({ vp }: { vp: Viewport }) {
  const topBp = vp.timeAtTop;
  const bottomBp = Math.max(0, vp.timeAtTop - vp.span);
  const targetTicks = Math.max(4, Math.round(vp.height / 80));
  const step = niceStep(vp.span / targetTicks);

  const ticks: number[] = [];
  const first = Math.ceil(bottomBp / step) * step;
  for (let bp = first; bp <= topBp; bp += step) ticks.push(bp);

  return (
    <div className="axis">
      <div className="axis-line" />
      {ticks.map((bp) => {
        const y = vp.bpToY(bp);
        return (
          <div key={bp} className="axis-tick" style={{ top: y }}>
            <span className="axis-tick-label">{formatAxisBp(bp)}</span>
          </div>
        );
      })}
    </div>
  );
}
