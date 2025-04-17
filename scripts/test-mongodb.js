const { MongoClient, ServerApiVersion } = require("mongodb")
require("dotenv").config()

async function testMongoDBConnection() {
  // Use environment variable or fallback to the hardcoded URI
  const uri =
    process.env.MONGODB_URI || "mongodb+srv://lucasteikoku:lucas9244@cluster0.tqbihbw.mongodb.net/?appName=Cluster0"

  console.log("Testing MongoDB connection...")
  console.log(`Using URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, "//****:****@")}`) // Hide credentials in logs

  // Create a MongoClient with the provided configuration
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: false,
    },
    // Opciones SSL modificadas para mayor compatibilidad
    ssl: true,
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
    // Otras opciones para entornos serverless
    maxPoolSize: 10,
    minPoolSize: 0,
    maxIdleTimeMS: 45000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })

  try {
    // Connect the client to the server
    await client.connect()
    console.log("Connected to MongoDB successfully!")

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 })
    console.log("Pinged your deployment. You successfully connected to MongoDB!")

    // List all databases
    const databasesList = await client.db().admin().listDatabases()
    console.log("Databases:")
    databasesList.databases.forEach((db) => {
      console.log(` - ${db.name}`)
    })

    return true
  } catch (error) {
    console.error("Error connecting to MongoDB:", error)
    return false
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close()
    console.log("MongoDB connection closed")
  }
}

// Run the test
testMongoDBConnection()
  .then((success) => {
    if (success) {
      console.log("MongoDB connection test completed successfully!")
    } else {
      console.log("MongoDB connection test failed!")
    }
  })
  .catch(console.error)
