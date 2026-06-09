"use client"

import { useQuinielaStore } from "@/store/store"
import { getTeamById } from "@/utils/teams"
import { getMatchesByRound } from "@/utils/fifaMatrix"
import { Swords } from "lucide-react"
import { DEFAULT_SCORING } from "@/app/types"

const ROUNDS = [
  { key: "r32" as const, label: "Dieciseisavos", matches: 16, span: 1 },
  { key: "r16" as const, label: "Octavos", matches: 8, span: 2 },
  { key: "qf" as const, label: "Cuartos", matches: 4, span: 4 },
  { key: "sf" as const, label: "Semifinales", matches: 2, span: 8 },
  { key: "final" as const, label: "Final", matches: 1, span: 16 },
]

function getRoundPoints(cfg: typeof DEFAULT_SCORING, round: string): { winner: number; exact: number } {
  switch (round) {
    case "r32": return { winner: cfg.r32Winner, exact: cfg.r32Exact }
    case "r16": return { winner: cfg.r16Winner, exact: cfg.r16Exact }
    case "qf": return { winner: cfg.qfWinner, exact: cfg.qfExact }
    case "sf": return { winner: cfg.sfWinner, exact: cfg.sfExact }
    case "final": return { winner: cfg.finalWinner, exact: cfg.finalExact }
    default: return { winner: 0, exact: 0 }
  }
}

function isValidWinner(match: { homeScore: number | null; awayScore: number | null; homeTeam: string | null; awayTeam: string | null }, teamId: string | null): boolean {
  if (!teamId) return true
  if (match.homeScore === null || match.awayScore === null) return true
  if (teamId === match.homeTeam) return match.homeScore > match.awayScore
  if (teamId === match.awayTeam) return match.awayScore > match.homeScore
  return false
}

function isDraw(match: { homeScore: number | null; awayScore: number | null }): boolean {
  if (match.homeScore === null || match.awayScore === null) return false
  return match.homeScore === match.awayScore
}

export default function BracketView() {
  const { knockout, setKnockoutWinner, setKnockoutScore, phaseLocks, results } = useQuinielaStore()
  const scoringConfig = results.scoringConfig ?? DEFAULT_SCORING

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

  const roundData = ROUNDS.map((r) => ({
    ...r,
    matches: getMatches(r.key),
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Swords className="w-6 h-6 text-emerald-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Fases Finales</h2>
          <p className="text-sm text-gray-400">
            Visualización tipo bracket — predice marcadores y ganadores
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[900px]">
          <div
            className="grid gap-0"
            style={{
              gridTemplateColumns: "1fr 24px 1fr 24px 1fr 24px 1fr 24px 1fr",
              gridTemplateRows: `repeat(16, minmax(0, 1fr))`,
            }}
          >
            {roundData.map((round, ri) => {
              const col = ri * 2 + 1
              return round.matches.map((match, mi) => {
                const home = match.homeTeam ? getTeamById(match.homeTeam) : undefined
                const away = match.awayTeam ? getTeamById(match.awayTeam) : undefined
                const homeWinner = match.winner === match.homeTeam
                const awayWinner = match.winner === match.awayTeam
                const homeInvalid = homeWinner && (isDraw(match) || (match.awayScore !== null && match.homeScore !== null && match.homeScore! <= match.awayScore!))
                const awayInvalid = awayWinner && (isDraw(match) || (match.homeScore !== null && match.awayScore !== null && match.awayScore! <= match.homeScore!))
                const rowStart = mi * round.span + 1
                const rowEnd = rowStart + round.span

                const handleSelectWinner = (teamId: string) => {
                  if (phaseLocks[match.round]) return
                  const same = match.winner === teamId
                  const nextTeam = same ? null : teamId
                  if (nextTeam && !isValidWinner(match, nextTeam)) return
                  setKnockoutWinner(match.id, nextTeam)
                }

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
                      <div className="px-2 py-0.5 bg-gray-700/50 text-[10px] font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-300 font-semibold truncate">{round.label}</span>
                          <span className="text-gray-400 ml-1 shrink-0">{match.label}</span>
                        </div>
                        <div className="text-[9px] text-gray-600 mt-0.5">Gan: {pts.winner}pts | Exacto: {pts.exact}pts</div>
                      </div>
                      <div
                        className={`flex items-center gap-1 px-2 py-1 transition-colors ${
                          phaseLocks[match.round] ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                        } ${
                          homeInvalid
                            ? "bg-red-900/30 text-red-300"
                            : homeWinner
                            ? "bg-purple-900/30 text-white font-semibold"
                            : "hover:bg-gray-700/50 text-gray-300"
                        }`}
                        onClick={() => handleSelectWinner(match.homeTeam!)}
                      >
                        <span>{home?.flag}</span>
                        <span className="flex-1 truncate">{home?.name ?? "—"}</span>
                        {homeWinner && !homeInvalid && <span className="text-purple-400 text-[10px]">✓</span>}
                        {homeInvalid && <span className="text-red-400 text-[10px]">✗</span>}
                      </div>
                      <div className="flex items-center justify-center gap-0.5 border-t border-gray-700/30 py-0.5">
                        <ScoreSelect
                          value={match.homeScore}
                          disabled={phaseLocks[match.round]}
                          onChange={(v) => setKnockoutScore(match.id, v, match.awayScore)}
                        />
                        <span className="text-gray-600 text-[10px]">-</span>
                        <ScoreSelect
                          value={match.awayScore}
                          disabled={phaseLocks[match.round]}
                          onChange={(v) => setKnockoutScore(match.id, match.homeScore, v)}
                        />
                      </div>
                      <div
                        className={`flex items-center gap-1 px-2 py-1 transition-colors border-t border-gray-700/30 ${
                          phaseLocks[match.round] ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                        } ${
                          awayInvalid
                            ? "bg-red-900/30 text-red-300"
                            : awayWinner
                            ? "bg-purple-900/30 text-white font-semibold"
                            : "hover:bg-gray-700/50 text-gray-300"
                        }`}
                        onClick={() => handleSelectWinner(match.awayTeam!)}
                      >
                        <span>{away?.flag}</span>
                        <span className="flex-1 truncate">{away?.name ?? "—"}</span>
                        {awayWinner && !awayInvalid && <span className="text-purple-400 text-[10px]">✓</span>}
                        {awayInvalid && <span className="text-red-400 text-[10px]">✗</span>}
                      </div>
                    </div>
                    )}
                  </div>
                )
              })
            })}

            {roundData.slice(0, -1).map((round, ri) => {
              const col = ri * 2 + 2
              const nextRound = roundData[ri + 1]
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
