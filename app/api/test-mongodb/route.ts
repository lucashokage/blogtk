import { NextResponse } from "next/server"
import mongoose from "mongoose"

export async function GET() {
  try {
    // Check if we're already connected
    if (mongoose.connection.readyState === 1) {
      return NextResponse.json({
        success: true,
        message: "MongoDB ya está conectado",
        status: "connected",
        readyState: mongoose.connection.readyState,
      })
    }

    // Get MongoDB URI from environment variable
    const uri = process.env.MONGODB_URI

    if (!uri) {
      return NextResponse.json(
        {
          success: false,
          error: "No se encontró la variable de entorno MONGODB_URI",
        },
        { status: 500 },
      )
    }

    // Connect to MongoDB
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    })

    return NextResponse.json({
      success: true,
      message: "Conexión exitosa a MongoDB",
      status: "connected",
      readyState: mongoose.connection.readyState,
    })
  } catch (error) {
    console.error("Error connecting to MongoDB:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al conectar a MongoDB",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
