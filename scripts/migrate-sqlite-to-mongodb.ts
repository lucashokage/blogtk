import { MongoClient } from "mongodb"
import Database from "better-sqlite3"
import fs from "fs-extra"
import path from "path"
import dotenv from "dotenv"

// Cargar variables de entorno
dotenv.config()

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

async function migrateSQLiteToMongoDB() {
  console.log("Iniciando migración de SQLite a MongoDB...")

  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error("Error: No se ha configurado MONGODB_URI en las variables de entorno.")
    process.exit(1)
  }

  let client: MongoClient | null = null

  try {
    const dataDir = getDataDir()
    const dbPath = path.join(dataDir, "blog-teikoku.sqlite")

    // Verificar si existe la base de datos SQLite
    if (!fs.existsSync(dbPath)) {
      console.log(`No se encontró la base de datos SQLite en ${dbPath}. Nada que migrar.`)
      return
    }

    console.log(`Conectando a la base de datos SQLite en ${dbPath}...`)
    const sqliteDb = new Database(dbPath)

    // Conectar a MongoDB
    client = new MongoClient(uri)
    await client.connect()
    console.log("Conexión a MongoDB establecida")

    const db = client.db()

    // Migrar miembros
    console.log("Migrando miembros...")
    const members = sqliteDb.prepare("SELECT * FROM members").all()

    for (const member of members) {
      console.log(`Migrando miembro: ${member.name} (${member.id})`)

      // Convertir valores booleanos
      member.approved = Boolean(member.approved)
      member.rejected = Boolean(member.rejected)

      // Usar el id como _id en MongoDB
      const { id, ...memberWithoutId } = member

      // Obtener datos sociales
      const social = sqliteDb.prepare("SELECT * FROM social_media WHERE member_id = ?").get(id)
      if (social) {
        delete social.member_id
        member.social = social
      }

      // Obtener estadísticas
      const stats = sqliteDb.prepare("SELECT * FROM stats WHERE member_id = ?").get(id)
      if (stats) {
        delete stats.member_id
        member.stats = stats
      }

      // Insertar en MongoDB
      await db.collection("members").updateOne({ _id: id }, { $set: { ...memberWithoutId } }, { upsert: true })
    }

    // Migrar códigos
    console.log("Migrando códigos...")
    const codes = sqliteDb.prepare("SELECT * FROM codes").all()

    for (const code of codes) {
      console.log(`Migrando código: ${code.code}`)

      // Convertir valores booleanos
      code.used = Boolean(code.used)

      await db.collection("codes").updateOne({ code: code.code }, { $set: code }, { upsert: true })
    }

    // Migrar usuarios administradores
    console.log("Migrando usuarios administradores...")
    const adminUsers = sqliteDb.prepare("SELECT * FROM admin_users").all()

    for (const user of adminUsers) {
      console.log(`Migrando usuario admin: ${user.username}`)

      await db.collection("admin_users").updateOne({ username: user.username }, { $set: user }, { upsert: true })
    }

    console.log("Migración completada con éxito.")
    sqliteDb.close()
  } catch (error) {
    console.error("Error durante la migración:", error)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log("Conexión a MongoDB cerrada")
    }
  }
}

// Ejecutar la migración
migrateSQLiteToMongoDB().catch(console.error)
