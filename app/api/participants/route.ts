import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Participant } from "@/models/Participant"

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
    await connectDB()
    const body = await req.json()
    const { name, groups, matchPredictions, knockout, bonuses } = body

    if (!name || !groups || !bonuses) {
      return NextResponse.json(
        { error: "Faltan datos requeridos (name, groups, bonuses)" },
        { status: 400 }
      )
    }

    const existing = await Participant.findOne({ name })
    if (existing) {
      existing.groups = groups
      existing.matchPredictions = matchPredictions ?? []
      existing.knockout = knockout ?? []
      existing.bonuses = bonuses
      await existing.save()
      return NextResponse.json(existing)
    }

    const participant = await Participant.create({
      name,
      groups,
      matchPredictions: matchPredictions ?? [],
      knockout: knockout ?? [],
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
    await connectDB()
    const body = await req.json()
    const { name, groups, matchPredictions, knockout, bonuses } = body

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
          bonuses,
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
