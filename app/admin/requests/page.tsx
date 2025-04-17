"use client"

import { useState, useEffect } from "react"
import { Check, X, Eye, Trash2, User, Search, Clock } from "lucide-react"

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

export default function RequestsPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [pendingMembers, setPendingMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    isError: false,
  })
  const [viewingMember, setViewingMember] = useState<Member | null>(null)

  useEffect(() => {
    loadMembers()

    // Configurar un intervalo para actualizar cada 30 segundos
    const intervalId = setInterval(() => {
      loadMembers(false) // Pasar false para no mostrar notificación en cada actualización automática
    }, 30000) // 30 segundos

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    filterPendingMembers()
  }, [members, searchTerm])

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
        const responseText = await response.text()
        console.error("Response text (first 100 chars):", responseText.substring(0, 100))
        throw new Error("Invalid response format from server")
      }

      // Now it's safe to parse JSON
      const data = await response.json()
      data.sort((a: Member, b: Member) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setMembers(data)
      filterPendingMembers(data)
      localStorage.setItem("blog_members", JSON.stringify(data))

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
        filterPendingMembers(localMembers)

        if (showNotifications) {
          showNotification("Error al cargar datos del servidor. Usando datos locales.", true)
        }
      } catch (localError) {
        console.error("Error loading from local storage:", localError)
        // Initialize with empty data if both server and local storage fail
        setMembers([])
        setPendingMembers([])

        if (showNotifications) {
          showNotification("Error al cargar datos. Por favor, intente más tarde.", true)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const filterPendingMembers = (data?: Member[]) => {
    const membersToFilter = data || members
    let filtered = membersToFilter.filter((member) => !member.approved)

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (member) =>
          member.name.toLowerCase().includes(term) ||
          member.role.toLowerCase().includes(term) ||
          member.description.toLowerCase().includes(term),
      )
    }

    setPendingMembers(filtered)
  }

  // Update the approveUser function to use the new consolidated API endpoint
  const approveUser = async (userId: string) => {
    try {
      console.log(`Attempting to approve user with ID: ${userId}`)

      const updatedMembers = members.map((user) =>
        user.id === userId ? { ...user, approved: true, lastUpdated: new Date().toISOString() } : user,
      )
      setMembers(updatedMembers)

      // Make the API request to the new consolidated endpoint
      const response = await fetch("/api/members/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          action: "approve",
          memberId: userId,
        }),
      })

      // Log the response status
      console.log(`Approval API response status: ${response.status}`)

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
        throw new Error(`Error ${response.status}: ${result.error || response.statusText}`)
      }

      const result = await response.json()
      if (result.success) {
        showNotification("Usuario aprobado correctamente")
        localStorage.setItem("blog_members", JSON.stringify(updatedMembers))
      } else {
        throw new Error(result.error || "Error al aprobar usuario")
      }
    } catch (error: any) {
      console.error("Error approving user:", error)
      showNotification(`Error al aprobar: ${error.message}`, true)
      loadMembers()
    }
  }

  // Update the rejectUser function to use the new consolidated API endpoint
  const rejectUser = async (userId: string) => {
    try {
      console.log(`Attempting to reject user with ID: ${userId}`)

      const updatedMembers = members.map((user) =>
        user.id === userId ? { ...user, approved: false, lastUpdated: new Date().toISOString() } : user,
      )
      setMembers(updatedMembers)

      // Make the API request to the new consolidated endpoint
      const response = await fetch("/api/members/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          action: "reject",
          memberId: userId,
        }),
      })

      // Log the response status
      console.log(`Rejection API response status: ${response.status}`)

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
        throw new Error(`Error ${response.status}: ${result.error || response.statusText}`)
      }

      const result = await response.json()
      if (result.success) {
        showNotification("Usuario rechazado correctamente")
        localStorage.setItem("blog_members", JSON.stringify(updatedMembers))
      } else {
        throw new Error(result.error || "Error al rechazar usuario")
      }
    } catch (error: any) {
      console.error("Error rejecting user:", error)
      showNotification(`Error al rechazar: ${error.message}`, true)
      loadMembers()
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario permanentemente?")) return

    try {
      const updatedMembers = members.filter((user) => user.id !== userId)
      setMembers(updatedMembers)

      const response = await fetch(`/api/members/${userId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
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
        throw new Error(`Error ${response.status}: ${result.error || response.statusText}`)
      }

      const result = await response.json()
      if (result.success) {
        showNotification("Usuario eliminado correctamente")
        localStorage.setItem("blog_members", JSON.stringify(updatedMembers))
      } else {
        throw new Error(result.error || "Error al eliminar usuario")
      }
    } catch (error: any) {
      console.error("Error deleting user:", error)
      showNotification(`Error al eliminar: ${error.message}`, true)
      loadMembers()
    }
  }

  const viewUser = (userId: string) => {
    const user = members.find((user) => user.id === userId)
    if (user) setViewingMember(user)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Solicitudes Pendientes</h1>

        <button
          onClick={() => loadMembers()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M22 13.5a10 10 0 1 1-20 0 10 10 0 0 1 20 0z"></path>
          </svg>
          Actualizar
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar solicitudes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Pending Requests */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            <h3 className="font-medium text-indigo-900">Solicitudes pendientes de aprobación</h3>
          </div>
          <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {pendingMembers.length} solicitudes
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : pendingMembers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No hay solicitudes pendientes</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingMembers.map((member) => (
              <div key={member.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                      {member.avatar ? (
                        <img
                          src={member.avatar || "/placeholder.svg"}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{member.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{member.role}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-sm text-gray-500">{new Date(member.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => viewUser(member.id)}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Ver detalles"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => approveUser(member.id)}
                      className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                      title="Aprobar"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => rejectUser(member.id)}
                      className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                      title="Rechazar"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => deleteUser(member.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-sm text-gray-600 line-clamp-2">{member.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Member Modal */}
      {viewingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img
                src={viewingMember.banner || "/placeholder.svg?height=200&width=600"}
                alt={viewingMember.name}
                className="w-full h-48 object-cover rounded-t-xl"
              />
              <button
                onClick={() => setViewingMember(null)}
                className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="absolute -bottom-16 left-6">
                <img
                  src={viewingMember.avatar || "/placeholder.svg?height=128&width=128"}
                  alt={viewingMember.name}
                  className="w-32 h-32 rounded-full border-4 border-white object-cover"
                />
              </div>
            </div>

            <div className="pt-20 px-6 pb-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{viewingMember.name}</h2>
                  <span className="inline-block px-3 py-1 text-sm rounded-full mt-2 bg-yellow-100 text-yellow-800">
                    {viewingMember.role} - Pendiente de aprobación
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      approveUser(viewingMember.id)
                      setViewingMember(null)
                    }}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm"
                  >
                    <Check className="h-4 w-4" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => {
                      rejectUser(viewingMember.id)
                      setViewingMember(null)
                    }}
                    className="flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded-lg text-sm"
                  >
                    <X className="h-4 w-4" />
                    Rechazar
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Descripción</h3>
                <p className="text-gray-600">{viewingMember.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Información</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Fecha de solicitud</p>
                    <p className="font-medium">{new Date(viewingMember.date).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Última actualización</p>
                    <p className="font-medium">{new Date(viewingMember.lastUpdated).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {viewingMember.stats && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Estadísticas</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Activo/Social</span>
                        <span className="text-sm text-gray-500">{viewingMember.stats?.social || 5}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${(viewingMember.stats?.social || 5) * 10}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Habilidoso</span>
                        <span className="text-sm text-gray-500">{viewingMember.stats?.skillful || 5}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-500 h-2.5 rounded-full"
                          style={{ width: `${(viewingMember.stats?.skillful || 5) * 10}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Inteligencia</span>
                        <span className="text-sm text-gray-500">{viewingMember.stats?.intelligence || 5}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-purple-500 h-2.5 rounded-full"
                          style={{ width: `${(viewingMember.stats?.intelligence || 5) * 10}%` }}
                        ></div>
                      </div>
                    </div>

                    {viewingMember.stats?.administrative !== undefined && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Administrativa</span>
                          <span className="text-sm text-gray-500">{viewingMember.stats.administrative}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-red-500 h-2.5 rounded-full"
                            style={{ width: `${viewingMember.stats.administrative * 10}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-md shadow-lg ${
            notification.isError ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.isError ? <X className="h-5 w-5" /> : <Check className="h-5 w-5" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
