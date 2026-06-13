"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuinielaStore } from "@/store/store"
import { useAuth, AuthProvider } from "@/lib/auth-context"
import GroupStage from "@/components/GroupStage"
import GroupSummary from "@/components/GroupSummary"
import GroupMatches from "@/components/GroupMatches"
import BracketView from "@/components/BracketView"
import BonusSelector from "@/components/BonusSelector"
import ResultsAdmin from "@/components/ResultsAdmin"
import UserQuinielaList from "@/components/UserQuinielaList"
import Ranking from "@/components/Ranking"
import Dashboard from "@/components/Dashboard"
import AuthModal from "@/components/AuthModal"
import {
  Table2,
  Timer,
  Swords,
  Trophy,
  ShieldCheck,
  Users,
  BarChart3,
  UserCircle,
  LogIn,
  LogOut,
  Cloud,
  CloudOff,
  Loader2,
  Star,
} from "lucide-react"
import type { TabId } from "./types"

interface NavItem {
  id: TabId
  label: string
  icon: React.ReactNode
  section: "predict" | "admin" | "stats"
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { id: "grupos", label: "Grupos", icon: <Table2 className="w-4 h-4" />, section: "predict" },
  { id: "marcadores", label: "Marcadores", icon: <Timer className="w-4 h-4" />, section: "predict" },
  { id: "eliminatoria", label: "Fases Finales", icon: <Swords className="w-4 h-4" />, section: "predict" },
  { id: "campeon", label: "Bonos", icon: <Star className="w-4 h-4" />, section: "predict" },
  { id: "resultados", label: "Resultados", icon: <ShieldCheck className="w-4 h-4" />, section: "admin", adminOnly: true },
  { id: "usuarios", label: "Usuarios", icon: <Users className="w-4 h-4" />, section: "admin", adminOnly: true },
  { id: "ranking", label: "Ranking", icon: <BarChart3 className="w-4 h-4" />, section: "stats" },
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" />, section: "stats" },
]

function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>("grupos")
  const [showAuth, setShowAuth] = useState(false)
  const { user, loading: authLoading, logout } = useAuth()

  const {
    participantName,
    setParticipantName,
    syncToMongo,
    loadFromMongo,
    loadResultsFromMongo,
    loadAllParticipants,
    syncing,
    lastSync,
    syncError,
  } = useQuinielaStore()

  useEffect(() => {
    if (!user) setShowAuth(true)
    else setShowAuth(false)
  }, [user])

  useEffect(() => {
    loadResultsFromMongo()
    loadAllParticipants()
  }, [loadResultsFromMongo, loadAllParticipants, user])

  useEffect(() => {
    if (user && user.name !== participantName) {
      setParticipantName(user.name)
    }
  }, [user])

  useEffect(() => {
    if (participantName && !user) {
      loadFromMongo(participantName)
    }
  }, [participantName, user])

  useEffect(() => {
    if (user) {
      loadFromMongo(user.name)
    }
  }, [user?.name])

  const handleSync = useCallback(async () => {
    await syncToMongo()
  }, [syncToMongo])

  const visibleNav = user?.role === "admin"
    ? navItems
    : navItems.filter((n) => !n.adminOnly)

  const renderContent = () => {
    if ((activeTab === "resultados" || activeTab === "usuarios") && user?.role !== "admin") {
      return (
        <div className="bg-gray-800/60 backdrop-blur rounded-xl border border-gray-700/50 p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Acceso restringido</h3>
          <p className="text-gray-400 text-sm">Solo el administrador puede acceder a esta sección.</p>
        </div>
      )
    }

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
      case "eliminatoria":
        return <BracketView />
      case "campeon":
        return <BonusSelector />
      case "resultados":
        return <ResultsAdmin />
      case "usuarios":
        return <UserQuinielaList />
      case "ranking":
        return <Ranking />
      case "dashboard":
        return <Dashboard />
      default:
        return null
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} closable={!!user} />
        <div className="text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-600/30 to-amber-600/30 border border-purple-500/30">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Quiniela Mundial 2026</h1>
            <p className="text-gray-400 text-sm">Inicia sesión para acceder a tu quiniela</p>
          </div>
          {!showAuth && (
            <button
              onClick={() => setShowAuth(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <LogIn className="w-4 h-4" />
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
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
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700">
                    <UserCircle className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-sm text-white font-medium">{user.name}</span>
                    {user.role === "admin" && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded font-semibold">ADMIN</span>
                    )}
                  </div>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
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
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Salir
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </button>
              )}
            </div>
          </div>
          {syncError && (
            <div className="bg-red-900/40 border border-red-700/50 rounded-lg px-4 py-2 mt-2">
              <p className="text-sm text-red-300">
                <span className="font-semibold">Error de sincronización:</span> {syncError}
              </p>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <nav className="hidden lg:flex flex-col gap-1 w-48 shrink-0">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
              Predicción
            </div>
            {visibleNav
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
            {visibleNav.filter((n) => n.section === "admin").length > 0 && (
              <>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 mt-4">
                  Admin
                </div>
                {visibleNav
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
              </>
            )}
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 mt-4">
              Estadísticas
            </div>
            {visibleNav
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
                {visibleNav.map((item) => (
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

export default function Home() {
  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  )
}
