const Notes = require("../models/Notes");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const fileParser = require("../services/fileParser");
const geminiService = require("../services/geminiService");
const { buildExtractedNotesPdf } = require("../services/notePdfService");
const HttpError = require("../utils/httpError");
const {
  buildPrivateNotePayload,
  buildSharedNotePayload,
  createNoteHistoryEntry,
  findOwnedDocument,
  findSharedNoteByToken,
  getNoteHistory,
  sanitizeQuizForClient,
  setShareState,
} = require("../services/notesService");

function sanitizeFileName(name = "note") {
  return String(name || "note")
    .replace(/[^\w.\-()\s]/g, "")
    .trim()
    .slice(0, 255) || "note";
}

function compareAnswers(left, right) {
  return (
    String(left || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ") ===
    String(right || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
  );
}

exports.uploadNotes = async (req, res, next) => {
  try {
    const userId = String(req.auth.userId);

    if (!req.file) {
      throw new HttpError(400, "No file uploaded");
    }

    const extractedText = await fileParser.parseFile(req.file);

    if (!extractedText || extractedText.trim().length < 50) {
      throw new HttpError(
        400,
        "Could not extract enough text. The file might be empty, image-only, or too short."
      );
    }

    const notes = await Notes.create({
      userId,
      fileName: sanitizeFileName(req.file.originalname),
      fileType: req.file.mimetype,
      extractedText,
      summary: "",
    });

    res.json({
      success: true,
      notesId: notes._id,
      fileName: notes.fileName,
      message: "File processed successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.summarizeNotes = async (req, res, next) => {
  try {
    const { notesId, prompt = "", mode = "normal" } = req.validated?.body || req.body;
    const userId = String(req.auth.userId);

    let note;
    if (notesId) {
      note = await findOwnedDocument(Notes, notesId, userId, "Note not found");
    } else {
      note = await Notes.create({
        userId,
        fileName: "AI Conversation",
        fileType: "text/plain",
        extractedText: "General study assistance request.",
        summary: "",
      });
    }

    const summary = await geminiService.summarize(note.extractedText, prompt, mode);
    if (!summary || !String(summary).trim()) {
      throw new HttpError(502, "AI generated an empty response. Please try again.");
    }

    await createNoteHistoryEntry({
      note,
      userId,
      prompt: prompt || `Generated ${mode} summary`,
      answer: String(summary).trim(),
      mode,
    });

    res.json({
      success: true,
      summary: String(summary).trim(),
      notesId: note._id,
    });
  } catch (err) {
    next(err);
  }
};

exports.generateQuiz = async (req, res, next) => {
  try {
    const { notesId, numQuestions } = req.validated?.body || req.body;
    const userId = String(req.auth.userId);

    const note = await findOwnedDocument(Notes, notesId, userId, "Note not found");
    const questions = await geminiService.generateQuiz(note.extractedText, numQuestions);

    const quiz = await Quiz.create({
      userId,
      notesId: note._id,
      questions,
    });

    res.json({
      success: true,
      ...sanitizeQuizForClient(quiz),
    });
  } catch (err) {
    next(err);
  }
};

exports.submitQuizAttempt = async (req, res, next) => {
  try {
    const { quizId, userAnswers } = req.validated?.body || req.body;
    const userId = String(req.auth.userId);

    const quiz = await findOwnedDocument(Quiz, quizId, userId, "Quiz not found");
    const answerMap = new Map();

    for (const answer of userAnswers) {
      if (answer.questionIndex >= quiz.questions.length) {
        throw new HttpError(400, "userAnswers contains an out-of-range questionIndex");
      }

      if (answerMap.has(answer.questionIndex)) {
        throw new HttpError(400, "Duplicate question answers are not allowed");
      }

      answerMap.set(answer.questionIndex, answer.selectedAnswer);
    }

    let score = 0;
    const weakTopics = [];

    quiz.questions.forEach((question, index) => {
      const selectedAnswer = answerMap.get(index);
      if (selectedAnswer && compareAnswers(selectedAnswer, question.answer)) {
        score += 1;
        return;
      }

      if (question.topic) {
        weakTopics.push(question.topic);
      }
    });

    const attempt = await QuizAttempt.create({
      userId,
      quizId,
      userAnswers,
      score,
      totalQuestions: quiz.questions.length,
      weakTopics: [...new Set(weakTopics)],
      completedAt: new Date(),
    });

    res.json({
      success: true,
      attemptId: attempt._id,
      score,
      totalQuestions: quiz.questions.length,
      percentage: Math.round((score / quiz.questions.length) * 100),
      weakTopics: attempt.weakTopics,
    });
  } catch (err) {
    next(err);
  }
};

exports.explainWeakTopics = async (req, res, next) => {
  try {
    const { notesId, weakTopics } = req.validated?.body || req.body;
    const userId = String(req.auth.userId);

    const note = await findOwnedDocument(Notes, notesId, userId, "Note not found");
    const explanations = await geminiService.explainWeakTopics(note.extractedText, weakTopics);

    res.json({ success: true, explanations });
  } catch (err) {
    next(err);
  }
};

exports.generateShareLink = async (req, res, next) => {
  try {
    const { noteId, expiresInDays } = req.validated?.body || req.body;
    const userId = String(req.auth.userId);

    const note = await findOwnedDocument(Notes, noteId, userId, "Note not found");
    const history = await getNoteHistory(note._id, 1);

    if (!note.summary && history.length === 0) {
      throw new HttpError(400, "Generate an AI summary before sharing this note");
    }

    const { shareToken, expiresAt } = await setShareState(note, expiresInDays);

    res.json({
      success: true,
      shareToken,
      expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

exports.revokeShareLink = async (req, res, next) => {
  try {
    const { noteId } = req.validated?.body || req.body;
    const userId = String(req.auth.userId);

    const note = await findOwnedDocument(Notes, noteId, userId, "Note not found");

    note.share = note.share
      ? {
          ...note.share,
          revokedAt: new Date(),
        }
      : {
          revokedAt: new Date(),
        };
    note.shareToken = undefined;
    await note.save();

    res.json({
      success: true,
      message: "Share link revoked",
    });
  } catch (err) {
    next(err);
  }
};

exports.getSharedNote = async (req, res, next) => {
  try {
    const { shareToken } = req.validated?.params || req.params;
    const note = await findSharedNoteByToken(shareToken);
    const payload = await buildSharedNotePayload(note);

    res.json({
      success: true,
      note: payload,
    });
  } catch (err) {
    next(err);
  }
};

exports.downloadExtractedNotesPdf = async (req, res, next) => {
  try {
    const { noteId } = req.validated?.params || req.params;
    const userId = String(req.auth.userId);

    const note = await findOwnedDocument(Notes, noteId, userId, "Note not found");
    const history = await getNoteHistory(note._id, 1);
    const pdfNote = {
      ...note.toObject(),
      history,
    };

    const { pdfBytes, downloadName } = await buildExtractedNotesPdf(pdfNote);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    next(err);
  }
};

exports.downloadSharedExtractedNotesPdf = async (req, res, next) => {
  try {
    const { shareToken } = req.validated?.params || req.params;
    const note = await findSharedNoteByToken(shareToken);
    const history = await getNoteHistory(note._id, 1);
    const pdfNote = {
      ...note.toObject(),
      history,
    };

    const { pdfBytes, downloadName } = await buildExtractedNotesPdf(pdfNote);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    next(err);
  }
};

exports.getUserNotes = async (req, res, next) => {
  try {
    const userId = String(req.auth.userId);

    const notes = await Notes.find({ userId })
      .select("fileName fileType createdAt updatedAt summary latestHistoryAt share.expiresAt share.revokedAt")
      .sort({ updatedAt: -1 })
      .limit(120)
      .lean();

    res.json({ success: true, notes });
  } catch (err) {
    next(err);
  }
};

exports.getUserQuizAttempts = async (req, res, next) => {
  try {
    const userId = String(req.auth.userId);

    const attempts = await QuizAttempt.find({ userId })
      .select("quizId score totalQuestions weakTopics completedAt createdAt")
      .sort({ completedAt: -1 })
      .limit(20)
      .lean();

    res.json({ success: true, attempts });
  } catch (err) {
    next(err);
  }
};

exports.getSingleNote = async (req, res, next) => {
  try {
    const { noteId } = req.validated?.params || req.params;
    const userId = String(req.auth.userId);

    const note = await findOwnedDocument(Notes, noteId, userId, "Note not found");
    const payload = await buildPrivateNotePayload(note);

    res.json({ success: true, note: payload });
  } catch (err) {
    next(err);
  }
};
