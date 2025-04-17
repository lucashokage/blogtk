"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Users page error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error en la página de usuarios</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-medium">Error: {error.message || "Error al cargar los usuarios"}</p>
            {error.digest && <p className="text-sm text-gray-500 mt-1">ID de error: {error.digest}</p>}
          </div>
          <p className="text-gray-600 mb-6">
            Lo sentimos, ha ocurrido un error al cargar la página de usuarios. Esto puede deberse a problemas de
            conexión o del servidor.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Intentar nuevamente
            </button>
            <Link
              href="/admin"
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
