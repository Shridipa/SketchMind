import { DrawingFeatures, Prediction, Challenge, RecognitionState } from '../types';

export function getTargetThreshold(difficulty?: string): number {
  switch (difficulty) {
    case 'Very Easy': return 50; // Sketches 1-5 (Circle, Square, Triangle, Star, Heart)
    case 'Easy': return 55;      // Sketches 6-10 (Sun, Moon, Apple, Fish, Leaf)
    case 'Medium': return 60;    // Sketches 11-15 (House, Tree, Flower, Cup, Book)
    case 'Hard': return 75;      // Sketches 16-20 (Car, Rocket, Airplane, Bicycle, Cat)
    default: return 55;
  }
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

export interface StructuralValidationResult {
  passed: boolean;
  missingFeatures: string[];
  structuralScore: number;
  reason: string;
}

/**
 * Stage 2 – Object Structural Validation Gatekeeper
 * Strictly verifies that the sketch contains the defining structural features of the target object.
 * Prevents false positives (e.g. recognizing random 2 strokes as a Cup or scribbles as a Bicycle).
 */
export function validateObjectStructure(
  targetCategory: string,
  features: DrawingFeatures,
  grayscale28: number[][],
  totalInkPixels: number = 100
): StructuralValidationResult {
  const profile = OBJECT_PROFILES[targetCategory] || OBJECT_PROFILES['Cup'];

  // Check if drawing is a single straight line when target is NOT a line
  if (features.isStraightLine) {
    return {
      passed: false,
      missingFeatures: ['Single straight line rejected (requires full shape)'],
      structuralScore: 0,
      reason: 'Rejected: Sketch is a single straight line, not an object.'
    };
  }

  switch (targetCategory) {
    case 'Circle': {
      const missing: string[] = [];
      const isLoop = features.hasClosedLoop || features.circularity >= 0.45;
      const roundEnough = features.circularity >= 0.40;
      const reasonableCorners = features.cornerCount <= 6;

      if (!isLoop) missing.push('Closed Rounded Loop');
      if (!roundEnough) missing.push('Circularity >= 0.45');
      if (!reasonableCorners) missing.push('Too Many Jagged Corners (max 6)');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 95 : 20,
        reason: passed ? 'Closed round loop detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Square': {
      const missing: string[] = [];
      const hasCornersOrLoop = features.cornerCount >= 3 || features.hasClosedLoop;
      const ratioOk = features.aspectRatio >= 0.65 && features.aspectRatio <= 1.45;

      if (!hasCornersOrLoop) missing.push('3-5 Box Corners or Closed Loop');
      if (!ratioOk) missing.push('Square Aspect Ratio (0.65-1.45)');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 95 : 20,
        reason: passed ? 'Box outline & corners detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Triangle': {
      const missing: string[] = [];
      const hasApexOrCorners = features.cornerCount >= 2 || features.hasClosedLoop;

      if (!hasApexOrCorners) missing.push('3 Connected Sides & Apex Peak');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 95 : 20,
        reason: passed ? 'Triangular corners & apex detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Star': {
      const missing: string[] = [];
      const hasStarFeatures = features.cornerCount >= 3 || features.strokeCount >= 2;

      if (!hasStarFeatures) missing.push('Multi-Point Star Tips or Crossing Lines');
      if (features.circularity > 0.85) missing.push('Not a Smooth Circle (requires pointy tips)');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 95 : 25,
        reason: passed ? 'Multi-point star tips detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Heart': {
      const missing: string[] = [];
      const symmetric = features.symmetryHorizontal > 0.40;

      if (!symmetric) missing.push('Symmetric Top Arches & V Apex');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 95 : 25,
        reason: passed ? 'Symmetric heart curve detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Cup': {
      let leftWallInk = 0, rightWallInk = 0, bottomBaseInk = 0, bodyInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 30) {
            bodyInk++;
            if (y >= 6 && y <= 23) {
              if (x >= 4 && x <= 12) leftWallInk++;
              if (x >= 15 && x <= 24) rightWallInk++;
            }
            if (y >= 17 && y <= 25 && x >= 6 && x <= 22) bottomBaseInk++;
          }
        }
      }

      const missing: string[] = [];
      if (!features.hasClosedLoop) {
        if (leftWallInk < 3) missing.push('Left Container Wall');
        if (rightWallInk < 3) missing.push('Right Container Wall');
        if (bottomBaseInk < 3) missing.push('Container Base / Bottom');
      }
      if (bodyInk < 10) missing.push('Container Body Volume');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 90 : 20,
        reason: passed ? 'Closed container mug body & base detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Bicycle': {
      let leftWheelInk = 0, rightWheelInk = 0, frameInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 30) {
            if (y >= 10 && x < 13) leftWheelInk++;
            if (y >= 10 && x >= 14) rightWheelInk++;
            if (y >= 4 && y <= 18 && x >= 7 && x <= 20) frameInk++;
          }
        }
      }

      const missing: string[] = [];
      if (leftWheelInk < 3) missing.push('Left Wheel Structure');
      if (rightWheelInk < 3) missing.push('Right Wheel Structure');
      if (frameInk < 3) missing.push('Connecting Frame');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 90 : 20,
        reason: passed ? 'Two distinct wheels & connecting frame detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Car': {
      let leftInk = 0, rightInk = 0, bottomInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 30) {
            if (x < 11) leftInk++;
            if (x > 16) rightInk++;
            if (y > 13) bottomInk++;
          }
        }
      }

      const missing: string[] = [];
      if (features.aspectRatio < 0.85) missing.push('Horizontal Chassis Orientation');
      if (leftInk < 3 || rightInk < 3) missing.push('Chassis Body Span');
      if (bottomInk < 4) missing.push('Dual Wheel Base');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 90 : 25,
        reason: passed ? 'Horizontal chassis body & dual wheel base detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Airplane': {
      let centerInk = 0, upperInk = 0, lowerInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 30) {
            if (y >= 10 && y <= 18) centerInk++;
            if (y < 10) upperInk++;
            if (y > 18) lowerInk++;
          }
        }
      }

      const missing: string[] = [];
      if (centerInk < 7) missing.push('Central Fuselage Line');
      if (upperInk + lowerInk < 3) missing.push('Wing Cross Structure');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 90 : 25,
        reason: passed ? 'Central fuselage & wing structure detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Rocket': {
      let topInk = 0, middleInk = 0, bottomInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 30) {
            if (y < 9) topInk++;
            if (y >= 9 && y <= 18) middleInk++;
            if (y > 18) bottomInk++;
          }
        }
      }

      const missing: string[] = [];
      if (features.aspectRatio > 1.40) missing.push('Tall Vertical Orientation');
      if (topInk < 2) missing.push('Pointed Cone Tip');
      if (middleInk + bottomInk < 6) missing.push('Rocket Body Tube');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 90 : 25,
        reason: passed ? 'Tall rocket tube & cone tip detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Cat': {
      let topEarInk = 0;
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 30) topEarInk++;
        }
      }

      const missing: string[] = [];
      if (topEarInk < 3) missing.push('Top Ear Peaks');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 90 : 25,
        reason: passed ? 'Round head & top ear triangles detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'House': {
      let topRoofInk = 0, baseInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 30) {
            if (y <= 12) topRoofInk++;
            if (y > 12) baseInk++;
          }
        }
      }

      const missing: string[] = [];
      if (topRoofInk < 3) missing.push('Triangle Roof Peak');
      if (baseInk < 5) missing.push('Square House Base');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 90 : 30,
        reason: passed ? 'House base & triangle roof peak detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Tree': {
      let canopyInk = 0, trunkInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 30) {
            if (y < 16) canopyInk++;
            if (y >= 16 && x >= 6 && x <= 22) trunkInk++;
          }
        }
      }

      const missing: string[] = [];
      if (canopyInk < 5) missing.push('Top Tree Canopy');
      if (trunkInk < 2) missing.push('Vertical Trunk Line');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 90 : 30,
        reason: passed ? 'Vertical trunk line & top canopy detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Flower': {
      let coreInk = 0, outerInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 30) {
            if (y >= 8 && y <= 20 && x >= 8 && x <= 20) coreInk++;
            else outerInk++;
          }
        }
      }

      const missing: string[] = [];
      if (coreInk < 3) missing.push('Center Core');
      if (outerInk < 4 && features.strokeCount < 2) missing.push('Petals or Stem');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 90 : 30,
        reason: passed ? 'Center core & petal loops detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Apple': {
      let bodyInk = 0;
      for (let y = 6; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 30) bodyInk++;
        }
      }

      const missing: string[] = [];
      if (bodyInk < 8) missing.push('Round Fruit Body');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 90 : 35,
        reason: passed ? 'Round fruit body & stem detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Fish': {
      let bodyInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 30) bodyInk++;
        }
      }

      const missing: string[] = [];
      if (features.aspectRatio < 0.88) missing.push('Horizontal Body Orientation');
      if (bodyInk < 8) missing.push('Swimmer Body Outline');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 90 : 35,
        reason: passed ? 'Horizontal swimmer body & tail fin detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Leaf': {
      const passed = features.circularity < 0.92;
      const missing = passed ? [] : ['Tapered Leaf Outline'];
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 90 : 35,
        reason: passed ? 'Tapered leaf outline detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Sun': {
      let centerInk = 0, rayInk = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          if (grayscale28[y][x] > 30) {
            if (y >= 8 && y <= 20 && x >= 8 && x <= 20) centerInk++;
            else rayInk++;
          }
        }
      }

      const missing: string[] = [];
      if (centerInk < 4) missing.push('Sun Core Circle');
      if (rayInk < 3 && features.strokeCount < 2) missing.push('Radiating Beam Rays');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 90 : 35,
        reason: passed ? 'Sun core & radiating rays detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Moon': {
      const passed = features.circularity < 0.88;
      const missing = passed ? [] : ['Crescent C-Curve Shape'];
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 90 : 35,
        reason: passed ? 'Crescent curve contour detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    case 'Book': {
      const missing: string[] = [];
      if (features.aspectRatio < 0.85) missing.push('Rectangular Page Orientation');

      const passed = missing.length === 0;
      return {
        passed,
        missingFeatures: missing,
        structuralScore: passed ? 90 : 35,
        reason: passed ? 'Rectangular page layout detected' : `Missing required features: ${missing.join(', ')}`
      };
    }

    default: {
      return {
        passed: true,
        missingFeatures: [],
        structuralScore: 70,
        reason: 'Basic structural check passed'
      };
    }
  }
}

/**
 * Multi-Score Evaluation Engine for a given target object
 * Incorporates 4-Stage Validation Architecture:
 * Stage 1: TensorFlow candidate scores
 * Stage 2: Structural Validation Gatekeeper (REQUIRED GATE)
 * Stage 3: Shape Similarity
 * Stage 4: Final Decision
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

  // STAGE 1: Universal Minimum Requirements Gate & State Machine
  let recognitionState: RecognitionState = 'READY_FOR_RECOGNITION';
  let stateMessage = 'Validating object profile...';
  let isLocked = false;

  if (totalInkPixels < 15 || features.strokeCount === 0) {
    recognitionState = 'EMPTY_CANVAS';
    stateMessage = 'Canvas is empty. Start drawing...';
    isLocked = true;
  } else if (features.isStraightLine) {
    recognitionState = 'INSUFFICIENT_INFORMATION';
    stateMessage = 'Rejected: Single straight line detected (not a shape)';
    isLocked = true;
  } else if (totalStrokeLength < profile.minimumStrokeLength) {
    recognitionState = 'DRAWING_STARTED';
    stateMessage = `Stroke length too short (${totalStrokeLength}/${profile.minimumStrokeLength}px)`;
    isLocked = true;
  } else if (boxWidth < profile.minimumBoxWidth || boxHeight < profile.minimumBoxHeight) {
    recognitionState = 'INSUFFICIENT_INFORMATION';
    stateMessage = `Drawing size too small (${boxWidth}×${boxHeight}px, min ${profile.minimumBoxWidth}×${profile.minimumBoxHeight}px)`;
    isLocked = true;
  } else if (features.strokeCount < profile.minimumStrokeCount) {
    recognitionState = 'INSUFFICIENT_INFORMATION';
    stateMessage = `Need at least ${profile.minimumStrokeCount} strokes for ${targetCategory}`;
    isLocked = true;
  }

  // STAGE 2: Structural Validation Gatekeeper
  const structuralRes = validateObjectStructure(targetCategory, features, activeGrayscale, totalInkPixels);

  let geometryScore = 50;
  let featureScore = structuralRes.structuralScore;
  let shapeSimilarity = 50;
  let strokeQuality = 85;

  if (features.density > 0.01 && features.strokeCount <= 8) {
    strokeQuality = 92;
  }

  // Geometry and Shape Similarity calculations
  switch (targetCategory) {
    case 'Circle': {
      const circDiff = Math.abs(features.circularity - 0.95);
      if (circDiff < 0.50) geometryScore = Math.min(98, Math.max(20, 90 - circDiff * 50));
      shapeSimilarity = features.cornerCount <= 3 ? 92 : 60;
      break;
    }
    case 'Square': {
      const ratioDiff = Math.abs(features.aspectRatio - 1.0);
      geometryScore = Math.min(98, Math.max(20, 88 - ratioDiff * 40));
      shapeSimilarity = features.cornerCount >= 3 ? 94 : 60;
      break;
    }
    case 'Triangle': {
      geometryScore = features.cornerCount >= 2 ? 92 : 55;
      shapeSimilarity = 88;
      break;
    }
    case 'Star': {
      geometryScore = features.cornerCount >= 3 ? 90 : 55;
      shapeSimilarity = 88;
      break;
    }
    case 'Heart': {
      geometryScore = features.symmetryHorizontal > 0.48 ? 92 : 60;
      shapeSimilarity = 90;
      break;
    }
    default: {
      geometryScore = structuralRes.passed ? 85 : 30;
      shapeSimilarity = structuralRes.passed ? 85 : 25;
      break;
    }
  }

  // STAGE 3: CATEGORY-BASED SCORE WEIGHTING
  let calculatedScore = 50;
  if (categoryType === 'geometry') {
    // 90% Rule-based Geometry + 10% ML
    calculatedScore = Math.round(geometryScore * 0.90 + mlRawConfidence * 0.10);
  } else if (categoryType === 'simple') {
    // 60% Rule-based Features + 40% ML
    calculatedScore = Math.round(featureScore * 0.60 + mlRawConfidence * 0.40);
  } else {
    // 40% Rule-based Features + 60% ML
    calculatedScore = Math.round(featureScore * 0.40 + mlRawConfidence * 0.60);
  }

  // STAGE 4: ACCEPTANCE DECISION & LOCKING
  let isSuccess = false;
  let finalScore = calculatedScore;

  if (isLocked) {
    isSuccess = false;
    finalScore = Math.min(calculatedScore, targetThreshold - 10);
  } else if (!structuralRes.passed) {
    isSuccess = false;
    recognitionState = 'VALIDATING_OBJECT';
    stateMessage = `Missing required criteria: ${structuralRes.missingFeatures.join(', ')}`;
    finalScore = Math.min(calculatedScore, targetThreshold - 10);
  } else {
    if (calculatedScore >= targetThreshold) {
      isSuccess = true;
      recognitionState = 'RECOGNIZED';
      stateMessage = `Recognized ${targetCategory}! PASS (${calculatedScore}%)`;
      finalScore = Math.max(calculatedScore, targetThreshold + 5);
    } else {
      isSuccess = false;
      recognitionState = 'VALIDATING_OBJECT';
      stateMessage = `Criteria passed, waiting for higher similarity (${calculatedScore}% / ${targetThreshold}%)`;
    }
  }

  return {
    targetWord: targetCategory,
    categoryType,
    recognitionState,
    stateMessage,
    isLocked,
    geometryScore,
    featureScore,
    shapeSimilarity,
    mlConfidence: mlRawConfidence,
    strokeQuality,
    structuralPassed: structuralRes.passed,
    missingFeatures: structuralRes.missingFeatures,
    totalStrokeLength,
    boxWidth,
    boxHeight,
    finalScore,
    targetThreshold,
    isSuccess,
    essentialMatched: structuralRes.passed && !isLocked,
    primaryReason: isLocked ? stateMessage : structuralRes.reason
  };
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

  const hasClosedLoop = closedLoopCount > 0;

  // 6. Corner Detection (Angle changes along stroke paths)
  let cornerCount = 0;
  cleanedStrokes.forEach(stroke => {
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
        if (cosAngle < 0.70) {
          cornerCount++;
          i += 3;
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

  return {
    features: {
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
      isStraightLine
    },
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
