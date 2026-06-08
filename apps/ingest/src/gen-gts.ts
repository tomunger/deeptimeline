/**
 * Generator for the full ICS geological time scale (data/gts.json).
 *
 * Boundaries (Ma) and the unit hierarchy are transcribed from Wikipedia's
 * geologic-time-scale chart and the individual period/eon articles (ICS 2023).
 * Colors come from the official ICS palette in ics-colors.json (extracted from
 * reference/CGMW_ICS_colour_codes.xlsx); the few units without an eponymous
 * chart entry inherit their nearest coloured ancestor.
 *
 * Run:  npx tsx apps/ingest/src/gen-gts.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type Rank = "eon" | "era" | "period" | "epoch" | "age";
// [id, name, rank, startMa, endMa, parentId]
type Def = [string, string, Rank, number, number, string | null];

const defs: Def[] = [
  // --- Eons ---
  ["hadean", "Hadean", "eon", 4540, 4031, null],
  ["archean", "Archean", "eon", 4031, 2500, null],
  ["proterozoic", "Proterozoic", "eon", 2500, 538.8, null],
  ["phanerozoic", "Phanerozoic", "eon", 538.8, 0, null],

  // --- Archean eras ---
  ["eoarchean", "Eoarchean", "era", 4031, 3600, "archean"],
  ["paleoarchean", "Paleoarchean", "era", 3600, 3200, "archean"],
  ["mesoarchean", "Mesoarchean", "era", 3200, 2800, "archean"],
  ["neoarchean", "Neoarchean", "era", 2800, 2500, "archean"],

  // --- Proterozoic eras + periods ---
  ["paleoproterozoic", "Paleoproterozoic", "era", 2500, 1600, "proterozoic"],
  ["mesoproterozoic", "Mesoproterozoic", "era", 1600, 1000, "proterozoic"],
  ["neoproterozoic", "Neoproterozoic", "era", 1000, 538.8, "proterozoic"],
  ["siderian", "Siderian", "period", 2500, 2300, "paleoproterozoic"],
  ["rhyacian", "Rhyacian", "period", 2300, 2050, "paleoproterozoic"],
  ["orosirian", "Orosirian", "period", 2050, 1800, "paleoproterozoic"],
  ["statherian", "Statherian", "period", 1800, 1600, "paleoproterozoic"],
  ["calymmian", "Calymmian", "period", 1600, 1400, "mesoproterozoic"],
  ["ectasian", "Ectasian", "period", 1400, 1200, "mesoproterozoic"],
  ["stenian", "Stenian", "period", 1200, 1000, "mesoproterozoic"],
  ["tonian", "Tonian", "period", 1000, 720, "neoproterozoic"],
  ["cryogenian", "Cryogenian", "period", 720, 635, "neoproterozoic"],
  ["ediacaran", "Ediacaran", "period", 635, 538.8, "neoproterozoic"],

  // --- Phanerozoic eras ---
  ["paleozoic", "Paleozoic", "era", 538.8, 251.902, "phanerozoic"],
  ["mesozoic", "Mesozoic", "era", 251.902, 66, "phanerozoic"],
  ["cenozoic", "Cenozoic", "era", 66, 0, "phanerozoic"],

  // --- Paleozoic periods ---
  ["cambrian", "Cambrian", "period", 538.8, 486.85, "paleozoic"],
  ["ordovician", "Ordovician", "period", 486.85, 443.8, "paleozoic"],
  ["silurian", "Silurian", "period", 443.8, 419.62, "paleozoic"],
  ["devonian", "Devonian", "period", 419.62, 358.86, "paleozoic"],
  ["carboniferous", "Carboniferous", "period", 358.86, 298.9, "paleozoic"],
  ["permian", "Permian", "period", 298.9, 251.902, "paleozoic"],
  // --- Mesozoic periods ---
  ["triassic", "Triassic", "period", 251.902, 201.4, "mesozoic"],
  ["jurassic", "Jurassic", "period", 201.4, 143.1, "mesozoic"],
  ["cretaceous", "Cretaceous", "period", 143.1, 66, "mesozoic"],
  // --- Cenozoic periods ---
  ["paleogene", "Paleogene", "period", 66, 23.04, "cenozoic"],
  ["neogene", "Neogene", "period", 23.04, 2.58, "cenozoic"],
  ["quaternary", "Quaternary", "period", 2.58, 0, "cenozoic"],

  // --- Cambrian epochs + ages ---
  ["terreneuvian", "Terreneuvian", "epoch", 538.8, 521, "cambrian"],
  ["cambrian-series-2", "Cambrian Series 2", "epoch", 521, 506.5, "cambrian"],
  ["miaolingian", "Miaolingian", "epoch", 506.5, 497, "cambrian"],
  ["furongian", "Furongian", "epoch", 497, 486.85, "cambrian"],
  ["fortunian", "Fortunian", "age", 538.8, 529, "terreneuvian"],
  ["cambrian-stage-2", "Cambrian Stage 2", "age", 529, 521, "terreneuvian"],
  ["cambrian-stage-3", "Cambrian Stage 3", "age", 521, 514.5, "cambrian-series-2"],
  ["cambrian-stage-4", "Cambrian Stage 4", "age", 514.5, 506.5, "cambrian-series-2"],
  ["wuliuan", "Wuliuan", "age", 506.5, 504.5, "miaolingian"],
  ["drumian", "Drumian", "age", 504.5, 500.5, "miaolingian"],
  ["guzhangian", "Guzhangian", "age", 500.5, 497, "miaolingian"],
  ["paibian", "Paibian", "age", 497, 494.2, "furongian"],
  ["jiangshanian", "Jiangshanian", "age", 494.2, 491, "furongian"],
  ["cambrian-stage-10", "Cambrian Stage 10", "age", 491, 486.85, "furongian"],

  // --- Ordovician epochs + ages ---
  ["early-ordovician", "Early Ordovician", "epoch", 486.85, 471.3, "ordovician"],
  ["middle-ordovician", "Middle Ordovician", "epoch", 471.3, 458.2, "ordovician"],
  ["late-ordovician", "Late Ordovician", "epoch", 458.2, 443.8, "ordovician"],
  ["tremadocian", "Tremadocian", "age", 486.85, 477.1, "early-ordovician"],
  ["floian", "Floian", "age", 477.1, 471.3, "early-ordovician"],
  ["dapingian", "Dapingian", "age", 471.3, 469.4, "middle-ordovician"],
  ["darriwilian", "Darriwilian", "age", 469.4, 458.2, "middle-ordovician"],
  ["sandbian", "Sandbian", "age", 458.2, 452.8, "late-ordovician"],
  ["katian", "Katian", "age", 452.8, 445.2, "late-ordovician"],
  ["hirnantian", "Hirnantian", "age", 445.2, 443.8, "late-ordovician"],

  // --- Silurian epochs + ages ---
  ["llandovery", "Llandovery", "epoch", 443.8, 433.4, "silurian"],
  ["wenlock", "Wenlock", "epoch", 433.4, 427.4, "silurian"],
  ["ludlow", "Ludlow", "epoch", 427.4, 423.0, "silurian"],
  ["pridoli", "Pridoli", "epoch", 423.0, 419.62, "silurian"],
  ["rhuddanian", "Rhuddanian", "age", 443.8, 440.8, "llandovery"],
  ["aeronian", "Aeronian", "age", 440.8, 438.5, "llandovery"],
  ["telychian", "Telychian", "age", 438.5, 433.4, "llandovery"],
  ["sheinwoodian", "Sheinwoodian", "age", 433.4, 430.5, "wenlock"],
  ["homerian", "Homerian", "age", 430.5, 427.4, "wenlock"],
  ["gorstian", "Gorstian", "age", 427.4, 425.6, "ludlow"],
  ["ludfordian", "Ludfordian", "age", 425.6, 423.0, "ludlow"],

  // --- Devonian epochs + ages ---
  ["early-devonian", "Early Devonian", "epoch", 419.62, 393.47, "devonian"],
  ["middle-devonian", "Middle Devonian", "epoch", 393.47, 382.31, "devonian"],
  ["late-devonian", "Late Devonian", "epoch", 382.31, 358.86, "devonian"],
  ["lochkovian", "Lochkovian", "age", 419.62, 413.02, "early-devonian"],
  ["pragian", "Pragian", "age", 413.02, 410.62, "early-devonian"],
  ["emsian", "Emsian", "age", 410.62, 393.47, "early-devonian"],
  ["eifelian", "Eifelian", "age", 393.47, 387.95, "middle-devonian"],
  ["givetian", "Givetian", "age", 387.95, 382.31, "middle-devonian"],
  ["frasnian", "Frasnian", "age", 382.31, 372.15, "late-devonian"],
  ["famennian", "Famennian", "age", 372.15, 358.86, "late-devonian"],

  // --- Carboniferous epochs + ages ---
  ["mississippian", "Mississippian", "epoch", 358.86, 323.4, "carboniferous"],
  ["pennsylvanian", "Pennsylvanian", "epoch", 323.4, 298.9, "carboniferous"],
  ["tournaisian", "Tournaisian", "age", 358.86, 346.7, "mississippian"],
  ["visean", "Visean", "age", 346.7, 330.3, "mississippian"],
  ["serpukhovian", "Serpukhovian", "age", 330.3, 323.4, "mississippian"],
  ["bashkirian", "Bashkirian", "age", 323.4, 315.2, "pennsylvanian"],
  ["moscovian", "Moscovian", "age", 315.2, 307, "pennsylvanian"],
  ["kasimovian", "Kasimovian", "age", 307, 303.7, "pennsylvanian"],
  ["gzhelian", "Gzhelian", "age", 303.7, 298.9, "pennsylvanian"],

  // --- Permian epochs + ages ---
  ["cisuralian", "Cisuralian", "epoch", 298.9, 283.3, "permian"],
  ["guadalupian", "Guadalupian", "epoch", 283.3, 259.51, "permian"],
  ["lopingian", "Lopingian", "epoch", 259.51, 251.902, "permian"],
  ["asselian", "Asselian", "age", 298.9, 293.52, "cisuralian"],
  ["sakmarian", "Sakmarian", "age", 293.52, 290.1, "cisuralian"],
  ["artinskian", "Artinskian", "age", 290.1, 283.3, "cisuralian"],
  ["kungurian", "Kungurian", "age", 283.3, 274.4, "cisuralian"],
  ["roadian", "Roadian", "age", 274.4, 266.9, "guadalupian"],
  ["wordian", "Wordian", "age", 266.9, 264.28, "guadalupian"],
  ["capitanian", "Capitanian", "age", 264.28, 259.51, "guadalupian"],
  ["wuchiapingian", "Wuchiapingian", "age", 259.51, 254.14, "lopingian"],
  ["changhsingian", "Changhsingian", "age", 254.14, 251.902, "lopingian"],

  // --- Triassic epochs + ages ---
  ["early-triassic", "Early Triassic", "epoch", 251.902, 246.7, "triassic"],
  ["middle-triassic", "Middle Triassic", "epoch", 246.7, 237, "triassic"],
  ["late-triassic", "Late Triassic", "epoch", 237, 201.4, "triassic"],
  ["induan", "Induan", "age", 251.902, 249.9, "early-triassic"],
  ["olenekian", "Olenekian", "age", 249.9, 246.7, "early-triassic"],
  ["anisian", "Anisian", "age", 246.7, 241.464, "middle-triassic"],
  ["ladinian", "Ladinian", "age", 241.464, 237, "middle-triassic"],
  ["carnian", "Carnian", "age", 237, 227.3, "late-triassic"],
  ["norian", "Norian", "age", 227.3, 205.7, "late-triassic"],
  ["rhaetian", "Rhaetian", "age", 205.7, 201.4, "late-triassic"],

  // --- Jurassic epochs + ages ---
  ["early-jurassic", "Early Jurassic", "epoch", 201.4, 174.7, "jurassic"],
  ["middle-jurassic", "Middle Jurassic", "epoch", 174.7, 161.5, "jurassic"],
  ["late-jurassic", "Late Jurassic", "epoch", 161.5, 143.1, "jurassic"],
  ["hettangian", "Hettangian", "age", 201.4, 199.5, "early-jurassic"],
  ["sinemurian", "Sinemurian", "age", 199.5, 192.9, "early-jurassic"],
  ["pliensbachian", "Pliensbachian", "age", 192.9, 184.2, "early-jurassic"],
  ["toarcian", "Toarcian", "age", 184.2, 174.7, "early-jurassic"],
  ["aalenian", "Aalenian", "age", 174.7, 170.9, "middle-jurassic"],
  ["bajocian", "Bajocian", "age", 170.9, 168.2, "middle-jurassic"],
  ["bathonian", "Bathonian", "age", 168.2, 165.3, "middle-jurassic"],
  ["callovian", "Callovian", "age", 165.3, 161.5, "middle-jurassic"],
  ["oxfordian", "Oxfordian", "age", 161.5, 154.8, "late-jurassic"],
  ["kimmeridgian", "Kimmeridgian", "age", 154.8, 149.2, "late-jurassic"],
  ["tithonian", "Tithonian", "age", 149.2, 143.1, "late-jurassic"],

  // --- Cretaceous epochs + ages ---
  ["early-cretaceous", "Early Cretaceous", "epoch", 143.1, 100.5, "cretaceous"],
  ["late-cretaceous", "Late Cretaceous", "epoch", 100.5, 66, "cretaceous"],
  ["berriasian", "Berriasian", "age", 143.1, 137.05, "early-cretaceous"],
  ["valanginian", "Valanginian", "age", 137.05, 132.6, "early-cretaceous"],
  ["hauterivian", "Hauterivian", "age", 132.6, 125.77, "early-cretaceous"],
  ["barremian", "Barremian", "age", 125.77, 121.4, "early-cretaceous"],
  ["aptian", "Aptian", "age", 121.4, 113.2, "early-cretaceous"],
  ["albian", "Albian", "age", 113.2, 100.5, "early-cretaceous"],
  ["cenomanian", "Cenomanian", "age", 100.5, 93.9, "late-cretaceous"],
  ["turonian", "Turonian", "age", 93.9, 89.8, "late-cretaceous"],
  ["coniacian", "Coniacian", "age", 89.8, 85.7, "late-cretaceous"],
  ["santonian", "Santonian", "age", 85.7, 83.6, "late-cretaceous"],
  ["campanian", "Campanian", "age", 83.6, 72.2, "late-cretaceous"],
  ["maastrichtian", "Maastrichtian", "age", 72.2, 66, "late-cretaceous"],

  // --- Cenozoic epochs (custom ICS colours) + ages ---
  ["paleocene", "Paleocene", "epoch", 66, 56, "paleogene"],
  ["eocene", "Eocene", "epoch", 56, 33.9, "paleogene"],
  ["oligocene", "Oligocene", "epoch", 33.9, 23.04, "paleogene"],
  ["miocene", "Miocene", "epoch", 23.04, 5.333, "neogene"],
  ["pliocene", "Pliocene", "epoch", 5.333, 2.58, "neogene"],
  ["pleistocene", "Pleistocene", "epoch", 2.58, 0.0117, "quaternary"],
  ["holocene", "Holocene", "epoch", 0.0117, 0, "quaternary"],
  ["danian", "Danian", "age", 66, 61.66, "paleocene"],
  ["selandian", "Selandian", "age", 61.66, 59.24, "paleocene"],
  ["thanetian", "Thanetian", "age", 59.24, 56, "paleocene"],
  ["ypresian", "Ypresian", "age", 56, 48.07, "eocene"],
  ["lutetian", "Lutetian", "age", 48.07, 41.03, "eocene"],
  ["bartonian", "Bartonian", "age", 41.03, 37.71, "eocene"],
  ["priabonian", "Priabonian", "age", 37.71, 33.9, "eocene"],
  ["rupelian", "Rupelian", "age", 33.9, 27.3, "oligocene"],
  ["chattian", "Chattian", "age", 27.3, 23.04, "oligocene"],
  ["aquitanian", "Aquitanian", "age", 23.04, 20.45, "miocene"],
  ["burdigalian", "Burdigalian", "age", 20.45, 15.98, "miocene"],
  ["langhian", "Langhian", "age", 15.98, 13.82, "miocene"],
  ["serravallian", "Serravallian", "age", 13.82, 11.63, "miocene"],
  ["tortonian", "Tortonian", "age", 11.63, 7.246, "miocene"],
  ["messinian", "Messinian", "age", 7.246, 5.333, "miocene"],
  ["zanclean", "Zanclean", "age", 5.333, 3.6, "pliocene"],
  ["piacenzian", "Piacenzian", "age", 3.6, 2.58, "pliocene"],
  ["gelasian", "Gelasian", "age", 2.58, 1.8, "pleistocene"],
  ["calabrian", "Calabrian", "age", 1.8, 0.774, "pleistocene"],
  ["chibanian", "Chibanian", "age", 0.774, 0.129, "pleistocene"],
  ["tarantian", "Tarantian", "age", 0.129, 0.0117, "pleistocene"],
  ["greenlandian", "Greenlandian", "age", 0.0117, 0.0082, "holocene"],
  ["northgrippian", "Northgrippian", "age", 0.0082, 0.0042, "holocene"],
  ["meghalayan", "Meghalayan", "age", 0.0042, 0, "holocene"],
];

// Wikipedia article slug overrides where the plain name collides with a place.
const URL_OVERRIDE: Record<string, string> = {
  mississippian: "Mississippian_(geology)",
  pennsylvanian: "Pennsylvanian_(geology)",
  llandovery: "Llandovery_Epoch",
  wenlock: "Wenlock_Epoch",
  ludlow: "Ludlow_Epoch",
  pridoli: "Pridoli_Epoch",
};
function wikiUrl(id: string, name: string): string {
  const slug = URL_OVERRIDE[id] ?? name.replace(/ /g, "_");
  return `https://en.wikipedia.org/wiki/${slug}`;
}

// Official ICS colours, keyed by normalized isc name (reference/extract-ics-colors.py).
const officialColors: Record<string, string> = JSON.parse(
  readFileSync(fileURLToPath(new URL("./ics-colors.json", import.meta.url)), "utf8"),
);
// The chart names sub-units Lower/Upper where we use early/late; a couple of
// stages have no eponymous chart entry (manual aliases).
const COLOR_ALIAS: Record<string, string> = { tarantian: "upperpleistocenestage" };
function officialColor(id: string): string | undefined {
  if (COLOR_ALIAS[id]) return officialColors[COLOR_ALIAS[id]];
  const key = id
    .replace(/^early-/, "lower-")
    .replace(/^late-/, "upper-")
    .replace(/[^a-z0-9]/g, "");
  return officialColors[key];
}

// Resolve each unit's colour: prefer its official ICS colour, otherwise inherit
// the nearest ancestor's (covers the few uncoloured units, e.g. Meso/Neo-
// proterozoic eras).
const byId = new Map(defs.map((d) => [d[0], d]));
function resolveColor(id: string): string {
  let cur: Def | undefined = byId.get(id);
  while (cur) {
    const off = officialColor(cur[0]);
    if (off) return off;
    cur = cur[5] ? byId.get(cur[5]) : undefined;
  }
  return "#CCCCCC";
}

const intervals = defs.map(([id, name, rank, startMa, endMa, parentId]) => ({
  id,
  name,
  rank,
  startMa,
  endMa,
  parentId,
  color: resolveColor(id),
  url: wikiUrl(id, name),
}));

const body = intervals.map((iv) => "    " + JSON.stringify(iv)).join(",\n");
const out = `{\n  "version": 1,\n  "intervals": [\n${body}\n  ]\n}\n`;

const path = fileURLToPath(new URL("../../../data/gts.json", import.meta.url));
writeFileSync(path, out);
console.log(`Wrote ${intervals.length} intervals to data/gts.json`);
