"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  GroupPrediction,
  KnockoutMatch,
  ResultOfficial,
  BonusPrediction,
} from "@/app/types"
import { groups } from "@/utils/teams"
import { getBestThirdPlaced } from "@/utils/bestThird"
import { buildFifaMatrix } from "@/utils/fifaMatrix"
import { calculateGroupPoints, calculateKnockoutPoints, calculateBonusPoints } from "@/utils/scoring"

interface QuinielaState {
  participantName: string
  groups: GroupPrediction[]
  knockout: KnockoutMatch[]
  bonuses: BonusPrediction
  results: {
    groups: GroupPrediction[]
    knockout: KnockoutMatch[]
    bonuses: BonusPrediction
  }
  setParticipantName: (name: string) => void
  setGroupPrediction: (groupId: string, position: "first" | "second" | "third" | "fourth", teamId: string | null) => void
  setKnockoutWinner: (matchId: string, teamId: string | null) => void
  setBonus: (key: keyof BonusPrediction, value: string | null) => void
  setResultGroup: (groupId: string, position: "first" | "second" | "third" | "fourth", teamId: string | null) => void
  setResultWinner: (matchId: string, teamId: string | null) => void
  setResultBonus: (key: keyof BonusPrediction, value: string | null) => void
  refreshKnockout: () => void
  getTotalPoints: () => number
  getGroupPoints: () => number
  getKnockoutPoints: () => number
  getBonusPoints: () => number
  resetAll: () => void
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
      knockout: [],
      bonuses: { ...defaultBonuses },
      results: {
        groups: defaultResultsGroups(),
        knockout: [],
        bonuses: { ...defaultBonuses },
      },

      setParticipantName: (name) => set({ participantName: name }),

      setGroupPrediction: (groupId, position, teamId) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.groupId === groupId ? { ...g, [position]: teamId } : g
          ),
        }))
        get().refreshKnockout()
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
          calculateGroupPointsForAll(state.groups, state.results.groups) +
          calculateKnockoutPoints(state.knockout, state.results.knockout) +
          calculateBonusPoints(state.bonuses, state.results.bonuses)
        )
      },

      getGroupPoints: () => {
        const state = get()
        return calculateGroupPointsForAll(state.groups, state.results.groups)
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
          knockout: [],
          bonuses: { ...defaultBonuses },
          results: {
            groups: defaultResultsGroups(),
            knockout: [],
            bonuses: { ...defaultBonuses },
          },
        }),
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
