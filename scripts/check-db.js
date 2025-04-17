const fs = require("fs-extra")
const path = require("path")
const Database = require("better-sqlite3")
const os = require("os")

// Función para determinar el directorio de datos
function getDataDir() {
  try {
    // Check for environment-provided persistent directory
    if (process.env.PERSISTENT_DIR) {
      const persistentDir = process.env.PERSISTENT_DIR
      return path.isAbsolute(persistentDir) ? persistentDir : path.join(process.cwd(), persistentDir)
    }
    // Check if we're on Render
    else if (process.env.RENDER_PERSISTENT_DIR) {
      const renderDir = process.env.RENDER_PERSISTENT_DIR
      return path.isAbsolute(renderDir) ? renderDir : path.join(process.cwd(), renderDir)
    }
    // Check if we're on Vercel
    else if (process.env.VERCEL === "1") {
      // On Vercel, use the /tmp directory which is writable
      return path.join("/tmp")
    }
    // Local development or other environment
    else {
      return path.join(process.cwd(), "data")
    }
  } catch (error) {
    console.error(`Error determining data directory: ${error.message}`)
    return path.join(process.cwd(), "data")
  }
}

// Obtener el directorio de datos
const dataDir = getDataDir()
const dbPath = path.join(dataDir, "blog-teikoku.sqlite")
const backupDir = path.join(process.cwd(), "backup")

console.log(`Verificando base de datos en: ${dbPath}`)

// Crear directorio de respaldo si no existe
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true })
}

// Verificar si la base de datos existe
if (!fs.existsSync(dbPath)) {
  console.log("La base de datos no existe. Ejecutando script de preparación...")
  try {
    require("./prepare-structure")
  } catch (error) {
    console.error("Error al ejecutar script de preparación:", error)
  }
} else {
  console.log("La base de datos existe. Verificando integridad...")

  try {
    // Crear una copia de seguridad antes de verificar
    const timestamp = new Date().toISOString().replace(/:/g, "-")
    const backupPath = path.join(backupDir, `db-backup-${timestamp}.sqlite`)
    fs.copyFileSync(dbPath, backupPath)
    console.log(`Copia de seguridad creada en: ${backupPath}`)

    // Intentar abrir la base de datos
    const db = new Database(dbPath)

    // Verificar integridad
    const integrityCheck = db.pragma("integrity_check")
    console.log("Resultado de verificación de integridad:", integrityCheck)

    // Verificar si hay tablas
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    console.log(`Tablas encontradas: ${tables.map((t) => t.name).join(", ")}`)

    // Verificar si hay miembros
    const memberCount = db.prepare("SELECT COUNT(*) as count FROM members").get()
    console.log(`Número de miembros: ${memberCount.count}`)

    // Cerrar la conexión
    db.close()

    console.log("Verificación completada con éxito.")
  } catch (error) {
    console.error("Error al verificar la base de datos:", error)
    console.log("Intentando reparar la base de datos...")

    try {
      // Intentar reparar la base de datos
      const db = new Database(dbPath, { readonly: true })
      db.pragma("integrity_check")
      db.close()

      // Si llegamos aquí, la base de datos se puede abrir pero podría tener problemas
      // Intentar vaciar el caché y optimizar
      const writeDb = new Database(dbPath)
      writeDb.pragma("optimize")
      writeDb.close()

      console.log("Base de datos reparada.")
    } catch (repairError) {
      console.error("No se pudo reparar la base de datos:", repairError)
      console.log("Recreando la base de datos...")

      // Eliminar la base de datos corrupta
      fs.unlinkSync(dbPath)

      // Recrear la base de datos
      require("./prepare-structure")
    }
  }
}
