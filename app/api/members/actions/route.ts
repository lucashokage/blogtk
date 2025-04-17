import { NextResponse } from "next/server"
import { getMemberById, updateMember } from "../../../../lib/db"

export async function POST(request: Request) {
  try {
    // Parse request body
    const data = await request.json()
    const { action, memberId } = data

    if (!action || !memberId) {
      return NextResponse.json(
        { error: "Action and memberId are required", success: false },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Check if member exists
    const member = getMemberById(memberId)

    if (!member) {
      return NextResponse.json(
        { error: "Member not found", success: false },
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    let updatedMember

    if (action === "approve") {
      // Approve member
      updatedMember = updateMember(memberId, {
        approved: true,
        rejected: false,
        lastUpdated: new Date().toISOString(),
      })
    } else if (action === "reject") {
      // Reject member
      updatedMember = updateMember(memberId, {
        approved: false,
        rejected: true,
        rejectionDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'approve' or 'reject'.", success: false },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return NextResponse.json(
      {
        success: true,
        member: updatedMember,
        message: action === "approve" ? "Member approved successfully" : "Member rejected successfully",
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error processing member action:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process action",
        success: false,
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
