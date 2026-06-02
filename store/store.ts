"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  GroupPrediction,
  KnockoutMatch,
  BonusPrediction,
  MatchScore,
  ScoringConfig,
} from "@/app/types"
import { groups } from "@/utils/teams"
import { getBestThirdPlaced } from "@/utils/bestThird"
import { buildFifaMatrix, propagateWinners } from "@/utils/fifaMatrix"
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
    scoringConfig: ScoringConfig | null
  }
  resultMatchScores: MatchScore[]
  allParticipants: Array<{ name: string }>
  syncing: boolean
  lastSync: string | null
  syncError: string | null

  setParticipantName: (name: string) => void
  setGroupPrediction: (groupId: string, position: "first" | "second" | "third" | "fourth", teamId: string | null) => void
  setMatchScore: (matchId: string, homeScore: number | null, awayScore: number | null) => void
  setKnockoutWinner: (matchId: string, teamId: string | null) => void
  setKnockoutScore: (matchId: string, homeScore: number | null, awayScore: number | null) => void
  setBonus: (key: keyof BonusPrediction, value: string | null) => void
  setResultMatchScore: (matchId: string, homeScore: number | null, awayScore: number | null) => void
  setResultGroup: (groupId: string, position: "first" | "second" | "third" | "fourth", teamId: string | null) => void
  setResultKnockoutScore: (matchId: string, homeScore: number | null, awayScore: number | null) => void
  setResultWinner: (matchId: string, teamId: string | null) => void
  setResultBonus: (key: keyof BonusPrediction, value: string | null) => void
  applyResultStandings: () => void
  generateResultsKnockout: () => void
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
  setScoringConfig: (config: ScoringConfig) => void
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
        scoringConfig: null,
      },
      resultMatchScores: defaultResultMatchScores(),
      allParticipants: [],
      syncing: false,
      lastSync: null,
      syncError: null,

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
        set((state) => {
          const updated = state.knockout.map((m) =>
            m.id === matchId ? { ...m, winner: teamId } : m
          )
          return { knockout: propagateWinners(updated) }
        })
      },

      setKnockoutScore: (matchId, homeScore, awayScore) => {
        set((state) => ({
          knockout: state.knockout.map((m) =>
            m.id === matchId ? { ...m, homeScore, awayScore } : m
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

      setResultKnockoutScore: (matchId, homeScore, awayScore) => {
        set((state) => ({
          results: {
            ...state.results,
            knockout: state.results.knockout.map((m) =>
              m.id === matchId ? { ...m, homeScore, awayScore } : m
            ),
          },
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

      setScoringConfig: (config) => {
        set((state) => ({
          results: {
            ...state.results,
            scoringConfig: config,
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

      generateResultsKnockout: () => {
        const { resultMatchScores, results } = get()
        const groups = results.groups.some((g) => g.first)
          ? results.groups
          : buildGroupResultsFromScores(resultMatchScores)
        const bestThird = getBestThirdPlaced(groups, resultMatchScores)
        const thirdQualifiers = bestThird.map((t) => t.teamId).filter(Boolean) as string[]
        const matrix = buildFifaMatrix(groups, thirdQualifiers)
        set((state) => ({
          results: {
            ...state.results,
            groups,
            knockout: matrix,
          },
        }))
      },

      resetResultMatchScores: () => {
        set({ resultMatchScores: defaultResultMatchScores() })
      },

      refreshKnockout: () => {
        const { groups, matchPredictions, resultMatchScores, knockout: existing } = get()
        const allComplete = groups.every((g) => g.first && g.second && g.third && g.fourth)
        if (!allComplete) {
          set({ knockout: [] })
          return
        }
        const scoresForThird = resultMatchScores.some((s) => s.homeScore !== null)
          ? resultMatchScores
          : matchPredictions
        const bestThird = getBestThirdPlaced(groups, scoresForThird)
        const thirdQualifiers = bestThird.map((t) => t.teamId).filter(Boolean) as string[]
        const matrix = buildFifaMatrix(groups, thirdQualifiers)
        const merged = matrix.map((m) => {
          const old = existing.find((e) => e.id === m.id)
          if (!old) return m
          if (m.round === 'r32') {
            return { ...m, winner: old.winner ?? m.winner }
          }
          return { ...m, ...old }
        })
        set({ knockout: propagateWinners(merged) })
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
            scoringConfig: null,
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

          set({ lastSync: new Date().toISOString(), syncError: null })
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Error de conexión con MongoDB"
          console.error("Sync error:", err)
          set({ syncError: msg })
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
              bonuses: participant.bonuses,
            }
            if (participant.matchPredictions) {
              loaded.matchPredictions = participant.matchPredictions
            }
            const savedKnockout: KnockoutMatch[] = participant.knockout ?? []
            if (savedKnockout.length > 0) {
              set({ ...loaded, knockout: savedKnockout })
            } else {
              set(loaded)
              get().refreshKnockout()
            }
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
                scoringConfig: data.scoringConfig ?? null,
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
            scoringConfig: results.scoringConfig ?? undefined,
          })
          set({ syncError: null })
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Error al guardar resultados"
          console.error("Save results error:", err)
          set({ syncError: msg })
        }
      },
    }),
    {
      name: "quiniela-2026",
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (version === 0 || version === 1) {
          return {
            ...persisted,
            matchPredictions: persisted.matchPredictions ?? defaultMatchPredictions(),
            resultMatchScores: persisted.resultMatchScores ?? defaultResultMatchScores(),
            results: {
              groups: persisted.results?.groups ?? defaultResultsGroups(),
              knockout: (persisted.results?.knockout ?? []).map((m: any) => ({
                ...m,
                homeScore: m.homeScore ?? null,
                awayScore: m.awayScore ?? null,
              })),
              bonuses: persisted.results?.bonuses ?? { ...defaultBonuses },
            },
          }
        }
        return persisted
      },
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
