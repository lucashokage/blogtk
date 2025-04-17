import mysql from "mysql2/promise"

// Define global variables for connection pooling
declare global {
  var mysqlPool: mysql.Pool | undefined
  var mysqlConnectionError: Error | undefined
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
    // Add timeout settings
    connectTimeout: 10000, // 10 seconds
    timeout: 60000, // 60 seconds
  }
}

// Create a connection pool with retry mechanism
export async function getMySQLPool(): Promise<mysql.Pool | null> {
  // If we already have a pool, return it
  if (global.mysqlPool) {
    return global.mysqlPool
  }

  // If we've already tried and failed, don't retry immediately
  if (global.mysqlConnectionError) {
    const lastErrorTime = (global.mysqlConnectionError as any).timestamp || 0
    const now = Date.now()

    // Only retry after 5 minutes
    if (now - lastErrorTime < 5 * 60 * 1000) {
      console.log("⚠️ Using in-memory fallback (MySQL connection failed recently)")
      return null
    }
  }

  const config = getMySQLConfig()

  if (!config.password) {
    console.warn("⚠️ MySQL password not set in environment variables")
    return null
  }

  try {
    console.log(`Connecting to MySQL at ${config.host}:${config.port}...`)
    global.mysqlPool = mysql.createPool(config)

    // Test the connection
    const connection = await global.mysqlPool.getConnection()
    console.log("✅ MySQL connection established successfully")
    connection.release()

    // Clear any previous error
    global.mysqlConnectionError = undefined

    return global.mysqlPool
  } catch (error: any) {
    console.error("❌ Error creating MySQL connection pool:", error)

    // Store the error with timestamp for retry logic
    error.timestamp = Date.now()
    global.mysqlConnectionError = error

    return null
  }
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
