import { KnockoutMatch, GroupPrediction, MatchScore, BonusPrediction, ScoringConfig, DEFAULT_SCORING } from "@/app/types"
import { fuzzyPlayerMatch } from "@/utils/nameMatch"

function getRoundPoints(
  cfg: ScoringConfig,
  round: string
): { exact: number; winner: number } {
  switch (round) {
    case "r32": return { exact: cfg.r32Exact, winner: cfg.r32Winner }
    case "r16": return { exact: cfg.r16Exact, winner: cfg.r16Winner }
    case "qf": return { exact: cfg.qfExact, winner: cfg.qfWinner }
    case "sf": return { exact: cfg.sfExact, winner: cfg.sfWinner }
    case "third": return { exact: cfg.thirdExact, winner: cfg.thirdWinner }
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
    if (!pred || !pred.id) continue
    if (pred.homeScore === null || pred.awayScore === null) continue
    const actual = results.find((r) => r && r.id === pred.id)
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
  if (!prediction || !results) return 0
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

export function calculateBonusPoints(
  predictions: BonusPrediction | null | undefined,
  results: BonusPrediction | null | undefined,
  cfg: ScoringConfig = DEFAULT_SCORING
): number {
  if (!predictions || !results) return 0
  let points = 0
  if (fuzzyPlayerMatch(predictions.bestGoalkeeper, results.bestGoalkeeper)) points += cfg.goalkeeperBonus
  if (fuzzyPlayerMatch(predictions.topScorer, results.topScorer)) points += cfg.topScorerBonus
  if (fuzzyPlayerMatch(predictions.bestPlayer, results.bestPlayer)) points += cfg.playerBonus
  return points
}

export function calculateFifaKnockoutPoints(
  predictions: KnockoutMatch[],
  results: KnockoutMatch[],
  cfg: ScoringConfig = DEFAULT_SCORING
): number {
  let total = 0
  for (const pred of predictions) {
    if (!pred || !pred.id) continue
    const actual = results.find((r) => r && r.id === pred.id)
    if (!actual) continue
    const resultWinner = actual.winner ?? (
      actual.homeScore != null && actual.awayScore != null && actual.homeScore !== actual.awayScore
        ? actual.homeScore > actual.awayScore ? actual.homeTeam : actual.awayTeam
        : null
    )
    if (resultWinner == null) continue

    const predWinner = pred.winner ?? (
      pred.homeScore != null && pred.awayScore != null && pred.homeScore !== pred.awayScore
        ? pred.homeScore > pred.awayScore ? (pred.homeTeam ?? actual.homeTeam) : (pred.awayTeam ?? actual.awayTeam)
        : null
    )

    const pts = getRoundPoints(cfg, pred.round)
    if (
      pred.homeScore != null && pred.awayScore != null &&
      actual.homeScore != null && actual.awayScore != null &&
      pred.homeScore === actual.homeScore && pred.awayScore === actual.awayScore
    ) {
      total += pts.exact
    } else if (predWinner != null && predWinner === resultWinner) {
      total += pts.winner
    }
  }
  return total
}

export function calculateKnockoutPoints(
  predictions: KnockoutMatch[],
  results: KnockoutMatch[],
  cfg: ScoringConfig = DEFAULT_SCORING
): number {
  let total = 0

  for (const pred of predictions) {
    if (!pred || !pred.id) continue
    const actual = results.find((r) => r && r.id === pred.id)
    if (!actual) continue

    const resultWinner = actual.winner ?? (
      actual.homeScore != null && actual.awayScore != null && actual.homeScore !== actual.awayScore
        ? actual.homeScore > actual.awayScore ? actual.homeTeam : actual.awayTeam
        : null
    )
    if (resultWinner == null) continue

    const predWinner = pred.winner ?? (
      pred.homeScore != null && pred.awayScore != null && pred.homeScore !== pred.awayScore
        ? pred.homeScore > pred.awayScore ? (pred.homeTeam ?? actual.homeTeam) : (pred.awayTeam ?? actual.awayTeam)
        : null
    )

    const pts = getRoundPoints(cfg, pred.round)

    if (
      pred.homeScore != null && pred.awayScore != null &&
      actual.homeScore != null && actual.awayScore != null &&
      pred.homeScore === actual.homeScore && pred.awayScore === actual.awayScore
    ) {
      total += pts.exact
    } else if (predWinner != null && predWinner === resultWinner) {
      total += pts.winner
    }
  }

  return total
}

export interface MatchPredictionStats {
  played: number
  exact: number
  trend: number
  wrong: number
  goalDiff: number
  points: number
}

export function calculateMatchStats(
  predictions: MatchScore[],
  results: MatchScore[],
  cfg: ScoringConfig = DEFAULT_SCORING
): MatchPredictionStats {
  let played = 0
  let exact = 0
  let trend = 0
  let wrong = 0
  let goalDiff = 0
  let points = 0

  for (const pred of predictions) {
    if (!pred || !pred.id) continue
    if (pred.homeScore === null || pred.awayScore === null) continue
    played++

    const actual = results.find((r) => r && r.id === pred.id)
    if (!actual || actual.homeScore === null || actual.awayScore === null) continue

    const predGD = pred.homeScore - pred.awayScore
    const actualGD = actual.homeScore - actual.awayScore
    goalDiff += predGD - actualGD

    if (pred.homeScore === actual.homeScore && pred.awayScore === actual.awayScore) {
      exact++
      points += cfg.matchExact
    } else {
      const predWinner =
        pred.homeScore > pred.awayScore ? "home" : pred.homeScore < pred.awayScore ? "away" : "draw"
      const actualWinner =
        actual.homeScore > actual.awayScore ? "home" : actual.homeScore < actual.awayScore ? "away" : "draw"
      if (predWinner === actualWinner) {
        trend++
        points += cfg.matchOutcome
      } else {
        wrong++
      }
    }
  }

  return { played, exact, trend, wrong, goalDiff, points }
}
