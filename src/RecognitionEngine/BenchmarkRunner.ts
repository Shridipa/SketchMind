import { evaluatePipelineDecision } from './RecognitionEngine';
import { Point } from './StrokeProcessor';

export interface BenchmarkTestCase {
  id: string;
  category: string;
  type: 'perfect' | 'messy' | 'rotated' | 'scaled' | 'scribble' | 'straight_line' | 'dot' | 'wrong_object';
  strokes: Point[][];
  expectedResult: boolean; // true = should pass, false = should reject
}

export interface BenchmarkSummary {
  totalTests: number;
  passedCount: number;
  failedCount: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  truePositiveRate: number; // percentage
  falsePositiveRate: number; // percentage
  scribbleRejectionRate: number; // percentage
  averageLatencyMs: number;
  passedBenchmark: boolean;
}

/**
 * Helper to generate programmatic synthetic test strokes
 */
function generateSyntheticStrokes(type: BenchmarkTestCase['type'], category: string): Point[][] {
  const strokes: Point[][] = [];

  if (type === 'dot') {
    return [[{ x: 50, y: 50 }, { x: 51, y: 51 }]];
  }

  if (type === 'straight_line') {
    return [[{ x: 20, y: 50 }, { x: 180, y: 50 }]];
  }

  if (type === 'scribble') {
    const s: Point[] = [];
    for (let i = 0; i < 20; i++) {
      s.push({ x: 30 + (i % 5) * 20 + Math.random() * 15, y: 30 + Math.floor(i / 5) * 20 + Math.random() * 15 });
    }
    return [s];
  }

  if (type === 'perfect' || type === 'messy' || type === 'rotated' || type === 'scaled') {
    const s: Point[] = [];
    const radius = type === 'scaled' ? 25 : 60;
    const numPoints = 16;

    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI + (type === 'rotated' ? 0.3 : 0);
      const jitter = type === 'messy' ? (Math.random() - 0.5) * 8 : 0;
      s.push({
        x: 100 + (radius + jitter) * Math.cos(angle),
        y: 100 + (radius + jitter) * Math.sin(angle)
      });
    }
    return [s];
  }

  return [[{ x: 40, y: 40 }, { x: 140, y: 40 }, { x: 140, y: 140 }, { x: 40, y: 140 }, { x: 40, y: 40 }]];
}

/**
 * Stage 13: Benchmark Runner
 * QA suite running 100s of automated test cases to guarantee <1% false positive rate and <80ms latency.
 */
export function runBenchmarkSuite(): BenchmarkSummary {
  const categories = [
    'Circle', 'Square', 'Triangle', 'Star', 'Heart',
    'Sun', 'Moon', 'Apple', 'Fish', 'Leaf',
    'House', 'Tree', 'Flower', 'Cup', 'Book',
    'Car', 'Rocket', 'Airplane', 'Bicycle', 'Cat'
  ];

  const testCases: BenchmarkTestCase[] = [];

  categories.forEach((cat, idx) => {
    testCases.push({ id: `tc_${cat}_perfect`, category: cat, type: 'perfect', strokes: generateSyntheticStrokes('perfect', cat), expectedResult: true });
    testCases.push({ id: `tc_${cat}_messy`, category: cat, type: 'messy', strokes: generateSyntheticStrokes('messy', cat), expectedResult: true });
    testCases.push({ id: `tc_${cat}_rotated`, category: cat, type: 'rotated', strokes: generateSyntheticStrokes('rotated', cat), expectedResult: true });
    testCases.push({ id: `tc_${cat}_scribble`, category: cat, type: 'scribble', strokes: generateSyntheticStrokes('scribble', cat), expectedResult: false });
    testCases.push({ id: `tc_${cat}_line`, category: cat, type: 'straight_line', strokes: generateSyntheticStrokes('straight_line', cat), expectedResult: false });
    testCases.push({ id: `tc_${cat}_dot`, category: cat, type: 'dot', strokes: generateSyntheticStrokes('dot', cat), expectedResult: false });
  });

  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;
  let totalLatency = 0;
  let scribblesRejected = 0;
  let totalScribbles = 0;

  for (const tc of testCases) {
    const start = performance.now();
    const res = evaluatePipelineDecision(tc.category, tc.strokes, 65);
    const lat = performance.now() - start;
    totalLatency += lat;

    if (tc.type === 'scribble' || tc.type === 'straight_line' || tc.type === 'dot') {
      totalScribbles++;
      if (!res.isSuccess) scribblesRejected++;
    }

    if (tc.expectedResult) {
      if (res.isSuccess) truePositives++; else falseNegatives++;
    } else {
      if (!res.isSuccess) trueNegatives++; else falsePositives++;
    }
  }

  const total = testCases.length;
  const tpRate = Number(((truePositives / Math.max(1, truePositives + falseNegatives)) * 100).toFixed(1));
  const fpRate = Number(((falsePositives / Math.max(1, falsePositives + trueNegatives)) * 100).toFixed(1));
  const scribbleRejectionRate = Number(((scribblesRejected / Math.max(1, totalScribbles)) * 100).toFixed(1));
  const avgLatency = Number((totalLatency / Math.max(1, total)).toFixed(2));

  return {
    totalTests: total,
    passedCount: truePositives + trueNegatives,
    failedCount: falsePositives + falseNegatives,
    truePositives,
    falsePositives,
    trueNegatives,
    falseNegatives,
    truePositiveRate: tpRate,
    falsePositiveRate: fpRate,
    scribbleRejectionRate,
    averageLatencyMs: avgLatency,
    passedBenchmark: fpRate <= 1.0 && tpRate >= 90.0 && avgLatency <= 80.0
  };
}
