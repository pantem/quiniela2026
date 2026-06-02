"use client"

import { useQuinielaStore } from "@/store/store"
import { groups, getTeamsByGroup, getTeamById } from "@/utils/teams"
import { ChevronDown } from "lucide-react"

export default function GroupStage() {
  const { groups: predictions, setGroupPrediction, locked } = useQuinielaStore()

  const getSelectedTeams = (groupId: string) => {
    const g = predictions.find((p) => p.groupId === groupId)
    if (!g) return []
    return [g.first, g.second, g.third, g.fourth].filter(Boolean)
  }

  const isTeamSelected = (groupId: string, teamId: string, currentPosition: string) => {
    const g = predictions.find((p) => p.groupId === groupId)
    if (!g) return false
    return Object.entries(g)
      .filter(([key]) => key !== currentPosition && key !== "groupId")
      .some(([, val]) => val === teamId)
  }

  const positions: Array<{ key: "first" | "second" | "third" | "fourth"; label: string }> = [
    { key: "first", label: "1°" },
    { key: "second", label: "2°" },
    { key: "third", label: "3°" },
    { key: "fourth", label: "4°" },
  ]

  const groupErrors = (groupId: string): string[] => {
    const g = predictions.find((p) => p.groupId === groupId)
    if (!g) return []
    const errors: string[] = []
    const selected = [g.first, g.second, g.third, g.fourth]
    const filled = selected.filter(Boolean)
    
    if (filled.length > 0 && filled.length < 4) {
      errors.push("Completa todas las posiciones")
    }
    
    if (filled.length === 4) {
      const unique = new Set(filled)
      if (unique.size < 4) {
        errors.push("Equipos repetidos")
      }
    }

    return errors
  }

  const totalErrors = predictions.reduce(
    (sum, g) => sum + groupErrors(g.groupId).length,
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Fase de Grupos</h2>
          <p className="text-sm text-gray-400 mt-1">
            Selecciona la posición de cada equipo en los 12 grupos
          </p>
        </div>
        {totalErrors > 0 && (
          <div className="px-3 py-1 bg-amber-900/50 text-amber-300 text-sm rounded-full border border-amber-700/50">
            {totalErrors} pendiente{totalErrors !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groups.map((group) => {
          const teamList = getTeamsByGroup(group.id)
          const g = predictions.find((p) => p.groupId === group.id)
          const errors = groupErrors(group.id)

          return (
            <div
              key={group.id}
              className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden"
            >
              <div className="px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">
                    Grupo {group.id}
                  </h3>
                  {errors.length > 0 && (
                    <span className="text-xs text-amber-400">
                      {errors[0]}
                    </span>
                  )}
                  {g?.first && g.second && g.third && g.fourth && errors.length === 0 && (
                    <span className="text-xs text-emerald-400">✓ Completo</span>
                  )}
                </div>
              </div>

              <div className="p-3 space-y-2">
                {positions.map((pos) => {
                  const currentValue = g?.[pos.key] ?? null
                  const team = getTeamById(currentValue)

                  return (
                    <div key={pos.key} className="relative">
                      <select
                        value={currentValue ?? ""}
                        disabled={locked}
                        onChange={(e) =>
                          setGroupPrediction(
                            group.id,
                            pos.key,
                            e.target.value || null
                          )
                        }
                        className={`w-full appearance-none px-3 py-2.5 rounded-lg border text-sm transition-colors
                          ${locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                          ${
                            currentValue
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-gray-750 border-gray-600/50 text-gray-500"
                          }
                          hover:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500
                        `}
                      >
                        <option value="">{pos.label} — Seleccionar</option>
                        {teamList.map((team) => {
                          const selected = isTeamSelected(
                            group.id,
                            team.id,
                            pos.key
                          )
                          return (
                            <option
                              key={team.id}
                              value={team.id}
                              disabled={selected && currentValue !== team.id}
                              className={selected ? "text-gray-500" : ""}
                            >
                              {team.flag} {team.name}
                              {selected ? " (usado)" : ""}
                            </option>
                          )
                        })}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
