import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Participant } from "@/models/Participant"
import { ResultModel } from "@/models/Result"
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

    const adminR32Teams = new Set<string>()
    for (const match of (result as any).fifaKnockout ?? []) {
      if (match.round === "r32") {
        if (match.homeTeam) adminR32Teams.add(match.homeTeam)
        if (match.awayTeam) adminR32Teams.add(match.awayTeam)
      }
    }

    if (adminR32Teams.size === 0) {
      return NextResponse.json({ error: "No hay equipos asignados en la fase FIFA de dieciseisavos" }, { status: 400 })
    }

    const r32TeamBonus: Record<string, number> = {}
    const r32TeamBonusDetail: Record<string, string[]> = {}

    for (const p of participants) {
      const userTeams = new Set<string>()
      const groups = (p as any).groups ?? []
      for (const g of groups) {
        for (const pos of ["first", "second", "third", "fourth"] as const) {
          if (g[pos]) userTeams.add(g[pos])
        }
      }

      const matched: string[] = []
      for (const team of userTeams) {
        if (adminR32Teams.has(team)) {
          matched.push(team)
        }
      }

      r32TeamBonus[(p as any).name] = matched.length * 3
      r32TeamBonusDetail[(p as any).name] = matched
    }

    await ResultModel.findOneAndUpdate(
      {},
      { $set: { r32TeamBonus, r32TeamBonusDetail } },
      { upsert: true }
    )

    return NextResponse.json({ r32TeamBonus, r32TeamBonusDetail })
  } catch (error) {
    console.error("R32TeamBonus error:", error)
    return NextResponse.json({ error: "Error al calcular bonus de equipos en dieciseisavos" }, { status: 500 })
  }
}
