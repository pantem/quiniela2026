import { GroupPrediction } from "@/app/types"
import { getTeamById } from "./teams"
import { computeStandingsFromMatches, MatchScore } from "./matches"

export interface ThirdPlaceEntry {
  groupId: string
  teamId: string | null
  teamName: string
  points: number
  gd: number
  gf: number
}

export function getBestThirdPlaced(
  predictions: GroupPrediction[],
  matchScores?: MatchScore[]
): ThirdPlaceEntry[] {
  const withThird = predictions.filter((g) => g.third !== null)
  if (withThird.length === 0) return []

  if (matchScores && matchScores.length > 0) {
    const allStandings = computeStandingsFromMatches(matchScores)
    const byTeam = new Map(allStandings.map((s) => [s.teamId, s]))

    const thirdPlaced: ThirdPlaceEntry[] = withThird.map((g) => {
      const team = getTeamById(g.third)
      const stats = byTeam.get(g.third!)
      return {
        groupId: g.groupId,
        teamId: g.third,
        teamName: team?.name ?? "",
        points: stats?.points ?? 3,
        gd: stats?.gd ?? 0,
        gf: stats?.gf ?? 1,
      }
    })

    thirdPlaced.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.gd !== a.gd) return b.gd - a.gd
      if (b.gf !== a.gf) return b.gf - a.gf
      return a.groupId.localeCompare(b.groupId)
    })

    return thirdPlaced.slice(0, 8)
  }

  const thirdPlaced: ThirdPlaceEntry[] = withThird.map((g) => {
    const team = getTeamById(g.third)
    return {
      groupId: g.groupId,
      teamId: g.third,
      teamName: team?.name ?? "",
      points: 3,
      gd: 0,
      gf: 1,
    }
  })

  thirdPlaced.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.groupId.localeCompare(b.groupId)
  })

  return thirdPlaced.slice(0, 8)
}
