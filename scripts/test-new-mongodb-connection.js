const { MongoClient } = require("mongodb")
const dotenv = require("dotenv")

// Cargar variables de entorno
dotenv.config()

async function testNewMongoDBConnection() {
  console.log("Probando conexión a MongoDB con la nueva URI...")

  // Corregir el formato de la URI (eliminar los símbolos <>)
  const uri =
    "mongodb+srv://lucasteikoku:lucas9244.@cluster0.tqbihbw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

  console.log(
    "URI de MongoDB (oculta por seguridad):",
    uri.replace(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/, "mongodb$1://*****:*****@"),
  )

  // Opciones de conexión básicas
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: "majority",
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  }

  let client = null
  try {
    client = new MongoClient(uri, options)
    await client.connect()

    console.log("✅ Conexión exitosa")

    // Probar una operación simple
    const db = client.db()
    const collections = await db.listCollections().toArray()
    console.log(`Colecciones encontradas: ${collections.length}`)
    collections.forEach((col) => console.log(` - ${col.name}`))

    // Verificar si podemos realizar operaciones CRUD
    const testCollection = db.collection("test_connection")

    // Insertar un documento
    const insertResult = await testCollection.insertOne({
      test: true,
      timestamp: new Date(),
      message: "Prueba de conexión exitosa",
    })
    console.log("✅ Inserción exitosa:", insertResult.acknowledged)

    // Leer el documento
    const doc = await testCollection.findOne({ test: true })
    console.log("✅ Lectura exitosa:", doc ? "Documento encontrado" : "Documento no encontrado")

    // Eliminar el documento de prueba
    const deleteResult = await testCollection.deleteMany({ test: true })
    console.log("✅ Eliminación exitosa:", deleteResult.acknowledged)

    console.log("\n✅✅✅ CONEXIÓN Y OPERACIONES EXITOSAS ✅✅✅")
    console.log("La conexión a MongoDB funciona correctamente con la nueva URI.")

    return true
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB:", error.message)
    console.error("Detalles del error:", error)
    return false
  } finally {
    if (client) {
      try {
        await client.close()
        console.log("Conexión cerrada correctamente.")
      } catch (e) {
        console.error("Error al cerrar la conexión:", e)
      }
    }
  }
}

// Ejecutar la prueba
testNewMongoDBConnection()
  .then((success) => {
    if (!success) {
      console.log("\nSugerencias para solucionar el problema:")
      console.log("1. Verifica que la URI de MongoDB sea correcta")
      console.log("2. Asegúrate de que el usuario y la contraseña sean correctos")
      console.log("3. Asegúrate de que tu IP esté en la lista blanca de MongoDB Atlas")
      console.log("4. Verifica si hay algún firewall o proxy bloqueando la conexión")
    }
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error("Error inesperado:", error)
    process.exit(1)
  })
