const mongoose = require("mongoose")
require("dotenv").config()

async function testConnection() {
  console.log("🔍 Probando conexión a MongoDB...")

  // Use the exact connection string format that works for the user
  const uri =
    process.env.MONGODB_URI || "mongodb+srv://lucasteikoku:lucas9244.@cluster0.tqbihbw.mongodb.net/?appName=Cluster0"

  if (!uri) {
    console.error("❌ Error: MONGODB_URI no está configurada en las variables de entorno")
    console.log("⚠️ Usando URI de ejemplo")
  }

  console.log(`🔄 Conectando a MongoDB...`)

  try {
    // Configure mongoose
    mongoose.set("strictQuery", false)

    // Connection options based on the working example
    const clientOptions = {
      serverApi: {
        version: "1",
        strict: true,
        deprecationErrors: true,
      },
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    }

    // Try to connect
    await mongoose.connect(uri, clientOptions)

    console.log("✅ Conexión exitosa a MongoDB")

    // Verify connection with a ping
    const admin = mongoose.connection.db.admin()
    const ping = await admin.ping()
    console.log("✅ Ping exitoso:", ping)

    // Show database information
    console.log(`📊 Base de datos: ${mongoose.connection.name}`)

    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log("📚 Colecciones disponibles:")
    collections.forEach((col) => console.log(` - ${col.name}`))

    return true
  } catch (error) {
    console.error("❌ Error de conexión:", error.message)

    // Try alternative connection if the first one fails
    try {
      console.log("🔄 Intentando conexión alternativa...")

      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect()
      }

      // Alternative options with less strict settings
      const alternativeOptions = {
        serverApi: {
          version: "1",
          strict: false,
          deprecationErrors: false,
        },
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      }

      await mongoose.connect(uri, alternativeOptions)
      console.log("✅ Conexión alternativa exitosa")

      // Show database information
      console.log(`📊 Base de datos: ${mongoose.connection.name}`)

      return true
    } catch (altError) {
      console.error("❌ Error en conexión alternativa:", altError.message)
      return false
    }

    return false
  } finally {
    // Close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
      console.log("🔒 Conexión cerrada")
    }
  }
}

// Run the test
testConnection()
  .then((success) => {
    console.log(success ? "✅ Prueba completada con éxito" : "❌ Prueba fallida")
    process.exit(success ? 0 : 1)
  })
  .catch((err) => {
    console.error("❌ Error inesperado:", err)
    process.exit(1)
  })
