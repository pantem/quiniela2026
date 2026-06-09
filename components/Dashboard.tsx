"use client"

import { useQuinielaStore } from "@/store/store"
import { getTeamById } from "@/utils/teams"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import {
  BarChart3,
  TrendingUp,
  Trophy,
  Users,
  Star,
  Gift,
} from "lucide-react"

export default function Dashboard() {
  const { knockout, getTotalPoints, getBonusPoints, getAutoBonusPoints, participantName, results, groups: predictions } =
    useQuinielaStore()

  const teamPickCount = new Map<string, number>()
  for (const g of predictions) {
    for (const pos of ["first", "second", "third", "fourth"] as const) {
      if (g[pos]) {
        teamPickCount.set(g[pos]!, (teamPickCount.get(g[pos]!) || 0) + 1)
      }
    }
  }

  const mostPickedData = Array.from(teamPickCount.entries())
    .map(([id, count]) => {
      const team = getTeamById(id)
      return {
        name: team ? `${team.flag} ${team.name}` : id,
        value: count,
      }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  const knockoutCount = knockout.filter((m) => m.winner).length
  const groupsComplete = predictions.filter(
    (g) => g.first && g.second && g.third && g.fourth
  ).length

  const stats = [
    {
      icon: <Trophy className="w-5 h-5 text-amber-400" />,
      label: "Puntaje Total",
      value: getTotalPoints().toString(),
      bg: "from-amber-900/20 to-amber-800/10",
      border: "border-amber-700/30",
    },
    {
      icon: <Star className="w-5 h-5 text-amber-400" />,
      label: "Puntos Bonos",
      value: getBonusPoints().toString(),
      bg: "from-amber-900/20 to-amber-800/10",
      border: "border-amber-700/30",
    },
    {
      icon: <Gift className="w-5 h-5 text-purple-400" />,
      label: "Auto Asignación",
      value: getAutoBonusPoints(participantName).toString(),
      bg: "from-purple-900/20 to-purple-800/10",
      border: "border-purple-700/30",
    },
    {
      icon: <Users className="w-5 h-5 text-blue-400" />,
      label: "Grupos Completos",
      value: `${groupsComplete}/12`,
      bg: "from-blue-900/20 to-blue-800/10",
      border: "border-blue-700/30",
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      label: "Ganadores Fases Finales",
      value: `${knockoutCount}`,
      bg: "from-emerald-900/20 to-emerald-800/10",
      border: "border-emerald-700/30",
    },
  ]

  const COLORS = [
    "#8b5cf6",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#6366f1",
    "#84cc16",
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-purple-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-sm text-gray-400">
            Estadísticas y visualizaciones de tu quiniela
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`bg-gradient-to-br ${stat.bg} ${stat.border} border rounded-xl p-4`}
          >
            <div className="flex items-center gap-2 mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Equipos Más Elegidos
            </h3>
          </div>
          {mostPickedData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mostPickedData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 60, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#d1d5db", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "13px",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {mostPickedData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              Selecciona equipos en la fase de grupos para ver estadísticas.
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
