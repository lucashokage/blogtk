import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Obtener la ruta actual
  const { pathname } = request.nextUrl

  // Verificar si es una ruta de API
  if (pathname.startsWith("/api/")) {
    // Agregar encabezados CORS para las rutas de API
    const response = NextResponse.next()
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    return response
  }

  // Para todas las demás rutas, continuar normalmente
  return NextResponse.next()
}

// Configurar el middleware para que se ejecute solo en las rutas de API
export const config = {
  matcher: ["/api/:path*"],
}
