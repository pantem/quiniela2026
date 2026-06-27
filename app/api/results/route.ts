import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { ResultModel } from "@/models/Result"
import { verifyToken, getTokenFromRequest, unauthorized, forbidden } from "@/lib/auth"

export async function GET() {
  try {
    await connectDB()
    const result = await ResultModel.findOne().sort({ updatedAt: -1 }).lean()
    return NextResponse.json(result ?? { groups: [], matchScores: [], knockout: [], bonuses: { bestGoalkeeper: null, topScorer: null, bestPlayer: null }, locked: false, autoBonuses: {}, r32TeamBonus: {}, r32TeamBonusDetail: {} })
  } catch (error) {
    console.error("Error fetching results:", error)
    return NextResponse.json(
      { error: "Error al obtener resultados" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return unauthorized()
    const payload = verifyToken(token)
    if (!payload) return unauthorized()
    if (payload.role !== "admin") return forbidden()

    await connectDB()
    const body = await req.json()
    const { groups, matchScores, knockout, fifaKnockout, bonuses, scoringConfig, phaseLocks, autoBonuses, r32TeamBonus, r32TeamBonusDetail } = body

    if (!groups) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      )
    }

    let result = await ResultModel.findOne()
    if (result) {
      result.groups = groups
      result.matchScores = matchScores ?? []
      result.knockout = knockout ?? []
      result.fifaKnockout = fifaKnockout ?? []
      result.bonuses = bonuses ?? { bestGoalkeeper: null, topScorer: null, bestPlayer: null }
      result.scoringConfig = scoringConfig ?? null
      if (phaseLocks) result.phaseLocks = phaseLocks
      if (autoBonuses) result.autoBonuses = autoBonuses
      if (r32TeamBonus) result.r32TeamBonus = r32TeamBonus
      if (r32TeamBonusDetail) result.r32TeamBonusDetail = r32TeamBonusDetail
      await result.save()
      return NextResponse.json(result)
    }

    result = await ResultModel.create({
      groups,
      matchScores: matchScores ?? [],
      knockout: knockout ?? [],
      fifaKnockout: fifaKnockout ?? [],
      bonuses: bonuses ?? { bestGoalkeeper: null, topScorer: null, bestPlayer: null },
      scoringConfig: scoringConfig ?? null,
      phaseLocks: phaseLocks ?? { groups: false, r32: false, r16: false, qf: false, sf: false, final: false, bonuses: false },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error saving results:", error)
    return NextResponse.json(
      { error: "Error al guardar resultados" },
      { status: 500 }
    )
  }
}
