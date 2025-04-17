import { NextResponse } from "next/server"
import { importDataFromLocalStorage } from "@/lib/db"

export async function POST(request: Request) {
  try {
    // Parse request body
    const data = await request.json()

    // Import data
    const success = importDataFromLocalStorage(data)

    if (success) {
      return NextResponse.json(
        {
          success: true,
          message: "Data imported successfully",
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, max-age=0",
          },
        },
      )
    } else {
      throw new Error("Failed to import data")
    }
  } catch (error) {
    console.error("Error importing data:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to import data",
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
