"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-md bg-white/20 backdrop-blur-sm hover:bg-white/30 dark:bg-gray-800/30 dark:hover:bg-gray-800/50 border border-white/20 dark:border-gray-700/50 transition-all duration-200 shadow-sm"
      title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-yellow-400 transition-transform duration-500 rotate-0 hover:rotate-90" />
      ) : (
        <Moon className="h-5 w-5 text-indigo-700 dark:text-indigo-400 transition-transform duration-500" />
      )}
      <span className="sr-only">{theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}</span>
    </button>
  )
}
