import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const dataFilePath = path.join(process.cwd(), "data", "blog.json")

// Helper functions
const readBlogData = (): any => {
  try {
    if (!fs.existsSync(dataFilePath)) {
      fs.mkdirSync(path.dirname(dataFilePath), { recursive: true })
      fs.writeFileSync(dataFilePath, "{}", "utf-8")
      return {}
    }
    const data = fs.readFileSync(dataFilePath, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading blog data file:", error)
    return {}
  }
}

const writeBlogData = (data: any): boolean => {
  try {
    const dir = path.dirname(dataFilePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf-8")
    return true
  } catch (error) {
    console.error("Error writing blog data file:", error)
    return false
  }
}

// POST - Import blog data
export async function POST(request: Request) {
  try {
    const blogData = await request.json()

    if (!blogData || typeof blogData !== "object") {
      return NextResponse.json({ error: "Invalid blog data format" }, { status: 400 })
    }

    const writeSuccess = writeBlogData(blogData)

    if (!writeSuccess) {
      throw new Error("Failed to write blog data")
    }

    return NextResponse.json({
      success: true,
      message: "Blog data imported successfully",
    })
  } catch (error) {
    console.error("Error in POST /api/blog/import:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import blog data" },
      { status: 500 },
    )
  }
}

// GET - Get blog data
export async function GET() {
  try {
    const blogData = readBlogData()
    return NextResponse.json(blogData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to load blog data" }, { status: 500 })
  }
}
