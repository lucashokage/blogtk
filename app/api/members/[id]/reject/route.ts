import { NextResponse } from "next/server"
import { inMemoryMembers } from "../../route"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log(`Attempting to reject member with ID: ${params.id}`)

    // Validación del ID
    if (!params.id || typeof params.id !== "string") {
      return NextResponse.json(
        { error: "ID de miembro no válido" },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const memberIndex = inMemoryMembers.findIndex((m) => m.id === params.id)

    if (memberIndex === -1) {
      console.error(`Member not found with ID: ${params.id}`)
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Crear miembro actualizado
    const updatedMember = {
      ...inMemoryMembers[memberIndex],
      approved: false,
      rejected: true,
      rejectionDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }

    // Update in-memory storage
    inMemoryMembers[memberIndex] = updatedMember

    return NextResponse.json(
      {
        success: true,
        member: updatedMember,
        message: "Miembro rechazado exitosamente",
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error en el servidor:", error)
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
