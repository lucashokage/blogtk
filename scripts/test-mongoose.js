const mongoose = require("mongoose")
require("dotenv").config()

async function testMongooseConnection() {
  console.log("🚀 Probando conexión a MongoDB con Mongoose...")

  // Obtener la URI de MongoDB
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.error("❌ Error: No se ha configurado MONGODB_URI en las variables de entorno.")
    process.exit(1)
  }

  // Eliminar los caracteres < > si están presentes
  const cleanUri = uri.replace(/<|>/g, "")

  console.log(`URI de MongoDB (oculta por seguridad): ${cleanUri.replace(/\/\/([^:]+):([^@]+)@/, "//****:****@")}`)

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

      // Tercer intento con opciones mínimas
      console.log("🔄 Intentando conexión con opciones mínimas...")
      try {
        await mongoose.disconnect()
        await mongoose.connect(cleanUri)
        console.log("✅ Conexión mínima a MongoDB establecida")
        return true
      } catch (minError) {
        console.error("❌ Error en conexión mínima:", minError)
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
testMongooseConnection()
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
