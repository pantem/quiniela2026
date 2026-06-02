"use client"

import { useQuinielaStore } from "@/store/store"
import { groups, getTeamsByGroup, getTeamById } from "@/utils/teams"
import { getGroupMatches, buildGroupResultsFromScores, computeStandingsFromMatches } from "@/utils/matches"
import { getMatchesByRound } from "@/utils/fifaMatrix"
import { DEFAULT_SCORING } from "@/app/types"
import ScoringConfigurator from "./ScoringConfigurator"
import { Shield, Lock, Calculator, CheckCircle, Swords, Settings, AlertCircle } from "lucide-react"
import { useState } from "react"

const ROUNDS = [
  { key: "r32", label: "Dieciseisavos" },
  { key: "r16", label: "Octavos" },
  { key: "qf", label: "Cuartos" },
  { key: "sf", label: "Semifinal" },
  { key: "final", label: "Final" },
] as const

export default function ResultsAdmin() {
  const store = useQuinielaStore()
  const {
    results,
    resultMatchScores,
    setResultMatchScore,
    setResultKnockoutScore,
    setResultBonus,
    applyResultStandings,
    generateResultsKnockout,
    resetResultMatchScores,
    knockout,
  } = store
  const [unlocked, setUnlocked] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)

  if (!unlocked) {
    return (
      <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-12 text-center space-y-4">
        <Lock className="w-12 h-12 text-gray-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Resultados Oficiales</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Zona restringida para administradores. Captura los resultados reales
          del mundial para calcular puntuaciones.
        </p>
        <button
          onClick={() => setUnlocked(true)}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Acceder como Administrador
        </button>
      </div>
    )
  }

  if (renderError) {
    return (
      <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-red-700/50 p-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Error</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">{renderError}</p>
        <button
          onClick={() => {
            localStorage.removeItem("quiniela-2026")
            window.location.reload()
          }}
          className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Limpiar datos y recargar
        </button>
      </div>
    )
  }

  try {
    const safeResults = results ?? { groups: [], knockout: [], bonuses: { finalist: null, champion: null, topScorer: null } }
    const safeMatchScores = Array.isArray(resultMatchScores) ? resultMatchScores : []
    const safeKnockout = Array.isArray(safeResults.knockout) ? safeResults.knockout : (Array.isArray(knockout) ? knockout : [])

    const totalScores = safeMatchScores.filter(
      (m: any) => m && m.homeScore !== null && m.awayScore !== null
    ).length

    const standings = buildStandings(safeMatchScores)

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-emerald-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Resultados Oficiales</h2>
            <p className="text-sm text-emerald-400">Modo administrador activo</p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-gray-800/60 rounded-xl border border-gray-700/50 p-4">
          <div className="flex items-center gap-3">
            <Calculator className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm text-gray-300">
                <span className="text-white font-bold">{totalScores}</span>/72 marcadores de grupos ingresados
              </p>
              <p className="text-xs text-gray-500">
                Las posiciones se calculan automáticamente desde los marcadores
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => resetResultMatchScores?.()}
              className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            >
              Limpiar
            </button>
            <button
              onClick={() => {
                applyResultStandings?.()
                generateResultsKnockout?.()
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Aplicar posiciones
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Marcadores por Grupo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups.map((group) => {
              const groupMatches = safeMatchScores.filter(
                (m: any) => m && m.groupId === group.id
              )
              const groupStandings = standings[group.id] ?? []

              return (
                <div
                  key={group.id}
                  className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden"
                >
                  <div className="px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600/50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white">Grupo {group.id}</h3>
                      <span className="text-xs text-gray-400">
                        {groupMatches.filter((m: any) => m.homeScore !== null).length}/6
                      </span>
                    </div>
                  </div>
                  <div className="p-3 space-y-1.5">
                    {groupMatches.map((match: any) => {
                      const home = getTeamById(match?.homeTeam)
                      const away = getTeamById(match?.awayTeam)
                      return (
                        <div
                          key={match?.id ?? Math.random()}
                          className="flex items-center gap-1 bg-gray-700/30 rounded-lg p-1.5"
                        >
                          <span className="text-xs w-28 truncate text-right text-gray-200">
                            {home?.flag} {home?.name ?? "—"}
                          </span>
                          <AdminScoreSelect
                            value={match?.homeScore ?? null}
                            onChange={(v) =>
                              setResultMatchScore?.(match.id, v, match?.awayScore ?? null)
                            }
                          />
                          <span className="text-gray-500 text-xs">-</span>
                          <AdminScoreSelect
                            value={match?.awayScore ?? null}
                            onChange={(v) =>
                              setResultMatchScore?.(match.id, match?.homeScore ?? null, v)
                            }
                          />
                          <span className="text-xs w-28 truncate text-left text-gray-200">
                            {away?.flag} {away?.name ?? "—"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {groupStandings.length > 0 && (
                    <div className="border-t border-gray-700/50 px-3 py-2 bg-gray-700/20">
                      <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1">
                        Tabla calculada
                      </p>
                      {groupStandings.map((s: any, i: number) => {
                        const team = getTeamById(s?.teamId)
                        return (
                          <div
                            key={s?.teamId ?? i}
                            className="flex items-center gap-1.5 text-xs py-0.5"
                          >
                            <span className="w-4 text-gray-500">{i + 1}°</span>
                            <span className="text-gray-200">
                              {team?.flag} {team?.name ?? "—"}
                            </span>
                            <span className="ml-auto text-gray-400">
                              {s?.points ?? 0} pts
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Marcadores Fase Eliminatoria</h3>
            <button
              onClick={() => generateResultsKnockout?.()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
            >
              <Swords className="w-3.5 h-3.5" />
              Generar eliminatoria
            </button>
          </div>
          {safeKnockout.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              Primero ingresa marcadores de grupos y haz clic en "Generar eliminatoria"
            </p>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ROUNDS.map(({ key, label }) => {
                const roundMatches = getMatchesByRound(safeKnockout, key)
                if (roundMatches.length === 0) return null
                return (
                  <div
                    key={key}
                    className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600/50">
                      <div className="flex items-center gap-2">
                        <Swords className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-bold text-white">{label}</h3>
                      </div>
                    </div>
                    <div className="p-3 space-y-1.5">
                      {roundMatches.map((match: any) => {
                        const home = getTeamById(match?.homeTeam)
                        const away = getTeamById(match?.awayTeam)
                        return (
                          <div
                            key={match?.id ?? Math.random()}
                            className="flex items-center gap-1 bg-gray-700/30 rounded-lg p-1.5"
                          >
                            <span className="text-xs w-24 truncate text-right text-gray-200">
                              {home?.flag} {home?.name ?? "—"}
                            </span>
                            <AdminScoreSelect
                              value={match?.homeScore ?? null}
                              onChange={(v) =>
                                setResultKnockoutScore?.(match.id, v, match?.awayScore ?? null)
                              }
                            />
                            <span className="text-gray-500 text-xs">-</span>
                            <AdminScoreSelect
                              value={match?.awayScore ?? null}
                              onChange={(v) =>
                                setResultKnockoutScore?.(match.id, match?.homeScore ?? null, v)
                              }
                            />
                            <span className="text-xs w-24 truncate text-left text-gray-200">
                              {away?.flag} {away?.name ?? "—"}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <ScoringConfigurator
          config={safeResults.scoringConfig ?? DEFAULT_SCORING}
          onChange={(c) => store.setScoringConfig(c)}
        />

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Bonos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["finalist", "champion", "topScorer"] as const).map((key) => {
              const labels = {
                finalist: "Finalista",
                champion: "Campeón",
                topScorer: "Goleador",
              }
              const allTeams = groups.flatMap((g) => getTeamsByGroup(g.id))
              return (
                <div
                  key={key}
                  className="bg-gray-800/80 rounded-xl border border-gray-700/50 p-4"
                >
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {labels[key]}
                  </label>
                  <select
                    value={safeResults?.bonuses?.[key] ?? ""}
                    onChange={(e) =>
                      setResultBonus?.(key, e.target.value || null)
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm"
                  >
                    <option value="">Seleccionar</option>
                    {allTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.flag} {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  } catch (e: any) {
    return (
      <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-red-700/50 p-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Error al cargar</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          {e?.message ?? "Error desconocido. Los datos guardados pueden ser incompatibles."}
        </p>
        <button
          onClick={() => {
            localStorage.removeItem("quiniela-2026")
            window.location.reload()
          }}
          className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Limpiar datos y recargar
        </button>
      </div>
    )
  }
}

function buildStandings(safeMatchScores: any[]) {
  const byGroup = new Map<string, any[]>()
  for (const m of safeMatchScores) {
    if (!m || !m.groupId) continue
    if (!byGroup.has(m.groupId)) byGroup.set(m.groupId, [])
    byGroup.get(m.groupId)!.push(m)
  }
  const result: Record<string, any> = {}
  for (const [gid, ms] of byGroup) {
    result[gid] = computeStandingsFromMatches(ms)
  }
  return result
}

function AdminScoreSelect({
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
      className="w-12 text-center bg-gray-700 border border-gray-600 rounded text-xs text-white py-1 appearance-none cursor-pointer hover:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
