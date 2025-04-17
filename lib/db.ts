import { getMySQLPool, generateId } from "./mysql"
import type mysql from "mysql2/promise"

// Declare global variables for fallback data
declare global {
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

// Member repository functions
export async function getAllMembers(): Promise<Member[]> {
  try {
    const pool = await getMySQLPool()

    // Query to get all members with their social media and stats
    const [rows] = await pool.query(`
      SELECT m.*, 
             sm.instagram, sm.twitter, sm.facebook,
             s.social, s.skillful, s.intelligence, s.administrative
      FROM members m
      LEFT JOIN social_media sm ON m.id = sm.member_id
      LEFT JOIN stats s ON m.id = s.member_id
    `)

    // Transform the rows into Member objects
    return (rows as any[]).map((row) => {
      const member: Member = {
        id: row.id,
        name: row.name,
        role: row.role,
        description: row.description,
        avatar: row.avatar,
        banner: row.banner,
        approved: Boolean(row.approved),
        date: new Date(row.date).toISOString(),
        lastUpdated: new Date(row.lastUpdated).toISOString(),
        fingerprint: row.fingerprint,
        rejected: Boolean(row.rejected),
        rejectionDate: row.rejectionDate ? new Date(row.rejectionDate).toISOString() : undefined,
        social:
          row.instagram || row.twitter || row.facebook
            ? {
                instagram: row.instagram,
                twitter: row.twitter,
                facebook: row.facebook,
              }
            : undefined,
        stats:
          row.social !== undefined || row.skillful !== undefined || row.intelligence !== undefined
            ? {
                social: row.social || 0,
                skillful: row.skillful || 0,
                intelligence: row.intelligence || 0,
                administrative: row.administrative || 0,
              }
            : undefined,
      }

      return member
    })
  } catch (error) {
    console.error("❌ Error getting all members:", error)

    // Fallback to in-memory data
    if (global.__memoryData && Array.isArray(global.__memoryData.members)) {
      console.log("⚠️ Falling back to in-memory members data")
      return global.__memoryData.members
    }

    return []
  }
}

// Get member by ID
export async function getMemberById(id: string): Promise<Member | undefined> {
  try {
    const pool = await getMySQLPool()

    // Query to get a member with its social media and stats
    const [rows] = await pool.query(
      `
      SELECT m.*, 
             sm.instagram, sm.twitter, sm.facebook,
             s.social, s.skillful, s.intelligence, s.administrative
      FROM members m
      LEFT JOIN social_media sm ON m.id = sm.member_id
      LEFT JOIN stats s ON m.id = s.member_id
      WHERE m.id = ?
    `,
      [id],
    )

    if ((rows as any[]).length === 0) {
      return undefined
    }

    const row = (rows as any[])[0]

    // Transform the row into a Member object
    const member: Member = {
      id: row.id,
      name: row.name,
      role: row.role,
      description: row.description,
      avatar: row.avatar,
      banner: row.banner,
      approved: Boolean(row.approved),
      date: new Date(row.date).toISOString(),
      lastUpdated: new Date(row.lastUpdated).toISOString(),
      fingerprint: row.fingerprint,
      rejected: Boolean(row.rejected),
      rejectionDate: row.rejectionDate ? new Date(row.rejectionDate).toISOString() : undefined,
      social:
        row.instagram || row.twitter || row.facebook
          ? {
              instagram: row.instagram,
              twitter: row.twitter,
              facebook: row.facebook,
            }
          : undefined,
      stats:
        row.social !== undefined || row.skillful !== undefined || row.intelligence !== undefined
          ? {
              social: row.social || 0,
              skillful: row.skillful || 0,
              intelligence: row.intelligence || 0,
              administrative: row.administrative || 0,
            }
          : undefined,
    }

    return member
  } catch (error) {
    console.error(`❌ Error getting member by ID ${id}:`, error)

    // Fallback to in-memory data
    if (global.__memoryData && Array.isArray(global.__memoryData.members)) {
      console.log("⚠️ Falling back to in-memory members data for getMemberById")
      return global.__memoryData.members.find((m) => m.id === id)
    }

    return undefined
  }
}

// Create a new member
export async function createMember(member: Member): Promise<Member> {
  try {
    const pool = await getMySQLPool()

    // Generate ID if not provided
    if (!member.id) {
      member.id = generateId()
    }

    // Set default values
    const now = new Date().toISOString()
    member.date = member.date || now
    member.lastUpdated = now

    // Start a transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Insert member
      await connection.query(
        `
        INSERT INTO members (
          id, name, role, description, avatar, banner, 
          approved, date, lastUpdated, fingerprint, rejected, rejectionDate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

      // Commit the transaction
      await connection.commit()

      return member
    } catch (error) {
      // Rollback the transaction on error
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("❌ Error creating member:", error)

    // Store in memory as fallback
    if (global.__memoryData) {
      if (!Array.isArray(global.__memoryData.members)) {
        global.__memoryData.members = []
      }

      // Generate ID if not provided
      if (!member.id) {
        member.id = generateId()
      }

      // Set default values
      const now = new Date().toISOString()
      member.date = member.date || now
      member.lastUpdated = now

      global.__memoryData.members.push(member)
      console.log("⚠️ Member stored in memory as fallback")
      return member
    }

    throw error
  }
}

// Update an existing member
export async function updateMember(id: string, updates: Partial<Member>): Promise<Member | null> {
  try {
    const pool = await getMySQLPool()

    // Update timestamp
    updates.lastUpdated = new Date().toISOString()

    // Get the existing member
    const existingMember = await getMemberById(id)
    if (!existingMember) {
      return null
    }

    // Start a transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Update member
      const memberFields: string[] = []
      const memberValues: any[] = []

      if (updates.name !== undefined) {
        memberFields.push("name = ?")
        memberValues.push(updates.name)
      }

      if (updates.role !== undefined) {
        memberFields.push("role = ?")
        memberValues.push(updates.role)
      }

      if (updates.description !== undefined) {
        memberFields.push("description = ?")
        memberValues.push(updates.description)
      }

      if (updates.avatar !== undefined) {
        memberFields.push("avatar = ?")
        memberValues.push(updates.avatar)
      }

      if (updates.banner !== undefined) {
        memberFields.push("banner = ?")
        memberValues.push(updates.banner)
      }

      if (updates.approved !== undefined) {
        memberFields.push("approved = ?")
        memberValues.push(updates.approved ? 1 : 0)
      }

      if (updates.rejected !== undefined) {
        memberFields.push("rejected = ?")
        memberValues.push(updates.rejected ? 1 : 0)
      }

      if (updates.rejectionDate !== undefined) {
        memberFields.push("rejectionDate = ?")
        memberValues.push(updates.rejectionDate ? new Date(updates.rejectionDate) : null)
      }

      if (updates.fingerprint !== undefined) {
        memberFields.push("fingerprint = ?")
        memberValues.push(updates.fingerprint)
      }

      // Always update lastUpdated
      memberFields.push("lastUpdated = ?")
      memberValues.push(new Date(updates.lastUpdated))

      // Add id to values
      memberValues.push(id)

      if (memberFields.length > 0) {
        await connection.query(`UPDATE members SET ${memberFields.join(", ")} WHERE id = ?`, memberValues)
      }

      // Update social media if provided
      if (updates.social) {
        // Check if social media record exists
        const [socialRows] = await connection.query("SELECT 1 FROM social_media WHERE member_id = ?", [id])

        if ((socialRows as any[]).length > 0) {
          // Update existing record
          await connection.query(
            `
            UPDATE social_media 
            SET instagram = ?, twitter = ?, facebook = ?
            WHERE member_id = ?
          `,
            [updates.social.instagram || null, updates.social.twitter || null, updates.social.facebook || null, id],
          )
        } else {
          // Insert new record
          await connection.query(
            `
            INSERT INTO social_media (member_id, instagram, twitter, facebook)
            VALUES (?, ?, ?, ?)
          `,
            [id, updates.social.instagram || null, updates.social.twitter || null, updates.social.facebook || null],
          )
        }
      }

      // Update stats if provided
      if (updates.stats) {
        // Check if stats record exists
        const [statsRows] = await connection.query("SELECT 1 FROM stats WHERE member_id = ?", [id])

        if ((statsRows as any[]).length > 0) {
          // Update existing record
          await connection.query(
            `
            UPDATE stats 
            SET social = ?, skillful = ?, intelligence = ?, administrative = ?
            WHERE member_id = ?
          `,
            [
              updates.stats.social || 0,
              updates.stats.skillful || 0,
              updates.stats.intelligence || 0,
              updates.stats.administrative || 0,
              id,
            ],
          )
        } else {
          // Insert new record
          await connection.query(
            `
            INSERT INTO stats (member_id, social, skillful, intelligence, administrative)
            VALUES (?, ?, ?, ?, ?)
          `,
            [
              id,
              updates.stats.social || 0,
              updates.stats.skillful || 0,
              updates.stats.intelligence || 0,
              updates.stats.administrative || 0,
            ],
          )
        }
      }

      // Commit the transaction
      await connection.commit()

      // Get the updated member
      const updatedMember = await getMemberById(id)
      return updatedMember || null
    } catch (error) {
      // Rollback the transaction on error
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error(`❌ Error updating member ${id}:`, error)

    // Update in memory as fallback
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
    const pool = await getMySQLPool()

    // Delete the member (cascade will delete related records)
    const [result] = await pool.query("DELETE FROM members WHERE id = ?", [id])

    // Also delete from memory fallback
    if (global.__memoryData && Array.isArray(global.__memoryData.members)) {
      global.__memoryData.members = global.__memoryData.members.filter((m) => m.id !== id)
    }

    return (result as mysql.ResultSetHeader).affectedRows > 0
  } catch (error) {
    console.error(`❌ Error deleting member ${id}:`, error)

    // Delete from memory as fallback
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
export async function getAllCodes(): Promise<Code[]> {
  try {
    const pool = await getMySQLPool()

    // Query to get all codes
    const [rows] = await pool.query("SELECT * FROM codes")

    // Transform the rows into Code objects
    return (rows as any[]).map((row) => {
      const code: Code = {
        code: row.code,
        createdAt: new Date(row.createdAt).toISOString(),
        expiresAt: new Date(row.expiresAt).toISOString(),
        used: Boolean(row.used),
        usedAt: row.usedAt ? new Date(row.usedAt).toISOString() : undefined,
        usedBy: row.usedBy || undefined,
      }

      return code
    })
  } catch (error) {
    console.error("❌ Error getting all codes:", error)

    // Fallback to in-memory data
    if (global.__memoryData && Array.isArray(global.__memoryData.codes)) {
      console.log("⚠️ Falling back to in-memory codes data")
      return global.__memoryData.codes
    }

    return []
  }
}

// Get code by value
export async function getCodeByValue(code: string): Promise<Code | undefined> {
  try {
    const pool = await getMySQLPool()

    // Query to get a code by its value
    const [rows] = await pool.query("SELECT * FROM codes WHERE code = ?", [code])

    if ((rows as any[]).length === 0) {
      return undefined
    }

    const row = (rows as any[])[0]

    // Transform the row into a Code object
    return {
      code: row.code,
      createdAt: new Date(row.createdAt).toISOString(),
      expiresAt: new Date(row.expiresAt).toISOString(),
      used: Boolean(row.used),
      usedAt: row.usedAt ? new Date(row.usedAt).toISOString() : undefined,
      usedBy: row.usedBy || undefined,
    }
  } catch (error) {
    console.error(`❌ Error getting code ${code}:`, error)

    // Fallback to in-memory data
    if (global.__memoryData && Array.isArray(global.__memoryData.codes)) {
      console.log("⚠️ Falling back to in-memory codes data for getCodeByValue")
      return global.__memoryData.codes.find((c) => c.code === code)
    }

    return undefined
  }
}

// Create a new code
export async function createCode(expirationDays = 7): Promise<Code> {
  try {
    const pool = await getMySQLPool()

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
      usedAt: null,
      usedBy: null,
    }

    // Insert the code
    await pool.query(
      `
      INSERT INTO codes (code, createdAt, expiresAt, used, usedAt, usedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [newCode.code, new Date(newCode.createdAt), new Date(newCode.expiresAt), newCode.used ? 1 : 0, null, null],
    )

    // Also store in memory as fallback
    if (global.__memoryData) {
      if (!Array.isArray(global.__memoryData.codes)) {
        global.__memoryData.codes = []
      }
      global.__memoryData.codes.push(newCode)
    }

    return newCode
  } catch (error) {
    console.error("❌ Error creating code:", error)

    // Generate code in memory as fallback
    const code = generateRandomCode()
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + expirationDays)

    const newCode = {
      code,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      used: false,
      usedAt: null,
      usedBy: null,
    }

    if (global.__memoryData) {
      if (!Array.isArray(global.__memoryData.codes)) {
        global.__memoryData.codes = []
      }
      global.__memoryData.codes.push(newCode)
      console.log("⚠️ Code created in memory as fallback")
    }

    return newCode
  }
}

// Mark a code as used
export async function useCode(code: string, fingerprint: string): Promise<boolean> {
  try {
    const pool = await getMySQLPool()

    // Verify if the code exists and is not used
    const existingCode = await getCodeByValue(code)
    if (!existingCode || existingCode.used || new Date(existingCode.expiresAt) < new Date()) {
      return false
    }

    // Mark as used
    const now = new Date().toISOString()
    const [result] = await pool.query(
      `
      UPDATE codes
      SET used = ?, usedAt = ?, usedBy = ?
      WHERE code = ?
    `,
      [1, new Date(now), fingerprint, code],
    )

    // Also update in memory fallback
    if (global.__memoryData && Array.isArray(global.__memoryData.codes)) {
      const index = global.__memoryData.codes.findIndex((c) => c.code === code)
      if (index !== -1) {
        global.__memoryData.codes[index].used = true
        global.__memoryData.codes[index].usedAt = now
        global.__memoryData.codes[index].usedBy = fingerprint
      }
    }

    return (result as mysql.ResultSetHeader).affectedRows > 0
  } catch (error) {
    console.error(`❌ Error using code ${code}:`, error)

    // Update in memory as fallback
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
    const pool = await getMySQLPool()

    // Delete the code
    const [result] = await pool.query("DELETE FROM codes WHERE code = ?", [code])

    // Also delete from memory fallback
    if (global.__memoryData && Array.isArray(global.__memoryData.codes)) {
      global.__memoryData.codes = global.__memoryData.codes.filter((c) => c.code !== code)
    }

    return (result as mysql.ResultSetHeader).affectedRows > 0
  } catch (error) {
    console.error(`❌ Error deleting code ${code}:`, error)

    // Delete from memory as fallback
    if (global.__memoryData && Array.isArray(global.__memoryData.codes)) {
      const initialLength = global.__memoryData.codes.length
      global.__memoryData.codes = global.__memoryData.codes.filter((c) => c.code !== code)
      console.log("⚠️ Code deleted from memory as fallback")
      return global.__memoryData.codes.length < initialLength
    }

    return false
  }
}

// Verify admin credentials
export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  try {
    const pool = await getMySQLPool()

    // Query to get admin user
    const [rows] = await pool.query(
      `
      SELECT * FROM admin_users
      WHERE username = ? AND password = ?
    `,
      [username.toLowerCase(), password],
    )

    if ((rows as any[]).length > 0) {
      // Update last login
      await pool.query(
        `
        UPDATE admin_users
        SET lastLogin = ?
        WHERE username = ?
      `,
        [new Date(), username.toLowerCase()],
      )

      return true
    }

    // Verify in predefined data
    const predefinedAdmins = [
      { username: "lucas", password: "lucas9244", role: "admin" },
      { username: "angeles", password: "ange1212", role: "admin" },
      { username: "admin", password: "admin123", role: "superadmin" },
    ]

    const isValid = predefinedAdmins.some(
      (admin) => admin.username.toLowerCase() === username.toLowerCase() && admin.password === password,
    )

    if (isValid) {
      // Insert the predefined user into the database
      const admin = predefinedAdmins.find(
        (admin) => admin.username.toLowerCase() === username.toLowerCase() && admin.password === password,
      )

      if (admin) {
        await pool.query(
          `
          INSERT INTO admin_users (username, password, role, lastLogin)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          password = VALUES(password),
          role = VALUES(role),
          lastLogin = VALUES(lastLogin)
        `,
          [admin.username.toLowerCase(), admin.password, admin.role, new Date()],
        )
      }
    }

    return isValid
  } catch (error) {
    console.error(`❌ Error verifying admin credentials for ${username}:`, error)

    // Verify in predefined data as fallback
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

// Helper function to generate a random code
function generateRandomCode(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""

  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return code
}

// Function to import data from localStorage to the server
export async function importDataFromLocalStorage(data: any): Promise<boolean> {
  try {
    if (!data) return false

    const pool = await getMySQLPool()
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Import members
      if (Array.isArray(data.members)) {
        for (const member of data.members) {
          // Check if member exists
          const [memberRows] = await connection.query("SELECT 1 FROM members WHERE id = ?", [member.id])

          if ((memberRows as any[]).length === 0) {
            // Insert new member
            await connection.query(
              `
              INSERT INTO members (
                id, name, role, description, avatar, banner, 
                approved, date, lastUpdated, fingerprint, rejected, rejectionDate
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
              `,
                [
                  member.id,
                  member.social.instagram || null,
                  member.social.twitter || null,
                  member.social.facebook || null,
                ],
              )
            }

            // Insert stats if provided
            if (member.stats) {
              await connection.query(
                `
                INSERT INTO stats (member_id, social, skillful, intelligence, administrative)
                VALUES (?, ?, ?, ?, ?)
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
          } else {
            // Update existing member
            await connection.query(
              `
              UPDATE members SET
                name = ?, role = ?, description = ?, avatar = ?, banner = ?,
                approved = ?, lastUpdated = ?, fingerprint = ?, rejected = ?, rejectionDate = ?
              WHERE id = ?
            `,
              [
                member.name,
                member.role,
                member.description,
                member.avatar,
                member.banner,
                member.approved ? 1 : 0,
                new Date(member.lastUpdated),
                member.fingerprint || null,
                member.rejected ? 1 : 0,
                member.rejectionDate ? new Date(member.rejectionDate) : null,
                member.id,
              ],
            )

            // Update social media if provided
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
                [
                  member.id,
                  member.social.instagram || null,
                  member.social.twitter || null,
                  member.social.facebook || null,
                ],
              )
            }

            // Update stats if provided
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
        }
      }

      // Import codes
      if (Array.isArray(data.codes)) {
        for (const code of data.codes) {
          // Check if code exists
          const [codeRows] = await connection.query("SELECT 1 FROM codes WHERE code = ?", [code.code])

          if ((codeRows as any[]).length === 0) {
            // Insert new code
            await connection.query(
              `
              INSERT INTO codes (code, createdAt, expiresAt, used, usedAt, usedBy)
              VALUES (?, ?, ?, ?, ?, ?)
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
        }
      }

      // Commit the transaction
      await connection.commit()

      return true
    } catch (error) {
      // Rollback the transaction on error
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("❌ Error importing data from localStorage:", error)

    // Save in memory as last resort
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

// Function to export all data
export async function exportAllData() {
  try {
    const members = await getAllMembers()
    const codes = await getAllCodes()

    return {
      members,
      codes,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("❌ Error exporting all data:", error)

    // Fallback to in-memory data
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
