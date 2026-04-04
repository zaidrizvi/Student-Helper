const mongoose = require('mongoose');

const notesSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  extractedText: { type: String, required: true },
  summary: { type: String },shareToken: { type: String, unique: true, sparse: true },
  history: [{
    prompt: String,
    answer: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notes', notesSchema);
