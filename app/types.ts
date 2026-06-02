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
  round: 'r32' | 'r16' | 'qf' | 'sf' | 'final'
  homeTeam: string | null
  awayTeam: string | null
  winner: string | null
  label: string
  sourceMatchId?: string
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

export interface BonusPrediction {
  finalist: string | null
  champion: string | null
  topScorer: string | null
}

export interface Participant {
  id: string
  name: string
  groups: GroupPrediction[]
  knockout: KnockoutMatch[]
  bonuses: BonusPrediction
  points: number
}

export type TabId =
  | 'grupos'
  | 'dieciseisavos'
  | 'octavos'
  | 'cuartos'
  | 'semifinal'
  | 'final'
  | 'campeon'
  | 'resultados'
  | 'ranking'
  | 'dashboard'
