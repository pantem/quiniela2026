"use client"

import { useQuinielaStore } from "@/store/store"
import { Trophy, Medal, TrendingUp } from "lucide-react"

interface ParticipantScore {
  name: string
  matchPoints: number
  groupPoints: number
  knockoutPoints: number
  bonusPoints: number
  total: number
}

export default function Ranking() {
  const {
    participantName,
    getMatchPoints,
    getGroupPoints,
    getKnockoutPoints,
    getBonusPoints,
    getTotalPoints,
  } = useQuinielaStore()

  const hasResults =
    getTotalPoints() > 0 || getGroupPoints() > 0

  const scores: ParticipantScore[] = [
    {
      name: participantName || "Tú",
      matchPoints: getMatchPoints(),
      groupPoints: getGroupPoints(),
      knockoutPoints: getKnockoutPoints(),
      bonusPoints: getBonusPoints(),
      total: getTotalPoints(),
    },
  ]

  if (!hasResults) {
    return (
      <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-12 text-center">
        <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Ranking</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Los puntajes aparecerán aquí cuando se capturen los resultados
          oficiales.
        </p>
      </div>
    )
  }

  const sorted = [...scores].sort((a, b) => b.total - a.total)

  const getMedal = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-amber-400" />
    if (index === 1) return <Medal className="w-5 h-5 text-gray-300" />
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-6 h-6 text-amber-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Ranking</h2>
          <p className="text-sm text-gray-400">
            Clasificación general de participantes
          </p>
        </div>
      </div>

      <div className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-12">
                  #
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Marcadores
                </th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Grupos
                </th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Eliminatoria
                </th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Bonos
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {sorted.map((p, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center w-8 h-8">
                      {getMedal(i) || (
                        <span className="text-sm text-gray-500 font-mono">
                          {i + 1}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-white font-medium">{p.name}</span>
                  </td>
                  <td className="px-3 py-4 text-center text-sm text-gray-300">
                    {p.matchPoints}
                  </td>
                  <td className="px-3 py-4 text-center text-sm text-gray-300">
                    {p.groupPoints}
                  </td>
                  <td className="px-3 py-4 text-center text-sm text-gray-300">
                    {p.knockoutPoints}
                  </td>
                  <td className="px-3 py-4 text-center text-sm text-gray-300">
                    {p.bonusPoints}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-lg font-bold text-white">
                      {p.total}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
