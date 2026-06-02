import { KnockoutMatch, GroupPrediction, ResultOfficial } from "@/app/types"

const POINTS = {
  GROUP_EXACT: 8,
  GROUP_OUTCOME: 3,
  R32_EXACT: 10,
  R32_WINNER: 4,
  R16_EXACT: 12,
  R16_WINNER: 5,
  QF_EXACT: 16,
  QF_WINNER: 6,
  SF_EXACT: 20,
  SF_WINNER: 8,
  FINAL_EXACT: 24,
  FINAL_WINNER: 10,
  FINALIST_BONUS: 16,
  CHAMPION_BONUS: 32,
  TOP_SCORER_BONUS: 10,
}

export function calculateGroupPoints(
  prediction: GroupPrediction,
  results: GroupPrediction
): number {
  let points = 0
  const positions: Array<"first" | "second" | "third" | "fourth"> = [
    "first",
    "second",
    "third",
    "fourth",
  ]

  for (const pos of positions) {
    const pred = prediction[pos]
    const actual = results[pos]
    if (!pred || !actual) continue
    if (pred === actual) {
      points += POINTS.GROUP_EXACT
    } else {
      const predTeam = pred
      const actualTeams = positions
        .filter((p) => prediction[p] === actual)
        .map((p) => results[p])
      if (actualTeams.includes(predTeam)) {
        points += POINTS.GROUP_OUTCOME
      }
    }
  }

  return points
}

export function calculateKnockoutPoints(
  predictions: KnockoutMatch[],
  results: KnockoutMatch[]
): number {
  let points = 0

  for (const pred of predictions) {
    const actual = results.find((r) => r.id === pred.id)
    if (!actual || !actual.winner) continue

    const roundPoints = getRoundPoints(pred.round)

    if (pred.winner === actual.winner) {
      points += roundPoints.winner
    }
  }

  return points
}

function getRoundPoints(
  round: string
): { exact: number; winner: number } {
  switch (round) {
    case "r32":
      return { exact: POINTS.R32_EXACT, winner: POINTS.R32_WINNER }
    case "r16":
      return { exact: POINTS.R16_EXACT, winner: POINTS.R16_WINNER }
    case "qf":
      return { exact: POINTS.QF_EXACT, winner: POINTS.QF_WINNER }
    case "sf":
      return { exact: POINTS.SF_EXACT, winner: POINTS.SF_WINNER }
    case "final":
      return { exact: POINTS.FINAL_EXACT, winner: POINTS.FINAL_WINNER }
    default:
      return { exact: 0, winner: 0 }
  }
}

export function calculateBonusPoints(
  predictions: { finalist: string | null; champion: string | null; topScorer: string | null },
  results: { finalist: string | null; champion: string | null; topScorer: string | null }
): number {
  let points = 0
  if (predictions.finalist === results.finalist) points += POINTS.FINALIST_BONUS
  if (predictions.champion === results.champion) points += POINTS.CHAMPION_BONUS
  if (predictions.topScorer === results.topScorer) points += POINTS.TOP_SCORER_BONUS
  return points
}
