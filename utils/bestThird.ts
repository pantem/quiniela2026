import { GroupPrediction, Team } from "@/app/types"
import { getTeamById } from "./teams"

export interface ThirdPlaceEntry {
  groupId: string
  teamId: string | null
  teamName: string
  points: number
  gd: number
  gf: number
}

export function getBestThirdPlaced(
  predictions: GroupPrediction[]
): ThirdPlaceEntry[] {
  const thirdPlaced: ThirdPlaceEntry[] = predictions
    .filter((g) => g.third !== null)
    .map((g) => {
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
    return b.gf - a.gf
  })

  return thirdPlaced.slice(0, 8)
}
