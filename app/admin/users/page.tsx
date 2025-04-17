"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Check, X, Edit, Trash2, User, Search } from "lucide-react"

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

export default function UsersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending">("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    isError: false,
  })
  const [editingMember, setEditingMember] = useState<Member | null>(null)

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
    filterMembers()
  }, [members, searchTerm, statusFilter, roleFilter])

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

      // Use a timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch("/api/members/check", {
        // Use the check endpoint instead
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      })
      clearTimeout(timeoutId)

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
      setFilteredMembers(data)
      localStorage.setItem("blog_members", JSON.stringify(data))

      if (showNotifications) {
        showNotification("Datos cargados correctamente")
      }
    } catch (error) {
      console.error("Error loading members:", error)

      // Fallback to local storage
      try {
        console.log("Falling back to local storage data...")
        const localMembers = JSON.parse(localStorage.getItem("blog_members") || "[]")
        setMembers(localMembers)
        setFilteredMembers(localMembers)

        if (showNotifications) {
          showNotification("Error al cargar datos del servidor. Usando datos locales.", true)
        }
      } catch (localError) {
        console.error("Error loading from local storage:", localError)
        // Initialize with empty data if both server and local storage fail
        setMembers([])
        setFilteredMembers([])

        if (showNotifications) {
          showNotification("Error al cargar datos. Por favor, intente más tarde.", true)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const filterMembers = () => {
    let result = [...members]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (member) =>
          member.name.toLowerCase().includes(term) ||
          member.role.toLowerCase().includes(term) ||
          member.description.toLowerCase().includes(term),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((member) => (statusFilter === "approved" ? member.approved : !member.approved))
    }

    // Apply role filter
    if (roleFilter !== "all") {
      result = result.filter((member) => member.role === roleFilter)
    }

    setFilteredMembers(result)
  }

  // Update the approveUser function to use the new consolidated API endpoint
  const approveUser = async (userId: string) => {
    try {
      console.log(`Attempting to approve user with ID: ${userId}`)

      // Update the UI optimistically
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
      // Reload the data to ensure UI is in sync with server
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

  const editUser = (userId: string) => {
    const user = members.find((user) => user.id === userId)
    if (user) setEditingMember(user)
  }

  const saveEditedUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMember) return

    try {
      const response = await fetch(`/api/members/${editingMember.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(editingMember),
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
        const updatedMembers = members.map((user) => (user.id === editingMember.id ? editingMember : user))
        setMembers(updatedMembers)
        localStorage.setItem("blog_members", JSON.stringify(updatedMembers))
        showNotification("Usuario actualizado correctamente")
        setEditingMember(null)
      } else {
        throw new Error(result.error || "Error al actualizar usuario")
      }
    } catch (error: any) {
      console.error("Error updating user:", error)
      showNotification(`Error al actualizar: ${error.message}`, true)
    }
  }

  const getRoleOptions = () => {
    const roles = Array.from(new Set(members.map((member) => member.role)))
    return ["all", ...roles]
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>

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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-4">
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "approved" | "pending")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todos</option>
                <option value="approved">Aprobados</option>
                <option value="pending">Pendientes</option>
              </select>
            </div>

            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todos</option>
                {getRoleOptions()
                  .filter((role) => role !== "all")
                  .map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="col-span-3 text-center py-20 text-gray-500">
            No se encontraron usuarios con los filtros aplicados
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div key={member.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              <div className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                    {member.avatar ? (
                      <img
                        src={member.avatar || "/placeholder.svg"}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{member.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        member.approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {member.approved ? "Aprobado" : "Pendiente"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <p>
                    <span className="font-medium">Rol:</span> {member.role}
                  </p>
                  <p className="text-gray-600 line-clamp-2">{member.description}</p>
                  <p className="text-xs text-gray-500">Registrado: {new Date(member.date).toLocaleDateString()}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!member.approved ? (
                    <button
                      onClick={() => approveUser(member.id)}
                      className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      <Check className="h-4 w-4" />
                      Aprobar
                    </button>
                  ) : (
                    <button
                      onClick={() => rejectUser(member.id)}
                      className="flex-1 flex items-center justify-center gap-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                    >
                      <X className="h-4 w-4" />
                      Rechazar
                    </button>
                  )}
                  <button
                    onClick={() => editUser(member.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => deleteUser(member.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Editar Miembro</h3>
                <button onClick={() => setEditingMember(null)} className="text-gray-500 hover:text-gray-700">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={saveEditedUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                  <input
                    type="text"
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol/Cargo</label>
                  <select
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="Integrante">Integrante</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Superior">Superior</option>
                    <option value="Fantasma">Fantasma</option>
                    <option value="Ex-Admin">Ex-Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={editingMember.description}
                    onChange={(e) => setEditingMember({ ...editingMember, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avatar (URL)</label>
                  <input
                    type="url"
                    value={editingMember.avatar}
                    onChange={(e) => setEditingMember({ ...editingMember, avatar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner (URL)</label>
                  <input
                    type="url"
                    value={editingMember.banner || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, banner: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md font-medium transition"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
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
