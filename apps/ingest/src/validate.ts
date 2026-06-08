/**
 * Runtime validation of the authoring data against the @dtl/shared schema.
 * The TS types describe the shape; these checks enforce it on real data
 * (catching errors from AI extraction, third-party conversion, or hand entry).
 * Each function returns a list of human-readable error strings ([] = valid).
 */

const CATEGORIES = ["cultural", "biological", "geological"];
const PRECISIONS = [
  "mya",
  "kya",
  "century",
  "decade",
  "year",
  "date",
  "datetime",
];
const RANKS = ["eon", "era", "period", "epoch", "age"];
const HEX = /^#[0-9a-fA-F]{6}$/;

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function isStr(v: unknown): v is string {
  return typeof v === "string";
}
function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * Parse the tag vocabulary (data/tags.json) into the set of allowed tag ids,
 * validating its structure. Tag ids must be kebab-case and unique.
 */
export function tagVocabIds(vocab: unknown): {
  ids: Set<string>;
  errors: string[];
} {
  const errors: string[] = [];
  const ids = new Set<string>();
  if (!isObj(vocab) || !Array.isArray(vocab.groups))
    return { ids, errors: ["expected { groups: [...] }"] };

  vocab.groups.forEach((g, gi) => {
    if (!isObj(g) || !Array.isArray(g.tags)) {
      errors.push(`group #${gi}: expected { id, label, tags: [...] }`);
      return;
    }
    const gid = isStr(g.id) ? g.id : `#${gi}`;
    for (const t of g.tags) {
      if (!isObj(t) || !isStr(t.id)) {
        errors.push(`group ${gid}: a tag is missing a string id`);
        continue;
      }
      if (!/^[a-z0-9-]+$/.test(t.id))
        errors.push(`tag "${t.id}": id must be kebab-case (a-z, 0-9, -)`);
      if (ids.has(t.id)) errors.push(`tag "${t.id}": duplicate id`);
      ids.add(t.id);
      if (!isStr(t.label)) errors.push(`tag "${t.id}": missing label`);
    }
  });

  return { ids, errors };
}

export function validateEvents(
  events: unknown,
  allowedTags?: Set<string>,
): string[] {
  const errors: string[] = [];
  if (!Array.isArray(events)) return ["expected an array of events"];

  const ids = new Set<string>();
  events.forEach((raw, i) => {
    const id = isObj(raw) && isStr(raw.id) ? raw.id : `#${i}`;
    const at = (msg: string) => errors.push(`event ${id}: ${msg}`);

    if (!isObj(raw)) {
      errors.push(`event #${i}: not an object`);
      return;
    }
    const e = raw;

    if (!isStr(e.id) || e.id.length === 0) at("missing/invalid id");
    else if (ids.has(e.id)) at("duplicate id");
    else ids.add(e.id);

    if (!isStr(e.name) || e.name.length === 0) at("missing/invalid name");
    if (!isStr(e.category) || !CATEGORIES.includes(e.category))
      at(`category must be one of ${CATEGORIES.join(", ")}`);
    if (!isStr(e.precision) || !PRECISIONS.includes(e.precision))
      at(`precision must be one of ${PRECISIONS.join(", ")}`);
    if (!isNum(e.startYear)) at("startYear must be a finite number");
    if (!isNum(e.importance) || !Number.isInteger(e.importance) || e.importance < 1)
      at("importance must be an integer >= 1");

    if (e.endYear != null) {
      if (!isNum(e.endYear)) at("endYear must be a finite number or null");
      else if (isNum(e.startYear) && e.endYear <= e.startYear)
        at("endYear must be later than startYear");
    }
    if (e.startMonth != null && (!isNum(e.startMonth) || e.startMonth < 1 || e.startMonth > 12))
      at("startMonth must be 1-12");
    if (e.startDay != null && (!isNum(e.startDay) || e.startDay < 1 || e.startDay > 31))
      at("startDay must be 1-31");

    if (e.tags != null) {
      if (!Array.isArray(e.tags) || !e.tags.every(isStr))
        at("tags must be an array of strings");
      else if (allowedTags)
        for (const t of e.tags)
          if (!allowedTags.has(t))
            at(`unknown tag "${t}" (not defined in tags.json)`);
    }
    if (e.descriptionMd != null && !isStr(e.descriptionMd))
      at("descriptionMd must be a string");
    if (e.links != null) {
      if (!Array.isArray(e.links)) at("links must be an array");
      else
        e.links.forEach((l, j) => {
          if (!isObj(l) || !isStr(l.label) || !isStr(l.url))
            at(`links[${j}] must be { label, url }`);
        });
    }
  });

  return errors;
}

export function validateGts(intervals: unknown): string[] {
  const errors: string[] = [];
  if (!Array.isArray(intervals)) return ["expected an array of intervals"];

  const ids = new Set<string>();
  for (const raw of intervals) {
    if (isObj(raw) && isStr(raw.id)) ids.add(raw.id);
  }

  intervals.forEach((raw, i) => {
    const id = isObj(raw) && isStr(raw.id) ? raw.id : `#${i}`;
    const at = (msg: string) => errors.push(`interval ${id}: ${msg}`);

    if (!isObj(raw)) {
      errors.push(`interval #${i}: not an object`);
      return;
    }
    const iv = raw;

    if (!isStr(iv.id) || iv.id.length === 0) at("missing/invalid id");
    if (!isStr(iv.name) || iv.name.length === 0) at("missing/invalid name");
    if (!isStr(iv.rank) || !RANKS.includes(iv.rank))
      at(`rank must be one of ${RANKS.join(", ")}`);
    if (!isNum(iv.startMa) || iv.startMa < 0) at("startMa must be a number >= 0");
    if (!isNum(iv.endMa) || iv.endMa < 0) at("endMa must be a number >= 0");
    if (isNum(iv.startMa) && isNum(iv.endMa) && iv.startMa <= iv.endMa)
      at("startMa (older) must be greater than endMa (younger)");
    if (!isStr(iv.color) || !HEX.test(iv.color))
      at("color must be a #RRGGBB hex string");
    if (iv.url != null && (!isStr(iv.url) || !/^https?:\/\//.test(iv.url)))
      at("url must be an http(s) string");
    if (iv.parentId != null) {
      if (!isStr(iv.parentId)) at("parentId must be a string or null");
      else if (!ids.has(iv.parentId)) at(`parentId references unknown id "${iv.parentId}"`);
    }
  });

  return errors;
}
