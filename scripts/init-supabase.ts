import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Cargar variables de entorno
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ""

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Faltan variables de entorno de Supabase. Verifica tu configuración.")
  process.exit(1)
}

// Crear cliente con la clave de servicio para tener permisos completos
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function initializeDatabase() {
  console.log("Inicializando base de datos en Supabase...")

  try {
    // Crear tabla de miembros
    console.log("Creando tabla de miembros...")
    const { error: membersError } = await supabase.rpc("create_table_if_not_exists", {
      table_name: "members",
      table_definition: `
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        description TEXT NOT NULL,
        avatar TEXT,
        banner TEXT,
        approved BOOLEAN DEFAULT FALSE,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        lastUpdated TIMESTAMP WITH TIME ZONE NOT NULL,
        fingerprint TEXT,
        rejected BOOLEAN DEFAULT FALSE,
        rejectionDate TIMESTAMP WITH TIME ZONE
      `,
    })

    if (membersError) {
      console.error("Error al crear tabla de miembros:", membersError)
    } else {
      console.log("Tabla de miembros creada o ya existente.")
    }

    // Crear tabla de redes sociales
    console.log("Creando tabla de redes sociales...")
    const { error: socialError } = await supabase.rpc("create_table_if_not_exists", {
      table_name: "social_media",
      table_definition: `
        member_id TEXT PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
        instagram TEXT,
        twitter TEXT,
        facebook TEXT
      `,
    })

    if (socialError) {
      console.error("Error al crear tabla de redes sociales:", socialError)
    } else {
      console.log("Tabla de redes sociales creada o ya existente.")
    }

    // Crear tabla de estadísticas
    console.log("Creando tabla de estadísticas...")
    const { error: statsError } = await supabase.rpc("create_table_if_not_exists", {
      table_name: "stats",
      table_definition: `
        member_id TEXT PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
        social INTEGER DEFAULT 5,
        skillful INTEGER DEFAULT 5,
        intelligence INTEGER DEFAULT 5,
        administrative INTEGER
      `,
    })

    if (statsError) {
      console.error("Error al crear tabla de estadísticas:", statsError)
    } else {
      console.log("Tabla de estadísticas creada o ya existente.")
    }

    // Crear tabla de códigos
    console.log("Creando tabla de códigos...")
    const { error: codesError } = await supabase.rpc("create_table_if_not_exists", {
      table_name: "codes",
      table_definition: `
        code TEXT PRIMARY KEY,
        createdAt TIMESTAMP WITH TIME ZONE NOT NULL,
        expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        usedAt TIMESTAMP WITH TIME ZONE,
        usedBy TEXT
      `,
    })

    if (codesError) {
      console.error("Error al crear tabla de códigos:", codesError)
    } else {
      console.log("Tabla de códigos creada o ya existente.")
    }

    // Crear tabla de usuarios administradores
    console.log("Creando tabla de usuarios administradores...")
    const { error: adminUsersError } = await supabase.rpc("create_table_if_not_exists", {
      table_name: "admin_users",
      table_definition: `
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        lastLogin TIMESTAMP WITH TIME ZONE
      `,
    })

    if (adminUsersError) {
      console.error("Error al crear tabla de usuarios administradores:", adminUsersError)
    } else {
      console.log("Tabla de usuarios administradores creada o ya existente.")
    }

    // Insertar usuarios administradores predeterminados
    console.log("Insertando usuarios administradores predeterminados...")
    const adminUsers = [
      { username: "lucas", password: "lucas9244", role: "admin" },
      { username: "angeles", password: "ange1212", role: "admin" },
      { username: "admin", password: "admin123", role: "superadmin" },
    ]

    for (const user of adminUsers) {
      const { error: insertError } = await supabase.from("admin_users").upsert([user], { onConflict: "username" })

      if (insertError) {
        console.error(`Error al insertar usuario ${user.username}:`, insertError)
      }
    }

    console.log("Inicialización de la base de datos completada.")
  } catch (error) {
    console.error("Error durante la inicialización de la base de datos:", error)
  }
}

// Ejecutar la inicialización
initializeDatabase()
