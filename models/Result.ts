import mongoose, { Schema, Document } from "mongoose"

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
  winner: string | null
  label: string
}

export interface IBonusResult {
  finalist: string | null
  champion: string | null
  topScorer: string | null
}

export interface IResult extends Document {
  groups: IGroupResult[]
  matchScores: IMatchScoreResult[]
  knockout: IKnockoutResult[]
  bonuses: IBonusResult
  updatedAt: Date
}

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
    winner: { type: String, default: null },
    label: { type: String, required: true },
  },
  { _id: false }
)

const BonusResultSchema = new Schema<IBonusResult>(
  {
    finalist: { type: String, default: null },
    champion: { type: String, default: null },
    topScorer: { type: String, default: null },
  },
  { _id: false }
)

const ResultSchema = new Schema<IResult>(
  {
    groups: { type: [GroupResultSchema], required: true },
    matchScores: { type: [MatchScoreResultSchema], default: [] },
    knockout: { type: [KnockoutResultSchema], default: [] },
    bonuses: { type: BonusResultSchema, required: true },
  },
  { timestamps: true }
)

export const ResultModel =
  mongoose.models.Result ||
  mongoose.model<IResult>("Result", ResultSchema)
