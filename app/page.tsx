"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuinielaStore } from "@/store/store"
import GroupStage from "@/components/GroupStage"
import GroupSummary from "@/components/GroupSummary"
import GroupMatches from "@/components/GroupMatches"
import KnockoutStage from "@/components/KnockoutStage"
import BonusSelector from "@/components/BonusSelector"
import ResultsAdmin from "@/components/ResultsAdmin"
import Ranking from "@/components/Ranking"
import Dashboard from "@/components/Dashboard"
import {
  Table2,
  Timer,
  Swords,
  Trophy,
  ShieldCheck,
  BarChart3,
  UserCircle,
  Cloud,
  CloudOff,
  Loader2,
} from "lucide-react"
import type { TabId } from "./types"

interface NavItem {
  id: TabId
  label: string
  icon: React.ReactNode
  section: "predict" | "admin" | "stats"
}

const navItems: NavItem[] = [
  { id: "grupos", label: "Grupos", icon: <Table2 className="w-4 h-4" />, section: "predict" },
  { id: "marcadores", label: "Marcadores", icon: <Timer className="w-4 h-4" />, section: "predict" },
  { id: "dieciseisavos", label: "Dieciseisavos", icon: <Swords className="w-4 h-4" />, section: "predict" },
  { id: "octavos", label: "Octavos", icon: <Swords className="w-4 h-4" />, section: "predict" },
  { id: "cuartos", label: "Cuartos", icon: <Swords className="w-4 h-4" />, section: "predict" },
  { id: "semifinal", label: "Semifinal", icon: <Swords className="w-4 h-4" />, section: "predict" },
  { id: "final", label: "Final", icon: <Trophy className="w-4 h-4" />, section: "predict" },
  { id: "campeon", label: "Campeón", icon: <Trophy className="w-4 h-4" />, section: "predict" },
  { id: "resultados", label: "Resultados", icon: <ShieldCheck className="w-4 h-4" />, section: "admin" },
  { id: "ranking", label: "Ranking", icon: <BarChart3 className="w-4 h-4" />, section: "stats" },
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" />, section: "stats" },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("grupos")
  const {
    participantName,
    setParticipantName,
    syncToMongo,
    loadFromMongo,
    loadResultsFromMongo,
    loadAllParticipants,
    syncing,
    lastSync,
  } = useQuinielaStore()

  useEffect(() => {
    loadResultsFromMongo()
    loadAllParticipants()
  }, [loadResultsFromMongo, loadAllParticipants])

  useEffect(() => {
    if (participantName) {
      loadFromMongo(participantName)
    }
  }, [])

  // refreshKnockout se llama automáticamente desde setGroupPrediction

  const handleSync = useCallback(async () => {
    await syncToMongo()
  }, [syncToMongo])

  const knockoutRounds = [
    {
      round: "r32" as const,
      tabId: "dieciseisavos" as TabId,
      title: "Dieciseisavos de Final",
      subtitle: "Selecciona el ganador de cada cruce",
      icon: <Swords className="w-6 h-6 text-blue-400" />,
    },
    {
      round: "r16" as const,
      tabId: "octavos" as TabId,
      title: "Octavos de Final",
      subtitle: "Selecciona el ganador de cada cruce",
      icon: <Swords className="w-6 h-6 text-emerald-400" />,
    },
    {
      round: "qf" as const,
      tabId: "cuartos" as TabId,
      title: "Cuartos de Final",
      subtitle: "Selecciona el ganador de cada cruce",
      icon: <Swords className="w-6 h-6 text-amber-400" />,
    },
    {
      round: "sf" as const,
      tabId: "semifinal" as TabId,
      title: "Semifinales",
      subtitle: "Selecciona el ganador de cada cruce",
      icon: <Trophy className="w-6 h-6 text-purple-400" />,
    },
    {
      round: "final" as const,
      tabId: "final" as TabId,
      title: "Gran Final",
      subtitle: "Selecciona el campeón del mundo",
      icon: <Trophy className="w-6 h-6 text-amber-400" />,
    },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case "grupos":
        return (
          <div className="space-y-6">
            <GroupStage />
            <GroupSummary />
          </div>
        )
      case "marcadores":
        return <GroupMatches />
      case "dieciseisavos":
      case "octavos":
      case "cuartos":
      case "semifinal":
      case "final": {
        const roundData = knockoutRounds.find((r) => r.tabId === activeTab)
        if (!roundData) return null
        return (
          <KnockoutStage
            round={roundData.round}
            title={roundData.title}
            subtitle={roundData.subtitle}
            icon={roundData.icon}
          />
        )
      }
      case "campeon":
        return <BonusSelector />
      case "resultados":
        return <ResultsAdmin />
      case "ranking":
        return <Ranking />
      case "dashboard":
        return <Dashboard />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-amber-400" />
              <h1 className="text-lg font-bold text-white">
                Quiniela Mundial 2026
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Tu nombre"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 w-28 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
              <button
                onClick={handleSync}
                disabled={syncing || !participantName}
                title={lastSync ? `Última sincronización: ${new Date(lastSync).toLocaleTimeString()}` : "Guardar en la nube"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30"
              >
                {syncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : lastSync ? (
                  <Cloud className="w-3.5 h-3.5" />
                ) : (
                  <CloudOff className="w-3.5 h-3.5" />
                )}
                {syncing ? "Guardando..." : lastSync ? "Guardado" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <nav className="hidden lg:flex flex-col gap-1 w-48 shrink-0">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
              Predicción
            </div>
            {navItems
              .filter((n) => n.section === "predict")
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeTab === item.id
                      ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 mt-4">
              Admin
            </div>
            {navItems
              .filter((n) => n.section === "admin")
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeTab === item.id
                      ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 mt-4">
              Estadísticas
            </div>
            {navItems
              .filter((n) => n.section === "stats")
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeTab === item.id
                      ? "bg-amber-600/20 text-amber-300 border border-amber-500/30"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
          </nav>

          <div className="flex-1 min-w-0">
            <div className="lg:hidden mb-4">
              <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                      activeTab === item.id
                        ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                        : "text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="animate-fade-in">{renderContent()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
