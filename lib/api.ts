const BASE = "/api"

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("quiniela-token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchParticipants() {
  const res = await fetch(`${BASE}/participants`)
  if (!res.ok) throw new Error("Error al obtener participantes")
  return res.json()
}

export async function saveParticipant(data: {
  name: string
  groups: any[]
  matchPredictions?: any[]
  knockout: any[]
  fifaKnockout?: any[]
  bonuses?: any
}) {
  const res = await fetch(`${BASE}/participants`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Error al guardar participante")
  return res.json()
}

export async function updateParticipant(data: {
  name: string
  groups: any[]
  matchPredictions?: any[]
  knockout: any[]
  fifaKnockout?: any[]
  bonuses?: any
}) {
  const res = await fetch(`${BASE}/participants`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Error al actualizar participante")
  return res.json()
}

export async function deleteParticipant(name: string) {
  const res = await fetch(`${BASE}/participants?name=${encodeURIComponent(name)}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Error al eliminar participante")
  return res.json()
}

export async function updateParticipantAdmin(data: {
  name: string
  penalties?: number
  canEdit?: boolean
  phasePermissions?: Record<string, boolean>
}) {
  const res = await fetch(`${BASE}/participants`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Error al actualizar participante")
  return res.json()
}

export async function fetchResults() {
  const res = await fetch(`${BASE}/results`)
  if (!res.ok) throw new Error("Error al obtener resultados")
  return res.json()
}

export async function saveResults(data: {
  groups: any[]
  matchScores?: any[]
  knockout: any[]
  fifaKnockout?: any[]
  bonuses?: any
  scoringConfig?: any
  phaseLocks?: any
  autoBonuses?: any
}) {
  const res = await fetch(`${BASE}/results`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Error al guardar resultados")
  return res.json()
}

export async function fetchRanking() {
  const res = await fetch(`${BASE}/ranking`)
  if (!res.ok) throw new Error("Error al obtener ranking")
  return res.json()
}
