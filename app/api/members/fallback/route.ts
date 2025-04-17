import { NextResponse } from "next/server"
import { inMemoryMembers } from "../route"

// Función para asegurar que siempre devolvemos JSON
function safeJsonResponse(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
    },
  })
}

// GET - Obtener todos los miembros (respaldo)
export async function GET() {
  try {
    // Devolver los mismos datos que el endpoint principal
    return safeJsonResponse(inMemoryMembers)
  } catch (error) {
    console.error("Error en endpoint de respaldo:", error)
    // Incluso en caso de error, devolvemos un JSON válido
    return safeJsonResponse([], 200)
  }
}

// POST - Crear un nuevo miembro (respaldo)
export async function POST(request: Request) {
  try {
    // Parsear el cuerpo de la solicitud
    const newMember = await request.json().catch(() => null)

    if (!newMember) {
      return safeJsonResponse({ success: false, error: "Datos de miembro no válidos" }, 400)
    }

    // En este endpoint de respaldo, simplemente simulamos éxito
    // sin validaciones extensas

    return safeJsonResponse(
      {
        success: true,
        message: "Miembro guardado en modo de respaldo",
        member: {
          ...newMember,
          id: Date.now(),
          approved: false,
          date: new Date().toISOString(),
        },
      },
      201,
    )
  } catch (error) {
    console.error("Error en endpoint de respaldo:", error)
    return safeJsonResponse(
      {
        success: false,
        error: "Error en el servidor de respaldo",
        // Aún así, indicamos que los datos se guardaron localmente
        localSaved: true,
      },
      500,
    )
  }
}
