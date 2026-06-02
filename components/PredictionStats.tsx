"use client"

import { useEffect, useState } from "react"
import { useQuinielaStore } from "@/store/store"
import { fetchRanking } from "@/lib/api"
import { MatchPredictionStats } from "@/utils/scoring"
import { BarChart3, Loader2, TrendingUp } from "lucide-react"

interface ParticipantRow {
  name: string
  stats: MatchPredictionStats
  total: number
}

export default function PredictionStats() {
  const store = useQuinielaStore()
  const [apiData, setApiData] = useState<ParticipantRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const localStats = store.getMatchStats()
  const hasLocalResults = store.resultMatchScores?.some((m) => m.homeScore !== null)

  const localRow: ParticipantRow = {
    name: store.participantName || "Tú",
    stats: localStats,
    total: localStats.points,
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchRanking()
      .then((data) => {
        if (!cancelled) {
          const rows: ParticipantRow[] = (data.ranking ?? []).map((p: any) => ({
            name: p.name,
            stats: p.matchStats ?? { played: 0, exact: 0, trend: 0, wrong: 0, goalDiff: 0, points: 0 },
            total: p.matchPoints ?? 0,
          }))
          setApiData(rows)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error de conexión")
          setApiData(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const rows: ParticipantRow[] = apiData && apiData.length > 0
    ? apiData
    : hasLocalResults ? [localRow] : []

  const hasData = rows.some((r) => r.stats.played > 0)

  if (loading) {
    return (
      <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-12 text-center space-y-4">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-white">Estadísticas</h2>
        <p className="text-gray-400 text-sm">Cargando estadísticas...</p>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-12 text-center">
        <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Estadísticas de Pronósticos</h2>
        {error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : (
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Las estadísticas aparecerán cuando se capturen los resultados oficiales y los participantes tengan pronósticos.
          </p>
        )}
      </div>
    )
  }

  const sorted = [...rows].sort((a, b) => {
    if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points
    if (b.stats.exact !== a.stats.exact) return b.stats.exact - a.stats.exact
    return a.stats.wrong - b.stats.wrong
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-amber-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Estadísticas de Pronósticos</h2>
          <p className="text-sm text-gray-400">
            Rendimiento de cada participante en los marcadores de la fase de grupos
          </p>
        </div>
      </div>

      <div className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Participante</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider" title="Partidos Jugados">PJ</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-emerald-400 uppercase tracking-wider" title="Aciertos exactos (marcador correcto)">G</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-amber-400 uppercase tracking-wider" title="Aciertos de tendencia (ganador/empate correcto)">E</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-red-400 uppercase tracking-wider" title="Pronósticos incorrectos">P</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider" title="Diferencia de goles acumulada">DG</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {sorted.map((row, i) => (
                <tr key={row.name} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-500 font-mono">{i + 1}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-white font-medium">{row.name}</span>
                  </td>
                  <td className="px-3 py-4 text-center text-sm text-gray-300 font-mono">{row.stats.played}</td>
                  <td className="px-3 py-4 text-center text-sm text-emerald-400 font-mono">{row.stats.exact}</td>
                  <td className="px-3 py-4 text-center text-sm text-amber-400 font-mono">{row.stats.trend}</td>
                  <td className="px-3 py-4 text-center text-sm text-red-400 font-mono">{row.stats.wrong}</td>
                  <td className="px-3 py-4 text-center text-sm font-mono">
                    <span className={row.stats.goalDiff >= 0 ? "text-gray-300" : "text-red-400"}>
                      {row.stats.goalDiff > 0 ? "+" : ""}{row.stats.goalDiff}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-lg font-bold text-white">{row.stats.points}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
          <span>G = Marcador exacto</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50" />
          <span>E = Tendencia acertada (ganador o empate)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50" />
          <span>P = Pronóstico incorrecto</span>
        </div>
      </div>
    </div>
  )
}
