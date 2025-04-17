import { NextResponse } from "next/server"
import { verifyAdminCredentials } from "../../../lib/db"
import { SignJWT } from "jose"

// Secret key for JWT signing
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_change_in_production")

export async function POST(request: Request) {
  try {
    // Parse request body
    const { username, password } = await request.json()

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required", success: false },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Verify credentials - with better error handling
    try {
      const isValid = verifyAdminCredentials(username, password)

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid credentials", success: false },
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
    } catch (dbError) {
      console.error("Database error during authentication:", dbError)

      // Special handling for database access errors
      if (dbError.message && dbError.message.includes("directory does not exist")) {
        return NextResponse.json(
          {
            error: "Database configuration error. Please check server logs.",
            details: "The database directory does not exist or is not accessible.",
            success: false,
          },
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      // For other database errors
      return NextResponse.json(
        {
          error: "Authentication system error",
          details: dbError.message,
          success: false,
        },
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Create JWT token
    const token = await new SignJWT({ username })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET)

    // Set cookie with token
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        username,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    )

    // Set secure cookie in production
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error during login:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Login failed",
        success: false,
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
