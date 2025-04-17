const mongoose = require("mongoose")
require("dotenv").config()

async function verifyConnection() {
  console.log("🔍 Verificando conexión a MongoDB...")

  // Usar la URI del ejemplo proporcionado
  const uri =
    process.env.MONGODB_URI || "mongodb+srv://lucasteikoku:lucas9244.@cluster0.tqbihbw.mongodb.net/?appName=Cluster0"

  console.log(`URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, "//****:****@")}`)

  // Opciones de conexión según el ejemplo proporcionado
  const clientOptions = {
    serverApi: {
      version: "1",
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  }

  try {
    console.log("Conectando a MongoDB...")
    await mongoose.connect(uri, clientOptions)

    console.log("✅ Conexión exitosa")

    // Verificar con un ping
    const result = await mongoose.connection.db.admin().command({ ping: 1 })
    console.log("✅ Ping exitoso:", result)

    // Listar colecciones
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log("Colecciones disponibles:")
    collections.forEach((col) => console.log(` - ${col.name}`))

    await mongoose.disconnect()
    console.log("Conexión cerrada")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error de conexión:", error.message)
    process.exit(1)
  }
}

verifyConnection()
