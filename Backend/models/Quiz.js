const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  notesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notes', required: true },
  questions: [{
    question: String,
    options: [String],
    answer: String,
    topic: String
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema);
