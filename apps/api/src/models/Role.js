import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    permissions: [{ type: String }],
    level: { type: Number, required: true, default: 0 },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Role = mongoose.model('Role', roleSchema);
