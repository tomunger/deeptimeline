/**
 * Approximate ICS (International Commission on Stratigraphy) chart colors,
 * keyed by interval name. These are close to the official CGMW palette but
 * should be replaced with exact ICS RGB values during data refinement.
 */
export const ICS_COLORS: Record<string, string> = {
  // Eons
  Hadean: "#A300A3",
  Archean: "#F0047F",
  Proterozoic: "#F73563",
  Phanerozoic: "#9AD9DD",

  // Phanerozoic eras
  Paleozoic: "#99C08D",
  Mesozoic: "#67C5CA",
  Cenozoic: "#F2F91D",

  // Paleozoic periods
  Cambrian: "#7FA056",
  Ordovician: "#009270",
  Silurian: "#B3E1B6",
  Devonian: "#CB8C37",
  Carboniferous: "#67A599",
  Permian: "#F04028",

  // Mesozoic periods
  Triassic: "#812B92",
  Jurassic: "#34B2C9",
  Cretaceous: "#7FC64E",

  // Cenozoic periods
  Paleogene: "#FD9A52",
  Neogene: "#FFE619",
  Quaternary: "#F9F97F",

  // Cenozoic epochs
  Paleocene: "#FDA75F",
  Eocene: "#FDB46C",
  Oligocene: "#FDC07A",
  Miocene: "#FFFF00",
  Pliocene: "#FFFF99",
  Pleistocene: "#FFF2AE",
  Holocene: "#FEF2E0",
};

export const GTS_FALLBACK_COLOR = "#CCCCCC";
