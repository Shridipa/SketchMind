import { DrawingFeatures, Prediction } from '../types';

// The 10 categories supported by SketchMind
export const CATEGORIES = [
  'Apple',
  'Star',
  'Fish',
  'House',
  'Tree',
  'Car',
  'Bicycle',
  'Airplane',
  'Cat',
  'Flower'
];

export const CATEGORY_DETAILS: Record<string, { description: string; tips: string }> = {
  Apple: { description: 'A round fruit with a small stem on top.', tips: 'Draw a circle and add a short vertical line at the top.' },
  Star: { description: 'A classic 5-pointed celestial star.', tips: 'Draw 5 sharp points, either in one continuous outline or intersecting.' },
  Fish: { description: 'An aquatic swimmer with a tail and body.', tips: 'Draw a horizontal oval or teardrop with a triangular tail at one end.' },
  House: { description: 'A rectangular building with a triangular roof.', tips: 'Draw a square base and put a triangle on top of it.' },
  Tree: { description: 'A plant with a narrow trunk and a fluffy canopy.', tips: 'Draw a vertical line or trunk at the bottom, and a cloud-like circle on top.' },
  Car: { description: 'A passenger vehicle with wheels and a cab.', tips: 'Draw a long horizontal chassis, a raised cabin box, and two round circles underneath.' },
  Bicycle: { description: 'A two-wheeled pedaled vehicle.', tips: 'Draw two separate circles side-by-side, and connect them with a few straight lines.' },
  Airplane: { description: 'A winged aircraft flying horizontally.', tips: 'Draw a central long tube (fuselage) with horizontal wings crossing it.' },
  Cat: { description: 'A feline face with pointy ears and whiskers.', tips: 'Draw a circle for the head, two small triangles on top for ears, and lines for whiskers.' },
  Flower: { description: 'A plant with a center disc, petals, and a stem.', tips: 'Draw a small central circle, surrounding round petals, and a stem going down.' }
};

/**
 * Extracts geometric and structural features from canvas drawing data
 */
export function extractFeatures(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokeCount: number,
  rawStrokePoints: { x: number; y: number }[][]
): { features: DrawingFeatures; grayscale28: number[][] } {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Find bounding box of the drawing
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  let totalInkPixels = 0;

  // Let's scan the canvas to locate the drawing boundaries
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3]; // Alpha channel contains drawing strokes
      
      if (alpha > 20) { // ink threshold
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        totalInkPixels++;
      }
    }
  }

  // If nothing drawn, return empty features
  if (totalInkPixels < 20) {
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
      grayscale28: emptyGrayscale
    };
  }

  // Add padding to bounding box
  const padding = 10;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  const aspectRatio = boxW / boxH;

  // 2. Generate 28x28 grayscale image representing what the ML model "sees"
  const grayscale28: number[][] = Array(28).fill(0).map(() => Array(28).fill(0));
  
  for (let gy = 0; gy < 28; gy++) {
    for (let gx = 0; gx < 28; gx++) {
      // Map 28x28 coordinate to bounding box coordinate
      const startX = Math.floor(minX + (gx / 28) * boxW);
      const endX = Math.ceil(minX + ((gx + 1) / 28) * boxW);
      const startY = Math.floor(minY + (gy / 28) * boxH);
      const endY = Math.ceil(minY + ((gy + 1) / 28) * boxH);

      // Average alpha channel values in this sub-region
      let sumAlpha = 0;
      let count = 0;

      for (let py = startY; py < endY; py++) {
        for (let px = startX; px < endX; px++) {
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = (py * width + px) * 4;
            sumAlpha += data[idx + 3];
            count++;
          }
        }
      }

      const avgAlpha = count > 0 ? sumAlpha / count : 0;
      // Normalize to 0-255 scale
      grayscale28[gy][gx] = Math.min(255, Math.round(avgAlpha * 1.5));
    }
  }

  // 3. Compute structural and physical properties on the 28x28 grid
  let gridInkCount = 0;
  let gridPerimeterCount = 0;
  let topInk = 0;
  let bottomInk = 0;
  let leftInk = 0;
  let rightInk = 0;

  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      if (grayscale28[y][x] > 40) {
        gridInkCount++;

        // Split ink counts for spatial distribution
        if (y < 14) topInk++;
        else bottomInk++;

        if (x < 14) leftInk++;
        else rightInk++;

        // Perimeter detection: check if there is an empty neighbor
        let isBoundary = false;
        const neighbors = [
          [y-1, x], [y+1, x], [y, x-1], [y, x+1]
        ];
        for (const [ny, nx] of neighbors) {
          if (ny < 0 || ny >= 28 || nx < 0 || nx >= 28 || grayscale28[ny][nx] <= 40) {
            isBoundary = true;
            break;
          }
        }
        if (isBoundary) {
          gridPerimeterCount++;
        }
      }
    }
  }

  // Circularity index: 4 * PI * Area / (Perimeter^2)
  // For circle, circularity is ~1.0. For stars/highly irregular shapes, it is much lower.
  const area = gridInkCount;
  const perimeter = gridPerimeterCount;
  let circularity = perimeter > 0 ? (4 * Math.PI * area) / (perimeter * perimeter) : 0;
  // bound circularity
  circularity = Math.min(1.5, circularity);

  // Density: Drawn pixel area relative to grid size
  const density = gridInkCount / (28 * 28);

  // Symmetry: compare left-right, top-bottom
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

  const symmetryHorizontal = symHCount / totalMatchable;
  const symmetryVertical = symVCount / totalMatchable;

  // Spatial weights
  const topHeavyRatio = gridInkCount > 0 ? topInk / gridInkCount : 0.5;
  const leftHeavyRatio = gridInkCount > 0 ? leftInk / gridInkCount : 0.5;

  // 4. Closed Loop Detection (Hole / Loop detection via connected components)
  // We'll run a BFS from borders to find all background pixels connected to the boundary.
  // Any background pixels remaining unvisited are internal loops!
  const visited = Array(28).fill(false).map(() => Array(28).fill(false));
  const queue: [number, number][] = [];

  // Seed boundary empty pixels
  for (let x = 0; x < 28; x++) {
    if (grayscale28[0][x] <= 40) { queue.push([0, x]); visited[0][x] = true; }
    if (grayscale28[27][x] <= 40) { queue.push([27, x]); visited[27][x] = true; }
  }
  for (let y = 1; y < 27; y++) {
    if (grayscale28[y][0] <= 40) { queue.push([y, 0]); visited[y][0] = true; }
    if (grayscale28[y][27] <= 40) { queue.push([y, 27]); visited[y][27] = true; }
  }

  // BFS flood fill of outer empty space
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

  // Now scan the interior for unvisited empty pixels (these represent loops/holes!)
  let closedLoopCount = 0;
  for (let y = 1; y < 27; y++) {
    for (let x = 1; x < 27; x++) {
      if (grayscale28[y][x] <= 40 && !visited[y][x]) {
        // Found a hole! Flood fill it so we don't double count
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

  // 5. Corner Detection using drawn stroke points
  let cornerCount = 0;
  rawStrokePoints.forEach(stroke => {
    if (stroke.length < 5) return;
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

      if (len1 > 2 && len2 > 2) {
        const dot = dx1 * dx2 + dy1 * dy2;
        const cosAngle = dot / (len1 * len2);
        // Angle in radians. A sharp angle (e.g., > 45 degrees or cos < 0.7) represents a corner
        if (cosAngle < 0.65) {
          cornerCount++;
          // Skip nearby points to avoid double counting the same corner
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
    grayscale28
  };
}

/**
 * Predicts drawing category based on feature evaluations
 * Evaluates the likeness score for each of the 10 target categories
 */
export function predictDrawing(
  features: DrawingFeatures,
  grayscale28: number[][]
): Prediction[] {
  // If the drawing is blank, return low confidence on everything
  if (features.density === 0) {
    return CATEGORIES.map(cat => ({ className: cat, probability: 0 }));
  }

  const rawScores: Record<string, number> = {};

  // Define dynamic score calculators based on geometric matches
  // Apple: Round body, vertical/square ratio, 1 or 2 strokes (circle + stem), medium density, no loops
  rawScores['Apple'] = (() => {
    let score = 0;
    // Circularity close to 1.0 is a strong indicator of a circle/apple
    score += Math.max(0, 1 - Math.abs(features.circularity - 0.9)) * 40;
    // Aspect ratio should be nearly square
    score += Math.max(0, 1 - Math.abs(features.aspectRatio - 1.0)) * 20;
    // Density is medium
    score += Math.max(0, 1 - Math.abs(features.density - 0.22) * 2) * 15;
    // Usually drawn in 1 or 2 strokes
    if (features.strokeCount === 1 || features.strokeCount === 2) score += 15;
    // Symmetry is quite high both horizontally and vertically
    score += (features.symmetryHorizontal + features.symmetryVertical) * 10;
    // No loops usually
    if (!features.hasClosedLoop) score += 10;
    return score;
  })();

  // Star: Low circularity (very jagged perimeter), 1-2 strokes, square ratio, high corners
  rawScores['Star'] = (() => {
    let score = 0;
    // Circularity should be very low because a star has massive perimeter per area
    score += Math.max(0, 1 - features.circularity) * 35;
    // Aspect ratio should be roughly square
    score += Math.max(0, 1 - Math.abs(features.aspectRatio - 1.0)) * 15;
    // Low density (thin intersecting lines)
    score += Math.max(0, 1 - Math.abs(features.density - 0.14) * 3) * 15;
    // Corner count should be high
    if (features.cornerCount >= 4) {
      score += Math.min(25, features.cornerCount * 5);
    } else {
      score += features.cornerCount * 2;
    }
    // Star has high symmetry
    score += (features.symmetryHorizontal + features.symmetryVertical) * 10;
    return score;
  })();

  // Fish: Horizontal layout (aspect ratio > 1.2), asymmetric horizontally (tail on one side)
  rawScores['Fish'] = (() => {
    let score = 0;
    // Wide layout
    if (features.aspectRatio > 1.2) {
      score += Math.min(30, (features.aspectRatio - 1.0) * 25);
    }
    // High vertical symmetry (swimming straight), but low horizontal symmetry (head vs tail)
    score += features.symmetryVertical * 20;
    score += (1 - features.symmetryHorizontal) * 20;
    // Left-heavy or right-heavy (usually fish has a thick head on one side and tail on the other)
    const heavyDiff = Math.abs(features.leftHeavyRatio - 0.5);
    score += heavyDiff * 30;
    // Low circularity (elongated)
    score += (1 - features.circularity) * 15;
    return score;
  })();

  // House: Square base with triangle roof. Highly symmetric vertically. Bottom-heavy (roof is thin at top, base is blocky).
  rawScores['House'] = (() => {
    let score = 0;
    // Vertical or square ratio
    score += Math.max(0, 1 - Math.abs(features.aspectRatio - 1.0) * 1.5) * 15;
    // Vertical symmetry is high
    score += features.symmetryHorizontal * 25;
    // Bottom heavy: a house's blocky base is in the lower half, roof peak at top
    if (features.topHeavyRatio < 0.48) {
      score += (0.5 - features.topHeavyRatio) * 45;
    }
    // Density is medium-high (walls + roof lines)
    score += Math.max(0, 1 - Math.abs(features.density - 0.28) * 2) * 15;
    // Often has corners (at least 4)
    if (features.cornerCount >= 3) score += 15;
    return score;
  })();

  // Tree: Extremely top-heavy (heavy canopy on top, narrow trunk below). Aspect ratio is vertical or square.
  rawScores['Tree'] = (() => {
    let score = 0;
    // Very top heavy (canopy contains 70%+ of the ink)
    if (features.topHeavyRatio > 0.53) {
      score += (features.topHeavyRatio - 0.5) * 60;
    }
    // Let's check vertical narrowness in the lower half (trunk)
    // Scan bottom 5 rows of 28x28 grid and check if width of ink is narrow
    let bottomWidthCount = 0;
    for (let y = 22; y < 28; y++) {
      let rowInk = 0;
      for (let x = 0; x < 28; x++) {
        if (grayscale28[y][x] > 40) rowInk++;
      }
      if (rowInk > 0 && rowInk < 8) bottomWidthCount++;
    }
    score += (bottomWidthCount / 6) * 30;
    // Tree is vertically symmetric (left/right symmetry)
    score += features.symmetryHorizontal * 15;
    return score;
  })();

  // Car: Wide layout (aspect ratio 1.5 - 2.5), bottom heavy, medium density, corners at chassis edges, possible small wheels (loops)
  rawScores['Car'] = (() => {
    let score = 0;
    // Wide aspect ratio is crucial
    if (features.aspectRatio >= 1.3) {
      score += Math.min(35, (features.aspectRatio - 1.0) * 20);
    }
    // Bottom heavy (wheels and chassis)
    if (features.topHeavyRatio < 0.5) {
      score += (0.5 - features.topHeavyRatio) * 30;
    }
    // Density is medium
    score += Math.max(0, 1 - Math.abs(features.density - 0.26) * 2) * 15;
    // If it has loops/holes (wheels!), that fits well
    if (features.hasClosedLoop) score += 15;
    // Corners
    if (features.cornerCount >= 3) score += 10;
    return score;
  })();

  // Bicycle: Wide layout, two wheels (often has exactly 2 closed loops!). Very sparse density (thin wheels and bars).
  rawScores['Bicycle'] = (() => {
    let score = 0;
    // 2 loops is an absolute hallmark of a bicycle! Let's check if there are 2 loops or at least closed loops.
    if (features.hasClosedLoop) {
      score += 35; // boost for loops
    }
    // Wide aspect ratio
    if (features.aspectRatio > 1.4) {
      score += 25;
    }
    // Sparse density: a bicycle is mostly empty space with lines
    score += Math.max(0, 1 - features.density * 4) * 25;
    // Symmetry
    score += features.symmetryHorizontal * 15;
    return score;
  })();

  // Airplane: Wide layout (wingspan) or tall, highly cross-like.
  // High symmetry along one axis (usually horizontal symmetry if flying vertically, or vice versa)
  rawScores['Airplane'] = (() => {
    let score = 0;
    // High symmetry on one axis
    score += Math.max(features.symmetryHorizontal, features.symmetryVertical) * 30;
    // Center-focused distribution (low density overall, wings radiate out)
    score += Math.max(0, 1 - features.density * 5) * 20;
    // Broad layout (aspect ratio is either very wide or very tall)
    const ratioDev = Math.abs(features.aspectRatio - 1.0);
    score += Math.min(30, ratioDev * 25);
    // Usually multiple strokes (body + wings + tail)
    if (features.strokeCount >= 2) score += 15;
    return score;
  })();

  // Cat: Head circle with two triangle ears on top.
  // This means the top-left and top-right sections of the bounding box have distinct ink peaks (ears),
  // and the middle-top might have a dip.
  rawScores['Cat'] = (() => {
    let score = 0;
    // Circular head base (aspect ratio near 1.0)
    score += Math.max(0, 1 - Math.abs(features.aspectRatio - 1.0)) * 20;
    // Highly symmetric (face is symmetric)
    score += features.symmetryHorizontal * 25;
    // Whiskers and ears create moderate density
    score += Math.max(0, 1 - Math.abs(features.density - 0.22) * 2) * 15;
    // Multiple strokes (head, ears, face details)
    if (features.strokeCount >= 3) score += 15;
    // Pointy ears in the top half (creates corners)
    if (features.cornerCount >= 2) score += 15;
    // Cat is slightly bottom heavy or balanced
    score += Math.max(0, 1 - Math.abs(features.topHeavyRatio - 0.48) * 3) * 10;
    return score;
  })();

  // Flower: Central circle with radiating circular petals, often on a stem.
  // Highly symmetric, aspect ratio is usually vertical due to stem, top-heavy (heavy blossom on thin stem).
  rawScores['Flower'] = (() => {
    let score = 0;
    // Top-heavy (blossom on stem)
    if (features.topHeavyRatio > 0.52) {
      score += (features.topHeavyRatio - 0.5) * 30;
    }
    // High horizontal symmetry
    score += features.symmetryHorizontal * 25;
    // Stem makes aspect ratio vertical
    if (features.aspectRatio < 0.9) {
      score += (1 - features.aspectRatio) * 20;
    }
    // Medium density (blossom has many overlapping circular petals)
    score += Math.max(0, 1 - Math.abs(features.density - 0.24) * 2) * 15;
    // Multiple strokes (central circle + petals + stem)
    if (features.strokeCount >= 3) score += 15;
    return score;
  })();

  // --- Post-processing and Softmax Activation ---
  // To simulate a real neural network classification layer, we compute the softmax probabilities.
  // Raw scores are scaled, then exponentiated and normalized.
  const temp = 0.15; // Softmax temperature parameter (higher = more uniform, lower = more deterministic/confident)
  
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
      probability: Math.round(prob * 100) / 100 // Keep 2 decimal places
    };
  });

  // Sort by probability descending
  return predictions.sort((a, b) => b.probability - a.probability);
}
