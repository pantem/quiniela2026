import { KnockoutMatch, GroupPrediction, MatchScore, ScoringConfig, DEFAULT_SCORING } from "@/app/types"

function getRoundPoints(
  cfg: ScoringConfig,
  round: string
): { exact: number; winner: number } {
  switch (round) {
    case "r32": return { exact: cfg.r32Exact, winner: cfg.r32Winner }
    case "r16": return { exact: cfg.r16Exact, winner: cfg.r16Winner }
    case "qf": return { exact: cfg.qfExact, winner: cfg.qfWinner }
    case "sf": return { exact: cfg.sfExact, winner: cfg.sfWinner }
    case "final": return { exact: cfg.finalExact, winner: cfg.finalWinner }
    default: return { exact: 0, winner: 0 }
  }
}

export function calculateMatchScorePoints(
  predictions: MatchScore[],
  results: MatchScore[],
  cfg: ScoringConfig = DEFAULT_SCORING
): number {
  let points = 0
  for (const pred of predictions) {
    if (pred.homeScore === null || pred.awayScore === null) continue
    const actual = results.find((r) => r.id === pred.id)
    if (!actual || actual.homeScore === null || actual.awayScore === null) continue

    if (pred.homeScore === actual.homeScore && pred.awayScore === actual.awayScore) {
      points += cfg.matchExact
    } else {
      const predWinner =
        pred.homeScore > pred.awayScore ? "home" : pred.homeScore < pred.awayScore ? "away" : "draw"
      const actualWinner =
        actual.homeScore > actual.awayScore ? "home" : actual.homeScore < actual.awayScore ? "away" : "draw"
      if (predWinner === actualWinner) {
        points += cfg.matchOutcome
      }
    }
  }
  return points
}

export function calculateGroupPoints(
  prediction: GroupPrediction,
  results: GroupPrediction,
  cfg: ScoringConfig = DEFAULT_SCORING
): number {
  let points = 0
  const positions: Array<"first" | "second" | "third" | "fourth"> = [
    "first", "second", "third", "fourth",
  ]

  for (const pos of positions) {
    const pred = prediction[pos]
    const actual = results[pos]
    if (!pred || !actual) continue
    if (pred === actual) {
      points += cfg.groupExact
    } else {
      const actualTeams = positions
        .filter((p) => prediction[p] === actual)
        .map((p) => results[p])
      if (actualTeams.includes(pred)) {
        points += cfg.groupOutcome
      }
    }
  }

  return points
}

export function calculateKnockoutPoints(
  predictions: KnockoutMatch[],
  results: KnockoutMatch[],
  cfg: ScoringConfig = DEFAULT_SCORING
): number {
  let total = 0

  for (const pred of predictions) {
    const actual = results.find((r) => r.id === pred.id)
    if (!actual) continue

    const pts = getRoundPoints(cfg, pred.round)

    if (pred.winner === actual.winner) {
      total += pts.winner
    }

    if (
      pred.homeScore != null && pred.awayScore != null &&
      actual.homeScore != null && actual.awayScore != null &&
      pred.homeScore === actual.homeScore && pred.awayScore === actual.awayScore
    ) {
      total += pts.exact
    }
  }

  return total
}

export function calculateBonusPoints(
  predictions: { finalist: string | null; champion: string | null; topScorer: string | null },
  results: { finalist: string | null; champion: string | null; topScorer: string | null },
  cfg: ScoringConfig = DEFAULT_SCORING
): number {
  let points = 0
  if (predictions.finalist === results.finalist) points += cfg.finalistBonus
  if (predictions.champion === results.champion) points += cfg.championBonus
  if (predictions.topScorer === results.topScorer) points += cfg.topScorerBonus
  return points
}
