export interface Point {
  x: number;
  y: number;
}

export interface ProcessedStrokes {
  rawStrokes: Point[][];
  cleanedStrokes: Point[][];
  totalStrokeLength: number;
  strokeCount: number;
  removedTapCount: number;
}

/**
 * Douglas-Peucker line simplification algorithm
 */
function douglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let index = 0;
  const p1 = points[0];
  const p2 = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    // Perpendicular distance from p to line (p1, p2)
    const num = Math.abs((p2.y - p1.y) * p.x - (p2.x - p1.x) * p.y + p2.x * p1.y - p2.y * p1.x);
    const den = Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2));
    const dist = den === 0 ? 0 : num / den;

    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }

  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, index + 1), epsilon);
    const right = douglasPeucker(points.slice(index), epsilon);
    return left.slice(0, left.length - 1).concat(right);
  } else {
    return [p1, p2];
  }
}

/**
 * Smooths stroke points using moving average
 */
function smoothStroke(stroke: Point[]): Point[] {
  if (stroke.length <= 2) return stroke;
  const smoothed: Point[] = [stroke[0]];
  for (let i = 1; i < stroke.length - 1; i++) {
    const prev = stroke[i - 1];
    const curr = stroke[i];
    const next = stroke[i + 1];
    smoothed.push({
      x: 0.25 * prev.x + 0.5 * curr.x + 0.25 * next.x,
      y: 0.25 * prev.y + 0.5 * curr.y + 0.25 * next.y
    });
  }
  smoothed.push(stroke[stroke.length - 1]);
  return smoothed;
}

/**
 * Trims short accidental hooks (< 10px) at stroke endpoints that turn sharply (> 70 deg)
 */
function trimEndHooks(stroke: Point[]): Point[] {
  if (stroke.length <= 4) return stroke;

  let points = [...stroke];

  // Check start hook
  const p0 = points[0];
  const p1 = points[1];
  const p2 = points[2];
  const d01 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  if (d01 < 10) {
    const angle01 = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    const angle12 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const diff = Math.abs(angle01 - angle12) * (180 / Math.PI);
    if (diff > 65 && diff < 295) {
      points.shift();
    }
  }

  // Check end hook
  if (points.length > 4) {
    const n = points.length;
    const pN = points[n - 1];
    const pN1 = points[n - 2];
    const pN2 = points[n - 3];
    const dN = Math.hypot(pN.x - pN1.x, pN.y - pN1.y);
    if (dN < 10) {
      const angleEnd = Math.atan2(pN.y - pN1.y, pN.x - pN1.x);
      const anglePrev = Math.atan2(pN1.y - pN2.y, pN1.x - pN2.x);
      const diff = Math.abs(angleEnd - anglePrev) * (180 / Math.PI);
      if (diff > 65 && diff < 295) {
        points.pop();
      }
    }
  }

  return points;
}

/**
 * Snaps start and end points of strokes together if within 15px to form closed loops
 */
function snapCloseEndpoints(strokes: Point[][]): Point[][] {
  if (strokes.length === 0) return strokes;

  // Single stroke loop closure
  return strokes.map(stroke => {
    if (stroke.length <= 3) return stroke;
    const first = stroke[0];
    const last = stroke[stroke.length - 1];
    const dist = Math.hypot(last.x - first.x, last.y - first.y);
    if (dist <= 15) {
      // Snap end point directly to start point
      const snapped = [...stroke];
      snapped[snapped.length - 1] = { x: first.x, y: first.y };
      return snapped;
    }
    return stroke;
  });
}

/**
 * Stage 1: Stroke Processor
 * Removes accidental taps, trims hooks, merges close points, applies Douglas-Peucker simplification and smoothing.
 */
export function processStrokes(strokes: Point[][]): ProcessedStrokes {
  let removedTapCount = 0;
  let totalStrokeLength = 0;
  const cleanedStrokes: Point[][] = [];

  for (const stroke of strokes) {
    if (stroke.length === 0) continue;

    // Calculate length of this stroke
    let len = 0;
    for (let i = 1; i < stroke.length; i++) {
      const dx = stroke[i].x - stroke[i - 1].x;
      const dy = stroke[i].y - stroke[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }

    // Ignore accidental tap (< 4px total length or <= 2 points very close)
    if (stroke.length <= 2 && len < 4) {
      removedTapCount++;
      continue;
    }

    // Trim sharp accidental hooks
    const trimmed = trimEndHooks(stroke);

    // Merge duplicate consecutive points
    const merged: Point[] = [trimmed[0]];
    for (let i = 1; i < trimmed.length; i++) {
      const last = merged[merged.length - 1];
      const dx = trimmed[i].x - last.x;
      const dy = trimmed[i].y - last.y;
      if (Math.sqrt(dx * dx + dy * dy) > 1.5) {
        merged.push(trimmed[i]);
      }
    }

    if (merged.length < 2) continue;

    // Douglas-Peucker simplification
    const simplified = douglasPeucker(merged, 1.2);

    // Bezier/Moving Average Smoothing
    const smoothed = smoothStroke(simplified);

    // Recalculate cleaned stroke length
    let cleanLen = 0;
    for (let i = 1; i < smoothed.length; i++) {
      const dx = smoothed[i].x - smoothed[i - 1].x;
      const dy = smoothed[i].y - smoothed[i - 1].y;
      cleanLen += Math.sqrt(dx * dx + dy * dy);
    }

    totalStrokeLength += cleanLen;
    cleanedStrokes.push(smoothed);
  }

  const snappedStrokes = snapCloseEndpoints(cleanedStrokes);

  return {
    rawStrokes: strokes,
    cleanedStrokes: snappedStrokes,
    totalStrokeLength: Math.round(totalStrokeLength),
    strokeCount: snappedStrokes.length,
    removedTapCount
  };
}
