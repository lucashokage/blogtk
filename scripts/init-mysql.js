const mysql = require("mysql2/promise")
const dotenv = require("dotenv")
const fs = require("fs-extra")
const path = require("path")

// Load environment variables
dotenv.config()

async function initializeMySQL() {
  console.log("🚀 Initializing MySQL database...")

  // Get MySQL configuration
  const config = {
    host: process.env.MYSQL_HOST || "database-1.c9wyu6c8ancu.us-east-2.rds.amazonaws.com",
    port: Number.parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "admin",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "blog_teikoku",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  }

  if (!config.password) {
    console.warn("⚠️ MySQL password not set in environment variables")
    console.warn("⚠️ Please set MYSQL_PASSWORD in your environment variables")
    process.exit(1)
  }

  let connection

  try {
    // First, connect without database to create it if it doesn't exist
    console.log(`Connecting to MySQL at ${config.host}:${config.port}...`)
    const { database, ...configWithoutDB } = config

    connection = await mysql.createConnection(configWithoutDB)

    // Create database if it doesn't exist
    console.log(`Creating database ${database} if it doesn't exist...`)
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)

    // Close connection and reconnect with database
    await connection.end()
    connection = await mysql.createConnection(config)

    // Create tables
    console.log("Creating tables if they don't exist...")

    // Members table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        description TEXT,
        avatar VARCHAR(255),
        banner VARCHAR(255),
        approved BOOLEAN DEFAULT FALSE,
        date DATETIME NOT NULL,
        lastUpdated DATETIME NOT NULL,
        fingerprint VARCHAR(255),
        rejected BOOLEAN DEFAULT FALSE,
        rejectionDate DATETIME
      )
    `)
    console.log("✅ Members table created/verified")

    // Social media table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS social_media (
        member_id VARCHAR(36) PRIMARY KEY,
        instagram VARCHAR(255),
        twitter VARCHAR(255),
        facebook VARCHAR(255),
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      )
    `)
    console.log("✅ Social media table created/verified")

    // Stats table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stats (
        member_id VARCHAR(36) PRIMARY KEY,
        social INT DEFAULT 0,
        skillful INT DEFAULT 0,
        intelligence INT DEFAULT 0,
        administrative INT DEFAULT 0,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      )
    `)
    console.log("✅ Stats table created/verified")

    // Codes table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS codes (
        code VARCHAR(36) PRIMARY KEY,
        createdAt DATETIME NOT NULL,
        expiresAt DATETIME NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        usedAt DATETIME,
        usedBy VARCHAR(255)
      )
    `)
    console.log("✅ Codes table created/verified")

    // Admin users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        username VARCHAR(255) PRIMARY KEY,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        lastLogin DATETIME
      )
    `)
    console.log("✅ Admin users table created/verified")

    // Insert default admin users
    console.log("Inserting default admin users...")
    const adminUsers = [
      { username: "lucas", password: "lucas9244", role: "admin" },
      { username: "angeles", password: "ange1212", role: "admin" },
      { username: "admin", password: "admin123", role: "superadmin" },
    ]

    for (const user of adminUsers) {
      await connection.query(
        `INSERT INTO admin_users (username, password, role) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role)`,
        [user.username, user.password, user.role],
      )
    }
    console.log("✅ Default admin users inserted/updated")

    console.log("✅ MySQL database initialization completed successfully")
    return true
  } catch (error) {
    console.error("❌ Error initializing MySQL database:", error)
    return false
  } finally {
    if (connection) {
      await connection.end()
      console.log("MySQL connection closed")
    }
  }
}

// Run the initialization
if (require.main === module) {
  initializeMySQL()
    .then((success) => {
      console.log(success ? "✅ Script completed successfully" : "⚠️ Script completed with warnings")
      process.exit(success ? 0 : 1)
    })
    .catch((err) => {
      console.error("❌ Fatal error:", err)
      process.exit(1)
    })
} else {
  module.exports = initializeMySQL
}
