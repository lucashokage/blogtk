import { NextResponse } from "next/server"
import { getMemberById, updateMember, deleteMember } from "../../../../lib/db"

// GET - Get a specific member
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const member = getMemberById(params.id)

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return NextResponse.json(member, {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error(`Error fetching member ${params.id}:`, error)

    return NextResponse.json(
      { error: "Failed to fetch member" },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// PUT - Update a member
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Parse request body
    const updates = await request.json()

    // Update the member
    const updatedMember = updateMember(params.id, updates)

    if (!updatedMember) {
      return NextResponse.json(
        { error: "Member not found" },
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return NextResponse.json(
      {
        success: true,
        member: updatedMember,
        message: "Member updated successfully",
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error(`Error updating member ${params.id}:`, error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update member",
        success: false,
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// DELETE - Delete a member
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const success = deleteMember(params.id)

    if (!success) {
      return NextResponse.json(
        { error: "Member not found" },
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Member deleted successfully",
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error(`Error deleting member ${params.id}:`, error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete member",
        success: false,
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
