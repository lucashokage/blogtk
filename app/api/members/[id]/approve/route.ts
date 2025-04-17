import { NextResponse } from "next/server"
import { inMemoryMembers } from "../../route"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const memberId = params.id
    console.log(`Attempting to approve member with ID: ${memberId}`)

    const memberIndex = inMemoryMembers.findIndex((m) => m.id === memberId)

    if (memberIndex === -1) {
      console.error(`Member not found with ID: ${memberId}`)
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Update the member
    const updatedMember = {
      ...inMemoryMembers[memberIndex],
      approved: true,
      lastUpdated: new Date().toISOString(),
    }

    // Update in-memory storage
    inMemoryMembers[memberIndex] = updatedMember

    return NextResponse.json(
      {
        success: true,
        member: updatedMember,
        message: "Miembro aprobado exitosamente",
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error en aprobación:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
