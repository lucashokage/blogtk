const mongoose = require("mongoose")
const uri = "mongodb+srv://lucasteikoku:lucas9244.@cluster0.tqbihbw.mongodb.net/?appName=Cluster0"

const clientOptions = {
  serverApi: {
    version: "1",
    strict: true,
    deprecationErrors: true,
  },
  // Aumentar tiempos de espera para entornos con latencia alta
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
}

async function run() {
  try {
    console.log("Conectando a MongoDB usando la URI SRV...")
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(uri, clientOptions)
    await mongoose.connection.db.admin().command({ ping: 1 })
    console.log("Pinged your deployment. You successfully connected to MongoDB!")

    // Listar colecciones disponibles
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log("Colecciones disponibles:")
    collections.forEach((col) => console.log(` - ${col.name}`))

    return true
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error)
    return false
  } finally {
    // Ensures that the client will close when you finish/error
    await mongoose.disconnect()
    console.log("Conexión cerrada")
  }
}

run()
  .then((success) => {
    console.log(success ? "✅ Conexión exitosa" : "❌ Conexión fallida")
    process.exit(success ? 0 : 1)
  })
  .catch((err) => {
    console.error("Error inesperado:", err)
    process.exit(1)
  })
