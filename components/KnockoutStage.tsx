"use client"

import { useQuinielaStore } from "@/store/store"
import { getTeamById } from "@/utils/teams"
import { getMatchesByRound } from "@/utils/fifaMatrix"
import { KnockoutMatch } from "@/app/types"
import { Trophy, ArrowRight } from "lucide-react"

interface Props {
  round: "r32" | "r16" | "qf" | "sf" | "final"
  title: string
  subtitle: string
  icon?: React.ReactNode
}

export default function KnockoutStage({ round, title, subtitle, icon }: Props) {
  const { knockout, setKnockoutWinner } = useQuinielaStore()

  const matches = getMatchesByRound(knockout, round)

  if (matches.length === 0) {
    return (
      <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-8 text-center">
        <p className="text-gray-500">
          Completa la fase de grupos para generar los cruces.
        </p>
      </div>
    )
  }

  const allHaveTeams = matches.every(
    (m) => m.homeTeam && m.awayTeam
  )

  if (!allHaveTeams) {
    return (
      <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-8 text-center">
        <p className="text-gray-500">
          Definiendo cruces según mejores terceros...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onSelectWinner={setKnockoutWinner}
          />
        ))}
      </div>
    </div>
  )
}

function MatchCard({
  match,
  onSelectWinner,
}: {
  match: KnockoutMatch
  onSelectWinner: (matchId: string, teamId: string | null) => void
}) {
  const home = getTeamById(match.homeTeam)
  const away = getTeamById(match.awayTeam)

  return (
    <div className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
      <div className="px-4 py-2 bg-gray-700/50 border-b border-gray-600/50">
        <span className="text-xs font-medium text-gray-400">{match.label}</span>
      </div>

      <div className="p-3 space-y-2">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
            match.winner === match.homeTeam
              ? "bg-purple-900/30 border-purple-500/50 text-white"
              : "bg-gray-700/30 border-gray-600/30 text-gray-300 hover:border-gray-500"
          }`}
          onClick={() =>
            onSelectWinner(
              match.id,
              match.winner === match.homeTeam ? null : match.homeTeam
            )
          }
        >
          <span className="text-lg">{home?.flag}</span>
          <span className="flex-1 text-sm font-medium">{home?.name}</span>
          {match.winner === match.homeTeam && (
            <span className="text-xs text-purple-400 font-bold">GANADOR</span>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <span>VS</span>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
            match.winner === match.awayTeam
              ? "bg-purple-900/30 border-purple-500/50 text-white"
              : "bg-gray-700/30 border-gray-600/30 text-gray-300 hover:border-gray-500"
          }`}
          onClick={() =>
            onSelectWinner(
              match.id,
              match.winner === match.awayTeam ? null : match.awayTeam
            )
          }
        >
          <span className="text-lg">{away?.flag}</span>
          <span className="flex-1 text-sm font-medium">{away?.name}</span>
          {match.winner === match.awayTeam && (
            <span className="text-xs text-purple-400 font-bold">GANADOR</span>
          )}
        </div>
      </div>
    </div>
  )
}
