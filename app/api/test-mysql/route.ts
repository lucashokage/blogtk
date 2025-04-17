import { NextResponse } from "next/server"
import mysql from "mysql2/promise"

export async function GET() {
  try {
    // Get MySQL configuration
    const config = {
      host: process.env.MYSQL_HOST || "database-1.c9wyu6c8ancu.us-east-2.rds.amazonaws.com",
      port: Number.parseInt(process.env.MYSQL_PORT || "3306", 10),
      user: process.env.MYSQL_USER || "admin",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "blog_teikoku",
      connectTimeout: 10000,
    }

    if (!config.password) {
      return NextResponse.json(
        {
          success: false,
          error: "MySQL password not set in environment variables",
        },
        { status: 500 },
      )
    }

    // Connect to MySQL
    const connection = await mysql.createConnection(config)

    // Test the connection with a simple query
    const [rows] = await connection.query("SELECT 1 as test")

    // Get server information
    const [serverInfo] = await connection.query("SELECT VERSION() as version")

    // List all tables
    const [tables] = await connection.query("SHOW TABLES")

    // Close the connection
    await connection.end()

    return NextResponse.json({
      success: true,
      message: "MySQL connection successful",
      test: rows,
      serverInfo: serverInfo[0],
      tables: tables.map((table) => Object.values(table)[0]),
    })
  } catch (error) {
    console.error("Error connecting to MySQL:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error connecting to MySQL",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
