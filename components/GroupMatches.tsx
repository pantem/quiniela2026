"use client"

import { useQuinielaStore } from "@/store/store"
import { groups, getTeamById } from "@/utils/teams"
import { getGroupMatches } from "@/utils/matches"
import type { MatchScore } from "@/app/types"
import { Timer } from "lucide-react"

export default function GroupMatches() {
  const { matchPredictions, setMatchScore } = useQuinielaStore()

  const totalPredicted = matchPredictions.filter(
    (m) => m.homeScore !== null && m.awayScore !== null
  ).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Timer className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Marcadores Fase de Grupos</h2>
            <p className="text-sm text-gray-400">
              Predice el marcador exacto de los 72 partidos
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          <span className="text-white font-bold">{totalPredicted}</span>/72 completados
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {groups.map((group) => (
          <GroupMatchCard
            key={group.id}
            groupId={group.id}
            groupName={`Grupo ${group.id}`}
            predictions={matchPredictions.filter((m) => m.groupId === group.id)}
            onSetScore={setMatchScore}
          />
        ))}
      </div>
    </div>
  )
}

function GroupMatchCard({
  groupId,
  groupName,
  predictions,
  onSetScore,
}: {
  groupId: string
  groupName: string
  predictions: MatchScore[]
  onSetScore: (matchId: string, homeScore: number | null, awayScore: number | null) => void
}) {
  const completed = predictions.filter(
    (m) => m.homeScore !== null && m.awayScore !== null
  ).length

  return (
    <div className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{groupName}</h3>
          <span className="text-xs text-gray-400">
            {completed}/6
          </span>
        </div>
      </div>
      <div className="p-3 space-y-2">
        {predictions.map((match) => {
          const home = getTeamById(match.homeTeam)
          const away = getTeamById(match.awayTeam)
          return (
            <div
              key={match.id}
              className="flex items-center gap-2 bg-gray-700/30 rounded-lg p-2"
            >
              <span className="text-sm w-32 truncate text-right text-gray-200">
                {home?.flag} {home?.name}
              </span>
              <ScoreInput
                value={match.homeScore}
                onChange={(v) => onSetScore(match.id, v, match.awayScore)}
              />
              <span className="text-gray-500 text-xs font-bold">-</span>
              <ScoreInput
                value={match.awayScore}
                onChange={(v) => onSetScore(match.id, match.homeScore, v)}
              />
              <span className="text-sm w-32 truncate text-left text-gray-200">
                {away?.flag} {away?.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ScoreInput({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : parseInt(e.target.value))
      }
      className="w-14 text-center bg-gray-700 border border-gray-600 rounded-md text-sm text-white py-1 appearance-none cursor-pointer hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
    >
      <option value="">-</option>
      {Array.from({ length: 16 }, (_, i) => (
        <option key={i} value={i}>
          {i}
        </option>
      ))}
    </select>
  )
}
