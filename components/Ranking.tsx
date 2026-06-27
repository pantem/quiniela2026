"use client"

import { useEffect, useState } from "react"
import { useQuinielaStore } from "@/store/store"
import { fetchRanking, fetchParticipants } from "@/lib/api"
import { Trophy, Medal, AlertCircle, Loader2, Eye } from "lucide-react"
import UserQuinielaModal from "./UserQuinielaModal"

interface ParticipantScore {
  name: string
  matchPoints: number
  groupPoints: number
  knockoutPoints: number
  bonusPoints?: number
  autoBonusPoints?: number
  r32TeamBonusPoints?: number
  r32TeamBonusDetail?: string[]
  penalties?: number
  total: number
}

export default function Ranking() {
  const store = useQuinielaStore()
  const [apiScores, setApiScores] = useState<ParticipantScore[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const localScore: ParticipantScore = {
    name: store.participantName || "Tú",
    matchPoints: store.getMatchPoints(),
    groupPoints: store.getGroupPoints(),
    knockoutPoints: store.getKnockoutPoints(),
    bonusPoints: store.getBonusPoints(),
    autoBonusPoints: store.getAutoBonusPoints(store.participantName),
    r32TeamBonusPoints: store.getR32TeamBonusPoints(store.participantName),
    r32TeamBonusDetail: store.getR32TeamBonusDetail(store.participantName),
    total: store.getTotalPoints(),
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchRanking()
      .then((data) => {
        if (!cancelled) {
          setApiScores(data.ranking ?? [])
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error de conexión")
          setApiScores(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const scores: ParticipantScore[] = apiScores && apiScores.length > 0
    ? apiScores
    : [localScore]

  const [selectedParticipant, setSelectedParticipant] = useState<any>(null)

  const handleViewQuiniela = async (name: string) => {
    try {
      const all = await fetchParticipants()
      const p = all.find((x: any) => x.name === name)
      if (p) setSelectedParticipant(p)
    } catch {}
  }

  if (loading) {
    return (
      <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-12 text-center space-y-4">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-white">Ranking</h2>
        <p className="text-gray-400 text-sm">Cargando participantes...</p>
      </div>
    )
  }

  if (error && !apiScores) {
    return (
      <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Ranking</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          No se pudieron cargar los participantes desde el servidor.
        </p>
        <p className="text-red-400 text-xs mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <>
      <RankingTable scores={scores} onViewQuiniela={handleViewQuiniela} />
      {selectedParticipant && (
        <UserQuinielaModal
          participant={selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
        />
      )}
    </>
  )
}

function RankingTable({ scores, onViewQuiniela }: { scores: ParticipantScore[]; onViewQuiniela?: (name: string) => void }) {
  const sorted = [...scores].sort((a, b) => b.total - a.total)

  const ranks: Array<ParticipantScore & { rank: number }> = []
  for (let i = 0; i < sorted.length; i++) {
    const prev = i > 0 ? sorted[i - 1] : null
    const sameScore = prev && sorted[i].total === prev.total
    const rank = sameScore ? ranks[i - 1].rank : (i > 0 ? ranks[i - 1].rank + 1 : 1)
    ranks.push({ ...sorted[i], rank })
  }

  const getMedal = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-400" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
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
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-12">#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Nombre</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Marcadores</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Grupos</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Fases Finales</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Bonos</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Auto</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-emerald-400 uppercase tracking-wider">16avos</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-red-400 uppercase tracking-wider">Pen.</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                {onViewQuiniela && <th className="w-16 px-2 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {ranks.map((p, i) => (
                <tr key={`${p.name}-${i}`} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center w-8 h-8">
                      {getMedal(p.rank) || <span className="text-sm text-gray-500 font-mono">{p.rank}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-white font-medium">{p.name}</span>
                  </td>
                  <td className="px-3 py-4 text-center text-sm text-gray-300">{p.matchPoints}</td>
                  <td className="px-3 py-4 text-center text-sm text-gray-300">{p.groupPoints}</td>
                  <td className="px-3 py-4 text-center text-sm text-gray-300">{p.knockoutPoints}</td>
                  <td className="px-3 py-4 text-center text-sm text-gray-300">{p.bonusPoints ?? 0}</td>
                  <td className="px-3 py-4 text-center text-sm text-purple-400">{p.autoBonusPoints ?? 0}</td>
                  <td className="px-3 py-4 text-center text-sm text-emerald-400 relative group">
                    {p.r32TeamBonusPoints ?? 0}
                    {(p.r32TeamBonusDetail ?? []).length > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                        <div className="bg-gray-900 text-white text-[10px] rounded-lg px-2 py-1 whitespace-nowrap shadow-lg border border-gray-700">
                          {(p.r32TeamBonusDetail ?? []).join(", ")}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4 text-center text-sm text-red-400">{(p.penalties ?? 0) > 0 ? `-${p.penalties}` : 0}</td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-lg font-bold text-white">{p.total}</span>
                  </td>
                  {onViewQuiniela && (
                    <td className="px-2 py-4 text-center">
                      <button
                        onClick={() => onViewQuiniela(p.name)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 rounded-lg transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        Ver
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
