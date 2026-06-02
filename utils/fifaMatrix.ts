import { KnockoutMatch, GroupPrediction } from "@/app/types"

interface KnockoutSlot {
  matchId: string
  round: 'r32' | 'r16' | 'qf' | 'sf' | 'final'
  homeLabel: string
  awayLabel: string
  homeSource: string
  awaySource: string
  label: string
}

export function buildFifaMatrix(
  groupPredictions: GroupPrediction[],
  thirdQualifiers: string[]
): KnockoutMatch[] {
  const groupMap = new Map(groupPredictions.map((g) => [g.groupId, g]))
  const matches: KnockoutMatch[] = []

  const slots = getKnockoutSlots()
  const bestThird = new Set(thirdQualifiers)

  for (const slot of slots) {
    const homeTeam = resolveTeam(slot.homeSource, groupMap, bestThird)
    const awayTeam = resolveTeam(slot.awaySource, groupMap, bestThird)
    matches.push({
      id: slot.matchId,
      round: slot.round,
      homeTeam,
      awayTeam,
      homeScore: null,
      awayScore: null,
      winner: null,
      label: slot.label,
    })
  }

  return matches
}

function resolveTeam(
  source: string,
  groupMap: Map<string, GroupPrediction>,
  bestThird: Set<string>
): string | null {
  const match = source.match(/^(\d+)([A-Z])$/)
  if (match) {
    const pos = parseInt(match[1])
    const groupId = match[2]
    const group = groupMap.get(groupId)
    if (!group) return null
    const positionMap: Record<number, keyof GroupPrediction> = {
      1: "first",
      2: "second",
      3: "third",
      4: "fourth",
    }
    const key = positionMap[pos]
    const team = group[key]

    if (pos === 3) {
      if (typeof team === "string" && bestThird.has(team)) {
        return team
      }
      return null
    }
    return typeof team === "string" ? team : null
  }

  const wMatch = source.match(/^W(\d+)$/)
  if (wMatch) {
    return null
  }

  return null
}

function getKnockoutSlots(): KnockoutSlot[] {
  return [
    ...getR32Slots(),
    ...getR16Slots(),
    ...getQfSlots(),
    ...getSfSlots(),
    ...getFinalSlots(),
  ]
}

function getR32Slots(): KnockoutSlot[] {
  return [
    { matchId: "R32_01", round: "r32", homeLabel: "1A", awayLabel: "3C", homeSource: "1A", awaySource: "3C", label: "R32-1" },
    { matchId: "R32_02", round: "r32", homeLabel: "1B", awayLabel: "3A", homeSource: "1B", awaySource: "3A", label: "R32-2" },
    { matchId: "R32_03", round: "r32", homeLabel: "1C", awayLabel: "3D", homeSource: "1C", awaySource: "3D", label: "R32-3" },
    { matchId: "R32_04", round: "r32", homeLabel: "1D", awayLabel: "3E", homeSource: "1D", awaySource: "3E", label: "R32-4" },
    { matchId: "R32_05", round: "r32", homeLabel: "1E", awayLabel: "3F", homeSource: "1E", awaySource: "3F", label: "R32-5" },
    { matchId: "R32_06", round: "r32", homeLabel: "1F", awayLabel: "3G", homeSource: "1F", awaySource: "3G", label: "R32-6" },
    { matchId: "R32_07", round: "r32", homeLabel: "1G", awayLabel: "3H", homeSource: "1G", awaySource: "3H", label: "R32-7" },
    { matchId: "R32_08", round: "r32", homeLabel: "1H", awayLabel: "3I", homeSource: "1H", awaySource: "3I", label: "R32-8" },
    { matchId: "R32_09", round: "r32", homeLabel: "1I", awayLabel: "2J", homeSource: "1I", awaySource: "2J", label: "R32-9" },
    { matchId: "R32_10", round: "r32", homeLabel: "1J", awayLabel: "2K", homeSource: "1J", awaySource: "2K", label: "R32-10" },
    { matchId: "R32_11", round: "r32", homeLabel: "1K", awayLabel: "2L", homeSource: "1K", awaySource: "2L", label: "R32-11" },
    { matchId: "R32_12", round: "r32", homeLabel: "1L", awayLabel: "2I", homeSource: "1L", awaySource: "2I", label: "R32-12" },
    { matchId: "R32_13", round: "r32", homeLabel: "2A", awayLabel: "2B", homeSource: "2A", awaySource: "2B", label: "R32-13" },
    { matchId: "R32_14", round: "r32", homeLabel: "2C", awayLabel: "2D", homeSource: "2C", awaySource: "2D", label: "R32-14" },
    { matchId: "R32_15", round: "r32", homeLabel: "2E", awayLabel: "2F", homeSource: "2E", awaySource: "2F", label: "R32-15" },
    { matchId: "R32_16", round: "r32", homeLabel: "2G", awayLabel: "2H", homeSource: "2G", awaySource: "2H", label: "R32-16" },
  ]
}

function getR16Slots(): KnockoutSlot[] {
  return [
    { matchId: "R16_01", round: "r16", homeLabel: "W R32-1", awayLabel: "W R32-2", homeSource: "W1", awaySource: "W2", label: "R16-1" },
    { matchId: "R16_02", round: "r16", homeLabel: "W R32-3", awayLabel: "W R32-4", homeSource: "W3", awaySource: "W4", label: "R16-2" },
    { matchId: "R16_03", round: "r16", homeLabel: "W R32-5", awayLabel: "W R32-6", homeSource: "W5", awaySource: "W6", label: "R16-3" },
    { matchId: "R16_04", round: "r16", homeLabel: "W R32-7", awayLabel: "W R32-8", homeSource: "W7", awaySource: "W8", label: "R16-4" },
    { matchId: "R16_05", round: "r16", homeLabel: "W R32-9", awayLabel: "W R32-10", homeSource: "W9", awaySource: "W10", label: "R16-5" },
    { matchId: "R16_06", round: "r16", homeLabel: "W R32-11", awayLabel: "W R32-12", homeSource: "W11", awaySource: "W12", label: "R16-6" },
    { matchId: "R16_07", round: "r16", homeLabel: "W R32-13", awayLabel: "W R32-14", homeSource: "W13", awaySource: "W14", label: "R16-7" },
    { matchId: "R16_08", round: "r16", homeLabel: "W R32-15", awayLabel: "W R32-16", homeSource: "W15", awaySource: "W16", label: "R16-8" },
  ]
}

function getQfSlots(): KnockoutSlot[] {
  return [
    { matchId: "QF_01", round: "qf", homeLabel: "W R16-1", awayLabel: "W R16-2", homeSource: "W17", awaySource: "W18", label: "QF-1" },
    { matchId: "QF_02", round: "qf", homeLabel: "W R16-3", awayLabel: "W R16-4", homeSource: "W19", awaySource: "W20", label: "QF-2" },
    { matchId: "QF_03", round: "qf", homeLabel: "W R16-5", awayLabel: "W R16-6", homeSource: "W21", awaySource: "W22", label: "QF-3" },
    { matchId: "QF_04", round: "qf", homeLabel: "W R16-7", awayLabel: "W R16-8", homeSource: "W23", awaySource: "W24", label: "QF-4" },
  ]
}

function getSfSlots(): KnockoutSlot[] {
  return [
    { matchId: "SF_01", round: "sf", homeLabel: "W QF-1", awayLabel: "W QF-2", homeSource: "W25", awaySource: "W26", label: "SF-1" },
    { matchId: "SF_02", round: "sf", homeLabel: "W QF-3", awayLabel: "W QF-4", homeSource: "W27", awaySource: "W28", label: "SF-2" },
  ]
}

function getFinalSlots(): KnockoutSlot[] {
  return [
    { matchId: "F_01", round: "final", homeLabel: "W SF-1", awayLabel: "W SF-2", homeSource: "W29", awaySource: "W30", label: "Final" },
  ]
}

export function getMatchesByRound(matches: KnockoutMatch[], round: string): KnockoutMatch[] {
  return matches.filter((m) => m.round === round)
}

const PROPAGATION: [string, number, string, number][] = [
  ["r32", 16, "r16", 8],
  ["r16", 8, "qf", 4],
  ["qf", 4, "sf", 2],
  ["sf", 2, "final", 1],
]

export function propagateWinners(matches: KnockoutMatch[]): KnockoutMatch[] {
  const byId = new Map(matches.map((m) => [m.id, { ...m }]))
  const sortKey = (id: string) => {
    const parts = id.split("_")
    return parseInt(parts[1]) || 0
  }

  for (const [fromRound, fromCount, toRound, toCount] of PROPAGATION) {
    const fromMatches = matches
      .filter((m) => m.round === fromRound)
      .sort((a, b) => sortKey(a.id) - sortKey(b.id))
    const toMatches = matches
      .filter((m) => m.round === toRound)
      .sort((a, b) => sortKey(a.id) - sortKey(b.id))

    for (let i = 0; i < toMatches.length && i * 2 + 1 < fromMatches.length; i++) {
      const target = toMatches[i]
      const homeSource = fromMatches[i * 2]
      const awaySource = fromMatches[i * 2 + 1]

      const updated: Partial<KnockoutMatch> = {}
      if (homeSource.winner) updated.homeTeam = homeSource.winner
      if (awaySource.winner) updated.awayTeam = awaySource.winner

      if (Object.keys(updated).length > 0) {
        const existing = byId.get(target.id)
        if (existing) {
          byId.set(target.id, { ...existing, ...updated })
        }
      }
    }
  }

  return matches.map((m) => byId.get(m.id) ?? m)
}
