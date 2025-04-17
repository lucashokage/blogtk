const mongoose = require("mongoose")
require("dotenv").config()

async function testConnection() {
  console.log("Probando conexión a MongoDB...")

  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error("Error: MONGODB_URI no está configurada")
    process.exit(1)
  }

  try {
    console.log("Conectando con URI directa...")
    await mongoose.connect(uri, {
      ssl: true,
      directConnection: true,
      serverSelectionTimeoutMS: 30000,
    })

    console.log("✅ Conexión exitosa a MongoDB!")
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log(
      "Colecciones disponibles:",
      collections.map((c) => c.name),
    )

    await mongoose.disconnect()
    console.log("Conexión cerrada correctamente")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error de conexión:", error.message)
    process.exit(1)
  }
}

testConnection()
