import { NextResponse } from "next/server"
import { createMember, getAllMembers } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

// In-memory fallback for preview environments
export const inMemoryMembers = [
  {
    id: "1",
    name: "Lucas Dalto",
    role: "Administrador",
    description: "Soy el admin",
    avatar: "https://avatars.githubusercontent.com/u/54450458?v=4",
    banner: "https://avatars.githubusercontent.com/u/54450458?v=4",
    approved: true,
    date: "2024-01-01T00:00:00.000Z",
    lastUpdated: "2024-01-01T00:00:00.000Z",
    social: {
      instagram: "https://instagram.com/soyDaltonico",
      twitter: "https://twitter.com/soyDaltonico",
      facebook: "https://facebook.com/soyDaltonico",
    },
    stats: {
      social: 10,
      skillful: 10,
      intelligence: 10,
      administrative: 10,
    },
  },
  {
    id: "2",
    name: "Angeles Dalto",
    role: "Superior",
    description: "Soy la super admin",
    avatar: "https://avatars.githubusercontent.com/u/54450458?v=4",
    banner: "https://avatars.githubusercontent.com/u/54450458?v=4",
    approved: true,
    date: "2024-01-01T00:00:00.000Z",
    lastUpdated: "2024-01-01T00:00:00.000Z",
    social: {
      instagram: "https://instagram.com/soyDaltonico",
      twitter: "https://twitter.com/soyDaltonico",
      facebook: "https://facebook.com/soyDaltonico",
    },
    stats: {
      social: 10,
      skillful: 10,
      intelligence: 10,
      administrative: 10,
    },
  },
]

// GET - Get all members
export async function GET(request: Request) {
  try {
    // Check if we should filter by approval status
    const { searchParams } = new URL(request.url)
    const approvedOnly = searchParams.get("approved") === "true"

    // Get all members from the database
    const members = getAllMembers()

    // Filter by approval status if requested
    const filteredMembers = approvedOnly ? members.filter((member) => member.approved) : members

    return NextResponse.json(filteredMembers, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("Error in GET /api/members:", error)

    // Fallback to in-memory data for preview environments
    if (process.env.VERCEL === "1") {
      console.log("Using in-memory fallback data for preview environment")
      return NextResponse.json(inMemoryMembers, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
        },
      })
    }

    return NextResponse.json(
      { error: "Failed to fetch members", success: false },
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

// POST - Create a new member
export async function POST(request: Request) {
  try {
    // Parse request body
    const memberData = await request.json()

    // Ensure required fields
    if (!memberData.name || !memberData.role || !memberData.description) {
      return NextResponse.json(
        { error: "Name, role, and description are required", success: false },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Generate ID if not provided
    if (!memberData.id) {
      memberData.id = uuidv4()
    }

    // Set default values
    const now = new Date().toISOString()
    memberData.date = memberData.date || now
    memberData.lastUpdated = now
    memberData.approved = false // New members are not approved by default

    console.log("Creating new member:", memberData.name)

    try {
      // Create the member in the database
      const newMember = createMember(memberData)

      return NextResponse.json(
        {
          success: true,
          member: newMember,
          message: "Member created successfully",
        },
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      )
    } catch (dbError) {
      console.error("Database error creating member:", dbError)

      // Fallback for preview environments
      if (process.env.VERCEL === "1") {
        console.log("Using in-memory fallback for preview environment")
        const newMember = { ...memberData, approved: false, date: now, lastUpdated: now }
        inMemoryMembers.push(newMember)

        return NextResponse.json(
          {
            success: true,
            member: newMember,
            message: "Member created in preview environment",
          },
          {
            status: 201,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      throw dbError
    }
  } catch (error) {
    console.error("Error in POST /api/members:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create member",
        success: false,
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
