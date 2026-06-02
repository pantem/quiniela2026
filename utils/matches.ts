import { groups, getTeamsByGroup, getTeamById } from "./teams"

export interface GroupMatch {
  id: string
  groupId: string
  homeTeam: string
  awayTeam: string
  matchNumber: number
}

export function getAllGroupMatches(): GroupMatch[] {
  const matches: GroupMatch[] = []
  let matchNumber = 1

  for (const group of groups) {
    const groupTeams = getTeamsByGroup(group.id)
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        matches.push({
          id: `${group.id}_${i}_${j}`,
          groupId: group.id,
          homeTeam: groupTeams[i].id,
          awayTeam: groupTeams[j].id,
          matchNumber,
        })
        matchNumber++
      }
    }
  }

  return matches
}

export function getGroupMatches(groupId: string): GroupMatch[] {
  return getAllGroupMatches().filter((m) => m.groupId === groupId)
}

export interface MatchScore {
  id: string
  groupId: string
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
}

export function computeStandingsFromMatches(
  matches: MatchScore[]
): Array<{
  teamId: string
  points: number
  gd: number
  gf: number
  ga: number
}> {
  const standings = new Map<
    string,
    { points: number; gd: number; gf: number; ga: number }
  >()

  for (const match of matches) {
    if (match.homeScore === null || match.awayScore === null) continue

    if (!standings.has(match.homeTeam)) {
      standings.set(match.homeTeam, { points: 0, gd: 0, gf: 0, ga: 0 })
    }
    if (!standings.has(match.awayTeam)) {
      standings.set(match.awayTeam, { points: 0, gd: 0, gf: 0, ga: 0 })
    }

    const h = standings.get(match.homeTeam)!
    const a = standings.get(match.awayTeam)!

    h.gf += match.homeScore
    h.ga += match.awayScore
    a.gf += match.awayScore
    a.ga += match.homeScore

    if (match.homeScore > match.awayScore) {
      h.points += 3
    } else if (match.homeScore < match.awayScore) {
      a.points += 3
    } else {
      h.points += 1
      a.points += 1
    }
  }

  const sorted = Array.from(standings.entries()).map(([teamId, stats]) => ({
    teamId,
    ...stats,
    gd: stats.gf - stats.ga,
  }))

  sorted.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.teamId.localeCompare(b.teamId)
  })

  return sorted
}

export function buildGroupResultsFromScores(
  matchScores: MatchScore[]
): Array<{
  groupId: string
  first: string | null
  second: string | null
  third: string | null
  fourth: string | null
}> {
  const byGroup = new Map<string, MatchScore[]>()
  for (const m of matchScores) {
    if (!byGroup.has(m.groupId)) byGroup.set(m.groupId, [])
    byGroup.get(m.groupId)!.push(m)
  }

  const results: Array<{
    groupId: string
    first: string | null
    second: string | null
    third: string | null
    fourth: string | null
  }> = []

  for (const [groupId, groupMatches] of byGroup) {
    const standings = computeStandingsFromMatches(groupMatches)
    results.push({
      groupId,
      first: standings[0]?.teamId ?? null,
      second: standings[1]?.teamId ?? null,
      third: standings[2]?.teamId ?? null,
      fourth: standings[3]?.teamId ?? null,
    })
  }

  return results
}
