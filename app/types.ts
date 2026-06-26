export interface Team {
  id: string
  name: string
  flag: string
  groupId: string
}

export interface Group {
  id: string
  name: string
}

export interface GroupPrediction {
  groupId: string
  first: string | null
  second: string | null
  third: string | null
  fourth: string | null
}

export interface KnockoutMatch {
  id: string
  round: 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final'
  homeTeam: string | null
  awayTeam: string | null
  homeScore: number | null
  awayScore: number | null
  winner: string | null
  label: string
  sourceMatchId?: string
}

export interface BonusPrediction {
  bestGoalkeeper: string | null
  topScorer: string | null
  bestPlayer: string | null
}

export interface ResultOfficial {
  matchId: string
  round: string
  homeTeam: string | null
  awayTeam: string | null
  homeScore: number | null
  awayScore: number | null
  winner: string | null
}

export interface Participant {
  id: string
  name: string
  groups: GroupPrediction[]
  knockout: KnockoutMatch[]
  bonuses: BonusPrediction
  points: number
}

export interface MatchScore {
  id: string
  groupId: string
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
}

export interface ScoringConfig {
  groupExact: number
  groupOutcome: number
  matchExact: number
  matchOutcome: number
  r32Winner: number
  r32Exact: number
  r16Winner: number
  r16Exact: number
  qfWinner: number
  qfExact: number
  sfWinner: number
  sfExact: number
  thirdWinner: number
  thirdExact: number
  finalWinner: number
  finalExact: number
  goalkeeperBonus: number
  topScorerBonus: number
  playerBonus: number
}

export const DEFAULT_SCORING: ScoringConfig = {
  groupExact: 8,
  groupOutcome: 3,
  matchExact: 8,
  matchOutcome: 3,
  r32Winner: 4,
  r32Exact: 10,
  r16Winner: 5,
  r16Exact: 12,
  qfWinner: 6,
  qfExact: 16,
  sfWinner: 8,
  sfExact: 20,
  thirdWinner: 4,
  thirdExact: 10,
  finalWinner: 10,
  finalExact: 24,
  goalkeeperBonus: 10,
  topScorerBonus: 10,
  playerBonus: 10,
}

export interface PhaseLocks {
  groups: boolean
  r32: boolean
  r16: boolean
  qf: boolean
  sf: boolean
  third: boolean
  final: boolean
  bonuses: boolean
  fifaLocked: boolean
}

export const DEFAULT_PHASE_LOCKS: PhaseLocks = {
  groups: false,
  r32: false,
  r16: false,
  qf: false,
  sf: false,
  third: false,
  final: false,
  bonuses: false,
  fifaLocked: false,
}

export type AutoBonuses = Record<string, number>

export type TabId =
  | 'grupos'
  | 'marcadores'
  | 'eliminatoria'
  | 'fifaeliminatoria'
  | 'campeon'
  | 'resultados'
  | 'usuarios'
  | 'ranking'
  | 'dashboard'
