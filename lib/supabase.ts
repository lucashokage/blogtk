import { createClient } from "@supabase/supabase-js"

// Estas variables de entorno deben configurarse en tu plataforma de despliegue (Vercel/Render)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan variables de entorno de Supabase. Verifica tu configuración.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Función para verificar la conexión a Supabase
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("health_check").select("*").limit(1)

    if (error) {
      throw error
    }

    return { success: true, message: "Conexión a Supabase establecida correctamente" }
  } catch (error: any) {
    console.error("Error al conectar con Supabase:", error)
    return {
      success: false,
      message: "Error al conectar con Supabase",
      error: error.message || "Error desconocido",
    }
  }
}
