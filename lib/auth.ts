import jwt from "jsonwebtoken"
import { NextResponse } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "quiniela-2026-secret-dev"

export interface JwtPayload {
  userId: string
  email: string
  role: "user" | "admin"
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  return auth.slice(7)
}

export function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 })
}

export function forbidden() {
  return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
}
