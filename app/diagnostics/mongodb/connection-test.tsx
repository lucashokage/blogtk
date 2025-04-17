"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"

export default function MongoDBConnectionTest() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState<string>("")
  const [details, setDetails] = useState<string>("")

  const testConnection = async () => {
    try {
      setStatus("loading")
      setMessage("Probando conexión a MongoDB...")

      const response = await fetch("/api/test-mongodb", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage("Conexión exitosa a MongoDB")
        setDetails(data.message || "La base de datos está conectada y funcionando correctamente.")
      } else {
        setStatus("error")
        setMessage("Error de conexión a MongoDB")
        setDetails(data.error || "No se pudo conectar a la base de datos.")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Error al probar la conexión")
      setDetails(error instanceof Error ? error.message : "Error desconocido")
    }
  }

  useEffect(() => {
    // Test connection on component mount
    testConnection()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prueba de Conexión a MongoDB</CardTitle>
        <CardDescription>
          Verifica si la aplicación puede conectarse correctamente a la base de datos MongoDB
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "loading" && (
          <Alert className="bg-blue-50 border-blue-200">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            <AlertTitle>Probando conexión</AlertTitle>
            <AlertDescription>Intentando conectar a MongoDB...</AlertDescription>
          </Alert>
        )}

        {status === "success" && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>{message}</AlertTitle>
            <AlertDescription>{details}</AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert className="bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertTitle>{message}</AlertTitle>
            <AlertDescription>
              {details}
              <div className="mt-2 text-sm">
                Verifica que:
                <ul className="list-disc pl-5 mt-1">
                  <li>La variable de entorno MONGODB_URI está configurada correctamente</li>
                  <li>El servidor MongoDB está en funcionamiento</li>
                  <li>Las credenciales son correctas</li>
                  <li>La dirección IP del servidor está en la lista blanca de MongoDB Atlas</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={testConnection} disabled={status === "loading"} className="flex items-center gap-2">
          {status === "loading" ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Probando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Probar conexión
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
