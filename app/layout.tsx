import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Quiniela Mundial 2026",
  description:
    "Quiniela interactiva para el Mundial 2026 - Predice resultados y compite con amigos",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-gray-900 text-white antialiased">{children}</body>
    </html>
  )
}
