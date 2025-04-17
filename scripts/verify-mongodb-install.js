// Verificar que mongodb está correctamente instalado
try {
  const mongodb = require("mongodb")
  console.log("✅ MongoDB está correctamente instalado")
  console.log("Versión:", mongodb.version)

  // Verificar que mongoose también está instalado
  const mongoose = require("mongoose")
  console.log("✅ Mongoose está correctamente instalado")
  console.log("Versión:", mongoose.version)

  console.log("Todas las dependencias están correctamente instaladas")
} catch (error) {
  console.error("❌ Error al verificar las dependencias:", error.message)
  process.exit(1)
}
