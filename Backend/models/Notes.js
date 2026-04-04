const mongoose = require('mongoose');

const legacyHistorySchema = new mongoose.Schema(
  {
    prompt: { type: String, trim: true, maxlength: 2000 },
    answer: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const shareSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, index: true, sparse: true },
    expiresAt: { type: Date },
    revokedAt: { type: Date, default: null },
    lastGeneratedAt: { type: Date, default: null },
  },
  { _id: false }
);

const notesSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    fileName: { type: String, required: true, trim: true, maxlength: 255 },
    fileType: { type: String, required: true, trim: true, maxlength: 120 },
    extractedText: { type: String, required: true },
    summary: { type: String, default: "" },
    latestHistoryAt: { type: Date, default: null },
    share: { type: shareSchema, default: null },
    shareToken: { type: String, unique: true, sparse: true },
    history: { type: [legacyHistorySchema], default: [] },
  },
  {
    timestamps: true,
  }
);

notesSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notes', notesSchema);
