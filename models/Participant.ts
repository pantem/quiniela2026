import mongoose, { Schema, Document } from "mongoose"
import type { PhaseLocks } from "@/app/types"

export interface IGroupPrediction {
  groupId: string
  first: string | null
  second: string | null
  third: string | null
  fourth: string | null
}

export interface IMatchScorePrediction {
  id: string
  groupId: string
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
}

export interface IKnockoutPrediction {
  id: string
  round: string
  homeTeam: string | null
  awayTeam: string | null
  homeScore: number | null
  awayScore: number | null
  winner: string | null
  label: string
}

export interface IBonusPrediction {
  bestGoalkeeper: string | null
  topScorer: string | null
  bestPlayer: string | null
}

export interface IChangelogEntry {
  timestamp: Date
  changes: string
}

export interface IPhasePermissions {
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

const DEFAULT_PHASE_PERMISSIONS: IPhasePermissions = {
  groups: true,
  r32: true,
  r16: true,
  qf: true,
  sf: true,
  third: true,
  final: true,
  bonuses: true,
  fifaLocked: true,
}

export interface IParticipant extends Document {
  name: string
  groups: IGroupPrediction[]
  matchPredictions: IMatchScorePrediction[]
  knockout: IKnockoutPrediction[]
  fifaKnockout: IKnockoutPrediction[]
  bonuses: IBonusPrediction
  penalties: number
  canEdit: boolean
  phasePermissions: IPhasePermissions
  changelog: IChangelogEntry[]
  createdAt: Date
  updatedAt: Date
}

const GroupPredictionSchema = new Schema<IGroupPrediction>(
  {
    groupId: { type: String, required: true },
    first: { type: String, default: null },
    second: { type: String, default: null },
    third: { type: String, default: null },
    fourth: { type: String, default: null },
  },
  { _id: false }
)

const MatchScorePredictionSchema = new Schema<IMatchScorePrediction>(
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

const KnockoutPredictionSchema = new Schema<IKnockoutPrediction>(
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

const BonusPredictionSchema = new Schema<IBonusPrediction>(
  {
    bestGoalkeeper: { type: String, default: null },
    topScorer: { type: String, default: null },
    bestPlayer: { type: String, default: null },
  },
  { _id: false }
)

const ChangelogEntrySchema = new Schema<IChangelogEntry>(
  {
    timestamp: { type: Date, default: Date.now },
    changes: { type: String, required: true },
  },
  { _id: false }
)

const PhasePermissionsSchema = new Schema<IPhasePermissions>(
  {
    groups: { type: Boolean, default: true },
    r32: { type: Boolean, default: true },
    r16: { type: Boolean, default: true },
    qf: { type: Boolean, default: true },
    sf: { type: Boolean, default: true },
    third: { type: Boolean, default: true },
    final: { type: Boolean, default: true },
    bonuses: { type: Boolean, default: true },
    fifaLocked: { type: Boolean, default: true },
  },
  { _id: false }
)

const ParticipantSchema = new Schema<IParticipant>(
  {
    name: { type: String, required: true, unique: true },
    groups: { type: [GroupPredictionSchema], required: true },
    matchPredictions: { type: [MatchScorePredictionSchema], default: [] },
    knockout: { type: [KnockoutPredictionSchema], default: [] },
    fifaKnockout: { type: [KnockoutPredictionSchema], default: [] },
    bonuses: { type: BonusPredictionSchema, default: () => ({ bestGoalkeeper: null, topScorer: null, bestPlayer: null }) },
    penalties: { type: Number, default: 0 },
    canEdit: { type: Boolean, default: false },
    phasePermissions: { type: PhasePermissionsSchema, default: () => ({ ...DEFAULT_PHASE_PERMISSIONS }) },
    changelog: { type: [ChangelogEntrySchema], default: [] },
  },
  { timestamps: true }
)

export const Participant =
  mongoose.models.Participant ||
  mongoose.model<IParticipant>("Participant", ParticipantSchema)
