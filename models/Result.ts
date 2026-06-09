import mongoose, { Schema, Document } from "mongoose"
import type { PhaseLocks } from "@/app/types"

export interface IGroupResult {
  groupId: string
  first: string | null
  second: string | null
  third: string | null
  fourth: string | null
}

export interface IMatchScoreResult {
  id: string
  groupId: string
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
}

export interface IKnockoutResult {
  id: string
  round: string
  homeTeam: string | null
  awayTeam: string | null
  homeScore: number | null
  awayScore: number | null
  winner: string | null
  label: string
}

export interface IBonusResult {
  bestGoalkeeper: string | null
  topScorer: string | null
  bestPlayer: string | null
}

export interface IScoringConfig {
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
  finalWinner: number
  finalExact: number
  goalkeeperBonus: number
  topScorerBonus: number
  playerBonus: number
}

export interface IResult extends Document {
  groups: IGroupResult[]
  matchScores: IMatchScoreResult[]
  knockout: IKnockoutResult[]
  bonuses: IBonusResult
  scoringConfig: IScoringConfig | null
  locked: boolean
  phaseLocks: PhaseLocks
  autoBonuses: Record<string, number>
  updatedAt: Date
}

const ScoringConfigSchema = new Schema<IScoringConfig>(
  {
    groupExact: { type: Number, default: 8 },
    groupOutcome: { type: Number, default: 3 },
    matchExact: { type: Number, default: 8 },
    matchOutcome: { type: Number, default: 3 },
    r32Winner: { type: Number, default: 4 },
    r32Exact: { type: Number, default: 10 },
    r16Winner: { type: Number, default: 5 },
    r16Exact: { type: Number, default: 12 },
    qfWinner: { type: Number, default: 6 },
    qfExact: { type: Number, default: 16 },
    sfWinner: { type: Number, default: 8 },
    sfExact: { type: Number, default: 20 },
    thirdWinner: { type: Number, default: 4 },
    thirdExact: { type: Number, default: 10 },
    finalWinner: { type: Number, default: 10 },
    finalExact: { type: Number, default: 24 },
    goalkeeperBonus: { type: Number, default: 10 },
    topScorerBonus: { type: Number, default: 10 },
    playerBonus: { type: Number, default: 10 },
  },
  { _id: false }
)

const GroupResultSchema = new Schema<IGroupResult>(
  {
    groupId: { type: String, required: true },
    first: { type: String, default: null },
    second: { type: String, default: null },
    third: { type: String, default: null },
    fourth: { type: String, default: null },
  },
  { _id: false }
)

const MatchScoreResultSchema = new Schema<IMatchScoreResult>(
  {
    id: { type: String, required: true },
    groupId: { type: String, required: true },
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    homeScore: { type: Number, default: null },
    awayScore: { type: Number, default: null },
  },
  { _id: false }
)

const KnockoutResultSchema = new Schema<IKnockoutResult>(
  {
    id: { type: String, required: true },
    round: { type: String, required: true },
    homeTeam: { type: String, default: null },
    awayTeam: { type: String, default: null },
    homeScore: { type: Number, default: null },
    awayScore: { type: Number, default: null },
    winner: { type: String, default: null },
    label: { type: String, required: true },
  },
  { _id: false }
)

const PhaseLocksSchema = new Schema<PhaseLocks>(
  {
    groups: { type: Boolean, default: false },
    r32: { type: Boolean, default: false },
    r16: { type: Boolean, default: false },
    qf: { type: Boolean, default: false },
    sf: { type: Boolean, default: false },
    third: { type: Boolean, default: false },
    final: { type: Boolean, default: false },
  },
  { _id: false }
)

const BonusResultSchema = new Schema<IBonusResult>(
  {
    bestGoalkeeper: { type: String, default: null },
    topScorer: { type: String, default: null },
    bestPlayer: { type: String, default: null },
  },
  { _id: false }
)

const ResultSchema = new Schema<IResult>(
  {
    groups: { type: [GroupResultSchema], required: true },
    matchScores: { type: [MatchScoreResultSchema], default: [] },
    knockout: { type: [KnockoutResultSchema], default: [] },
    bonuses: { type: BonusResultSchema, default: () => ({ bestGoalkeeper: null, topScorer: null, bestPlayer: null }) },
    scoringConfig: { type: ScoringConfigSchema, default: null },
    locked: { type: Boolean, default: false },
    phaseLocks: { type: PhaseLocksSchema, default: () => ({ groups: false, r32: false, r16: false, qf: false, sf: false, final: false }) },
    autoBonuses: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

export const ResultModel =
  mongoose.models.Result ||
  mongoose.model<IResult>("Result", ResultSchema)
