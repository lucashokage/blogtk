import { MongoClient, ServerApiVersion } from "mongodb"

// Declaración de variables globales para mantener la conexión entre solicitudes
declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined
  var mongoClient: MongoClient | undefined
  var __memoryData: {
    members: any[]
    codes: any[]
    adminUsers: any[]
  }
}

// Inicializar datos en memoria como respaldo
if (typeof global !== "undefined" && !global.__memoryData) {
  global.__memoryData = {
    members: [],
    codes: [],
    adminUsers: [
      { username: "lucas", password: "lucas9244", role: "admin" },
      { username: "angeles", password: "ange1212", role: "admin" },
      { username: "admin", password: "admin123", role: "superadmin" },
    ],
  }
}

// Función para obtener la URI de MongoDB
const getMongoURI = (): string => {
  // Use the environment variable or fallback to the working connection string
  const uri =
    process.env.MONGODB_URI || "mongodb+srv://lucasteikoku:lucas9244.@cluster0.tqbihbw.mongodb.net/?appName=Cluster0"

  if (!uri) {
    console.error("¡ADVERTENCIA! No se ha configurado MONGODB_URI en las variables de entorno.")
    return "mongodb+srv://lucasteikoku:lucas9244.@cluster0.tqbihbw.mongodb.net/?appName=Cluster0"
  }

  // Clean the URI (remove any < > characters that might be in copied URIs)
  return uri.replace(/<|>/g, "")
}

// Opciones de conexión para MongoDB
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
}

// Función para conectar a MongoDB
export async function connectToMongoDB() {
  if (global.mongoClient) {
    console.log("Usando conexión existente a MongoDB")
    return global.mongoClient
  }

  if (!global.mongoClientPromise) {
    const uri = getMongoURI()
    console.log(`Conectando a MongoDB en: ${uri.split("@").pop()}`) // Solo muestra la parte después de @ por seguridad

    const client = new MongoClient(uri, options)
    global.mongoClientPromise = client
      .connect()
      .then((client) => {
        console.log("Conexión a MongoDB establecida")
        return client
      })
      .catch((err) => {
        console.error("Error al conectar a MongoDB:", err)
        throw err
      })
  }

  try {
    global.mongoClient = await global.mongoClientPromise
    return global.mongoClient
  } catch (error) {
    console.error("Error al obtener cliente de MongoDB:", error)
    throw error
  }
}

// Función para obtener una colección específica
export async function getCollection(collectionName: string) {
  const client = await connectToMongoDB()
  const db = client.db()
  return db.collection(collectionName)
}

// Función para cerrar la conexión (útil para pruebas y scripts)
export async function closeMongoDBConnection() {
  if (global.mongoClient) {
    await global.mongoClient.close()
    global.mongoClient = undefined
    global.mongoClientPromise = undefined
    console.log("Conexión a MongoDB cerrada")
  }
}

// Manejar cierre de conexión al terminar el proceso
process.on("SIGINT", async () => {
  await closeMongoDBConnection()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  await closeMongoDBConnection()
  process.exit(0)
})
