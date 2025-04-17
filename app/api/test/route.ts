import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { getAllMembers } from "../../../lib/db"

export async function GET() {
  try {
    // Check environment
    const environment = {
      nodeEnv: process.env.NODE_ENV,
      isVercel: process.env.VERCEL === "1",
      isRender: !!process.env.RENDER,
      renderPersistentDir: process.env.RENDER_PERSISTENT_DIR || "Not set",
      platform: typeof process !== "undefined" ? process.platform : "unknown",
      hostname: typeof process !== "undefined" ? process.env.HOSTNAME || "unknown" : "unknown",
      mongodbUri: process.env.MONGODB_URI ? "Configurado" : "No configurado",
    }

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
    let membersCount = 0
    try {
      const members = await getAllMembers()
      membersCount = members.length
    } catch (error) {
      console.error("Error getting members count:", error)
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment,
      mongoStatus,
      membersCount,
      message: mongoStatus.connected
        ? "Conexión a MongoDB establecida correctamente"
        : "Usando almacenamiento en memoria como respaldo",
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
