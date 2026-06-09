"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  GroupPrediction,
  KnockoutMatch,
  MatchScore,
  ScoringConfig,
  PhaseLocks,
  DEFAULT_PHASE_LOCKS,
} from "@/app/types"
import { groups } from "@/utils/teams"
import { getBestThirdPlaced } from "@/utils/bestThird"
import { buildFifaMatrix, propagateWinners } from "@/utils/fifaMatrix"
import { calculateGroupPoints, calculateKnockoutPoints, calculateMatchScorePoints, calculateMatchStats } from "@/utils/scoring"
import { getAllGroupMatches, buildGroupResultsFromScores } from "@/utils/matches"
import { saveParticipant, updateParticipant, fetchParticipants, fetchResults, saveResults } from "@/lib/api"

interface QuinielaState {
  participantName: string
  groups: GroupPrediction[]
  matchPredictions: MatchScore[]
  knockout: KnockoutMatch[]
  phaseLocks: PhaseLocks
  results: {
    groups: GroupPrediction[]
    knockout: KnockoutMatch[]
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
  setResultMatchScore: (matchId: string, homeScore: number | null, awayScore: number | null) => void
  setResultGroup: (groupId: string, position: "first" | "second" | "third" | "fourth", teamId: string | null) => void
  setResultKnockoutScore: (matchId: string, homeScore: number | null, awayScore: number | null) => void
  setResultWinner: (matchId: string, teamId: string | null) => void
  applyResultStandings: () => void
  generateResultsKnockout: () => void
  resetResultMatchScores: () => void
  refreshKnockout: () => void
  getTotalPoints: () => number
  getGroupPoints: () => number
  getMatchPoints: () => number
  getKnockoutPoints: () => number
  getMatchStats: () => ReturnType<typeof calculateMatchStats>
  resetAll: () => void
  syncToMongo: () => Promise<void>
  loadFromMongo: (name: string) => Promise<void>
  loadResultsFromMongo: () => Promise<void>
  loadAllParticipants: () => Promise<void>
  setScoringConfig: (config: ScoringConfig) => void
  setPhaseLock: (phase: keyof PhaseLocks, value: boolean) => void
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
      phaseLocks: { ...DEFAULT_PHASE_LOCKS },
      results: {
        groups: defaultResultsGroups(),
        knockout: [],
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
        set((state) => {
          const updatedPredictions = state.matchPredictions.map((m) =>
            m.id === matchId ? { ...m, homeScore, awayScore } : m
          )
          const computedGroups = buildGroupResultsFromScores(updatedPredictions).map((cg) => ({
            groupId: cg.groupId,
            first: cg.first,
            second: cg.second,
            third: cg.third,
            fourth: cg.fourth,
          }))
          return {
            matchPredictions: updatedPredictions,
            groups: computedGroups,
          }
        })
        get().refreshKnockout()
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

      setScoringConfig: (config) => {
        set((state) => ({
          results: {
            ...state.results,
            scoringConfig: config,
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

      setPhaseLock: (phase, value) =>
        set((state) => ({
          phaseLocks: { ...state.phaseLocks, [phase]: value },
        })),

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
        const hasRealScores = resultMatchScores.some((s) => s.homeScore !== null)
        const bestThird = getBestThirdPlaced(groups, hasRealScores ? resultMatchScores : undefined)
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
          calculateKnockoutPoints(state.knockout, state.results.knockout)
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

      getMatchStats: () => {
        const state = get()
        return calculateMatchStats(state.matchPredictions, state.resultMatchScores)
      },

      resetAll: () =>
        set({
          phaseLocks: { ...DEFAULT_PHASE_LOCKS },
          groups: defaultGroups(),
          matchPredictions: defaultMatchPredictions(),
          knockout: [],
          results: {
            groups: defaultResultsGroups(),
            knockout: [],
            scoringConfig: null,
          },
          resultMatchScores: defaultResultMatchScores(),
        }),

      syncToMongo: async () => {
        const { participantName, groups, matchPredictions, knockout } = get()
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
            })
          } else {
            await saveParticipant({
              name: participantName,
              groups,
              matchPredictions,
              knockout,
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
            scoringConfig: data.scoringConfig ?? null,
          },
          phaseLocks: data.phaseLocks ?? { ...DEFAULT_PHASE_LOCKS },
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
        const { results, resultMatchScores, phaseLocks } = get()
        try {
          await saveResults({
            groups: results.groups,
            knockout: results.knockout,
            matchScores: resultMatchScores,
            scoringConfig: results.scoringConfig ?? undefined,
            phaseLocks,
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
      version: 3,
      migrate: (persisted: any, version: number) => {
        const phaseLocks = persisted.phaseLocks ?? (persisted.locked != null
          ? { groups: persisted.locked, r32: persisted.locked, r16: persisted.locked, qf: persisted.locked, sf: persisted.locked, final: persisted.locked }
          : { ...DEFAULT_PHASE_LOCKS })
        return {
          phaseLocks,
          matchPredictions: persisted.matchPredictions ?? defaultMatchPredictions(),
          resultMatchScores: persisted.resultMatchScores ?? defaultResultMatchScores(),
          results: {
            groups: persisted.results?.groups ?? defaultResultsGroups(),
            knockout: (persisted.results?.knockout ?? []).map((m: any) => ({
              ...m,
              homeScore: m.homeScore ?? null,
              awayScore: m.awayScore ?? null,
            })),
            scoringConfig: persisted.results?.scoringConfig ?? null,
          },
          ...persisted,
        }
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
