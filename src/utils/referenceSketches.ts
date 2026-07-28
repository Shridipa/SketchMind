import { DrawingFeatures } from '../types';

export interface ReferenceExemplar {
  id: string;
  category: string;
  variantName: string;
  features: Partial<DrawingFeatures>;
  huMoments: number[]; // 7 invariant Hu moments
  embedding: number[]; // Normalized 16-dim feature embedding
  grid28Sample?: number[][];
}

/**
 * Calculates Hu Moments (7 log-scaled invariant shape moments) from a 28x28 grayscale grid
 */
export function calculateHuMoments(grayscale28: number[][]): number[] {
  let m00 = 0, m10 = 0, m01 = 0;
  
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      const val = grayscale28[y][x];
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

  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      const val = grayscale28[y][x];
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

  // Normalize central moments
  const gamma2 = 2; // (2+2)/2
  const gamma3 = 2.5; // (3+2)/2
  const norm20 = mu20 / Math.pow(m00, gamma2);
  const norm02 = mu02 / Math.pow(m00, gamma2);
  const norm11 = mu11 / Math.pow(m00, gamma2);
  const norm30 = mu30 / Math.pow(m00, gamma3);
  const norm12 = mu12 / Math.pow(m00, gamma3);
  const norm21 = mu21 / Math.pow(m00, gamma3);
  const norm03 = mu03 / Math.pow(m00, gamma3);

  // Hu 7 invariant moments
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

  // Log scale for numerical stability
  const logHu = [h1, h2, h3, h4, h5, h6, h7].map(h => {
    if (Math.abs(h) < 1e-15) return 0;
    return Math.sign(h) * Math.log10(Math.abs(h));
  });

  return logHu;
}

/**
 * Calculates Cosine Similarity between two numeric vectors
 */
export function calculateCosineSimilarity(v1: number[], v2: number[]): number {
  if (v1.length !== v2.length || v1.length === 0) return 0;
  let dot = 0, norm1 = 0, norm2 = 0;
  for (let i = 0; i < v1.length; i++) {
    dot += v1[i] * v2[i];
    norm1 += v1[i] * v1[i];
    norm2 += v2[i] * v2[i];
  }
  if (norm1 === 0 || norm2 === 0) return 0;
  return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Calculates SSIM (Structural Similarity Index) between two 28x28 grayscale grids
 */
export function calculateSSIM28(g1: number[][], g2: number[][]): number {
  if (!g1 || !g2 || g1.length !== 28 || g2.length !== 28) return 0;
  let sum1 = 0, sum2 = 0;
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      sum1 += g1[y][x];
      sum2 += g2[y][x];
    }
  }

  const mean1 = sum1 / (28 * 28);
  const mean2 = sum2 / (28 * 28);

  let var1 = 0, var2 = 0, covar = 0;
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      const d1 = g1[y][x] - mean1;
      const d2 = g2[y][x] - mean2;
      var1 += d1 * d1;
      var2 += d2 * d2;
      covar += d1 * d2;
    }
  }

  var1 /= (28 * 28);
  var2 /= (28 * 28);
  covar /= (28 * 28);

  const C1 = 6.50, C2 = 58.5; // Constants for 0-255 dynamic range
  const num = (2 * mean1 * mean2 + C1) * (2 * covar + C2);
  const den = (mean1 * mean1 + mean2 * mean2 + C1) * (var1 + var2 + C2);

  return Math.max(0, Math.min(1, num / den));
}

/**
 * Creates 20-30 reference exemplars per category for all 20 game objects
 */
export const REFERENCE_LIBRARY: Record<string, ReferenceExemplar[]> = (() => {
  const lib: Record<string, ReferenceExemplar[]> = {};

  const categories = [
    'Circle', 'Square', 'Triangle', 'Star', 'Heart',
    'Sun', 'Moon', 'Apple', 'Fish', 'Leaf',
    'House', 'Tree', 'Flower', 'Cup', 'Book',
    'Car', 'Rocket', 'Airplane', 'Bicycle', 'Cat'
  ];

  // Helper to construct normalized 16-dim feature embedding
  const makeEmbedding = (
    ar: number, circ: number, symH: number, symV: number,
    corners: number, closed: boolean, density: number, topRatio: number, leftRatio: number
  ) => [
    ar, circ, symH, symV,
    corners / 10, closed ? 1.0 : 0.0, density * 50, topRatio,
    leftRatio, (ar > 0.8 && ar < 1.2) ? 1.0 : 0.0, (circ > 0.6) ? 1.0 : 0.0, (symH > 0.4) ? 1.0 : 0.0,
    (corners === 3) ? 1.0 : 0.0, (corners === 4) ? 1.0 : 0.0, (corners >= 5) ? 1.0 : 0.0, density > 0.02 ? 1.0 : 0.0
  ];

  categories.forEach(cat => {
    const exemplars: ReferenceExemplar[] = [];

    for (let i = 1; i <= 25; i++) {
      let ar = 1.0, circ = 0.5, symH = 0.5, symV = 0.5, corners = 2, closed = true, density = 0.03;
      let topRatio = 0.5, leftRatio = 0.5;
      let variant = `exemplar_${i}`;

      switch (cat) {
        case 'Circle':
          ar = 0.85 + (i % 5) * 0.07;
          circ = 0.55 + (i % 6) * 0.07;
          symH = 0.45 + (i % 4) * 0.05;
          symV = 0.45 + (i % 4) * 0.05;
          corners = (i % 3 === 0) ? 1 : 0;
          closed = i !== 25; // 24 closed, 1 slightly open
          density = 0.025 + (i % 4) * 0.005;
          variant = i <= 5 ? 'perfect_circle' : i <= 10 ? 'oval' : i <= 18 ? 'rough_hand_drawn' : i <= 23 ? 'large_bold' : 'slightly_open_loop';
          break;

        case 'Square':
          ar = 0.80 + (i % 5) * 0.08;
          circ = 0.35 + (i % 4) * 0.04;
          symH = 0.45 + (i % 3) * 0.05;
          symV = 0.45 + (i % 3) * 0.05;
          corners = 3 + (i % 3);
          closed = true;
          density = 0.03 + (i % 4) * 0.005;
          variant = i <= 5 ? 'perfect_box' : i <= 12 ? 'hand_drawn_square' : i <= 18 ? 'tall_rectangle' : 'wide_box';
          break;

        case 'Triangle':
          ar = 0.70 + (i % 6) * 0.12;
          circ = 0.30 + (i % 4) * 0.04;
          symH = 0.40 + (i % 3) * 0.05;
          symV = 0.35 + (i % 3) * 0.05;
          corners = 2 + (i % 2 === 0 ? 1 : 2);
          closed = i !== 24;
          topRatio = 0.30 + (i % 3) * 0.05; // Apex peak top heavy
          density = 0.025 + (i % 4) * 0.005;
          variant = i <= 6 ? 'equilateral' : i <= 12 ? 'apex_pyramid' : i <= 18 ? 'right_angle' : 'slanted_triangle';
          break;

        case 'Star':
          ar = 0.85 + (i % 4) * 0.05;
          circ = 0.20 + (i % 4) * 0.04;
          symH = 0.45 + (i % 3) * 0.05;
          symV = 0.45 + (i % 3) * 0.05;
          corners = 4 + (i % 3);
          closed = false;
          density = 0.03 + (i % 4) * 0.005;
          variant = i <= 8 ? '5_point_classic' : i <= 15 ? 'crossing_lines_star' : 'hand_drawn_star';
          break;

        case 'Heart':
          ar = 0.85 + (i % 4) * 0.07;
          circ = 0.35 + (i % 4) * 0.04;
          symH = 0.50 + (i % 3) * 0.05;
          symV = 0.35 + (i % 3) * 0.05;
          corners = 1 + (i % 2);
          topRatio = 0.55; // Lobe top heavy
          closed = true;
          density = 0.03 + (i % 4) * 0.005;
          variant = i <= 8 ? 'classic_heart' : i <= 16 ? 'deep_v_heart' : 'rounded_lobes_heart';
          break;

        case 'Sun':
          ar = 0.90 + (i % 3) * 0.05;
          circ = 0.40 + (i % 4) * 0.05;
          symH = 0.45;
          symV = 0.45;
          corners = 2 + (i % 4);
          closed = true;
          density = 0.035 + (i % 4) * 0.005;
          variant = i <= 8 ? 'core_and_8_rays' : i <= 16 ? 'core_and_12_rays' : 'sol_symbol';
          break;

        case 'Moon':
          ar = 0.50 + (i % 6) * 0.15;
          circ = 0.25 + (i % 4) * 0.04;
          symH = 0.35;
          symV = 0.45;
          corners = 2;
          closed = false;
          leftRatio = 0.35;
          density = 0.02 + (i % 4) * 0.005;
          variant = i <= 8 ? 'crescent_curve' : i <= 16 ? 'half_moon' : 'banana_arc';
          break;

        case 'Apple':
          ar = 0.85 + (i % 4) * 0.06;
          circ = 0.45 + (i % 4) * 0.05;
          symH = 0.45;
          topRatio = 0.40;
          corners = 1;
          closed = true;
          density = 0.03 + (i % 4) * 0.005;
          variant = i <= 8 ? 'apple_body_stem' : i <= 16 ? 'apple_with_leaf' : 'round_apple';
          break;

        case 'Fish':
          ar = 1.30 + (i % 5) * 0.15; // Wide horizontal body
          circ = 0.30 + (i % 4) * 0.04;
          symH = 0.40;
          symV = 0.48;
          corners = 2 + (i % 2);
          closed = true;
          leftRatio = 0.40;
          density = 0.03 + (i % 4) * 0.005;
          variant = i <= 8 ? 'oval_body_tail_fin' : i <= 16 ? 'fish_swimmer' : 'simple_fish';
          break;

        case 'Leaf':
          ar = 0.60 + (i % 6) * 0.15;
          circ = 0.30 + (i % 4) * 0.04;
          symH = 0.45;
          symV = 0.45;
          corners = 2;
          closed = true;
          density = 0.025 + (i % 4) * 0.005;
          variant = i <= 8 ? 'teardrop_leaf' : i <= 16 ? 'leaf_with_center_vein' : 'maple_leaf_outline';
          break;

        case 'House':
          ar = 0.85 + (i % 4) * 0.08;
          circ = 0.35;
          symH = 0.45;
          topRatio = 0.35; // Triangle roof peak on top
          corners = 4 + (i % 2);
          closed = true;
          density = 0.035 + (i % 4) * 0.005;
          variant = i <= 8 ? 'box_and_roof_peak' : i <= 16 ? 'house_with_door' : 'cabin';
          break;

        case 'Tree':
          ar = 0.70 + (i % 5) * 0.10;
          circ = 0.35;
          topRatio = 0.65; // Puffy cloud canopy top heavy
          corners = 1;
          closed = true;
          density = 0.03 + (i % 4) * 0.005;
          variant = i <= 8 ? 'vertical_trunk_cloud_canopy' : i <= 16 ? 'pine_tree' : 'oak_tree';
          break;

        case 'Flower':
          ar = 0.90 + (i % 3) * 0.05;
          circ = 0.35;
          symH = 0.45;
          symV = 0.45;
          corners = 3 + (i % 3);
          closed = true;
          density = 0.035 + (i % 4) * 0.005;
          variant = i <= 8 ? 'center_circle_5_petals' : i <= 16 ? 'flower_with_stem' : 'daisy';
          break;

        case 'Cup':
          ar = 0.80 + (i % 4) * 0.08;
          circ = 0.35;
          symH = 0.42;
          corners = 3;
          closed = true;
          density = 0.03 + (i % 4) * 0.005;
          variant = i <= 8 ? 'u_shape_mug_handle' : i <= 16 ? 'coffee_cup' : 'tea_mug';
          break;

        case 'Book':
          ar = 1.10 + (i % 4) * 0.10;
          circ = 0.30;
          symH = 0.48;
          corners = 4;
          closed = true;
          density = 0.03 + (i % 4) * 0.005;
          variant = i <= 8 ? 'open_book_pages' : i <= 16 ? 'closed_notebook' : 'textbook';
          break;

        case 'Car':
          ar = 1.35 + (i % 5) * 0.12;
          circ = 0.30;
          symH = 0.40;
          topRatio = 0.38;
          corners = 3 + (i % 2);
          closed = true;
          density = 0.035 + (i % 4) * 0.005;
          variant = i <= 8 ? 'chassis_and_two_wheels' : i <= 16 ? 'sedan_car' : 'truck_chassis';
          break;

        case 'Rocket':
          ar = 0.55 + (i % 5) * 0.10; // Tall vertical shape
          circ = 0.25;
          topRatio = 0.30; // Pointed cone top
          corners = 3;
          closed = true;
          density = 0.03 + (i % 4) * 0.005;
          variant = i <= 8 ? 'vertical_tube_nose_cone' : i <= 16 ? 'rocket_with_fins' : 'spacecraft';
          break;

        case 'Airplane':
          ar = 1.10 + (i % 5) * 0.12;
          circ = 0.25;
          symH = 0.45;
          symV = 0.45;
          corners = 3 + (i % 3);
          closed = false;
          density = 0.03 + (i % 4) * 0.005;
          variant = i <= 8 ? 'fuselage_and_crossing_wings' : i <= 16 ? 'jet_plane' : 'biplane';
          break;

        case 'Bicycle':
          ar = 1.30 + (i % 4) * 0.12;
          circ = 0.25;
          symH = 0.45;
          corners = 2;
          closed = false;
          density = 0.03 + (i % 4) * 0.005;
          variant = i <= 8 ? 'two_wheels_and_frame_bars' : i <= 16 ? 'racing_bike' : 'city_bicycle';
          break;

        case 'Cat':
          ar = 0.85 + (i % 4) * 0.08;
          circ = 0.38;
          topRatio = 0.35; // Ear triangle peaks on top
          corners = 3;
          closed = true;
          density = 0.03 + (i % 4) * 0.005;
          variant = i <= 8 ? 'head_circle_pointy_ears' : i <= 16 ? 'cat_with_whiskers' : 'kitty_head';
          break;

        default:
          break;
      }

      const embedding = makeEmbedding(
        ar, circ, symH, symV, corners, closed, density, topRatio, leftRatio
      );

      // Simulated dummy Hu moments matching typical values
      const huMoments = [
        Math.log10(1 + circ),
        Math.log10(1 + ar),
        Math.log10(1 + symH),
        Math.log10(1 + symV),
        Math.log10(1 + corners / 5),
        Math.log10(1 + (closed ? 1 : 0)),
        Math.log10(1 + density * 10)
      ];

      exemplars.push({
        id: `${cat.toLowerCase()}_ref_${i}`,
        category: cat,
        variantName: `${cat} ${variant}`,
        features: {
          aspectRatio: ar,
          circularity: circ,
          symmetryHorizontal: symH,
          symmetryVertical: symV,
          cornerCount: corners,
          hasClosedLoop: closed,
          density,
          topHeavyRatio: topRatio,
          leftHeavyRatio: leftRatio
        },
        huMoments,
        embedding
      });
    }

    lib[cat] = exemplars;
  });

  return lib;
})();

/**
 * Compares player's drawing features against all reference exemplars for the current target category ONLY.
 * Returns similarity score (0 - 100%) based on top-5 best exemplar matches.
 */
export function calculateReferenceSimilarity(
  targetCategory: string,
  features: DrawingFeatures,
  grayscale28: number[][]
): { topSimilarityScore: number; bestVariantMatch: string; averageTop5Similarity: number } {
  const exemplars = REFERENCE_LIBRARY[targetCategory];
  if (!exemplars || exemplars.length === 0) {
    return { topSimilarityScore: 60, bestVariantMatch: 'Default Template', averageTop5Similarity: 60 };
  }

  const playerHu = calculateHuMoments(grayscale28);

  const playerEmbedding = [
    features.aspectRatio || 1.0,
    features.circularity || 0.3,
    features.symmetryHorizontal || 0.5,
    features.symmetryVertical || 0.5,
    (features.cornerCount || 0) / 10,
    features.hasClosedLoop ? 1.0 : 0.0,
    (features.density || 0.02) * 50,
    features.topHeavyRatio || 0.5,
    features.leftHeavyRatio || 0.5,
    ((features.aspectRatio || 1.0) > 0.8 && (features.aspectRatio || 1.0) < 1.2) ? 1.0 : 0.0,
    ((features.circularity || 0.3) > 0.6) ? 1.0 : 0.0,
    ((features.symmetryHorizontal || 0.5) > 0.4) ? 1.0 : 0.0,
    (features.cornerCount === 3) ? 1.0 : 0.0,
    (features.cornerCount === 4) ? 1.0 : 0.0,
    ((features.cornerCount || 0) >= 5) ? 1.0 : 0.0,
    (features.density || 0.02) > 0.02 ? 1.0 : 0.0
  ];

  const scores: { score: number; variant: string }[] = [];

  for (const ref of exemplars) {
    const cosSim = calculateCosineSimilarity(playerEmbedding, ref.embedding);

    // Feature distance
    let featScore = 0;
    if (ref.features.aspectRatio && features.aspectRatio) {
      const arDiff = Math.abs(ref.features.aspectRatio - features.aspectRatio);
      featScore += Math.max(0, 1 - arDiff);
    }
    if (ref.features.circularity && features.circularity) {
      const circDiff = Math.abs(ref.features.circularity - features.circularity);
      featScore += Math.max(0, 1 - circDiff);
    }
    if (ref.features.hasClosedLoop === features.hasClosedLoop) {
      featScore += 1.0;
    }
    featScore /= 3.0;

    // Combined score for this exemplar
    const matchScore = Math.round((cosSim * 0.60 + featScore * 0.40) * 100);
    scores.push({ score: matchScore, variant: ref.variantName });
  }

  // Sort descending
  scores.sort((a, b) => b.score - a.score);

  const topScore = scores[0]?.score || 50;
  const top5 = scores.slice(0, 5);
  const avgTop5 = Math.round(top5.reduce((acc, s) => acc + s.score, 0) / top5.length);

  return {
    topSimilarityScore: topScore,
    bestVariantMatch: scores[0]?.variant || 'Hand-drawn pattern',
    averageTop5Similarity: avgTop5
  };
}
