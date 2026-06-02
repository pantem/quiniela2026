const POINTS = {
  GROUP_EXACT: 8,
  GROUP_OUTCOME: 3,
  R32_WINNER: 4,
  R16_WINNER: 5,
  QF_WINNER: 6,
  SF_WINNER: 8,
  FINAL_WINNER: 10,
  FINALIST_BONUS: 16,
  CHAMPION_BONUS: 32,
  TOP_SCORER_BONUS: 10,
  MATCH_EXACT: 8,
  MATCH_OUTCOME: 3,
}

function getRoundWinnerPoints(round: string): number {
  switch (round) {
    case "r32": return POINTS.R32_WINNER
    case "r16": return POINTS.R16_WINNER
    case "qf": return POINTS.QF_WINNER
    case "sf": return POINTS.SF_WINNER
    case "final": return POINTS.FINAL_WINNER
    default: return 0
  }
}

export function calculateMatchScorePoints(
  predictions: Array<{ id: string; homeScore: number | null; awayScore: number | null }>,
  results: Array<{ id: string; homeScore: number | null; awayScore: number | null }>
): number {
  let points = 0
  for (const pred of predictions) {
    if (pred.homeScore === null || pred.awayScore === null) continue
    const actual = results.find((r) => r.id === pred.id)
    if (!actual || actual.homeScore === null || actual.awayScore === null) continue

    if (pred.homeScore === actual.homeScore && pred.awayScore === actual.awayScore) {
      points += POINTS.MATCH_EXACT
    } else {
      const predWinner =
        pred.homeScore > pred.awayScore ? "home" : pred.homeScore < pred.awayScore ? "away" : "draw"
      const actualWinner =
        actual.homeScore > actual.awayScore ? "home" : actual.homeScore < actual.awayScore ? "away" : "draw"
      if (predWinner === actualWinner) {
        points += POINTS.MATCH_OUTCOME
      }
    }
  }
  return points
}

export function calculateGroupPoints(
  prediction: { first: string | null; second: string | null; third: string | null; fourth: string | null },
  result: { first: string | null; second: string | null; third: string | null; fourth: string | null }
): number {
  let points = 0
  const positions: Array<"first" | "second" | "third" | "fourth"> = ["first", "second", "third", "fourth"]

  for (const pos of positions) {
    const pred = prediction[pos]
    const actual = result[pos]
    if (!pred || !actual) continue

    if (pred === actual) {
      points += POINTS.GROUP_EXACT
    } else {
      const actualTeams = positions.map((p) => prediction[p])
      if (actualTeams.includes(actual)) {
        points += POINTS.GROUP_OUTCOME
      }
    }
  }

  return points
}

export function calculateKnockoutPoints(
  predictions: Array<{ id: string; round: string; winner: string | null }>,
  results: Array<{ id: string; winner: string | null }>
): number {
  let points = 0

  for (const pred of predictions) {
    const actual = results.find((r) => r.id === pred.id)
    if (!actual?.winner) continue

    if (pred.winner === actual.winner) {
      points += getRoundWinnerPoints(pred.round)
    }
  }

  return points
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
