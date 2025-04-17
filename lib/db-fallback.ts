// This file provides fallback functionality when MongoDB is unavailable

import { v4 as uuidv4 } from "uuid"

// Define types
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

export interface Code {
  code: string
  createdAt: string
  expiresAt: string
  used: boolean
  usedAt?: string
  usedBy?: string
}

// Initialize in-memory storage
let memoryMembers: Member[] = []
let memoryCodes: Code[] = []
const adminUsers = [
  { username: "lucas", password: "lucas9244", role: "admin" },
  { username: "angeles", password: "ange1212", role: "admin" },
  { username: "admin", password: "admin123", role: "superadmin" },
]

// Load data from localStorage if available (client-side only)
const initializeFromLocalStorage = () => {
  if (typeof window !== "undefined") {
    try {
      const storedMembers = localStorage.getItem("blog_members")
      if (storedMembers) {
        memoryMembers = JSON.parse(storedMembers)
      }

      const storedCodes = localStorage.getItem("backup_codes")
      if (storedCodes) {
        memoryCodes = JSON.parse(storedCodes)
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error)
    }
  }
}

// Member operations
export const getAllMembersFallback = (): Member[] => {
  initializeFromLocalStorage()
  return memoryMembers
}

export const getMemberByIdFallback = (id: string): Member | undefined => {
  initializeFromLocalStorage()
  return memoryMembers.find((m) => m.id === id)
}

export const createMemberFallback = (member: Member): Member => {
  initializeFromLocalStorage()

  // Generate ID if not provided
  if (!member.id) {
    member.id = uuidv4()
  }

  // Set default values
  const now = new Date().toISOString()
  member.date = member.date || now
  member.lastUpdated = now

  memoryMembers.push(member)

  // Save to localStorage if available
  if (typeof window !== "undefined") {
    localStorage.setItem("blog_members", JSON.stringify(memoryMembers))
  }

  return member
}

export const updateMemberFallback = (id: string, updates: Partial<Member>): Member | null => {
  initializeFromLocalStorage()

  const index = memoryMembers.findIndex((m) => m.id === id)
  if (index === -1) return null

  // Update the member
  updates.lastUpdated = new Date().toISOString()
  memoryMembers[index] = { ...memoryMembers[index], ...updates }

  // Save to localStorage if available
  if (typeof window !== "undefined") {
    localStorage.setItem("blog_members", JSON.stringify(memoryMembers))
  }

  return memoryMembers[index]
}

export const deleteMemberFallback = (id: string): boolean => {
  initializeFromLocalStorage()

  const initialLength = memoryMembers.length
  memoryMembers = memoryMembers.filter((m) => m.id !== id)

  // Save to localStorage if available
  if (typeof window !== "undefined") {
    localStorage.setItem("blog_members", JSON.stringify(memoryMembers))
  }

  return memoryMembers.length < initialLength
}

// Code operations
export const getAllCodesFallback = (): Code[] => {
  initializeFromLocalStorage()
  return memoryCodes
}

export const getCodeByValueFallback = (code: string): Code | undefined => {
  initializeFromLocalStorage()
  return memoryCodes.find((c) => c.code === code)
}

export const createCodeFallback = (expirationDays = 7): Code => {
  initializeFromLocalStorage()

  // Generate a random code
  const code = generateRandomCode()

  // Calculate expiration date
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + expirationDays)

  const newCode = {
    code,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    used: false,
  }

  memoryCodes.push(newCode)

  // Save to localStorage if available
  if (typeof window !== "undefined") {
    localStorage.setItem("backup_codes", JSON.stringify(memoryCodes))
  }

  return newCode
}

export const useCodeFallback = (code: string, fingerprint: string): boolean => {
  initializeFromLocalStorage()

  const index = memoryCodes.findIndex((c) => c.code === code)
  if (index === -1) return false

  // Check if code is already used or expired
  if (memoryCodes[index].used || new Date(memoryCodes[index].expiresAt) < new Date()) {
    return false
  }

  // Mark as used
  memoryCodes[index].used = true
  memoryCodes[index].usedAt = new Date().toISOString()
  memoryCodes[index].usedBy = fingerprint

  // Save to localStorage if available
  if (typeof window !== "undefined") {
    localStorage.setItem("backup_codes", JSON.stringify(memoryCodes))
  }

  return true
}

export const deleteCodeFallback = (code: string): boolean => {
  initializeFromLocalStorage()

  const initialLength = memoryCodes.length
  memoryCodes = memoryCodes.filter((c) => c.code !== code)

  // Save to localStorage if available
  if (typeof window !== "undefined") {
    localStorage.setItem("backup_codes", JSON.stringify(memoryCodes))
  }

  return memoryCodes.length < initialLength
}

export const verifyAdminCredentialsFallback = (username: string, password: string): boolean => {
  return adminUsers.some(
    (admin) => admin.username.toLowerCase() === username.toLowerCase() && admin.password === password,
  )
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
