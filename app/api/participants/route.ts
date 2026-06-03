import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Participant } from "@/models/Participant"
import { User } from "@/models/User"
import { verifyToken, getTokenFromRequest, unauthorized } from "@/lib/auth"

const LOCK_DATE = new Date("2026-06-11T00:00:00Z")

function isLocked(): boolean {
  return Date.now() >= LOCK_DATE.getTime()
}

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

export async function POST(req: Request) {
  try {
    const authedName = await getAuthedName(req)
    if (!authedName) return unauthorized()

    if (isLocked()) {
      return NextResponse.json(
        { error: "La quiniela está cerrada desde el 10 de junio. No se permiten más modificaciones." },
        { status: 403 }
      )
    }

    await connectDB()
    const body = await req.json()
    const { name, groups, matchPredictions, knockout } = body

    if (name !== authedName) {
      return NextResponse.json({ error: "No puedes guardar datos de otro usuario" }, { status: 403 })
    }

    if (!name || !groups) {
      return NextResponse.json(
        { error: "Faltan datos requeridos (name, groups)" },
        { status: 400 }
      )
    }

    const existing = await Participant.findOne({ name })
    if (existing) {
      existing.groups = groups
      existing.matchPredictions = matchPredictions ?? []
      existing.knockout = knockout ?? []
      await existing.save()
      return NextResponse.json(existing)
    }

    const participant = await Participant.create({
      name,
      groups,
      matchPredictions: matchPredictions ?? [],
      knockout: knockout ?? [],
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

    if (isLocked()) {
      return NextResponse.json(
        { error: "La quiniela está cerrada desde el 10 de junio. No se permiten más modificaciones." },
        { status: 403 }
      )
    }

    await connectDB()
    const body = await req.json()
    const { name, groups, matchPredictions, knockout } = body

    if (name !== authedName) {
      return NextResponse.json({ error: "No puedes modificar datos de otro usuario" }, { status: 403 })
    }

    if (!name) {
      return NextResponse.json(
        { error: "Nombre requerido" },
        { status: 400 }
      )
    }

    const participant = await Participant.findOneAndUpdate(
      { name },
      {
        $set: {
          groups,
          matchPredictions: matchPredictions ?? [],
          knockout: knockout ?? [],
        },
      },
      { new: true }
    )

    if (!participant) {
      return NextResponse.json(
        { error: "Participante no encontrado" },
        { status: 404 }
      )
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
