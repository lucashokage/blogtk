import mongoose from "mongoose"

// Simple schema definition
const MemberSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  description: { type: String, required: true },
  avatar: { type: String, required: true },
  banner: { type: String },
  approved: { type: Boolean, default: false },
  date: { type: String, required: true },
  lastUpdated: { type: String, required: true },
  fingerprint: { type: String },
  rejected: { type: Boolean, default: false },
  rejectionDate: { type: String },
  social: {
    instagram: { type: String },
    twitter: { type: String },
    facebook: { type: String },
  },
  stats: {
    social: { type: Number, default: 5 },
    skillful: { type: Number, default: 5 },
    intelligence: { type: Number, default: 5 },
    administrative: { type: Number },
  },
})

// Export the model directly
export const Member = mongoose.models.Member || mongoose.model("Member", MemberSchema)
