"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { ClientProvider } from "@/components/client-provider"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const loggedIn = localStorage.getItem("admin_logged_in") === "true"
    const storedUsername = localStorage.getItem("admin_username")

    if (loggedIn && storedUsername) {
      setIsLoggedIn(true)
      setUsername(storedUsername)
    } else if (pathname !== "/admin") {
      router.push("/admin")
    }

    setLoading(false)
  }, [pathname, router])

  const handleLogout = () => {
    localStorage.removeItem("admin_logged_in")
    localStorage.removeItem("admin_username")
    setIsLoggedIn(false)
    router.push("/admin")
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Cerrar sidebar al cambiar de ruta en móviles
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isLoggedIn && pathname === "/admin") {
    return children
  }

  if (!isLoggedIn) {
    return null
  }

  const isActive = (path: string) => {
    return pathname === path
      ? "bg-indigo-800 text-white dark:bg-indigo-950"
      : "text-indigo-100 hover:bg-indigo-800/50 dark:hover:bg-indigo-950/70"
  }

  return (
    <ClientProvider>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 bg-gray-900 text-white flex-col">
          <div className="p-4 border-b border-gray-800">
            <h1 className="text-xl font-bold">Blog-Teikoku</h1>
            <p className="text-sm text-gray-400">Panel de Administración</p>
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              <li>
                <Link href="/admin/dashboard" className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin/users" className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                  Usuarios
                </Link>
              </li>
              <li>
                <Link href="/admin/requests" className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                  Solicitudes
                </Link>
              </li>
              <li>
                <Link href="/admin/edit" className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                  Editar
                </Link>
              </li>
              <li>
                <Link href="/admin/settings" className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                  Configuración
                </Link>
              </li>
              <li className="pt-4 mt-4 border-t border-gray-800">
                <Link href="/" className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                  Volver al Inicio
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">{children}</div>
      </div>
    </ClientProvider>
  )
}
