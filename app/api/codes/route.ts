import { NextResponse } from "next/server"
import { getAllCodes, getCodeByValue, createCode, useCode, deleteCode } from "@/lib/db"

// GET - Get all codes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const onlyActive = searchParams.get("active") === "true"

    // Get all codes
    const codes = getAllCodes()

    // Filter active codes if requested
    const filteredCodes = onlyActive
      ? codes.filter((code) => !code.used && new Date(code.expiresAt) > new Date())
      : codes

    return NextResponse.json(filteredCodes, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("Error fetching codes:", error)

    return NextResponse.json(
      { error: "Failed to fetch codes", success: false },
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

// POST - Create a new code
export async function POST(request: Request) {
  try {
    // Parse request body
    const data = await request.json()
    const { expirationDays = 7 } = data

    // Create a new code
    const newCode = createCode(expirationDays)

    return NextResponse.json(
      {
        success: true,
        code: newCode,
        message: "Code generated successfully",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
        },
      },
    )
  } catch (error) {
    console.error("Error creating code:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create code",
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

// PUT - Verify and use a code
export async function PUT(request: Request) {
  try {
    // Parse request body
    const data = await request.json()
    const { code, fingerprint } = data

    if (!code) {
      return NextResponse.json(
        { error: "Code is required", success: false },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // Check for predefined codes
    const PREDEFINED_CODES = ["ADMIN123", "SUPER456", "BLOG789", "TEST1234", "DEMO5678"]
    if (PREDEFINED_CODES.includes(code.toString().trim().toUpperCase())) {
      return NextResponse.json(
        { success: true, message: "Predefined code verified successfully" },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // Get the code from database
    const codeObj = getCodeByValue(code)

    // Check if code exists
    if (!codeObj) {
      return NextResponse.json(
        { error: "Invalid code", success: false },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // Check if code is already used
    if (codeObj.used) {
      return NextResponse.json(
        { error: "Code already used", success: false },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // Check if code is expired
    if (new Date(codeObj.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Code expired", success: false },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // Mark code as used
    let success = false
    let useCodeResult = false
    if (codeObj) {
      useCodeResult = useCode(code, fingerprint || "unknown")
      success = useCodeResult
    }

    if (!success) {
      return NextResponse.json(
        { error: "Failed to use code", success: false },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Code verified and marked as used",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("Error verifying code:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to verify code",
        success: false,
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}

// DELETE - Delete a code
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json(
        { error: "Code parameter is required", success: false },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // Delete the code
    const success = deleteCode(code)

    if (!success) {
      return NextResponse.json(
        { error: "Code not found", success: false },
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Code deleted successfully",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("Error deleting code:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete code",
        success: false,
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
