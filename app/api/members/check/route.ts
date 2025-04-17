import { NextResponse } from "next/server"
import { getAllMembers } from "../../../../lib/db"

export async function GET() {
  try {
    // Get all members from the database
    const members = getAllMembers()

    return NextResponse.json(members, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("Error in /api/members/check:", error)

    // Even in case of error, return an empty array as valid JSON
    return NextResponse.json([], {
      status: 200, // Return 200 even on error to avoid HTML error pages
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    })
  }
}
