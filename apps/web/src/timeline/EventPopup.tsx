import { formatEventTime, type DtlEvent } from "@dtl/shared";
import { CATEGORY_META } from "./eventLayout";
import { renderMarkdown } from "../util/markdown";

export function EventPopup({
  event,
  onClose,
  onJump,
}: {
  event: DtlEvent;
  onClose: () => void;
  onJump: () => void;
}) {
  const meta = CATEGORY_META[event.category];
  const html = event.descriptionMd ? renderMarkdown(event.descriptionMd) : null;

  return (
    <div className="popup-backdrop" onClick={onClose}>
      <div
        className="popup"
        role="dialog"
        aria-label={event.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="popup-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="popup-meta">
          <span className="popup-cat" style={{ background: meta.color }}>
            {meta.label}
          </span>
          <span className="popup-time">{formatEventTime(event)}</span>
        </div>

        <h2 className="popup-title">{event.name}</h2>

        {event.imageUrl && (
          <img className="popup-image" src={event.imageUrl} alt={event.name} />
        )}

        {html && (
          <div
            className="popup-body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}

        {event.tags && event.tags.length > 0 && (
          <div className="popup-tags">
            {event.tags.map((t) => (
              <span key={t} className="popup-tag">
                {t}
              </span>
            ))}
          </div>
        )}

        {event.links && event.links.length > 0 && (
          <ul className="popup-links">
            {event.links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noopener noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        {event.source && <p className="popup-source">Source: {event.source}</p>}

        <div className="popup-actions">
          <button onClick={onJump}>Jump to this time</button>
        </div>
      </div>
    </div>
  );
}
