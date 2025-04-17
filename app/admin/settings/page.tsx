"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { AlertTriangle, Upload, Download, Clock, X, Check, Loader, Server, Trash2, Copy, RefreshCw } from "lucide-react"
import Link from "next/link"

// Define the safeFetch function directly since we don't have the actual implementation
const safeFetch = async (url: string, options?: any) => {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`)
  }
  return await response.json()
}

interface Code {
  code: string
  createdAt: string
  expiresAt: string
  used: boolean
  usedAt?: string
  usedBy?: string
  isLocal?: boolean
}

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

interface ImportState {
  active: boolean
  countdown: number
  data: any
  fileName: string
}

export default function SettingsPage() {
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    isError: false,
  })
  const [serverStatus, setServerStatus] = useState({
    status: "Verificando...",
    className: "bg-yellow-100 text-yellow-800",
    isEmpty: false,
  })
  const [cacheSize, setCacheSize] = useState("Calculando...")
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true)
  const [autoRestoreEnabled, setAutoRestoreEnabled] = useState(true)
  const [backupInterval, setBackupInterval] = useState(30)
  const [codes, setCodes] = useState<Code[]>([])
  const [loadingCodes, setLoadingCodes] = useState(false)
  const [expirationDays, setExpirationDays] = useState(7)
  const [importState, setImportState] = useState<ImportState>({
    active: false,
    countdown: 5,
    data: null,
    fileName: "",
  })
  const [isImporting, setIsImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState<boolean | null>(null)
  const [importMessage, setImportMessage] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const blogFileInputRef = useRef<HTMLInputElement>(null)
  const membersFileInputRef = useRef<HTMLInputElement>(null)

  const showNotification = (message: string, isError = false) => {
    setNotification({ show: true, message, isError })
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }))
    }, 3000)
  }

  const checkServerStatus = async () => {
    try {
      const response = await fetch("/api/server-status")
      if (!response.ok) throw new Error(`Error: ${response.status}`)

      const data = await response.json()

      // Verificar si el servidor está vacío (recién creado)
      const isEmpty = data.filesystem?.membersFile === "created" || data.membersCount === 0

      setServerStatus({
        status: isEmpty ? "Servidor vacío - Restauración disponible" : "Funcionando correctamente",
        className: isEmpty ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800",
        isEmpty: isEmpty,
      })
    } catch (error) {
      console.error("Error checking server status:", error)
      setServerStatus({
        status: "Error al conectar con el servidor",
        className: "bg-red-100 text-red-800",
        isEmpty: false,
      })
    }
  }

  const calculateCacheSize = () => {
    try {
      let totalSize = 0
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length * 2 // Approximate size in bytes
        }
      }

      if (totalSize < 1024) {
        setCacheSize(`${totalSize} bytes`)
      } else if (totalSize < 1024 * 1024) {
        setCacheSize(`${(totalSize / 1024).toFixed(2)} KB`)
      } else {
        setCacheSize(`${(totalSize / (1024 * 1024)).toFixed(2)} MB`)
      }
    } catch (error) {
      console.error("Error calculating cache size:", error)
      setCacheSize("Error al calcular")
    }
  }

  const getLastSyncTime = () => {
    const lastSyncTime = localStorage.getItem("last_sync_time")
    setLastSync(lastSyncTime)
  }

  const completeImport = async () => {
    if (!importState.data) return

    setIsImporting(true)
    setImportSuccess(null)
    setImportMessage("Importando miembros...")

    try {
      console.log(`[Importación] Iniciando importación de datos:`, typeof importState.data)

      // Guardar en localStorage (solo si es un array)
      if (Array.isArray(importState.data)) {
        localStorage.setItem("blog_members", JSON.stringify(importState.data))
        console.log("[Importación] Datos guardados en localStorage:", importState.data.length, "miembros")
      } else {
        console.log("[Importación] Datos no guardados en localStorage porque no son un array")
      }

      // Sincronizar con el servidor usando la nueva ruta de API específica para importación
      const response = await fetch("/api/members/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importState.data),
      })

      // Capturar el texto de respuesta para depuración
      const responseText = await response.text()
      console.log(`[Importación] Respuesta del servidor (${response.status}):`, responseText)

      // Analizar la respuesta JSON
      let result
      try {
        result = JSON.parse(responseText)
      } catch (e) {
        console.error("[Importación] Error al analizar respuesta JSON:", e)
        throw new Error(`Error al procesar respuesta del servidor: ${responseText}`)
      }

      if (!response.ok) {
        console.error(`[Importación] Error del servidor: ${response.status} - ${responseText}`)
        throw new Error(`Error del servidor: ${result.error || response.status}`)
      }

      if (result.success) {
        const now = new Date().toISOString()
        localStorage.setItem("last_sync_time", now)
        setLastSync(now)

        // Verificar que los datos se cargaron correctamente
        const verificationResult = await verifyImportedData()

        if (verificationResult) {
          setImportSuccess(true)
          setImportMessage(`${result.count || "Varios"} miembros importados correctamente`)
          showNotification(`${result.count || "Varios"} miembros importados correctamente`)

          // Forzar una recarga de la página después de 2 segundos
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        } else {
          throw new Error("Los datos se importaron pero no se pudieron verificar")
        }
      } else {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (error: any) {
      console.error("[Importación] Error importando miembros:", error)
      setImportSuccess(false)
      setImportMessage(`Error: ${error.message}`)
      showNotification(`Error al importar miembros: ${error.message}`, true)

      // A pesar del error en el servidor, mantenemos los datos en localStorage si es posible
      if (Array.isArray(importState.data)) {
        showNotification("Los datos se han guardado localmente, pero no se pudieron sincronizar con el servidor", true)
      }
    } finally {
      // Resetear el estado de importación después de 3 segundos
      setTimeout(() => {
        setImportState({
          active: false,
          countdown: 5,
          data: null,
          fileName: "",
        })
        setIsImporting(false)
      }, 3000)
    }
  }

  // Función para verificar que los datos se cargaron correctamente
  const verifyImportedData = async () => {
    try {
      // Verificar en el servidor
      const response = await fetch("/api/members")
      if (!response.ok) throw new Error(`Error al verificar datos: ${response.status}`)

      const serverMembers = await response.json()

      if (!Array.isArray(serverMembers) || serverMembers.length === 0) {
        throw new Error("No se encontraron miembros en el servidor después de la importación")
      }

      console.log(`[Verificación] Se encontraron ${serverMembers.length} miembros en el servidor`)
      return true
    } catch (error) {
      console.error("Error verificando datos importados:", error)
      return false
    }
  }

  useEffect(() => {
    checkServerStatus()
    calculateCacheSize()
    getLastSyncTime()
    loadBackupSettings()
    loadCodes()
  }, [])

  // Agregar un nuevo useEffect para respaldar los códigos cuando cambien
  useEffect(() => {
    if (codes.length > 0) {
      backupCodesToLocalStorage(codes)
    }
  }, [codes])

  // Efecto para el contador regresivo de importación
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null

    if (importState.active && importState.countdown > 0) {
      timerId = setTimeout(() => {
        setImportState((prev) => ({
          ...prev,
          countdown: prev.countdown - 1,
        }))
      }, 1000)
    } else if (importState.active && importState.countdown === 0 && importState.data) {
      // Cuando el contador llega a cero, realizar la importación
      completeImport()
    }

    return () => {
      if (timerId) clearTimeout(timerId)
    }
  }, [importState])

  // Cargar configuración de respaldo automático
  const loadBackupSettings = () => {
    const enabled = localStorage.getItem("auto_backup_enabled")
    const interval = localStorage.getItem("auto_backup_interval")
    const autoRestore = localStorage.getItem("auto_restore_enabled")

    if (enabled !== null) {
      setAutoBackupEnabled(enabled === "true")
    }

    if (interval !== null) {
      setBackupInterval(Number.parseInt(interval, 10))
    }

    if (autoRestore !== null) {
      setAutoRestoreEnabled(autoRestore === "true")
    }
  }

  // Agregar una función para guardar códigos en localStorage como respaldo
  const backupCodesToLocalStorage = (codes: Code[]) => {
    try {
      localStorage.setItem("backup_codes", JSON.stringify(codes))
    } catch (error) {
      console.error("Error backing up codes to localStorage:", error)
    }
  }

  // Actualizar la función loadCodes para usar safeFetch
  const loadCodes = async () => {
    setLoadingCodes(true)
    try {
      // Intentar cargar los códigos desde el servidor
      const data = await safeFetch("/api/codes", {
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
        cache: "no-store",
      })

      // Verificar que data sea un array
      if (!Array.isArray(data)) {
        console.error("Error: La respuesta no es un array", data)
        throw new Error("Formato de respuesta inválido")
      }

      setCodes(data)

      // Guardar en localStorage como respaldo
      localStorage.setItem("backup_codes", JSON.stringify(data))

      showNotification("Códigos cargados correctamente")
    } catch (error) {
      console.error("Error loading codes:", error)
      showNotification("Error al cargar códigos. Usando datos locales...", true)

      // Intentar cargar desde localStorage como respaldo
      try {
        const localCodes = localStorage.getItem("backup_codes")
        if (localCodes) {
          const parsedCodes = JSON.parse(localCodes)
          setCodes(parsedCodes)
          showNotification("Códigos cargados desde caché local", false)
        } else {
          // Si no hay datos en localStorage, inicializar con array vacío
          setCodes([])
        }
      } catch (localError) {
        console.error("Error loading from local storage:", localError)
        setCodes([])
      }
    } finally {
      setLoadingCodes(false)
    }
  }

  // Función para generar un código localmente como fallback
  const generateLocalCode = (expirationDays: number) => {
    // Generar un código aleatorio de 8 caracteres
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    // Verificar que no exista ya en los códigos locales
    const localCodes = JSON.parse(localStorage.getItem("backup_codes") || "[]")
    if (localCodes.some((c) => c.code === code)) {
      // Si ya existe, generar otro
      return generateLocalCode(expirationDays)
    }

    // Calcular fecha de expiración
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + expirationDays)

    return {
      code,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      used: false,
      isLocal: true, // Marcar como generado localmente
    }
  }

  // Actualizar la función generateCode para manejar mejor los errores y agregar reintentos
  const generateCode = async () => {
    try {
      // Mostrar notificación de carga
      showNotification("Generando código...", false)

      // Sistema de generación de tres niveles
      let success = false
      let generatedCode = null
      let errorMessage = ""

      // Nivel 1: Intentar con el endpoint principal
      try {
        // Crear un AbortController para manejar el timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos de timeout

        const response = await fetch("/api/codes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
          body: JSON.stringify({ expirationDays }),
          signal: controller.signal,
          cache: "no-store",
        })

        // Limpiar el timeout
        clearTimeout(timeoutId)

        // Verificar si la respuesta es JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Error: Respuesta no es JSON", await response.text())
          throw new Error("Respuesta del servidor no es JSON")
        }

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || `Error: ${response.status}`)
        }

        if (result.success && result.code) {
          success = true
          generatedCode = result.code
          console.log("Código generado exitosamente:", generatedCode)
        } else {
          throw new Error(result.error || "Error desconocido")
        }
      } catch (mainError) {
        console.error("Error en generación principal:", mainError)
        errorMessage = mainError.message || "Error en generación principal"

        // Nivel 2: Intentar con un enfoque simplificado
        try {
          showNotification("Reintentando con método alternativo...", false)

          // Generar un código único para evitar problemas de caché
          const uniqueParam = `nocache=${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 8000)

          const retryResponse = await fetch(`/api/codes?${uniqueParam}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "Cache-Control": "no-store, no-cache, must-revalidate",
              Pragma: "no-cache",
            },
            body: JSON.stringify({ expirationDays }),
            signal: controller.signal,
            cache: "no-store",
          })

          clearTimeout(timeoutId)

          // Verificar si la respuesta es válida
          if (!retryResponse.ok) {
            const errorText = await retryResponse.text()
            console.error("Error en reintento (respuesta no ok):", errorText)
            throw new Error(`Error del servidor: ${retryResponse.status}`)
          }

          // Intentar analizar la respuesta como JSON
          let retryResult
          try {
            retryResult = await retryResponse.json()
          } catch (parseError) {
            console.error("Error al analizar JSON en reintento:", parseError)
            throw new Error("No se pudo analizar la respuesta del servidor")
          }

          // Verificar si la respuesta contiene los datos esperados
          if (retryResult && retryResult.success && retryResult.code) {
            success = true
            generatedCode = retryResult.code
            console.log("Código generado en reintento:", generatedCode)
          } else {
            console.error("Respuesta inesperada en reintento:", retryResult)
            throw new Error("Respuesta inesperada del servidor")
          }
        } catch (retryError) {
          console.error("Error en reintento:", retryError)
          errorMessage = retryError.message || "Error en reintento"

          // Nivel 3: Generar un código localmente como fallback
          try {
            console.log("Generando código localmente...")
            // Generar un código localmente
            const localCode = generateLocalCode(expirationDays)
            success = true
            generatedCode = localCode
            console.log("Código generado localmente:", localCode)
          } catch (localError) {
            console.error("Error generando código local:", localError)
            errorMessage = localError.message || "Error generando código local"
          }
        }
      }

      if (success && generatedCode) {
        showNotification(`Código generado: ${generatedCode.code}`)

        // Guardar en localStorage
        try {
          const localCodes = JSON.parse(localStorage.getItem("backup_codes") || "[]")

          // Verificar si el código ya existe
          if (!localCodes.some((c) => c.code === generatedCode.code)) {
            localCodes.push(generatedCode)
            localStorage.setItem("backup_codes", JSON.stringify(localCodes))
          }
        } catch (storageError) {
          console.error("Error al guardar en localStorage:", storageError)
        }

        // Actualizar la UI
        setCodes((prevCodes) => {
          // Verificar si el código ya existe
          if (prevCodes.some((c) => c.code === generatedCode.code)) {
            return prevCodes
          }
          return [...prevCodes, generatedCode]
        })
      } else {
        throw new Error(errorMessage || "Error desconocido al generar código")
      }
    } catch (error) {
      console.error("Error general en generateCode:", error)
      showNotification(`Error al generar código: ${error.message || "Error desconocido"}`, true)
    }
  }

  // Actualizar la función deleteCode para manejar mejor los errores
  const deleteCode = async (code: string) => {
    try {
      showNotification("Eliminando código...", false)

      // Sistema de eliminación de tres niveles
      let success = false
      let errorMessage = ""

      // Nivel 1: Intentar con el endpoint principal
      try {
        // Crear un AbortController para manejar el timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos de timeout

        // Añadir un parámetro único para evitar caché
        const uniqueParam = `nocache=${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

        const response = await fetch(`/api/codes?code=${code}&${uniqueParam}`, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
          signal: controller.signal,
          cache: "no-store",
        })

        // Limpiar el timeout
        clearTimeout(timeoutId)

        // Verificar si la respuesta es JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Error: Respuesta no es JSON", await response.text())
          throw new Error("Respuesta del servidor no es JSON")
        }

        const result = await response.json()

        if (result.success) {
          success = true
          console.log("Código eliminado exitosamente mediante API principal")
        } else {
          errorMessage = result.error || "Error desconocido"
          throw new Error(errorMessage)
        }
      } catch (mainError) {
        console.error("Error en eliminación principal:", mainError)
        errorMessage = mainError.message || "Error en eliminación principal"

        // Nivel 2: Intentar con un enfoque simplificado
        try {
          console.log("Reintentando eliminación con método alternativo...")

          // Generar un código único para evitar problemas de caché
          const uniqueParam = `nocache=${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 8000)

          // Usar XMLHttpRequest como alternativa a fetch
          const xhr = new XMLHttpRequest()

          // Crear una promesa para manejar la respuesta
          const xhrPromise = new Promise<any>((resolve, reject) => {
            xhr.onreadystatechange = () => {
              if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                  try {
                    const result = JSON.parse(xhr.responseText)
                    resolve(result)
                  } catch (parseError) {
                    reject(new Error("Error al analizar respuesta JSON"))
                  }
                } else {
                  reject(new Error(`Error HTTP: ${xhr.status}`))
                }
              }
            }
            xhr.ontimeout = () => {
              reject(new Error("Timeout en la solicitud"))
            }
            xhr.onerror = () => {
              reject(new Error("Error en la solicitud"))
            }
          })

          xhr.open("DELETE", `/api/codes?code=${code}&${uniqueParam}`, true)
          xhr.setRequestHeader("Accept", "application/json")
          xhr.setRequestHeader("Content-Type", "application/json")
          xhr.setRequestHeader("Cache-Control", "no-store, no-cache, must-revalidate")
          xhr.setRequestHeader("Pragma", "no-cache")
          xhr.timeout = 8000
          xhr.send()

          // Esperar la respuesta
          const retryResult = await xhrPromise

          // Limpiar el timeout
          clearTimeout(timeoutId)

          if (retryResult && retryResult.success) {
            success = true
            console.log("Código eliminado exitosamente mediante método alternativo")
          } else {
            errorMessage = retryResult?.error || "Error desconocido en reintento"
            throw new Error(errorMessage)
          }
        } catch (retryError) {
          console.error("Error en reintento de eliminación:", retryError)
          errorMessage = retryError.message || "Error en reintento de eliminación"

          // No hacemos nada más aquí, pasamos al nivel 3
        }
      }

      // Nivel 3: Eliminar localmente (siempre se ejecuta, incluso si los niveles anteriores tuvieron éxito)
      try {
        // Eliminar del estado local
        setCodes((prevCodes) => prevCodes.filter((c) => c.code !== code))

        // Actualizar localStorage
        const localCodes = JSON.parse(localStorage.getItem("backup_codes") || "[]")
        const updatedLocalCodes = localCodes.filter((c) => c.code !== code)
        localStorage.setItem("backup_codes", JSON.stringify(updatedLocalCodes))

        success = true
        console.log("Código eliminado localmente")
      } catch (localError) {
        console.error("Error eliminando código localmente:", localError)

        // Si los niveles anteriores tuvieron éxito, no cambiamos el estado de éxito
        if (!success) {
          errorMessage = localError.message || "Error eliminando código localmente"
        }
      }

      if (success) {
        showNotification("Código eliminado correctamente")
      } else {
        throw new Error(errorMessage || "Error desconocido al eliminar código")
      }
    } catch (error) {
      console.error("Error general en deleteCode:", error)
      showNotification(`Error al eliminar código: ${error.message || "Error desconocido"}`, true)
    }
  }

  // Función para verificar el estado del sistema de códigos
  const checkCodesStatus = async () => {
    try {
      showNotification("Verificando estado del sistema de códigos...", false)

      const response = await fetch("/api/codes/status", {
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const status = await response.json()

      console.log("Estado del sistema de códigos:", status)

      // Mostrar un resumen del estado
      let statusMessage = "Estado del sistema de códigos:\n"

      if (status.filesystem?.exists) {
        statusMessage += "✅ Archivo de códigos encontrado\n"
      } else {
        statusMessage += "❌ Archivo de códigos no encontrado\n"
      }

      if (status.filesystem?.readable) {
        statusMessage += "✅ Archivo de códigos legible\n"
      } else {
        statusMessage += "❌ Archivo de códigos no legible\n"
      }

      if (status.filesystem?.writable) {
        statusMessage += "✅ Sistema de archivos escribible\n"
      } else {
        statusMessage += "❌ Sistema de archivos no escribible\n"
      }

      if (status.memory?.exists) {
        statusMessage += `✅ Memoria global disponible (${status.memory.count} códigos)\n`
      } else {
        statusMessage += "❌ Memoria global no disponible\n"
      }

      alert(statusMessage)

      showNotification("Verificación completada")
    } catch (error) {
      console.error("Error al verificar estado:", error)
      showNotification(`Error al verificar estado: ${error.message}`, true)
    }
  }

  // Función para sincronizar códigos locales con el servidor
  const syncCodes = async () => {
    try {
      showNotification("Sincronizando códigos...", false)

      // Obtener los códigos locales
      const localCodes = JSON.parse(localStorage.getItem("backup_codes") || "[]")

      if (localCodes.length === 0) {
        showNotification("No hay códigos locales para sincronizar", true)
        return
      }

      // Enviar los códigos al servidor
      const response = await safeFetch("/api/codes/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(localCodes),
      })

      if (response.success) {
        showNotification(`Sincronización exitosa: ${response.added} añadidos, ${response.updated} actualizados`)

        // Recargar los códigos
        loadCodes()
      } else {
        throw new Error(response.error || "Error desconocido")
      }
    } catch (error: any) {
      console.error("Error syncing codes:", error)
      showNotification(`Error al sincronizar códigos: ${error.message}`, true)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showNotification("Código copiado al portapapeles")
  }

  // Nueva función para manejar la importación de datos
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        // Verificar que los datos son válidos
        if (!data || (Array.isArray(data) && data.length === 0)) {
          showNotification("El archivo no contiene datos válidos", true)
          return
        }

        // Iniciar el proceso de importación con cuenta regresiva
        setImportState({
          active: true,
          countdown: 5,
          data: data,
          fileName: file.name,
        })

        showNotification(`Archivo cargado: ${file.name}. Importación en 5 segundos...`)
      } catch (error) {
        console.error("Error al procesar el archivo:", error)
        showNotification("Error al procesar el archivo. Asegúrate de que sea un JSON válido.", true)
      }
    }
    reader.readAsText(file)
  }

  // Nueva función para exportar datos
  const exportData = async () => {
    try {
      setIsExporting(true)
      showNotification("Preparando datos para exportar...", false)

      // Obtener los datos actuales
      const response = await fetch("/api/members")
      if (!response.ok) {
        throw new Error(`Error al obtener datos: ${response.status}`)
      }

      const members = await response.json()

      if (!Array.isArray(members) || members.length === 0) {
        showNotification("No hay datos para exportar", true)
        setIsExporting(false)
        return
      }

      // Crear el archivo de exportación
      const dataStr = JSON.stringify(members, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)

      // Crear un enlace para descargar el archivo
      const link = document.createElement("a")
      link.href = url
      link.download = `blog-teikoku-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showNotification(`${members.length} miembros exportados correctamente`)
    } catch (error: any) {
      console.error("Error al exportar datos:", error)
      showNotification(`Error al exportar datos: ${error.message}`, true)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Configuración</h1>
      </div>

      {/* Contador regresivo para importación */}
      {importState.active && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="text-center mb-4">
              <Clock className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Importación en progreso</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Se importarán {Array.isArray(importState.data) ? importState.data.length : "varios"} miembros desde el
                archivo <span className="font-medium text-primary">{importState.fileName}</span> en:
              </p>
              <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-6">{importState.countdown}</div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={completeImport}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Importar ahora
                </button>
                <button
                  onClick={() =>
                    setImportState({
                      active: false,
                      countdown: 5,
                      data: null,
                      fileName: "",
                    })
                  }
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado de importación */}
      {isImporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="text-center mb-4">
              {importSuccess === null ? (
                <Loader className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-spin" />
              ) : importSuccess ? (
                <Check className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
              ) : (
                <X className="h-16 w-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
              )}
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                {importSuccess === null ? "Procesando" : importSuccess ? "¡Éxito!" : "Error"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{importMessage}</p>
              {importSuccess === true && (
                <p className="text-green-600 dark:text-green-400 text-sm">
                  La página se recargará automáticamente en unos segundos...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Server Status with Restore Option */}
      {serverStatus.isEmpty && autoRestoreEnabled && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-800/30 rounded-full">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                Servidor recién desplegado detectado
              </h3>
              <p className="text-yellow-700 dark:text-yellow-400 mb-4">
                Parece que este es un nuevo despliegue o el servidor ha sido reiniciado. Puedes restaurar tus datos
                desde tu copia local.
              </p>
              <button
                onClick={() => {
                  // Implementación básica para restaurar desde local
                  showNotification("Restaurando datos desde local...", false)
                }}
                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Upload size={18} />
                Restaurar datos desde local
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Importar/Exportar Datos */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Importar/Exportar Datos</h3>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Importa o exporta los datos de miembros para hacer copias de seguridad o transferir datos entre
              instalaciones.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Importar Datos
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                  Sube un archivo JSON con los datos de miembros para importarlos al sistema.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  ref={fileInputRef}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  Seleccionar archivo
                </label>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Exportar Datos
                </h4>
                <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                  Descarga todos los datos de miembros en formato JSON para hacer una copia de seguridad.
                </p>
                <button
                  onClick={exportData}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition w-full"
                >
                  {isExporting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Exportar datos
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Estado del almacenamiento</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Tamaño de caché local</p>
                <p className="font-medium text-gray-800 dark:text-gray-200">{cacheSize}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Última sincronización</p>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {lastSync ? new Date(lastSync).toLocaleString() : "Nunca"}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Estado del servidor</p>
                <p className={`font-medium ${serverStatus.className}`}>{serverStatus.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Códigos de Registro de Un Solo Uso */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Códigos de Registro de Un Solo Uso</h3>
            <div className="flex gap-2">
              <button
                onClick={loadCodes}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                title="Recargar códigos"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button
                onClick={checkCodesStatus}
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                title="Verificar estado del sistema"
              >
                <Server className="h-5 w-5" />
              </button>
              <button
                onClick={syncCodes}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                title="Sincronizar códigos"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Genera códigos de un solo uso para permitir registros adicionales. Estos códigos pueden ser compartidos
              con usuarios para que puedan registrarse incluso si ya tienen un perfil existente.
            </p>

            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <label htmlFor="expiration-days" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Días de validez:
                </label>
                <input
                  type="number"
                  id="expiration-days"
                  min="1"
                  max="30"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={generateCode}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition h-[42px]"
                >
                  Generar código
                </button>
              </div>
            </div>
          </div>

          {loadingCodes ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No hay códigos generados</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Creado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Expira
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {codes.map((code) => (
                    <tr key={code.code} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono font-medium text-gray-900 dark:text-white">{code.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(code.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(code.expiresAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            code.used
                              ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              : new Date(code.expiresAt) < new Date()
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          }`}
                        >
                          {code.used ? "Usado" : new Date(code.expiresAt) < new Date() ? "Expirado" : "Activo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                          title="Copiar código"
                        >
                          <Copy className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteCode(code.code)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Eliminar código"
                        >
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

        {/* Database Verification Link */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Verificación de Base de Datos MongoDB
            </h3>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Accede a la página de verificación de la base de datos MongoDB para comprobar su estado, usuarios
              administradores, miembros y códigos.
            </p>

            <Link
              href="/admin/database"
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition w-full md:w-auto"
            >
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
                className="h-5 w-5"
              >
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
              </svg>
              Verificar Base de Datos
            </Link>
          </div>
        </div>
      </div>

      {/* Acceso a la verificación de la base de datos */}
      <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Verificación de Base de Datos MongoDB
          </h3>
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
            className="h-6 w-6 text-blue-600 dark:text-blue-400"
          >
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Accede a la página de verificación de la base de datos MongoDB para comprobar su estado y contenido.
          Necesitarás el código de acceso: <span className="font-mono font-medium">lucas9244</span>
        </p>
        <Link
          href="/admin/database"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition w-full md:w-auto"
        >
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
            className="h-5 w-5"
          >
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
          </svg>
          Verificar Base de Datos
        </Link>
      </div>

      {notification.show && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-md shadow-lg ${
            notification.isError
              ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
              : "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.isError ? <AlertTriangle className="h-5 w-5" /> : <Check className="h-5 w-5" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
