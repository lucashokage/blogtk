import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { getAllMembers } from "../../../lib/db"

export async function GET() {
  try {
    // Test MongoDB connection
    const mongoStatus = { connected: false, error: null }
    try {
      // Obtener la URI de MongoDB
      const uri = process.env.MONGODB_URI

      if (!uri) {
        throw new Error("MONGODB_URI no está configurado")
      }

      // Limpiar la URI
      const cleanUri = uri.replace(/<|>/g, "")

      // Opciones de conexión
      const options = {
        ssl: true,
        maxPoolSize: 10,
        minPoolSize: 1,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      }

      // Intentar conectar
      mongoose.set("strictQuery", false)
      await mongoose.connect(cleanUri, options)

      mongoStatus.connected = true
    } catch (error) {
      mongoStatus.error = error instanceof Error ? error.message : "Error desconocido"
    }

    // Get members count
    let members = []
    let membersCount = 0

    try {
      members = await getAllMembers()
      membersCount = members.length
    } catch (dbError) {
      console.error("Error getting members:", dbError)
      // Try to get from memory data if available
      if (typeof global !== "undefined" && global.__memoryData && Array.isArray(global.__memoryData.members)) {
        membersCount = global.__memoryData.members.length
      }
    }

    // Check environment
    const environment = {
      nodeEnv: process.env.NODE_ENV,
      isVercel: process.env.VERCEL === "1",
      isRender: process.env.RENDER === "1" || !!process.env.RENDER_PERSISTENT_DIR,
      platform: typeof process !== "undefined" ? process.platform : "unknown",
      hostname: typeof process !== "undefined" ? process.env.HOSTNAME || "unknown" : "unknown",
      mongodbUri: process.env.MONGODB_URI ? "Configurado" : "No configurado",
    }

    return NextResponse.json(
      {
        status: mongoStatus.connected ? "ok" : "warning",
        timestamp: new Date().toISOString(),
        membersCount,
        environment,
        mongoStatus,
        message: mongoStatus.connected
          ? "Conexión a MongoDB establecida correctamente"
          : "Usando almacenamiento en memoria como respaldo",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
        },
      },
    )
  } catch (error) {
    console.error("Error checking server status:", error)

    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
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
