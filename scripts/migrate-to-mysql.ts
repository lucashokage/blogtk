import mysql from "mysql2/promise"
import fs from "fs-extra"
import path from "path"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// MySQL connection configuration
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
  }
}

// Function to migrate data from JSON export to MySQL
async function migrateToMySQL(jsonFilePath: string) {
  console.log("🚀 Starting migration to MySQL...")

  // Check if JSON file exists
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`❌ JSON file not found at ${jsonFilePath}`)
    return false
  }

  // Read JSON data
  const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf8"))

  if (!jsonData.members || !jsonData.codes) {
    console.error("❌ Invalid JSON data format. Expected members and codes arrays.")
    return false
  }

  // Connect to MySQL
  const config = getMySQLConfig()

  if (!config.password) {
    console.warn("⚠️ MySQL password not set in environment variables")
    console.warn("⚠️ Please set MYSQL_PASSWORD in your environment variables")
    return false
  }

  let connection

  try {
    console.log(`Connecting to MySQL at ${config.host}:${config.port}...`)
    connection = await mysql.createConnection(config)

    // Start a transaction
    await connection.beginTransaction()

    // Migrate members
    console.log(`Migrating ${jsonData.members.length} members...`)

    for (const member of jsonData.members) {
      console.log(`Migrating member: ${member.name} (${member.id})`)

      // Insert member
      await connection.query(
        `
        INSERT INTO members (
          id, name, role, description, avatar, banner, 
          approved, date, lastUpdated, fingerprint, rejected, rejectionDate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        role = VALUES(role),
        description = VALUES(description),
        avatar = VALUES(avatar),
        banner = VALUES(banner),
        approved = VALUES(approved),
        lastUpdated = VALUES(lastUpdated),
        fingerprint = VALUES(fingerprint),
        rejected = VALUES(rejected),
        rejectionDate = VALUES(rejectionDate)
      `,
        [
          member.id,
          member.name,
          member.role,
          member.description,
          member.avatar,
          member.banner,
          member.approved ? 1 : 0,
          new Date(member.date),
          new Date(member.lastUpdated),
          member.fingerprint || null,
          member.rejected ? 1 : 0,
          member.rejectionDate ? new Date(member.rejectionDate) : null,
        ],
      )

      // Insert social media if provided
      if (member.social) {
        await connection.query(
          `
          INSERT INTO social_media (member_id, instagram, twitter, facebook)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          instagram = VALUES(instagram),
          twitter = VALUES(twitter),
          facebook = VALUES(facebook)
        `,
          [member.id, member.social.instagram || null, member.social.twitter || null, member.social.facebook || null],
        )
      }

      // Insert stats if provided
      if (member.stats) {
        await connection.query(
          `
          INSERT INTO stats (member_id, social, skillful, intelligence, administrative)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          social = VALUES(social),
          skillful = VALUES(skillful),
          intelligence = VALUES(intelligence),
          administrative = VALUES(administrative)
        `,
          [
            member.id,
            member.stats.social || 0,
            member.stats.skillful || 0,
            member.stats.intelligence || 0,
            member.stats.administrative || 0,
          ],
        )
      }
    }

    // Migrate codes
    console.log(`Migrating ${jsonData.codes.length} codes...`)

    for (const code of jsonData.codes) {
      console.log(`Migrating code: ${code.code}`)

      await connection.query(
        `
        INSERT INTO codes (code, createdAt, expiresAt, used, usedAt, usedBy)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        createdAt = VALUES(createdAt),
        expiresAt = VALUES(expiresAt),
        used = VALUES(used),
        usedAt = VALUES(usedAt),
        usedBy = VALUES(usedBy)
      `,
        [
          code.code,
          new Date(code.createdAt),
          new Date(code.expiresAt),
          code.used ? 1 : 0,
          code.usedAt ? new Date(code.usedAt) : null,
          code.usedBy || null,
        ],
      )
    }

    // Commit the transaction
    await connection.commit()

    console.log("✅ Migration completed successfully")
    return true
  } catch (error) {
    // Rollback the transaction on error
    if (connection) {
      await connection.rollback()
    }

    console.error("❌ Error during migration:", error)
    return false
  } finally {
    if (connection) {
      await connection.end()
      console.log("MySQL connection closed")
    }
  }
}

// Run the migration if called directly
if (require.main === module) {
  // Default JSON file path
  const jsonFilePath = process.argv[2] || path.join(process.cwd(), "data-export.json")

  migrateToMySQL(jsonFilePath)
    .then((success) => {
      console.log(success ? "✅ Migration script completed successfully" : "⚠️ Migration script completed with warnings")
      process.exit(success ? 0 : 1)
    })
    .catch((err) => {
      console.error("❌ Fatal error:", err)
      process.exit(1)
    })
} else {
  module.exports = migrateToMySQL
}
