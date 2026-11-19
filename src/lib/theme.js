/* Material You dynamic color: one seed color -> full M3 light/dark scheme as CSS custom properties. */
import { argbFromHex, hexFromArgb, Hct, SchemeFidelity, MaterialDynamicColors, TonalPalette, Blend } from "@material/material-color-utilities";

export const SEEDS = [
  { hex: "#d4202f", name: "Kırmızı" },
  { hex: "#6750a4", name: "Mor" },
  { hex: "#1b6ef3", name: "Mavi" },
  { hex: "#0f8a5f", name: "Yeşil" },
  { hex: "#c77700", name: "Turuncu" },
];

const kebab = (s) => s.replace(/_/g, "-").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
const colors = new MaterialDynamicColors().allColors;
const valid = (hex) => (/^#[0-9a-f]{6}$/i.test(hex || "") ? hex : SEEDS[0].hex);

/** All color custom properties for one seed and mode. Fidelity keeps the seed's chroma, so brand colors stay vivid. */
export function schemeVars(seedHex, dark) {
  const seed = argbFromHex(valid(seedHex)), scheme = new SchemeFidelity(Hct.fromInt(seed), dark, 0), o = {};
  colors.forEach((c) => (o["--md-sys-color-" + kebab(c.name)] = hexFromArgb(c.getArgb(scheme))));
  // fixed semantic colors, harmonized toward the seed so they sit in the palette
  const h = (hex, tl, td) => hexFromArgb(TonalPalette.fromInt(Blend.harmonize(argbFromHex(hex), seed)).tone(dark ? td : tl));
  Object.assign(o, {
    "--app-win": h("#1e9e5a", 45, 75), "--app-gold": h("#f2b300", 70, 80), "--app-on-gold": h("#f2b300", 15, 15),
    "--app-gold-container": h("#f2b300", 94, 25), "--app-silver": dark ? "#c4c7cf" : "#9aa0ab", "--app-bronze": h("#c46a2b", 55, 70),
  });
  return o;
}

const block = (o) => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(";");
/** Server-rendered theme for the CMS color: follows the OS with no script; [data-theme] forces a visitor's explicit choice. */
export const themeCss = (seedHex) => {
  const L = block(schemeVars(seedHex, false)), D = block(schemeVars(seedHex, true));
  return `:root{${L}}@media (prefers-color-scheme: dark){:root:not([data-theme=light]){${D}}}:root[data-theme=dark]{${D}}`;
};

/** Client override when a visitor picks another seed; null restores the server theme. */
export function applySeed(seedHex, dark) {
  const st = document.documentElement.style;
  Object.keys(schemeVars(SEEDS[0].hex, dark)).forEach((k) => st.removeProperty(k));
  if (seedHex) Object.entries(schemeVars(seedHex, dark)).forEach(([k, v]) => st.setProperty(k, v));
}

/* Team crests: a tonal pair per hue for both modes. */
const crestCache = new Map();
export function crestColors(hue) {
  if (!crestCache.has(hue)) {
    const p = TonalPalette.fromHueAndChroma(hue, 56);
    crestCache.set(hue, { "--cr-l": hexFromArgb(p.tone(40)), "--cr-on-l": hexFromArgb(p.tone(98)), "--cr-d": hexFromArgb(p.tone(80)), "--cr-on-d": hexFromArgb(p.tone(15)) });
  }
  return crestCache.get(hue);
}
