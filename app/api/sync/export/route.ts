import { NextResponse } from "next/server"
import { exportAllData } from "@/lib/db"

export async function GET() {
  try {
    // Exportar todos los datos
    const data = exportAllData()

    return NextResponse.json(data, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("Error exporting data:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to export data",
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
