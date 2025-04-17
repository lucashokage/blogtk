"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ClientProvider } from "@/components/client-provider"
import { ThemeToggle } from "@/components/theme-toggle"

interface Member {
  id: string
  name?: string
  role?: string
  description?: string
  avatar?: string
  banner?: string
  approved: boolean
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

export default function BlogPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/members?approved=true")
      if (!response.ok) {
        throw new Error(`Error al cargar miembros: ${response.status}`)
      }

      const data: Member[] = await response.json()
      setMembers(data)

      // Guardar en localStorage como respaldo
      localStorage.setItem("blog_members", JSON.stringify(data))
    } catch (err: any) {
      console.error("Error loading members:", err)
      setError(err.message)

      // Intentar cargar desde localStorage
      try {
        const localData: Member[] = JSON.parse(localStorage.getItem("blog_members") || "[]")
        const approvedLocalMembers = localData.filter((member: Member) => member.approved)
        setMembers(approvedLocalMembers)
        setError("Usando datos guardados localmente")
      } catch (localError) {
        console.error("Error loading from localStorage:", localError)
      }
    } finally {
      setLoading(false)
    }
  }

  const openModal = (member: Member) => {
    setSelectedMember(member)
  }

  const closeModal = () => {
    setSelectedMember(null)
  }

  return (
    <ClientProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="admin-access absolute top-4 right-4 z-10 flex gap-2">
          <ThemeToggle />
          <Link href="/admin">
            <button className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition">
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
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </button>
          </Link>
        </div>

        <div className="text-center py-12 px-4">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Blog-Teikoku</h1>
          <h2 className="text-2xl text-blue-600 dark:text-blue-400 font-semibold mb-4">BIOGRAFÍAS</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            LUGAR DONDE PUEDES CONOCER MEJOR A LOS INTEGRANTES DE LA COMUNIDAD
          </p>
        </div>

        <div className="container mx-auto px-4 pb-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400 mb-4"></div>
              <span className="text-gray-600 dark:text-gray-300">Cargando miembros...</span>
            </div>
          ) : error && members.length === 0 ? (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center max-w-md mx-auto">
              <div className="text-red-500 dark:text-red-400 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <p className="text-red-700 dark:text-red-300 font-medium mb-2">Error al cargar los miembros</p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
              <button
                onClick={loadMembers}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 mx-auto"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M22 13.5a10 10 0 1 1-20 0 10 10 0 0 1 20 0z"></path>
                </svg>
                Reintentar
              </button>
            </div>
          ) : members.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 max-w-md mx-auto text-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No hay miembros para mostrar</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">El administrador debe aprobar miembros primero</p>
              <Link
                href="/formulario"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-block"
              >
                ¡Regístrate aquí!
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
                  onClick={() => openModal(member)}
                >
                  <div className="relative">
                    <img
                      src={member.banner || member.avatar || "/placeholder.svg?height=160&width=400"}
                      alt={member.name || "Miembro"}
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=160&width=400"
                      }}
                    />
                    <div className="absolute -bottom-12 left-4">
                      <img
                        src={member.avatar || "/placeholder.svg?height=96&width=96"}
                        alt={member.name || "Miembro"}
                        className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=96&width=96"
                        }}
                      />
                    </div>
                  </div>
                  <div className="pt-16 px-4 pb-4">
                    <h4 className="font-bold text-xl text-gray-800 dark:text-white">{member.name?.toUpperCase()}</h4>
                    <span
                      className={`inline-block px-3 py-1 text-xs rounded-full mt-2 ${
                        member.role === "Administrador"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                          : member.role === "Superior"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      }`}
                    >
                      {member.role?.toUpperCase()}
                    </span>
                    <p className="text-gray-600 dark:text-gray-300 mt-3 line-clamp-2">{member.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de perfil */}
        {selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="relative">
                <img
                  src={selectedMember.banner || "/placeholder.svg?height=192&width=768"}
                  alt={selectedMember.name || "Miembro"}
                  className="w-full h-48 object-cover rounded-t-xl"
                />
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
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
                    className="text-gray-800 dark:text-white"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                <div className="absolute -bottom-16 left-6">
                  <img
                    src={selectedMember.avatar || "/placeholder.svg?height=128&width=128"}
                    alt={selectedMember.name || "Miembro"}
                    className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover"
                  />
                </div>
              </div>

              <div className="pt-20 px-6 pb-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                      {selectedMember.name?.toUpperCase()}
                    </h2>
                    <span
                      className={`inline-block px-3 py-1 text-sm rounded-full mt-2 ${
                        selectedMember.role === "Administrador"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                          : selectedMember.role === "Superior"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      }`}
                    >
                      {selectedMember.role?.toUpperCase()}
                    </span>
                  </div>

                  {selectedMember.social && (
                    <div className="flex gap-3">
                      {selectedMember.social.instagram && (
                        <a
                          href={selectedMember.social.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300"
                        >
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
                          >
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                          </svg>
                        </a>
                      )}
                      {selectedMember.social.twitter && (
                        <a
                          href={selectedMember.social.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                        >
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
                          >
                            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                          </svg>
                        </a>
                      )}
                      {selectedMember.social.facebook && (
                        <a
                          href={selectedMember.social.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
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
                          >
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">SOBRE MÍ</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {selectedMember.description || "No hay descripción disponible."}
                  </p>
                </div>

                {selectedMember.stats && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">ESTADÍSTICAS</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Activo/Social</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedMember.stats?.social || 5}/10
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full"
                            style={{ width: `${(selectedMember.stats?.social || 5) * 10}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Habilidoso</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedMember.stats?.skillful || 5}/10
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div
                            className="bg-green-500 dark:bg-green-400 h-2.5 rounded-full"
                            style={{ width: `${(selectedMember.stats?.skillful || 5) * 10}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Inteligencia</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedMember.stats?.intelligence || 5}/10
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div
                            className="bg-purple-500 dark:bg-purple-400 h-2.5 rounded-full"
                            style={{ width: `${(selectedMember.stats?.intelligence || 5) * 10}%` }}
                          ></div>
                        </div>
                      </div>

                      {(selectedMember.role === "Administrador" || selectedMember.role === "Superior") &&
                        selectedMember.stats?.administrative !== undefined && (
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Administrativa
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedMember.stats.administrative}/10
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                              <div
                                className="bg-red-500 dark:bg-red-400 h-2.5 rounded-full"
                                style={{ width: `${selectedMember.stats.administrative * 10}%` }}
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

        <footer className="bg-gray-800 dark:bg-gray-950 text-white py-6">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; {new Date().getFullYear()} Blog-Teikoku. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
    </ClientProvider>
  )
}
