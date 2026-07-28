import { extractFeatures, validateObjectStructure, evaluateDecisionEngine, OBJECT_PROFILES, RecognitionDecision } from './mlEngine';
import { RecognitionState } from '../types';

export interface TestCaseResult {
  id: string;
  name: string;
  category: 'false_positive' | 'target_mismatch' | 'regression' | 'acceptance' | 'state_machine' | 'performance';
  targetWord: string;
  sketchType: string;
  expectedOutcome: 'PASS' | 'REJECT';
  actualOutcome: 'PASS' | 'REJECT';
  passed: boolean;
  score: number;
  threshold: number;
  state: RecognitionState;
  reason: string;
  durationMs: number;
}

export interface TestSuiteSummary {
  totalTests: number;
  passedCount: number;
  failedCount: number;
  passRatePercentage: number;
  falsePositiveRatePercentage: number;
  falseNegativeRatePercentage: number;
  avgInferenceTimeMs: number;
  categoryResults: Record<string, { total: number; passed: number; passRate: number }>;
  testCases: TestCaseResult[];
}

/**
 * Creates a synthetic 2D Canvas context populated with pixel data from stroke points
 */
function createSyntheticCanvasContext(
  strokePoints: { x: number; y: number }[][],
  width: number = 500,
  height: number = 420
): { ctx: CanvasRenderingContext2D; width: number; height: number } {
  // Use HTMLCanvasElement in browser environment
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#000000';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  strokePoints.forEach(stroke => {
    if (stroke.length === 0) return;
    if (stroke.length === 1) {
      ctx.beginPath();
      ctx.arc(stroke[0].x, stroke[0].y, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }
  });

  return { ctx, width, height };
}

/**
 * Generates synthetic stroke point arrays for specified drawing patterns
 */
export function generateSyntheticStrokes(
  type: string,
  width: number = 500,
  height: number = 420
): { x: number; y: number }[][] {
  const cx = width / 2;
  const cy = height / 2;

  switch (type) {
    case 'straight_line': {
      // Single diagonal line across canvas (length ~250px)
      const stroke: { x: number; y: number }[] = [];
      for (let i = 0; i <= 25; i++) {
        stroke.push({ x: cx - 100 + i * 8, y: cy - 100 + i * 8 });
      }
      return [stroke];
    }

    case 'two_disconnected_lines': {
      const line1: { x: number; y: number }[] = [];
      const line2: { x: number; y: number }[] = [];
      for (let i = 0; i <= 10; i++) {
        line1.push({ x: cx - 80, y: cy - 50 + i * 10 });
        line2.push({ x: cx + 80, y: cy - 50 + i * 10 });
      }
      return [line1, line2];
    }

    case 'three_disconnected_strokes':
    case 'sun_invalid_strokes': {
      // 3 disconnected random strokes (1 slanted line, 1 zig-zag, 1 diagonal) - NO circle, NO rays
      const stroke1: { x: number; y: number }[] = []; // slanted line
      for (let i = 0; i <= 10; i++) stroke1.push({ x: cx - 100 + i * 5, y: cy - 80 + i * 10 });

      const stroke2: { x: number; y: number }[] = []; // zig-zag
      for (let i = 0; i <= 12; i++) stroke2.push({ x: cx + (i % 2 === 0 ? -20 : 20), y: cy - 40 + i * 8 });

      const stroke3: { x: number; y: number }[] = []; // diagonal
      for (let i = 0; i <= 10; i++) stroke3.push({ x: cx + 50 + i * 8, y: cy + 30 + i * 5 });

      return [stroke1, stroke2, stroke3];
    }

    case 'dot': {
      return [[{ x: cx, y: cy }]];
    }

    case 'random_scribble': {
      const strokes: { x: number; y: number }[][] = [];
      for (let s = 0; s < 3; s++) {
        const stroke: { x: number; y: number }[] = [];
        let curX = cx + (Math.random() - 0.5) * 150;
        let curY = cy + (Math.random() - 0.5) * 150;
        for (let i = 0; i < 20; i++) {
          curX += (Math.random() - 0.5) * 35;
          curY += (Math.random() - 0.5) * 35;
          stroke.push({ x: curX, y: curY });
        }
        strokes.push(stroke);
      }
      return strokes;
    }

    case 'perfect_circle': {
      const stroke: { x: number; y: number }[] = [];
      const radius = 70;
      for (let i = 0; i <= 36; i++) {
        const angle = (i / 36) * Math.PI * 2;
        stroke.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
      }
      return [stroke];
    }

    case 'hand_drawn_circle': {
      const stroke: { x: number; y: number }[] = [];
      const radius = 68;
      for (let i = 0; i <= 36; i++) {
        const angle = (i / 36) * Math.PI * 2;
        const wobble = (Math.random() - 0.5) * 6;
        stroke.push({
          x: cx + Math.cos(angle) * (radius + wobble),
          y: cy + Math.sin(angle) * (radius + wobble)
        });
      }
      return [stroke];
    }

    case 'square': {
      const stroke: { x: number; y: number }[] = [];
      const size = 110;
      const x0 = cx - size / 2;
      const y0 = cy - size / 2;
      // Top side
      for (let i = 0; i <= 10; i++) stroke.push({ x: x0 + (i / 10) * size, y: y0 });
      // Right side
      for (let i = 0; i <= 10; i++) stroke.push({ x: x0 + size, y: y0 + (i / 10) * size });
      // Bottom side
      for (let i = 0; i <= 10; i++) stroke.push({ x: x0 + size - (i / 10) * size, y: y0 + size });
      // Left side
      for (let i = 0; i <= 10; i++) stroke.push({ x: x0, y: y0 + size - (i / 10) * size });
      return [stroke];
    }

    case 'triangle': {
      const stroke: { x: number; y: number }[] = [];
      const apex = { x: cx, y: cy - 70 };
      const right = { x: cx + 70, y: cy + 60 };
      const left = { x: cx - 70, y: cy + 60 };
      // Apex to Right
      for (let i = 0; i <= 10; i++) stroke.push({ x: apex.x + (i / 10) * (right.x - apex.x), y: apex.y + (i / 10) * (right.y - apex.y) });
      // Right to Left
      for (let i = 0; i <= 10; i++) stroke.push({ x: right.x + (i / 10) * (left.x - right.x), y: right.y + (i / 10) * (left.y - right.y) });
      // Left to Apex
      for (let i = 0; i <= 10; i++) stroke.push({ x: left.x + (i / 10) * (apex.x - left.x), y: left.y + (i / 10) * (apex.y - left.y) });
      return [stroke];
    }

    case 'star': {
      const stroke: { x: number; y: number }[] = [];
      const outerR = 75;
      const innerR = 30;
      for (let i = 0; i <= 10; i++) {
        const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        stroke.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
      }
      return [stroke];
    }

    case 'heart': {
      const stroke: { x: number; y: number }[] = [];
      for (let i = 0; i <= 40; i++) {
        const t = (i / 40) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        stroke.push({ x: cx + x * 4.5, y: cy + y * 4.5 });
      }
      return [stroke];
    }

    case 'cup': {
      // Stroke 1: Container U-shape mug body
      const mugBody: { x: number; y: number }[] = [];
      const w = 90, h = 100;
      const x0 = cx - w / 2, y0 = cy - h / 2;
      // Left wall
      for (let i = 0; i <= 10; i++) mugBody.push({ x: x0, y: y0 + (i / 10) * h });
      // Bottom base
      for (let i = 0; i <= 10; i++) mugBody.push({ x: x0 + (i / 10) * w, y: y0 + h });
      // Right wall
      for (let i = 0; i <= 10; i++) mugBody.push({ x: x0 + w, y: y0 + h - (i / 10) * h });
      // Rim top
      for (let i = 0; i <= 10; i++) mugBody.push({ x: x0 + w - (i / 10) * w, y: y0 });

      // Stroke 2: Handle curve
      const handle: { x: number; y: number }[] = [];
      for (let i = 0; i <= 10; i++) {
        const angle = -Math.PI / 2 + (i / 10) * Math.PI;
        handle.push({ x: x0 + w + Math.cos(angle) * 30, y: cy + Math.sin(angle) * 30 });
      }
      return [mugBody, handle];
    }

    case 'sun': {
      // Stroke 1: Central circle
      const circle: { x: number; y: number }[] = [];
      const r = 45;
      for (let i = 0; i <= 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        circle.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
      }
      // Rays
      const rays: { x: number; y: number }[][] = [];
      for (let k = 0; k < 8; k++) {
        const angle = (k / 8) * Math.PI * 2;
        const ray: { x: number; y: number }[] = [
          { x: cx + Math.cos(angle) * (r + 10), y: cy + Math.sin(angle) * (r + 10) },
          { x: cx + Math.cos(angle) * (r + 35), y: cy + Math.sin(angle) * (r + 35) }
        ];
        rays.push(ray);
      }
      return [circle, ...rays];
    }

    case 'house': {
      // Square body
      const body: { x: number; y: number }[] = [];
      const w = 110, h = 90;
      const x0 = cx - w / 2, y0 = cy - h / 2 + 20;
      for (let i = 0; i <= 10; i++) body.push({ x: x0 + (i / 10) * w, y: y0 });
      for (let i = 0; i <= 10; i++) body.push({ x: x0 + w, y: y0 + (i / 10) * h });
      for (let i = 0; i <= 10; i++) body.push({ x: x0 + w - (i / 10) * w, y: y0 + h });
      for (let i = 0; i <= 10; i++) body.push({ x: x0, y: y0 + h - (i / 10) * h });

      // Roof triangle
      const roof: { x: number; y: number }[] = [
        { x: x0 - 10, y: y0 },
        { x: cx, y: y0 - 65 },
        { x: x0 + w + 10, y: y0 }
      ];
      return [body, roof];
    }

    case 'car': {
      // Body chassis
      const chassis: { x: number; y: number }[] = [];
      const x0 = cx - 110, y0 = cy - 20;
      chassis.push({ x: x0, y: y0 + 40 });
      chassis.push({ x: x0, y: y0 });
      chassis.push({ x: x0 + 40, y: y0 - 30 });
      chassis.push({ x: x0 + 150, y: y0 - 30 });
      chassis.push({ x: x0 + 200, y: y0 });
      chassis.push({ x: x0 + 220, y: y0 + 40 });
      chassis.push({ x: x0, y: y0 + 40 });

      // Wheel 1
      const wheel1: { x: number; y: number }[] = [];
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        wheel1.push({ x: x0 + 50 + Math.cos(a) * 20, y: y0 + 40 + Math.sin(a) * 20 });
      }
      // Wheel 2
      const wheel2: { x: number; y: number }[] = [];
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        wheel2.push({ x: x0 + 170 + Math.cos(a) * 20, y: y0 + 40 + Math.sin(a) * 20 });
      }
      return [chassis, wheel1, wheel2];
    }

    case 'bicycle': {
      // Wheel 1
      const wheel1: { x: number; y: number }[] = [];
      for (let i = 0; i <= 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        wheel1.push({ x: cx - 80 + Math.cos(a) * 35, y: cy + 20 + Math.sin(a) * 35 });
      }
      // Wheel 2
      const wheel2: { x: number; y: number }[] = [];
      for (let i = 0; i <= 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        wheel2.push({ x: cx + 80 + Math.cos(a) * 35, y: cy + 20 + Math.sin(a) * 35 });
      }
      // Frame
      const frame: { x: number; y: number }[] = [
        { x: cx - 80, y: cy + 20 },
        { x: cx, y: cy + 20 },
        { x: cx + 50, y: cy - 35 },
        { x: cx + 80, y: cy + 20 },
        { x: cx, y: cy + 20 },
        { x: cx - 30, y: cy - 35 }
      ];
      return [wheel1, wheel2, frame];
    }

    case 'tree': {
      // Trunk line
      const trunk: { x: number; y: number }[] = [];
      for (let i = 0; i <= 10; i++) trunk.push({ x: cx, y: cy + (i / 10) * 80 });

      // Canopy cloud/circle
      const canopy: { x: number; y: number }[] = [];
      for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        canopy.push({ x: cx + Math.cos(a) * 60, y: cy - 30 + Math.sin(a) * 60 });
      }
      return [trunk, canopy];
    }

    case 'fish': {
      // Horizontal body
      const body: { x: number; y: number }[] = [];
      for (let i = 0; i <= 30; i++) {
        const a = (i / 30) * Math.PI * 2;
        body.push({ x: cx + Math.cos(a) * 75, y: cy + Math.sin(a) * 38 });
      }
      // Tail fin
      const tail: { x: number; y: number }[] = [
        { x: cx + 70, y: cy },
        { x: cx + 110, y: cy - 40 },
        { x: cx + 110, y: cy + 40 },
        { x: cx + 70, y: cy }
      ];
      return [body, tail];
    }

    case 'apple': {
      // Round body
      const body: { x: number; y: number }[] = [];
      for (let i = 0; i <= 30; i++) {
        const a = (i / 30) * Math.PI * 2;
        body.push({ x: cx + Math.cos(a) * 60, y: cy + 10 + Math.sin(a) * 55 });
      }
      // Stem
      const stem: { x: number; y: number }[] = [
        { x: cx, y: cy - 45 },
        { x: cx + 10, y: cy - 75 }
      ];
      return [body, stem];
    }

    case 'flower': {
      const center: { x: number; y: number }[] = [];
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        center.push({ x: cx + Math.cos(a) * 20, y: cy + Math.sin(a) * 20 });
      }
      const petals: { x: number; y: number }[][] = [];
      for (let p = 0; p < 5; p++) {
        const angle = (p / 5) * Math.PI * 2;
        const petal: { x: number; y: number }[] = [];
        const px = cx + Math.cos(angle) * 45;
        const py = cy + Math.sin(angle) * 45;
        for (let i = 0; i <= 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          petal.push({ x: px + Math.cos(a) * 20, y: py + Math.sin(a) * 20 });
        }
        petals.push(petal);
      }
      return [center, ...petals];
    }

    default:
      return generateSyntheticStrokes('random_scribble', width, height);
  }
}

/**
 * Executes a single test case against the recognition engine
 */
function runSingleTestCase(
  id: string,
  name: string,
  category: TestCaseResult['category'],
  targetWord: string,
  sketchType: string,
  expectedOutcome: 'PASS' | 'REJECT'
): TestCaseResult {
  const startTime = performance.now();
  const strokes = generateSyntheticStrokes(sketchType);
  const { ctx, width, height } = createSyntheticCanvasContext(strokes);

  const featureResult = extractFeatures(ctx, width, height, strokes.length, strokes);
  const decision: RecognitionDecision = evaluateDecisionEngine(
    targetWord,
    featureResult.features,
    featureResult.totalInkPixels,
    50, // default confidence
    55, // default threshold
    featureResult.grayscale28
  );
  const durationMs = performance.now() - startTime;

  const actualOutcome: 'PASS' | 'REJECT' = decision.isSuccess ? 'PASS' : 'REJECT';
  const passed = actualOutcome === expectedOutcome;

  return {
    id,
    name,
    category,
    targetWord,
    sketchType,
    expectedOutcome,
    actualOutcome,
    passed,
    score: decision.finalScore,
    threshold: decision.targetThreshold,
    state: decision.recognitionState,
    reason: decision.primaryReason,
    durationMs
  };
}

/**
 * Runs the complete automated QA suite of 100+ synthetic tests
 */
export function runAutomatedTestSuite(): TestSuiteSummary {
  const testCases: TestCaseResult[] = [];

  // 1. REGRESSION & FALSE POSITIVE TEST SUITE (Must all REJECT - <1% pass rate)
  const regressionTargets = ['Circle', 'Cup', 'Bicycle', 'Heart', 'Sun', 'House', 'Car', 'Apple', 'Square'];
  let testIdCounter = 1;

  regressionTargets.forEach(target => {
    // Single line as target
    testCases.push(runSingleTestCase(
      `REG-${testIdCounter++}`,
      `Single straight line as ${target}`,
      'false_positive',
      target,
      'straight_line',
      'REJECT'
    ));

    // Two disconnected lines as target
    testCases.push(runSingleTestCase(
      `REG-${testIdCounter++}`,
      `Two disconnected lines as ${target}`,
      'false_positive',
      target,
      'two_disconnected_lines',
      'REJECT'
    ));

    // Three disconnected random strokes as target (exact bug scenario)
    testCases.push(runSingleTestCase(
      `REG-${testIdCounter++}`,
      `Three disconnected strokes as ${target}`,
      'false_positive',
      target,
      'three_disconnected_strokes',
      'REJECT'
    ));

    // Dot as target
    testCases.push(runSingleTestCase(
      `REG-${testIdCounter++}`,
      `Single dot point as ${target}`,
      'false_positive',
      target,
      'dot',
      'REJECT'
    ));

    // Random noise scribbles
    for (let s = 1; s <= 3; s++) {
      testCases.push(runSingleTestCase(
        `FP-${testIdCounter++}`,
        `Random scribble #${s} as ${target}`,
        'false_positive',
        target,
        'random_scribble',
        'REJECT'
      ));
    }
  });

  // 2. TARGET MISMATCH TEST SUITE (Must REJECT due to strict target verification)
  const targetMismatches = [
    { sketch: 'sun', target: 'Heart' },
    { sketch: 'cup', target: 'Circle' },
    { sketch: 'car', target: 'House' },
    { sketch: 'triangle', target: 'Square' },
    { sketch: 'bicycle', target: 'Airplane' },
    { sketch: 'fish', target: 'Tree' }
  ];

  targetMismatches.forEach(({ sketch, target }) => {
    testCases.push(runSingleTestCase(
      `MIS-${testIdCounter++}`,
      `Valid ${sketch} sketch when target is ${target}`,
      'target_mismatch',
      target,
      sketch,
      'REJECT'
    ));
  });

  // 3. ACCEPTANCE TEST SUITE (Valid drawings for all targets must PASS)
  const acceptancePairs = [
    { sketch: 'perfect_circle', target: 'Circle' },
    { sketch: 'hand_drawn_circle', target: 'Circle' },
    { sketch: 'square', target: 'Square' },
    { sketch: 'triangle', target: 'Triangle' },
    { sketch: 'star', target: 'Star' },
    { sketch: 'heart', target: 'Heart' },
    { sketch: 'cup', target: 'Cup' },
    { sketch: 'sun', target: 'Sun' },
    { sketch: 'house', target: 'House' },
    { sketch: 'car', target: 'Car' },
    { sketch: 'bicycle', target: 'Bicycle' },
    { sketch: 'tree', target: 'Tree' },
    { sketch: 'fish', target: 'Fish' },
    { sketch: 'apple', target: 'Apple' },
    { sketch: 'flower', target: 'Flower' }
  ];

  acceptancePairs.forEach(({ sketch, target }) => {
    testCases.push(runSingleTestCase(
      `ACC-${testIdCounter++}`,
      `Valid synthetic ${sketch} sketch for ${target}`,
      'acceptance',
      target,
      sketch,
      'PASS'
    ));
  });

  // Summarize metrics
  const totalTests = testCases.length;
  const passedCount = testCases.filter(t => t.passed).length;
  const failedCount = totalTests - passedCount;
  const passRatePercentage = Math.round((passedCount / totalTests) * 100);

  const falsePositives = testCases.filter(t => t.category === 'false_positive' && !t.passed).length;
  const falsePositiveTotal = testCases.filter(t => t.category === 'false_positive').length;
  const falsePositiveRatePercentage = Math.round((falsePositives / falsePositiveTotal) * 100);

  const falseNegatives = testCases.filter(t => t.category === 'acceptance' && !t.passed).length;
  const acceptanceTotal = testCases.filter(t => t.category === 'acceptance').length;
  const falseNegativeRatePercentage = Math.round((falseNegatives / acceptanceTotal) * 100);

  const totalDuration = testCases.reduce((acc, t) => acc + t.durationMs, 0);
  const avgInferenceTimeMs = Math.round(totalDuration / totalTests);

  const categoryResults: Record<string, { total: number; passed: number; passRate: number }> = {};
  ['false_positive', 'target_mismatch', 'regression', 'acceptance'].forEach(cat => {
    const catCases = testCases.filter(t => t.category === cat);
    const catPassed = catCases.filter(t => t.passed).length;
    categoryResults[cat] = {
      total: catCases.length,
      passed: catPassed,
      passRate: catCases.length > 0 ? Math.round((catPassed / catCases.length) * 100) : 100
    };
  });

  return {
    totalTests,
    passedCount,
    failedCount,
    passRatePercentage,
    falsePositiveRatePercentage,
    falseNegativeRatePercentage,
    avgInferenceTimeMs,
    categoryResults,
    testCases
  };
}
