import mongoose from "mongoose"

// Simple schema definition
const CodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  createdAt: { type: String, required: true },
  expiresAt: { type: String, required: true },
  used: { type: Boolean, default: false },
  usedAt: { type: String },
  usedBy: { type: String },
})

// Export the model directly
export const Code = mongoose.models.Code || mongoose.model("Code", CodeSchema)
