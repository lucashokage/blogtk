import { NextResponse } from "next/server"
import { createMember, getAllMembers, getMemberById, updateMember } from "../../../../lib/db"

// POST - Sync members
export async function POST(request: Request) {
  try {
    // Parse request body
    const membersData = await request.json()

    // Ensure we have an array of members
    if (!Array.isArray(membersData)) {
      return NextResponse.json(
        { error: "Expected an array of members", success: false },
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

    // Process each member
    for (const memberData of membersData) {
      try {
        // Skip members without required fields
        if (!memberData.name || !memberData.role || !memberData.description) {
          stats.skipped++
          continue
        }

        // Check if member already exists
        const existingMember = memberData.id ? getMemberById(memberData.id) : null

        if (existingMember) {
          // Update existing member
          updateMember(existingMember.id, {
            ...memberData,
            lastUpdated: new Date().toISOString(),
          })
          stats.updated++
        } else {
          // Create new member
          createMember({
            ...memberData,
            id: memberData.id || undefined, // Will be generated if not provided
            date: memberData.date || new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          })
          stats.added++
        }
      } catch (memberError) {
        console.error("Error processing member during sync:", memberError)
        stats.errors++
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Members synchronized successfully",
        stats,
        total: getAllMembers().length,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error syncing members:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to sync members",
        success: false,
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
