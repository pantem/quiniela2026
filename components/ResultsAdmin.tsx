"use client"

import { useQuinielaStore } from "@/store/store"
import { groups, getTeamsByGroup, getTeamById, teams as allTeams } from "@/utils/teams"
import { getGroupMatches, buildGroupResultsFromScores, computeStandingsFromMatches } from "@/utils/matches"
import { getMatchesByRound, buildFifaMatrix } from "@/utils/fifaMatrix"
import { getBestThirdPlaced } from "@/utils/bestThird"
import { DEFAULT_SCORING, DEFAULT_PHASE_LOCKS, PhaseLocks } from "@/app/types"
import ScoringConfigurator from "./ScoringConfigurator"
import { fetchParticipants, updateParticipantAdmin } from "@/lib/api"
import { Shield, Lock, Calculator, CheckCircle, Swords, AlertCircle, Users, Gavel, Save } from "lucide-react"
import { useState, useMemo, useEffect } from "react"

const ROUNDS = [
  { key: "r32", label: "Dieciseisavos" },
  { key: "r16", label: "Octavos" },
  { key: "qf", label: "Cuartos" },
  { key: "sf", label: "Semifinal" },
  { key: "third", label: "3er Lugar" },
  { key: "final", label: "Final" },
] as const

const FIFA_ROUNDS = [
  { key: "r32", label: "Dieciseisavos" },
  { key: "r16", label: "Octavos" },
  { key: "qf", label: "Cuartos" },
  { key: "sf", label: "Semifinal" },
  { key: "third", label: "3er Lugar" },
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
    phaseLocks,
    setPhaseLock,
    saveResultsToMongo,
    loadResultsFromMongo,
    setAdminFifaKnockoutTeam,
    setAdminFifaKnockoutScore,
    generateFifaKnockout,
    propagateFifaKnockout,
  } = store
  const [unlocked, setUnlocked] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [participantList, setParticipantList] = useState<Array<{ name: string; penalties: number; canEdit: boolean; phasePermissions: Record<string, boolean> }>>([])

  const PHASE_KEYS = [
    { key: "groups", label: "Grupos" },
    { key: "r32", label: "16avos" },
    { key: "r16", label: "Octavos" },
    { key: "qf", label: "Cuartos" },
    { key: "sf", label: "Semifinal" },
    { key: "third", label: "3er" },
    { key: "final", label: "Final" },
    { key: "bonuses", label: "Bonos" },
    { key: "fifaR32", label: "F-R32" },
    { key: "fifaR16", label: "F-R16" },
    { key: "fifaQf", label: "F-QF" },
    { key: "fifaSf", label: "F-SF" },
    { key: "fifaFinal", label: "F-FIN" },
    { key: "fifaThird", label: "F-3RD" },
  ] as const
  const [savingParticipants, setSavingParticipants] = useState(false)

  useEffect(() => {
    fetchParticipants().then((list) =>
      setParticipantList(
        list.map((p: any) => ({
          name: p.name,
          penalties: p.penalties ?? 0,
          canEdit: p.canEdit ?? true,
          phasePermissions: p.phasePermissions ?? { groups: true, r32: true, r16: true, qf: true, sf: true, third: true, final: true, bonuses: true, fifaR32: true, fifaR16: true, fifaQf: true, fifaSf: true, fifaFinal: true, fifaThird: true },
        }))
      )
    ).catch(() => {})
  }, [])

  const safeMatchScores = Array.isArray(resultMatchScores) ? resultMatchScores : []
  const totalScores = safeMatchScores.filter(
    (m: any) => m && m.homeScore !== null && m.awayScore !== null
  ).length

  const derivedKnockout = useMemo(() => {
    try {
      const existing = Array.isArray(results?.knockout) ? results.knockout : (Array.isArray(knockout) ? knockout : [])
      if (existing.length > 0) return existing
      if (totalScores === 0 && (!results?.groups || !results.groups.some((g) => g.first))) return []
      const groups = results?.groups?.some((g) => g.first) ? results.groups : buildGroupResultsFromScores(safeMatchScores)
      const bestThird = getBestThirdPlaced(groups, safeMatchScores)
      const thirdQualifiers = bestThird.map((t) => t.teamId).filter(Boolean) as string[]
      return buildFifaMatrix(groups, thirdQualifiers)
    } catch {
      return []
    }
  }, [results?.knockout, knockout, totalScores, results?.groups, safeMatchScores])

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
    const safeResults = results ?? { groups: [], knockout: [], bonuses: { bestGoalkeeper: null, topScorer: null, bestPlayer: null } }
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
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500 mr-1">Bloqueos:</span>
              {(["groups", "r32", "r16", "qf", "sf", "third", "final", "bonuses", "fifaR32", "fifaR16", "fifaQf", "fifaSf", "fifaFinal", "fifaThird"] as const).map((phase) => {
                const label: Record<string, string> = {
                  groups: "Grupos", r32: "R32", r16: "R16", qf: "QF", sf: "SF",
                  third: "3RD", final: "FIN", bonuses: "Bonos",
                  fifaR32: "F32", fifaR16: "F16", fifaQf: "FQF", fifaSf: "FSF",
                  fifaFinal: "FFIN", fifaThird: "F3RD",
                }
                return (
                  <button
                    key={phase}
                    onClick={() => setPhaseLock?.(phase, !phaseLocks[phase])}
                    className={`px-1.5 py-1 text-[10px] rounded transition-colors font-medium ${
                      phaseLocks[phase]
                        ? "bg-red-600/20 text-red-300 border border-red-500/30"
                        : "bg-gray-700 text-gray-400 border border-transparent"
                    }`}
                    title={`${phaseLocks[phase] ? "Desbloquear" : "Bloquear"} fase ${label[phase] ?? phase}`}
                  >
                    {phaseLocks[phase] ? "🔒" : "🔓"} {label[phase] ?? phase}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => loadResultsFromMongo?.()}
              className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            >
              Cargar
            </button>
            <button
              onClick={() => saveResultsToMongo?.()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Guardar resultados
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
            <h3 className="text-lg font-semibold text-white">Marcadores Fases Finales</h3>
            <button
              onClick={() => generateResultsKnockout?.()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
            >
              <Swords className="w-3.5 h-3.5" />
              Generar eliminatoria
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ROUNDS.map(({ key, label }) => {
                const roundMatches = getMatchesByRound(derivedKnockout, key)
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
                      {roundMatches.length === 0 ? (
                        <p className="text-gray-500 text-xs text-center py-4">
                          Ingresa marcadores de grupos primero
                        </p>
                      ) : (
                        roundMatches.map((match: any) => {
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
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Swords className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Bracket Oficial FIFA</h3>
                <p className="text-sm text-gray-400">
                  Selecciona los equipos para cada partido y captura los marcadores oficiales
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => propagateFifaKnockout?.()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              >
                <Swords className="w-3.5 h-3.5" />
                Propagar equipos
              </button>
              <button
                onClick={() => generateFifaKnockout?.()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
              >
                <Swords className="w-3.5 h-3.5" />
                Generar bracket FIFA
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {FIFA_ROUNDS.map(({ key, label }) => {
              const roundMatches = (results?.fifaKnockout ?? []).filter((m: any) => m.round === key)
              return (
                <div
                  key={key}
                  className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden"
                >
                  <div className="px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600/50">
                    <div className="flex items-center gap-2">
                      <Swords className="w-4 h-4 text-amber-400" />
                      <h3 className="font-bold text-white">{label}</h3>
                    </div>
                  </div>
                  <div className="p-3 space-y-1.5">
                    {roundMatches.length === 0 ? (
                      <p className="text-gray-500 text-xs text-center py-4">
                        Presiona "Generar bracket FIFA" para comenzar
                      </p>
                    ) : (
                      roundMatches.map((match: any) => {
                        const home = getTeamById(match?.homeTeam)
                        const away = getTeamById(match?.awayTeam)
                        return (
                          <div
                            key={match?.id}
                            className="flex items-center gap-1 bg-gray-700/30 rounded-lg p-1.5"
                          >
                            <select
                              value={match?.homeTeam ?? ""}
                              onChange={(e) => setAdminFifaKnockoutTeam?.(match.id, 'homeTeam', e.target.value || null)}
                              className="w-24 text-xs bg-gray-700 border border-gray-600 rounded text-white py-1 px-1 truncate focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                            >
                              <option value="">—</option>
                              {allTeams.map((t) => (
                                <option key={t.id} value={t.id}>{t.flag} {t.name}</option>
                              ))}
                            </select>
                            <AdminScoreSelect
                              value={match?.homeScore ?? null}
                              onChange={(v) => setAdminFifaKnockoutScore?.(match.id, v, match?.awayScore ?? null)}
                            />
                            <span className="text-gray-500 text-xs">-</span>
                            <AdminScoreSelect
                              value={match?.awayScore ?? null}
                              onChange={(v) => setAdminFifaKnockoutScore?.(match.id, match?.homeScore ?? null, v)}
                            />
                            <select
                              value={match?.awayTeam ?? ""}
                              onChange={(e) => setAdminFifaKnockoutTeam?.(match.id, 'awayTeam', e.target.value || null)}
                              className="w-24 text-xs bg-gray-700 border border-gray-600 rounded text-white py-1 px-1 truncate focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                            >
                              <option value="">—</option>
                              {allTeams.map((t) => (
                                <option key={t.id} value={t.id}>{t.flag} {t.name}</option>
                              ))}
                            </select>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Bonos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["bestGoalkeeper", "topScorer", "bestPlayer"] as const).map((key) => (
              <div key={key} className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 p-4">
                <label className="text-sm font-medium text-gray-300 block mb-2">
                  {key === "bestGoalkeeper" ? "Mejor Portero" : key === "topScorer" ? "Goleador" : "Mejor Jugador"}
                </label>
                <input
                  type="text"
                  value={(safeResults.bonuses?.[key] as string) ?? ""}
                  onChange={(e) => setResultBonus?.(key, e.target.value || null)}
                  placeholder={key === "bestGoalkeeper" ? "Ej: Emiliano Martínez" : key === "topScorer" ? "Ej: Kylian Mbappé" : "Ej: Lionel Messi"}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Asignación automática de puntos extra</h3>
              <p className="text-sm text-gray-400">Suma una única vez puntos por posición en el ranking general</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => store.calculateAutoBonuses?.()}
                disabled={totalScores < safeMatchScores.length}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  totalScores < safeMatchScores.length
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-amber-600 hover:bg-amber-500 text-white"
                }`}
                title={totalScores < safeMatchScores.length ? `Completa todos los ${safeMatchScores.length} marcadores primero` : ""}
              >
                Calcular puntos extra
              </button>
              {store.results.autoBonuses && Object.keys(store.results.autoBonuses).length > 0 && (
                <button
                  onClick={() => {
                    store.clearAutoBonuses?.()
                    store.saveResultsToMongo?.()
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded-lg transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
          <div className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
            {store.results.autoBonuses && Object.keys(store.results.autoBonuses).length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Posición</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Participante</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Pts Extra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {Object.entries(store.results.autoBonuses)
                    .sort(([, a], [, b]) => b - a)
                    .map(([name, pts], i) => (
                      <tr key={name} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {pts >= 30 ? "Último" : pts >= 20 ? "Penúltimo" : pts >= 10 && i === 0 ? "Primero" : "Antepenúltimo"}
                        </td>
                        <td className="px-4 py-3 text-sm text-white">{name}</td>
                        <td className="px-4 py-3 text-sm text-right text-amber-400 font-bold">+{pts}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 text-sm">No hay puntos extra asignados. Ingresa los marcadores de grupos y haz clic en "Calcular puntos extra".</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Bonus por equipos en dieciseisavos (FIFA)</h3>
              <p className="text-sm text-gray-400">3 puntos por cada equipo de tu predicción de grupos que coincida con la fase FIFA de dieciseisavos</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => store.calculateR32TeamBonus?.()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              >
                Calcular bonus 16avos
              </button>
              <button
                onClick={async () => {
                  store.clearR32TeamBonus?.()
                  await store.saveResultsToMongo?.()
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/30 rounded-lg transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
          <div className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 p-4">
            {store.results.r32TeamBonus && Object.keys(store.results.r32TeamBonus).length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Participante</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Equipos acertados</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-emerald-400 uppercase tracking-wider">Puntos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {Object.entries(store.results.r32TeamBonus)
                    .sort(([, a], [, b]) => b - a)
                    .map(([name, pts]) => (
                      <tr key={name} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-2 text-sm text-white">{name}</td>
                        <td className="px-4 py-2 text-sm text-center text-gray-400">
                          {(store.results.r32TeamBonusDetail?.[name] as string[])?.join(", ") || "—"}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-emerald-400 font-bold">+{pts}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500 text-sm">Asigna los equipos en la fase FIFA de dieciseisavos y haz clic en "Calcular bonus 16avos".</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Participantes</h3>
                <p className="text-sm text-gray-400">Penalizaciones y permisos de edición por usuario</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  setSavingParticipants(true)
                  try {
                    for (const p of participantList) {
                      await updateParticipantAdmin({ name: p.name, penalties: p.penalties, canEdit: p.canEdit, phasePermissions: p.phasePermissions })
                    }
                  } catch {}
                  setSavingParticipants(false)
                }}
                disabled={savingParticipants}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {savingParticipants ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
          <div className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Usuario</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-red-400 uppercase tracking-wider">Penalización</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-emerald-400 uppercase tracking-wider">Fases</th>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <th></th>
                  <th></th>
                  <th className="px-4 py-2">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {PHASE_KEYS.map((ph) => (
                        <button
                          key={ph.key}
                          onClick={() =>
                            setParticipantList((prev) =>
                              prev.map((p) => ({
                                ...p,
                                phasePermissions: { ...p.phasePermissions, [ph.key]: !p.phasePermissions[ph.key] },
                              }))
                            )
                          }
                          className="px-2 py-0.5 text-[10px] rounded font-medium transition-colors border border-gray-600/50 bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                        >
                          Todos {ph.label}
                        </button>
                      ))}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {participantList.map((p) => (
                  <tr key={p.name} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-white">{p.name}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={p.penalties}
                        onChange={(e) =>
                          setParticipantList((prev) =>
                            prev.map((x) => (x.name === p.name ? { ...x, penalties: parseInt(e.target.value) || 0 } : x))
                          )
                        }
                        className="w-20 text-center bg-gray-700 border border-gray-600 rounded text-sm text-white py-1 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {PHASE_KEYS.map((ph) => (
                          <button
                            key={ph.key}
                            onClick={() =>
                              setParticipantList((prev) =>
                                prev.map((x) =>
                                  x.name === p.name
                                    ? { ...x, phasePermissions: { ...x.phasePermissions, [ph.key]: !x.phasePermissions[ph.key] } }
                                    : x
                                )
                              )
                            }
                            className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors border ${
                              p.phasePermissions[ph.key]
                                ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/30"
                                : "bg-red-600/20 text-red-300 border-red-500/30"
                            }`}
                          >
                            {ph.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {participantList.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-sm text-gray-500">
                      No hay participantes registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ScoringConfigurator
          config={safeResults.scoringConfig ?? DEFAULT_SCORING}
          onChange={(c) => store.setScoringConfig(c)}
        />

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
