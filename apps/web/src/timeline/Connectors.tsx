export interface ConnectorLine {
  key: string;
  /** Card/bar edge (in the column). */
  x1: number;
  y1: number;
  /** Axis end (true time). */
  x2: number;
  y2: number;
  color: string;
}

/** Full-viewport SVG overlay drawing each event's line to its true time on the
 * axis, plus a dot at the axis end. Non-interactive. */
export function Connectors({ lines }: { lines: ConnectorLine[] }) {
  return (
    <svg className="connectors">
      {lines.map((l) => (
        <g key={l.key}>
          <line
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={l.color}
            strokeWidth={1}
            opacity={0.45}
          />
          <circle cx={l.x2} cy={l.y2} r={2.5} fill={l.color} />
        </g>
      ))}
    </svg>
  );
}
