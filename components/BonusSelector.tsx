"use client"

import { useQuinielaStore } from "@/store/store"
import { teams, getTeamById } from "@/utils/teams"
import { Star } from "lucide-react"

export default function BonusSelector() {
  const { bonuses, setBonus, phaseLocks } = useQuinielaStore()
  const allTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Star className="w-6 h-6 text-amber-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Bonos</h2>
          <p className="text-sm text-gray-400">
            Mejor portero, goleador y jugador del torneo
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BonusCard
          label="Mejor Portero"
          value={bonuses.bestGoalkeeper}
          icon="🧤"
          teams={allTeams}
          onChange={(v) => setBonus("bestGoalkeeper", v)}
          disabled={phaseLocks.bonuses}
        />
        <BonusCard
          label="Goleador"
          value={bonuses.topScorer}
          icon="⚽"
          teams={allTeams}
          onChange={(v) => setBonus("topScorer", v)}
          disabled={phaseLocks.bonuses}
        />
        <BonusCard
          label="Mejor Jugador"
          value={bonuses.bestPlayer}
          icon="👑"
          teams={allTeams}
          onChange={(v) => setBonus("bestPlayer", v)}
          disabled={phaseLocks.bonuses}
        />
      </div>
    </div>
  )
}

function BonusCard({
  label,
  value,
  icon,
  teams: teamList,
  onChange,
  disabled,
}: {
  label: string
  value: string | null
  icon: string
  teams: typeof teams
  onChange: (v: string | null) => void
  disabled?: boolean
}) {
  const team = value ? getTeamById(value) : undefined

  return (
    <div className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-amber-900/30 to-gray-800 border-b border-gray-600/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h3 className="font-bold text-white">{label}</h3>
          </div>
          {team && (
            <span className="text-xs text-gray-400">{team.flag}</span>
          )}
        </div>
      </div>
      <div className="p-3">
        <select
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value || null)}
          className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-colors
            ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
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
