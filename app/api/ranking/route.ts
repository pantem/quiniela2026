import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Participant } from "@/models/Participant"
import { ResultModel } from "@/models/Result"
import {
  calculateGroupPoints,
  calculateKnockoutPoints,
  calculateBonusPoints,
  calculateMatchScorePoints,
} from "@/lib/scoring"

export async function GET() {
  try {
    await connectDB()

    const participants = await Participant.find().lean()
    const result = await ResultModel.findOne().lean()

    if (!result) {
      return NextResponse.json({
        ranking: participants.map((p) => ({
          name: p.name,
          groupPoints: 0,
          knockoutPoints: 0,
          bonusPoints: 0,
          total: 0,
        })),
        hasResults: false,
      })
    }

    const ranking = participants.map((p) => {
      const matchPoints = calculateMatchScorePoints(
        p.matchPredictions ?? [],
        result.matchScores ?? []
      )
      const groupPoints = calculateGroupPointsForAll(
        p.groups,
        result.groups
      )
      const knockoutPoints = calculateKnockoutPoints(
        p.knockout,
        result.knockout
      )
      const bonusPoints = calculateBonusPoints(
        p.bonuses,
        result.bonuses
      )

      return {
        name: p.name,
        matchPoints,
        groupPoints,
        knockoutPoints,
        bonusPoints,
        total: matchPoints + groupPoints + knockoutPoints + bonusPoints,
      }
    })

    ranking.sort((a, b) => b.total - a.total)

    return NextResponse.json({ ranking, hasResults: true })
  } catch (error) {
    console.error("Error computing ranking:", error)
    return NextResponse.json(
      { error: "Error al calcular ranking" },
      { status: 500 }
    )
  }
}

function calculateGroupPointsForAll(
  predictions: Array<{
    groupId: string
    first: string | null
    second: string | null
    third: string | null
    fourth: string | null
  }>,
  results: Array<{
    groupId: string
    first: string | null
    second: string | null
    third: string | null
    fourth: string | null
  }>
): number {
  let total = 0
  for (const pred of predictions) {
    const actual = results.find((r) => r.groupId === pred.groupId)
    if (actual) {
      total += calculateGroupPoints(pred, actual)
    }
  }
  return total
}
