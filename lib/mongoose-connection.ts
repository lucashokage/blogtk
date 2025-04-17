// Declaración de variables globales para mantener la conexión entre solicitudes
declare global {
  var mongoose: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

// Inicializar variables globales si no existen
if (!global.mongoose) {
  global.mongoose = {
    conn: null,
    promise: null,
  }
}

// Función para limpiar y formatear la URI de MongoDB
const formatMongoURI = (uri: string): string => {
  // Eliminar caracteres < > que pueden estar en la URI copiada
  const cleanUri = uri.replace(/<|>/g, "")

  // Asegurarse de que la URI tiene el formato correcto
  if (!cleanUri.startsWith("mongodb+srv://") && !cleanUri.startsWith("mongodb://")) {
    console.error("URI de MongoDB inválida. Debe comenzar con mongodb:// o mongodb+srv://")
    return ""
  }

  return cleanUri
}

// Obtener la URI de MongoDB
const getMongoURI = (): string => {
  // Usar la variable de entorno MONGODB_URI o la URI de ejemplo que funciona
  const uri =
    process.env.MONGODB_URI || "mongodb+srv://lucasteikoku:lucas9244.@cluster0.tqbihbw.mongodb.net/?appName=Cluster0"

  if (!uri) {
    console.warn("⚠️ MONGODB_URI no está configurado en las variables de entorno.")
    return "mongodb+srv://lucasteikoku:lucas9244.@cluster0.tqbihbw.mongodb.net/?appName=Cluster0"
  }

  return formatMongoURI(uri)
}

// Opciones de conexión optimizadas para Mongoose
const options: mongoose.ConnectOptions = {
  // Opciones SSL para mayor compatibilidad
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true,

  // Opciones de conexión para entornos serverless
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 20000,

  // Opciones de reconexión automática
  autoCreate: true,
  autoIndex: true,

  // Usar el nuevo parser de URL
  useNewUrlParser: true as any,
}

/**
 * Conexión global a MongoDB con Mongoose
 * @returns Instancia de Mongoose conectada
 */
export async function connectToMongoDB() {
  // Si ya tenemos una conexión, la devolvemos
  if (global.mongoose.conn) {
    console.log("🔄 Usando conexión existente a MongoDB")
    return global.mongoose.conn
  }

  // Si ya hay una promesa de conexión en curso, esperamos a que se resuelva
  if (!global.mongoose.promise) {
    const uri = getMongoURI()

    if (!uri) {
      console.error("❌ URI de MongoDB no configurada o inválida")
      throw new Error("URI de MongoDB no configurada o inválida")
    }

    console.log("🔄 Conectando a MongoDB...")

    // Configurar eventos de conexión para mejor diagnóstico
    mongoose.connection.on("connected", () => {
      console.log("✅ Mongoose conectado a MongoDB")
    })

    mongoose.connection.on("error", (err) => {
      console.error("❌ Error de conexión de Mongoose:", err)
    })

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ Mongoose desconectado de MongoDB")
    })

    // Crear una promesa de conexión con manejo de errores
    global.mongoose.promise = mongoose
      .connect(uri, options)
      .then((mongooseInstance) => {
        console.log("✅ Conexión a MongoDB establecida correctamente")
        return mongooseInstance
      })
      .catch((error) => {
        console.error("❌ Error al conectar a MongoDB:", error)

        // Intentar con opciones alternativas si falla la primera conexión
        console.log("🔄 Intentando conexión alternativa...")

        const alternativeOptions: mongoose.ConnectOptions = {
          ...options,
          ssl: false,
          tls: false,
        }

        return mongoose
          .connect(uri, alternativeOptions)
          .then((mongooseInstance) => {
            console.log("✅ Conexión alternativa a MongoDB establecida")
            return mongooseInstance
          })
          .catch((altError) => {
            console.error("❌ Error en conexión alternativa:", altError)

            // Intentar una tercera opción con URI directa
            console.log("🔄 Intentando conexión directa...")
            const directUri = uri.replace("mongodb+srv://", "mongodb://")

            return mongoose
              .connect(directUri, {
                ...alternativeOptions,
                directConnection: true,
              })
              .then((mongooseInstance) => {
                console.log("✅ Conexión directa a MongoDB establecida")
                return mongooseInstance
              })
              .catch((directError) => {
                console.error("❌ Error en conexión directa:", directError)
                throw directError
              })
          })
      })
  }

  try {
    global.mongoose.conn = await global.mongoose.promise
    return global.mongoose.conn
  } catch (error) {
    global.mongoose.promise = null
    throw error
  }
}

// Función para cerrar la conexión (útil para pruebas y scripts)
export async function closeMongoDBConnection() {
  if (global.mongoose.conn) {
    await global.mongoose.conn.disconnect()
    global.mongoose.conn = null
    global.mongoose.promise = null
    console.log("Conexión a MongoDB cerrada")
  }
}

// Manejar cierre de conexión al terminar el proceso
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

// Función para probar la conexión
export async function testMongoDBConnection() {
  try {
    const mongooseInstance = await connectToMongoDB()

    // Verificar la conexión con un ping
    const admin = mongooseInstance.connection.db.admin()
    const result = await admin.ping()

    return {
      success: true,
      message: "Conexión a MongoDB establecida correctamente",
      ping: result,
      databases: await mongooseInstance.connection.db.admin().listDatabases(),
    }
  } catch (error) {
    console.error("Error al probar la conexión a MongoDB:", error)
    return {
      success: false,
      message: "Error al conectar a MongoDB",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
