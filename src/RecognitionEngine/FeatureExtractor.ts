import { Point, ProcessedStrokes } from './StrokeProcessor';
import { MultiResGrids } from './ImageNormalizer';
import { DrawingFeatures } from '../types';

export interface ExtendedDrawingFeatures extends DrawingFeatures {
  hullArea: number;
  solidity: number; // inkArea / hullArea
  extent: number;   // inkArea / boxArea
  compactness: number;
  huMoments: number[];
  symmetryDiagonal: number;
  peakCount: number;
  valleyCount: number;
  closureDistance: number;
  endpointsCount: number;
  junctionsCount: number;
  isClosedLoop30: boolean;
  isClosedLoop45: boolean;
}

/**
 * Calculates 7 invariant Hu Moments from a grayscale grid
 */
export function calculateHuMomentsFromGrid(grid: number[][]): number[] {
  const h = grid.length;
  const w = grid[0]?.length || 0;
  let m00 = 0, m10 = 0, m01 = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const val = grid[y][x];
      if (val > 20) {
        m00 += val;
        m10 += x * val;
        m01 += y * val;
      }
    }
  }

  if (m00 === 0) return [0, 0, 0, 0, 0, 0, 0];

  const cx = m10 / m00;
  const cy = m01 / m00;

  let mu20 = 0, mu02 = 0, mu11 = 0, mu30 = 0, mu12 = 0, mu21 = 0, mu03 = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const val = grid[y][x];
      if (val > 20) {
        const dx = x - cx;
        const dy = y - cy;
        mu20 += dx * dx * val;
        mu02 += dy * dy * val;
        mu11 += dx * dy * val;
        mu30 += dx * dx * dx * val;
        mu12 += dx * dy * dy * val;
        mu21 += dx * dx * dy * val;
        mu03 += dy * dy * dy * val;
      }
    }
  }

  const norm20 = mu20 / Math.pow(m00, 2);
  const norm02 = mu02 / Math.pow(m00, 2);
  const norm11 = mu11 / Math.pow(m00, 2);
  const norm30 = mu30 / Math.pow(m00, 2.5);
  const norm12 = mu12 / Math.pow(m00, 2.5);
  const norm21 = mu21 / Math.pow(m00, 2.5);
  const norm03 = mu03 / Math.pow(m00, 2.5);

  const h1 = norm20 + norm02;
  const h2 = Math.pow(norm20 - norm02, 2) + 4 * Math.pow(norm11, 2);
  const h3 = Math.pow(norm30 - 3 * norm21, 2) + Math.pow(3 * norm12 - norm03, 2);
  const h4 = Math.pow(norm30 + norm12, 2) + Math.pow(norm21 + norm03, 2);
  const h5 = (norm30 - 3 * norm21) * (norm30 + norm12) * (Math.pow(norm30 + norm12, 2) - 3 * Math.pow(norm21 + norm03, 2)) +
             (3 * norm12 - norm03) * (norm21 + norm03) * (3 * Math.pow(norm30 + norm12, 2) - Math.pow(norm21 + norm03, 2));
  const h6 = (norm20 - norm02) * (Math.pow(norm30 + norm12, 2) - Math.pow(norm21 + norm03, 2)) +
             4 * norm11 * (norm30 + norm12) * (norm21 + norm03);
  const h7 = (3 * norm12 - norm03) * (norm30 + norm12) * (Math.pow(norm30 + norm12, 2) - 3 * Math.pow(norm21 + norm03, 2)) -
             (norm30 - 3 * norm21) * (norm21 + norm03) * (3 * Math.pow(norm30 + norm12, 2) - Math.pow(norm21 + norm03, 2));

  return [h1, h2, h3, h4, h5, h6, h7].map(v => {
    if (Math.abs(v) < 1e-15) return 0;
    return Math.sign(v) * Math.log10(Math.abs(v));
  });
}

/**
 * Calculates contour closure distance between start and end stroke points
 */
function calculateClosureDistance(strokes: Point[][]): number {
  if (strokes.length === 0) return 999;
  const allPoints = strokes.flat();
  if (allPoints.length < 3) return 999;

  const first = allPoints[0];
  const last = allPoints[allPoints.length - 1];
  const endDist = Math.hypot(last.x - first.x, last.y - first.y);

  let minCrossDist = endDist;
  for (let i = 0; i < strokes.length; i++) {
    const s1 = strokes[i];
    if (s1.length === 0) continue;
    const startP = s1[0];
    const endP = s1[s1.length - 1];

    for (let j = i + 1; j < strokes.length; j++) {
      const s2 = strokes[j];
      if (s2.length === 0) continue;
      const d1 = Math.hypot(s2[0].x - startP.x, s2[0].y - startP.y);
      const d2 = Math.hypot(s2[s2.length - 1].x - endP.x, s2[s2.length - 1].y - endP.y);
      minCrossDist = Math.min(minCrossDist, d1, d2);
    }
  }

  return Math.round(minCrossDist);
}

/**
 * Counts connected components on 28x28 grid
 */
function countConnectedComponents(grid28: number[][]): number {
  const visited: boolean[][] = Array(28).fill(false).map(() => Array(28).fill(false));
  let count = 0;

  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      if (grid28[y][x] > 20 && !visited[y][x]) {
        count++;
        // BFS
        const queue: [number, number][] = [[x, y]];
        visited[y][x] = true;

        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!;
          const neighbors = [
            [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1],
            [cx + 1, cy + 1], [cx - 1, cy - 1], [cx + 1, cy - 1], [cx - 1, cy + 1]
          ];
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < 28 && ny >= 0 && ny < 28 && grid28[ny][nx] > 20 && !visited[ny][nx]) {
              visited[ny][nx] = true;
              queue.push([nx, ny]);
            }
          }
        }
      }
    }
  }

  return Math.max(1, count);
}

/**
 * Stage 3: Feature Extractor
 * Extracts comprehensive geometric, topological, corner, contour, and Hu Moment features.
 */
export function extractRichFeatures(
  processed: ProcessedStrokes,
  grids: MultiResGrids
): ExtendedDrawingFeatures {
  const { cleanedStrokes, totalStrokeLength, strokeCount } = processed;
  const { box, grid28, grid224, totalInkPixels28 } = grids;

  const width = box.width;
  const height = box.height;
  const aspectRatio = Number((width / Math.max(1, height)).toFixed(2));
  const density = Number((totalInkPixels28 / (28 * 28)).toFixed(4));

  // Closed loop detection via flood-fill on 28x28
  let closedLoopCount = 0;
  const visited28: boolean[][] = Array(28).fill(false).map(() => Array(28).fill(false));
  for (let y = 1; y < 27; y++) {
    for (let x = 1; x < 27; x++) {
      if (grid28[y][x] <= 20 && !visited28[y][x]) {
        let isEnclosed = true;
        let area = 0;
        const queue: [number, number][] = [[x, y]];
        visited28[y][x] = true;

        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!;
          area++;
          if (cx === 0 || cx === 27 || cy === 0 || cy === 27) {
            isEnclosed = false;
          }
          const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < 28 && ny >= 0 && ny < 28 && grid28[ny][nx] <= 20 && !visited28[ny][nx]) {
              visited28[ny][nx] = true;
              queue.push([nx, ny]);
            }
          }
        }

        if (isEnclosed && area >= 2 && area <= 300) {
          closedLoopCount++;
        }
      }
    }
  }

  const closureDistance = calculateClosureDistance(cleanedStrokes);
  const isClosedLoop30 = closedLoopCount > 0 && closureDistance <= 35;
  const isClosedLoop45 = closedLoopCount > 0 || closureDistance <= 45;
  const hasClosedLoop = isClosedLoop30;

  // Corner detection with min segment length filter (angle 55° to 135°)
  let cornerCount = 0;
  cleanedStrokes.forEach(stroke => {
    if (stroke.length < 6) return;
    for (let i = 3; i < stroke.length - 3; i++) {
      const pPrev = stroke[i - 3];
      const pCurr = stroke[i];
      const pNext = stroke[i + 3];

      const dx1 = pCurr.x - pPrev.x;
      const dy1 = pCurr.y - pPrev.y;
      const dx2 = pNext.x - pCurr.x;
      const dy2 = pNext.y - pCurr.y;

      const len1 = Math.hypot(dx1, dy1);
      const len2 = Math.hypot(dx2, dy2);

      if (len1 > 8 && len2 > 8) {
        const dot = dx1 * dx2 + dy1 * dy2;
        const cosAngle = Math.max(-1, Math.min(1, dot / (len1 * len2)));
        const angleDeg = Math.acos(cosAngle) * (180 / Math.PI);

        if (angleDeg >= 55 && angleDeg <= 135) {
          cornerCount++;
          i += 5; // Step past corner
        }
      }
    }
  });

  // Perimeter and Circularity
  const perimeter = totalStrokeLength;
  const areaFromPerimeter = (box.width * box.height) * 0.7;
  const circularity = Number(Math.min(1.0, (4 * Math.PI * areaFromPerimeter) / Math.max(1, perimeter * perimeter)).toFixed(2));

  // Symmetry
  let topHalfInk = 0, bottomHalfInk = 0, leftHalfInk = 0, rightHalfInk = 0, diagInk = 0;
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      if (grid28[y][x] > 20) {
        if (y < 14) topHalfInk++; else bottomHalfInk++;
        if (x < 14) leftHalfInk++; else rightHalfInk++;
        if (x === y || Math.abs(x - y) <= 2) diagInk++;
      }
    }
  }

  const totalInk = Math.max(1, totalInkPixels28);
  const symH = Number((1 - Math.abs(topHalfInk - bottomHalfInk) / totalInk).toFixed(2));
  const symV = Number((1 - Math.abs(leftHalfInk - rightHalfInk) / totalInk).toFixed(2));
  const symmetryDiagonal = Number((diagInk / totalInk).toFixed(2));

  const topHeavyRatio = Number((topHalfInk / totalInk).toFixed(2));
  const leftHeavyRatio = Number((leftHalfInk / totalInk).toFixed(2));

  // Straight line check
  const allPoints = cleanedStrokes.flat();
  const endpointDistance = allPoints.length >= 2 ?
    Math.hypot(allPoints[allPoints.length - 1].x - allPoints[0].x, allPoints[allPoints.length - 1].y - allPoints[0].y) : 0;

  const isStraightLine = strokeCount <= 2 && cornerCount === 0 && (endpointDistance / Math.max(1, totalStrokeLength)) >= 0.85;

  const connectedComponentsCount = countConnectedComponents(grid28);
  const huMoments = calculateHuMomentsFromGrid(grid28);

  const hullArea = Math.round(width * height * 0.82);
  const solidity = Number((totalInkPixels28 * 25 / Math.max(1, hullArea)).toFixed(2));
  const extent = Number((totalInkPixels28 * 25 / Math.max(1, width * height)).toFixed(2));
  const compactness = Number((totalStrokeLength / Math.max(1, Math.sqrt(width * height))).toFixed(2));

  // Peaks and Valleys
  let peakCount = 0, valleyCount = 0;
  cleanedStrokes.forEach(s => {
    for (let i = 2; i < s.length - 2; i++) {
      if (s[i].y < s[i - 2].y && s[i].y < s[i + 2].y && (s[i - 2].y - s[i].y) > 10) peakCount++;
      if (s[i].y > s[i - 2].y && s[i].y > s[i + 2].y && (s[i].y - s[i - 2].y) > 10) valleyCount++;
    }
  });

  return {
    aspectRatio,
    density,
    circularity,
    symmetryHorizontal: symH,
    symmetryVertical: symV,
    topHeavyRatio,
    leftHeavyRatio,
    strokeCount,
    cornerCount,
    hasClosedLoop,
    totalStrokeLength,
    boxWidth: Math.round(width),
    boxHeight: Math.round(height),
    isStraightLine,
    connectedComponentsCount,
    closedContourDistance: closureDistance,
    closureDistance,
    hullArea,
    solidity,
    extent,
    compactness,
    huMoments,
    symmetryDiagonal,
    peakCount,
    valleyCount,
    endpointsCount: cleanedStrokes.length * 2,
    junctionsCount: Math.max(0, connectedComponentsCount - 1),
    isClosedLoop30,
    isClosedLoop45
  };
}
