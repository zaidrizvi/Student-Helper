const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: { type: [String], required: true, validate: [(value) => value.length >= 2, "At least two options are required"] },
    answer: { type: String, required: true, trim: true },
    topic: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    notesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notes', required: true, index: true },
    questions: { type: [questionSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Quiz', quizSchema);
