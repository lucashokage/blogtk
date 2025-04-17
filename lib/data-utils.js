const fs = require("fs-extra")
const path = require("path")
const os = require("os")

// Mejorar la función getDataDir para manejar mejor los entornos de Vercel y Render

// Reemplazar la función getDataDir con esta versión mejorada:
const getDataDir = () => {
  try {
    // First try to use the global data directory set in server.js
    if (global.__dataDir) {
      console.log(`Using global data directory: ${global.__dataDir}`)

      // Verify the directory is writable
      try {
        const testFile = path.join(global.__dataDir, ".write-test")
        fs.writeFileSync(testFile, "test", { flag: "w" })
        fs.unlinkSync(testFile)
        return global.__dataDir
      } catch (writeError) {
        console.error(`Global data directory is not writable: ${writeError.message}`)
        // Continue to fallback options
      }
    }

    // If not available or not writable, determine it here
    let dataDir

    // Check if we're on Vercel
    if (process.env.VERCEL === "1") {
      // On Vercel, use the /tmp directory which is writable
      dataDir = path.join("/tmp", "blog-teikoku-data")
      console.log(`Running on Vercel, using temp directory: ${dataDir}`)
    }
    // Check if we're on Render
    else if (process.env.RENDER === "1" || process.env.RENDER_PERSISTENT_DIR) {
      // Make sure we have an absolute path
      const renderDir = process.env.RENDER_PERSISTENT_DIR || "/var/data"
      if (path.isAbsolute(renderDir)) {
        dataDir = path.join(renderDir, "data")
      } else {
        // If it's not absolute, make it relative to current directory
        dataDir = path.join(process.cwd(), renderDir, "data")
      }
      console.log(`Running on Render, using persistent directory: ${dataDir}`)
    }
    // Local development or other environment
    else {
      dataDir = path.join(process.cwd(), "data")
      console.log(`Using local data directory: ${dataDir}`)
    }

    // Ensure the directory exists and is writable
    try {
      fs.ensureDirSync(dataDir)

      // Verify the directory is writable
      const testFile = path.join(dataDir, ".write-test")
      fs.writeFileSync(testFile, "test", { flag: "w" })
      fs.unlinkSync(testFile)

      return dataDir
    } catch (dirError) {
      console.error(`Error with data directory ${dataDir}: ${dirError.message}`)
      // Continue to fallback
    }

    // If we get here, we need to use a fallback
    throw new Error(`Could not use or create data directory: ${dataDir}`)
  } catch (error) {
    console.error("Error determining data directory:", error)

    // Last resort fallback - use temp directory
    const fallbackDir = path.join(os.tmpdir(), "blog-teikoku-data")
    console.log(`Falling back to temp directory: ${fallbackDir}`)

    try {
      fs.ensureDirSync(fallbackDir)
      return fallbackDir
    } catch (fallbackError) {
      console.error(`Failed to create fallback directory: ${fallbackError.message}`)

      // Ultimate fallback - use current directory
      const ultimateFallback = path.join(process.cwd(), "temp-data")
      console.log(`Using ultimate fallback directory: ${ultimateFallback}`)

      try {
        fs.ensureDirSync(ultimateFallback)
        return ultimateFallback
      } catch (ultimateError) {
        console.error(`Failed to create ultimate fallback directory: ${ultimateError.message}`)
        // At this point, we're out of options
        return os.tmpdir() // Just return the system temp dir as last resort
      }
    }
  }
}

// Get the path to a specific data file
const getDataFilePath = (filename) => {
  return path.join(getDataDir(), filename)
}

// Mejorar la función readJsonFile para leer desde la memoria si es necesario
const readJsonFile = (filename, defaultValue = []) => {
  try {
    const filePath = getDataFilePath(filename)
    console.log(`Reading from: ${filePath}`)

    // Check if we have this data in memory (last resort fallback)
    if (global.__memoryData && global.__memoryData[filename]) {
      console.log(`Reading ${filename} from memory fallback`)
      return global.__memoryData[filename]
    }

    if (!fs.existsSync(filePath)) {
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`)
        fs.ensureDirSync(dir)
      }
      console.log(`Creating empty file: ${filePath}`)
      fs.writeFileSync(filePath, JSON.stringify(defaultValue), "utf-8")
      return defaultValue
    }

    const data = fs.readFileSync(filePath, "utf8")

    try {
      return JSON.parse(data)
    } catch (parseError) {
      console.error(`Error parsing JSON from ${filename}:`, parseError)
      console.log(`File content (first 100 chars): ${data.substring(0, 100)}...`)

      // If the file exists but is corrupted, back it up and return default
      const backupPath = `${filePath}.backup.${Date.now()}`
      fs.copyFileSync(filePath, backupPath)
      console.log(`Backed up corrupted file to: ${backupPath}`)

      // Create a new file with default value
      fs.writeFileSync(filePath, JSON.stringify(defaultValue), "utf-8")
      return defaultValue
    }
  } catch (error) {
    console.error(`Error reading ${filename}:`, error)
    return defaultValue
  }
}

// Enhance the writeJsonFile function with better error handling and fallbacks

// Mejorar la función writeJsonFile para manejar mejor los errores
const writeJsonFile = (filename, data) => {
  try {
    const filePath = getDataFilePath(filename)
    console.log(`Writing to: ${filePath}`)

    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`)
      fs.ensureDirSync(dir)
    }

    // Create a backup before writing
    try {
      if (fs.existsSync(filePath)) {
        const backupPath = `${filePath}.backup.${Date.now()}`
        fs.copyFileSync(filePath, backupPath)
        console.log(`Created backup at: ${backupPath}`)
      }
    } catch (backupError) {
      console.error(`Warning: Failed to create backup: ${backupError.message}`)
      // Continue even if backup fails
    }

    // First write to a temporary file
    const tempPath = `${filePath}.tmp`
    try {
      // Ensure the data is properly serialized
      const jsonData = JSON.stringify(data, null, 2)
      fs.writeFileSync(tempPath, jsonData, "utf-8")
      console.log(`Successfully wrote to temp file: ${tempPath}`)
    } catch (tempWriteError) {
      console.error(`Error writing to temp file: ${tempWriteError.message}`)
      throw tempWriteError
    }

    // Then rename to the actual file (this is more atomic)
    try {
      fs.renameSync(tempPath, filePath)
      console.log(`Successfully renamed temp file to: ${filePath}`)
      return true
    } catch (renameError) {
      console.error(`Error renaming temp file: ${renameError.message}`)

      // If rename fails, try direct write as fallback
      try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
        console.log(`Fallback: Successfully wrote directly to: ${filePath}`)
        return true
      } catch (directWriteError) {
        console.error(`Fallback write failed: ${directWriteError.message}`)

        // Try memory-based fallback
        try {
          // Store in global memory as last resort
          if (!global.__memoryData) {
            global.__memoryData = {}
          }
          global.__memoryData[filename] = data
          console.log(`Stored data for ${filename} in memory as last resort`)
          return true
        } catch (memoryError) {
          console.error(`Even memory fallback failed:`, memoryError)
          throw directWriteError
        }
      }
    }
  } catch (error) {
    console.error(`Error writing ${filename}:`, error)

    // Try fallback write to temp directory
    try {
      const tempDir = path.join(os.tmpdir(), "blog-teikoku-fallback")
      fs.ensureDirSync(tempDir)
      const fallbackPath = path.join(tempDir, filename)
      fs.writeFileSync(fallbackPath, JSON.stringify(data, null, 2), "utf-8")
      console.log(`Wrote to fallback location: ${fallbackPath}`)

      // If we successfully wrote to the fallback, consider it a success
      return true
    } catch (fallbackError) {
      console.error(`Even fallback write failed:`, fallbackError)
    }

    // Store in memory as absolute last resort
    try {
      if (!global.__memoryData) {
        global.__memoryData = {}
      }
      global.__memoryData[filename] = data
      console.log(`Stored data for ${filename} in memory as absolute last resort`)
      return true
    } catch (memoryError) {
      console.error(`Even memory storage failed:`, memoryError)
    }

    return false
  }
}

module.exports = {
  getDataDir,
  getDataFilePath,
  readJsonFile,
  writeJsonFile,
}
