import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Participant } from "@/models/Participant"
import { ResultModel } from "@/models/Result"
import {
  calculateGroupPoints,
  calculateKnockoutPoints,
  calculateMatchScorePoints,
  calculateBonusPoints,
} from "@/lib/scoring"
import { verifyToken, getTokenFromRequest, unauthorized, forbidden } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return unauthorized()
    const payload = verifyToken(token)
    if (!payload || payload.role !== "admin") return forbidden()

    await connectDB()
    const participants = await Participant.find().lean()
    const result = await ResultModel.findOne().lean()
    if (!result) {
      return NextResponse.json({ error: "No hay resultados oficiales" }, { status: 400 })
    }

    const scores = result.matchScores ?? []
    const totalScores = scores.length
    const completedScores = scores.filter((s: any) => s.homeScore !== null && s.awayScore !== null).length
    if (completedScores < totalScores) {
      return NextResponse.json(
        { error: `Faltan ${totalScores - completedScores} marcadores de grupo por ingresar` },
        { status: 400 }
      )
    }

    const scored = await Promise.all(
      participants.map(async (p: any) => {
        const matchPoints = await calculateMatchScorePoints(
          p.matchPredictions ?? [],
          result.matchScores ?? []
        )
        const groupPoints = await calculateGroupPointsForAll(p.groups, result.groups)
        const knockoutPoints = await calculateKnockoutPoints(
          p.knockout ?? [],
          result.knockout ?? []
        )
        const bonusPoints = await calculateBonusPoints(
          p.bonuses ?? { bestGoalkeeper: null, topScorer: null, bestPlayer: null },
          result.bonuses ?? { bestGoalkeeper: null, topScorer: null, bestPlayer: null }
        )
        return {
          name: p.name,
          total: matchPoints + groupPoints + knockoutPoints + bonusPoints,
        }
      })
    )

    scored.sort((a, b) => b.total - a.total)
    const n = scored.length

    const autoBonuses: Record<string, number> = {}
    if (n >= 1) autoBonuses[scored[0].name] = (autoBonuses[scored[0].name] ?? 0) + 10
    if (n >= 3) autoBonuses[scored[n - 3].name] = (autoBonuses[scored[n - 3].name] ?? 0) + 10
    if (n >= 2) autoBonuses[scored[n - 2].name] = (autoBonuses[scored[n - 2].name] ?? 0) + 20
    if (n >= 1) autoBonuses[scored[n - 1].name] = (autoBonuses[scored[n - 1].name] ?? 0) + 30

    await ResultModel.findOneAndUpdate(
      {},
      { $set: { autoBonuses } },
      { upsert: true }
    )

    return NextResponse.json({ autoBonuses, ranking: scored })
  } catch (error) {
    console.error("AutoBonuses error:", error)
    return NextResponse.json({ error: "Error al calcular bonos automáticos" }, { status: 500 })
  }
}

async function calculateGroupPointsForAll(
  predictions: any[],
  results: any[]
): Promise<number> {
  let total = 0
  for (const pred of predictions) {
    const actual = results.find((r: any) => r.groupId === pred.groupId)
    if (actual) total += await calculateGroupPoints(pred, actual)
  }
  return total
}
