import Link from "next/link"
import { ClientProvider } from "@/components/client-provider"

export default function NotFound() {
  return (
    <ClientProvider>
      <div className="min-h-screen flex items-center justify-center bg-gradient-anime bg-pattern p-4 theme-transition">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <img
              src="https://i.imgur.com/qIufhof.png"
              alt="Anime girl confused"
              className="w-64 h-64 mx-auto img-anime"
            />
          </div>
          <div className="card-glass p-8">
            <h2 className="text-3xl font-bold text-anime-blue mb-2 text-shadow">¡Oops! Página no encontrada</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Parece que te has perdido en el multiverso anime. Esta página no existe o ha sido transportada a otra
              dimensión.
            </p>
            <Link
              href="/"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg btn-anime inline-block"
            >
              Volver al inicio
            </Link>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">Error 404 - Página no encontrada</div>
        </div>
      </div>
    </ClientProvider>
  )
}
