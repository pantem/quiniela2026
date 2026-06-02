"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  GroupPrediction,
  KnockoutMatch,
  BonusPrediction,
  MatchScore,
} from "@/app/types"
import { groups } from "@/utils/teams"
import { getBestThirdPlaced } from "@/utils/bestThird"
import { buildFifaMatrix } from "@/utils/fifaMatrix"
import { calculateGroupPoints, calculateKnockoutPoints, calculateBonusPoints, calculateMatchScorePoints } from "@/utils/scoring"
import { getAllGroupMatches, buildGroupResultsFromScores } from "@/utils/matches"
import { saveParticipant, updateParticipant, fetchParticipants, fetchResults, saveResults } from "@/lib/api"

interface QuinielaState {
  participantName: string
  groups: GroupPrediction[]
  matchPredictions: MatchScore[]
  knockout: KnockoutMatch[]
  bonuses: BonusPrediction
  results: {
    groups: GroupPrediction[]
    knockout: KnockoutMatch[]
    bonuses: BonusPrediction
  }
  resultMatchScores: MatchScore[]
  allParticipants: Array<{ name: string }>
  syncing: boolean
  lastSync: string | null

  setParticipantName: (name: string) => void
  setGroupPrediction: (groupId: string, position: "first" | "second" | "third" | "fourth", teamId: string | null) => void
  setMatchScore: (matchId: string, homeScore: number | null, awayScore: number | null) => void
  setKnockoutWinner: (matchId: string, teamId: string | null) => void
  setBonus: (key: keyof BonusPrediction, value: string | null) => void
  setResultMatchScore: (matchId: string, homeScore: number | null, awayScore: number | null) => void
  setResultGroup: (groupId: string, position: "first" | "second" | "third" | "fourth", teamId: string | null) => void
  setResultWinner: (matchId: string, teamId: string | null) => void
  setResultBonus: (key: keyof BonusPrediction, value: string | null) => void
  applyResultStandings: () => void
  resetResultMatchScores: () => void
  refreshKnockout: () => void
  getTotalPoints: () => number
  getGroupPoints: () => number
  getMatchPoints: () => number
  getKnockoutPoints: () => number
  getBonusPoints: () => number
  resetAll: () => void
  syncToMongo: () => Promise<void>
  loadFromMongo: (name: string) => Promise<void>
  loadResultsFromMongo: () => Promise<void>
  loadAllParticipants: () => Promise<void>
  saveResultsToMongo: () => Promise<void>
}

const defaultGroups = () =>
  groups.map(
    (g): GroupPrediction => ({
      groupId: g.id,
      first: null,
      second: null,
      third: null,
      fourth: null,
    })
  )

const defaultMatchPredictions = () =>
  getAllGroupMatches().map(
    (m): MatchScore => ({
      id: m.id,
      groupId: m.groupId,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeScore: null,
      awayScore: null,
    })
  )

const defaultResultMatchScores = () =>
  getAllGroupMatches().map(
    (m): MatchScore => ({
      id: m.id,
      groupId: m.groupId,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeScore: null,
      awayScore: null,
    })
  )

const defaultBonuses: BonusPrediction = {
  finalist: null,
  champion: null,
  topScorer: null,
}

const defaultResultsGroups = () =>
  groups.map(
    (g): GroupPrediction => ({
      groupId: g.id,
      first: null,
      second: null,
      third: null,
      fourth: null,
    })
  )

export const useQuinielaStore = create<QuinielaState>()(
  persist(
    (set, get) => ({
      participantName: "",
      groups: defaultGroups(),
      matchPredictions: defaultMatchPredictions(),
      knockout: [],
      bonuses: { ...defaultBonuses },
      results: {
        groups: defaultResultsGroups(),
        knockout: [],
        bonuses: { ...defaultBonuses },
      },
      resultMatchScores: defaultResultMatchScores(),
      allParticipants: [],
      syncing: false,
      lastSync: null,

      setParticipantName: (name) => set({ participantName: name }),

      setGroupPrediction: (groupId, position, teamId) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.groupId === groupId ? { ...g, [position]: teamId } : g
          ),
        }))
        get().refreshKnockout()
      },

      setMatchScore: (matchId, homeScore, awayScore) => {
        set((state) => ({
          matchPredictions: state.matchPredictions.map((m) =>
            m.id === matchId ? { ...m, homeScore, awayScore } : m
          ),
        }))
      },

      setKnockoutWinner: (matchId, teamId) => {
        set((state) => ({
          knockout: state.knockout.map((m) =>
            m.id === matchId ? { ...m, winner: teamId } : m
          ),
        }))
      },

      setBonus: (key, value) => {
        set((state) => ({
          bonuses: { ...state.bonuses, [key]: value },
        }))
      },

      setResultMatchScore: (matchId, homeScore, awayScore) => {
        set((state) => ({
          resultMatchScores: state.resultMatchScores.map((m) =>
            m.id === matchId ? { ...m, homeScore, awayScore } : m
          ),
        }))
      },

      setResultGroup: (groupId, position, teamId) => {
        set((state) => ({
          results: {
            ...state.results,
            groups: state.results.groups.map((g) =>
              g.groupId === groupId ? { ...g, [position]: teamId } : g
            ),
          },
        }))
      },

      setResultWinner: (matchId, teamId) => {
        set((state) => ({
          results: {
            ...state.results,
            knockout: state.results.knockout.map((m) =>
              m.id === matchId ? { ...m, winner: teamId } : m
            ),
          },
        }))
      },

      setResultBonus: (key, value) => {
        set((state) => ({
          results: {
            ...state.results,
            bonuses: { ...state.results.bonuses, [key]: value },
          },
        }))
      },

      applyResultStandings: () => {
        const { resultMatchScores } = get()
        const standings = buildGroupResultsFromScores(resultMatchScores)
        set((state) => ({
          results: {
            ...state.results,
            groups: standings,
          },
        }))
      },

      resetResultMatchScores: () => {
        set({ resultMatchScores: defaultResultMatchScores() })
      },

      refreshKnockout: () => {
        const { groups } = get()
        const bestThird = getBestThirdPlaced(groups)
        const thirdQualifiers = bestThird.map((t) => t.teamId).filter(Boolean) as string[]
        const matrix = buildFifaMatrix(groups, thirdQualifiers)
        set({ knockout: matrix })
      },

      getTotalPoints: () => {
        const state = get()
        return (
          calculateMatchScorePoints(state.matchPredictions, state.resultMatchScores) +
          calculateGroupPointsForAll(state.groups, state.results.groups) +
          calculateKnockoutPoints(state.knockout, state.results.knockout) +
          calculateBonusPoints(state.bonuses, state.results.bonuses)
        )
      },

      getGroupPoints: () => {
        const state = get()
        return calculateGroupPointsForAll(state.groups, state.results.groups)
      },

      getMatchPoints: () => {
        const state = get()
        return calculateMatchScorePoints(state.matchPredictions, state.resultMatchScores)
      },

      getKnockoutPoints: () => {
        const state = get()
        return calculateKnockoutPoints(state.knockout, state.results.knockout)
      },

      getBonusPoints: () => {
        const state = get()
        return calculateBonusPoints(state.bonuses, state.results.bonuses)
      },

      resetAll: () =>
        set({
          groups: defaultGroups(),
          matchPredictions: defaultMatchPredictions(),
          knockout: [],
          bonuses: { ...defaultBonuses },
          results: {
            groups: defaultResultsGroups(),
            knockout: [],
            bonuses: { ...defaultBonuses },
          },
          resultMatchScores: defaultResultMatchScores(),
        }),

      syncToMongo: async () => {
        const { participantName, groups, matchPredictions, knockout, bonuses } = get()
        if (!participantName) return

        set({ syncing: true })
        try {
          const all = await fetchParticipants()
          const exists = all.some((p: any) => p.name === participantName)

          if (exists) {
            await updateParticipant({
              name: participantName,
              groups,
              matchPredictions,
              knockout,
              bonuses,
            })
          } else {
            await saveParticipant({
              name: participantName,
              groups,
              matchPredictions,
              knockout,
              bonuses,
            })
          }

          set({ lastSync: new Date().toISOString() })
        } catch (err) {
          console.error("Sync error:", err)
        } finally {
          set({ syncing: false })
        }
      },

      loadFromMongo: async (name) => {
        set({ syncing: true })
        try {
          const all = await fetchParticipants()
          const participant = all.find((p: any) => p.name === name)
          if (participant) {
            const loaded: Partial<QuinielaState> = {
              participantName: participant.name,
              groups: participant.groups,
              knockout: participant.knockout ?? [],
              bonuses: participant.bonuses,
            }
            if (participant.matchPredictions) {
              loaded.matchPredictions = participant.matchPredictions
            }
            set(loaded)
            get().refreshKnockout()
          }
        } catch (err) {
          console.error("Load error:", err)
        } finally {
          set({ syncing: false })
        }
      },

      loadResultsFromMongo: async () => {
        try {
          const data = await fetchResults()
          if (data && data.groups) {
            set({
              results: {
                groups: data.groups,
                knockout: data.knockout ?? [],
                bonuses: data.bonuses,
              },
            })
            if (data.matchScores) {
              set({ resultMatchScores: data.matchScores })
            }
          }
        } catch (err) {
          console.error("Load results error:", err)
        }
      },

      loadAllParticipants: async () => {
        try {
          const all = await fetchParticipants()
          set({ allParticipants: all.map((p: any) => ({ name: p.name })) })
        } catch (err) {
          console.error("Load participants error:", err)
        }
      },

      saveResultsToMongo: async () => {
        const { results, resultMatchScores } = get()
        try {
          await saveResults({
            groups: results.groups,
            knockout: results.knockout,
            bonuses: results.bonuses,
            matchScores: resultMatchScores,
          })
        } catch (err) {
          console.error("Save results error:", err)
        }
      },
    }),
    {
      name: "quiniela-2026",
    }
  )
)

function calculateGroupPointsForAll(
  predictions: GroupPrediction[],
  results: GroupPrediction[]
): number {
  let total = 0
  for (const pred of predictions) {
    const actual = results.find((r) => r.groupId === pred.groupId)
    if (actual) {
      total += calculateGroupPoints(pred, actual)
    }
  }
  return total
}
