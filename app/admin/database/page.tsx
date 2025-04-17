"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Member {
  id: string
  name: string
  role: string
  description: string
  avatar: string
  banner: string
  approved: boolean
  date: string
  lastUpdated: string
  fingerprint?: string
  rejected?: boolean
  rejectionDate?: string
  social?: {
    instagram?: string
    twitter?: string
    facebook?: string
  }
  stats?: {
    social: number
    skillful: number
    intelligence: number
    administrative?: number
  }
}

interface Code {
  code: string
  createdAt: string
  expiresAt: string
  used: boolean
  usedAt?: string
  usedBy?: string
}

interface AdminUser {
  username: string
  password: string
  role: string
  lastLogin?: string
}

export default function DatabasePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessCode, setAccessCode] = useState("")
  const [members, setMembers] = useState<Member[]>([])
  const [codes, setCodes] = useState<Code[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([
    { username: "lucas", password: "lucas9244", role: "admin" },
    { username: "angeles", password: "ange1212", role: "admin" },
    { username: "admin", password: "admin123", role: "superadmin" },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPasswords, setShowPasswords] = useState(false)
  const [serverStatus, setServerStatus] = useState<any>(null)

  useEffect(() => {
    // Check if already authenticated
    const isAuth = localStorage.getItem("db_authenticated") === "true"
    setIsAuthenticated(isAuth)

    if (isAuth) {
      loadData()
    }
  }, [])

  const authenticate = () => {
    if (accessCode === "lucas9244") {
      setIsAuthenticated(true)
      localStorage.setItem("db_authenticated", "true")
      loadData()
    } else {
      setError("Código incorrecto")
      setTimeout(() => setError(null), 3000)
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load server status
      try {
        const statusResponse = await fetch("/api/server-status")
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          setServerStatus(statusData)
        }
      } catch (statusError) {
        console.error("Error loading server status:", statusError)
      }

      // Load members
      try {
        const membersResponse = await fetch("/api/members")
        if (membersResponse.ok) {
          const membersData = await membersResponse.json()
          setMembers(Array.isArray(membersData) ? membersData : [])
        } else {
          // Try to load from localStorage as fallback
          const localMembers = JSON.parse(localStorage.getItem("blog_members") || "[]")
          setMembers(localMembers)
        }
      } catch (membersError) {
        console.error("Error loading members:", membersError)
        // Try to load from localStorage as fallback
        const localMembers = JSON.parse(localStorage.getItem("blog_members") || "[]")
        setMembers(localMembers)
      }

      // Load codes
      try {
        const codesResponse = await fetch("/api/codes")
        if (codesResponse.ok) {
          const codesData = await codesResponse.json()
          setCodes(Array.isArray(codesData) ? codesData : [])
        } else {
          // Try to load from localStorage as fallback
          const localCodes = JSON.parse(localStorage.getItem("backup_codes") || "[]")
          setCodes(localCodes)
        }
      } catch (codesError) {
        console.error("Error loading codes:", codesError)
        // Try to load from localStorage as fallback
        const localCodes = JSON.parse(localStorage.getItem("backup_codes") || "[]")
        setCodes(localCodes)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Error al cargar datos. Verifica la consola para más detalles.")
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-indigo-950 p-4">
        <div className="max-w-md w-full">
          <div className="mb-6 text-center">
            <img
              src="https://i.imgur.com/UWQoYx9.png"
              alt="Anime girl with laptop"
              className="w-40 h-40 object-cover mx-auto rounded-full border-4 border-white shadow-lg"
            />
          </div>
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl p-8">
            <h1 className="text-2xl font-bold text-center text-indigo-600 dark:text-indigo-400 mb-6">
              Verificación de Base de Datos
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              Ingresa el código de acceso{" "}
              <span className="font-bold text-indigo-600 dark:text-indigo-400">lucas9244</span> para verificar el estado
              de la base de datos SQLite.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Código de Acceso
                </label>
                <input
                  type="password"
                  id="accessCode"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ingresa el código de acceso"
                />
              </div>

              <button
                onClick={authenticate}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition shadow-md hover:shadow-lg transform hover:-translate-y-1"
              >
                Verificar
              </button>

              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-md border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/dashboard"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 19-7-7 7-7"></path>
                <path d="M19 12H5"></path>
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Verificación de Base de Datos SQLite</h1>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            disabled={loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={loading ? "animate-spin" : ""}
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
              <path d="M16 16h5v5"></path>
            </svg>
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6 border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Server Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Estado del Servidor</h2>
          {serverStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Entorno</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Node Env:</span> {serverStatus.environment?.nodeEnv || "N/A"}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Plataforma:</span> {serverStatus.environment?.platform || "N/A"}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Vercel:</span> {serverStatus.environment?.isVercel ? "Sí" : "No"}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Render:</span> {serverStatus.environment?.isRender ? "Sí" : "No"}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Estadísticas</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Miembros:</span> {serverStatus.membersCount || 0}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Timestamp:</span> {new Date(serverStatus.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</h3>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${serverStatus.status === "ok" ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {serverStatus.status === "ok" ? "Funcionando correctamente" : "Error"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No se pudo obtener el estado del servidor
            </div>
          )}
        </div>

        {/* Admin Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Usuarios Administradores</h2>
            <button
              onClick={() => setShowPasswords(!showPasswords)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPasswords ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                  <line x1="2" x2="22" y1="2" y2="22"></line>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
              {showPasswords ? "Ocultar contraseñas" : "Mostrar contraseñas"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contraseña
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rol
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {adminUsers.map((user) => (
                  <tr key={user.username} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {showPasswords ? user.password : "••••••••"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "superadmin"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Members */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Miembros ({members.length})</h2>

          {members.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No hay miembros en la base de datos</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500 dark:text-gray-400">
                        {member.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{member.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{member.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            member.approved
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}
                        >
                          {member.approved ? "Aprobado" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(member.date).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Codes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            Códigos de Acceso ({codes.length})
          </h2>

          {codes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No hay códigos en la base de datos</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Creado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Expira
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Usado Por
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {codes.map((code) => (
                    <tr key={code.code} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap font-mono font-medium text-gray-700 dark:text-gray-300">
                        {code.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(code.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(code.expiresAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            code.used
                              ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              : new Date(code.expiresAt) < new Date()
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          }`}
                        >
                          {code.used ? "Usado" : new Date(code.expiresAt) < new Date() ? "Expirado" : "Activo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {code.usedBy || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
