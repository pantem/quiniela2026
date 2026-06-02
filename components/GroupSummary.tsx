"use client"

import { useQuinielaStore } from "@/store/store"
import { groups, getTeamById } from "@/utils/teams"

export default function GroupSummary() {
  const { groups: predictions } = useQuinielaStore()

  const positions: Array<{ key: "first" | "second" | "third" | "fourth"; label: string }> = [
    { key: "first", label: "1°" },
    { key: "second", label: "2°" },
    { key: "third", label: "3°" },
    { key: "fourth", label: "4°" },
  ]

  return (
    <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
        Resumen de Grupos
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {groups.map((group) => {
          const g = predictions.find((p) => p.groupId === group.id)
          const isComplete = g?.first && g?.second && g?.third && g?.fourth
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
              {positions.map((pos) => {
                const team = getTeamById(g?.[pos.key] ?? null)
                return (
                  <div
                    key={pos.key}
                    className={`flex items-center gap-1 py-0.5 ${
                      team ? "text-gray-200" : "text-gray-600"
                    }`}
                  >
                    <span className="w-4 text-gray-500">{pos.label}</span>
                    <span>{team ? `${team.flag} ${team.name}` : "—"}</span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
