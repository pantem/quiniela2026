import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { ResultModel } from "@/models/Result"

export async function GET() {
  try {
    await connectDB()
    const result = await ResultModel.findOne().sort({ updatedAt: -1 }).lean()
    return NextResponse.json(result ?? { groups: [], matchScores: [], knockout: [], bonuses: { finalist: null, champion: null, topScorer: null } })
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
    await connectDB()
    const body = await req.json()
    const { groups, matchScores, knockout, bonuses } = body

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
      await result.save()
      return NextResponse.json(result)
    }

    result = await ResultModel.create({
      groups,
      matchScores: matchScores ?? [],
      knockout: knockout ?? [],
      bonuses,
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
