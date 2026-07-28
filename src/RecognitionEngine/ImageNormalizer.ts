import { Point } from './StrokeProcessor';

export interface MultiResGrids {
  grid224: number[][]; // 224x224 High-res for Geometry & Contour
  grid64: number[][];  // 64x64 Mid-res for Reference Matching
  grid28: number[][];  // 28x28 Low-res for Neural Classifier
  box: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
  centeredShift: { dx: number; dy: number };
  scaleFactor: number;
  totalInkPixels28: number;
  totalInkPixels224: number;
}

/**
 * Helper to render vector strokes onto an NxN grayscale grid (0-255)
 */
function renderStrokesToGrid(
  strokes: Point[][],
  targetSize: number,
  box: { minX: number; minY: number; width: number; height: number },
  paddingRatio = 0.12,
  lineWidth = 1.8
): number[][] {
  const grid: number[][] = Array(targetSize).fill(0).map(() => Array(targetSize).fill(0));
  if (strokes.length === 0 || box.width === 0 || box.height === 0) return grid;

  const maxDim = Math.max(box.width, box.height);
  const drawAreaSize = targetSize * (1 - 2 * paddingRatio);
  const scale = drawAreaSize / maxDim;

  const offsetX = (targetSize - box.width * scale) / 2 - box.minX * scale;
  const offsetY = (targetSize - box.height * scale) / 2 - box.minY * scale;

  for (const stroke of strokes) {
    if (stroke.length < 2) continue;
    for (let i = 1; i < stroke.length; i++) {
      const p1 = { x: stroke[i - 1].x * scale + offsetX, y: stroke[i - 1].y * scale + offsetY };
      const p2 = { x: stroke[i].x * scale + offsetX, y: stroke[i].y * scale + offsetY };

      // Rasterize line segment onto grid using Bresenham / anti-aliased interpolation
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const steps = Math.max(1, Math.ceil(dist * 2));

      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const cx = Math.round(p1.x + t * (p2.x - p1.x));
        const cy = Math.round(p1.y + t * (p2.y - p1.y));

        // Apply brush radius
        const r = Math.max(1, Math.round((lineWidth * targetSize) / 100));
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const gx = cx + dx;
            const gy = cy + dy;
            if (gx >= 0 && gx < targetSize && gy >= 0 && gy < targetSize) {
              const dSq = dx * dx + dy * dy;
              if (dSq <= r * r) {
                const val = Math.min(255, grid[gy][gx] + 180);
                grid[gy][gx] = val;
              }
            }
          }
        }
      }
    }
  }

  return grid;
}

/**
 * Stage 2: Image Normalizer
 * Computes bounding box, crops whitespace, centers object, maintains aspect ratio,
 * and generates 224x224, 64x64, and 28x28 normalized grayscale grids.
 */
export function normalizeDrawingImages(strokes: Point[][]): MultiResGrids {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const stroke of strokes) {
    for (const p of stroke) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }

  if (minX === Infinity) {
    minX = 0; minY = 0; maxX = 100; maxY = 100;
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const box = { minX, minY, maxX, maxY, width, height };

  const grid224 = renderStrokesToGrid(strokes, 224, box, 0.10, 1.5);
  const grid64 = renderStrokesToGrid(strokes, 64, box, 0.12, 1.8);
  const grid28 = renderStrokesToGrid(strokes, 28, box, 0.14, 2.2);

  let totalInkPixels28 = 0;
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      if (grid28[y][x] > 20) totalInkPixels28++;
    }
  }

  let totalInkPixels224 = 0;
  for (let y = 0; y < 224; y += 2) {
    for (let x = 0; x < 224; x += 2) {
      if (grid224[y][x] > 20) totalInkPixels224++;
    }
  }

  const drawCenterX = (minX + maxX) / 2;
  const drawCenterY = (minY + maxY) / 2;

  return {
    grid224,
    grid64,
    grid28,
    box,
    centeredShift: { dx: drawCenterX, dy: drawCenterY },
    scaleFactor: 224 / Math.max(width, height),
    totalInkPixels28,
    totalInkPixels224
  };
}
