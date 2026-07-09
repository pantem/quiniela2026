import { ScoringConfig, DEFAULT_SCORING } from "@/app/types"
import { connectDB } from "./mongodb"
import { ResultModel } from "@/models/Result"

let cachedConfig: ScoringConfig | null = null

export async function getScoringConfig(): Promise<ScoringConfig> {
  if (cachedConfig) return cachedConfig
  try {
    await connectDB()
    const result = await ResultModel.findOne().sort({ updatedAt: -1 }).lean() as any
    if (result?.scoringConfig) {
      cachedConfig = { ...DEFAULT_SCORING, ...result.scoringConfig }
      return cachedConfig!
    }
  } catch {}
  return { ...DEFAULT_SCORING }
}

function points(cfg: ScoringConfig, round: string): { winner: number; exact: number } {
  switch (round) {
    case "r32": return { winner: cfg.r32Winner, exact: cfg.r32Exact }
    case "r16": return { winner: cfg.r16Winner, exact: cfg.r16Exact }
    case "qf": return { winner: cfg.qfWinner, exact: cfg.qfExact }
    case "sf": return { winner: cfg.sfWinner, exact: cfg.sfExact }
    case "third": return { winner: cfg.thirdWinner, exact: cfg.thirdExact }
    case "final": return { winner: cfg.finalWinner, exact: cfg.finalExact }
    default: return { winner: 0, exact: 0 }
  }
}

export async function calculateMatchScorePoints(
  predictions: Array<{ id: string; homeScore: number | null; awayScore: number | null }>,
  results: Array<{ id: string; homeScore: number | null; awayScore: number | null }>
): Promise<number> {
  const cfg = await getScoringConfig()
  let points = 0
  for (const pred of predictions) {
    if (pred.homeScore === null || pred.awayScore === null) continue
    const actual = results.find((r) => r.id === pred.id)
    if (!actual || actual.homeScore === null || actual.awayScore === null) continue
    if (pred.homeScore === actual.homeScore && pred.awayScore === actual.awayScore) {
      points += cfg.matchExact
    } else {
      const predWinner = pred.homeScore > pred.awayScore ? "home" : pred.homeScore < pred.awayScore ? "away" : "draw"
      const actualWinner = actual.homeScore > actual.awayScore ? "home" : actual.homeScore < actual.awayScore ? "away" : "draw"
      if (predWinner === actualWinner) {
        points += cfg.matchOutcome
      }
    }
  }
  return points
}

export async function calculateGroupPoints(
  prediction: { first: string | null; second: string | null; third: string | null; fourth: string | null },
  result: { first: string | null; second: string | null; third: string | null; fourth: string | null }
): Promise<number> {
  const cfg = await getScoringConfig()
  let points = 0
  const positions: Array<"first" | "second" | "third" | "fourth"> = ["first", "second", "third", "fourth"]
  for (const pos of positions) {
    const pred = prediction[pos]
    const actual = result[pos]
    if (!pred || !actual) continue
    if (pred === actual) {
      points += cfg.groupExact
    } else {
      const actualTeams = positions.map((p) => prediction[p])
      if (actualTeams.includes(actual)) {
        points += cfg.groupOutcome
      }
    }
  }
  return points
}

export async function calculateBonusPoints(
  predictions: { bestGoalkeeper: string | null; topScorer: string | null; bestPlayer: string | null } | null | undefined,
  results: { bestGoalkeeper: string | null; topScorer: string | null; bestPlayer: string | null } | null | undefined
): Promise<number> {
  if (!predictions || !results) return 0
  const cfg = await getScoringConfig()
  let points = 0
  if (predictions.bestGoalkeeper != null && predictions.bestGoalkeeper === results.bestGoalkeeper) points += cfg.goalkeeperBonus
  if (predictions.topScorer != null && predictions.topScorer === results.topScorer) points += cfg.topScorerBonus
  if (predictions.bestPlayer != null && predictions.bestPlayer === results.bestPlayer) points += cfg.playerBonus
  return points
}

export async function calculateFifaKnockoutPoints(
  predictions: Array<{ id: string; round: string; winner: string | null; homeScore?: number | null; awayScore?: number | null; homeTeam?: string | null; awayTeam?: string | null }>,
  results: Array<{ id: string; winner: string | null; homeScore?: number | null; awayScore?: number | null; homeTeam?: string | null; awayTeam?: string | null }>
): Promise<number> {
  const cfg = await getScoringConfig()
  let total = 0
  for (const pred of predictions) {
    const actual = results.find((r) => r.id === pred.id)
    if (!actual) continue
    const resultWinner = actual.winner ?? (
      actual.homeScore != null && actual.awayScore != null && actual.homeScore !== actual.awayScore
        ? actual.homeScore > actual.awayScore ? actual.homeTeam ?? null : actual.awayTeam ?? null
        : null
    )
    if (resultWinner == null) continue
    const predWinner = pred.winner ?? (
      pred.homeScore != null && pred.awayScore != null && pred.homeScore !== pred.awayScore
        ? pred.homeScore > pred.awayScore ? pred.homeTeam ?? null : pred.awayTeam ?? null
        : null
    )
    const pts = points(cfg, pred.round)
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

export async function calculateKnockoutPoints(
  predictions: Array<{ id: string; round: string; winner: string | null; homeScore?: number | null; awayScore?: number | null; homeTeam?: string | null; awayTeam?: string | null }>,
  results: Array<{ id: string; winner: string | null; homeScore?: number | null; awayScore?: number | null; homeTeam?: string | null; awayTeam?: string | null }>
): Promise<number> {
  const cfg = await getScoringConfig()
  let total = 0
  for (const pred of predictions) {
    const actual = results.find((r) => r.id === pred.id)
    if (!actual) continue
    const resultWinner = actual.winner ?? (
      actual.homeScore != null && actual.awayScore != null && actual.homeScore !== actual.awayScore
        ? actual.homeScore > actual.awayScore ? actual.homeTeam ?? null : actual.awayTeam ?? null
        : null
    )
    if (resultWinner == null) continue
    const predWinner = pred.winner ?? (
      pred.homeScore != null && pred.awayScore != null && pred.homeScore !== pred.awayScore
        ? pred.homeScore > pred.awayScore ? pred.homeTeam ?? null : pred.awayTeam ?? null
        : null
    )
    const pts = points(cfg, pred.round)
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

export async function calculateMatchStats(
  predictions: Array<{ id: string; homeScore: number | null; awayScore: number | null }>,
  results: Array<{ id: string; homeScore: number | null; awayScore: number | null }>
): Promise<{
  played: number
  exact: number
  trend: number
  wrong: number
  goalDiff: number
  points: number
}> {
  const cfg = await getScoringConfig()
  let played = 0
  let exact = 0
  let trend = 0
  let wrong = 0
  let goalDiff = 0
  let points = 0

  for (const pred of predictions) {
    if (pred.homeScore === null || pred.awayScore === null) continue
    played++
    const actual = results.find((r) => r.id === pred.id)
    if (!actual || actual.homeScore === null || actual.awayScore === null) continue

    const predGD = pred.homeScore - pred.awayScore
    const actualGD = actual.homeScore - actual.awayScore
    goalDiff += predGD - actualGD

    if (pred.homeScore === actual.homeScore && pred.awayScore === actual.awayScore) {
      exact++
      points += cfg.matchExact
    } else {
      const predWinner = pred.homeScore > pred.awayScore ? "home" : pred.homeScore < pred.awayScore ? "away" : "draw"
      const actualWinner = actual.homeScore > actual.awayScore ? "home" : actual.homeScore < actual.awayScore ? "away" : "draw"
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
