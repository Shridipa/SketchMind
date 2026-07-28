import { ExtendedDrawingFeatures } from './FeatureExtractor';

export interface HardRuleResult {
  category: string;
  passed: boolean;
  structuralScore: number;
  missingFeatures: string[];
  smartHint?: string;
  ruleChecklist: { ruleName: string; passed: boolean; valueText: string }[];
}

/**
 * Stage 5: Hard Geometry Validator
 * Evaluates non-negotiable structural criteria for the target object.
 */
export function validateHardGeometryRules(
  targetCategory: string,
  features: ExtendedDrawingFeatures,
  totalInkPixels28: number
): HardRuleResult {
  const {
    aspectRatio,
    circularity,
    cornerCount,
    hasClosedLoop,
    isClosedLoop30,
    isClosedLoop45,
    closedContourDistance = 999,
    connectedComponentsCount = 1,
    topHeavyRatio,
    leftHeavyRatio,
    strokeCount,
    peakCount,
    isStraightLine
  } = features;

  const ruleChecklist: { ruleName: string; passed: boolean; valueText: string }[] = [];
  const missingFeatures: string[] = [];

  let passed = false;
  let structuralScore = 0;
  let smartHint = '';

  switch (targetCategory) {
    case 'Circle': {
      const r1 = isClosedLoop30 || closedContourDistance <= 35;
      const r2 = circularity >= 0.28;
      const r3 = connectedComponentsCount <= 3;
      const r4 = cornerCount <= 4;

      ruleChecklist.push(
        { ruleName: 'Closed loop contour (gap <= 35px)', passed: r1, valueText: `${closedContourDistance}px gap` },
        { ruleName: 'Circularity >= 0.28', passed: r2, valueText: `${circularity}` },
        { ruleName: 'Connected components <= 3', passed: r3, valueText: `${connectedComponentsCount}` },
        { ruleName: 'Corner count <= 4', passed: r4, valueText: `${cornerCount}` }
      );

      passed = r1 && r2 && r3 && r4;
      structuralScore = (r1 ? 40 : 10) + (r2 ? 30 : 10) + (r3 ? 15 : 0) + (r4 ? 15 : 0);

      if (!r1) missingFeatures.push('Unclosed loop gap');
      if (!r2) missingFeatures.push('Low roundness circularity');

      smartHint = !r1 ? '✓ Round shape detected | ⚠ Close the loop ends to finish your circle.' : '✓ Round circle contour recognized!';
      break;
    }

    case 'Square': {
      const r1 = isClosedLoop30 || closedContourDistance <= 45;
      const r2 = cornerCount >= 2 && cornerCount <= 8;
      const r3 = aspectRatio >= 0.45 && aspectRatio <= 1.60;
      const r4 = connectedComponentsCount <= 3;

      ruleChecklist.push(
        { ruleName: 'Closed box frame (gap <= 45px)', passed: r1, valueText: `${closedContourDistance}px gap` },
        { ruleName: 'Corner count 2-8', passed: r2, valueText: `${cornerCount} corners` },
        { ruleName: 'Aspect ratio 0.45-1.60', passed: r3, valueText: `${aspectRatio}` },
        { ruleName: 'Connected components <= 3', passed: r4, valueText: `${connectedComponentsCount}` }
      );

      passed = r1 && r2 && r3 && r4;
      structuralScore = (r1 ? 35 : 10) + (r2 ? 35 : 10) + (r3 ? 15 : 0) + (r4 ? 15 : 0);

      if (!r1) missingFeatures.push('Open box frame');
      if (!r2) missingFeatures.push('Requires 3-6 corners');

      smartHint = !r1 ? '✓ Box corners detected | ⚠ Frame is open — Connect corners.' : '✓ Square box frame recognized!';
      break;
    }

    case 'Triangle': {
      const r1 = isClosedLoop30 || closedContourDistance <= 40;
      const r2 = cornerCount >= 2 && cornerCount <= 6;
      const r3 = connectedComponentsCount <= 3;

      ruleChecklist.push(
        { ruleName: 'Closed 3-side contour', passed: r1, valueText: `${closedContourDistance}px gap` },
        { ruleName: 'Corners / Apex 2-6', passed: r2, valueText: `${cornerCount} corners` },
        { ruleName: 'Connected components <= 3', passed: r3, valueText: `${connectedComponentsCount}` }
      );

      passed = r1 && r2 && r3;
      structuralScore = (r1 ? 45 : 15) + (r2 ? 40 : 10) + (r3 ? 15 : 0);

      if (!r1) missingFeatures.push('Unclosed triangle base');
      if (!r2) missingFeatures.push('Requires 3 distinct corners');

      smartHint = !r1 ? '✓ 3 sides found | ⚠ Bottom corner open — Connect the bottom edge.' : '✓ Triangle 3 corners recognized!';
      break;
    }

    case 'Star': {
      const r1 = cornerCount >= 2 || peakCount >= 2;
      const r2 = strokeCount >= 1;

      ruleChecklist.push(
        { ruleName: 'Sharp points / corners >= 2', passed: r1, valueText: `${cornerCount} corners, ${peakCount} peaks` },
        { ruleName: 'Stroke count >= 1', passed: r2, valueText: `${strokeCount} strokes` }
      );

      passed = r1 && r2;
      structuralScore = (r1 ? 60 : 20) + (r2 ? 40 : 10);

      if (!r1) missingFeatures.push('Requires sharp star points');

      smartHint = !r1 ? '✓ Lines detected | ⚠ Add sharp radiating points.' : '✓ Star tips recognized!';
      break;
    }

    case 'Heart': {
      const r1 = topHeavyRatio >= 0.35;
      const r2 = connectedComponentsCount <= 3;

      ruleChecklist.push(
        { ruleName: 'Top lobes present', passed: r1, valueText: `top ratio ${topHeavyRatio}` },
        { ruleName: 'Connected components <= 3', passed: r2, valueText: `${connectedComponentsCount}` }
      );

      passed = r1 && r2;
      structuralScore = (r1 ? 50 : 20) + (r2 ? 50 : 20);

      if (!r1) missingFeatures.push('Missing top rounded lobes');

      smartHint = !r1 ? '✓ Bottom tip detected | ⚠ Add two upper lobes.' : '✓ Heart lobes & bottom tip recognized!';
      break;
    }

    default: {
      // General default hard rules for remaining objects
      const r1 = totalInkPixels28 >= 15;
      const r2 = !isStraightLine || strokeCount >= 2;

      ruleChecklist.push(
        { ruleName: 'Min ink content', passed: r1, valueText: `${totalInkPixels28} pixels` },
        { ruleName: 'Non-single straight line', passed: r2, valueText: `straight: ${isStraightLine}` }
      );

      passed = r1 && r2;
      structuralScore = passed ? 85 : 30;
      smartHint = passed ? `✓ ${targetCategory} structure recognized!` : `⚠ Draw more details for ${targetCategory}.`;
      break;
    }
  }

  return {
    category: targetCategory,
    passed,
    structuralScore,
    missingFeatures,
    smartHint,
    ruleChecklist
  };
}
