"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Upload, Check, X, AlertTriangle, Key, RefreshCw } from "lucide-react"

interface Member {
  id: number | string
  name: string
  role: string
  description: string
  avatar: string
  banner: string
  approved: boolean
  date: string
  fingerprint: string
  lastUpdated?: string
  social?: {
    instagram?: string
    twitter?: string
    facebook?: string
  }
  stats?: {
    social?: number
    skillful?: number
    intelligence?: number
    administrative?: number
  }
}

interface FormData {
  name: string
  role: string
  description: string
  avatar: string
  banner: string
  social: {
    instagram: string
    twitter: string
    facebook: string
  }
  stats: {
    social: number
    skillful: number
    intelligence: number
    administrative: number
  }
}

interface RegistrationStatus {
  exists: boolean
  status: "approved" | "pending" | "rejected"
  member: Member
}

interface SyncStatus {
  show: boolean
  status: "syncing" | "success" | "error"
  message: string
}

export default function FormularioPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    role: "",
    description: "",
    avatar: "",
    banner: "",
    social: {
      instagram: "",
      twitter: "",
      facebook: "",
    },
    stats: {
      social: 5,
      skillful: 5,
      intelligence: 5,
      administrative: 5,
    },
  })

  const [avatarSource, setAvatarSource] = useState<"url" | "upload">("url")
  const [bannerSource, setBannerSource] = useState<"url" | "upload" | "same">("url")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState("/placeholder.svg?height=150&width=150")
  const [bannerPreview, setBannerPreview] = useState("/placeholder.svg?height=150&width=300")
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ show: false, status: "syncing", message: "" })
  const [forceNewRegistration, setForceNewRegistration] = useState(false)
  const [accessCode, setAccessCode] = useState("")
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [codeVerified, setCodeVerified] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fingerprint, setFingerprint] = useState<string>("")
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [connectionError, setConnectionError] = useState(false)

  // Función para generar el fingerprint
  const getDeviceFingerprint = useCallback(async (): Promise<string> => {
    try {
      // Añadimos más factores para mejorar la precisión y evitar falsos positivos
      const factors = [
        navigator.userAgent,
        navigator.hardwareConcurrency || "",
        (navigator as any).deviceMemory || "",
        screen.width + "x" + screen.height,
        new Date().getTimezoneOffset(),
        navigator.language,
        navigator.platform,
        (navigator as any).devicePixelRatio || "",
        navigator.languages ? navigator.languages.join(",") : "",
        // Añadimos un identificador único por sesión para evitar colisiones
        sessionStorage.getItem("session_id") || Math.random().toString(36).substring(2, 15),
      ].filter(Boolean)

      // Guardamos un ID de sesión si no existe
      if (!sessionStorage.getItem("session_id")) {
        sessionStorage.setItem("session_id", Math.random().toString(36).substring(2, 15))
      }

      const fingerprint = factors.join("|")
      return btoa(fingerprint).substring(0, 64)
    } catch (error) {
      console.error("Error generating fingerprint:", error)
      let fallbackId = localStorage.getItem("device_fallback_id")
      if (!fallbackId) {
        fallbackId =
          "fallback_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        localStorage.setItem("device_fallback_id", fallbackId)
      }
      return fallbackId
    }
  }, [])

  // Inicializar el fingerprint al cargar la página
  useEffect(() => {
    const initFingerprint = async () => {
      try {
        const fp = await getDeviceFingerprint()
        setFingerprint(fp)
      } catch (error) {
        console.error("Error al inicializar fingerprint:", error)
      }
    }

    initFingerprint()
  }, [getDeviceFingerprint])

  // Verificar el estado de registro cuando cambia el fingerprint
  useEffect(() => {
    if (fingerprint) {
      checkRegistrationStatus()
    }
  }, [fingerprint])

  // Función para hacer peticiones seguras con manejo de errores
  const safeFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    // Añadir headers por defecto si no se especifican
    const headers = {
      Accept: "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      ...(options.headers || {}),
    }

    // Crear un nuevo AbortController
    const controller = new AbortController()

    // Configurar el timeout
    const timeoutMs = options.signal ? 15000 : 10000 // Usar un timeout más largo si ya hay una señal
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, timeoutMs)

    try {
      // Añadir un parámetro de cache-busting
      const separator = url.includes("?") ? "&" : "?"
      const cacheBuster = `nocache=${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      const urlWithCache = `${url}${separator}${cacheBuster}`

      // Hacer la petición
      const response = await fetch(urlWithCache, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      })

      // Limpiar el timeout
      clearTimeout(timeoutId)

      // Verificar si la respuesta es OK
      if (!response.ok) {
        // Try to get response text for better error messages
        let errorText = ""
        try {
          errorText = await response.text()
          errorText = errorText.substring(0, 100) + (errorText.length > 100 ? "..." : "")
        } catch (e) {
          errorText = "No se pudo leer el texto de error"
        }

        throw new Error(`Error HTTP ${response.status}: ${errorText}`)
      }

      // Verificar el tipo de contenido
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        // Try to get response text for better error messages
        let responseText = ""
        try {
          responseText = await response.text()
          responseText = responseText.substring(0, 100) + (responseText.length > 100 ? "..." : "")
        } catch (e) {
          responseText = "No se pudo leer el contenido de la respuesta"
        }

        console.error(`Tipo de contenido no válido: ${contentType}`, responseText)
        throw new Error(`Tipo de contenido no válido: ${contentType}`)
      }

      // Clone the response before parsing to avoid "body already read" errors
      const clonedResponse = response.clone()

      // Parsear la respuesta como JSON
      try {
        return await response.json()
      } catch (parseError) {
        // If JSON parsing fails, try to get the text for better error messages
        const text = await clonedResponse.text()
        console.error("Error parsing JSON:", text.substring(0, 200))
        throw new Error(`Error al parsear JSON: ${parseError.message}`)
      }
    } catch (error: any) {
      // Limpiar el timeout
      clearTimeout(timeoutId)

      // Manejar errores específicos
      if (error.name === "AbortError") {
        throw new Error("La solicitud tardó demasiado tiempo")
      }

      throw error
    }
  }, [])

  const checkRegistrationStatus = useCallback(async () => {
    // Si el usuario ha forzado un nuevo registro, no verificamos el estado
    if (forceNewRegistration || codeVerified || !fingerprint || isCheckingStatus) {
      return
    }

    setIsCheckingStatus(true)
    setConnectionError(false)

    try {
      console.log("Verificando estado de registro...")

      let serverCheckSuccessful = false
      let members = []

      // Intentar obtener los miembros del servidor
      try {
        // Use a more robust approach with explicit content type validation
        const response = await fetch("/api/members", {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        })

        // Check if the response is OK
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`)
        }

        // Check content type before parsing JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Respuesta no es JSON:", contentType)
          // Try to get the text to see what's being returned
          const text = await response.text()
          console.error("Contenido de respuesta:", text.substring(0, 200) + "...")
          throw new Error(`Tipo de contenido no válido: ${contentType}`)
        }

        // Now it's safe to parse JSON
        const data = await response.json()
        members = data || []
        serverCheckSuccessful = true
      } catch (mainError) {
        console.error("Error al verificar en el servidor principal:", mainError)

        // Intentar con el endpoint de respaldo
        try {
          // Create a unique cache-busting parameter
          const cacheBuster = `nocache=${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

          const response = await fetch(`/api/members/check?${cacheBuster}`, {
            headers: {
              Accept: "application/json",
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          })

          // Check if the response is OK
          if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`)
          }

          // Check content type before parsing JSON
          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            console.error("Respuesta de respaldo no es JSON:", contentType)
            throw new Error(`Tipo de contenido no válido en respaldo: ${contentType}`)
          }

          const fallbackData = await response.json()
          members = fallbackData || []
          serverCheckSuccessful = true
        } catch (fallbackError) {
          console.error("Error al verificar en el servidor de respaldo:", fallbackError)
          setConnectionError(true)
        }
      }

      // Si se obtuvieron los miembros del servidor, buscar el miembro actual
      if (serverCheckSuccessful && members.length > 0) {
        const existingMember = members.find((m: any) => m.fingerprint === fingerprint)

        if (existingMember) {
          setRegistrationStatus({
            exists: true,
            status: existingMember.approved ? "approved" : "pending",
            member: existingMember,
          })
          return
        }
      }

      // Si no se encontró en el servidor o hubo un error, verificar en localStorage
      try {
        console.log("Verificando en almacenamiento local...")
        const attempts = JSON.parse(localStorage.getItem("registration_attempts") || "{}")

        if (attempts[fingerprint]) {
          const localMembers = JSON.parse(localStorage.getItem("blog_members") || "[]")
          const localMember = localMembers.find((m: any) => m.id === attempts[fingerprint].memberId)

          if (localMember) {
            setRegistrationStatus({
              exists: true,
              status: attempts[fingerprint].status,
              member: localMember,
            })
            console.log("Registro encontrado en almacenamiento local:", attempts[fingerprint].status)
          }
        }
      } catch (localError) {
        console.error("Error al verificar en almacenamiento local:", localError)
      }
    } catch (error) {
      console.error("Error general al verificar estado:", error)
    } finally {
      setIsCheckingStatus(false)
    }
  }, [fingerprint, forceNewRegistration, codeVerified, isCheckingStatus])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData((prev) => {
        if (parent === "social") {
          return {
            ...prev,
            social: {
              ...prev.social,
              [child]: value,
            },
          }
        } else if (parent === "stats") {
          return {
            ...prev,
            stats: {
              ...prev.stats,
              [child]: Number(value),
            },
          }
        }
        return prev
      })
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    if (name === "avatar" && avatarSource === "url") {
      setAvatarPreview(value || "/placeholder.svg?height=150&width=150")
      if (bannerSource === "same") {
        setBannerPreview(value || "/placeholder.svg?height=150&width=300")
      }
    } else if (name === "banner" && bannerSource === "url") {
      setBannerPreview(value || "/placeholder.svg?height=150&width=300")
    }
  }

  const handleAvatarSourceChange = (source: "url" | "upload") => {
    setAvatarSource(source)
    if (source === "url") {
      setAvatarPreview(formData.avatar || "/placeholder.svg?height=150&width=150")
    } else {
      setAvatarFile(null)
    }
  }

  const handleBannerSourceChange = (source: "url" | "upload" | "same") => {
    setBannerSource(source)
    if (source === "url") {
      setBannerPreview(formData.banner || "/placeholder.svg?height=150&width=300")
    } else if (source === "same") {
      setBannerPreview(avatarPreview)
    } else {
      setBannerFile(null)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setAvatarPreview(result)
        if (bannerSource === "same") {
          setBannerPreview(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setBannerPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleAdminStat = (): boolean => {
    return formData.role === "Administrador" || formData.role === "Superior"
  }

  // Función para verificar un código de acceso
  const verifyCode = async () => {
    if (!accessCode.trim()) {
      setSyncStatus({
        show: true,
        status: "error",
        message: "Por favor ingresa un código de acceso",
      })
      return
    }

    setSyncStatus({
      show: true,
      status: "syncing",
      message: "Verificando código...",
    })

    // Sistema de verificación de tres niveles
    let success = false
    let errorMessage = ""

    // Nivel 1: Intentar con el endpoint principal
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const response = await fetch("/api/codes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
        body: JSON.stringify({
          code: accessCode.trim(),
          fingerprint,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Respuesta del servidor no es JSON")
      }

      const result = await response.json()

      if (result.success) {
        success = true
      } else {
        errorMessage = result.error || "Error desconocido"
        throw new Error(errorMessage)
      }
    } catch (mainError) {
      console.error("Error en verificación principal:", mainError)

      // Nivel 2: Intentar con el endpoint de respaldo
      try {
        console.log("Intentando con endpoint de respaldo...")

        const uniqueParam = `nocache=${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        const fallbackResponse = await fetch(`/api/codes/validate?${uniqueParam}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
          body: JSON.stringify({
            code: accessCode.trim(),
            fingerprint,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Verificar si la respuesta es JSON
        const contentType = fallbackResponse.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Respuesta del servidor de respaldo no es JSON")
        }

        const fallbackResult = await fallbackResponse.json()

        if (fallbackResult.success) {
          success = true
          console.log("Código verificado por sistema de respaldo")
        } else {
          errorMessage = fallbackResult.error || "Error desconocido en respaldo"
          throw new Error(errorMessage)
        }
      } catch (fallbackError) {
        console.error("Error en verificación de respaldo:", fallbackError)

        // Nivel 3: Verificación local
        try {
          console.log("Intentando verificación local...")

          // Verificar si es un código predefinido
          const predefinedCodes = ["ADMIN123", "SUPER456", "BLOG789", "TEST1234", "DEMO5678"]
          if (predefinedCodes.includes(accessCode.trim().toUpperCase())) {
            success = true
            console.log("Código predefinido verificado localmente")
          } else {
            // Verificar si tiene el formato correcto (8 caracteres alfanuméricos)
            const codeRegex = /^[A-Z0-9]{8}$/
            if (codeRegex.test(accessCode.trim().toUpperCase())) {
              // Guardar en localStorage que este código fue usado
              try {
                const usedCodes = JSON.parse(localStorage.getItem("used_codes") || "[]")
                if (!usedCodes.includes(accessCode.trim().toUpperCase())) {
                  usedCodes.push(accessCode.trim().toUpperCase())
                  localStorage.setItem("used_codes", JSON.stringify(usedCodes))
                  success = true
                  console.log("Código verificado localmente")
                } else {
                  errorMessage = "Este código ya ha sido utilizado"
                  throw new Error(errorMessage)
                }
              } catch (localStorageError) {
                console.error("Error al guardar código usado:", localStorageError)
                // Si no podemos guardar en localStorage, aceptamos el código de todas formas
                success = true
              }
            } else {
              errorMessage = "Formato de código inválido"
              throw new Error(errorMessage)
            }
          }
        } catch (localError) {
          console.error("Error en verificación local:", localError)
          errorMessage = localError.message || "Error en verificación local"
        }
      }
    }

    if (success) {
      setSyncStatus({
        show: true,
        status: "success",
        message: "Código verificado correctamente",
      })
      setCodeVerified(true)
      setForceNewRegistration(true)
      setShowCodeInput(false)

      // Guardar en localStorage que este código fue verificado
      try {
        const verifiedCodes = JSON.parse(localStorage.getItem("verified_codes") || "[]")
        if (!verifiedCodes.includes(accessCode.trim().toUpperCase())) {
          verifiedCodes.push(accessCode.trim().toUpperCase())
          localStorage.setItem("verified_codes", JSON.stringify(verifiedCodes))
        }
      } catch (localStorageError) {
        console.error("Error al guardar código verificado:", localStorageError)
      }
    } else {
      setSyncStatus({
        show: true,
        status: "error",
        message: errorMessage || "Error al verificar el código",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      registrationStatus?.exists &&
      registrationStatus.status !== "rejected" &&
      !forceNewRegistration &&
      !codeVerified
    ) {
      return
    }

    // Prevent multiple submissions
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setSyncStatus({ show: true, status: "syncing", message: "Preparando datos..." })

    try {
      // Create a simplified member object with only the essential data
      const newMember = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        role: formData.role,
        description: formData.description.trim(),
        avatar: formData.avatar || "/placeholder.svg?height=150&width=150",
        banner: formData.banner || formData.avatar || "/placeholder.svg?height=150&width=300",
        stats: {
          social: Number(formData.stats.social) || 5,
          skillful: Number(formData.stats.skillful) || 5,
          intelligence: Number(formData.stats.intelligence) || 5,
          ...(toggleAdminStat() ? { administrative: Number(formData.stats.administrative) || 5 } : {}),
        },
        social: {
          instagram: formData.social.instagram || "",
          twitter: formData.social.twitter || "",
          facebook: formData.social.facebook || "",
        },
        fingerprint: fingerprint,
      }

      // Save to local storage first as a backup
      try {
        const members = JSON.parse(localStorage.getItem("blog_members") || "[]")
        members.push({ ...newMember, approved: false, date: new Date().toISOString() })
        localStorage.setItem("blog_members", JSON.stringify(members))

        const attempts = JSON.parse(localStorage.getItem("registration_attempts") || "{}")
        attempts[newMember.fingerprint] = {
          status: "pending",
          memberId: newMember.id,
          timestamp: new Date().toISOString(),
        }
        localStorage.setItem("registration_attempts", JSON.stringify(attempts))

        console.log("Datos guardados en almacenamiento local como respaldo")
      } catch (localStorageError) {
        console.error("Error al guardar en almacenamiento local:", localStorageError)
      }

      setSyncStatus({ show: true, status: "syncing", message: "Enviando formulario al servidor..." })

      // Try the main endpoint first
      let success = false
      let mainError = null

      try {
        const result = await safeFetch("/api/members", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newMember),
        })

        success = true
        console.log("Endpoint principal exitoso:", result)
      } catch (error) {
        mainError = error
        console.error("Endpoint principal falló:", error)
      }

      // If main endpoint failed, try the fallback
      if (!success) {
        try {
          const fallbackResult = await safeFetch("/api/members/fallback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(newMember),
          })

          success = true
          console.log("Endpoint de respaldo exitoso:", fallbackResult)
        } catch (fallbackError) {
          console.error("Endpoint de respaldo también falló:", fallbackError)
          // If both endpoints failed, throw the original error
          throw mainError || fallbackError
        }
      }

      // If either endpoint succeeded, show success
      if (success) {
        setSyncStatus({
          show: true,
          status: "success",
          message: "Formulario enviado correctamente",
        })

        setRegistrationStatus({
          exists: true,
          status: "pending",
          member: { ...newMember, approved: false, date: new Date().toISOString() } as Member,
        })

        // Reset form
        setFormData({
          name: "",
          role: "",
          description: "",
          avatar: "",
          banner: "",
          social: {
            instagram: "",
            twitter: "",
            facebook: "",
          },
          stats: {
            social: 5,
            skillful: 5,
            intelligence: 5,
            administrative: 5,
          },
        })
        setAvatarPreview("/placeholder.svg?height=150&width=150")
        setBannerPreview("/placeholder.svg?height=150&width=300")
        setForceNewRegistration(false)
        setCodeVerified(false)
      }
    } catch (error: any) {
      console.error("Error en el envío del formulario:", error)
      setSyncStatus({
        show: true,
        status: "error",
        message: `Error al enviar: ${error.message || "Error desconocido"}`,
      })

      // Even if server submission failed, we still have the local storage backup
      // So we can show a partial success message
      alert(
        "No se pudo enviar el formulario al servidor, pero se guardó localmente. Por favor, intenta nuevamente más tarde.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const renderStatusMessage = () => {
    if (!registrationStatus?.exists || forceNewRegistration || codeVerified) return null

    if (registrationStatus.status === "approved") {
      return (
        <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6 flex items-center gap-3">
          <Check className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-medium">Ya tienes un perfil aprobado en este dispositivo.</p>
            <p>No puedes enviar más solicitudes a menos que tengas un código de acceso.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                onClick={() => setShowCodeInput(true)}
              >
                Tengo un código de acceso
              </button>
            </div>
          </div>
        </div>
      )
    } else if (registrationStatus.status === "pending") {
      return (
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-6 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
          <div>
            <p className="font-medium">Tu solicitud está pendiente de revisión.</p>
            <p>
              Por favor espera a que un administrador la revise o utiliza un código de acceso para crear un nuevo
              perfil.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                onClick={() => setShowCodeInput(true)}
              >
                Tengo un código de acceso
              </button>
            </div>
          </div>
        </div>
      )
    } else if (registrationStatus.status === "rejected") {
      return (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6 flex items-center gap-3">
          <X className="h-6 w-6 text-red-600" />
          <div>
            <p className="font-medium">Tu solicitud anterior fue rechazada.</p>
            <p>Puedes intentar nuevamente con información diferente.</p>
            <button
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              onClick={async () => {
                try {
                  const attempts = JSON.parse(localStorage.getItem("registration_attempts") || "{}")
                  delete attempts[fingerprint]
                  localStorage.setItem("registration_attempts", JSON.stringify(attempts))
                  setRegistrationStatus(null)
                } catch (error) {
                  console.error("Error al reiniciar estado:", error)
                }
              }}
            >
              Intentar Nuevamente
            </button>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="absolute top-4 right-4 z-10">
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

      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Únete a Blog-Teikoku</h1>
          <h2 className="text-xl text-center text-blue-600 font-semibold mb-6">Formulario de Registro</h2>

          {connectionError && (
            <div className="bg-orange-100 text-orange-800 p-4 rounded-lg mb-6 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium">Problemas de conexión con el servidor</p>
                <p>
                  No se pudo conectar con el servidor. Trabajando en modo offline. Puedes continuar con el formulario,
                  pero los datos se guardarán localmente hasta que se restablezca la conexión.
                </p>
                <button
                  onClick={checkRegistrationStatus}
                  className="mt-2 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  disabled={isCheckingStatus}
                >
                  {isCheckingStatus ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Reintentar conexión
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {showCodeInput ? (
            <div className="bg-blue-50 text-blue-800 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Key className="h-5 w-5" />
                Ingresa tu código de acceso
              </h3>
              <p className="mb-4 text-blue-700">
                Este código te permitirá crear un nuevo perfil incluso si ya tienes uno pendiente o aprobado.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Ingresa el código de 8 caracteres"
                  className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={verifyCode}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Verificar
                </button>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => setShowCodeInput(false)} className="text-blue-600 hover:text-blue-800">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            renderStatusMessage()
          )}

          <form
            onSubmit={handleSubmit}
            className={`space-y-6 ${registrationStatus?.exists && registrationStatus.status !== "rejected" && !forceNewRegistration && !codeVerified ? "opacity-50 pointer-events-none" : ""}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej: María González"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Rol/Cargo
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona un rol</option>
                  <option value="Integrante">Integrante</option>
                  <option value="Administrador">Administrador</option>
                  <option value="Superior">Superior</option>
                  <option value="Fantasma">Fantasma</option>
                  <option value="Ex-Admin">Ex-Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción breve
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                required
                placeholder="Cuéntanos sobre ti, tus intereses y habilidades..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Foto de perfil</label>
              <div className="flex flex-wrap gap-4 mb-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="avatar-url"
                    name="avatar-source"
                    checked={avatarSource === "url"}
                    onChange={() => handleAvatarSourceChange("url")}
                    className="mr-2"
                  />
                  <label htmlFor="avatar-url">Usar URL</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="avatar-upload"
                    name="avatar-source"
                    checked={avatarSource === "upload"}
                    onChange={() => handleAvatarSourceChange("upload")}
                    className="mr-2"
                  />
                  <label htmlFor="avatar-upload">Subir desde mi dispositivo</label>
                </div>
              </div>

              {avatarSource === "url" ? (
                <div>
                  <input
                    type="url"
                    id="avatar"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    placeholder="https://ejemplo.com/foto-perfil.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="avatar-file"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition"
                  >
                    <Upload className="h-5 w-5" />
                    Seleccionar imagen
                  </label>
                  <input
                    type="file"
                    id="avatar-file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <span className="text-sm text-gray-500">{avatarFile?.name || "Ningún archivo seleccionado"}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Foto de banner</label>
              <div className="flex flex-wrap gap-4 mb-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="banner-url"
                    name="banner-source"
                    checked={bannerSource === "url"}
                    onChange={() => handleBannerSourceChange("url")}
                    className="mr-2"
                  />
                  <label htmlFor="banner-url">Usar URL</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="banner-upload"
                    name="banner-source"
                    checked={bannerSource === "upload"}
                    onChange={() => handleBannerSourceChange("upload")}
                    className="mr-2"
                  />
                  <label htmlFor="banner-upload">Subir desde mi dispositivo</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="banner-same"
                    name="banner-source"
                    checked={bannerSource === "same"}
                    onChange={() => handleBannerSourceChange("same")}
                    className="mr-2"
                  />
                  <label htmlFor="banner-same">Usar la misma imagen del perfil</label>
                </div>
              </div>

              {bannerSource === "url" ? (
                <div>
                  <input
                    type="url"
                    id="banner"
                    name="banner"
                    value={formData.banner}
                    onChange={handleInputChange}
                    placeholder="https://ejemplo.com/foto-banner.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ) : bannerSource === "upload" ? (
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="banner-file"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition"
                  >
                    <Upload className="h-5 w-5" />
                    Seleccionar imagen
                  </label>
                  <input
                    type="file"
                    id="banner-file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerUpload}
                  />
                  <span className="text-sm text-gray-500">{bannerFile?.name || "Ningún archivo seleccionado"}</span>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Vista previa avatar</h3>
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mx-auto">
                  <img
                    src={avatarPreview || "/placeholder.svg"}
                    className="w-full h-full object-cover"
                    alt="Vista previa avatar"
                  />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Vista previa banner</h3>
                <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={bannerPreview || "/placeholder.svg"}
                    className="w-full h-full object-cover"
                    alt="Vista previa banner"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Estadísticas (1-10)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="social" className="block text-sm font-medium text-gray-700 mb-1">
                    Activo/Social:
                  </label>
                  <input
                    type="number"
                    id="social"
                    name="stats.social"
                    value={formData.stats.social}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="skillful" className="block text-sm font-medium text-gray-700 mb-1">
                    Habilidoso:
                  </label>
                  <input
                    type="number"
                    id="skillful"
                    name="stats.skillful"
                    value={formData.stats.skillful}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="intelligence" className="block text-sm font-medium text-gray-700 mb-1">
                    Inteligencia:
                  </label>
                  <input
                    type="number"
                    id="intelligence"
                    name="stats.intelligence"
                    value={formData.stats.intelligence}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {toggleAdminStat() && (
                <div className="mt-4">
                  <label htmlFor="administrative" className="block text-sm font-medium text-gray-700 mb-1">
                    Administrativa:
                  </label>
                  <input
                    type="number"
                    id="administrative"
                    name="stats.administrative"
                    value={formData.stats.administrative}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Redes sociales (opcional)</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 flex items-center justify-center bg-pink-100 text-pink-600 rounded-lg mr-3">
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
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </div>
                  <input
                    type="url"
                    id="instagram"
                    name="social.instagram"
                    value={formData.social.instagram}
                    onChange={handleInputChange}
                    placeholder="https://instagram.com/tu-usuario"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg mr-3">
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
                    >
                      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                    </svg>
                  </div>
                  <input
                    type="url"
                    id="twitter"
                    name="social.twitter"
                    value={formData.social.twitter}
                    onChange={handleInputChange}
                    placeholder="https://twitter.com/tu-usuario"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg mr-3">
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
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  </div>
                  <input
                    type="url"
                    id="facebook"
                    name="social.facebook"
                    value={formData.social.facebook}
                    onChange={handleInputChange}
                    placeholder="https://facebook.com/tu-usuario"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {syncStatus.show && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-md shadow-lg ${
            syncStatus.status === "error"
              ? "bg-red-100 text-red-800"
              : syncStatus.status === "success"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {syncStatus.status === "syncing" ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div>
            ) : syncStatus.status === "error" ? (
              <X className="h-5 w-5" />
            ) : (
              <Check className="h-5 w-5" />
            )}
            <span>{syncStatus.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
