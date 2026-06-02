"use client"

import { useQuinielaStore } from "@/store/store"
import { teams, getTeamById } from "@/utils/teams"
import { Star } from "lucide-react"

export default function BonusSelector() {
  const { bonuses, setBonus, knockout } = useQuinielaStore()

  const eligibleTeams = teams
    .filter((t) => knockout.some((m) => m.homeTeam === t.id || m.awayTeam === t.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  const allTeams = teams.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Star className="w-6 h-6 text-amber-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Bonos</h2>
          <p className="text-sm text-gray-400">
            Finalista, Campeón y Goleador del torneo
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BonusCard
          label="Finalista"
          value={bonuses.finalist}
          icon="🏆"
          points={16}
          teams={eligibleTeams}
          onChange={(v) => setBonus("finalist", v)}
        />
        <BonusCard
          label="Campeón"
          value={bonuses.champion}
          icon="👑"
          points={32}
          teams={eligibleTeams}
          onChange={(v) => setBonus("champion", v)}
        />
        <BonusCard
          label="Goleador"
          value={bonuses.topScorer}
          icon="⚽"
          points={10}
          teams={allTeams}
          onChange={(v) => setBonus("topScorer", v)}
        />
      </div>
    </div>
  )
}

function BonusCard({
  label,
  value,
  icon,
  points,
  teams: teamList,
  onChange,
}: {
  label: string
  value: string | null
  icon: string
  points: number
  teams: typeof import("@/utils/teams").teams
  onChange: (v: string | null) => void
}) {
  const team = getTeamById(value)

  return (
    <div className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-amber-900/30 to-gray-800 border-b border-gray-600/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h3 className="font-bold text-white">{label}</h3>
          </div>
          <span className="text-xs text-amber-400 font-medium">
            {points} pts
          </span>
        </div>
      </div>
      <div className="p-3">
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-colors cursor-pointer
            ${
              value
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-gray-750 border-gray-600/50 text-gray-500"
            }
            hover:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500
          `}
        >
          <option value="">Seleccionar {label.toLowerCase()}</option>
            {teamList.map((t) => (
            <option key={t.id} value={t.id}>
              {t.flag} {t.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
