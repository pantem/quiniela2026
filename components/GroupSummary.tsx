"use client"

import { useMemo } from "react"
import { useQuinielaStore } from "@/store/store"
import { groups, getTeamById } from "@/utils/teams"
import { computeStandingsFromMatches } from "@/utils/matches"

export default function GroupSummary() {
  const matchPredictions = useQuinielaStore((s) => s.matchPredictions)

  const summary = useMemo(() => {
    return groups.map((group) => {
      const matches = matchPredictions.filter((m) => m.groupId === group.id)
      const standings = computeStandingsFromMatches(matches)
      const isComplete = standings.length === 4
      return { group, standings, isComplete }
    })
  }, [matchPredictions])

  return (
    <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
        Resumen de Grupos
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {summary.map(({ group, standings, isComplete }) => {
          const ordered = standings.length === 4
            ? standings
            : []
          return (
            <div
              key={group.id}
              className={`text-xs p-2 rounded-lg border ${
                isComplete
                  ? "bg-gray-700/50 border-gray-600/50"
                  : "bg-gray-800/50 border-gray-700/30"
              }`}
            >
              <div className="font-bold text-gray-400 mb-1">Grupo {group.id}</div>
              {ordered.map((s, i) => {
                const team = getTeamById(s.teamId)
                const labels = ["1°", "2°", "3°", "4°"]
                return (
                  <div
                    key={s.teamId}
                    className="flex items-center gap-1 py-0.5 text-gray-200"
                  >
                    <span className="w-4 text-gray-500">{labels[i]}</span>
                    <span>{team ? `${team.flag} ${team.name}` : s.teamId}</span>
                    <span className="ml-auto text-gray-500">{s.points}pts</span>
                  </div>
                )
              })}
              {!isComplete && (
                <div className="text-gray-600 py-0.5">—</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
