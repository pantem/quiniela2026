"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  GroupPrediction,
  KnockoutMatch,
  MatchScore,
  ScoringConfig,
  PhaseLocks,
  BonusPrediction,
  AutoBonuses,
  DEFAULT_PHASE_LOCKS,
} from "@/app/types"
import { groups } from "@/utils/teams"
import { getBestThirdPlaced } from "@/utils/bestThird"
import { buildFifaMatrix, propagateWinners } from "@/utils/fifaMatrix"
import { calculateGroupPoints, calculateKnockoutPoints, calculateFifaKnockoutPoints, calculateMatchScorePoints, calculateMatchStats, calculateBonusPoints } from "@/utils/scoring"
import { getAllGroupMatches, getGroupMatches, buildGroupResultsFromScores } from "@/utils/matches"
import { saveParticipant, updateParticipant, fetchParticipants, fetchResults, saveResults } from "@/lib/api"

interface QuinielaState {
  participantName: string
  canEdit: boolean
  phasePermissions: PhaseLocks
  groups: GroupPrediction[]
  matchPredictions: MatchScore[]
  knockout: KnockoutMatch[]
  fifaKnockout: KnockoutMatch[]
  bonuses: BonusPrediction
  phaseLocks: PhaseLocks
  results: {
    groups: GroupPrediction[]
    knockout: KnockoutMatch[]
    fifaKnockout: KnockoutMatch[]
    bonuses: BonusPrediction
    scoringConfig: ScoringConfig | null
    autoBonuses: AutoBonuses
    r32TeamBonus: AutoBonuses
    r32TeamBonusDetail: Record<string, string[]>
  }
  resultMatchScores: MatchScore[]
  allParticipants: Array<{ name: string }>
  syncing: boolean
  lastSync: string | null
  syncError: string | null

  setParticipantName: (name: string) => void
  setCanEdit: (canEdit: boolean) => void
  canEditPhase: (phase: keyof PhaseLocks) => boolean
  setPhasePermission: (phase: keyof PhaseLocks, value: boolean) => void
  setGroupPrediction: (groupId: string, position: "first" | "second" | "third" | "fourth", teamId: string | null) => void
  setMatchScore: (matchId: string, homeScore: number | null, awayScore: number | null) => void
  setKnockoutWinner: (matchId: string, teamId: string | null) => void
  setKnockoutScore: (matchId: string, homeScore: number | null, awayScore: number | null) => void
  setFifaKnockoutScore: (matchId: string, homeScore: number | null, awayScore: number | null) => void
  setAdminFifaKnockoutTeam: (matchId: string, side: 'homeTeam' | 'awayTeam', teamId: string | null) => void
  setAdminFifaKnockoutScore: (matchId: string, homeScore: number | null, awayScore: number | null) => void
  generateFifaKnockout: () => void
  propagateFifaKnockout: () => void
  getFifaKnockoutPoints: () => number
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
  getMatchStats: () => ReturnType<typeof calculateMatchStats>
  resetAll: () => void
  syncToMongo: () => Promise<void>
  initFifaKnockout: () => void
  loadFromMongo: (name: string) => Promise<void>
  loadResultsFromMongo: () => Promise<void>
  loadAllParticipants: () => Promise<void>
  setScoringConfig: (config: ScoringConfig) => void
  setPhaseLock: (phase: keyof PhaseLocks, value: boolean) => void
  calculateAutoBonuses: () => void
  clearAutoBonuses: () => void
  getAutoBonusPoints: (participantName: string) => number
  getR32TeamBonusPoints: (participantName: string) => number
  getR32TeamBonusDetail: (participantName: string) => string[]
  calculateR32TeamBonus: () => Promise<void>
  clearR32TeamBonus: () => void
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

const defaultBonuses: BonusPrediction = {
  bestGoalkeeper: null,
  topScorer: null,
  bestPlayer: null,
}

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

function createEmptyFifaKnockout(): KnockoutMatch[] {
  const matches: KnockoutMatch[] = []
  const roundDefs: Array<{ prefix: string; round: 'r32' | 'r16' | 'qf' | 'sf'; count: number }> = [
    { prefix: 'F_R32', round: 'r32', count: 16 },
    { prefix: 'F_R16', round: 'r16', count: 8 },
    { prefix: 'F_QF', round: 'qf', count: 4 },
    { prefix: 'F_SF', round: 'sf', count: 2 },
  ]
  for (const rd of roundDefs) {
    for (let i = 1; i <= rd.count; i++) {
      const padded = String(i).padStart(2, '0')
      matches.push({
        id: `${rd.prefix}_${padded}`,
        round: rd.round,
        homeTeam: null,
        awayTeam: null,
        homeScore: null,
        awayScore: null,
        winner: null,
        label: `${rd.round.toUpperCase()}-${i}`,
      })
    }
  }
  matches.push({
    id: 'F_3RD_01',
    round: 'third',
    homeTeam: null,
    awayTeam: null,
    homeScore: null,
    awayScore: null,
    winner: null,
    label: '3rd Place',
  })
  matches.push({
    id: 'F_F_01',
    round: 'final',
    homeTeam: null,
    awayTeam: null,
    homeScore: null,
    awayScore: null,
    winner: null,
    label: 'Final',
  })
  return matches
}

export const useQuinielaStore = create<QuinielaState>()(
  persist(
    (set, get) => ({
      participantName: "",
      canEdit: true,
      phasePermissions: { groups: true, r32: true, r16: true, qf: true, sf: true, third: true, final: true, bonuses: true, fifaLocked: true },
      groups: defaultGroups(),
      matchPredictions: defaultMatchPredictions(),
      knockout: [],
      fifaKnockout: [],
      bonuses: { ...defaultBonuses },
      phaseLocks: { ...DEFAULT_PHASE_LOCKS },
      results: {
        groups: defaultResultsGroups(),
        knockout: [],
        fifaKnockout: [],
        bonuses: { ...defaultBonuses },
        scoringConfig: null,
        autoBonuses: {},
        r32TeamBonus: {},
        r32TeamBonusDetail: {},
      },
      resultMatchScores: defaultResultMatchScores(),
      allParticipants: [],
      syncing: false,
      lastSync: null,
      syncError: null,

      setParticipantName: (name) => set({ participantName: name }),
      setCanEdit: (canEdit) => set({ canEdit }),

      canEditPhase: (phase) => {
        try {
          const state = get()
          const perms = state.phasePermissions
          if (!perms) return true
          const setting = perms[phase]
          return setting !== false
        } catch {
          return true
        }
      },

      setPhasePermission: (phase, value) => {
        set((state) => ({
          phasePermissions: { ...state.phasePermissions, [phase]: value },
        }))
      },

      setGroupPrediction: (groupId, position, teamId) => {
        if (!get().canEditPhase('groups')) return
        set((state) => ({
          groups: state.groups.map((g) =>
            g.groupId === groupId ? { ...g, [position]: teamId } : g
          ),
        }))
        get().refreshKnockout()
      },

      setMatchScore: (matchId, homeScore, awayScore) => {
        if (!get().canEditPhase('groups')) return
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
        const round = get().knockout.find((m) => m.id === matchId)?.round ?? ''
        if (!get().canEditPhase(round as keyof PhaseLocks)) return
        set((state) => {
          const updated = state.knockout.map((m) =>
            m.id === matchId ? { ...m, winner: teamId } : m
          )
          return { knockout: propagateWinners(updated) }
        })
      },

      setKnockoutScore: (matchId, homeScore, awayScore) => {
        const round = get().knockout.find((m) => m.id === matchId)?.round ?? ''
        if (!get().canEditPhase(round as keyof PhaseLocks)) return
        set((state) => {
          let winner: string | null = null
          if (homeScore !== null && awayScore !== null && homeScore !== awayScore) {
            const match = state.knockout.find((m) => m.id === matchId)
            if (match) {
              winner = homeScore > awayScore ? match.homeTeam : match.awayTeam
            }
          }
          let updated = state.knockout.map((m) =>
            m.id === matchId ? { ...m, homeScore, awayScore, winner } : m
          )
          if (!updated.some((m) => m.id === "3RD_01")) {
            updated = [...updated, {
              id: "3RD_01",
              round: "third" as const,
              homeTeam: null,
              awayTeam: null,
              homeScore: null,
              awayScore: null,
              winner: null,
              label: "3rd Place",
            }]
          }
          return { knockout: propagateWinners(updated) }
        })
      },

      setFifaKnockoutScore: (matchId, homeScore, awayScore) => {
        if (!get().canEditPhase('fifaLocked')) return
        set((state) => {
          let winner: string | null = null
          const existing = state.fifaKnockout.find((m) => m.id === matchId)
          if (existing) {
            if (homeScore !== null && awayScore !== null && homeScore !== awayScore) {
              winner = homeScore > awayScore ? existing.homeTeam : existing.awayTeam
            }
            const updated = state.fifaKnockout.map((m) =>
              m.id === matchId ? { ...m, homeScore, awayScore, winner } : m
            )
            return { fifaKnockout: propagateWinners(updated) }
          }
          const adminMatch = state.results.fifaKnockout.find((m) => m.id === matchId)
          if (adminMatch && homeScore !== null && awayScore !== null && homeScore !== awayScore) {
            winner = homeScore > awayScore ? adminMatch.homeTeam : adminMatch.awayTeam
          }
          const newEntry: KnockoutMatch = {
            id: matchId,
            round: adminMatch?.round ?? 'r16',
            homeTeam: adminMatch?.homeTeam ?? null,
            awayTeam: adminMatch?.awayTeam ?? null,
            homeScore,
            awayScore,
            winner,
            label: adminMatch?.label ?? '',
          }
          return { fifaKnockout: propagateWinners([...state.fifaKnockout, newEntry]) }
        })
      },

      setAdminFifaKnockoutTeam: (matchId, side, teamId) => {
        set((state) => {
          const match = state.results.fifaKnockout.find((m) => m.id === matchId)
          if (!match) return state
          const updatedMatch = { ...match, [side]: teamId }
          let winner = updatedMatch.winner
          if (updatedMatch.homeScore !== null && updatedMatch.awayScore !== null) {
            winner = updatedMatch.homeScore > updatedMatch.awayScore ? updatedMatch.homeTeam : updatedMatch.awayTeam
            if (updatedMatch.homeScore === updatedMatch.awayScore) winner = null
          }
          const updated = state.results.fifaKnockout.map((m) =>
            m.id === matchId ? { ...updatedMatch, winner } : m
          )
          return {
            results: {
              ...state.results,
              fifaKnockout: propagateWinners(updated),
            },
          }
        })
      },

      setAdminFifaKnockoutScore: (matchId, homeScore, awayScore) => {
        set((state) => {
          const match = state.results.fifaKnockout.find((m) => m.id === matchId)
          let winner: string | null = null
          if (match && homeScore !== null && awayScore !== null && homeScore !== awayScore) {
            winner = homeScore > awayScore ? match.homeTeam : match.awayTeam
          }
          const updated = state.results.fifaKnockout.map((m) =>
            m.id === matchId ? { ...m, homeScore, awayScore, winner } : m
          )
          return {
            results: {
              ...state.results,
              fifaKnockout: propagateWinners(updated),
            },
          }
        })
      },

      generateFifaKnockout: () => {
        set((state) => ({
          results: {
            ...state.results,
            fifaKnockout: createEmptyFifaKnockout(),
          },
        }))
      },

      propagateFifaKnockout: () => {
        set((state) => ({
          results: {
            ...state.results,
            fifaKnockout: propagateWinners(state.results.fifaKnockout),
          },
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

      setBonus: (key, value) => {
        if (!get().canEditPhase('bonuses')) return
        set((state) => ({
          bonuses: { ...state.bonuses, [key]: value },
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
        const fullStandings = buildGroupResultsFromScores(resultMatchScores)
        const withScores = resultMatchScores.filter((m: any) => m.homeScore != null && m.awayScore != null)
        const perGroup = new Map<string, number>()
        for (const m of withScores) {
          perGroup.set(m.groupId, (perGroup.get(m.groupId) ?? 0) + 1)
        }
        const safeStandings = fullStandings.map((s: any) => {
          const total = getGroupMatches(s.groupId).length
          return perGroup.get(s.groupId) === total ? s : { groupId: s.groupId, first: null, second: null, third: null, fourth: null }
        })
        const allComplete = safeStandings.every((g: any) => g.first)
        set((state) => ({
          results: {
            ...state.results,
            groups: safeStandings,
            knockout: allComplete ? state.results.knockout : [],
          },
        }))
        if (!allComplete) {
          set({ syncError: "No todos los grupos tienen sus 6 marcadores completos. Solo se actualizaron los grupos completos." })
        }
      },

      generateResultsKnockout: () => {
        const { resultMatchScores, results } = get()
        const allComplete = results.groups.every((g: any) => g.first && g.second && g.third && g.fourth)
        if (!allComplete) {
          set({ syncError: "Completa todos los marcadores de grupo y aplica posiciones primero" })
          return
        }
        const bestThird = getBestThirdPlaced(results.groups, resultMatchScores)
        const thirdQualifiers = bestThird.map((t) => t.teamId).filter(Boolean) as string[]
        const matrix = buildFifaMatrix(results.groups, thirdQualifiers)
        set((state) => ({
          results: {
            ...state.results,
            knockout: matrix,
          },
        }))
      },

      resetResultMatchScores: () => {
        set({ resultMatchScores: defaultResultMatchScores() })
      },

      refreshKnockout: () => {
        const { groups, matchPredictions, resultMatchScores, knockout: existing } = get()
        const allComplete = Array.isArray(groups) && groups.length > 0 && groups.every((g) => g.first && g.second && g.third && g.fourth)
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
          calculateMatchScorePoints(state.matchPredictions ?? [], state.resultMatchScores ?? []) +
          calculateGroupPointsForAll(state.groups ?? [], state.results.groups ?? []) +
          calculateKnockoutPoints(state.knockout ?? [], state.results.knockout ?? []) +
          calculateFifaKnockoutPoints(state.fifaKnockout ?? [], state.results.fifaKnockout ?? []) +
          calculateBonusPoints(state.bonuses ?? {}, state.results.bonuses ?? {}) +
          (state.results.autoBonuses?.[state.participantName] ?? 0)
        )
      },

      getGroupPoints: () => {
        const state = get()
        return calculateGroupPointsForAll(state.groups ?? [], state.results.groups ?? [])
      },

      getMatchPoints: () => {
        const state = get()
        return calculateMatchScorePoints(state.matchPredictions ?? [], state.resultMatchScores ?? [])
      },

      getKnockoutPoints: () => {
        const state = get()
        return calculateKnockoutPoints(state.knockout ?? [], state.results.knockout ?? [])
      },

      getFifaKnockoutPoints: () => {
        const state = get()
        return calculateFifaKnockoutPoints(state.fifaKnockout ?? [], state.results.fifaKnockout ?? [])
      },

      getBonusPoints: () => {
        const state = get()
        return calculateBonusPoints(state.bonuses, state.results.bonuses)
      },

      getMatchStats: () => {
        const state = get()
        return calculateMatchStats(state.matchPredictions, state.resultMatchScores)
      },

      resetAll: () =>
        set({
          participantName: "",
  canEdit: false,
          phaseLocks: { ...DEFAULT_PHASE_LOCKS },
          groups: defaultGroups(),
          matchPredictions: defaultMatchPredictions(),
          knockout: [],
          fifaKnockout: [],
          bonuses: { ...defaultBonuses },
          results: {
            groups: defaultResultsGroups(),
            knockout: [],
            fifaKnockout: [],
            bonuses: { ...defaultBonuses },
            scoringConfig: null,
            autoBonuses: {},
            r32TeamBonus: {},
            r32TeamBonusDetail: {},
          },
          resultMatchScores: defaultResultMatchScores(),
          allParticipants: [],
          syncing: false,
          lastSync: null,
          syncError: null,
        }),

      syncToMongo: async () => {
        const { participantName, groups, matchPredictions, knockout, fifaKnockout, bonuses } = get()
        if (!participantName) return

        set({ syncing: true })
        try {
          const all = await fetchParticipants()
          const me = all.find((p: any) => p.name === participantName)

          if (me) {
            const updated = await updateParticipant({
              name: participantName,
              groups,
              matchPredictions,
              knockout,
              fifaKnockout,
              bonuses,
            })
            if (updated) {
              if (typeof updated.canEdit === "boolean") {
                set({ canEdit: updated.canEdit })
              }
              if (updated.phasePermissions) {
                set({ phasePermissions: updated.phasePermissions })
              }
            }
          } else {
            await saveParticipant({
              name: participantName,
              groups,
              matchPredictions,
              knockout,
              fifaKnockout,
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

      initFifaKnockout: () => {
        const state = get()
        const adminMatches = state.results.fifaKnockout
        if (adminMatches.length === 0) return
        const merged = adminMatches.map((m) => {
          const userMatch = state.fifaKnockout.find((e) => e.id === m.id)
          if (userMatch) {
            return { ...m, homeScore: userMatch.homeScore, awayScore: userMatch.awayScore, winner: userMatch.winner }
          }
          return { ...m, homeScore: null, awayScore: null, winner: null }
        })
        set({ fifaKnockout: merged })
      },

      loadFromMongo: async (name) => {
        set({ syncing: true })
        try {
          const all = await fetchParticipants()
          const participant = all.find((p: any) => p.name === name)
          if (participant) {
            const loaded: Partial<QuinielaState> = {
              participantName: participant.name,
              groups: participant.groups ?? defaultGroups(),
              bonuses: participant.bonuses,
              canEdit: participant.canEdit ?? false,
              phasePermissions: participant.phasePermissions ?? { groups: true, r32: true, r16: true, qf: true, sf: true, third: true, final: true, bonuses: true, fifaLocked: true },
            }
            if (participant.matchPredictions) {
              loaded.matchPredictions = participant.matchPredictions
            }
            const savedFifaKnockout: KnockoutMatch[] = participant.fifaKnockout ?? []
            if (savedFifaKnockout.length > 0) {
              loaded.fifaKnockout = savedFifaKnockout
            }
            const savedKnockout: KnockoutMatch[] = participant.knockout ?? []
            if (savedKnockout.length > 0) {
              set({ ...loaded, knockout: savedKnockout })
            } else {
              set(loaded)
              get().refreshKnockout()
            }
            get().initFifaKnockout()
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
            fifaKnockout: data.fifaKnockout ?? [],
            bonuses: data.bonuses ?? { ...defaultBonuses },
            scoringConfig: data.scoringConfig ?? null,
            autoBonuses: {},
            r32TeamBonus: data.r32TeamBonus ?? {},
            r32TeamBonusDetail: data.r32TeamBonusDetail ?? {},
          },
          phaseLocks: data.phaseLocks ?? { ...DEFAULT_PHASE_LOCKS },
        })
        if (data.matchScores) {
          set({ resultMatchScores: data.matchScores })
        }
        get().initFifaKnockout()
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

      calculateAutoBonuses: async () => {
        const scores = get().resultMatchScores
        const total = scores.length
        const completed = scores.filter((m) => m.homeScore !== null && m.awayScore !== null).length
        if (completed < total) {
          set({ syncError: `Faltan ${total - completed} marcadores de grupo por ingresar antes de calcular puntos extra` })
          return
        }
        try {
          const token = typeof window !== "undefined" ? localStorage.getItem("quiniela-token") : null
          const res = await fetch("/api/auto-bonuses", {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
          if (!res.ok) throw new Error("Error al calcular bonos automáticos")
          const data = await res.json()
          set((state) => ({
            results: {
              ...state.results,
              autoBonuses: data.autoBonuses ?? {},
            },
            syncError: null,
          }))
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Error al calcular bonos automáticos"
          console.error("AutoBonuses error:", err)
          set({ syncError: msg })
        }
      },

      clearAutoBonuses: () => {
        set((state) => ({
          results: {
            ...state.results,
            autoBonuses: {},
            r32TeamBonus: {},
            r32TeamBonusDetail: {},
          },
        }))
      },

      getAutoBonusPoints: (participantName: string) => {
        return get().results.autoBonuses?.[participantName] ?? 0
      },

      getR32TeamBonusPoints: (participantName: string) => {
        return get().results.r32TeamBonus?.[participantName] ?? 0
      },

      getR32TeamBonusDetail: (participantName: string) => {
        return get().results.r32TeamBonusDetail?.[participantName] ?? []
      },

      calculateR32TeamBonus: async () => {
        try {
          const token = typeof window !== "undefined" ? localStorage.getItem("quiniela-token") : null
          const res = await fetch("/api/r32-team-bonus", {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
          if (!res.ok) throw new Error("Error al calcular bonus de equipos en dieciseisavos")
          const data = await res.json()
          set((state) => ({
            results: {
              ...state.results,
              r32TeamBonus: data.r32TeamBonus ?? {},
              r32TeamBonusDetail: data.r32TeamBonusDetail ?? {},
            },
            syncError: null,
          }))
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Error al calcular bonus de equipos en dieciseisavos"
          console.error("R32TeamBonus error:", err)
          set({ syncError: msg })
        }
      },

      clearR32TeamBonus: () => {
        set((state) => ({
          results: {
            ...state.results,
            r32TeamBonus: {},
            r32TeamBonusDetail: {},
          },
        }))
      },

      saveResultsToMongo: async () => {
        const { results, resultMatchScores, phaseLocks } = get()
        try {
          await saveResults({
            groups: results.groups,
            knockout: results.knockout,
            fifaKnockout: results.fifaKnockout,
            bonuses: results.bonuses,
            matchScores: resultMatchScores,
            scoringConfig: results.scoringConfig ?? undefined,
            phaseLocks,
            autoBonuses: results.autoBonuses,
            r32TeamBonus: results.r32TeamBonus,
            r32TeamBonusDetail: results.r32TeamBonusDetail,
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
      version: 5,
      migrate: (persisted: any, version: number) => {
        const phaseLocksRaw = persisted.phaseLocks ?? (persisted.locked != null
          ? { groups: persisted.locked, r32: persisted.locked, r16: persisted.locked, qf: persisted.locked, sf: persisted.locked, third: persisted.locked, final: persisted.locked }
          : { ...DEFAULT_PHASE_LOCKS })
        const phaseLocks = { ...DEFAULT_PHASE_LOCKS, ...phaseLocksRaw }
        const bonuses = persisted.bonuses ?? persisted.results?.bonuses ?? { ...defaultBonuses }
        return {
          ...persisted,
          phasePermissions: persisted.phasePermissions ?? { groups: true, r32: true, r16: true, qf: true, sf: true, third: true, final: true, bonuses: true, fifaLocked: true },
          fifaKnockout: persisted.fifaKnockout ?? [],
          phaseLocks,
          bonuses,
          matchPredictions: persisted.matchPredictions ?? defaultMatchPredictions(),
          resultMatchScores: persisted.resultMatchScores ?? defaultResultMatchScores(),
          results: {
            ...(persisted.results ?? {}),
            groups: persisted.results?.groups ?? defaultResultsGroups(),
            knockout: (persisted.results?.knockout ?? []).map((m: any) => ({
              ...m,
              homeScore: m.homeScore ?? null,
              awayScore: m.awayScore ?? null,
            })),
            fifaKnockout: (persisted.results?.fifaKnockout ?? []).map((m: any) => ({
              ...m,
              homeScore: m.homeScore ?? null,
              awayScore: m.awayScore ?? null,
            })),
            bonuses: persisted.results?.bonuses ?? { ...defaultBonuses },
            scoringConfig: persisted.results?.scoringConfig ?? null,
            autoBonuses: persisted.results?.autoBonuses ?? {},
            r32TeamBonus: persisted.results?.r32TeamBonus ?? {},
            r32TeamBonusDetail: persisted.results?.r32TeamBonusDetail ?? {},
          },
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
    if (!pred || !pred.groupId) continue
    const actual = results.find((r) => r && r.groupId === pred.groupId)
    if (actual) {
      total += calculateGroupPoints(pred, actual)
    }
  }
  return total
}
