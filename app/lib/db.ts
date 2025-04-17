import { v4 as uuidv4 } from "uuid"
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb"

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

// Función para obtener la URI de MongoDB con manejo de diferentes entornos
const getMongoURI = (): string => {
  // Priorizar la variable de entorno
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.warn("⚠️ MONGODB_URI no está configurado en las variables de entorno.")
    console.warn("⚠️ Se utilizará el almacenamiento en memoria como respaldo.")
    return ""
  }

  return uri
}

// Función para conectar a MongoDB con manejo de errores mejorado
export async function connectToMongoDB() {
  // Si ya tenemos un cliente conectado, lo devolvemos
  if (global.mongoClient) {
    return global.mongoClient
  }

  // Si ya tenemos una promesa de conexión en curso, esperamos a que se resuelva
  if (!global.mongoClientPromise) {
    const uri = getMongoURI()

    if (!uri) {
      console.error("MongoDB URI no configurada")
      // En lugar de lanzar un error, devolvemos null para manejar el caso de forma más elegante
      return null
    }

    console.log(`Conectando a MongoDB...`)

    // Opciones de conexión optimizadas para Vercel
    const options: any = {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      // Opciones específicas para entornos serverless
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 10000, // 10 segundos
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    }

    try {
      const client = new MongoClient(uri, options)

      // Crear una promesa de conexión que maneje reintentos
      global.mongoClientPromise = client
        .connect()
        .then((client) => {
          console.log("✅ Conexión a MongoDB establecida correctamente")
          return client
        })
        .catch((err) => {
          console.error("❌ Error al conectar a MongoDB:", err)

          // Intentar con opciones alternativas si falla la primera conexión
          console.log("🔄 Intentando conexión alternativa...")
          const alternativeOptions = {
            ...options,
            ssl: false,
            tls: false,
          }

          const alternativeClient = new MongoClient(uri, alternativeOptions)
          return alternativeClient
            .connect()
            .then((client) => {
              console.log("✅ Conexión alternativa a MongoDB establecida")
              return client
            })
            .catch((altErr) => {
              console.error("❌ Error en conexión alternativa:", altErr)
              // En lugar de lanzar un error, devolvemos null
              return null
            })
        })
    } catch (initError) {
      console.error("❌ Error al inicializar cliente de MongoDB:", initError)
      global.mongoClientPromise = Promise.resolve(null)
    }
  }

  try {
    global.mongoClient = await global.mongoClientPromise
    return global.mongoClient
  } catch (error) {
    console.error("❌ Error al obtener cliente de MongoDB:", error)
    return null
  }
}

// Función para obtener una colección específica con mejor manejo de errores
export async function getCollection(collectionName: string) {
  try {
    const client = await connectToMongoDB()
    if (!client) {
      throw new Error("No se pudo conectar a MongoDB")
    }
    const db = client.db()
    return db.collection(collectionName)
  } catch (error) {
    console.error(`❌ Error al obtener colección ${collectionName}:`, error)
    throw error
  }
}

// Función para cerrar la conexión (útil para pruebas y scripts)
export async function closeMongoDBConnection() {
  if (global.mongoClient) {
    try {
      await global.mongoClient.close()
      global.mongoClient = undefined
      global.mongoClientPromise = undefined
      console.log("Conexión a MongoDB cerrada")
    } catch (error) {
      console.error("Error al cerrar la conexión a MongoDB:", error)
    }
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

// Helper function to generate a unique ID
export function generateId(): string {
  return uuidv4()
}

// Member type definition
export interface Member {
  id: string
  name: string
  role: string
  description: string
  avatar: string
  banner: string
  approved: boolean
  date: string
  lastUpdated: string
  fingerprint?: string
  rejected?: boolean
  rejectionDate?: string
  social?: {
    instagram?: string
    twitter?: string
    facebook?: string
  }
  stats?: {
    social: number
    skillful: number
    intelligence: number
    administrative?: number
  }
}

// Code type definition
export interface Code {
  code: string
  createdAt: string
  expiresAt: string
  used: boolean
  usedAt?: string
  usedBy?: string
}

// Member repository functions
export async function getAllMembers(): Promise<Member[]> {
  try {
    const membersCollection = await getCollection("members")
    const members = await membersCollection.find({}).toArray()

    // Convertir _id a id para mantener compatibilidad
    return members.map((member) => {
      const { _id, ...rest } = member
      return { id: _id.toString(), ...rest } as Member
    })
  } catch (error) {
    console.error("❌ Error getting all members:", error)

    // Fallback a datos en memoria
    if (global.__memoryData && Array.isArray(global.__memoryData.members)) {
      console.log("⚠️ Falling back to in-memory members data")
      return global.__memoryData.members
    }

    return []
  }
}

// Get member by ID
export async function getMemberById(id: string): Promise<Member | undefined> {
  try {
    const membersCollection = await getCollection("members")

    // Intentar buscar por _id si es un ObjectId válido
    let query = {}
    try {
      if (ObjectId.isValid(id)) {
        query = { _id: new ObjectId(id) }
      } else {
        query = { id }
      }
    } catch (e) {
      query = { id }
    }

    const member = await membersCollection.findOne(query)

    if (!member) {
      return undefined
    }

    // Convertir _id a id para mantener compatibilidad
    const { _id, ...rest } = member
    return { id: _id.toString(), ...rest } as Member
  } catch (error) {
    console.error(`❌ Error getting member by ID ${id}:`, error)

    // Fallback a datos en memoria
    if (global.__memoryData && Array.isArray(global.__memoryData.members)) {
      console.log("⚠️ Falling back to in-memory members data for getMemberById")
      return global.__memoryData.members.find((m) => m.id === id)
    }

    return undefined
  }
}

// Create a new member
export async function createMember(member: Member): Promise<Member> {
  try {
    // Generar ID si no se proporciona
    if (!member.id) {
      member.id = generateId()
    }

    // Establecer valores predeterminados
    const now = new Date().toISOString()
    member.date = member.date || now
    member.lastUpdated = now

    const membersCollection = await getCollection("members")

    // En MongoDB, usamos _id como identificador principal
    const { id, ...memberWithoutId } = member
    const result = await membersCollection.insertOne({
      _id: id,
      ...memberWithoutId,
    })

    if (!result.acknowledged) {
      throw new Error("Failed to insert member")
    }

    // Devolver el miembro creado
    return member
  } catch (error) {
    console.error("❌ Error creating member:", error)

    // Almacenar en memoria como respaldo
    if (global.__memoryData) {
      if (!Array.isArray(global.__memoryData.members)) {
        global.__memoryData.members = []
      }

      // Generar ID si no se proporciona
      if (!member.id) {
        member.id = generateId()
      }

      // Establecer valores predeterminados
      const now = new Date().toISOString()
      member.date = member.date || now
      member.lastUpdated = now

      global.__memoryData.members.push(member)
      console.log("⚠️ Member stored in memory as fallback")
      return member
    }

    throw error
  }
}

// Update an existing member
export async function updateMember(id: string, updates: Partial<Member>): Promise<Member | null> {
  try {
    // Actualizar timestamp
    updates.lastUpdated = new Date().toISOString()

    const membersCollection = await getCollection("members")

    // Intentar buscar por _id si es un ObjectId válido
    let query = {}
    try {
      if (ObjectId.isValid(id)) {
        query = { _id: new ObjectId(id) }
      } else {
        query = { id }
      }
    } catch (e) {
      query = { id }
    }

    // Eliminar id de las actualizaciones para evitar conflictos
    const { id: _, ...updatesWithoutId } = updates

    const result = await membersCollection.findOneAndUpdate(
      query,
      { $set: updatesWithoutId },
      { returnDocument: "after" },
    )

    if (!result) {
      return null
    }

    // Convertir _id a id para mantener compatibilidad
    const { _id, ...rest } = result
    const updatedMember = { id: _id.toString(), ...rest } as Member

    // También actualizar en memoria como respaldo
    if (global.__memoryData && Array.isArray(global.__memoryData.members)) {
      const index = global.__memoryData.members.findIndex((m) => m.id === id)
      if (index !== -1) {
        global.__memoryData.members[index] = {
          ...global.__memoryData.members[index],
          ...updates,
        }
      }
    }

    return updatedMember
  } catch (error) {
    console.error(`❌ Error updating member ${id}:`, error)

    // Actualizar en memoria como respaldo
    if (global.__memoryData && Array.isArray(global.__memoryData.members)) {
      const index = global.__memoryData.members.findIndex((m) => m.id === id)
      if (index !== -1) {
        global.__memoryData.members[index] = {
          ...global.__memoryData.members[index],
          ...updates,
          lastUpdated: new Date().toISOString(),
        }
        console.log("⚠️ Member updated in memory as fallback")
        return global.__memoryData.members[index]
      }
    }

    return null
  }
}

// Delete a member
export async function deleteMember(id: string): Promise<boolean> {
  try {
    const membersCollection = await getCollection("members")

    // Intentar buscar por _id si es un ObjectId válido
    let query = {}
    try {
      if (ObjectId.isValid(id)) {
        query = { _id: new ObjectId(id) }
      } else {
        query = { id }
      }
    } catch (e) {
      query = { id }
    }

    const result = await membersCollection.deleteOne(query)

    // También eliminar de la memoria de respaldo
    if (global.__memoryData && Array.isArray(global.__memoryData.members)) {
      global.__memoryData.members = global.__memoryData.members.filter((m) => m.id !== id)
    }

    return result.deletedCount > 0
  } catch (error) {
    console.error(`❌ Error deleting member ${id}:`, error)

    // Eliminar de la memoria como respaldo
    if (global.__memoryData && Array.isArray(global.__memoryData.members)) {
      const initialLength = global.__memoryData.members.length
      global.__memoryData.members = global.__memoryData.members.filter((m) => m.id !== id)
      console.log("⚠️ Member deleted from memory as fallback")
      return global.__memoryData.members.length < initialLength
    }

    return false
  }
}

// CODES FUNCTIONS

// Get all codes
export async function getAllCodes(): Promise<Code[]> {
  try {
    const codesCollection = await getCollection("codes")
    return (await codesCollection.find({}).toArray()) as Code[]
  } catch (error) {
    console.error("❌ Error getting all codes:", error)

    // Fallback a datos en memoria
    if (global.__memoryData && Array.isArray(global.__memoryData.codes)) {
      console.log("⚠️ Falling back to in-memory codes data")
      return global.__memoryData.codes
    }

    return []
  }
}

// Get code by value
export async function getCodeByValue(code: string): Promise<Code | undefined> {
  try {
    const codesCollection = await getCollection("codes")
    const result = await codesCollection.findOne({ code })
    return result as Code | undefined
  } catch (error) {
    console.error(`❌ Error getting code ${code}:`, error)

    // Fallback a datos en memoria
    if (global.__memoryData && Array.isArray(global.__memoryData.codes)) {
      console.log("⚠️ Falling back to in-memory codes data for getCodeByValue")
      return global.__memoryData.codes.find((c) => c.code === code)
    }

    return undefined
  }
}

// Create a new code
export async function createCode(expirationDays = 7): Promise<Code> {
  try {
    // Generar un código aleatorio
    const code = generateRandomCode()

    // Calcular fecha de expiración
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + expirationDays)

    const newCode = {
      code,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      used: false,
      usedAt: null,
      usedBy: null,
    }

    const codesCollection = await getCollection("codes")
    await codesCollection.insertOne(newCode)

    // También almacenar en memoria como respaldo
    if (global.__memoryData) {
      if (!Array.isArray(global.__memoryData.codes)) {
        global.__memoryData.codes = []
      }
      global.__memoryData.codes.push(newCode)
    }

    return newCode
  } catch (error) {
    console.error("❌ Error creating code:", error)

    // Generar código en memoria como respaldo
    const code = generateRandomCode()
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + expirationDays)

    const newCode = {
      code,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      used: false,
      usedAt: null,
      usedBy: null,
    }

    if (global.__memoryData) {
      if (!Array.isArray(global.__memoryData.codes)) {
        global.__memoryData.codes = []
      }
      global.__memoryData.codes.push(newCode)
      console.log("⚠️ Code created in memory as fallback")
    }

    return newCode
  }
}

// Mark a code as used
export async function useCode(code: string, fingerprint: string): Promise<boolean> {
  try {
    // Verificar si el código existe y no está usado
    const existingCode = await getCodeByValue(code)
    if (!existingCode || existingCode.used || new Date(existingCode.expiresAt) < new Date()) {
      return false
    }

    // Marcar como usado
    const now = new Date().toISOString()
    const codesCollection = await getCollection("codes")
    const result = await codesCollection.updateOne(
      { code },
      {
        $set: {
          used: true,
          usedAt: now,
          usedBy: fingerprint,
        },
      },
    )

    // También actualizar en memoria de respaldo
    if (global.__memoryData && Array.isArray(global.__memoryData.codes)) {
      const index = global.__memoryData.codes.findIndex((c) => c.code === code)
      if (index !== -1) {
        global.__memoryData.codes[index].used = true
        global.__memoryData.codes[index].usedAt = now
        global.__memoryData.codes[index].usedBy = fingerprint
      }
    }

    return result.modifiedCount > 0
  } catch (error) {
    console.error(`❌ Error using code ${code}:`, error)

    // Actualizar en memoria como respaldo
    if (global.__memoryData && Array.isArray(global.__memoryData.codes)) {
      const index = global.__memoryData.codes.findIndex((c) => c.code === code)
      if (index !== -1) {
        global.__memoryData.codes[index].used = true
        global.__memoryData.codes[index].usedAt = new Date().toISOString()
        global.__memoryData.codes[index].usedBy = fingerprint
        console.log("⚠️ Code marked as used in memory as fallback")
        return true
      }
    }

    return false
  }
}

// Delete a code
export async function deleteCode(code: string): Promise<boolean> {
  try {
    const codesCollection = await getCollection("codes")
    const result = await codesCollection.deleteOne({ code })

    // También eliminar de memoria de respaldo
    if (global.__memoryData && Array.isArray(global.__memoryData.codes)) {
      global.__memoryData.codes = global.__memoryData.codes.filter((c) => c.code !== code)
    }

    return result.deletedCount > 0
  } catch (error) {
    console.error(`❌ Error deleting code ${code}:`, error)

    // Eliminar de memoria como respaldo
    if (global.__memoryData && Array.isArray(global.__memoryData.codes)) {
      const initialLength = global.__memoryData.codes.length
      global.__memoryData.codes = global.__memoryData.codes.filter((c) => c.code !== code)
      console.log("⚠️ Code deleted from memory as fallback")
      return global.__memoryData.codes.length < initialLength
    }

    return false
  }
}

// Verify admin credentials
export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  try {
    const adminUsersCollection = await getCollection("admin_users")
    const user = await adminUsersCollection.findOne({
      username: username.toLowerCase(),
      password,
    })

    if (user) {
      // Actualizar último inicio de sesión
      await adminUsersCollection.updateOne(
        { username: username.toLowerCase() },
        { $set: { lastLogin: new Date().toISOString() } },
      )
      return true
    }

    // Verificar en datos predefinidos
    const predefinedAdmins = [
      { username: "lucas", password: "lucas9244", role: "admin" },
      { username: "angeles", password: "ange1212", role: "admin" },
      { username: "admin", password: "admin123", role: "superadmin" },
    ]

    const isValid = predefinedAdmins.some(
      (admin) => admin.username.toLowerCase() === username.toLowerCase() && admin.password === password,
    )

    if (isValid) {
      // Insertar el usuario predefinido en la base de datos
      const admin = predefinedAdmins.find(
        (admin) => admin.username.toLowerCase() === username.toLowerCase() && admin.password === password,
      )

      if (admin) {
        await adminUsersCollection.updateOne(
          { username: admin.username.toLowerCase() },
          {
            $set: {
              ...admin,
              lastLogin: new Date().toISOString(),
            },
          },
          { upsert: true },
        )
      }
    }

    return isValid
  } catch (error) {
    console.error(`❌ Error verifying admin credentials for ${username}:`, error)

    // Verificar en datos predefinidos como respaldo
    const predefinedAdmins = [
      { username: "lucas", password: "lucas9244", role: "admin" },
      { username: "angeles", password: "ange1212", role: "admin" },
      { username: "admin", password: "admin123", role: "superadmin" },
    ]

    const isValid = predefinedAdmins.some(
      (admin) => admin.username.toLowerCase() === username.toLowerCase() && admin.password === password,
    )

    return isValid
  }
}

// Helper function to generate a random code
function generateRandomCode(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""

  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return code
}

// Función para importar datos desde localStorage al servidor
export async function importDataFromLocalStorage(data: any): Promise<boolean> {
  try {
    if (!data) return false

    // Importar miembros
    if (Array.isArray(data.members)) {
      const membersCollection = await getCollection("members")

      for (const member of data.members) {
        // Verificar si el miembro ya existe
        const existingMember = await membersCollection.findOne({
          $or: [{ _id: member.id }, { id: member.id }],
        })

        if (!existingMember) {
          // Crear nuevo miembro
          const { id, ...memberWithoutId } = member
          await membersCollection.insertOne({
            _id: id,
            ...memberWithoutId,
          })
        } else {
          // Actualizar miembro existente
          const { id, ...memberWithoutId } = member
          await membersCollection.updateOne({ $or: [{ _id: id }, { id }] }, { $set: memberWithoutId })
        }
      }
    }

    // Importar códigos
    if (Array.isArray(data.codes)) {
      const codesCollection = await getCollection("codes")

      for (const code of data.codes) {
        // Verificar si el código ya existe
        const existingCode = await codesCollection.findOne({ code: code.code })

        if (!existingCode) {
          // Insertar nuevo código
          await codesCollection.insertOne(code)
        }
      }
    }

    return true
  } catch (error) {
    console.error("❌ Error importing data from localStorage:", error)

    // Guardar en memoria como último recurso
    if (global.__memoryData && data) {
      if (Array.isArray(data.members)) {
        global.__memoryData.members = data.members
      }
      if (Array.isArray(data.codes)) {
        global.__memoryData.codes = data.codes
      }
      console.log("⚠️ Data imported to memory as fallback")
    }

    return false
  }
}

// Función para exportar todos los datos
export async function exportAllData() {
  try {
    const members = await getAllMembers()
    const codes = await getAllCodes()

    return {
      members,
      codes,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("❌ Error exporting all data:", error)

    // Fallback a datos en memoria
    if (global.__memoryData) {
      return {
        members: global.__memoryData.members || [],
        codes: global.__memoryData.codes || [],
        timestamp: new Date().toISOString(),
      }
    }

    return {
      members: [],
      codes: [],
      timestamp: new Date().toISOString(),
    }
  }
}
