"use client"

import { useMemo } from "react"
import { useQuinielaStore } from "@/store/store"
import { groups, getTeamById } from "@/utils/teams"
import { computeStandingsFromMatches, MatchScore } from "@/utils/matches"
import { BarChart3, TrendingUp } from "lucide-react"

export default function PredictionStats() {
  const matchPredictions = useQuinielaStore((s) => s.matchPredictions)

  const groupTables = useMemo(() => {
    return groups.map((group) => {
      const matches = matchPredictions.filter((m) => m.groupId === group.id)
      const standings = computeStandingsFromMatches(matches)
      return { group, matches, standings }
    })
  }, [matchPredictions])

  const hasData = groupTables.some(
    (gt) => gt.standings.length > 0
  )

  if (!hasData) {
    return (
      <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-12 text-center">
        <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          Tabla de Posiciones Pronosticada
        </h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Ingresa marcadores en la sección &quot;Marcadores&quot; para ver cómo quedarían
          las tablas de grupos según tus pronósticos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-amber-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">
            Tabla de Posiciones Pronosticada
          </h2>
          <p className="text-sm text-gray-400">
            Clasificación de cada grupo generada con tus marcadores ingresados
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groupTables.map(({ group, matches, standings }) => (
          <div
            key={group.id}
            className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden"
          >
            <div className="px-4 py-3 bg-gray-700/40 border-b border-gray-700/50">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {group.name}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 uppercase">#</th>
                    <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 uppercase">Equipo</th>
                    <th className="text-center px-2 py-2 text-[10px] font-medium text-gray-500 uppercase" title="Partidos Jugados">PJ</th>
                    <th className="text-center px-2 py-2 text-[10px] font-medium text-gray-500 uppercase" title="Ganados">G</th>
                    <th className="text-center px-2 py-2 text-[10px] font-medium text-gray-500 uppercase" title="Empatados">E</th>
                    <th className="text-center px-2 py-2 text-[10px] font-medium text-gray-500 uppercase" title="Perdidos">P</th>
                    <th className="text-center px-2 py-2 text-[10px] font-medium text-gray-500 uppercase" title="Goles a Favor">GF</th>
                    <th className="text-center px-2 py-2 text-[10px] font-medium text-gray-500 uppercase" title="Goles en Contra">GA</th>
                    <th className="text-center px-2 py-2 text-[10px] font-medium text-gray-500 uppercase" title="Diferencia de Goles">DG</th>
                    <th className="text-right px-3 py-2 text-[10px] font-medium text-gray-500 uppercase" title="Puntos">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {standings.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-3 py-6 text-center text-gray-500">
                        Sin marcadores ingresados
                      </td>
                    </tr>
                  ) : (
                    standings.map((s, i) => {
                      const team = getTeamById(s.teamId)
                      const isQualified = i < 2
                      const isThird = i === 2
                      return (
                        <tr
                          key={s.teamId}
                          className={`transition-colors ${
                            isQualified
                              ? "bg-emerald-900/10 hover:bg-emerald-900/20"
                              : isThird
                              ? "bg-amber-900/10 hover:bg-amber-900/20"
                              : "hover:bg-gray-700/30"
                          }`}
                        >
                          <td className="px-3 py-2.5 text-gray-400 font-mono">{i + 1}</td>
                          <td className="px-3 py-2.5">
                            <span className="text-white font-medium flex items-center gap-1.5">
                              <span>{team?.flag}</span>
                              <span className="truncate">{team?.name ?? s.teamId}</span>
                            </span>
                          </td>
                          <td className="px-2 py-2.5 text-center text-gray-300 font-mono">3</td>
                          <td className="px-2 py-2.5 text-center text-emerald-400 font-mono">
                            {countWins(s.teamId, matches)}
                          </td>
                          <td className="px-2 py-2.5 text-center text-amber-400 font-mono">
                            {countDraws(s.teamId, matches)}
                          </td>
                          <td className="px-2 py-2.5 text-center text-red-400 font-mono">
                            {countLosses(s.teamId, matches)}
                          </td>
                          <td className="px-2 py-2.5 text-center text-gray-300 font-mono">{s.gf}</td>
                          <td className="px-2 py-2.5 text-center text-gray-300 font-mono">{s.ga}</td>
                          <td className="px-2 py-2.5 text-center font-mono">
                            <span className={s.gd > 0 ? "text-emerald-400" : s.gd < 0 ? "text-red-400" : "text-gray-400"}>
                              {s.gd > 0 ? "+" : ""}{s.gd}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-white">{s.points}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
          <span>Clasificación directa a R32 (1° y 2°)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" />
          <span>Posible clasificación como mejor 3°</span>
        </div>
      </div>
    </div>
  )
}

function countWins(teamId: string, matches: MatchScore[]): number {
  let w = 0
  for (const m of matches) {
    if (m.homeScore === null || m.awayScore === null) continue
    if (m.homeTeam === teamId && m.homeScore > m.awayScore) w++
    if (m.awayTeam === teamId && m.awayScore > m.homeScore) w++
  }
  return w
}

function countDraws(teamId: string, matches: MatchScore[]): number {
  let d = 0
  for (const m of matches) {
    if (m.homeScore === null || m.awayScore === null) continue
    if ((m.homeTeam === teamId || m.awayTeam === teamId) && m.homeScore === m.awayScore) d++
  }
  return d
}

function countLosses(teamId: string, matches: MatchScore[]): number {
  let l = 0
  for (const m of matches) {
    if (m.homeScore === null || m.awayScore === null) continue
    if (m.homeTeam === teamId && m.homeScore < m.awayScore) l++
    if (m.awayTeam === teamId && m.awayScore < m.homeScore) l++
  }
  return l
}
