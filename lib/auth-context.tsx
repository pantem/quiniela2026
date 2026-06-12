"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useQuinielaStore } from "@/store/store"

interface User {
  id: string
  email: string
  name: string
  role: "user" | "admin"
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("quiniela-token")
    if (stored) {
      setToken(stored)
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${stored}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.user) setUser(data.user)
          else localStorage.removeItem("quiniela-token")
        })
        .catch(() => localStorage.removeItem("quiniela-token"))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "quiniela-token" && e.newValue !== e.oldValue && e.newValue !== token) {
        window.location.reload()
      }
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [token])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Error al iniciar sesión")
    localStorage.setItem("quiniela-token", data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Error al registrarse")
    localStorage.setItem("quiniela-token", data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("quiniela-token")
    useQuinielaStore.getState().resetAll()
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider")
  return ctx
}
