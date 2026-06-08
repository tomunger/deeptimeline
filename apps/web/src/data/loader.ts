import type { EventsArtifact, GtsArtifact } from "@dtl/shared";

/**
 * Loads the static data artifacts. This is the seam where time-range chunking
 * would later be added — callers only depend on the returned shape.
 */
const BASE = import.meta.env.BASE_URL;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}data/${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export function loadGts(): Promise<GtsArtifact> {
  return fetchJson<GtsArtifact>("gts.json");
}

export function loadEvents(): Promise<EventsArtifact> {
  return fetchJson<EventsArtifact>("events.json");
}
