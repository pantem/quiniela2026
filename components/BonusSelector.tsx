"use client"

import { useQuinielaStore } from "@/store/store"
import { Star } from "lucide-react"

export default function BonusSelector() {
  const { bonuses, setBonus, canEditPhase } = useQuinielaStore()

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
        <BonusInput
          label="Mejor Portero"
          value={bonuses.bestGoalkeeper}
          icon="🧤"
          placeholder="Ej: Emiliano Martínez"
          onChange={(v) => setBonus("bestGoalkeeper", v)}
          disabled={!canEditPhase('bonuses')}
        />
        <BonusInput
          label="Goleador"
          value={bonuses.topScorer}
          icon="⚽"
          placeholder="Ej: Kylian Mbappé"
          onChange={(v) => setBonus("topScorer", v)}
          disabled={!canEditPhase('bonuses')}
        />
        <BonusInput
          label="Mejor Jugador"
          value={bonuses.bestPlayer}
          icon="👑"
          placeholder="Ej: Lionel Messi"
          onChange={(v) => setBonus("bestPlayer", v)}
          disabled={!canEditPhase('bonuses')}
        />
      </div>
    </div>
  )
}

function BonusInput({
  label,
  value,
  icon,
  placeholder,
  onChange,
  disabled,
}: {
  label: string
  value: string | null
  icon: string
  placeholder?: string
  onChange: (v: string | null) => void
  disabled?: boolean
}) {
  return (
    <div className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-amber-900/30 to-gray-800 border-b border-gray-600/50">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="font-bold text-white">{label}</h3>
        </div>
      </div>
      <div className="p-3">
        <input
          type="text"
          value={value ?? ""}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value || null)}
          className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-colors
            ${disabled ? "cursor-not-allowed opacity-60" : ""}
            bg-gray-700 border-gray-600 text-white placeholder-gray-500
            hover:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500
          `}
        />
      </div>
    </div>
  )
}
