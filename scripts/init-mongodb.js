const { MongoClient, ServerApiVersion } = require("mongodb")
require("dotenv").config()

async function initMongoDB() {
  console.log("🚀 Inicializando MongoDB...")

  // Obtener la URI de MongoDB
  const uri =
    process.env.MONGODB_URI || "mongodb+srv://lucasteikoku:lucas9244.@cluster0.tqbihbw.mongodb.net/?appName=Cluster0"

  if (!uri) {
    console.error("❌ Error: No se ha configurado MONGODB_URI en las variables de entorno.")
    console.warn("⚠️ Usando URI de ejemplo")
  }

  // Crear un cliente de MongoDB con opciones adaptadas para Vercel
  const options = {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    // Opciones optimizadas para entornos serverless
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  }

  let client = null
  let success = false

  try {
    // Conectar a MongoDB
    console.log("🔄 Conectando a MongoDB...")
    client = new MongoClient(uri, options)
    await client.connect()
    console.log("✅ Conexión a MongoDB establecida")

    // Obtener la base de datos
    const db = client.db()

    // Crear colecciones si no existen
    console.log("🔄 Creando colecciones...")
    try {
      await db.createCollection("members")
      console.log("✅ Colección members creada")
    } catch (err) {
      if (err.codeName === "NamespaceExists") {
        console.log("ℹ️ La colección members ya existe")
      } else {
        console.error("❌ Error al crear colección members:", err.message)
      }
    }

    try {
      await db.createCollection("codes")
      console.log("✅ Colección codes creada")
    } catch (err) {
      if (err.codeName === "NamespaceExists") {
        console.log("ℹ️ La colección codes ya existe")
      } else {
        console.error("❌ Error al crear colección codes:", err.message)
      }
    }

    try {
      await db.createCollection("admin_users")
      console.log("✅ Colección admin_users creada")
    } catch (err) {
      if (err.codeName === "NamespaceExists") {
        console.log("ℹ️ La colección admin_users ya existe")
      } else {
        console.error("❌ Error al crear colección admin_users:", err.message)
      }
    }

    // Crear índices para mejorar el rendimiento
    console.log("🔄 Creando índices...")
    try {
      await db.collection("members").createIndex({ id: 1 }, { unique: true })
      console.log("✅ Índice members.id creado")
    } catch (err) {
      console.log("ℹ️ Índice members.id:", err.message)
    }

    try {
      await db.collection("codes").createIndex({ code: 1 }, { unique: true })
      console.log("✅ Índice codes.code creado")
    } catch (err) {
      console.log("ℹ️ Índice codes.code:", err.message)
    }

    try {
      await db.collection("admin_users").createIndex({ username: 1 }, { unique: true })
      console.log("✅ Índice admin_users.username creado")
    } catch (err) {
      console.log("ℹ️ Índice admin_users.username:", err.message)
    }

    // Insertar usuarios administradores predeterminados
    console.log("🔄 Insertando usuarios administradores predeterminados...")
    const adminUsers = [
      { username: "lucas", password: "lucas9244", role: "admin" },
      { username: "angeles", password: "ange1212", role: "admin" },
      { username: "admin", password: "admin123", role: "superadmin" },
    ]

    for (const user of adminUsers) {
      try {
        await db.collection("admin_users").updateOne({ username: user.username }, { $set: user }, { upsert: true })
        console.log(`✅ Usuario ${user.username} insertado/actualizado`)
      } catch (err) {
        console.log(`❌ Error al insertar usuario ${user.username}:`, err.message)
      }
    }

    // Verificar la conexión con un ping
    try {
      await client.db("admin").command({ ping: 1 })
      console.log("✅ Ping exitoso. Conexión a MongoDB verificada.")
    } catch (pingErr) {
      console.warn("⚠️ No se pudo hacer ping a la base de datos:", pingErr.message)
      console.warn("⚠️ Esto es normal en algunos entornos restrictivos como Vercel.")
    }

    success = true
    console.log("✅ Inicialización de MongoDB completada con éxito.")
    return true
  } catch (error) {
    console.error("❌ Error durante la inicialización de MongoDB:", error)
    console.warn("⚠️ Intentando conexión alternativa...")

    try {
      // Intentar con opciones alternativas
      const alternativeOptions = {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: false,
          deprecationErrors: false,
        },
        ssl: false,
        tls: false,
      }

      if (client) {
        try {
          await client.close()
        } catch (closeErr) {
          // Ignorar errores al cerrar
        }
      }

      client = new MongoClient(uri, alternativeOptions)
      await client.connect()
      console.log("✅ Conexión alternativa a MongoDB establecida")

      // Obtener la base de datos
      const db = client.db()

      // Insertar usuarios administradores predeterminados
      console.log("🔄 Insertando usuarios administradores predeterminados...")
      const adminUsers = [
        { username: "lucas", password: "lucas9244", role: "admin" },
        { username: "angeles", password: "ange1212", role: "admin" },
        { username: "admin", password: "admin123", role: "superadmin" },
      ]

      for (const user of adminUsers) {
        try {
          await db.collection("admin_users").updateOne({ username: user.username }, { $set: user }, { upsert: true })
          console.log(`✅ Usuario ${user.username} insertado/actualizado`)
        } catch (err) {
          console.log(`❌ Error al insertar usuario ${user.username}:`, err.message)
        }
      }

      success = true
      console.log("✅ Inicialización alternativa de MongoDB completada con éxito.")
      return true
    } catch (altError) {
      console.error("❌ Error en conexión alternativa:", altError)
      console.warn("⚠️ La aplicación funcionará en modo de respaldo con almacenamiento en memoria.")
      return false
    }
  } finally {
    if (client) {
      try {
        await client.close()
        console.log("🔄 Conexión a MongoDB cerrada")
      } catch (closeErr) {
        console.warn("⚠️ Error al cerrar la conexión:", closeErr.message)
      }
    }

    return success
  }
}

// Ejecutar la inicialización solo si se llama directamente
if (require.main === module) {
  initMongoDB()
    .then((success) => {
      console.log(success ? "✅ Script completado con éxito" : "⚠️ Script completado con advertencias")
      process.exit(success ? 0 : 1)
    })
    .catch((err) => {
      console.error("❌ Error fatal:", err)
      process.exit(1)
    })
} else {
  module.exports = initMongoDB
}
