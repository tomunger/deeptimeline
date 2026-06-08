import { useMemo, useState } from "react";
import { formatEventTime, type DtlEvent } from "@dtl/shared";
import { searchEvents } from "../search/searchEvents";
import { CATEGORY_META } from "./eventLayout";

export function SearchBox({
  events,
  onPick,
}: {
  events: DtlEvent[];
  onPick: (event: DtlEvent) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(
    () => searchEvents(events, query),
    [events, query],
  );

  function pick(event: DtlEvent) {
    onPick(event);
    setQuery("");
    setOpen(false);
  }

  const showList = open && query.trim().length > 0;

  return (
    <div className="search">
      <input
        className="search-input"
        type="search"
        placeholder="Search events…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) pick(results[0].event);
          else if (e.key === "Escape") {
            setQuery("");
            setOpen(false);
            e.stopPropagation();
          }
        }}
      />
      {showList && (
        <ul className="search-results">
          {results.length === 0 ? (
            <li className="search-empty">No matches</li>
          ) : (
            results.map((r) => (
              <li key={r.event.id}>
                <button
                  className="search-result"
                  // onMouseDown so it fires before input blur closes the list.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(r.event);
                  }}
                >
                  <span
                    className="search-dot"
                    style={{ background: CATEGORY_META[r.event.category].color }}
                  />
                  <span className="search-name">{r.event.name}</span>
                  <span className="search-time">
                    {formatEventTime(r.event)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
