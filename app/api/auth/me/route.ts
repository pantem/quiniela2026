import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/User"
import { verifyToken, getTokenFromRequest, unauthorized } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return unauthorized()

    const payload = verifyToken(token)
    if (!payload) return unauthorized()

    await connectDB()
    const user = await User.findById(payload.userId).select("-password").lean()
    if (!user) return unauthorized()

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch {
    return NextResponse.json({ error: "Error de autenticación" }, { status: 500 })
  }
}
