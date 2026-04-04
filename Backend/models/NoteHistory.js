const mongoose = require("mongoose");

const noteHistorySchema = new mongoose.Schema(
  {
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notes",
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    mode: {
      type: String,
      enum: ["short", "normal", "detailed", "ultra"],
      default: "normal",
    },
  },
  {
    timestamps: true,
  }
);

noteHistorySchema.index({ noteId: 1, createdAt: -1 });

module.exports = mongoose.model("NoteHistory", noteHistorySchema);
