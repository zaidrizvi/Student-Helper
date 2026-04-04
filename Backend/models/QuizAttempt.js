const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  userAnswers: [{ questionIndex: Number, selectedAnswer: String }],
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  weakTopics: [String],
  completedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
