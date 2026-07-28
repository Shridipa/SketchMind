import { DrawingFeatures, Prediction, Challenge, RecognitionState } from '../types';
import { calculateReferenceSimilarity } from './referenceSketches';

export { evaluatePipelineDecision } from '../RecognitionEngine/RecognitionEngine';
export { runBenchmarkSuite } from '../RecognitionEngine/BenchmarkRunner';

export function getTargetThreshold(difficulty?: string, level?: number): number {
  if (difficulty === 'Very Easy' || (level && level <= 5)) return 35; // Sketches 1-5 (35% threshold - Very Easy)
  if (difficulty === 'Easy' || (level && level <= 10)) return 45;      // Sketches 6-10 (45% threshold - Easy)
  if (difficulty === 'Medium' || (level && level <= 15)) return 60;    // Sketches 11-15 (60% threshold - Medium)
  if (difficulty === 'Hard' || (level && level > 15)) return 75;      // Sketches 16-20 (75% threshold - Hard)
  return 45;
}

export const SEMANTIC_FAMILY_MAP: Record<string, { synonyms: string[]; label: string }> = {
  'Circle': { synonyms: ['circle', 'sun', 'moon', 'apple', 'heart', 'flower', 'round'], label: 'Round geometry detected!' },
  'Square': { synonyms: ['square', 'house', 'book', 'cup', 'car', 'box'], label: 'Box/quadrilateral structure detected!' },
  'Triangle': { synonyms: ['triangle', 'star', 'rocket', 'house', 'cat', 'pyramid'], label: 'Apex/angular geometry detected!' },
  'Star': { synonyms: ['star', 'sun', 'triangle', 'flower'], label: 'Radiating point pattern detected!' },
  'Heart': { synonyms: ['heart', 'apple', 'circle', 'leaf'], label: 'Symmetric heart curve detected!' },
  'Sun': { synonyms: ['sun', 'circle', 'star', 'flower'], label: 'Solar core pattern detected!' },
  'Moon': { synonyms: ['moon', 'circle', 'leaf', 'fish'], label: 'Crescent curve detected!' },
  'Apple': { synonyms: ['apple', 'circle', 'heart', 'sun', 'fruit'], label: 'Fruit body & stem detected!' },
  'Fish': { synonyms: ['fish', 'moon', 'leaf', 'airplane', 'swimmer'], label: 'Swimmer body & tail detected!' },
  'Leaf': { synonyms: ['leaf', 'tree', 'flower', 'moon', 'plant'], label: 'Plant leaf contour detected!' },
  'House': { synonyms: ['house', 'square', 'triangle', 'book', 'building', 'home', 'cabin'], label: 'Building roof & box base detected!' },
  'Tree': { synonyms: ['tree', 'plant', 'leaf', 'flower', 'rocket', 'bush'], label: 'Trunk & canopy structure detected!' },
  'Flower': { synonyms: ['flower', 'tree', 'sun', 'star', 'circle', 'plant', 'rose'], label: 'Petal & core pattern detected!' },
  'Cup': { synonyms: ['cup', 'house', 'square', 'circle', 'mug'], label: 'Container & handle shape detected!' },
  'Book': { synonyms: ['book', 'square', 'house', 'car', 'notebook'], label: 'Rectangular page layout detected!' },
  'Car': { synonyms: ['car', 'square', 'book', 'cup', 'vehicle', 'automobile'], label: 'Chassis & dual wheel base detected!' },
  'Rocket': { synonyms: ['rocket', 'triangle', 'tree', 'airplane', 'spacecraft'], label: 'Cone tip & tube fuselage detected!' },
  'Airplane': { synonyms: ['airplane', 'rocket', 'fish', 'star', 'aircraft', 'plane', 'jet'], label: 'Fuselage & wing structure detected!' },
  'Bicycle': { synonyms: ['bicycle', 'circle', 'car', 'bike'], label: 'Dual wheel frame structure detected!' },
  'Cat': { synonyms: ['cat', 'triangle', 'circle', 'star', 'feline'], label: 'Cat ear & head geometry detected!' }
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

// The 20 categories for the 20-Sketch Challenge (All 20 from Google Quick, Draw!)
export const CATEGORIES = [
  'Airplane',
  'Apple',
  'Bicycle',
  'Book',
  'Car',
  'Cat',
  'Circle',
  'Clock',
  'Cloud',
  'Cup',
  'Fish',
  'Flower',
  'House',
  'Moon',
  'Rocket',
  'Star',
  'Sun',
  'Tree',
  'Triangle',
  'Square'
];


export const CHALLENGES_20: Challenge[] = [
  // Sketches 1-5 (Very Easy - 50% Threshold)
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
  // Sketches 6-10 (Easy - 55% Threshold)
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
  // Sketches 11-15 (Medium - 60% Threshold)
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
  // Sketches 16-20 (Hard - 75% Threshold)
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

export interface RecognitionDecision {
  targetWord: string;
  categoryType: 'geometry' | 'simple' | 'complex';
  recognitionState: RecognitionState;
  stateMessage: string;
  isLocked: boolean;
  geometryScore: number;     // 0 - 100
  featureScore: number;      // 0 - 100
  shapeSimilarity: number;   // 0 - 100
  mlConfidence: number;      // 0 - 100
  strokeQuality: number;     // 0 - 100
  structuralPassed: boolean;
  missingFeatures: string[];
  totalStrokeLength: number;
  boxWidth: number;
  boxHeight: number;
  finalScore: number;        // 0 - 100
  targetThreshold: number;
  isSuccess: boolean;
  essentialMatched: boolean;
  primaryReason: string;
  smartHint?: string;
}

export type CategoryType = 'geometry' | 'simple' | 'complex';

export const CATEGORY_TYPES: Record<string, CategoryType> = {
  'Circle': 'geometry',
  'Square': 'geometry',
  'Triangle': 'geometry',
  'Star': 'geometry',
  'Heart': 'geometry',

  'Sun': 'simple',
  'Moon': 'simple',
  'Apple': 'simple',
  'Fish': 'simple',
  'Leaf': 'simple',
  'House': 'simple',
  'Tree': 'simple',
  'Flower': 'simple',
  'Cup': 'simple',
  'Book': 'simple',

  'Car': 'complex',
  'Rocket': 'complex',
  'Airplane': 'complex',
  'Bicycle': 'complex',
  'Cat': 'complex',
};

export interface ObjectProfile {
  requiredFeatures: string[];
  optionalFeatures: string[];
  minimumInkPixels: number;
  minimumStrokeLength: number;
  minimumBoxWidth: number;
  minimumBoxHeight: number;
  minimumStrokeCount: number;
  minimumSimilarity: number;
  minimumMlConfidence: number;
  categoryType: CategoryType;
}

export const OBJECT_PROFILES: Record<string, ObjectProfile> = {
  'Circle': {
    requiredFeatures: ['Closed contour loop', 'Circularity >= 0.50', 'Aspect ratio 0.75-1.35', 'Corner count <= 5'],
    optionalFeatures: ['Single smooth stroke'],
    minimumInkPixels: 20,
    minimumStrokeLength: 120,
    minimumBoxWidth: 65,
    minimumBoxHeight: 65,
    minimumStrokeCount: 1,
    minimumSimilarity: 0.75,
    minimumMlConfidence: 40,
    categoryType: 'geometry'
  },
  'Square': {
    requiredFeatures: ['3-5 dominant corners or box outline', 'Aspect ratio 0.75-1.30'],
    optionalFeatures: ['Parallel sides'],
    minimumInkPixels: 22,
    minimumStrokeLength: 130,
    minimumBoxWidth: 65,
    minimumBoxHeight: 65,
    minimumStrokeCount: 1,
    minimumSimilarity: 0.70,
    minimumMlConfidence: 40,
    categoryType: 'geometry'
  },
  'Triangle': {
    requiredFeatures: ['2-4 dominant corners & apex peak', '3 connected sides or closed contour'],
    optionalFeatures: ['Sharp corners'],
    minimumInkPixels: 20,
    minimumStrokeLength: 120,
    minimumBoxWidth: 60,
    minimumBoxHeight: 60,
    minimumStrokeCount: 1,
    minimumSimilarity: 0.70,
    minimumMlConfidence: 40,
    categoryType: 'geometry'
  },
  'Star': {
    requiredFeatures: ['5 radiating points or crossing star strokes', 'At least 3 corners'],
    optionalFeatures: ['Symmetric points'],
    minimumInkPixels: 22,
    minimumStrokeLength: 140,
    minimumBoxWidth: 65,
    minimumBoxHeight: 65,
    minimumStrokeCount: 1,
    minimumSimilarity: 0.65,
    minimumMlConfidence: 40,
    categoryType: 'geometry'
  },
  'Heart': {
    requiredFeatures: ['Symmetric top lobes & bottom V apex', 'Horizontal symmetry > 42%'],
    optionalFeatures: ['Closed loop'],
    minimumInkPixels: 22,
    minimumStrokeLength: 130,
    minimumBoxWidth: 65,
    minimumBoxHeight: 65,
    minimumStrokeCount: 1,
    minimumSimilarity: 0.70,
    minimumMlConfidence: 40,
    categoryType: 'geometry'
  },
  'Sun': {
    requiredFeatures: ['Central core circle', 'Radiating beam rays'],
    optionalFeatures: ['Smile face'],
    minimumInkPixels: 25,
    minimumStrokeLength: 180,
    minimumBoxWidth: 80,
    minimumBoxHeight: 80,
    minimumStrokeCount: 2,
    minimumSimilarity: 0.60,
    minimumMlConfidence: 45,
    categoryType: 'simple'
  },
  'Moon': {
    requiredFeatures: ['Crescent C-curve outline'],
    optionalFeatures: ['Crater dots'],
    minimumInkPixels: 20,
    minimumStrokeLength: 120,
    minimumBoxWidth: 60,
    minimumBoxHeight: 60,
    minimumStrokeCount: 1,
    minimumSimilarity: 0.65,
    minimumMlConfidence: 40,
    categoryType: 'simple'
  },
  'Apple': {
    requiredFeatures: ['Rounded fruit body', 'Top stem or indent'],
    optionalFeatures: ['Leaf on stem'],
    minimumInkPixels: 25,
    minimumStrokeLength: 150,
    minimumBoxWidth: 70,
    minimumBoxHeight: 70,
    minimumStrokeCount: 1,
    minimumSimilarity: 0.60,
    minimumMlConfidence: 45,
    categoryType: 'simple'
  },
  'Fish': {
    requiredFeatures: ['Horizontal swimmer body', 'Tail fin'],
    optionalFeatures: ['Eye dot', 'Side fins'],
    minimumInkPixels: 25,
    minimumStrokeLength: 150,
    minimumBoxWidth: 80,
    minimumBoxHeight: 55,
    minimumStrokeCount: 1,
    minimumSimilarity: 0.60,
    minimumMlConfidence: 45,
    categoryType: 'simple'
  },
  'Leaf': {
    requiredFeatures: ['Tapered leaf contour', 'Center stem or vein stroke'],
    optionalFeatures: ['Side veins'],
    minimumInkPixels: 22,
    minimumStrokeLength: 130,
    minimumBoxWidth: 55,
    minimumBoxHeight: 65,
    minimumStrokeCount: 1,
    minimumSimilarity: 0.60,
    minimumMlConfidence: 40,
    categoryType: 'simple'
  },
  'House': {
    requiredFeatures: ['Main box body', 'Triangle roof peak'],
    optionalFeatures: ['Door', 'Windows', 'Chimney'],
    minimumInkPixels: 30,
    minimumStrokeLength: 180,
    minimumBoxWidth: 80,
    minimumBoxHeight: 80,
    minimumStrokeCount: 2,
    minimumSimilarity: 0.60,
    minimumMlConfidence: 45,
    categoryType: 'simple'
  },
  'Tree': {
    requiredFeatures: ['Vertical trunk line or rect', 'Leafy top canopy'],
    optionalFeatures: ['Branches'],
    minimumInkPixels: 28,
    minimumStrokeLength: 170,
    minimumBoxWidth: 70,
    minimumBoxHeight: 80,
    minimumStrokeCount: 2,
    minimumSimilarity: 0.60,
    minimumMlConfidence: 45,
    categoryType: 'simple'
  },
  'Flower': {
    requiredFeatures: ['Center core circle', 'At least 3-4 petal loops or stem'],
    optionalFeatures: ['Stem', 'Leaves'],
    minimumInkPixels: 25,
    minimumStrokeLength: 170,
    minimumBoxWidth: 70,
    minimumBoxHeight: 70,
    minimumStrokeCount: 2,
    minimumSimilarity: 0.60,
    minimumMlConfidence: 45,
    categoryType: 'simple'
  },
  'Cup': {
    requiredFeatures: ['Container body (U-shape or mug outline)', 'Container rim & bottom base'],
    optionalFeatures: ['Side handle', 'Steam lines'],
    minimumInkPixels: 28,
    minimumStrokeLength: 170,
    minimumBoxWidth: 70,
    minimumBoxHeight: 70,
    minimumStrokeCount: 1,
    minimumSimilarity: 0.65,
    minimumMlConfidence: 45,
    categoryType: 'simple'
  },
  'Book': {
    requiredFeatures: ['Rectangular page outline', 'Spine line or open pages'],
    optionalFeatures: ['Text lines', 'Bookmark'],
    minimumInkPixels: 28,
    minimumStrokeLength: 150,
    minimumBoxWidth: 75,
    minimumBoxHeight: 60,
    minimumStrokeCount: 1,
    minimumSimilarity: 0.60,
    minimumMlConfidence: 45,
    categoryType: 'simple'
  },
  'Car': {
    requiredFeatures: ['Horizontal body chassis', 'Two bottom wheels'],
    optionalFeatures: ['Windows', 'Roof arc'],
    minimumInkPixels: 35,
    minimumStrokeLength: 200,
    minimumBoxWidth: 90,
    minimumBoxHeight: 60,
    minimumStrokeCount: 2,
    minimumSimilarity: 0.60,
    minimumMlConfidence: 50,
    categoryType: 'complex'
  },
  'Rocket': {
    requiredFeatures: ['Vertical tube body', 'Pointed nose cone', 'Bottom side fins'],
    optionalFeatures: ['Exhaust flames', 'Porthole'],
    minimumInkPixels: 32,
    minimumStrokeLength: 180,
    minimumBoxWidth: 60,
    minimumBoxHeight: 90,
    minimumStrokeCount: 2,
    minimumSimilarity: 0.60,
    minimumMlConfidence: 50,
    categoryType: 'complex'
  },
  'Airplane': {
    requiredFeatures: ['Central fuselage body', 'Crossing wing structure', 'Tail fin'],
    optionalFeatures: ['Engines', 'Windows'],
    minimumInkPixels: 32,
    minimumStrokeLength: 200,
    minimumBoxWidth: 90,
    minimumBoxHeight: 80,
    minimumStrokeCount: 2,
    minimumSimilarity: 0.60,
    minimumMlConfidence: 50,
    categoryType: 'complex'
  },
  'Bicycle': {
    requiredFeatures: ['Two distinct wheel circles', 'Connecting frame structure'],
    optionalFeatures: ['Handlebars', 'Seat'],
    minimumInkPixels: 35,
    minimumStrokeLength: 220,
    minimumBoxWidth: 90,
    minimumBoxHeight: 60,
    minimumStrokeCount: 2,
    minimumSimilarity: 0.60,
    minimumMlConfidence: 50,
    categoryType: 'complex'
  },
  'Cat': {
    requiredFeatures: ['Round head contour', 'Top triangular ear peaks'],
    optionalFeatures: ['Whiskers', 'Tail', 'Eyes'],
    minimumInkPixels: 28,
    minimumStrokeLength: 160,
    minimumBoxWidth: 70,
    minimumBoxHeight: 70,
    minimumStrokeCount: 2,
    minimumSimilarity: 0.55,
    minimumMlConfidence: 45,
    categoryType: 'complex'
  }
};

/**
 * Computes connected components (islands of ink) on 28x28 grayscale grid
 */
export function countConnectedComponents(grayscale28: number[][], threshold = 30): number {
  if (!grayscale28 || grayscale28.length !== 28) return 0;

  const visited = Array(28).fill(false).map(() => Array(28).fill(false));
  let components = 0;

  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      if (grayscale28[y][x] > threshold && !visited[y][x]) {
        components++;
        const queue: [number, number][] = [[y, x]];
        visited[y][x] = true;

        while (queue.length > 0) {
          const [cy, cx] = queue.shift()!;
          const neighbors = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
          ];
          for (const [dy, dx] of neighbors) {
            const ny = cy + dy;
            const nx = cx + dx;
            if (ny >= 0 && ny < 28 && nx >= 0 && nx < 28) {
              if (grayscale28[ny][nx] > threshold && !visited[ny][nx]) {
                visited[ny][nx] = true;
                queue.push([ny, nx]);
              }
            }
          }
        }
      }
    }
  }

  return components;
}

/**
 * Calculates start point to end point distance of stroke paths in pixels
 */
export function calculateContourClosureDistance(
  rawStrokePoints: { x: number; y: number }[][]
): number {
  const cleanedStrokes = rawStrokePoints.filter(s => s.length >= 2);
  if (cleanedStrokes.length === 0) return 999;

  const firstStroke = cleanedStrokes[0];
  const lastStroke = cleanedStrokes[cleanedStrokes.length - 1];

  const startP = firstStroke[0];
  const endP = lastStroke[lastStroke.length - 1];

  return Math.hypot(endP.x - startP.x, endP.y - startP.y);
}

/**
 * Calculates overall Canvas Completeness Score (0 - 100%)
 */
export function calculateCanvasCompleteness(
  features: DrawingFeatures,
  totalInkPixels: number
): number {
  if (totalInkPixels < 20 || features.strokeCount === 0) return 0;

  let score = 0;

  // 1. Ink Coverage Volume (0 - 25 pts)
  score += Math.min(25, Math.round((totalInkPixels / 120) * 25));

  // 2. Stroke Length Span (0 - 25 pts)
  score += Math.min(25, Math.round((features.totalStrokeLength / 220) * 25));

  // 3. Drawing Bounding Box Area (0 - 25 pts)
  const boxArea = features.boxWidth * features.boxHeight;
  score += Math.min(25, Math.round((boxArea / 10000) * 25));

  // 4. Shape Feature Density (0 - 25 pts)
  let geoScore = 10;
  if (features.hasClosedLoop) geoScore += 10;
  if (features.cornerCount >= 2) geoScore += 5;
  score += Math.min(25, geoScore);

  return Math.min(100, score);
}

export interface StructuralValidationResult {
  passed: boolean;
  missingFeatures: string[];
  structuralScore: number;
  reason: string;
  smartHint?: string;
}

/**
 * Stage 2 – Object Structural Validation Gatekeeper (Human Teacher Engine)
 * Determines partial scores and checks essential shape structures.
 * Allows closing gaps up to 25-30px and forgiving hand-drawn variations.
 */
export function validateObjectStructure(
  targetCategory: string,
  features: DrawingFeatures,
  grayscale28: number[][],
  totalInkPixels: number = 100
): StructuralValidationResult {
  const profile = OBJECT_PROFILES[targetCategory] || OBJECT_PROFILES['Cup'];
  const components = features.connectedComponentsCount ?? countConnectedComponents(grayscale28);
  const closureDist = features.closedContourDistance ?? 999;
  const completeness = features.canvasCompletenessScore ?? calculateCanvasCompleteness(features, totalInkPixels);

  // Hard rejection 1: Single straight line when target is not a line
  if (features.isStraightLine) {
    return {
      passed: false,
      missingFeatures: ['Single straight line rejected (requires complete object shape)'],
      structuralScore: 0,
      reason: 'Rejected: Sketch is a single straight line, not an object.',
      smartHint: 'Draw a complete shape rather than a single line.'
    };
  }

  // Hard rejection 2: Insufficient total ink pixels
  if (totalInkPixels < 12) {
    return {
      passed: false,
      missingFeatures: [`Minimum ink density not met (${totalInkPixels} pixels)`],
      structuralScore: 5,
      reason: `Rejected: Insufficient ink on canvas (${totalInkPixels} pixels).`,
      smartHint: 'Keep drawing to add more details.'
    };
  }

  // Closing gap tolerances: gap <= 25px (Triangle, Circle) or <= 30px (Square, Heart) treated as closed!
  const isClosedGap25 = features.hasClosedLoop || closureDist <= 25;
  const isClosedGap30 = features.hasClosedLoop || closureDist <= 30;

  switch (targetCategory) {
    case 'Circle': {
      let score = 0;
      if (isClosedGap25) score += 45;
      else if (closureDist <= 45) score += 25;

      if (features.circularity >= 0.35) score += 35;
      else if (features.circularity >= 0.25) score += 20;

      if (features.aspectRatio >= 0.50 && features.aspectRatio <= 1.50) score += 20;

      // Hard Rule Requirement: Must be closed loop or gap <= 30px AND have decent roundness
      const passed = isClosedGap30 && features.circularity >= 0.28 && components <= 3;
      let smartHint = '';
      if (!isClosedGap25) smartHint = '✓ Round shape detected | ⚠ Loop is open — Close the ends to finish your circle.';
      else if (features.circularity < 0.35) smartHint = '✓ Closed loop detected | ⚠ Make the curve smoother and rounder.';
      else smartHint = '✓ Round closed circle shape recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['Closed round loop'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Rough closed circular loop detected' : 'Needs a closed or rounded loop',
        smartHint
      };
    }

    case 'Square': {
      let score = 0;
      if (isClosedGap30) score += 40;
      else if (closureDist <= 45) score += 22;

      if (features.cornerCount >= 2 && features.cornerCount <= 6) score += 40;
      else if (features.cornerCount >= 1) score += 25;

      if (features.aspectRatio >= 0.50 && features.aspectRatio <= 1.50) score += 20;

      // Hard Rule Requirement: Must be closed frame AND have 2-6 corners AND reasonable box aspect ratio
      const passed = isClosedGap30 && features.cornerCount >= 2 && features.cornerCount <= 6 && features.aspectRatio >= 0.50 && features.aspectRatio <= 1.50 && components <= 3;
      let smartHint = '';
      if (!isClosedGap30) smartHint = '✓ Box corners detected | ⚠ Frame is open — Connect corners to close your square.';
      else if (features.cornerCount < 2) smartHint = '✓ Outline drawn | ⚠ Add 4 sharp corners.';
      else smartHint = '✓ Box outline & corners recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['Box corners or closed frame'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Box outline & corners detected' : 'Needs box corners or closed frame',
        smartHint
      };
    }

    case 'Triangle': {
      let score = 0;
      if (isClosedGap30) score += 45;
      else if (closureDist <= 50) score += 28;

      if (features.cornerCount >= 2 && features.cornerCount <= 6) score += 40;
      else if (features.cornerCount >= 1) score += 25;

      if (features.aspectRatio >= 0.35 && features.aspectRatio <= 1.85) score += 15;

      // Hard Rule Requirement: Must be closed/near-closed AND have 2-6 corners
      const passed = (isClosedGap30 || closureDist <= 40) && features.cornerCount >= 2 && features.cornerCount <= 6 && components <= 3;
      let smartHint = '';
      if (closureDist > 25 && !features.hasClosedLoop) smartHint = '✓ 3 corners found | ✓ 3 sides found | ⚠ Bottom corner not connected — Connect the last edge to finish.';
      else if (features.cornerCount < 2) smartHint = '✓ Angles detected | ⚠ Sharpen the 3 triangle corners.';
      else smartHint = '✓ Triangular peak & connected sides recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['3 connected sides or apex peak'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Three sides / triangular corners detected' : 'Connect the 3 sides or close the gap',
        smartHint
      };
    }

    case 'Star': {
      let score = 0;
      if (features.cornerCount >= 3) score += 50;
      else if (features.cornerCount >= 2) score += 30;

      if (features.circularity < 0.95) score += 35;
      if (totalInkPixels >= 15) score += 15;

      // Hard Rule Requirement: Must have at least 2 sharp corners or radiating points
      const passed = features.cornerCount >= 2;
      let smartHint = features.cornerCount < 3 ? '✓ Radiating lines | ⚠ Add 5 sharp points radiating outward.' : '✓ Star tips recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['5 radiating points or sharp corners'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Multi-point star tips detected' : 'Draw radiating points or crossing strokes',
        smartHint
      };
    }

    case 'Heart': {
      let topLeftInk = 0, topRightInk = 0, bottomTipInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 25) {
            if (y < 14 && x < 14) topLeftInk++;
            if (y < 14 && x >= 14) topRightInk++;
            if (y >= 14 && x >= 6 && x <= 22) bottomTipInk++;
          }
        }
      }

      let score = 0;
      if (features.symmetryHorizontal >= 0.35) score += 35;
      if (topLeftInk >= 1 && topRightInk >= 1) score += 35;
      if (bottomTipInk >= 2) score += 30;

      // Hard Rule Requirement: Must have upper lobes AND bottom V tip
      const passed = (topLeftInk >= 1 && topRightInk >= 1) && bottomTipInk >= 1 && components <= 3;
      let smartHint = '';
      if (topLeftInk < 1 || topRightInk < 1) smartHint = '✓ Bottom point detected | ⚠ Missing upper rounded lobes — Add two rounded curves at the top.';
      else if (bottomTipInk < 1) smartHint = '✓ Upper lobes detected | ⚠ Meet at a sharp V point at the bottom.';
      else smartHint = '✓ Heart lobes & bottom tip recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['Symmetric top arches & bottom apex'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Dual lobes & bottom apex detected' : 'Needs two top rounded lobes and a bottom tip',
        smartHint
      };
    }

    case 'Sun': {
      let centerCoreInk = 0, rayInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 25) {
            if (y >= 7 && y <= 20 && x >= 7 && x <= 20) centerCoreInk++;
            else rayInk++;
          }
        }
      }

      let score = 0;
      if (features.hasClosedLoop || centerCoreInk >= 4) score += 50;
      if (rayInk >= 3) score += 40;

      const passed = score >= 35;
      let smartHint = rayInk < 3 ? '✓ Core circle detected | ⚠ Add short lines radiating out like sun beams.' : '✓ Sun core & rays recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['Central core circle with radiating rays'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Sun core & radiating rays detected' : 'Draw a center circle with radiating rays',
        smartHint
      };
    }

    case 'Moon': {
      let score = 0;
      if (features.aspectRatio >= 0.35 && features.aspectRatio <= 1.65) score += 40;
      if (features.circularity <= 0.85) score += 35;
      if (totalInkPixels >= 15) score += 25;

      const passed = score >= 35;
      let smartHint = '✓ Crescent moon arc recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['Crescent curve or half-moon arc'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Crescent curve / half moon detected' : 'Draw a curved crescent arc',
        smartHint
      };
    }

    case 'Apple': {
      let topStemInk = 0, bodyInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 25) {
            if (y <= 7) topStemInk++;
            else bodyInk++;
          }
        }
      }

      let score = 0;
      if (bodyInk >= 6) score += 50;
      if (topStemInk >= 1) score += 35;
      if (isClosedGap30) score += 15;

      const passed = score >= 35;
      let smartHint = topStemInk < 1 ? '✓ Fruit body detected | ⚠ Add a short vertical stem line on top.' : '✓ Apple fruit body & stem recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['Round fruit body with top stem'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Apple body & stem detected' : 'Draw a round body with a short top stem',
        smartHint
      };
    }

    case 'Fish': {
      let bodyInk = 0, tailInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 25) {
            if (x >= 18 || x <= 9) tailInk++;
            else bodyInk++;
          }
        }
      }

      let score = 0;
      if (bodyInk >= 5) score += 50;
      if (tailInk >= 1) score += 40;

      const passed = score >= 35;
      let smartHint = tailInk < 1 ? '✓ Oval body detected | ⚠ Add a triangle tail fin on one side.' : '✓ Fish swimmer body & tail fin recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['Horizontal oval body with tail fin'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Fish body & tail fin detected' : 'Draw an oval body with a triangular tail fin',
        smartHint
      };
    }

    case 'Leaf': {
      let score = 0;
      if (features.aspectRatio >= 0.40 && features.aspectRatio <= 1.80) score += 45;
      if (totalInkPixels >= 15) score += 40;

      const passed = score >= 35;
      let smartHint = '✓ Leaf contour & stem line recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['Tapered leaf contour'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Leaf contour detected' : 'Draw a tapered leaf outline with a center vein',
        smartHint
      };
    }

    case 'House': {
      let topRoofInk = 0, baseBoxInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 25) {
            if (y <= 13) topRoofInk++;
            else baseBoxInk++;
          }
        }
      }

      let score = 0;
      if (topRoofInk >= 1) score += 45;
      if (baseBoxInk >= 4) score += 45;

      const passed = score >= 35;
      let smartHint = topRoofInk < 1 ? '✓ Box base detected | ⚠ Add a triangular roof peak on top of the box.' : '✓ House base & roof peak recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['Square base box with triangle roof peak'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'House base & roof peak detected' : 'Draw a square base box and a triangle roof',
        smartHint
      };
    }

    case 'Tree': {
      let canopyInk = 0, trunkInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 25) {
            if (y < 16) canopyInk++;
            if (y >= 16 && x >= 6 && x <= 22) trunkInk++;
          }
        }
      }

      let score = 0;
      if (canopyInk >= 4) score += 50;
      if (trunkInk >= 1) score += 40;

      const passed = score >= 35;
      let smartHint = trunkInk < 1 ? '✓ Cloud canopy detected | ⚠ Add a straight vertical trunk line under the canopy.' : '✓ Tree canopy & trunk recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['Vertical trunk line with leafy canopy'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Tree canopy & trunk detected' : 'Draw a vertical trunk line with a round cloud canopy',
        smartHint
      };
    }

    case 'Flower': {
      let centerInk = 0, petalInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 25) {
            if (y >= 9 && y <= 18 && x >= 9 && x <= 18) centerInk++;
            else petalInk++;
          }
        }
      }

      let score = 0;
      if (centerInk >= 2 || features.hasClosedLoop) score += 45;
      if (petalInk >= 3) score += 45;

      const passed = score >= 35;
      let smartHint = petalInk < 3 ? '✓ Center core detected | ⚠ Add 4-5 petal loops surrounding the center.' : '✓ Flower center & petals recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['Center core circle surrounded by petals'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Flower core & petals detected' : 'Draw a center circle surrounded by petal loops',
        smartHint
      };
    }

    case 'Cup': {
      let bodyInk = 0, handleInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 25) {
            if (x >= 20 || x <= 7) handleInk++;
            else bodyInk++;
          }
        }
      }

      let score = 0;
      if (bodyInk >= 5) score += 50;
      if (handleInk >= 1) score += 40;

      const passed = score >= 35;
      let smartHint = handleInk < 1 ? '✓ Cup container detected | ⚠ Add a curved handle loop on the side.' : '✓ Cup container & handle recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['U-shape container with side handle'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Cup container & handle detected' : 'Draw a U-shaped mug with a side handle loop',
        smartHint
      };
    }

    case 'Book': {
      let score = 0;
      if (features.aspectRatio >= 0.50) score += 50;
      if (totalInkPixels >= 15) score += 40;

      const passed = score >= 35;
      let smartHint = '✓ Book page rectangle & spine recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['Rectangular pages or spine'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Book rectangle & spine detected' : 'Draw two connected rectangular pages',
        smartHint
      };
    }

    case 'Car': {
      let bodyInk = 0, wheelInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 25) {
            if (y >= 15) wheelInk++;
            else bodyInk++;
          }
        }
      }

      let score = 0;
      if (features.aspectRatio >= 0.65) score += 30;
      if (bodyInk >= 5) score += 40;
      if (wheelInk >= 1) score += 30;

      const passed = score >= 35;
      let smartHint = wheelInk < 1 ? '✓ Body chassis detected | ⚠ Add 2 round wheel circles underneath.' : '✓ Car chassis & wheels recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['Horizontal chassis with 2 bottom wheels'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Car chassis & wheels detected' : 'Draw a box chassis with two wheels underneath',
        smartHint
      };
    }

    case 'Rocket': {
      let bodyInk = 0, tipInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 25) {
            if (y <= 8) tipInk++;
            else bodyInk++;
          }
        }
      }

      let score = 0;
      if (bodyInk >= 5) score += 45;
      if (tipInk >= 1) score += 45;

      const passed = score >= 35;
      let smartHint = tipInk < 1 ? '✓ Rocket body tube detected | ⚠ Add a pointed cone tip on top.' : '✓ Rocket body & nose cone recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['Vertical tube with pointed nose cone'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Rocket tube & nose cone detected' : 'Draw a vertical tube with a pointed nose cone',
        smartHint
      };
    }

    case 'Airplane': {
      let bodyInk = 0, wingInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 25) {
            if (x < 8 || x > 19) wingInk++;
            else bodyInk++;
          }
        }
      }

      let score = 0;
      if (bodyInk >= 5) score += 45;
      if (wingInk >= 2) score += 45;

      const passed = score >= 35;
      let smartHint = wingInk < 2 ? '✓ Fuselage body line detected | ⚠ Add horizontal wings crossing the body.' : '✓ Airplane fuselage & wings recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['Central fuselage line crossed by wings'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Airplane fuselage & wings detected' : 'Draw a central line crossed by horizontal wings',
        smartHint
      };
    }

    case 'Bicycle': {
      let wheelInk = 0, frameInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 25) {
            if (y >= 14 && (x <= 10 || x >= 17)) wheelInk++;
            else frameInk++;
          }
        }
      }

      let score = 0;
      if (wheelInk >= 2) score += 50;
      if (frameInk >= 2) score += 40;

      const passed = score >= 35;
      let smartHint = wheelInk < 2 ? '✓ Frame lines detected | ⚠ Draw two separate wheel circles on the bottom.' : '✓ Bicycle wheels & frame recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['Two wheel circles connected by frame bars'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Bicycle wheels & frame detected' : 'Draw two wheel circles connected by frame lines',
        smartHint
      };
    }

    case 'Cat': {
      let headInk = 0, earInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 25) {
            if (y <= 8) earInk++;
            else headInk++;
          }
        }
      }

      let score = 0;
      if (headInk >= 5) score += 45;
      if (earInk >= 1) score += 45;

      const passed = score >= 35;
      let smartHint = earInk < 1 ? '✓ Round head detected | ⚠ Add two small pointy triangle ears on top.' : '✓ Cat head & pointy ears recognized!';

      return {
        passed,
        missingFeatures: passed ? [] : ['Round head circle with top pointy triangle ears'],
        structuralScore: Math.min(100, Math.max(passed ? 85 : score, score)),
        reason: passed ? 'Cat head & ear geometry detected' : 'Draw a head circle with two pointy triangle ears',
        smartHint
      };
    }

    default: {
      let score = Math.min(100, Math.round((totalInkPixels / 40) * 60 + (completeness * 0.4)));
      const passed = totalInkPixels >= 12;
      return {
        passed,
        missingFeatures: passed ? [] : ['Minimum Drawing Density'],
        structuralScore: passed ? Math.max(70, score) : 20,
        reason: passed ? 'Basic shape features detected' : 'Insufficient drawing density',
        smartHint: 'Keep sketching basic outlines.'
      };
    }
  }
}

/**
 * Multi-Score Evaluation Engine for a given target object
 * Incorporates 4-Stage Validation Architecture & Human-Teacher Weighted Model:
 * 35% Geometry
 * 30% Overall Shape Similarity
 * 20% ML Confidence
 * 15% Stroke Quality
 */
export function evaluateDecisionEngine(
  targetCategory: string,
  features: DrawingFeatures,
  totalInkPixels: number = 100,
  mlRawConfidence: number = 50,
  targetThreshold: number = 55,
  grayscale28: number[][] = []
): RecognitionDecision {
  const profile = OBJECT_PROFILES[targetCategory] || OBJECT_PROFILES['Cup'];
  const categoryType = profile.categoryType;

  const activeGrayscale = grayscale28.length === 28
    ? grayscale28
    : Array(28).fill(0).map(() => Array(28).fill(0));

  const totalStrokeLength = features.totalStrokeLength || 0;
  const boxWidth = features.boxWidth || 0;
  const boxHeight = features.boxHeight || 0;

  // STAGE 2 & STAGE 3 PRE-CALCULATION FOR GAUGING REJECTION
  const structuralRes = validateObjectStructure(targetCategory, features, activeGrayscale, totalInkPixels);
  const refSimRes = calculateReferenceSimilarity(targetCategory, features, activeGrayscale);
  const refSimilarity = refSimRes.topSimilarityScore;

  // STAGE 1: Universal Minimum Requirements Gate & Scribble Filter
  let recognitionState: RecognitionState = 'READY_FOR_RECOGNITION';
  let stateMessage = 'Validating sketch...';
  let isLocked = false;

  if (totalInkPixels < 15 || features.strokeCount === 0) {
    recognitionState = 'EMPTY_CANVAS';
    stateMessage = 'Canvas is empty. Start drawing...';
    isLocked = true;
  } else if (features.isStraightLine) {
    recognitionState = 'INSUFFICIENT_INFORMATION';
    stateMessage = 'Rejected: Single straight line detected (not a full object)';
    isLocked = true;
  } else if (totalStrokeLength < 70 || boxWidth < 25 || boxHeight < 25 || totalInkPixels < 25) {
    recognitionState = 'DRAWING_STARTED';
    stateMessage = `Incomplete drawing / too small (${totalStrokeLength}px length, ${boxWidth}x${boxHeight}px box)`;
    isLocked = true;
  } else if (refSimilarity < 45 && !structuralRes.passed) {
    recognitionState = 'INSUFFICIENT_INFORMATION';
    stateMessage = 'Rejected: Unrecognized scribble / random noise pattern';
    isLocked = true;
  }

  // STAGE 3: HYBRID MULTI-REFERENCE SIMILARITY & WEIGHTED SCORE FORMULA
  // Final Score =
  //   0.40 * Reference Similarity +
  //   0.20 * Contour Match +
  //   0.15 * Geometry Score +
  //   0.15 * Hu Moments Distance +
  //   0.10 * Neural Embedding / Classifier Signal
  const contourMatch = structuralRes.passed ? 92 : Math.max(25, structuralRes.structuralScore);
  const geometryScore = Math.min(100, Math.round(structuralRes.structuralScore));
  const huScore = Math.min(100, Math.round(refSimRes.averageTop5Similarity));
  const mlScore = mlRawConfidence;

  let calculatedScore = Math.round(
    refSimilarity * 0.40 +
    contourMatch * 0.20 +
    geometryScore * 0.15 +
    huScore * 0.15 +
    mlScore * 0.10
  );

  // STAGE 4: ACCEPTANCE DECISION & ADAPTIVE THRESHOLD PASSING
  let isSuccess = false;
  let finalScore = calculatedScore;

  if (isLocked) {
    isSuccess = false;
    finalScore = Math.min(calculatedScore, 15);
  } else {
    if (calculatedScore >= targetThreshold && structuralRes.passed) {
      isSuccess = true;
      recognitionState = 'RECOGNIZED';
      stateMessage = `Recognized ${targetCategory}! 🎉 (${calculatedScore}%)`;
      finalScore = Math.max(calculatedScore, targetThreshold + 2);
    } else {
      isSuccess = false;
      recognitionState = 'VALIDATING_OBJECT';
      const hintMsg = structuralRes.smartHint ? ` ${structuralRes.smartHint}` : '';
      stateMessage = `🎯 Almost there! (${calculatedScore}% / ${targetThreshold}% goal).${hintMsg}`;
      finalScore = Math.min(calculatedScore, Math.max(20, targetThreshold - 3));
    }
  }

  const decision: RecognitionDecision = {
    targetWord: targetCategory,
    categoryType,
    recognitionState,
    stateMessage,
    isLocked,
    geometryScore,
    featureScore: structuralRes.structuralScore,
    shapeSimilarity: refSimilarity,
    mlConfidence: mlRawConfidence,
    strokeQuality: huScore,
    structuralPassed: structuralRes.passed,
    missingFeatures: structuralRes.missingFeatures,
    totalStrokeLength,
    boxWidth,
    boxHeight,
    finalScore,
    targetThreshold,
    isSuccess,
    essentialMatched: structuralRes.passed && !isLocked,
    primaryReason: isLocked ? stateMessage : structuralRes.reason,
    smartHint: structuralRes.smartHint
  };

  return decision;
}

export function extractFeatures(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokeCount: number,
  rawStrokePoints: { x: number; y: number }[][]
): { features: DrawingFeatures; grayscale28: number[][]; totalInkPixels: number } {
  // 1. Stroke Cleanup: Filter out tiny isolated noise dots (< 2 points)
  const cleanedStrokes = rawStrokePoints.filter(s => s.length >= 2);
  const effectiveStrokeCount = Math.max(1, cleanedStrokes.length);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 2. Find tight bounding box of non-empty ink pixels
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
  if (totalInkPixels < 15 || minX > maxX || minY > maxY) {
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
        hasClosedLoop: false,
        totalStrokeLength: 0,
        boxWidth: 0,
        boxHeight: 0,
        isStraightLine: false
      },
      grayscale28: emptyGrayscale,
      totalInkPixels
    };
  }

  const boxW = Math.max(1, maxX - minX + 1);
  const boxH = Math.max(1, maxY - minY + 1);
  const aspectRatio = boxW / boxH;

  // 3. Aspect-Ratio Preserving Center Scaling into 28x28 Grid
  const maxDim = Math.max(boxW, boxH);
  const targetSize = 22;
  const scale = targetSize / maxDim;

  const scaledW = boxW * scale;
  const scaledH = boxH * scale;

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

  // 4. Structural & Geometric Metrics on 28x28 Grid
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

  // 5. Closed Loop Detection via BFS Flood Fill
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

  const closedContourDistance = calculateContourClosureDistance(rawStrokePoints);
  const hasClosedLoop = closedLoopCount > 0 && closedContourDistance <= 45;

  // 6. Corner Detection (Angle changes along stroke paths with minimum segment filter)
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

      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      // MIN_SEGMENT length check (at least 8px vectors)
      if (len1 > 8 && len2 > 8) {
        const dot = dx1 * dx2 + dy1 * dy2;
        const cosAngle = Math.max(-1, Math.min(1, dot / (len1 * len2)));
        const angleDeg = Math.acos(cosAngle) * (180 / Math.PI);

        // Only count significant corner turns between 55 deg and 135 deg
        if (angleDeg >= 55 && angleDeg <= 135) {
          cornerCount++;
          i += 5; // Step forward past corner to avoid duplicate counts on adjacent points
        }
      }
    }
  });

  // 7. Calculate Total Stroke Length and Straight Line status
  let totalStrokeLength = 0;
  let startX = 0, startY = 0, endX = 0, endY = 0;
  let firstPointSet = false;

  cleanedStrokes.forEach(stroke => {
    if (stroke.length > 0) {
      if (!firstPointSet) {
        startX = stroke[0].x;
        startY = stroke[0].y;
        firstPointSet = true;
      }
      endX = stroke[stroke.length - 1].x;
      endY = stroke[stroke.length - 1].y;

      for (let i = 1; i < stroke.length; i++) {
        const dx = stroke[i].x - stroke[i - 1].x;
        const dy = stroke[i].y - stroke[i - 1].y;
        totalStrokeLength += Math.sqrt(dx * dx + dy * dy);
      }
    }
  });

  const dxEnd = endX - startX;
  const dyEnd = endY - startY;
  const endpointDistance = Math.sqrt(dxEnd * dxEnd + dyEnd * dyEnd);

  // A drawing is considered a single straight line if:
  // - effective stroke count <= 2
  // - total stroke length >= 30px
  // - corner count === 0
  // - no closed loop
  // - endpoint distance / total stroke length >= 0.82
  const isStraightLine =
    effectiveStrokeCount <= 2 &&
    totalStrokeLength >= 30 &&
    cornerCount === 0 &&
    !hasClosedLoop &&
    totalStrokeLength > 0 &&
    (endpointDistance / totalStrokeLength) >= 0.82;

  const connectedComponentsCount = countConnectedComponents(grayscale28);
  
  const baseFeatures: DrawingFeatures = {
    aspectRatio,
    density,
    circularity,
    symmetryHorizontal,
    symmetryVertical,
    topHeavyRatio,
    leftHeavyRatio,
    strokeCount: effectiveStrokeCount,
    cornerCount,
    hasClosedLoop,
    totalStrokeLength: Math.round(totalStrokeLength),
    boxWidth: boxW,
    boxHeight: boxH,
    isStraightLine,
    connectedComponentsCount,
    closedContourDistance
  };

  const canvasCompletenessScore = calculateCanvasCompleteness(baseFeatures, totalInkPixels);
  baseFeatures.canvasCompletenessScore = canvasCompletenessScore;

  return {
    features: baseFeatures,
    grayscale28,
    totalInkPixels
  };
}



/**
 * Predicts drawing category based on human-like forgiving weighted evaluation
 */
export function predictDrawing(
  features: DrawingFeatures,
  grayscale28: number[][],
  totalInkPixels: number = 100
): Prediction[] {
  if (totalInkPixels < 20 || features.density < 0.008) {
    return CATEGORIES.map(cat => ({ className: cat, probability: 0 }));
  }

  const rawScores: Record<string, number> = {};

  CATEGORIES.forEach(cat => {
    const decision = evaluateDecisionEngine(cat, features, totalInkPixels, 50, 55, grayscale28);
    rawScores[cat] = decision.finalScore;
  });

  // Semantic Family Score Transfer
  Object.entries(SEMANTIC_FAMILY_MAP).forEach(([targetCat, info]) => {
    let maxSynScore = 0;
    info.synonyms.forEach(syn => {
      const matchKey = CATEGORIES.find(c => c.toLowerCase() === syn.toLowerCase());
      if (matchKey && rawScores[matchKey]) {
        maxSynScore = Math.max(maxSynScore, rawScores[matchKey]);
      }
    });

    if (maxSynScore > 25) {
      rawScores[targetCat] = Math.max(
        rawScores[targetCat] || 0,
        (rawScores[targetCat] || 0) + maxSynScore * 0.35
      );
    }
  });

  // Softmax Normalization
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
 * Enhanced Multi-Pass Recognition Check on Timer Expiry or High Precision Passes
 */
export function enhancedPredictDrawing(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokeCount: number,
  rawStrokePoints: { x: number; y: number }[][]
): Prediction[] {
  const pass1 = extractFeatures(ctx, width, height, strokeCount, rawStrokePoints);
  const preds1 = predictDrawing(pass1.features, pass1.grayscale28, pass1.totalInkPixels);

  if (pass1.totalInkPixels < 20) {
    return preds1;
  }

  const boostedGrayscale = pass1.grayscale28.map(row =>
    row.map(val => (val > 20 ? Math.min(255, val * 1.5 + 40) : 0))
  );
  const preds2 = predictDrawing(pass1.features, boostedGrayscale, pass1.totalInkPixels);

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

/**
 * Human-like friendly recognition status feedback generator
 */
export function getFriendlyRecognitionStatus(
  targetWord: string,
  confidence: number,
  targetThreshold: number,
  totalInkPixels: number,
  essentialMatched: boolean = false
): { stage: string; feedback: string } {
  if (totalInkPixels < 20) {
    return {
      stage: '🔍 Waiting for sketch...',
      feedback: 'Start drawing basic outlines...'
    };
  }
  if (confidence >= targetThreshold || essentialMatched) {
    return {
      stage: '✅ Perfect! Sketch recognized.',
      feedback: `Excellent! That's clearly a ${targetWord}!`
    };
  }
  if (confidence >= Math.max(45, targetThreshold - 15)) {
    return {
      stage: '🎯 I think I recognize it...',
      feedback: `Looks a lot like a ${targetWord}! Keep going...`
    };
  }
  if (confidence >= 25) {
    return {
      stage: '🧠 Checking shape contours...',
      feedback: 'Analyzing stroke angles and shape patterns...'
    };
  }
  return {
    stage: '🔍 Looking at your sketch...',
    feedback: 'Add more details or essential outlines...'
  };
}
