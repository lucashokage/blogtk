import { v4 as uuidv4 } from "uuid"
import { connectToMongoDB } from "../mongoose-connection"
import { Member, type IMember } from "../models/member.model"
import { Code, type ICode } from "../models/code.model"
import { AdminUser } from "../models/admin-user.model"

// Inicializar datos en memoria como respaldo
declare global {
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

// Helper function to generate a unique ID
export function generateId(): string {
  return uuidv4()
}

// Member repository functions
export async function getAllMembers(): Promise<IMember[]> {
  try {
    await connectToMongoDB()
    const members = await Member.find({}).lean()
    return members
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
export async function getMemberById(id: string): Promise<IMember | null> {
  try {
    await connectToMongoDB()
    const member = await Member.findOne({ id }).lean()
    return member
  } catch (error) {
    console.error(`❌ Error getting member by ID ${id}:`, error)

    // Fallback a datos en memoria
    if (global.__memoryData && Array.isArray(global.__memoryData.members)) {
      console.log("⚠️ Falling back to in-memory members data for getMemberById")
      return global.__memoryData.members.find((m) => m.id === id) || null
    }

    return null
  }
}

// Create a new member
export async function createMember(memberData: any): Promise<IMember> {
  try {
    await connectToMongoDB()

    // Generar ID si no se proporciona
    if (!memberData.id) {
      memberData.id = generateId()
    }

    // Establecer valores predeterminados
    const now = new Date().toISOString()
    memberData.date = memberData.date || now
    memberData.lastUpdated = now

    const member = new Member(memberData)
    await member.save()

    return member.toObject()
  } catch (error) {
    console.error("❌ Error creating member:", error)

    // Almacenar en memoria como respaldo
    if (global.__memoryData) {
      if (!Array.isArray(global.__memoryData.members)) {
        global.__memoryData.members = []
      }

      // Generar ID si no se proporciona
      if (!memberData.id) {
        memberData.id = generateId()
      }

      // Establecer valores predeterminados
      const now = new Date().toISOString()
      memberData.date = memberData.date || now
      memberData.lastUpdated = now

      global.__memoryData.members.push(memberData)
      console.log("⚠️ Member stored in memory as fallback")
      return memberData
    }

    throw error
  }
}

// Update an existing member
export async function updateMember(id: string, updates: Partial<IMember>): Promise<IMember | null> {
  try {
    await connectToMongoDB()

    // Actualizar timestamp
    updates.lastUpdated = new Date().toISOString()

    const updatedMember = await Member.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true, runValidators: true },
    ).lean()

    if (!updatedMember) {
      return null
    }

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
    await connectToMongoDB()
    const result = await Member.deleteOne({ id })

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
export async function getAllCodes(): Promise<ICode[]> {
  try {
    await connectToMongoDB()
    const codes = await Code.find({}).lean()
    return codes
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
export async function getCodeByValue(code: string): Promise<ICode | null> {
  try {
    await connectToMongoDB()
    const codeDoc = await Code.findOne({ code }).lean()
    return codeDoc
  } catch (error) {
    console.error(`❌ Error getting code ${code}:`, error)

    // Fallback a datos en memoria
    if (global.__memoryData && Array.isArray(global.__memoryData.codes)) {
      console.log("⚠️ Falling back to in-memory codes data for getCodeByValue")
      return global.__memoryData.codes.find((c) => c.code === code) || null
    }

    return null
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

// Create a new code
export async function createCode(expirationDays = 7): Promise<ICode> {
  try {
    await connectToMongoDB()

    // Generar un código aleatorio
    const code = generateRandomCode()

    // Calcular fecha de expiración
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + expirationDays)

    const newCode = new Code({
      code,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      used: false,
    })

    await newCode.save()

    // También almacenar en memoria como respaldo
    if (global.__memoryData) {
      if (!Array.isArray(global.__memoryData.codes)) {
        global.__memoryData.codes = []
      }
      global.__memoryData.codes.push(newCode.toObject())
    }

    return newCode.toObject()
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
    }

    if (global.__memoryData) {
      if (!Array.isArray(global.__memoryData.codes)) {
        global.__memoryData.codes = []
      }
      global.__memoryData.codes.push(newCode)
      console.log("⚠️ Code created in memory as fallback")
    }

    return newCode as ICode
  }
}

// Mark a code as used
export async function useCode(code: string, fingerprint: string): Promise<boolean> {
  try {
    await connectToMongoDB()

    // Verificar si el código existe y no está usado
    const existingCode = await Code.findOne({ code })

    if (!existingCode || existingCode.used || new Date(existingCode.expiresAt) < new Date()) {
      return false
    }

    // Marcar como usado
    const now = new Date().toISOString()
    const result = await Code.updateOne(
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
    await connectToMongoDB()
    const result = await Code.deleteOne({ code })

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

// ADMIN USERS FUNCTIONS

// Verify admin credentials
export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  try {
    await connectToMongoDB()
    const user = await AdminUser.findOne({
      username: username.toLowerCase(),
      password,
    })

    if (user) {
      // Actualizar último inicio de sesión
      await AdminUser.updateOne({ username: username.toLowerCase() }, { $set: { lastLogin: new Date().toISOString() } })
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
        await AdminUser.updateOne(
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

// Función para importar datos desde localStorage al servidor
export async function importDataFromLocalStorage(data: any): Promise<boolean> {
  try {
    if (!data) return false
    await connectToMongoDB()

    // Importar miembros
    if (Array.isArray(data.members)) {
      for (const member of data.members) {
        // Verificar si el miembro ya existe
        const existingMember = await Member.findOne({ id: member.id })

        if (!existingMember) {
          // Crear nuevo miembro
          await Member.create(member)
        } else {
          // Actualizar miembro existente
          await Member.updateOne({ id: member.id }, { $set: member })
        }
      }
    }

    // Importar códigos
    if (Array.isArray(data.codes)) {
      for (const code of data.codes) {
        // Verificar si el código ya existe
        const existingCode = await Code.findOne({ code: code.code })

        if (!existingCode) {
          // Insertar nuevo código
          await Code.create(code)
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
    await connectToMongoDB()
    const members = await Member.find({}).lean()
    const codes = await Code.find({}).lean()

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
