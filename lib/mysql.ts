import mysql from "mysql2/promise"
import { v4 as uuidv4 } from "uuid"

// Define global variables for connection pooling
declare global {
  var mysqlPool: mysql.Pool | undefined
  var __memoryData: {
    members: any[]
    codes: any[]
    adminUsers: any[]
  }
}

// Initialize in-memory data as fallback
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

// Get MySQL connection configuration
const getMySQLConfig = () => {
  return {
    host: process.env.MYSQL_HOST || "database-1.c9wyu6c8ancu.us-east-2.rds.amazonaws.com",
    port: Number.parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "admin",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "blog_teikoku",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  }
}

// Create a connection pool
export async function getMySQLPool(): Promise<mysql.Pool> {
  if (!global.mysqlPool) {
    const config = getMySQLConfig()

    if (!config.password) {
      console.warn("⚠️ MySQL password not set in environment variables")
    }

    try {
      console.log(`Connecting to MySQL at ${config.host}:${config.port}...`)
      global.mysqlPool = mysql.createPool(config)

      // Test the connection
      const connection = await global.mysqlPool.getConnection()
      console.log("✅ MySQL connection established successfully")
      connection.release()

      return global.mysqlPool
    } catch (error) {
      console.error("❌ Error creating MySQL connection pool:", error)
      throw error
    }
  }

  return global.mysqlPool
}

// Close the MySQL connection pool
export async function closeMySQLConnection() {
  if (global.mysqlPool) {
    try {
      await global.mysqlPool.end()
      global.mysqlPool = undefined
      console.log("MySQL connection pool closed")
    } catch (error) {
      console.error("Error closing MySQL connection pool:", error)
    }
  }
}

// Handle process termination
if (typeof process !== "undefined") {
  process.on("SIGINT", async () => {
    await closeMySQLConnection()
    process.exit(0)
  })

  process.on("SIGTERM", async () => {
    await closeMySQLConnection()
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
