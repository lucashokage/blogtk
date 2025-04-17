"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Download, Server, Users, Bell, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react"
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
}

interface DashboardStats {
  total: number
  approved: number
  pending: number
  rejected: number
}

export default function DashboardPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  })
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    isError: false,
  })
  const [serverStatus, setServerStatus] = useState({
    status: "Verificando...",
    className: "bg-yellow-100 text-yellow-800",
    isEmpty: false,
  })
  const [autoRestoreChecked, setAutoRestoreChecked] = useState(false)
  const [restoreCountdown, setRestoreCountdown] = useState<number | null>(null)

  useEffect(() => {
    checkServerStatus()
  }, [])

  useEffect(() => {
    if (serverStatus.isEmpty && !autoRestoreChecked) {
      handleEmptyServer()
      setAutoRestoreChecked(true)
    } else if (!serverStatus.isEmpty && !loading) {
      loadMembers()
    }
  }, [serverStatus.isEmpty, autoRestoreChecked])

  useEffect(() => {
    // Cargar datos iniciales
    loadMembers()

    // Configurar un intervalo para actualizar cada 30 segundos
    const intervalId = setInterval(() => {
      loadMembers(false) // No mostrar notificación en actualizaciones automáticas
    }, 30000) // 30 segundos

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId)
  }, [])

  // Efecto para el contador regresivo
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null

    if (restoreCountdown !== null && restoreCountdown > 0) {
      timerId = setTimeout(() => {
        setRestoreCountdown((prev) => (prev !== null ? prev - 1 : null))
      }, 1000)
    } else if (restoreCountdown === 0) {
      // Cuando el contador llega a cero, realizar la restauración
      restoreFromLocal(true)
      setRestoreCountdown(null)
    }

    return () => {
      if (timerId) clearTimeout(timerId)
    }
  }, [restoreCountdown])

  const showNotification = (message: string, isError = false) => {
    setNotification({ show: true, message, isError })
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }))
    }, 3000)
  }

  const loadMembers = async (showNotifications = true) => {
    setLoading(true)
    try {
      console.log("Fetching members from API...")

      // Create a new AbortController for this specific request
      let controller: AbortController | null = new AbortController()
      let timeoutId: NodeJS.Timeout | null = null

      // Create a promise that will resolve with the fetch result or reject on timeout
      const fetchPromise = fetch("/api/members/check", {
        // Use the check endpoint instead
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      })

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          if (controller) {
            controller.abort()
            reject(new Error("Request timed out after 10 seconds"))
          }
        }, 10000) // 10 second timeout
      })

      // Race the fetch against the timeout
      const response = (await Promise.race([fetchPromise, timeoutPromise])) as Response

      // Clear the timeout if the fetch completed
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      // Release the controller to avoid memory leaks
      controller = null

      console.log(`API response status: ${response.status}`)

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      // Check content type to ensure we're getting JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Expected JSON response but got:", contentType)
        // Get the response text for debugging
        const responseText = await response.text()
        console.error("Response text (first 100 chars):", responseText.substring(0, 100))
        throw new Error("Invalid response format from server")
      }

      // Now it's safe to parse JSON
      const data = await response.json()
      data.sort((a: Member, b: Member) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setMembers(data)
      localStorage.setItem("blog_members", JSON.stringify(data))

      // Calculate stats
      const approved = data.filter((m: Member) => m.approved).length
      const pending = data.filter((m: Member) => !m.approved).length

      setStats({
        total: data.length,
        approved,
        pending,
        rejected: 0, // We don't have this info yet
      })

      if (showNotifications) {
        showNotification("Datos cargados correctamente")
      }
    } catch (error: any) {
      console.error("Error loading members:", error)

      // Special handling for aborted requests
      if (error.name === "AbortError") {
        console.log("Request was aborted (timeout or user navigation)")
      }

      // Fallback to local storage
      try {
        console.log("Falling back to local storage data...")
        const localMembers = JSON.parse(localStorage.getItem("blog_members") || "[]")
        setMembers(localMembers)

        // Calculate stats from local data
        const approved = localMembers.filter((m: Member) => m.approved).length
        const pending = localMembers.filter((m: Member) => !m.approved).length

        setStats({
          total: localMembers.length,
          approved,
          pending,
          rejected: 0,
        })

        if (showNotifications) {
          showNotification("Error al cargar datos del servidor. Usando datos locales.", true)
        }
      } catch (localError) {
        console.error("Error loading from local storage:", localError)
        // Initialize with empty data if both server and local storage fail
        setMembers([])
        setStats({
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        })

        if (showNotifications) {
          showNotification("Error al cargar datos. Por favor, intente más tarde.", true)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Update the syncData function to use a dedicated sync endpoint
  const syncData = async () => {
    try {
      const response = await fetch("/api/members/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(members),
      })

      // Check content type before parsing JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Expected JSON response but got:", contentType)
        const responseText = await response.text()
        console.error("Response text (first 100 chars):", responseText.substring(0, 100))
        throw new Error("Invalid response format from server")
      }

      if (!response.ok) {
        const result = await response.json()
        throw new Error(`Error: ${result.error || response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        const now = new Date().toISOString()
        localStorage.setItem("last_sync_time", now)
        showNotification("Datos sincronizados correctamente")
      } else {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (error: any) {
      console.error("Error syncing data:", error)
      showNotification(`Error al sincronizar: ${error.message}`, true)
    }
  }

  const checkServerStatus = async () => {
    try {
      const response = await fetch("/api/server-status", {
        headers: {
          Accept: "application/json",
        },
      })

      // Check content type before parsing JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Expected JSON response but got:", contentType)
        throw new Error("Invalid response format from server")
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      // Verificar si el servidor está vacío (recién creado)
      const isEmpty = data.filesystem?.membersFile === "created" || data.membersCount === 0

      setServerStatus({
        status: isEmpty ? "Servidor vacío - Restauración disponible" : "Funcionando correctamente",
        className: isEmpty ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800",
        isEmpty: isEmpty,
      })

      // Si el servidor está vacío y no hemos verificado la restauración automática,
      // verificamos si debemos restaurar automáticamente
      if (isEmpty && !autoRestoreChecked) {
        const autoRestoreEnabled = localStorage.getItem("auto_restore_enabled") !== "false" // Por defecto true
        if (autoRestoreEnabled) {
          // Iniciar el contador regresivo de 10 segundos
          setRestoreCountdown(10)
        }
        setAutoRestoreChecked(true)
      }
    } catch (error) {
      console.error("Error checking server status:", error)
      setServerStatus({
        status: "Error al conectar con el servidor",
        className: "bg-red-100 text-red-800",
        isEmpty: false,
      })
    }
  }

  const handleEmptyServer = () => {
    const localMembers = JSON.parse(localStorage.getItem("blog_members") || "[]")

    if (localMembers.length > 0) {
      // Iniciar el contador regresivo en lugar de restaurar inmediatamente
      setRestoreCountdown(10)
    }
  }

  const cancelRestore = () => {
    setRestoreCountdown(null)
    showNotification("Restauración automática cancelada")
  }

  const restoreFromLocal = async (isAutomatic = false) => {
    try {
      const localMembers = JSON.parse(localStorage.getItem("blog_members") || "[]")

      if (localMembers.length === 0) {
        showNotification("No hay datos locales para restaurar", true)
        return
      }

      if (isAutomatic) {
        showNotification("Restaurando datos automáticamente...", false)
      } else {
        showNotification("Restaurando datos al servidor...", false)
      }

      const response = await fetch("/api/members/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(localMembers),
      })

      // Check content type before parsing JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Expected JSON response but got:", contentType)
        const responseText = await response.text()
        console.error("Response text (first 100 chars):", responseText.substring(0, 100))
        throw new Error("Invalid response format from server")
      }

      if (!response.ok) {
        const result = await response.json()
        throw new Error(`Error: ${result.error || response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        if (isAutomatic) {
          showNotification(`Restauración automática completada: ${localMembers.length} miembros restaurados`, false)
        } else {
          showNotification(`${localMembers.length} miembros restaurados correctamente`, false)
        }

        setMembers(localMembers)

        // Actualizar estadísticas
        const approved = localMembers.filter((m: Member) => m.approved).length
        const pending = localMembers.filter((m: Member) => !m.approved).length

        setStats({
          total: localMembers.length,
          approved,
          pending,
          rejected: 0,
        })

        // Actualizar estado del servidor
        setServerStatus({
          status: isAutomatic ? "Servidor restaurado automáticamente" : "Servidor restaurado correctamente",
          className: "bg-green-100 text-green-800",
          isEmpty: false,
        })

        const now = new Date().toISOString()
        localStorage.setItem("last_sync_time", now)
      } else {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (error: any) {
      console.error("Error restoring data:", error)
      showNotification(`Error al restaurar datos: ${error.message}`, true)
    }
  }

  const exportMembers = () => {
    const approvedUsers = members.filter((user) => user.approved)
    if (approvedUsers.length === 0) {
      showNotification("No hay usuarios aprobados para exportar", true)
      return
    }

    const dataStr = JSON.stringify(approvedUsers, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = "miembros-aprobados.json"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showNotification(`${approvedUsers.length} miembros exportados correctamente`)
  }

  const getRecentMembers = () => {
    return members.slice(0, 5)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Panel de Control</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadMembers()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
          >
            <RefreshCw size={18} />
            Actualizar
          </button>

          <button
            onClick={syncData}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            <RefreshCw size={18} />
            Sincronizar
          </button>

          <button
            onClick={exportMembers}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      {/* Contador regresivo para restauración automática */}
      {restoreCountdown !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-800/30">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">
                Restauración automática en progreso
              </h3>
              <p className="text-blue-700 dark:text-blue-400 mb-4">
                Se restaurarán automáticamente los datos desde tu copia local en {restoreCountdown} segundos.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => restoreFromLocal(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  <RefreshCw size={18} />
                  Restaurar ahora
                </button>
                <button
                  onClick={cancelRestore}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
                >
                  <XCircle size={18} />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Server Status with Restore Option */}
      {serverStatus.isEmpty && restoreCountdown === null && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 dark:bg-yellow-900/20 dark:border-yellow-800">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-yellow-100 rounded-full dark:bg-yellow-800/30">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                Servidor recién desplegado detectado
              </h3>
              <p className="text-yellow-700 dark:text-yellow-400 mb-4">
                La restauración automática ha sido cancelada. Puedes restaurar manualmente los datos desde tu copia
                local o desde la sección de Configuración.
              </p>
              <button
                onClick={() => restoreFromLocal(false)}
                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition"
              >
                <RefreshCw size={18} />
                Restaurar datos manualmente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Total Miembros</h3>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Miembros registrados</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Aprobados</h3>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.approved}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Miembros activos</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Pendientes</h3>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Bell className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.pending}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Esperando aprobación</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Rechazados</h3>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.rejected}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Solicitudes rechazadas</p>
        </div>
      </div>

      {/* Server Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Estado del Servidor</h3>
          <button
            onClick={checkServerStatus}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-md ${serverStatus.className} dark:bg-opacity-20`}>
          <Server className="h-5 w-5" />
          <span>{serverStatus.status}</span>
        </div>
      </div>

      {/* Database Verification Link */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Verificación de Base de Datos</h3>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-gray-600 dark:text-gray-400">
            Accede a la página de verificación de la base de datos MongoDB para comprobar su estado y contenido.
          </p>

          <Link
            href="/admin/database"
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition w-full md:w-auto"
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
              className="h-5 w-5"
            >
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            </svg>
            Verificar Base de Datos
          </Link>
        </div>
      </div>

      {/* Recent Members */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Miembros Recientes</h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : getRecentMembers().length === 0 ? (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">No hay miembros registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usuario
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
                {getRecentMembers().map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                          {member.avatar ? (
                            <img
                              src={member.avatar || "/placeholder.svg"}
                              alt={member.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Users className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{member.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.approved
                            ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                        }`}
                      >
                        {member.approved ? "Aprobado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(member.date).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Acceso a la verificación de la base de datos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Verificación de Base de Datos MongoDB
          </h3>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-blue-600 dark:text-blue-400"
          >
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Accede a la página de verificación de la base de datos MongoDB para comprobar su estado y contenido.
          Necesitarás el código de acceso: <span className="font-mono font-medium">lucas9244</span>
        </p>
        <Link
          href="/admin/database"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition w-full md:w-auto"
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
            className="h-5 w-5"
          >
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
          </svg>
          Verificar Base de Datos
        </Link>
      </div>

      {notification.show && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-md shadow-lg ${
            notification.isError
              ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
              : "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.isError ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
