import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tagVocabIds, validateEvents, validateGts } from "./validate.js";

/**
 * Ingest CLI: read the authoring data from `data/`, validate it against the
 * schema, and emit the published artifacts to `apps/web/public/data/`.
 * Exits non-zero (writing nothing) if validation fails.
 */

const repoRoot = new URL("../../../", import.meta.url);
const src = (f: string) => fileURLToPath(new URL(`data/${f}`, repoRoot));
const out = (f: string) =>
  fileURLToPath(new URL(`apps/web/public/data/${f}`, repoRoot));

function readJson(path: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    console.error(`✗ Cannot read/parse ${path}: ${(e as Error).message}`);
    process.exit(1);
  }
}

function writeArtifact(path: string, obj: unknown): void {
  writeFileSync(path, JSON.stringify(obj, null, 2) + "\n");
}

const gtsSrc = readJson(src("gts.json"));
const eventsSrc = readJson(src("events.json"));
const tagsSrc = readJson(src("tags.json"));

const { ids: allowedTags, errors: tagErrors } = tagVocabIds(tagsSrc);

const errors = [
  ...tagErrors.map((e) => `tags.json: ${e}`),
  ...validateGts(gtsSrc.intervals).map((e) => `gts.json: ${e}`),
  ...validateEvents(eventsSrc.events, allowedTags).map(
    (e) => `events.json: ${e}`,
  ),
];

if (errors.length > 0) {
  console.error(`✗ ${errors.length} validation error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const intervals = gtsSrc.intervals as unknown[];
const events = eventsSrc.events as unknown[];

writeArtifact(out("gts.json"), {
  version: gtsSrc.version ?? 1,
  intervals,
});
writeArtifact(out("events.json"), {
  version: eventsSrc.version ?? 1,
  events,
});

console.log(
  `✓ Validated and published ${intervals.length} GTS intervals and ${events.length} events.`,
);
