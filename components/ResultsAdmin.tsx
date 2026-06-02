"use client"

import { useQuinielaStore } from "@/store/store"
import { groups, getTeamsByGroup, getTeamById } from "@/utils/teams"
import { Shield, Lock } from "lucide-react"
import { useState } from "react"

export default function ResultsAdmin() {
  const {
    results,
    setResultGroup,
    setResultWinner,
    setResultBonus,
    knockout,
  } = useQuinielaStore()
  const [unlocked, setUnlocked] = useState(false)

  if (!unlocked) {
    return (
      <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-12 text-center space-y-4">
        <Lock className="w-12 h-12 text-gray-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Resultados Oficiales</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Zona restringida para administradores. Captura los resultados reales
          del mundial para calcular puntuaciones.
        </p>
        <button
          onClick={() => setUnlocked(true)}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Acceder como Administrador
        </button>
      </div>
    )
  }

  const positions: Array<{ key: "first" | "second" | "third" | "fourth"; label: string }> = [
    { key: "first", label: "1°" },
    { key: "second", label: "2°" },
    { key: "third", label: "3°" },
    { key: "fourth", label: "4°" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-emerald-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Resultados Oficiales</h2>
          <p className="text-sm text-emerald-400">Modo administrador activo</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Grupos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map((group) => {
            const teamList = getTeamsByGroup(group.id)
            return (
              <div
                key={group.id}
                className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden"
              >
                <div className="px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600/50">
                  <h3 className="font-bold text-white">Grupo {group.id}</h3>
                </div>
                <div className="p-3 space-y-2">
                  {positions.map((pos) => {
                    const g = results.groups.find(
                      (r) => r.groupId === group.id
                    )
                    const currentValue = g?.[pos.key]

                    return (
                      <select
                        key={pos.key}
                        value={currentValue ?? ""}
                        onChange={(e) =>
                          setResultGroup(
                            group.id,
                            pos.key,
                            e.target.value || null
                          )
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm"
                      >
                        <option value="">{pos.label}</option>
                        {teamList.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.flag} {t.name}
                          </option>
                        ))}
                      </select>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Bonos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["finalist", "champion", "topScorer"] as const).map((key) => {
            const labels = {
              finalist: "Finalista",
              champion: "Campeón",
              topScorer: "Goleador",
            }
            const allTeams = groups.flatMap((g) => getTeamsByGroup(g.id))
            return (
              <div
                key={key}
                className="bg-gray-800/80 rounded-xl border border-gray-700/50 p-4"
              >
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {labels[key]}
                </label>
                <select
                  value={results.bonuses[key] ?? ""}
                  onChange={(e) =>
                    setResultBonus(key, e.target.value || null)
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm"
                >
                  <option value="">Seleccionar</option>
                  {allTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.flag} {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
