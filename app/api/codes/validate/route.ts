import { NextResponse } from "next/server"

// Lista de códigos predefinidos que siempre funcionan
const PREDEFINED_CODES = ["ADMIN123", "SUPER456", "BLOG789", "TEST1234", "DEMO5678"]

// Endpoint para validar códigos (como respaldo)
export async function POST(request: Request) {
  try {
    // Intentar leer el cuerpo de la solicitud
    let data
    try {
      data = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json(
        { error: "Invalid request body", success: false },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, max-age=0",
          },
        },
      )
    }

    const { code, fingerprint } = data

    if (!code) {
      return NextResponse.json(
        { error: "Code is required", success: false },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, max-age=0",
          },
        },
      )
    }

    // Verificar si es un código predefinido
    if (PREDEFINED_CODES.includes(code.toString().trim().toUpperCase())) {
      return NextResponse.json(
        { success: true, message: "Predefined code verified successfully" },
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, max-age=0",
          },
        },
      )
    }

    // Si no es un código predefinido, verificar si tiene el formato correcto
    // (8 caracteres alfanuméricos)
    const codeRegex = /^[A-Z0-9]{8}$/
    if (!codeRegex.test(code.toString().trim().toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid code format", success: false },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, max-age=0",
          },
        },
      )
    }

    // Si llegamos aquí, el código tiene el formato correcto pero no es un código predefinido
    // Como este es un endpoint de respaldo, vamos a aceptarlo como válido
    return NextResponse.json(
      {
        success: true,
        message: "Code validated by fallback system",
        warning: "This is a fallback validation and may not be accurate",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
        },
      },
    )
  } catch (error) {
    console.error("Error in POST /api/codes/validate:", error)

    // Incluso en caso de error, devolver una respuesta JSON válida
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to validate code",
        success: false,
      },
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
