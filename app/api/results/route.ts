import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { ResultModel } from "@/models/Result"
import { verifyToken, getTokenFromRequest, unauthorized, forbidden } from "@/lib/auth"

export async function GET() {
  try {
    await connectDB()
    const result = await ResultModel.findOne().sort({ updatedAt: -1 }).lean()
    return NextResponse.json(result ?? { groups: [], matchScores: [], knockout: [], bonuses: { finalist: null, champion: null, topScorer: null }, locked: false })
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
    const { groups, matchScores, knockout, bonuses, scoringConfig, locked } = body

    if (!groups || !bonuses) {
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
      result.bonuses = bonuses
      result.scoringConfig = scoringConfig ?? null
      if (typeof locked === "boolean") result.locked = locked
      await result.save()
      return NextResponse.json(result)
    }

    result = await ResultModel.create({
      groups,
      matchScores: matchScores ?? [],
      knockout: knockout ?? [],
      bonuses,
      scoringConfig: scoringConfig ?? null,
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
