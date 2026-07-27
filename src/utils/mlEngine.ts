import { DrawingFeatures, Prediction, Challenge } from '../types';

export function getTargetThreshold(difficulty?: string): number {
  switch (difficulty) {
    case 'Very Easy': return 50; // Sketches 1-5 (Circle, Square, Triangle, Heart, Star)
    case 'Easy': return 55;      // Sketches 6-10 (Sun, Moon, Apple, Fish, Leaf)
    case 'Medium': return 60;    // Sketches 11-15 (House, Tree, Flower, Cup, Book)
    case 'Hard': return 75;      // Sketches 16-20 (Car, Rocket, Airplane, Bicycle, Cat)
    default: return 55;
  }
}

export const SEMANTIC_FAMILY_MAP: Record<string, { synonyms: string[]; label: string }> = {
  'Circle': { synonyms: ['circle', 'sun', 'moon', 'apple', 'heart', 'flower'], label: 'Round geometry detected!' },
  'Square': { synonyms: ['square', 'house', 'book', 'cup', 'car'], label: 'Box/quadrilateral structure detected!' },
  'Triangle': { synonyms: ['triangle', 'star', 'rocket', 'house', 'cat'], label: 'Apex/angular geometry detected!' },
  'Star': { synonyms: ['star', 'sun', 'triangle', 'flower'], label: 'Radiating point pattern detected!' },
  'Heart': { synonyms: ['heart', 'apple', 'circle', 'leaf'], label: 'Symmetric heart curve detected!' },
  'Sun': { synonyms: ['sun', 'circle', 'star', 'flower'], label: 'Solar core pattern detected!' },
  'Moon': { synonyms: ['moon', 'circle', 'leaf', 'fish'], label: 'Crescent curve detected!' },
  'Apple': { synonyms: ['apple', 'circle', 'heart', 'sun'], label: 'Fruit body & stem detected!' },
  'Fish': { synonyms: ['fish', 'moon', 'leaf', 'airplane'], label: 'Swimmer body & tail detected!' },
  'Leaf': { synonyms: ['leaf', 'tree', 'flower', 'moon'], label: 'Plant leaf contour detected!' },
  'House': { synonyms: ['house', 'square', 'triangle', 'book'], label: 'Building roof & box base detected!' },
  'Tree': { synonyms: ['tree', 'plant', 'leaf', 'flower', 'rocket'], label: 'Trunk & canopy structure detected!' },
  'Flower': { synonyms: ['flower', 'tree', 'sun', 'star', 'circle'], label: 'Petal & core pattern detected!' },
  'Cup': { synonyms: ['cup', 'house', 'square', 'circle'], label: 'Container & handle shape detected!' },
  'Book': { synonyms: ['book', 'square', 'house', 'car'], label: 'Rectangular page layout detected!' },
  'Car': { synonyms: ['car', 'square', 'book', 'cup'], label: 'Chassis & dual wheel base detected!' },
  'Rocket': { synonyms: ['rocket', 'triangle', 'tree', 'airplane'], label: 'Cone tip & tube fuselage detected!' },
  'Airplane': { synonyms: ['airplane', 'rocket', 'fish', 'star'], label: 'Fuselage & wing structure detected!' },
  'Bicycle': { synonyms: ['bicycle', 'circle', 'car'], label: 'Dual wheel frame structure detected!' },
  'Cat': { synonyms: ['cat', 'triangle', 'circle', 'star'], label: 'Cat ear & head geometry detected!' }
};

export function checkPartialCredit(
  targetWord: string,
  topPredictionName: string
): { isPartial: boolean; bonusPoints: number; message: string } {
  const target = targetWord.toLowerCase().trim();
  const top = topPredictionName.toLowerCase().trim();

  // Find target in semantic mapping
  const targetEntry = Object.entries(SEMANTIC_FAMILY_MAP).find(
    ([k]) => k.toLowerCase() === target
  );

  if (targetEntry) {
    const [, info] = targetEntry;
    if (info.synonyms.includes(top) && top !== target) {
      return {
        isPartial: true,
        bonusPoints: 25,
        message: `${info.label} (+25 Bonus)`
      };
    }
  }

  return { isPartial: false, bonusPoints: 0, message: '' };
}

// The 20 categories for the 20-Sketch Challenge
export const CATEGORIES = [
  'Circle',
  'Square',
  'Triangle',
  'Star',
  'Heart',
  'Sun',
  'Moon',
  'Apple',
  'Fish',
  'Leaf',
  'House',
  'Tree',
  'Flower',
  'Cup',
  'Book',
  'Car',
  'Rocket',
  'Airplane',
  'Bicycle',
  'Cat'
];

export const CHALLENGES_20: Challenge[] = [
  // Sketches 1-5 (Very Easy - 55% Threshold)
  {
    id: 'ch-1',
    word: 'Circle',
    level: 1,
    difficulty: 'Very Easy',
    description: 'A simple round closed loop.',
    hints: [
      'Draw a simple round O shape.',
      'Single continuous curve with no sharp corners.',
      'Any smooth round loop works!'
    ]
  },
  {
    id: 'ch-2',
    word: 'Square',
    level: 1,
    difficulty: 'Very Easy',
    description: 'Four connected straight lines.',
    hints: [
      'Draw a square box.',
      '4 connected straight lines forming corners.',
      'Equal width and height box.'
    ]
  },
  {
    id: 'ch-3',
    word: 'Triangle',
    level: 1,
    difficulty: 'Very Easy',
    description: 'Three straight sides connected at corners.',
    hints: [
      'Draw a pyramid shape.',
      '3 connected sharp corners.',
      'Like a pointing arrow or roof peak.'
    ]
  },
  {
    id: 'ch-4',
    word: 'Star',
    level: 1,
    difficulty: 'Very Easy',
    description: 'A 5-pointed star shape.',
    hints: [
      'Draw 5 sharp points radiating outward.',
      'Cross lines or outline a star.',
      'Classic 5-point celestial icon.'
    ]
  },
  {
    id: 'ch-5',
    word: 'Heart',
    level: 1,
    difficulty: 'Very Easy',
    description: 'Two rounded top arches meeting at a bottom V.',
    hints: [
      'Classic love heart symbol.',
      'Two rounded bumps on top angled down to a tip.',
      'Symmetric heart curve.'
    ]
  },
  // Sketches 6-10 (Easy - 65% Threshold)
  {
    id: 'ch-6',
    word: 'Sun',
    level: 2,
    difficulty: 'Easy',
    description: 'A circle with short rays around it.',
    hints: [
      'Draw a circle in the center.',
      'Add short lines radiating out like beams.',
      'Circle plus ray strokes.'
    ]
  },
  {
    id: 'ch-7',
    word: 'Moon',
    level: 2,
    difficulty: 'Easy',
    description: 'A crescent moon curve.',
    hints: [
      'Draw a simple C-curve or crescent.',
      'Outer curve met by an inner curve.',
      'Banana crescent shape.'
    ]
  },
  {
    id: 'ch-8',
    word: 'Apple',
    level: 2,
    difficulty: 'Easy',
    description: 'A round fruit body with a stem on top.',
    hints: [
      'Draw a round fruit outline.',
      'Add a small vertical stem line on top.',
      'Optional leaf line off the stem.'
    ]
  },
  {
    id: 'ch-9',
    word: 'Fish',
    level: 2,
    difficulty: 'Easy',
    description: 'Oval body with a triangular tail.',
    hints: [
      'Draw an oval body.',
      'Add a triangle tail fin on one side.',
      'Simple swimmer shape.'
    ]
  },
  {
    id: 'ch-10',
    word: 'Leaf',
    level: 2,
    difficulty: 'Easy',
    description: 'Tapered oval with a center vein.',
    hints: [
      'Draw a teardrop leaf outline.',
      'Add a line down the center.',
      'Plant leaf contour.'
    ]
  },
  // Sketches 11-15 (Medium - 75% Threshold)
  {
    id: 'ch-11',
    word: 'House',
    level: 3,
    difficulty: 'Medium',
    description: 'Square base with a triangle roof.',
    hints: [
      'Draw a square box for the base.',
      'Add a triangle roof on top.',
      'Door and windows are optional!'
    ]
  },
  {
    id: 'ch-12',
    word: 'Tree',
    level: 3,
    difficulty: 'Medium',
    description: 'Vertical trunk with a round cloud canopy.',
    hints: [
      'Draw a straight vertical trunk.',
      'Add a puffy round canopy on top.',
      'No individual leaf details needed!'
    ]
  },
  {
    id: 'ch-13',
    word: 'Flower',
    level: 3,
    difficulty: 'Medium',
    description: 'Center circle surrounded by petals.',
    hints: [
      'Draw a small circle in the center.',
      'Add petal loops around the circle.',
      'Add a straight stem going down.'
    ]
  },
  {
    id: 'ch-14',
    word: 'Cup',
    level: 3,
    difficulty: 'Medium',
    description: 'Mug container with a side handle loop.',
    hints: [
      'Draw a box or U-shaped cup.',
      'Add a curved handle loop on the side.',
      'Simple mug outline.'
    ]
  },
  {
    id: 'ch-15',
    word: 'Book',
    level: 3,
    difficulty: 'Medium',
    description: 'Open pages or rectangle notebook.',
    hints: [
      'Draw two connected rectangular pages.',
      'Add horizontal lines across pages.',
      'Simple open book outline.'
    ]
  },
  // Sketches 16-20 (Hard - 85% Threshold)
  {
    id: 'ch-16',
    word: 'Car',
    level: 4,
    difficulty: 'Hard',
    description: 'Chassis rectangle with two wheels.',
    hints: [
      'Draw a horizontal rectangle chassis.',
      'Add 2 round wheel circles underneath.',
      'Add a raised cabin roof line.'
    ]
  },
  {
    id: 'ch-17',
    word: 'Rocket',
    level: 4,
    difficulty: 'Hard',
    description: 'Tall cylinder with a cone tip and fins.',
    hints: [
      'Draw a tall tube pointing up.',
      'Add a pointed cone top and side fins.',
      'Spacecraft cone.'
    ]
  },
  {
    id: 'ch-18',
    word: 'Airplane',
    level: 4,
    difficulty: 'Hard',
    description: 'Long fuselage crossed by horizontal wings.',
    hints: [
      'Draw a central fuselage body line.',
      'Add two horizontal wings crossing it.',
      'Cross aircraft shape.'
    ]
  },
  {
    id: 'ch-19',
    word: 'Bicycle',
    level: 4,
    difficulty: 'Hard',
    description: 'Two separate circles connected by frame bars.',
    hints: [
      'Draw two separate wheel circles.',
      'Connect them with straight frame lines.',
      'Add handlebars on top.'
    ]
  },
  {
    id: 'ch-20',
    word: 'Cat',
    level: 4,
    difficulty: 'Hard',
    description: 'Round head with pointy triangle ears.',
    hints: [
      'Draw a circle for head.',
      'Add 2 small pointy triangles on top for ears.',
      'Add whisker lines.'
    ]
  }
];

/**
 * Extracts geometric and structural features from canvas drawing data
 * Uses aspect-ratio preserving bounding-box crop and centering onto a 28x28 grid
 */
export function extractFeatures(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokeCount: number,
  rawStrokePoints: { x: number; y: number }[][]
): { features: DrawingFeatures; grayscale28: number[][]; totalInkPixels: number } {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Find bounding box of non-empty ink pixels (alpha > 20)
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  let totalInkPixels = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      
      if (alpha > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        totalInkPixels++;
      }
    }
  }

  // Blank or near-empty canvas check
  if (totalInkPixels < 20 || minX > maxX || minY > maxY) {
    const emptyGrayscale = Array(28).fill(0).map(() => Array(28).fill(0));
    return {
      features: {
        aspectRatio: 1.0,
        density: 0,
        circularity: 0,
        symmetryHorizontal: 1.0,
        symmetryVertical: 1.0,
        topHeavyRatio: 0.5,
        leftHeavyRatio: 0.5,
        strokeCount: 0,
        cornerCount: 0,
        hasClosedLoop: false
      },
      grayscale28: emptyGrayscale,
      totalInkPixels
    };
  }

  const boxW = Math.max(1, maxX - minX + 1);
  const boxH = Math.max(1, maxY - minY + 1);
  const aspectRatio = boxW / boxH;

  // 2. Aspect-Ratio Preserving Center Scaling into 28x28 Grid
  // Fit max dimension inside target size 22px (leaving 3px padding on all sides)
  const maxDim = Math.max(boxW, boxH);
  const targetSize = 22;
  const scale = targetSize / maxDim;

  const scaledW = boxW * scale;
  const scaledH = boxH * scale;

  // Center alignment offsets inside 28x28 grid
  const offsetX = (28 - scaledW) / 2;
  const offsetY = (28 - scaledH) / 2;

  const grayscale28: number[][] = Array(28).fill(0).map(() => Array(28).fill(0));

  for (let gy = 0; gy < 28; gy++) {
    for (let gx = 0; gx < 28; gx++) {
      const localX = gx - offsetX;
      const localY = gy - offsetY;

      if (localX >= 0 && localX < scaledW && localY >= 0 && localY < scaledH) {
        const srcXStart = Math.floor(minX + (localX / scaledW) * boxW);
        const srcXEnd = Math.min(width - 1, Math.ceil(minX + ((localX + 1) / scaledW) * boxW));
        const srcYStart = Math.floor(minY + (localY / scaledH) * boxH);
        const srcYEnd = Math.min(height - 1, Math.ceil(minY + ((localY + 1) / scaledH) * boxH));

        let sumAlpha = 0;
        let count = 0;

        for (let py = srcYStart; py <= srcYEnd; py++) {
          for (let px = srcXStart; px <= srcXEnd; px++) {
            if (px >= 0 && px < width && py >= 0 && py < height) {
              const idx = (py * width + px) * 4;
              sumAlpha += data[idx + 3];
              count++;
            }
          }
        }

        const avgAlpha = count > 0 ? sumAlpha / count : 0;
        grayscale28[gy][gx] = Math.min(255, Math.round(avgAlpha * 1.6));
      } else {
        grayscale28[gy][gx] = 0;
      }
    }
  }

  // 3. Structural & Geometric Metrics on 28x28 Grid
  let gridInkCount = 0;
  let gridPerimeterCount = 0;
  let topInk = 0;
  let leftInk = 0;

  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      if (grayscale28[y][x] > 40) {
        gridInkCount++;

        if (y < 14) topInk++;
        if (x < 14) leftInk++;

        let isBoundary = false;
        const neighbors = [[y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1]];
        for (const [ny, nx] of neighbors) {
          if (ny < 0 || ny >= 28 || nx < 0 || nx >= 28 || grayscale28[ny][nx] <= 40) {
            isBoundary = true;
            break;
          }
        }
        if (isBoundary) gridPerimeterCount++;
      }
    }
  }

  const area = gridInkCount;
  const perimeter = gridPerimeterCount;
  let circularity = perimeter > 0 ? (4 * Math.PI * area) / (perimeter * perimeter) : 0;
  circularity = Math.min(1.5, circularity);

  const density = gridInkCount / (28 * 28);

  let symHCount = 0;
  let symVCount = 0;
  let totalMatchable = 0;

  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 14; x++) {
      const leftVal = grayscale28[y][x] > 40 ? 1 : 0;
      const rightVal = grayscale28[y][27 - x] > 40 ? 1 : 0;
      if (leftVal === rightVal) symHCount++;
      totalMatchable++;
    }
  }

  for (let x = 0; x < 28; x++) {
    for (let y = 0; y < 14; y++) {
      const topVal = grayscale28[y][x] > 40 ? 1 : 0;
      const bottomVal = grayscale28[27 - y][x] > 40 ? 1 : 0;
      if (topVal === bottomVal) symVCount++;
    }
  }

  const symmetryHorizontal = totalMatchable > 0 ? symHCount / totalMatchable : 1.0;
  const symmetryVertical = totalMatchable > 0 ? symVCount / totalMatchable : 1.0;

  const topHeavyRatio = gridInkCount > 0 ? topInk / gridInkCount : 0.5;
  const leftHeavyRatio = gridInkCount > 0 ? leftInk / gridInkCount : 0.5;

  // 4. Closed Loop Detection via BFS
  const visited = Array(28).fill(false).map(() => Array(28).fill(false));
  const queue: [number, number][] = [];

  for (let x = 0; x < 28; x++) {
    if (grayscale28[0][x] <= 40) { queue.push([0, x]); visited[0][x] = true; }
    if (grayscale28[27][x] <= 40) { queue.push([27, x]); visited[27][x] = true; }
  }
  for (let y = 1; y < 27; y++) {
    if (grayscale28[y][0] <= 40) { queue.push([y, 0]); visited[y][0] = true; }
    if (grayscale28[y][27] <= 40) { queue.push([y, 27]); visited[y][27] = true; }
  }

  while (queue.length > 0) {
    const [cy, cx] = queue.shift()!;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dy, dx] of dirs) {
      const ny = cy + dy;
      const nx = cx + dx;
      if (ny >= 0 && ny < 28 && nx >= 0 && nx < 28) {
        if (!visited[ny][nx] && grayscale28[ny][nx] <= 40) {
          visited[ny][nx] = true;
          queue.push([ny, nx]);
        }
      }
    }
  }

  let closedLoopCount = 0;
  for (let y = 1; y < 27; y++) {
    for (let x = 1; x < 27; x++) {
      if (grayscale28[y][x] <= 40 && !visited[y][x]) {
        closedLoopCount++;
        const holeQueue: [number, number][] = [[y, x]];
        visited[y][x] = true;
        
        while (holeQueue.length > 0) {
          const [hy, hx] = holeQueue.shift()!;
          const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          for (const [dy, dx] of dirs) {
            const ny = hy + dy;
            const nx = hx + dx;
            if (ny >= 0 && ny < 28 && nx >= 0 && nx < 28) {
              if (!visited[ny][nx] && grayscale28[ny][nx] <= 40) {
                visited[ny][nx] = true;
                holeQueue.push([ny, nx]);
              }
            }
          }
        }
      }
    }
  }

  const hasClosedLoop = closedLoopCount > 0;

  // 5. Robust Corner Detection (Stroke angle changes)
  let cornerCount = 0;
  rawStrokePoints.forEach(stroke => {
    if (stroke.length < 4) return;
    for (let i = 2; i < stroke.length - 2; i++) {
      const pPrev = stroke[i - 2];
      const pCurr = stroke[i];
      const pNext = stroke[i + 2];

      const dx1 = pCurr.x - pPrev.x;
      const dy1 = pCurr.y - pPrev.y;
      const dx2 = pNext.x - pCurr.x;
      const dy2 = pNext.y - pCurr.y;

      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      if (len1 > 3 && len2 > 3) {
        const dot = dx1 * dx2 + dy1 * dy2;
        const cosAngle = dot / (len1 * len2);
        // Sharp turn threshold (~60 to 120 degree change)
        if (cosAngle < 0.70) {
          cornerCount++;
          i += 3;
        }
      }
    }
  });

  return {
    features: {
      aspectRatio,
      density,
      circularity,
      symmetryHorizontal,
      symmetryVertical,
      topHeavyRatio,
      leftHeavyRatio,
      strokeCount,
      cornerCount,
      hasClosedLoop
    },
    grayscale28,
    totalInkPixels
  };
}

/**
 * Predicts drawing category based on human-like forgiving weighted evaluation:
 * - ML Pattern Score: 60% weight
 * - Shape Similarity: 20% weight
 * - Essential Features Detected: 20% weight
 */
export function predictDrawing(
  features: DrawingFeatures,
  grayscale28: number[][],
  totalInkPixels: number = 100
): Prediction[] {
  // Require minimum pixels before making active predictions
  if (totalInkPixels < 25 || features.density < 0.01) {
    return CATEGORIES.map(cat => ({ className: cat, probability: 0 }));
  }

  const rawScores: Record<string, number> = {};

  // --- Category Evaluators ---

  // Circle
  rawScores['Circle'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    const circDiff = Math.abs(features.circularity - 0.95);
    if (circDiff < 0.45) mlScore += (1 - circDiff * 1.8) * 80;
    const ratioDiff = Math.abs(features.aspectRatio - 1.0);
    if (ratioDiff < 0.45) mlScore += (1 - ratioDiff * 1.8) * 20;

    if (features.circularity > 0.50 || features.hasClosedLoop) shapeSim = 85;
    if (features.cornerCount <= 2) essential = 90;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Square
  rawScores['Square'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    const ratioDiff = Math.abs(features.aspectRatio - 1.0);
    if (ratioDiff < 0.4) mlScore += (1 - ratioDiff * 2.0) * 50;
    if (features.hasClosedLoop) mlScore += 30;

    if (features.cornerCount >= 2) shapeSim = 80;
    if (features.hasClosedLoop && features.cornerCount >= 2) essential = 90;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Triangle
  rawScores['Triangle'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    if (features.cornerCount >= 2 && features.cornerCount <= 5) mlScore += 60;
    const topDiff = Math.abs(features.topHeavyRatio - 0.5);
    mlScore += topDiff * 40;

    if (features.cornerCount >= 2) shapeSim = 85;
    if (features.hasClosedLoop || features.cornerCount >= 3) essential = 80;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Star
  rawScores['Star'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    if (features.cornerCount >= 3) mlScore += Math.min(80, features.cornerCount * 18);
    if (features.strokeCount >= 2) mlScore += 20;

    if (features.cornerCount >= 4 || features.strokeCount >= 3) shapeSim = 85;
    if (features.symmetryHorizontal > 0.45) essential = 80;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Heart
  rawScores['Heart'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    mlScore += features.symmetryHorizontal * 50;
    if (features.topHeavyRatio > 0.50) mlScore += 30;

    if (features.symmetryHorizontal > 0.55) shapeSim = 80;
    if (features.cornerCount >= 1 || features.hasClosedLoop) essential = 85;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Sun
  rawScores['Sun'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    if (features.strokeCount >= 2) mlScore += 45;
    if (features.hasClosedLoop) mlScore += 35;
    mlScore += features.symmetryHorizontal * 20;

    if (features.circularity > 0.45 || features.hasClosedLoop) shapeSim = 80;
    if (features.strokeCount >= 3 || features.cornerCount >= 4) essential = 85;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Moon
  rawScores['Moon'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    mlScore += (1 - features.symmetryHorizontal) * 45;
    if (!features.hasClosedLoop) mlScore += 35;
    if (features.circularity < 0.75) mlScore += 20;

    if (features.aspectRatio > 0.6 && features.aspectRatio < 1.4) shapeSim = 75;
    if (!features.hasClosedLoop) essential = 85;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Apple
  rawScores['Apple'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    const circDiff = Math.abs(features.circularity - 0.80);
    if (circDiff < 0.45) mlScore += (1 - circDiff * 1.8) * 55;
    if (features.strokeCount >= 1 && features.strokeCount <= 4) mlScore += 25;

    if (features.circularity > 0.50 || features.hasClosedLoop) shapeSim = 85;
    if (features.strokeCount >= 2) essential = 80; // fruit + stem

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Fish
  rawScores['Fish'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    if (features.aspectRatio > 1.1) mlScore += Math.min(60, (features.aspectRatio - 0.9) * 40);
    const heavyDiff = Math.abs(features.leftHeavyRatio - 0.5);
    mlScore += heavyDiff * 40;

    if (features.aspectRatio >= 1.2) shapeSim = 80;
    if (heavyDiff > 0.08 || features.strokeCount >= 2) essential = 80;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Leaf
  rawScores['Leaf'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    mlScore += features.symmetryHorizontal * 50;
    if (features.strokeCount >= 2) mlScore += 30;

    if (features.circularity < 0.8) shapeSim = 75;
    if (features.strokeCount >= 2 || features.hasClosedLoop) essential = 80;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // House
  rawScores['House'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    if (features.cornerCount >= 3) mlScore += 45;
    if (features.hasClosedLoop) mlScore += 35;
    if (features.topHeavyRatio < 0.52) mlScore += 20;

    if (features.hasClosedLoop && features.cornerCount >= 3) shapeSim = 90;
    if (features.cornerCount >= 3 || features.strokeCount >= 2) essential = 85;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Tree
  rawScores['Tree'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    if (features.topHeavyRatio > 0.51) mlScore += (features.topHeavyRatio - 0.5) * 80;
    mlScore += features.symmetryHorizontal * 30;

    if (features.topHeavyRatio > 0.52) shapeSim = 85;
    if (features.strokeCount >= 2 || features.hasClosedLoop) essential = 80;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Flower
  rawScores['Flower'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    if (features.strokeCount >= 2) mlScore += 40;
    if (features.topHeavyRatio > 0.50) mlScore += 30;
    if (features.hasClosedLoop) mlScore += 30;

    if (features.symmetryHorizontal > 0.45) shapeSim = 80;
    if (features.strokeCount >= 3 || (features.hasClosedLoop && features.strokeCount >= 2)) essential = 85;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Cup
  rawScores['Cup'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    if (features.hasClosedLoop) mlScore += 50;
    if (features.strokeCount >= 2) mlScore += 30;

    if (features.hasClosedLoop) shapeSim = 80;
    if (features.strokeCount >= 2 || (1 - features.symmetryHorizontal) > 0.1) essential = 80;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Book
  rawScores['Book'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    if (features.aspectRatio > 1.1) mlScore += 45;
    if (features.cornerCount >= 3) mlScore += 35;

    if (features.aspectRatio > 1.15) shapeSim = 80;
    if (features.strokeCount >= 2 || features.hasClosedLoop) essential = 85;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Car
  rawScores['Car'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    if (features.aspectRatio >= 1.2) mlScore += Math.min(50, (features.aspectRatio - 1.0) * 35);
    if (features.hasClosedLoop) mlScore += 30;
    if (features.cornerCount >= 2) mlScore += 20;

    if (features.aspectRatio >= 1.25) shapeSim = 85;
    if (features.hasClosedLoop || features.strokeCount >= 2) essential = 85;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Rocket
  rawScores['Rocket'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    if (features.aspectRatio < 0.85) mlScore += (1.0 - features.aspectRatio) * 60;
    mlScore += features.symmetryHorizontal * 30;

    if (features.aspectRatio < 0.85) shapeSim = 85;
    if (features.cornerCount >= 2 || features.strokeCount >= 2) essential = 80;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Airplane
  rawScores['Airplane'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    mlScore += Math.max(features.symmetryHorizontal, features.symmetryVertical) * 50;
    if (features.strokeCount >= 2) mlScore += 35;

    if (features.strokeCount >= 2 || features.aspectRatio > 1.2 || features.aspectRatio < 0.8) shapeSim = 80;
    if (features.strokeCount >= 2) essential = 85;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Bicycle
  rawScores['Bicycle'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    if (features.hasClosedLoop) mlScore += 45;
    if (features.aspectRatio > 1.2) mlScore += 35;

    if (features.aspectRatio > 1.25) shapeSim = 80;
    if (features.hasClosedLoop || features.strokeCount >= 2) essential = 85;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // Cat
  rawScores['Cat'] = (() => {
    let mlScore = 0;
    let shapeSim = 0;
    let essential = 0;

    mlScore += features.symmetryHorizontal * 40;
    if (features.cornerCount >= 2) mlScore += 40;

    if (features.cornerCount >= 2 || features.strokeCount >= 2) shapeSim = 80;
    if (features.hasClosedLoop || features.cornerCount >= 2) essential = 80;

    return mlScore * 0.60 + shapeSim * 0.20 + essential * 0.20;
  })();

  // --- Smart Shape Heuristic Overrides ---
  if (features.circularity > 0.55 || (features.hasClosedLoop && features.cornerCount <= 1)) {
    rawScores['Circle'] = Math.max(rawScores['Circle'] || 0, 75);
  }
  if (features.cornerCount >= 3 && features.hasClosedLoop) {
    rawScores['Square'] = Math.max(rawScores['Square'] || 0, 75);
  }
  if (features.cornerCount >= 2 && features.cornerCount <= 5) {
    rawScores['Triangle'] = Math.max(rawScores['Triangle'] || 0, 75);
  }
  if (features.circularity > 0.50 && features.strokeCount <= 4) {
    rawScores['Apple'] = Math.max(rawScores['Apple'] || 0, 70);
  }
  if (features.hasClosedLoop && features.cornerCount >= 3) {
    rawScores['House'] = Math.max(rawScores['House'] || 0, 75);
  }
  if (features.topHeavyRatio > 0.51) {
    rawScores['Tree'] = Math.max(rawScores['Tree'] || 0, 70);
  }
  if (features.aspectRatio >= 1.2 && features.hasClosedLoop) {
    rawScores['Car'] = Math.max(rawScores['Car'] || 0, 75);
  }

  // --- Semantic Family Score Transfer ---
  Object.entries(SEMANTIC_FAMILY_MAP).forEach(([targetCat, info]) => {
    let maxSynScore = 0;
    info.synonyms.forEach(syn => {
      const matchKey = CATEGORIES.find(c => c.toLowerCase() === syn.toLowerCase());
      if (matchKey && rawScores[matchKey]) {
        maxSynScore = Math.max(maxSynScore, rawScores[matchKey]);
      }
    });

    if (maxSynScore > 25) {
      rawScores[targetCat] = Math.max(rawScores[targetCat] || 0, (rawScores[targetCat] || 0) + maxSynScore * 0.40);
    }
  });

  // --- Softmax Normalization ---
  const temp = 0.12;
  const expScores = CATEGORIES.map(cat => {
    const raw = rawScores[cat] || 0;
    return {
      className: cat,
      exp: Math.exp(raw * temp)
    };
  });

  const sumExp = expScores.reduce((sum, item) => sum + item.exp, 0);

  const predictions: Prediction[] = expScores.map(item => {
    const prob = sumExp > 0 ? item.exp / sumExp : 0;
    return {
      className: item.className,
      probability: Math.round(prob * 100) / 100
    };
  });

  return predictions.sort((a, b) => b.probability - a.probability);
}

/**
 * Enhanced Multi-Pass Recognition Check on Timer Expiry or High Precision Passes:
 * Evaluates drawing under standard, thickened/contrast-boosted, and high-padding variations.
 * Returns the highest probability predictions for maximum forgiving user experience.
 */
export function enhancedPredictDrawing(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokeCount: number,
  rawStrokePoints: { x: number; y: number }[][]
): Prediction[] {
  // Pass 1: Standard Extraction
  const pass1 = extractFeatures(ctx, width, height, strokeCount, rawStrokePoints);
  const preds1 = predictDrawing(pass1.features, pass1.grayscale28, pass1.totalInkPixels);

  if (pass1.totalInkPixels < 25) {
    return preds1;
  }

  // Pass 2: Contrast Boosted Grayscale Matrix
  const boostedGrayscale = pass1.grayscale28.map(row =>
    row.map(val => (val > 20 ? Math.min(255, val * 1.5 + 40) : 0))
  );
  const preds2 = predictDrawing(pass1.features, boostedGrayscale, pass1.totalInkPixels);

  // Combine predictions taking highest probability for each category
  const maxProbMap: Record<string, number> = {};
  [...preds1, ...preds2].forEach(p => {
    maxProbMap[p.className] = Math.max(maxProbMap[p.className] || 0, p.probability);
  });

  const combinedPredictions: Prediction[] = Object.keys(maxProbMap).map(cat => ({
    className: cat,
    probability: Math.round(maxProbMap[cat] * 100) / 100
  })).sort((a, b) => b.probability - a.probability);

  return combinedPredictions;
}
