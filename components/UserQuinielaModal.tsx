"use client"

import { useQuinielaStore } from "@/store/store"
import { groups, getTeamById } from "@/utils/teams"
import { X, ChevronDown, ChevronRight, Trophy, Timer, Swords, Star, UserCircle, History } from "lucide-react"
import { useState, useMemo } from "react"
import { DEFAULT_SCORING, type ScoringConfig } from "@/app/types"

interface Props {
  participant: any
  onClose: () => void
}

function getMatchScorePoints(
  predScore: number | null,
  predAway: number | null,
  officialHome: number | null,
  officialAway: number | null,
  cfg: ScoringConfig
): number {
  if (predScore === null || predAway === null || officialHome === null || officialAway === null) return 0
  if (predScore === officialHome && predAway === officialAway) return cfg.matchExact
  const predWinner = predScore > predAway ? "home" : predScore < predAway ? "away" : "draw"
  const actualWinner = officialHome > officialAway ? "home" : officialHome < officialAway ? "away" : "draw"
  return predWinner === actualWinner ? cfg.matchOutcome : 0
}

function getGroupPosPoints(
  pred: string | null,
  official: string | null,
  preds: any,
  officials: any,
  pos: "first" | "second" | "third" | "fourth",
  cfg: ScoringConfig
): number {
  if (!pred || !official) return 0
  if (pred === official) return cfg.groupExact
  const positions: Array<"first" | "second" | "third" | "fourth"> = ["first", "second", "third", "fourth"]
  const actualTeams = positions.filter((p) => preds[p] === official).map((p) => officials[p])
  return actualTeams.includes(pred) ? cfg.groupOutcome : 0
}

function getKnockoutWinnerPoints(
  predWinner: string | null,
  officialWinner: string | null,
  round: string,
  cfg: ScoringConfig
): number {
  if (!predWinner || !officialWinner || predWinner !== officialWinner) return 0
  const pts: Record<string, { winner: number }> = {
    r32: { winner: cfg.r32Winner },
    r16: { winner: cfg.r16Winner },
    qf: { winner: cfg.qfWinner },
    sf: { winner: cfg.sfWinner },
    third: { winner: cfg.thirdWinner },
    final: { winner: cfg.finalWinner },
  }
  return pts[round]?.winner ?? 0
}

function getKnockoutExactPoints(
  predHome: number | null,
  predAway: number | null,
  officialHome: number | null,
  officialAway: number | null,
  round: string,
  cfg: ScoringConfig
): number {
  if (predHome === null || predAway === null || officialHome === null || officialAway === null) return 0
  if (predHome !== officialHome || predAway !== officialAway) return 0
  const pts: Record<string, { exact: number }> = {
    r32: { exact: cfg.r32Exact },
    r16: { exact: cfg.r16Exact },
    qf: { exact: cfg.qfExact },
    sf: { exact: cfg.sfExact },
    third: { exact: cfg.thirdExact },
    final: { exact: cfg.finalExact },
  }
  return pts[round]?.exact ?? 0
}

function getBonusItemPoints(key: string, pred: string | null, official: string | null, cfg: ScoringConfig): number {
  if (pred == null || pred !== official) return 0
  switch (key) {
    case "bestGoalkeeper": return cfg.goalkeeperBonus
    case "topScorer": return cfg.topScorerBonus
    case "bestPlayer": return cfg.playerBonus
    default: return 0
  }
}

export default function UserQuinielaModal({ participant, onClose }: Props) {
  const store = useQuinielaStore()
  const cfg = store.results.scoringConfig ?? DEFAULT_SCORING
  const resultMatchScores = store.resultMatchScores ?? []
  const resultGroups = store.results.groups ?? []
  const resultKnockout = store.results.knockout ?? []
  const resultBonuses = store.results.bonuses ?? { bestGoalkeeper: null, topScorer: null, bestPlayer: null }

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    matches: true,
    groups: false,
    knockout: false,
    bonuses: false,
  })

  const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }))

  const userMatchPredictions = participant.matchPredictions ?? []
  const userGroups = participant.groups ?? []
  const userKnockout = participant.knockout ?? []
  const userBonuses = participant.bonuses ?? { bestGoalkeeper: null, topScorer: null, bestPlayer: null }
  const penalties = participant.penalties ?? 0

  const totals = useMemo(() => {
    let matchPts = 0
    let groupPts = 0
    let knockoutPts = 0
    let bonusPts = 0

    for (const pred of userMatchPredictions) {
      const result = resultMatchScores.find((r: any) => r.id === pred.id)
      matchPts += getMatchScorePoints(pred.homeScore, pred.awayScore, result?.homeScore ?? null, result?.awayScore ?? null, cfg)
    }

    for (const pred of userGroups) {
      const result = resultGroups.find((r: any) => r.groupId === pred.groupId)
      if (result) {
        for (const pos of ["first", "second", "third", "fourth"] as const) {
          groupPts += getGroupPosPoints(pred[pos], result[pos], pred, result, pos, cfg)
        }
      }
    }

    for (const pred of userKnockout) {
      const result = resultKnockout.find((r: any) => r.id === pred.id)
      if (result) {
        knockoutPts += getKnockoutWinnerPoints(pred.winner, result.winner, pred.round, cfg)
        knockoutPts += getKnockoutExactPoints(pred.homeScore, pred.awayScore, result.homeScore, result.awayScore, pred.round, cfg)
      }
    }

    for (const key of ["bestGoalkeeper", "topScorer", "bestPlayer"] as const) {
      bonusPts += getBonusItemPoints(key, userBonuses[key], resultBonuses[key], cfg)
    }

    return { matchPts, groupPts, knockoutPts, bonusPts, total: matchPts + groupPts + knockoutPts + bonusPts - penalties }
  }, [userMatchPredictions, userGroups, userKnockout, userBonuses, resultMatchScores, resultGroups, resultKnockout, resultBonuses, cfg, penalties])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-12">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-700/50 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <UserCircle className="w-8 h-8 text-purple-400" />
            <div>
              <h3 className="text-lg font-bold text-white">{participant.name}</h3>
              <p className="text-xs text-gray-400">
                Puntos totales: <span className="text-amber-400 font-bold text-sm">{totals.total}</span>
                {penalties > 0 && <span className="text-red-400 ml-2">(Pen: -{penalties})</span>}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Match Scores Section */}
          <div className="bg-gray-800/60 rounded-xl border border-gray-700/50 overflow-hidden">
            <button
              onClick={() => toggle("matches")}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">Marcadores de Grupo</span>
                <span className="text-xs text-gray-500">({userMatchPredictions.length} partidos)</span>
                <span className="text-xs text-amber-400 font-bold">+{totals.matchPts} pts</span>
              </div>
              {expanded.matches ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            </button>
            {expanded.matches && (
              <div className="divide-y divide-gray-700/30">
                {groups.map((group) => {
                  const groupMatches = userMatchPredictions.filter((m: any) => m.groupId === group.id)
                  if (groupMatches.length === 0) return null
                  return (
                    <div key={group.id}>
                      <div className="px-4 py-2 bg-gray-700/20 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Grupo {group.id}
                      </div>
                      <div className="divide-y divide-gray-700/20">
                        {groupMatches.map((pred: any) => {
                          const result = resultMatchScores.find((r: any) => r.id === pred.id)
                          const home = getTeamById(pred.homeTeam)
                          const away = getTeamById(pred.awayTeam)
                          const pts = getMatchScorePoints(
                            pred.homeScore, pred.awayScore,
                            result?.homeScore ?? null, result?.awayScore ?? null,
                            cfg
                          )
                          const hasOfficial = result?.homeScore != null && result?.awayScore != null
                          const hasPred = pred.homeScore != null && pred.awayScore != null
                          return (
                            <div key={pred.id} className="flex items-center gap-2 px-4 py-2 text-xs">
                              <span className="w-28 text-right text-gray-200 truncate">
                                {home?.flag} {home?.name ?? "—"}
                              </span>
                              <span className="text-gray-400 w-8 text-center">
                                {hasOfficial ? `${result.homeScore}-${result.awayScore}` : "?-?"}
                              </span>
                              <span className="text-gray-600">→</span>
                              <span className={`w-8 text-center font-mono ${hasPred ? "text-white" : "text-gray-500"}`}>
                                {hasPred ? `${pred.homeScore}-${pred.awayScore}` : "?-?"}
                              </span>
                              <span className={`w-14 text-right font-bold ${pts > 0 ? "text-emerald-400" : "text-gray-600"}`}>
                                {pts > 0 ? `+${pts}` : "0"}
                              </span>
                              <span className="w-24 text-left text-gray-200 truncate">
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

          {/* Group Positions Section */}
          <div className="bg-gray-800/60 rounded-xl border border-gray-700/50 overflow-hidden">
            <button
              onClick={() => toggle("groups")}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">Posiciones de Grupo</span>
                <span className="text-xs text-amber-400 font-bold">+{totals.groupPts} pts</span>
              </div>
              {expanded.groups ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            </button>
            {expanded.groups && (
              <div className="divide-y divide-gray-700/30">
                {groups.map((group) => {
                  const pred = userGroups.find((g: any) => g.groupId === group.id)
                  const result = resultGroups.find((r: any) => r.groupId === group.id)
                  if (!pred || !result) return null
                  const positions: Array<"first" | "second" | "third" | "fourth"> = ["first", "second", "third", "fourth"]
                  return (
                    <div key={group.id}>
                      <div className="px-4 py-2 bg-gray-700/20 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Grupo {group.id}
                      </div>
                      <div className="divide-y divide-gray-700/20">
                        {positions.map((pos, i) => {
                          const predTeam = getTeamById(pred[pos])
                          const officialTeam = getTeamById(result[pos])
                          const pts = getGroupPosPoints(pred[pos], result[pos], pred, result, pos, cfg)
                          return (
                            <div key={pos} className="flex items-center gap-2 px-4 py-2 text-xs">
                              <span className="w-6 text-gray-500">{i + 1}°</span>
                              <span className="w-20 text-gray-300">{officialTeam?.flag ?? "—"} {officialTeam?.name ?? "Sin dato"}</span>
                              <span className="text-gray-600">→</span>
                              <span className="w-20 text-white">{predTeam?.flag ?? "—"} {predTeam?.name ?? "—"}</span>
                              <span className={`ml-auto font-bold ${pts > 0 ? "text-emerald-400" : "text-gray-600"}`}>
                                {pts > 0 ? `+${pts}` : "0"}
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

          {/* Knockout Section */}
          <div className="bg-gray-800/60 rounded-xl border border-gray-700/50 overflow-hidden">
            <button
              onClick={() => toggle("knockout")}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">Fases Finales</span>
                <span className="text-xs text-amber-400 font-bold">+{totals.knockoutPts} pts</span>
              </div>
              {expanded.knockout ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            </button>
            {expanded.knockout && (
              <div className="divide-y divide-gray-700/30">
                {userKnockout.map((pred: any) => {
                  const result = resultKnockout.find((r: any) => r.id === pred.id)
                  if (!result) return null
                  const home = getTeamById(pred.homeTeam)
                  const away = getTeamById(pred.awayTeam)
                  const officialHome = getTeamById(result.homeTeam)
                  const officialAway = getTeamById(result.awayTeam)
                  const winnerPts = getKnockoutWinnerPoints(pred.winner, result.winner, pred.round, cfg)
                  const exactPts = getKnockoutExactPoints(pred.homeScore, pred.awayScore, result.homeScore, result.awayScore, pred.round, cfg)
                  const roundLabel: Record<string, string> = {
                    r32: "Dieciseisavos", r16: "Octavos", qf: "Cuartos",
                    sf: "Semifinal", third: "3er Lugar", final: "Final",
                  }
                  return (
                    <div key={pred.id} className="px-4 py-2.5">
                      <div className="text-[10px] text-gray-500 font-semibold uppercase mb-1">{roundLabel[pred.round] ?? pred.round}</div>
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="text-gray-400 w-24 truncate text-right">
                          {officialHome?.flag ?? home?.flag} {officialHome?.name ?? home?.name ?? "—"}
                        </span>
                        <span className="text-gray-400 w-8 text-center">
                          {result.homeScore != null && result.awayScore != null
                            ? `${result.homeScore}-${result.awayScore}`
                            : "?-?"}
                        </span>
                        <span className="text-gray-600">→</span>
                        <span className="text-white w-8 text-center font-mono">
                          {pred.homeScore != null && pred.awayScore != null
                            ? `${pred.homeScore}-${pred.awayScore}`
                            : "?-?"}
                        </span>
                        <span className="text-gray-300 w-24 truncate text-left">
                          {officialAway?.flag ?? away?.flag} {officialAway?.name ?? away?.name ?? "—"}
                        </span>
                        <span className="ml-auto flex gap-3">
                          <span className={winnerPts > 0 ? "text-emerald-400 font-bold" : "text-gray-600"}>
                            Gan: {winnerPts > 0 ? `+${winnerPts}` : "0"}
                          </span>
                          <span className={exactPts > 0 ? "text-emerald-400 font-bold" : "text-gray-600"}>
                            Exc: {exactPts > 0 ? `+${exactPts}` : "0"}
                          </span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bonuses Section */}
          <div className="bg-gray-800/60 rounded-xl border border-gray-700/50 overflow-hidden">
            <button
              onClick={() => toggle("bonuses")}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">Bonos</span>
                <span className="text-xs text-amber-400 font-bold">+{totals.bonusPts} pts</span>
              </div>
              {expanded.bonuses ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            </button>
            {expanded.bonuses && (
              <div className="divide-y divide-gray-700/20">
                {(["bestGoalkeeper", "topScorer", "bestPlayer"] as const).map((key) => {
                  const labels: Record<string, string> = {
                    bestGoalkeeper: "Mejor Portero",
                    topScorer: "Goleador",
                    bestPlayer: "Mejor Jugador",
                  }
                  const official = resultBonuses[key]
                  const pred = userBonuses[key]
                  const pts = getBonusItemPoints(key, pred, official, cfg)
                  return (
                    <div key={key} className="flex items-center gap-2 px-4 py-2.5 text-xs">
                      <span className="w-28 text-gray-400">{labels[key]}</span>
                      <span className="w-28 text-gray-300 truncate">
                        {official || "—"}
                      </span>
                      <span className="text-gray-600">→</span>
                      <span className="w-28 text-white truncate">
                        {pred || "—"}
                      </span>
                      <span className={`ml-auto font-bold ${pts > 0 ? "text-emerald-400" : "text-gray-600"}`}>
                        {pts > 0 ? `+${pts}` : "0"}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Totals Summary */}
          <div className="bg-gray-800/80 rounded-xl border border-gray-600/50 p-4">
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Marcadores</p>
                <p className="text-lg font-bold text-blue-400">+{totals.matchPts}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Posiciones</p>
                <p className="text-lg font-bold text-amber-400">+{totals.groupPts}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">F. Finales</p>
                <p className="text-lg font-bold text-emerald-400">+{totals.knockoutPts}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Bonos</p>
                <p className="text-lg font-bold text-amber-400">+{totals.bonusPts}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Total {penalties > 0 && <span className="text-red-400">(Pen: -{penalties})</span>}
                </p>
                <p className="text-xl font-bold text-white">{totals.total}</p>
              </div>
            </div>
          </div>

          {/* Changelog Section */}
          <div className="bg-gray-800/60 rounded-xl border border-gray-700/50 overflow-hidden">
            <button
              onClick={() => toggle("changelog")}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">Historial de cambios</span>
                <span className="text-xs text-gray-500">({(participant.changelog ?? []).length})</span>
              </div>
              {expanded.changelog ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            </button>
            {expanded.changelog && (
              <div className="divide-y divide-gray-700/20 max-h-80 overflow-y-auto">
                {(participant.changelog ?? []).length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    Sin cambios registrados
                  </div>
                ) : (
                  [...(participant.changelog ?? [])].reverse().map((entry: any, i: number) => (
                    <div key={i} className="px-4 py-3">
                      <div className="text-[10px] text-gray-500 font-mono mb-1">
                        {new Date(entry.timestamp).toLocaleString("es-MX", {
                          year: "numeric", month: "2-digit", day: "2-digit",
                          hour: "2-digit", minute: "2-digit", second: "2-digit",
                        })}
                      </div>
                      <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {entry.changes}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
