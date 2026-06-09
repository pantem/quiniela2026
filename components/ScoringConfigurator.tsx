"use client"

import { ScoringConfig, DEFAULT_SCORING } from "@/app/types"
import { Settings } from "lucide-react"

interface Props {
  config: ScoringConfig
  onChange: (config: ScoringConfig) => void
}

const FIELDS: Array<{
  key: keyof ScoringConfig
  label: string
  phase: string
}> = [
  { key: "groupExact", label: "Posición exacta en grupo", phase: "Fase de Grupos" },
  { key: "groupOutcome", label: "Acierto de posición (otro lugar)", phase: "Fase de Grupos" },
  { key: "matchExact", label: "Marcador exacto", phase: "Fase de Grupos" },
  { key: "matchOutcome", label: "Tendencia (ganador/empate)", phase: "Fase de Grupos" },
  { key: "r32Winner", label: "Ganador del cruce", phase: "Dieciseisavos" },
  { key: "r32Exact", label: "Marcador exacto", phase: "Dieciseisavos" },
  { key: "r16Winner", label: "Ganador del cruce", phase: "Octavos" },
  { key: "r16Exact", label: "Marcador exacto", phase: "Octavos" },
  { key: "qfWinner", label: "Ganador del cruce", phase: "Cuartos" },
  { key: "qfExact", label: "Marcador exacto", phase: "Cuartos" },
  { key: "sfWinner", label: "Ganador del cruce", phase: "Semifinal" },
  { key: "sfExact", label: "Marcador exacto", phase: "Semifinal" },
  { key: "finalWinner", label: "Ganador del cruce", phase: "Final" },
  { key: "finalExact", label: "Marcador exacto", phase: "Final" },
  { key: "goalkeeperBonus", label: "Acertar Mejor Portero", phase: "Bonos" },
  { key: "topScorerBonus", label: "Acertar Goleador", phase: "Bonos" },
  { key: "playerBonus", label: "Acertar Mejor Jugador", phase: "Bonos" },
]

export default function ScoringConfigurator({ config, onChange }: Props) {
  const phases = Array.from(new Set(FIELDS.map((f) => f.phase)))

  return (
    <div className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Puntajes por Fase</h3>
      </div>
      <div className="space-y-4">
        {phases.map((phase) => (
          <div key={phase}>
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {phase}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {FIELDS.filter((f) => f.phase === phase).map((field) => (
                <div
                  key={field.key}
                  className="flex items-center justify-between bg-gray-700/30 rounded-lg px-3 py-2"
                >
                  <label className="text-xs text-gray-300">{field.label}</label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={config[field.key]}
                    onChange={(e) =>
                      onChange({ ...config, [field.key]: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="w-14 text-center bg-gray-700 border border-gray-600 rounded text-sm text-white py-1"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={() => onChange({ ...DEFAULT_SCORING })}
          className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
        >
          Restaurar valores por defecto
        </button>
      </div>
    </div>
  )
}
