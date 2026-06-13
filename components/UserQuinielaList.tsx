"use client"

import { fetchParticipants } from "@/lib/api"
import { useState, useEffect } from "react"
import { Users, Eye, Loader2 } from "lucide-react"
import UserQuinielaModal from "./UserQuinielaModal"

export default function UserQuinielaList() {
  const [participants, setParticipants] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchParticipants()
      .then((list) => setParticipants(list))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Usuarios</h2>
          <p className="text-sm text-gray-400">Visualiza las quinielas de todos los participantes</p>
        </div>
      </div>

      <div className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Usuario</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {loading ? (
              <tr>
                <td colSpan={2} className="px-4 py-12 text-center">
                  <Loader2 className="w-5 h-5 text-gray-500 animate-spin mx-auto" />
                </td>
              </tr>
            ) : participants.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-12 text-center text-sm text-gray-500">
                  No hay participantes registrados
                </td>
              </tr>
            ) : (
              participants.map((p) => (
                <tr key={p.name} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-white">{p.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver quiniela
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <UserQuinielaModal
          participant={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
