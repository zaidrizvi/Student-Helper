const mongoose = require('mongoose');

const userAnswerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    selectedAnswer: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    userAnswers: { type: [userAnswerSchema], default: [] },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    weakTopics: { type: [String], default: [] },
    completedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
