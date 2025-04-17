import Link from "next/link"
import { ClientProvider } from "@/components/client-provider"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <ClientProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 flex flex-col items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4 md:hidden">
          <ThemeToggle />
        </div>

        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mt-16 md:mt-0">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">Blog-Teikoku</h1>

            <div className="space-y-4">
              <Link
                href="/blog"
                className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50 p-4 rounded-lg transition"
              >
                <div>
                  <h2 className="font-semibold text-blue-700 dark:text-blue-300">Ver Blog</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Explora los perfiles de los miembros</p>
                </div>
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
                  className="h-5 w-5 text-blue-500 dark:text-blue-400"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>

              <Link
                href="/formulario"
                className="flex items-center justify-between bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-800/50 p-4 rounded-lg transition"
              >
                <div>
                  <h2 className="font-semibold text-green-700 dark:text-green-300">Formulario de Registro</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Únete a nuestra comunidad</p>
                </div>
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
                  className="h-5 w-5 text-green-500 dark:text-green-400"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>

              <Link
                href="/admin"
                className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800/50 p-4 rounded-lg transition"
              >
                <div>
                  <h2 className="font-semibold text-purple-700 dark:text-purple-300">Panel de Administración</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Gestiona miembros y solicitudes</p>
                </div>
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
                  className="h-5 w-5 text-purple-500 dark:text-purple-400"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ClientProvider>
  )
}
