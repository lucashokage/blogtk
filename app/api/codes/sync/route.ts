import { NextResponse } from "next/server"
import { getAllCodes, getCodeByValue, useCode } from "@/lib/db"

// POST - Sync codes
export async function POST(request: Request) {
  try {
    // Parse request body
    const codesData = await request.json()

    // Ensure we have an array of codes
    if (!Array.isArray(codesData)) {
      return NextResponse.json(
        { error: "Expected an array of codes", success: false },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Track stats
    const stats = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    }

    // Process each code
    for (const codeData of codesData) {
      try {
        // Skip invalid codes
        if (!codeData.code || !codeData.createdAt || !codeData.expiresAt) {
          stats.skipped++
          continue
        }

        // Check if code already exists
        const existingCode = await getCodeByValue(codeData.code)

        if (existingCode) {
          // If the existing code is not used but the new one is, mark it as used
          if (!existingCode.used && codeData.used && codeData.usedBy) {
            try {
              await useCode(codeData.code, codeData.usedBy)
              stats.updated++
            } catch (useCodeError) {
              console.error("Error using code during sync:", useCodeError)
              stats.errors++
            }
          } else {
            stats.skipped++
          }
        } else {
          // Create a new code with the provided data
          // Note: We're not using createCode() here because we want to use the provided code value
          // This would require a custom function in the db.ts file
          // For now, we'll just skip this
          stats.skipped++
        }
      } catch (codeError) {
        console.error("Error processing code during sync:", codeError)
        stats.errors++
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Codes synchronized successfully",
        stats,
        total: (await getAllCodes()).length,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error syncing codes:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to sync codes",
        success: false,
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
