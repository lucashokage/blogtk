const mysql = require("mysql2/promise")
require("dotenv").config()

async function testMySQLConnection() {
  console.log("🚀 Testing MySQL connection...")

  // Get MySQL configuration
  const config = {
    host: process.env.MYSQL_HOST || "database-1.c9wyu6c8ancu.us-east-2.rds.amazonaws.com",
    port: Number.parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "admin",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "blog_teikoku",
  }

  if (!config.password) {
    console.warn("⚠️ MySQL password not set in environment variables")
    console.warn("⚠️ Please set MYSQL_PASSWORD in your environment variables")
    return false
  }

  console.log(`Connecting to MySQL at ${config.host}:${config.port}...`)

  let connection

  try {
    // Connect to MySQL
    connection = await mysql.createConnection(config)
    console.log("✅ MySQL connection established successfully")

    // Test the connection with a simple query
    const [rows] = await connection.query("SELECT 1 as test")
    console.log("✅ MySQL query executed successfully:", rows)

    // Get server information
    const [serverInfo] = await connection.query("SELECT VERSION() as version")
    console.log("✅ MySQL server version:", serverInfo[0].version)

    // List all tables
    const [tables] = await connection.query("SHOW TABLES")
    console.log("Tables in database:")
    tables.forEach((table) => {
      const tableName = Object.values(table)[0]
      console.log(` - ${tableName}`)
    })

    return true
  } catch (error) {
    console.error("❌ Error connecting to MySQL:", error)
    return false
  } finally {
    if (connection) {
      await connection.end()
      console.log("MySQL connection closed")
    }
  }
}

// Run the test
testMySQLConnection()
  .then((success) => {
    console.log(success ? "✅ MySQL connection test completed successfully" : "⚠️ MySQL connection test failed")
    process.exit(success ? 0 : 1)
  })
  .catch((err) => {
    console.error("❌ Fatal error:", err)
    process.exit(1)
  })
