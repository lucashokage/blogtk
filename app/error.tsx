"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ClientProvider } from "@/components/client-provider"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <ClientProvider>
      <div className="min-h-screen flex items-center justify-center bg-gradient-anime-error bg-pattern p-4 theme-transition">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <img
              src="https://i.imgur.com/A040Lxr.png"
              alt="Anime girl shocked"
              className="w-64 h-64 mx-auto img-anime"
            />
          </div>
          <div className="card-glass p-8">
            <h2 className="text-3xl font-bold text-anime-pink mb-2 text-shadow">¡Algo salió mal!</h2>
            <div className="bg-pink-50 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800 rounded-lg p-4 mb-4">
              <p className="text-pink-800 dark:text-pink-200 font-medium">
                Error: {error.message || "Error desconocido"}
              </p>
              {error.digest && <p className="text-sm text-gray-500 mt-1">ID de error: {error.digest}</p>}
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              ¡Gomen nasai! Ha ocurrido un error inesperado. Podemos intentar arreglarlo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-6 rounded-lg btn-anime"
              >
                Intentar nuevamente
              </button>
              <Link
                href="/"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg btn-anime"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Error inesperado - Por favor, inténtalo de nuevo
          </div>
        </div>
      </div>
    </ClientProvider>
  )
}
