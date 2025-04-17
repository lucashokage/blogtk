import { createClient } from "@supabase/supabase-js"
import Database from "better-sqlite3"
import fs from "fs-extra"
import path from "path"
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

// Función para determinar el directorio de datos de SQLite
function getDataDir() {
  try {
    // Check for environment-provided persistent directory
    if (process.env.PERSISTENT_DIR) {
      const persistentDir = process.env.PERSISTENT_DIR
      return path.isAbsolute(persistentDir) ? persistentDir : path.join(process.cwd(), persistentDir)
    }
    // Check if we're on Render
    else if (process.env.RENDER === "1" || process.env.RENDER_PERSISTENT_DIR) {
      // En Render, usamos el directorio /tmp que es escribible pero no persistente
      return path.join("/tmp", "blog-teikoku-data")
    }
    // Check if we're on Vercel
    else if (process.env.VERCEL === "1") {
      // On Vercel, use the /tmp directory which is writable
      return path.join("/tmp", "blog-teikoku-data")
    }
    // Local development or other environment
    else {
      return path.join(process.cwd(), "data")
    }
  } catch (error) {
    console.error(`Error determining data directory:`, error)
    return path.join(process.cwd(), "data")
  }
}

async function migrateSQLiteToSupabase() {
  console.log("Iniciando migración de SQLite a Supabase...")

  try {
    const dataDir = getDataDir()
    const dbPath = path.join(dataDir, "blog-teikoku.sqlite")

    // Verificar si existe la base de datos SQLite
    if (!fs.existsSync(dbPath)) {
      console.log(`No se encontró la base de datos SQLite en ${dbPath}. Nada que migrar.`)
      return
    }

    console.log(`Conectando a la base de datos SQLite en ${dbPath}...`)
    const db = new Database(dbPath)

    // Migrar miembros
    console.log("Migrando miembros...")
    const members = db.prepare("SELECT * FROM members").all()

    for (const member of members) {
      console.log(`Migrando miembro: ${member.name} (${member.id})`)

      // Insertar miembro en Supabase
      const { error: memberError } = await supabase.from("members").upsert([member], { onConflict: "id" })

      if (memberError) {
        console.error(`Error al migrar miembro ${member.id}:`, memberError)
        continue
      }

      // Migrar datos sociales
      const social = db.prepare("SELECT * FROM social_media WHERE member_id = ?").get(member.id)
      if (social) {
        const { error: socialError } = await supabase.from("social_media").upsert([social], { onConflict: "member_id" })

        if (socialError) {
          console.error(`Error al migrar datos sociales para ${member.id}:`, socialError)
        }
      }

      // Migrar estadísticas
      const stats = db.prepare("SELECT * FROM stats WHERE member_id = ?").get(member.id)
      if (stats) {
        const { error: statsError } = await supabase.from("stats").upsert([stats], { onConflict: "member_id" })

        if (statsError) {
          console.error(`Error al migrar estadísticas para ${member.id}:`, statsError)
        }
      }
    }

    // Migrar códigos
    console.log("Migrando códigos...")
    const codes = db.prepare("SELECT * FROM codes").all()

    for (const code of codes) {
      console.log(`Migrando código: ${code.code}`)

      const { error: codeError } = await supabase.from("codes").upsert([code], { onConflict: "code" })

      if (codeError) {
        console.error(`Error al migrar código ${code.code}:`, codeError)
      }
    }

    // Migrar usuarios administradores
    console.log("Migrando usuarios administradores...")
    const adminUsers = db.prepare("SELECT * FROM admin_users").all()

    for (const user of adminUsers) {
      console.log(`Migrando usuario admin: ${user.username}`)

      const { error: userError } = await supabase.from("admin_users").upsert([user], { onConflict: "username" })

      if (userError) {
        console.error(`Error al migrar usuario admin ${user.username}:`, userError)
      }
    }

    console.log("Migración completada con éxito.")
    db.close()
  } catch (error) {
    console.error("Error durante la migración:", error)
  }
}

// Ejecutar la migración
migrateSQLiteToSupabase()
