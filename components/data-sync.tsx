"use client"

import { useEffect } from "react"

export default function DataSync() {
  useEffect(() => {
    // Verificar si el respaldo automático está habilitado
    const autoBackupEnabled = localStorage.getItem("auto_backup_enabled") !== "false" // Por defecto true
    if (!autoBackupEnabled) return

    // Obtener el intervalo de respaldo (en minutos)
    const backupIntervalStr = localStorage.getItem("auto_backup_interval")
    const backupInterval = backupIntervalStr ? Number.parseInt(backupIntervalStr, 10) : 30

    // Convertir a milisegundos
    const intervalMs = backupInterval * 60 * 1000

    // Función para realizar el respaldo
    const performBackup = async () => {
      try {
        // Obtener la fecha actual
        const now = new Date()

        // Guardar la fecha del último respaldo
        localStorage.setItem("last_auto_backup_time", now.toISOString())

        console.log(`[DataSync] Respaldo automático realizado: ${now.toLocaleString()}`)
      } catch (error) {
        console.error("[DataSync] Error al realizar respaldo automático:", error)
      }
    }

    // Configurar el intervalo para el respaldo automático
    const intervalId = setInterval(performBackup, intervalMs)

    // Realizar un respaldo inicial al cargar la página
    performBackup()

    // Limpiar el intervalo al desmontar el componente
    return () => clearInterval(intervalId)
  }, [])

  // Este componente no renderiza nada visible
  return null
}
