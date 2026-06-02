"use client"

import { useMemo } from "react"
import { useQuinielaStore } from "@/store/store"
import { groups, getTeamsByGroup, getTeamById } from "@/utils/teams"
import { computeStandingsFromMatches, MatchScore } from "@/utils/matches"
import { Table2 } from "lucide-react"

export default function GroupStage() {
  const matchPredictions = useQuinielaStore((s) => s.matchPredictions)

  const groupTables = useMemo(() => {
    return groups.map((group) => {
      const matches = matchPredictions.filter((m) => m.groupId === group.id)
      const standings = computeStandingsFromMatches(matches)
      return { group, matches, standings }
    })
  }, [matchPredictions])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Table2 className="w-6 h-6 text-purple-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Fase de Grupos</h2>
          <p className="text-sm text-gray-400">
            Posiciones generadas automáticamente desde tus marcadores
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groupTables.map(({ group, matches, standings }) => (
          <div
            key={group.id}
            className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden"
          >
            <div className="px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600/50">
              <h3 className="text-lg font-bold text-white">Grupo {group.id}</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 uppercase">#</th>
                    <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 uppercase">Equipo</th>
                    <th className="text-center px-2 py-2 text-[10px] font-medium text-gray-500 uppercase" title="Partidos Jugados">PJ</th>
                    <th className="text-center px-2 py-2 text-[10px] font-medium text-emerald-500 uppercase" title="Ganados">G</th>
                    <th className="text-center px-2 py-2 text-[10px] font-medium text-amber-500 uppercase" title="Empatados">E</th>
                    <th className="text-center px-2 py-2 text-[10px] font-medium text-red-500 uppercase" title="Perdidos">P</th>
                    <th className="text-center px-2 py-2 text-[10px] font-medium text-gray-500 uppercase" title="Goles a Favor">GF</th>
                    <th className="text-center px-2 py-2 text-[10px] font-medium text-gray-500 uppercase" title="Goles en Contra">GA</th>
                    <th className="text-center px-2 py-2 text-[10px] font-medium text-gray-500 uppercase" title="Diferencia de Goles">DG</th>
                    <th className="text-right px-3 py-2 text-[10px] font-medium text-gray-500 uppercase" title="Puntos">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {standings.map((s, i) => {
                    const team = getTeamById(s.teamId)
                    return (
                      <tr
                        key={s.teamId}
                        className={`transition-colors ${
                          team?.groupId === group.id
                            ? "hover:bg-gray-700/30"
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
                  })}
                  {standings.length === 0 &&
                    getTeamsByGroup(group.id).map((team, i) => (
                      <tr key={team.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-3 py-2.5 text-gray-500 font-mono">{i + 1}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-gray-400 flex items-center gap-1.5">
                            <span>{team.flag}</span>
                            <span className="truncate">{team.name}</span>
                          </span>
                        </td>
                        <td colSpan={7} className="px-2 py-2.5 text-center text-gray-600">Sin marcadores</td>
                        <td className="px-3 py-2.5 text-right text-gray-600 font-mono">0</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
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
