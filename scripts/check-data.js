const fs = require("fs-extra")
const path = require("path")

// Modificar para usar un directorio persistente en Render
const dataDir = process.env.RENDER_PERSISTENT_DIR
  ? path.join(process.env.RENDER_PERSISTENT_DIR, "data")
  : path.join(process.cwd(), "data")

// Rutas de archivos
const membersFilePath = path.join(dataDir, "members.json")
const codesFilePath = path.join(dataDir, "codes.json")
const backupDir = path.join(process.cwd(), "backup")
const membersBackupPath = path.join(backupDir, "members-backup.json")
const codesBackupPath = path.join(backupDir, "codes-backup.json")

// Crear directorios si no existen
if (!fs.existsSync(dataDir)) {
  console.log("Creando directorio de datos...")
  fs.ensureDirSync(dataDir)
}

if (!fs.existsSync(backupDir)) {
  console.log("Creando directorio de respaldo...")
  fs.ensureDirSync(backupDir)
}

// Verificar si el archivo de miembros existe
if (!fs.existsSync(membersFilePath)) {
  console.log("Archivo de miembros no encontrado, verificando respaldo...")

  // Verificar si existe un respaldo
  if (fs.existsSync(membersBackupPath)) {
    console.log("Restaurando desde respaldo...")
    fs.copyFileSync(membersBackupPath, membersFilePath)
    console.log("Restauración completada.")
  } else {
    console.log("No se encontró respaldo, creando archivo vacío...")
    fs.writeFileSync(membersFilePath, "[]", "utf-8")
    console.log("Archivo vacío creado.")
  }
} else {
  // Crear respaldo si el archivo existe
  console.log("Creando respaldo del archivo de miembros...")
  fs.copyFileSync(membersFilePath, membersBackupPath)
  console.log("Respaldo creado.")

  // Verificar integridad del archivo
  try {
    const data = fs.readFileSync(membersFilePath, "utf8")
    JSON.parse(data) // Intentar parsear para verificar que es JSON válido
    console.log("Archivo de miembros verificado correctamente.")
  } catch (error) {
    console.error("Error en el archivo de miembros:", error.message)

    // Restaurar desde respaldo si el archivo está corrupto
    if (fs.existsSync(membersBackupPath)) {
      console.log("Restaurando desde respaldo debido a corrupción...")
      fs.copyFileSync(membersBackupPath, membersFilePath)
      console.log("Restauración completada.")
    } else {
      console.log("No se encontró respaldo, creando archivo vacío...")
      fs.writeFileSync(membersFilePath, "[]", "utf-8")
      console.log("Archivo vacío creado.")
    }
  }
}

// Verificar si el archivo de códigos existe
if (!fs.existsSync(codesFilePath)) {
  console.log("Archivo de códigos no encontrado, verificando respaldo...")

  // Verificar si existe un respaldo
  if (fs.existsSync(codesBackupPath)) {
    console.log("Restaurando desde respaldo...")
    fs.copyFileSync(codesBackupPath, codesFilePath)
    console.log("Restauración completada.")
  } else {
    console.log("No se encontró respaldo, creando archivo vacío...")
    fs.writeFileSync(codesFilePath, "[]", "utf-8")
    console.log("Archivo vacío creado.")
  }
} else {
  // Crear respaldo si el archivo existe
  console.log("Creando respaldo del archivo de códigos...")
  fs.copyFileSync(codesFilePath, codesBackupPath)
  console.log("Respaldo creado.")

  // Verificar integridad del archivo
  try {
    const data = fs.readFileSync(codesFilePath, "utf8")
    JSON.parse(data) // Intentar parsear para verificar que es JSON válido
    console.log("Archivo de códigos verificado correctamente.")
  } catch (error) {
    console.error("Error en el archivo de códigos:", error.message)

    // Restaurar desde respaldo si el archivo está corrupto
    if (fs.existsSync(codesBackupPath)) {
      console.log("Restaurando desde respaldo debido a corrupción...")
      fs.copyFileSync(codesBackupPath, codesFilePath)
      console.log("Restauración completada.")
    } else {
      console.log("No se encontró respaldo, creando archivo vacío...")
      fs.writeFileSync(codesFilePath, "[]", "utf-8")
      console.log("Archivo vacío creado.")
    }
  }
}

console.log("Verificación de datos completada.")
