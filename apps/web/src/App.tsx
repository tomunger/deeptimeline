import { useEffect, useState } from "react";
import type { DtlEvent, GtsInterval } from "@dtl/shared";
import { loadEvents, loadGts } from "./data/loader";
import { TimelineViewport } from "./timeline/TimelineViewport";

export function App() {
  const [gts, setGts] = useState<GtsInterval[] | null>(null);
  const [events, setEvents] = useState<DtlEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadGts(), loadEvents()])
      .then(([g, e]) => {
        setGts(g.intervals);
        setEvents(e.events);
      })
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <div className="status">Error: {error}</div>;
  if (!gts || !events) return <div className="status">Loading…</div>;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Deep Time Line</h1>
        <p>
          Scroll to move through time · Ctrl/⌘ + scroll to zoom at the cursor ·
          double-click an interval to fit it · PageUp/Down jump a screen · Home
          resets · +/− zoom
        </p>
      </header>
      <TimelineViewport gts={gts} events={events} />
    </div>
  );
}
