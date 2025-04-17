import { NextResponse } from "next/server"
import { createMember, getAllMembers, type Member } from "../../../../lib/db"

// POST - Import members
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

    // Process each member
    const importedMembers = []

    for (const memberData of membersData) {
      try {
        // Ensure required fields
        if (!memberData.name || !memberData.role || !memberData.description) {
          console.warn("Skipping member with missing required fields:", memberData)
          continue
        }

        // Prepare member data
        const member: Member = {
          ...memberData,
          id: memberData.id || undefined, // Will be generated if not provided
          approved: memberData.approved || false,
          date: memberData.date || new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        }

        // Create the member
        const createdMember = createMember(member)
        importedMembers.push(createdMember)
      } catch (memberError) {
        console.error("Error importing member:", memberError)
        // Continue with next member
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Members imported successfully",
        count: importedMembers.length,
        total: getAllMembers().length,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error importing members:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to import members",
        success: false,
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// GET - Get current members
export async function GET() {
  try {
    const members = getAllMembers()
    return NextResponse.json(members)
  } catch (error) {
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 })
  }
}
