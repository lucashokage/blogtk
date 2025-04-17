"use client"

import { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error:", error)
  }, [error])

  return (
    <html lang="es" className="theme-transition">
      <body>
        <ThemeProvider>
          <div className="min-h-screen flex items-center justify-center bg-gradient-anime-error bg-pattern p-4 theme-transition">
            <div className="max-w-md w-full text-center">
              <div className="mb-6">
                <img
                  src="https://i.imgur.com/jCPYi3C.png"
                  alt="Anime girl crying"
                  className="w-64 h-64 mx-auto img-anime"
                />
              </div>
              <div className="card-glass p-8">
                <h2 className="text-3xl font-bold text-anime-pink mb-2 text-shadow">¡Error crítico!</h2>
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <p className="text-red-800 dark:text-red-200 font-medium">
                    Error: {error.message || "Error desconocido"}
                  </p>
                  {error.digest && <p className="text-sm text-gray-500 mt-1">ID de error: {error.digest}</p>}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  ¡Sumimasen! Ha ocurrido un error crítico en la aplicación. Vamos a intentar arreglarlo.
                </p>
                <button
                  onClick={reset}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg btn-anime"
                >
                  Intentar nuevamente
                </button>
              </div>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Error crítico - Por favor, recarga la página
              </div>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
