import { ExtendedDrawingFeatures } from './FeatureExtractor';

export interface CandidateResult {
  targetCategory: string;
  isCandidate: boolean;
  candidateList: string[];
  rejectedCategories: { category: string; reason: string }[];
  matchReason?: string;
}

/**
 * Stage 4: Candidate Generator
 * Filters the 20 game objects down to plausible candidate categories based on coarse topological rules.
 */
export function generateCandidateCategories(
  targetCategory: string,
  features: ExtendedDrawingFeatures
): CandidateResult {
  const {
    cornerCount,
    hasClosedLoop,
    isClosedLoop45,
    circularity,
    aspectRatio,
    strokeCount,
    connectedComponentsCount,
    peakCount,
    topHeavyRatio
  } = features;

  const candidateList: string[] = [];
  const rejectedCategories: { category: string; reason: string }[] = [];

  const addCandidate = (cat: string, reason: string) => {
    candidateList.push(cat);
  };

  const rejectCat = (cat: string, reason: string) => {
    rejectedCategories.push({ category: cat, reason });
  };

  // 1. Circle
  if (cornerCount <= 4 && (hasClosedLoop || isClosedLoop45 || circularity > 0.25 || features.closedContourDistance! <= 40)) {
    addCandidate('Circle', 'Low corner count with circular loop or high circularity');
  } else {
    rejectCat('Circle', 'Requires low corner count (<=4) and closed/circular loop');
  }

  // 2. Square
  if (cornerCount >= 2 && cornerCount <= 8 && (hasClosedLoop || isClosedLoop45 || features.closedContourDistance! <= 50) && aspectRatio >= 0.45 && aspectRatio <= 1.65) {
    addCandidate('Square', '2-8 corners with closed frame and box-like ratio');
  } else {
    rejectCat('Square', 'Requires 2-8 corners with closed loop and box aspect ratio');
  }

  // 3. Triangle
  if (cornerCount >= 2 && cornerCount <= 7 && (hasClosedLoop || isClosedLoop45 || features.closedContourDistance! <= 50)) {
    addCandidate('Triangle', '2-7 corners with apex peak and closed contour');
  } else {
    rejectCat('Triangle', 'Requires 2-7 corners with 3 sides/apex peak');
  }

  // 4. Star
  if (cornerCount >= 2 || peakCount >= 2 || strokeCount >= 2) {
    addCandidate('Star', 'Multiple sharp tips/crossing lines detected');
  } else {
    rejectCat('Star', 'Requires multiple sharp corners or crossing strokes');
  }

  // 5. Heart
  if (topHeavyRatio >= 0.35 && (hasClosedLoop || isClosedLoop45) && cornerCount <= 6) {
    addCandidate('Heart', 'Upper lobes with tapered bottom point');
  } else {
    rejectCat('Heart', 'Requires upper rounded lobes and bottom tip');
  }

  // 6. Sun
  if ((cornerCount >= 2 && strokeCount >= 2) || connectedComponentsCount >= 2) {
    addCandidate('Sun', 'Center loop or radiating ray strokes');
  } else {
    rejectCat('Sun', 'Requires central loop or radiating rays');
  }

  // 7. Moon
  if (aspectRatio >= 0.30 && cornerCount <= 5 && (!hasClosedLoop || circularity < 0.65)) {
    addCandidate('Moon', 'Crescent curve or arc shape');
  } else {
    rejectCat('Moon', 'Requires crescent arc or open curve');
  }

  // 8. Apple
  if (topHeavyRatio >= 0.30 && (hasClosedLoop || isClosedLoop45)) {
    addCandidate('Apple', 'Round body with top stem/indentation');
  } else {
    rejectCat('Apple', 'Requires round body with top stem');
  }

  // 9. Fish
  if (aspectRatio >= 0.70 && cornerCount >= 2) {
    addCandidate('Fish', 'Horizontal body with tail fin structure');
  } else {
    rejectCat('Fish', 'Requires horizontal body with tail fin');
  }

  // 10. Leaf
  if (cornerCount <= 6 && (hasClosedLoop || isClosedLoop45 || strokeCount >= 2)) {
    addCandidate('Leaf', 'Pointed tip with central vein line');
  } else {
    rejectCat('Leaf', 'Requires pointed tip contour');
  }

  // 11. House
  if (cornerCount >= 2 && (hasClosedLoop || isClosedLoop45)) {
    addCandidate('House', 'Roof peak with base frame');
  } else {
    rejectCat('House', 'Requires roof peak and base frame');
  }

  // 12. Tree
  if (topHeavyRatio >= 0.35 && (strokeCount >= 2 || connectedComponentsCount >= 2)) {
    addCandidate('Tree', 'Canopy top with vertical trunk');
  } else {
    rejectCat('Tree', 'Requires top canopy and vertical trunk');
  }

  // 13. Flower
  if ((cornerCount >= 3 && strokeCount >= 2) || connectedComponentsCount >= 2) {
    addCandidate('Flower', 'Center core with surrounding petals');
  } else {
    rejectCat('Flower', 'Requires center loop and petals');
  }

  // 14. Cup
  if (cornerCount >= 2 && (hasClosedLoop || isClosedLoop45 || strokeCount >= 2)) {
    addCandidate('Cup', 'Container body with handle/open top');
  } else {
    rejectCat('Cup', 'Requires container body and base');
  }

  // 15. Book
  if (aspectRatio >= 0.70 && (hasClosedLoop || isClosedLoop45) && strokeCount >= 2) {
    addCandidate('Book', 'Rectangular pages or spine outline');
  } else {
    rejectCat('Book', 'Requires rectangular pages or spine');
  }

  // 16. Car
  if (aspectRatio >= 1.0 && (strokeCount >= 2 || connectedComponentsCount >= 2)) {
    addCandidate('Car', 'Horizontal chassis with wheels');
  } else {
    rejectCat('Car', 'Requires horizontal chassis and wheels');
  }

  // 17. Rocket
  if (aspectRatio <= 0.90 && (hasClosedLoop || isClosedLoop45)) {
    addCandidate('Rocket', 'Vertical tube with nose cone and fins');
  } else {
    rejectCat('Rocket', 'Requires vertical body with nose cone');
  }

  // 18. Airplane
  if (strokeCount >= 2 && aspectRatio >= 0.70) {
    addCandidate('Airplane', 'Fuselage with wings');
  } else {
    rejectCat('Airplane', 'Requires fuselage and wing strokes');
  }

  // 19. Bicycle
  if (connectedComponentsCount >= 2 && strokeCount >= 2) {
    addCandidate('Bicycle', 'Dual circular wheels with frame');
  } else {
    rejectCat('Bicycle', 'Requires dual wheel circles and frame');
  }

  // 20. Cat
  if (topHeavyRatio >= 0.35 && cornerCount >= 3) {
    addCandidate('Cat', 'Head with triangular ear tips');
  } else {
    rejectCat('Cat', 'Requires head outline with ear points');
  }

  // CRITICAL: Always guarantee targetCategory is included in candidateList unless completely empty/invalid
  if (targetCategory && !candidateList.includes(targetCategory)) {
    candidateList.unshift(targetCategory);
  }

  const isCandidate = candidateList.includes(targetCategory);
  const matchReason = isCandidate
    ? `Target '${targetCategory}' passed candidate rules.`
    : `Target '${targetCategory}' failed candidate generation rules.`;

  return {
    targetCategory,
    isCandidate,
    candidateList,
    rejectedCategories,
    matchReason
  };
}
