/**
 * Color Utility Functions
 * Generate color shades and manipulate colors
 */

/**
 * Generate color shades from a base color
 * Returns shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900
 */
export function generateColorShades(hexColor: string): Record<string, string> {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return {};

  const shades: Record<string, string> = {};

  // Light shades (50-400)
  const lightFactors = [0.95, 0.9, 0.8, 0.6, 0.4];
  [50, 100, 200, 300, 400].forEach((shade, index) => {
    shades[shade] = lightenColor(rgb, lightFactors[index]);
  });

  // Base (500)
  shades[500] = hexColor;

  // Dark shades (600-900)
  const darkFactors = [0.1, 0.25, 0.4, 0.55];
  [600, 700, 800, 900].forEach((shade, index) => {
    shades[shade] = darkenColor(rgb, darkFactors[index]);
  });

  return shades;
}

/**
 * Convert HEX to RGB
 */
export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to HEX
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

/**
 * Lighten a color by a factor (0-1)
 */
export function lightenColor(
  rgb: { r: number; g: number; b: number },
  factor: number
): string {
  const r = Math.round(rgb.r + (255 - rgb.r) * factor);
  const g = Math.round(rgb.g + (255 - rgb.g) * factor);
  const b = Math.round(rgb.b + (255 - rgb.b) * factor);
  return rgbToHex(r, g, b);
}

/**
 * Darken a color by a factor (0-1)
 */
export function darkenColor(
  rgb: { r: number; g: number; b: number },
  factor: number
): string {
  const r = Math.round(rgb.r * (1 - factor));
  const g = Math.round(rgb.g * (1 - factor));
  const b = Math.round(rgb.b * (1 - factor));
  return rgbToHex(r, g, b);
}

/**
 * Get contrasting text color (black or white) for a background
 */
export function getContrastColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return '#000000';

  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Check if a color is valid HEX format
 */
export function isValidHex(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Generate a complementary color
 */
export function getComplementaryColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;

  return rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
}

/**
 * Generate analogous colors (colors next to each other on color wheel)
 */
export function getAnalogousColors(
  hexColor: string
): { left: string; right: string } {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return { left: hexColor, right: hexColor };

  // Convert to HSL, shift hue by 30 degrees
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const leftHsl = { ...hsl, h: (hsl.h - 30 + 360) % 360 };
  const rightHsl = { ...hsl, h: (hsl.h + 30) % 360 };

  return {
    left: hslToHex(leftHsl.h, leftHsl.s, leftHsl.l),
    right: hslToHex(rightHsl.h, rightHsl.s, rightHsl.l),
  };
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to HEX
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  );
}
