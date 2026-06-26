import { getTeamById } from "@/utils/teams"
import type { IChangelogEntry } from "@/models/Participant"

function compareMatchScores(oldArr: any[], newArr: any[]): string[] {
  const out: string[] = []
  for (const n of newArr) {
    const o = oldArr.find((x: any) => x.id === n.id)
    if (!o || (o.homeScore === n.homeScore && o.awayScore === n.awayScore)) continue
    const home = getTeamById(n.homeTeam)
    const away = getTeamById(n.awayTeam)
    const oldStr = o.homeScore != null ? `${o.homeScore}-${o.awayScore}` : "⊕"
    const newStr = n.homeScore != null ? `${n.homeScore}-${n.awayScore}` : "⊕"
    out.push(`${home?.flag ?? "?"}${n.homeTeam} ${oldStr}→${newStr} vs ${away?.flag ?? "?"}${n.awayTeam}`)
    if (out.length >= 10) break
  }
  if (out.length === 10) {
    const total = newArr.filter((n: any) => {
      const o = oldArr.find((x: any) => x.id === n.id)
      return o && (o.homeScore !== n.homeScore || o.awayScore !== n.awayScore)
    }).length
    out[out.length - 1] = `... y ${total - 9} cambios más en marcadores`
  }
  return out
}

function compareGroups(oldArr: any[], newArr: any[]): string[] {
  const out: string[] = []
  const pos = ["first", "second", "third", "fourth"] as const
  const posLabel: Record<string, string> = { first: "1°", second: "2°", third: "3°", fourth: "4°" }
  for (const n of newArr) {
    const o = oldArr.find((x: any) => x.groupId === n.groupId)
    if (!o) continue
    const line: string[] = []
    for (const p of pos) {
      if (o[p] !== n[p]) line.push(`${posLabel[p]} ${o[p] ?? "?"}→${n[p] ?? "?"}`)
    }
    if (line.length) out.push(`Grupo ${n.groupId}: ${line.join(", ")}`)
  }
  return out
}

function compareKnockout(oldArr: any[], newArr: any[]): string[] {
  const out: string[] = []
  for (const n of newArr) {
    const o = oldArr.find((x: any) => x.id === n.id)
    if (!o) continue
    const parts: string[] = []
    if (o.homeScore !== n.homeScore || o.awayScore !== n.awayScore) {
      const os = o.homeScore != null ? `${o.homeScore}-${o.awayScore}` : "⊕"
      const ns = n.homeScore != null ? `${n.homeScore}-${n.awayScore}` : "⊕"
      parts.push(`${os}→${ns}`)
    }
    if (o.winner !== n.winner) parts.push(`ganador ${o.winner ?? "?"}→${n.winner ?? "?"}`)
    if (parts.length) out.push(`${n.round} #${n.id}: ${parts.join(", ")}`)
  }
  return out
}

function compareBonuses(oldB: any, newB: any): string[] {
  const out: string[] = []
  const keys: Record<string, string> = {
    bestGoalkeeper: "Portero",
    topScorer: "Goleador",
    bestPlayer: "Jugador",
  }
  for (const [k, label] of Object.entries(keys)) {
    const o = oldB?.[k]
    const n = newB?.[k]
    if (o !== n) out.push(`${label}: ${o ?? "?"}→${n ?? "?"}`)
  }
  return out
}

export function buildChangelogEntry(
  existing: { groups: any[]; matchPredictions?: any[]; knockout?: any[]; fifaKnockout?: any[]; bonuses?: any },
  incoming: { groups: any[]; matchPredictions?: any[]; knockout?: any[]; fifaKnockout?: any[]; bonuses?: any }
): IChangelogEntry | null {
  const parts = [
    ...compareMatchScores(existing.matchPredictions ?? [], incoming.matchPredictions ?? []),
    ...compareGroups(existing.groups, incoming.groups),
    ...compareKnockout(existing.knockout ?? [], incoming.knockout ?? []),
    ...compareKnockout(existing.fifaKnockout ?? [], incoming.fifaKnockout ?? []),
    ...compareBonuses(existing.bonuses ?? {}, incoming.bonuses ?? {}),
  ]
  if (parts.length === 0) return null
  return { timestamp: new Date(), changes: parts.join(" │ ") }
}
