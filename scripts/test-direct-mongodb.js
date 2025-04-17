const mongoose = require("mongoose")
require("dotenv").config()

async function testDirectMongoDBConnection() {
  console.log("Probando conexión directa a MongoDB...")

  // Obtener la URI de MongoDB
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.error("Error: MONGODB_URI no está configurado en las variables de entorno.")
    process.exit(1)
  }

  // Limpiar la URI
  const cleanUri = uri.replace(/<|>/g, "")
  console.log(`URI de MongoDB (oculta): ${cleanUri.replace(/\/\/([^:]+):([^@]+)@/, "//****:****@")}`)

  // Opciones de conexión
  const options = {
    ssl: true,
    maxPoolSize: 10,
    minPoolSize: 1,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  }

  try {
    // Configurar Mongoose
    mongoose.set("strictQuery", false)

    // Conectar a MongoDB
    console.log("Conectando a MongoDB...")
    await mongoose.connect(cleanUri, options)

    console.log("✅ Conexión a MongoDB establecida correctamente")

    // Verificar la conexión con un ping
    await mongoose.connection.db.admin().ping()
    console.log("✅ Ping exitoso. Conexión a MongoDB verificada.")

    // Mostrar información de la conexión
    console.log(`Versión de Mongoose: ${mongoose.version}`)
    console.log(`Estado de la conexión: ${mongoose.connection.readyState}`)
    console.log(`Base de datos: ${mongoose.connection.name}`)

    // Listar colecciones
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log("Colecciones encontradas:")
    collections.forEach((collection) => {
      console.log(` - ${collection.name}`)
    })

    return true
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB:", error)

    // Intentar con opciones alternativas
    console.log("🔄 Intentando conexión alternativa...")
    try {
      await mongoose.disconnect()

      const alternativeOptions = {
        ssl: false,
        tls: false,
      }

      await mongoose.connect(cleanUri, alternativeOptions)
      console.log("✅ Conexión alternativa a MongoDB establecida")

      // Verificar la conexión con un ping
      await mongoose.connection.db.admin().ping()
      console.log("✅ Ping exitoso en conexión alternativa.")

      return true
    } catch (altError) {
      console.error("❌ Error en conexión alternativa:", altError)

      // Probar con una URI directa (sin SRV)
      console.log("🔄 Intentando conexión con URI directa...")
      try {
        await mongoose.disconnect()

        // Convertir URI SRV a URI directa si es necesario
        let directUri = cleanUri
        if (directUri.includes("mongodb+srv://")) {
          // Esta es una simplificación, en un caso real necesitarías resolver los SRV records
          directUri = directUri.replace("mongodb+srv://", "mongodb://")
          directUri = directUri.replace("?", "?directConnection=true&")
        }

        await mongoose.connect(directUri, { directConnection: true })
        console.log("✅ Conexión directa a MongoDB establecida")
        return true
      } catch (directError) {
        console.error("❌ Error en conexión directa:", directError)
        return false
      }
    }
  } finally {
    // Cerrar la conexión
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
      console.log("Conexión a MongoDB cerrada")
    }
  }
}

// Ejecutar la prueba
testDirectMongoDBConnection()
  .then((success) => {
    if (success) {
      console.log("✅ Prueba de conexión completada con éxito")
    } else {
      console.log("❌ Prueba de conexión fallida")
    }
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error("Error inesperado:", error)
    process.exit(1)
  })
