import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Participant } from "@/models/Participant"
import { ResultModel } from "@/models/Result"
import { User } from "@/models/User"
import { verifyToken, getTokenFromRequest, unauthorized } from "@/lib/auth"
import type { PhaseLocks, KnockoutMatch } from "@/app/types"
import { DEFAULT_PHASE_LOCKS } from "@/app/types"
import { buildChangelogEntry } from "@/lib/changelog-diff"

async function getAuthedName(req: Request): Promise<string | null> {
  const token = getTokenFromRequest(req)
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  await connectDB()
  const user = await User.findById(payload.userId).select("name").lean()
  return user?.name ?? null
}

export async function GET() {
  try {
    await connectDB()
    const participants = await Participant.find().sort({ name: 1 }).lean()
    return NextResponse.json(participants)
  } catch (error) {
    console.error("Error fetching participants:", error)
    return NextResponse.json(
      { error: "Error al obtener participantes" },
      { status: 500 }
    )
  }
}

async function getPhaseLocks(): Promise<PhaseLocks> {
  try {
    const result = await ResultModel.findOne().sort({ updatedAt: -1 }).lean() as any
    return result?.phaseLocks ?? { ...DEFAULT_PHASE_LOCKS }
  } catch {
    return { ...DEFAULT_PHASE_LOCKS }
  }
}

export async function POST(req: Request) {
  try {
    const authedName = await getAuthedName(req)
    if (!authedName) return unauthorized()

    await connectDB()
    const body = await req.json()
    let { name, groups, matchPredictions, knockout, fifaKnockout, bonuses } = body

    if (name !== authedName) {
      return NextResponse.json({ error: "No puedes guardar datos de otro usuario" }, { status: 403 })
    }

    if (!name || !groups) {
      return NextResponse.json(
        { error: "Faltan datos requeridos (name, groups)" },
        { status: 400 }
      )
    }

    const locks = await getPhaseLocks()

    const existing = await Participant.findOne({ name })
    if (existing) {
      const userPerms = (existing as any).phasePermissions
      const canEditPhase = (phase: string) => {
        if (!userPerms) return existing.canEdit !== false
        const setting = userPerms[phase]
        if (setting === true) return true
        if (setting === false) return false
        return true
      }
      const finalGroups = canEditPhase('groups') ? groups : existing.groups
      const finalMatchPredictions = canEditPhase('groups') ? (matchPredictions ?? []) : (existing.matchPredictions ?? [])
      const finalBonuses = canEditPhase('bonuses') ? bonuses : existing.bonuses
      const existingKnockout = existing.knockout ?? []
      const finalKnockout = (knockout ?? []).map((m: KnockoutMatch) => {
        if (!canEditPhase(m.round)) {
          return existingKnockout.find((e: KnockoutMatch) => e.id === m.id) ?? m
        }
        return m
      })
      const existingFifaKnockout = existing.fifaKnockout ?? []
      const finalFifaKnockout = (fifaKnockout ?? []).map((m: KnockoutMatch) => {
        const round = m.round
        const lockKey = `fifa${round.charAt(0).toUpperCase()}${round.slice(1)}` as keyof PhaseLocks
        if (!canEditPhase(lockKey)) {
          return existingFifaKnockout.find((e: KnockoutMatch) => e.id === m.id) ?? m
        }
        return m
      })
      const entry = buildChangelogEntry(
        { groups: existing.groups, matchPredictions: existing.matchPredictions ?? [], knockout: existingKnockout, fifaKnockout: existingFifaKnockout, bonuses: existing.bonuses ?? {} },
        { groups: finalGroups, matchPredictions: finalMatchPredictions, knockout: finalKnockout, fifaKnockout: finalFifaKnockout, bonuses: finalBonuses }
      )
      if (entry) existing.changelog.push(entry)
      existing.groups = finalGroups
      existing.matchPredictions = finalMatchPredictions
      existing.knockout = finalKnockout
      existing.fifaKnockout = finalFifaKnockout
      existing.bonuses = finalBonuses
      await existing.save()
      return NextResponse.json(existing)
    }

    const participant = await Participant.create({
      name,
      groups,
      matchPredictions: matchPredictions ?? [],
      knockout: knockout ?? [],
      fifaKnockout: fifaKnockout ?? [],
      bonuses,
    })

    return NextResponse.json(participant, { status: 201 })
  } catch (error) {
    console.error("Error saving participant:", error)
    return NextResponse.json(
      { error: "Error al guardar participante" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const authedName = await getAuthedName(req)
    if (!authedName) return unauthorized()

    await connectDB()
    const body = await req.json()
    let { name, groups, matchPredictions, knockout, fifaKnockout, bonuses } = body

    if (name !== authedName) {
      return NextResponse.json({ error: "No puedes modificar datos de otro usuario" }, { status: 403 })
    }

    if (!name) {
      return NextResponse.json(
        { error: "Nombre requerido" },
        { status: 400 }
      )
    }

    const locks = await getPhaseLocks()
    const existing = await Participant.findOne({ name })

    if (existing) {
      const userPerms = (existing as any).phasePermissions
      const canEditPhase = (phase: string) => {
        if (!userPerms) return existing.canEdit !== false
        const setting = userPerms[phase]
        if (setting === true) return true
        if (setting === false) return false
        return true
      }
      const finalGroups = canEditPhase('groups') ? groups : existing.groups
      const finalMatchPredictions = canEditPhase('groups') ? (matchPredictions ?? []) : (existing.matchPredictions ?? [])
      const finalBonuses = canEditPhase('bonuses') ? bonuses : existing.bonuses
      const existingKnockout = existing.knockout ?? []
      const finalKnockout = (knockout ?? []).map((m: KnockoutMatch) => {
        if (!canEditPhase(m.round)) {
          return existingKnockout.find((e: KnockoutMatch) => e.id === m.id) ?? m
        }
        return m
      })
      const existingFifaKnockout = existing.fifaKnockout ?? []
      const finalFifaKnockout = (fifaKnockout ?? []).map((m: KnockoutMatch) => {
        const round = m.round
        const lockKey = `fifa${round.charAt(0).toUpperCase()}${round.slice(1)}` as keyof PhaseLocks
        if (!canEditPhase(lockKey)) {
          return existingFifaKnockout.find((e: KnockoutMatch) => e.id === m.id) ?? m
        }
        return m
      })
      const entry = buildChangelogEntry(
        { groups: existing.groups, matchPredictions: existing.matchPredictions ?? [], knockout: existingKnockout, fifaKnockout: existingFifaKnockout, bonuses: existing.bonuses ?? {} },
        { groups: finalGroups, matchPredictions: finalMatchPredictions, knockout: finalKnockout, fifaKnockout: finalFifaKnockout, bonuses: finalBonuses }
      )
      const update: Record<string, any> = {
        $set: {
          groups: finalGroups,
          matchPredictions: finalMatchPredictions,
          knockout: finalKnockout,
          fifaKnockout: finalFifaKnockout,
          bonuses: finalBonuses,
        },
      }
      if (entry) {
        update.$push = { changelog: entry }
      }
      const participant = await Participant.findOneAndUpdate({ name }, update, { new: true })
      if (!participant) {
        return NextResponse.json(
          { error: "Participante no encontrado" },
          { status: 404 }
        )
      }
      return NextResponse.json(participant)
    }

    // New participant (no existing) - just create without changelog
    const participant = await Participant.create({
      name,
      groups,
      matchPredictions: matchPredictions ?? [],
      knockout: knockout ?? [],
      fifaKnockout: fifaKnockout ?? [],
      bonuses,
    })
    return NextResponse.json(participant, { status: 201 })
  } catch (error) {
    console.error("Error updating participant:", error)
    return NextResponse.json(
      { error: "Error al actualizar participante" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const name = searchParams.get("name")

    if (!name) {
      return NextResponse.json(
        { error: "Nombre requerido" },
        { status: 400 }
      )
    }

    await Participant.findOneAndDelete({ name })
    return NextResponse.json({ message: "Participante eliminado" })
  } catch (error) {
    console.error("Error deleting participant:", error)
    return NextResponse.json(
      { error: "Error al eliminar participante" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return unauthorized()
    const payload = verifyToken(token)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 })
    }

    await connectDB()
    const body = await req.json()
    const { name, penalties, canEdit, phasePermissions } = body

    if (!name) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })
    }

    const update: Record<string, any> = {}
    if (typeof penalties === "number") update.penalties = penalties
    if (typeof canEdit === "boolean") update.canEdit = canEdit
    if (phasePermissions) update.phasePermissions = phasePermissions

    const participant = await Participant.findOneAndUpdate(
      { name },
      { $set: update },
      { new: true }
    )

    if (!participant) {
      return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 })
    }

    return NextResponse.json(participant)
  } catch (error) {
    console.error("Error updating participant:", error)
    return NextResponse.json(
      { error: "Error al actualizar participante" },
      { status: 500 }
    )
  }
}
