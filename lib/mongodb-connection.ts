import mongoose from "mongoose"

// Declaración de una variable global para mantener la conexión entre solicitudes
declare global {
  var mongoClient: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

// Inicializar la variable global si no existe
if (!global.mongoClient) {
  global.mongoClient = {
    conn: null,
    promise: null,
  }
}

/**
 * Función para conectar a MongoDB con varias estrategias de conexión
 */
export async function connectToMongoDB() {
  // Si ya existe una conexión, la devolvemos
  if (global.mongoClient.conn) {
    return global.mongoClient.conn
  }

  // Si no hay una promesa de conexión en curso, la creamos
  if (!global.mongoClient.promise) {
    const uri =
      process.env.MONGODB_URI || "mongodb+srv://lucasteikoku:lucas9244.@cluster0.tqbihbw.mongodb.net/?appName=Cluster0"

    if (!uri) {
      console.error("❌ MongoDB URI no configurada")
      return null
    }

    // Estrategia de conexión múltiple
    const connectWithStrategy = async () => {
      // Estrategia 1: Conexión estándar
      try {
        console.log("Intentando conexión principal a MongoDB...")
        mongoose.set("strictQuery", false)

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

        await mongoose.connect(uri, clientOptions)

        console.log("✅ Conexión a MongoDB establecida correctamente")
        return mongoose
      } catch (error) {
        console.error("❌ Error en conexión principal:", error)

        // Estrategia 2: Conexión con opciones alternativas
        try {
          console.log("🔄 Intentando conexión alternativa...")

          if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect()
          }

          // Opciones alternativas
          const alternativeOptions = {
            serverApi: { version: "1", strict: false, deprecationErrors: false },
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
          }

          await mongoose.connect(uri, alternativeOptions)

          console.log("✅ Conexión alternativa establecida")
          return mongoose
        } catch (altError) {
          console.error("❌ Error en conexión alternativa:", altError)

          // Estrategia 3: Conexión en memoria
          console.log("⚠️ Usando fallback en memoria")
          return null
        }
      }
    }

    // Almacenar la promesa de conexión en la variable global
    global.mongoClient.promise = connectWithStrategy()
  }

  try {
    global.mongoClient.conn = await global.mongoClient.promise
    return global.mongoClient.conn
  } catch (error) {
    console.error("Error al esperar la conexión:", error)
    global.mongoClient.promise = null
    return null
  }
}

/**
 * Función para cerrar la conexión a MongoDB
 */
export async function closeMongoDBConnection() {
  if (global.mongoClient.conn) {
    await mongoose.disconnect()
    global.mongoClient.conn = null
    global.mongoClient.promise = null
    console.log("Conexión a MongoDB cerrada")
  }
}

// Gestión de cierre de la aplicación
if (typeof process !== "undefined") {
  process.on("SIGINT", async () => {
    await closeMongoDBConnection()
    process.exit(0)
  })

  process.on("SIGTERM", async () => {
    await closeMongoDBConnection()
    process.exit(0)
  })
}
