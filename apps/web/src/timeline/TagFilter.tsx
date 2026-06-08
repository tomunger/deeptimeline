import { useState } from "react";

/** Read-side tag filter: toggle chips to narrow the timeline to events carrying
 * any of the selected tags. Tag *management* lives in the ingestion track. */
export function TagFilter({
  allTags,
  selected,
  onToggle,
  onClear,
}: {
  allTags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="tagfilter">
      <button className="tagfilter-btn" onClick={() => setOpen((o) => !o)}>
        Tags{selected.length > 0 ? ` (${selected.length})` : ""}
      </button>
      {open && (
        <>
          <div className="menu-backdrop" onClick={() => setOpen(false)} />
          <div className="tagfilter-panel">
            <div className="tagfilter-chips">
              {allTags.map((t) => (
                <button
                  key={t}
                  className={`tag-chip${selected.includes(t) ? " on" : ""}`}
                  onClick={() => onToggle(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            {selected.length > 0 && (
              <button className="tagfilter-clear" onClick={onClear}>
                Clear all
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
