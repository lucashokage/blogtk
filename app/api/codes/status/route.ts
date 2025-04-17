import { NextResponse } from "next/server"
import fs from "fs-extra"
import path from "path"

export async function GET() {
  try {
    // Verificar el estado del sistema de códigos
    const status = {
      timestamp: new Date().toISOString(),
      filesystem: {
        exists: false,
        readable: false,
        writable: false,
        path: "",
        error: null,
      },
      memory: {
        exists: false,
        count: 0,
      },
      predefinedCodes: ["ADMIN123", "SUPER456", "BLOG789", "TEST1234", "DEMO5678"],
    }

    // Verificar el sistema de archivos
    try {
      const dataDir = path.join(process.cwd(), "data")
      const codesPath = path.join(dataDir, "codes.json")

      status.filesystem.path = codesPath

      // Verificar si el directorio existe
      if (fs.existsSync(dataDir)) {
        // Verificar si el archivo existe
        if (fs.existsSync(codesPath)) {
          status.filesystem.exists = true

          // Verificar si es legible
          try {
            const data = fs.readFileSync(codesPath, "utf8")
            JSON.parse(data) // Verificar que sea JSON válido
            status.filesystem.readable = true
          } catch (readError) {
            status.filesystem.error = `Error al leer: ${readError.message}`
          }

          // Verificar si es escribible
          try {
            // Intentar escribir un archivo temporal
            const tempPath = path.join(dataDir, ".write-test")
            fs.writeFileSync(tempPath, "test", { flag: "w" })
            fs.unlinkSync(tempPath)
            status.filesystem.writable = true
          } catch (writeError) {
            status.filesystem.error = `Error al escribir: ${writeError.message}`
          }
        }
      }
    } catch (fsError) {
      status.filesystem.error = `Error general: ${fsError.message}`
    }

    // Verificar la memoria global - Modificado para evitar el error "global is not defined"
    // Usamos typeof para verificar si global existe antes de acceder a él
    if (typeof globalThis !== "undefined" && globalThis.__memoryData) {
      status.memory.exists = true
      if (Array.isArray(globalThis.__memoryData.codes)) {
        status.memory.count = globalThis.__memoryData.codes.length
      }
    }

    return NextResponse.json(status, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("Error in GET /api/codes/status:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get status",
        success: false,
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
        },
      },
    )
  }
}
