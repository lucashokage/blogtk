import mongoose from "mongoose"

// Simple schema definition
const AdminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, required: true, default: "admin" },
  lastLogin: { type: String },
})

// Export the model directly
export const AdminUser = mongoose.models.AdminUser || mongoose.model("AdminUser", AdminUserSchema)
