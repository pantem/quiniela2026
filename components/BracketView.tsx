"use client"

import { useQuinielaStore } from "@/store/store"
import { getTeamById } from "@/utils/teams"
import { getMatchesByRound, propagateWinners } from "@/utils/fifaMatrix"
import { Swords } from "lucide-react"
import { DEFAULT_SCORING } from "@/app/types"
import { useEffect } from "react"

const ROUNDS = [
  { key: "r32" as const, label: "Dieciseisavos", matches: 16, span: 1 },
  { key: "r16" as const, label: "Octavos", matches: 8, span: 2 },
  { key: "qf" as const, label: "Cuartos", matches: 4, span: 4 },
  { key: "sf" as const, label: "Semifinales", matches: 2, span: 8 },
  { key: "final" as const, label: "Final", matches: 1, span: 16 },
  { key: "third" as const, label: "3er Lugar", matches: 1, span: 0 },
]

function getRoundPoints(cfg: typeof DEFAULT_SCORING, round: string): { winner: number; exact: number } {
  switch (round) {
    case "r32": return { winner: cfg.r32Winner, exact: cfg.r32Exact }
    case "r16": return { winner: cfg.r16Winner, exact: cfg.r16Exact }
    case "qf": return { winner: cfg.qfWinner, exact: cfg.qfExact }
    case "sf": return { winner: cfg.sfWinner, exact: cfg.sfExact }
    case "third": return { winner: cfg.thirdWinner, exact: cfg.thirdExact }
    case "final": return { winner: cfg.finalWinner, exact: cfg.finalExact }
    default: return { winner: 0, exact: 0 }
  }
}

export default function BracketView() {
  const { knockout, setKnockoutScore, canEdit, results } = useQuinielaStore()
  const scoringConfig = results.scoringConfig ?? DEFAULT_SCORING

  useEffect(() => {
    if (!knockout.some((m) => m.id === "3RD_01")) {
      useQuinielaStore.setState({ knockout: propagateWinners([...knockout, {
        id: "3RD_01",
        round: "third" as const,
        homeTeam: null,
        awayTeam: null,
        homeScore: null,
        awayScore: null,
        winner: null,
        label: "3rd Place",
      }])})
    }
  }, [])

  const allComplete = knockout.some((m) => m.homeTeam && m.awayTeam)

  if (!allComplete) {
    return (
      <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-8 text-center">
        <Swords className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Fases Finales</h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Completa los grupos con sus 4 posiciones para visualizar el bracket eliminatorio.
        </p>
      </div>
    )
  }

  const getMatches = (round: string) =>
    getMatchesByRound(knockout, round)

  const roundData = ROUNDS.map((r) => {
    const matches = getMatches(r.key)
    if (r.key === "third" && matches.length === 0) {
      return {
        ...r,
        matches: [{
          id: "3RD_01",
          round: "third" as const,
          homeTeam: null,
          awayTeam: null,
          homeScore: null,
          awayScore: null,
          winner: null,
          label: "3rd Place",
        }],
      }
    }
    return { ...r, matches }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Swords className="w-6 h-6 text-emerald-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Fases Finales</h2>
          <p className="text-sm text-gray-400">
            Visualización tipo bracket — predice marcadores y ganadores
          </p>
          <p className="text-sm text-gray-400">
            Recuerden que la eliminación directa incluye el resultado final incluyendo si hay tiempos extras y penaltis
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[900px]">
          <div
            className="grid gap-0"
            style={{
              gridTemplateColumns: "1fr 24px 1fr 24px 1fr 24px 1fr 24px 1fr",
              gridTemplateRows: `repeat(20, minmax(0, 1fr))`,
            }}
          >
            {roundData.filter((r) => r.key !== "third").map((round, ri) => {
              const col = ri * 2 + 1
              return round.matches.map((match, mi) => {
                const home = match.homeTeam ? getTeamById(match.homeTeam) : undefined
                const away = match.awayTeam ? getTeamById(match.awayTeam) : undefined
                const rowStart = mi * round.span + 1
                const rowEnd = rowStart + round.span

                const pts = getRoundPoints(scoringConfig, match.round)
                return (
                  <div
                    key={match.id}
                    style={{
                      gridColumn: col,
                      gridRow: `${rowStart} / ${rowEnd}`,
                    }}
                    className="flex items-center"
                  >
                    {!match.homeTeam || !match.awayTeam ? (
                      <div className="w-full bg-gray-800/60 border border-gray-700/30 rounded-lg py-3 text-center text-xs text-gray-600">
                        <div className="text-emerald-400 font-semibold">{round.label}</div>
                        <div className="mt-1">{match.label}</div>
                        <div className="text-[10px] text-gray-500 mt-1">Por definir</div>
                        <div className="text-[9px] text-gray-600 mt-1">Gan: {pts.winner}pts | Exacto: {pts.exact}pts</div>
                      </div>
                    ) : (
                      <div className="w-full bg-gray-800/80 border border-gray-700/50 rounded-lg overflow-hidden text-xs">
                        <div className="px-2 py-0.5 bg-gray-700/50 text-[10px] font-mono flex items-center justify-between">
                          <span className="text-emerald-300 font-semibold">{round.label}</span>
                          <span className="text-gray-400">{match.label}</span>
                          <span className="text-gray-600">G:{pts.winner} E:{pts.exact}</span>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1.5 ${!canEdit ? "opacity-60" : ""}`}>
                          <span className="text-gray-200 text-xs shrink-0 w-24 truncate text-right">{home?.flag} {home?.name ?? "—"}</span>
                          <ScoreSelect
                            value={match.homeScore}
                            disabled={!canEdit}
                            onChange={(v) => setKnockoutScore(match.id, v, match.awayScore)}
                          />
                          <span className="text-gray-500 text-[10px]">-</span>
                          <ScoreSelect
                            value={match.awayScore}
                            disabled={!canEdit}
                            onChange={(v) => setKnockoutScore(match.id, match.homeScore, v)}
                          />
                          <span className="text-gray-200 text-xs shrink-0 w-24 truncate text-left">{away?.flag} {away?.name ?? "—"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            })}

            {roundData.filter((r) => r.key !== "third").slice(0, -1).map((round, ri) => {
              const col = ri * 2 + 2
              const nextRound = roundData.filter((r) => r.key !== "third")[ri + 1]
              const s = round.span
              const pairCount = nextRound.matches.length
              return Array.from({ length: pairCount }, (_, ci) => {
                const top = 2 * ci * s + 1
                const bot = top + 2 * s

                return (
                  <div
                    key={`conn-${ri}-${ci}`}
                    style={{
                      gridColumn: col,
                      gridRow: `${top} / ${bot}`,
                    }}
                    className="relative flex items-center justify-center"
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="w-3 h-px bg-gray-600 shrink-0" />
                      <div className="w-px flex-1 bg-gray-600 relative">
                        <div className="absolute left-1/2 top-1/2 w-3 h-px bg-gray-600 -translate-y-1/2" />
                      </div>
                      <div className="w-3 h-px bg-gray-600 shrink-0" />
                    </div>
                  </div>
                )
              })
            })}

            {roundData.filter((r) => r.key === "third").map((round) =>
              round.matches.map((match) => {
                const home = match.homeTeam ? getTeamById(match.homeTeam) : undefined
                const away = match.awayTeam ? getTeamById(match.awayTeam) : undefined
                const pts = getRoundPoints(scoringConfig, match.round)
                return (
                  <div
                    key={match.id}
                    style={{ gridColumn: 9, gridRow: 17 / 20 }}
                    className="flex items-start pt-1"
                  >
                    <div className="w-full">
                      {!match.homeTeam || !match.awayTeam ? (
                        <div className="bg-gray-800/60 border border-gray-700/30 rounded-lg py-2 text-center text-[10px] text-gray-600">
                          <div className="text-emerald-400 font-semibold">{round.label}</div>
                          <div className="mt-1 text-[9px]">{match.label}</div>
                          <div className="text-[9px] text-gray-500 mt-1">Esperando semifinales</div>
                          <div className="text-[9px] text-gray-600 mt-0.5">G: {pts.winner} | E: {pts.exact}</div>
                        </div>
                      ) : (
                        <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg overflow-hidden text-xs">
                          <div className="px-2 py-0.5 bg-gray-700/50 text-[10px] font-mono flex items-center justify-between">
                            <span className="text-emerald-300 font-semibold">{round.label}</span>
                            <span className="text-gray-400">{match.label}</span>
                            <span className="text-gray-600">G:{pts.winner} E:{pts.exact}</span>
                          </div>
                          <div className={`flex items-center gap-1 px-2 py-1.5 ${!canEdit ? "opacity-60" : ""}`}>
                            <span className="text-gray-200 text-xs shrink-0 w-24 truncate text-right">{home?.flag} {home?.name ?? "—"}</span>
                            <ScoreSelect
                              value={match.homeScore}
                              disabled={!canEdit}
                              onChange={(v) => setKnockoutScore(match.id, v, match.awayScore)}
                            />
                            <span className="text-gray-500 text-[10px]">-</span>
                            <ScoreSelect
                              value={match.awayScore}
                              disabled={!canEdit}
                              onChange={(v) => setKnockoutScore(match.id, match.homeScore, v)}
                            />
                            <span className="text-gray-200 text-xs shrink-0 w-24 truncate text-left">{away?.flag} {away?.name ?? "—"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoreSelect({
  value,
  onChange,
  disabled,
}: {
  value: number | null
  onChange: (v: number | null) => void
  disabled?: boolean
}) {
  return (
    <select
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value === "" ? null : parseInt(e.target.value))}
      className={`w-10 text-center bg-gray-700 border border-gray-600 rounded text-[10px] text-white py-0.5 appearance-none
        ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
        hover:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30`}
    >
      <option value="">-</option>
      {Array.from({ length: 16 }, (_, i) => (
        <option key={i} value={i}>{i}</option>
      ))}
    </select>
  )
}
