"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Check, X, Edit, Trash2, User, Search, Save } from "lucide-react"

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

export default function EditPage() {
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

  const loadMembers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/members")
      if (!response.ok) throw new Error(`Error: ${response.status}`)

      const data = await response.json()
      data.sort((a: Member, b: Member) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setMembers(data)
      setFilteredMembers(data)
      localStorage.setItem("blog_members", JSON.stringify(data))
      showNotification("Datos cargados correctamente")
    } catch (error) {
      console.error("Error loading members:", error)
      const localMembers = JSON.parse(localStorage.getItem("blog_members") || "[]")
      setMembers(localMembers)
      setFilteredMembers(localMembers)
      showNotification("Error al cargar datos del servidor. Usando datos locales.", true)
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingMember),
      })

      if (!response.ok) throw new Error(`Error: ${response.status}`)

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

  const deleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario permanentemente?")) return

    try {
      const updatedMembers = members.filter((user) => user.id !== userId)
      setMembers(updatedMembers)

      const response = await fetch(`/api/members/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error(`Error: ${response.status}`)

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

  const getRoleOptions = () => {
    const roles = Array.from(new Set(members.map((member) => member.role)))
    return ["all", ...roles]
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Editar Usuarios</h1>

        <button
          onClick={loadMembers}
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

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No se encontraron usuarios con los filtros aplicados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Usuario
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Rol
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Estado
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Fecha
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                          {member.avatar ? (
                            <img
                              src={member.avatar || "/placeholder.svg"}
                              alt={member.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <User className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {member.description.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {member.approved ? "Aprobado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => editUser(member.id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button onClick={() => deleteUser(member.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Editar Miembro</h3>
                <button onClick={() => setEditingMember(null)} className="text-gray-500 hover:text-gray-700">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={saveEditedUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                      value={editingMember.description}
                      onChange={(e) => setEditingMember({ ...editingMember, description: e.target.value })}
                      rows={4}
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
                    <div className="mt-2 flex items-center">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 mr-4">
                        <img
                          src={editingMember.avatar || "/placeholder.svg"}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm text-gray-500">Vista previa del avatar</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banner (URL)</label>
                    <input
                      type="url"
                      value={editingMember.banner || ""}
                      onChange={(e) => setEditingMember({ ...editingMember, banner: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <div className="mt-2">
                      <div className="h-16 rounded-md overflow-hidden bg-gray-100">
                        <img
                          src={editingMember.banner || editingMember.avatar}
                          alt="Banner preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm text-gray-500">Vista previa del banner</span>
                    </div>
                  </div>
                </div>

                {/* Stats Section */}
                {editingMember.stats && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-800 mb-3">Estadísticas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Social (1-10)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={editingMember.stats.social}
                          onChange={(e) =>
                            setEditingMember((prev) => {
                              if (!prev || !prev.stats) return prev
                              return {
                                ...prev,
                                stats: {
                                  ...prev.stats,
                                  social: Number(e.target.value),
                                },
                              }
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Habilidoso (1-10)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={editingMember.stats.skillful}
                          onChange={(e) =>
                            setEditingMember((prev) => {
                              if (!prev || !prev.stats) return prev
                              return {
                                ...prev,
                                stats: {
                                  ...prev.stats,
                                  skillful: Number(e.target.value),
                                },
                              }
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Inteligencia (1-10)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={editingMember.stats.intelligence}
                          onChange={(e) =>
                            setEditingMember((prev) => {
                              if (!prev || !prev.stats) return prev
                              return {
                                ...prev,
                                stats: {
                                  ...prev.stats,
                                  intelligence: Number(e.target.value),
                                },
                              }
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      {(editingMember.role === "Administrador" || editingMember.role === "Superior") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Administrativa (1-10)</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={editingMember.stats.administrative || 5}
                            onChange={(e) =>
                              setEditingMember((prev) => {
                                if (!prev || !prev.stats) return prev
                                return {
                                  ...prev,
                                  stats: {
                                    ...prev.stats,
                                    administrative: Number(e.target.value),
                                  },
                                }
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Social Media Section */}
                {editingMember.social && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-800 mb-3">Redes Sociales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                        <input
                          type="url"
                          value={editingMember.social.instagram || ""}
                          onChange={(e) =>
                            setEditingMember((prev) => {
                              if (!prev || !prev.social) return prev
                              return {
                                ...prev,
                                social: {
                                  ...prev.social,
                                  instagram: e.target.value,
                                },
                              }
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="https://instagram.com/usuario"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                        <input
                          type="url"
                          value={editingMember.social.twitter || ""}
                          onChange={(e) =>
                            setEditingMember((prev) => {
                              if (!prev || !prev.social) return prev
                              return {
                                ...prev,
                                social: {
                                  ...prev.social,
                                  twitter: e.target.value,
                                },
                              }
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="https://twitter.com/usuario"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                        <input
                          type="url"
                          value={editingMember.social.facebook || ""}
                          onChange={(e) =>
                            setEditingMember((prev) => {
                              if (!prev || !prev.social) return prev
                              return {
                                ...prev,
                                social: {
                                  ...prev.social,
                                  facebook: e.target.value,
                                },
                              }
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="https://facebook.com/usuario"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
                  >
                    <Save className="h-4 w-4" />
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
