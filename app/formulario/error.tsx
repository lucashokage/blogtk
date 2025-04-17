"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ThemeProvider } from "../../components/theme-provider"
import { ThemeToggle } from "../../components/theme-toggle"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Error en la página de formulario:", error)
  }, [error])

  return (
    <ThemeProvider>
      <div className="min-h-screen flex items-center justify-center bg-gradient-anime-success bg-pattern p-4 theme-transition">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <img
              src="https://i.imgur.com/qTWwVfr.png"
              alt="Anime girl apologizing"
              className="w-64 h-64 mx-auto img-anime"
            />
          </div>
          <div className="card-glass p-8">
            <h2 className="text-3xl font-bold text-anime-green mb-2 text-shadow">¡Ocurrió un error!</h2>
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <p className="text-green-800 dark:text-green-200 font-medium">
                Error: {error.message || "Error al cargar el formulario"}
              </p>
              {error.digest && <p className="text-sm text-gray-500 mt-1">ID de error: {error.digest}</p>}
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              ¡Gomen ne! Ha ocurrido un error al cargar el formulario. Podemos intentar arreglarlo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg btn-anime"
              >
                Intentar nuevamente
              </button>
              <Link
                href="/"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg btn-anime"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Error en el formulario - Por favor, inténtalo de nuevo
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}
