import axios from 'axios';
import * as sharp from 'sharp';

export interface DominantColors {
  primary: string;
  secondary: string;
  accent: string;
}

/**
 * Extract dominant colors from image using pixel analysis
 * No AI required - pure algorithmic approach
 */
export async function extractColorsFromImage(imageUrl: string): Promise<DominantColors> {
  try {
    // Skip SVG files (sharp doesn't support SVG well)
    if (imageUrl.toLowerCase().endsWith('.svg')) {
      throw new Error('SVG format not supported for color extraction');
    }

    // Download image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      maxContentLength: 5 * 1024 * 1024, // 5MB max
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DockPulse/1.0)',
      },
    });

    // Resize to small size for faster processing
    const imageBuffer = await sharp(Buffer.from(response.data))
      .resize(100, 100, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = imageBuffer;
    const pixels: number[][] = [];

    // Extract RGB values
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = info.channels === 4 ? data[i + 3] : 255;

      // Skip transparent and near-white/black pixels
      if (a > 128 && !isNearWhite(r, g, b) && !isNearBlack(r, g, b)) {
        pixels.push([r, g, b]);
      }
    }

    if (pixels.length === 0) {
      throw new Error('No valid pixels found');
    }

    // Simple k-means clustering to find 3 dominant colors
    const clusters = kMeansClustering(pixels, 3);

    return {
      primary: rgbToHex(clusters[0]),
      secondary: rgbToHex(clusters[1]),
      accent: rgbToHex(clusters[2]),
    };
  } catch (error) {
    throw new Error(`Color extraction failed: ${error.message}`);
  }
}

/**
 * Simple k-means clustering
 */
function kMeansClustering(pixels: number[][], k: number): number[][] {
  // Initialize centroids randomly
  const centroids: number[][] = [];
  for (let i = 0; i < k; i++) {
    centroids.push([...pixels[Math.floor(Math.random() * pixels.length)]]);
  }

  // Iterate to convergence (max 10 iterations)
  for (let iter = 0; iter < 10; iter++) {
    const clusters: number[][][] = Array(k).fill(null).map(() => []);

    // Assign pixels to nearest centroid
    for (const pixel of pixels) {
      let minDist = Infinity;
      let closestCluster = 0;

      for (let i = 0; i < k; i++) {
        const dist = colorDistance(pixel, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          closestCluster = i;
        }
      }

      clusters[closestCluster].push(pixel);
    }

    // Update centroids
    for (let i = 0; i < k; i++) {
      if (clusters[i].length > 0) {
        centroids[i] = averageColor(clusters[i]);
      }
    }
  }

  return centroids;
}

/**
 * Calculate Euclidean distance between two colors
 */
function colorDistance(c1: number[], c2: number[]): number {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) +
    Math.pow(c1[1] - c2[1], 2) +
    Math.pow(c1[2] - c2[2], 2)
  );
}

/**
 * Calculate average color from array of pixels
 */
function averageColor(pixels: number[][]): number[] {
  const sum = pixels.reduce(
    (acc, pixel) => {
      acc[0] += pixel[0];
      acc[1] += pixel[1];
      acc[2] += pixel[2];
      return acc;
    },
    [0, 0, 0]
  );

  return [
    Math.round(sum[0] / pixels.length),
    Math.round(sum[1] / pixels.length),
    Math.round(sum[2] / pixels.length),
  ];
}

/**
 * Convert RGB to HEX
 */
function rgbToHex(rgb: number[]): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
}

/**
 * Check if color is near white (RGB > 240)
 */
function isNearWhite(r: number, g: number, b: number): boolean {
  return r > 240 && g > 240 && b > 240;
}

/**
 * Check if color is near black (RGB < 15)
 */
function isNearBlack(r: number, g: number, b: number): boolean {
  return r < 15 && g < 15 && b < 15;
}
