const mysql = require("mysql2/promise")
require("dotenv").config()

async function checkMySQLConnection() {
  console.log("🔍 Checking MySQL connection...")

  // Get MySQL configuration
  const config = {
    host: process.env.MYSQL_HOST || "database-1.c9wyu6c8ancu.us-east-2.rds.amazonaws.com",
    port: Number.parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "admin",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "blog_teikoku",
    connectTimeout: 10000, // 10 seconds
  }

  if (!config.password) {
    console.warn("⚠️ MySQL password not set in environment variables")
    console.warn("⚠️ Please set MYSQL_PASSWORD in your environment variables")
    return false
  }

  console.log(`Attempting to connect to MySQL at ${config.host}:${config.port}...`)

  try {
    // Connect to MySQL
    const connection = await mysql.createConnection(config)
    console.log("✅ MySQL connection successful!")

    // Test the connection with a simple query
    const [rows] = await connection.query("SELECT 1 as test")
    console.log("✅ MySQL query executed successfully:", rows)

    // Close the connection
    await connection.end()
    console.log("Connection closed")
    return true
  } catch (error) {
    console.error("❌ Error connecting to MySQL:", error.message)

    if (error.code === "ETIMEDOUT") {
      console.log("\nPossible causes:")
      console.log("1. The MySQL server is not running")
      console.log("2. The MySQL server is not accessible from your current network")
      console.log("3. Firewall or security group rules are blocking the connection")
      console.log("4. The host, port, or credentials are incorrect")

      console.log("\nSuggestions:")
      console.log("1. Verify that the MySQL server is running")
      console.log("2. Check if your IP is allowed in the security group/firewall")
      console.log("3. Verify the connection details in your .env file")
    }

    return false
  }
}

// Run the check
checkMySQLConnection()
  .then((success) => {
    console.log(success ? "✅ MySQL connection check completed successfully" : "⚠️ MySQL connection check failed")
    process.exit(success ? 0 : 1)
  })
  .catch((err) => {
    console.error("❌ Fatal error:", err)
    process.exit(1)
  })
