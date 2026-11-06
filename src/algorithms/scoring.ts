export interface RouteScoringResult {
  efficiencyScore: number;
  breakdown: {
    distanceImpact: number;
    timeImpact: number;
    costImpact: number;
    transferImpact: number;
  };
}

/**
 * Multi-Criteria Route Scoring Algorithm
 * Transparent scoring formula evaluating route quality on a 10 - 99 scale.
 *
 * Mathematical formulation:
 * Penalty = (w_d * norm(distance) + w_t * norm(time) + w_c * norm(cost) + w_x * norm(transfers)) * 100
 * Efficiency Score = clamp(100 - Penalty, 10, 99)
 *
 * Weights:
 * - Distance Weight (w_d)  = 0.30 (30%)
 * - Travel Time Weight (w_t) = 0.35 (35%)
 * - Cost / Fare Weight (w_c) = 0.20 (20%)
 * - Transfers Weight (w_x)  = 0.15 (15%)
 */
export function calculateEfficiencyScore(
  totalDistance: number,
  totalTime: number,
  totalCost: number,
  transfers: number,
  baselines = { maxDist: 40, maxTime: 90, maxCost: 100, maxTransfers: 6 }
): RouteScoringResult {
  const normDist = Math.min(1, Math.max(0, totalDistance / baselines.maxDist));
  const normTime = Math.min(1, Math.max(0, totalTime / baselines.maxTime));
  const normCost = Math.min(1, Math.max(0, totalCost / baselines.maxCost));
  const normTransfers = Math.min(1, Math.max(0, transfers / baselines.maxTransfers));

  const distanceImpact = Number((0.30 * normDist * 100).toFixed(1));
  const timeImpact = Number((0.35 * normTime * 100).toFixed(1));
  const costImpact = Number((0.20 * normCost * 100).toFixed(1));
  const transferImpact = Number((0.15 * normTransfers * 100).toFixed(1));

  const totalPenalty = distanceImpact + timeImpact + costImpact + transferImpact;
  const rawScore = Math.round(100 - totalPenalty);
  const efficiencyScore = Math.max(10, Math.min(99, rawScore));

  return {
    efficiencyScore,
    breakdown: {
      distanceImpact,
      timeImpact,
      costImpact,
      transferImpact
    }
  };
}
