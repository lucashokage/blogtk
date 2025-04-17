import { NextResponse } from "next/server"
import { importDataFromLocalStorage, exportAllData } from "@/lib/db"

// POST - Sincronizar datos
export async function POST(request: Request) {
  try {
    // Parse request body
    const data = await request.json()

    if (!data) {
      return NextResponse.json(
        { error: "No data provided", success: false },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Importar datos al servidor
    const success = importDataFromLocalStorage(data)

    if (!success) {
      return NextResponse.json(
        { error: "Failed to import data", success: false },
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Data synchronized successfully",
        timestamp: new Date().toISOString(),
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error in POST /api/sync:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to sync data",
        success: false,
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// GET - Obtener todos los datos
export async function GET() {
  try {
    const data = exportAllData()

    return NextResponse.json(data, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("Error in GET /api/sync:", error)

    return NextResponse.json(
      { error: "Failed to export data", success: false },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
