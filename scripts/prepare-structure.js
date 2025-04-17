const fs = require("fs-extra")
const path = require("path")
const os = require("os")
const Database = require("better-sqlite3")

// Función para determinar el directorio de datos
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
    console.error(`Error determining data directory: ${error.message}`)
    return path.join(os.tmpdir(), "blog-teikoku-data")
  }
}

// Directorios principales
const rootDir = process.cwd()
const dataDir = getDataDir()
const backupDir = path.join(rootDir, "backup")
const assetsDir = path.join(rootDir, "assets")
const vendorDir = path.join(rootDir, "vendor")

console.log(`Using data directory: ${dataDir}`)

// Crear directorios si no existen
console.log("Verificando y creando estructura de directorios...")
;[dataDir, backupDir, assetsDir, vendorDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    console.log(`Creando directorio: ${dir}`)
    try {
      fs.mkdirSync(dir, { recursive: true })
      // Verify the directory was created
      if (fs.existsSync(dir)) {
        console.log(`Directorio creado exitosamente: ${dir}`)

        // Check write permissions by creating a test file
        const testFile = path.join(dir, ".test-write")
        try {
          fs.writeFileSync(testFile, "test")
          fs.unlinkSync(testFile)
          console.log(`Directorio ${dir} tiene permisos de escritura`)
        } catch (writeError) {
          console.error(`¡ADVERTENCIA! No se puede escribir en el directorio ${dir}: ${writeError.message}`)
        }
      } else {
        console.error(`¡ERROR! No se pudo crear el directorio ${dir} a pesar de no haber errores`)
      }
    } catch (error) {
      console.error(`Error al crear directorio ${dir}: ${error.message}`)

      // If this is the data directory, try to create it in a different location
      if (dir === dataDir) {
        const fallbackDir = path.join(os.tmpdir(), "blog-teikoku-data")
        console.log(`Intentando crear directorio de datos alternativo: ${fallbackDir}`)
        try {
          fs.mkdirSync(fallbackDir, { recursive: true })
          console.log(`Directorio alternativo creado: ${fallbackDir}`)
        } catch (fallbackError) {
          console.error(`Error al crear directorio alternativo: ${fallbackError.message}`)
        }
      }
    }
  } else {
    console.log(`El directorio ya existe: ${dir}`)
  }
})

// Inicializar base de datos SQLite
function initializeDatabase() {
  try {
    // Determine the correct database path
    const dbPath = path.join(dataDir, "blog-teikoku.sqlite")

    console.log(`Inicializando base de datos SQLite en: ${dbPath}`)

    // Create database connection
    const db = new Database(dbPath)

    // Enable foreign keys and WAL mode
    db.pragma("foreign_keys = ON")
    db.pragma("journal_mode = WAL")

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        description TEXT NOT NULL,
        avatar TEXT,
        banner TEXT,
        approved INTEGER DEFAULT 0,
        date TEXT NOT NULL,
        lastUpdated TEXT NOT NULL,
        fingerprint TEXT,
        rejected INTEGER DEFAULT 0,
        rejectionDate TEXT
      );
      
      CREATE TABLE IF NOT EXISTS social_media (
        member_id TEXT PRIMARY KEY,
        instagram TEXT,
        twitter TEXT,
        facebook TEXT,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS stats (
        member_id TEXT PRIMARY KEY,
        social INTEGER DEFAULT 5,
        skillful INTEGER DEFAULT 5,
        intelligence INTEGER DEFAULT 5,
        administrative INTEGER,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS codes (
        code TEXT PRIMARY KEY,
        createdAt TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        used INTEGER DEFAULT 0,
        usedAt TEXT,
        usedBy TEXT
      );
      
      CREATE TABLE IF NOT EXISTS admin_users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        lastLogin TEXT
      );
    `)

    // Insert default admin users if they don't exist
    const adminUsers = [
      { username: "lucas", password: "lucas9244", role: "admin" },
      { username: "angeles", password: "ange1212", role: "admin" },
      { username: "admin", password: "admin123", role: "superadmin" },
    ]

    adminUsers.forEach(async (user) => {
      const existingUser = db.prepare("SELECT username FROM admin_users WHERE username = ?").get(user.username)
      if (!existingUser) {
        console.log(`Creando usuario administrador por defecto: ${user.username}`)
        const insert = db.prepare("INSERT INTO admin_users (username, password, role, lastLogin) VALUES (?, ?, ?, ?)")
        insert.run(user.username, user.password, user.role, null)
      }
    })

    db.close()
    console.log("Base de datos inicializada correctamente.")
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error)
  }
}

// Ejecutar la inicialización de la base de datos
initializeDatabase()

console.log("Estructura de directorios y base de datos preparadas.")
