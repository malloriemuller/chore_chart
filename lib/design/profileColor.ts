/** Derives a profile's `tint`, `base`, and `deep` shades from its stored hex color (section 10a). */

export const PROFILE_COLOR_PRESETS = [
  { name: "Sage", hex: "#8DB596" },
  { name: "Sky", hex: "#7FB2D9" },
  { name: "Clay", hex: "#D98E6C" },
  { name: "Lilac", hex: "#A993CF" },
  { name: "Butter", hex: "#E6C565" },
  { name: "Rose", hex: "#D98BA0" },
  { name: "Teal", hex: "#5FA8A0" },
  { name: "Slate", hex: "#8A94A6" },
] as const;

type Rgb = [number, number, number];

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/**
 * Airtable records can be hand-edited outside the app's own forms (no Color set,
 * or a non-hex value typed in), so this is the one place that guarantees every
 * Profile has a valid hex color before it reaches color math or CSS.
 */
export function normalizeProfileColor(value: string | undefined): string {
  return value && HEX_COLOR_PATTERN.test(value) ? value : PROFILE_COLOR_PRESETS[0].hex;
}

function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return [r, g, b];
}

function rgbToHex([r, g, b]: Rgb): string {
  const toHex = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function relativeLuminance([r, g, b]: Rgb): number {
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const AA_CONTRAST = 4.5;
const DEFAULT_BACKGROUND_HEX = "#F7F3EC"; // --bg light

/** 12%-opacity wash, used as the column background. */
export function profileTint(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
}

/** The stored color itself, used for the column header and checkbox fill. */
export function profileBase(hex: string): string {
  return hex;
}

/** The stored color, darkened until it reads at AA contrast as text on the tint wash. */
export function profileDeep(hex: string, backgroundHex: string = DEFAULT_BACKGROUND_HEX): string {
  const backgroundRgb = hexToRgb(backgroundHex);
  let rgb = hexToRgb(hex);

  for (let i = 0; i < 24 && contrastRatio(rgb, backgroundRgb) < AA_CONTRAST; i++) {
    rgb = rgb.map((channel) => channel * 0.9) as Rgb;
  }

  return rgbToHex(rgb);
}
