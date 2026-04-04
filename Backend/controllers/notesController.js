const Notes = require("../models/Notes");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const fileParser = require("../services/fileParser");
const geminiService = require("../services/geminiService");
const crypto = require("crypto");
const { buildExtractedNotesPdf } = require("../services/notePdfService");

// -----------------------------
// Helper: validate ownership
// -----------------------------
async function validateOwnership(Model, id, userId) {
  // Basic Mongo ID check
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) return { error: "INVALID_ID" };

  const doc = await Model.findById(id);

  if (!doc) return { error: "NOT_FOUND" };

  if (String(doc.userId) !== String(userId)) {
    return { error: "UNAUTHORIZED" };
  }

  return { doc };
}

// -----------------------------
// Upload Notes
// -----------------------------
exports.uploadNotes = async (req, res, next) => {
  try {
    const userId = String(req.auth.userId);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const extractedText = await fileParser.parseFile(req.file);

    // FIX 1: Added .trim() to ensure we don't save files that are just whitespace
    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({
        error:
          "Could not extract enough text. The file might be empty, scanned image-only, or too short.",
      });
    }

    const notes = await Notes.create({
      userId,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      extractedText,
      history: [],
    });

    res.json({
      success: true,
      notesId: notes._id,
      fileName: req.file.originalname,
      message: "File processed successfully",
    });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Summarize Notes
// -----------------------------
exports.summarizeNotes = async (req, res, next) => {
  try {
    let { notesId, prompt = "", mode = "normal" } = req.body;
    const userId = String(req.auth.userId);

    const validModes = ["short", "normal", "detailed", "ultra"];
    const selectedMode = validModes.includes(mode) ? mode : "normal";

    let notes;

    // Logic Branch:
    if (notesId) {
      // A. If ID exists, use existing file context
      const { doc, error } = await validateOwnership(Notes, notesId, userId);
      if (error)
        return res
          .status(error === "UNAUTHORIZED" ? 403 : 404)
          .json({ error: "Access denied or Note not found" });
      notes = doc;
    } else {
      // B. If NO ID, create a "General Conversation" note
      notes = await Notes.create({
        userId,
        fileName: "AI Conversation",
        fileType: "text/plain",
        extractedText: "", // Empty context
        history: [],
      });
    }

    // Handling empty text context for general chat to prevent AI confusion
    const textContext = notes.extractedText
      ? notes.extractedText
      : "General knowledge request.";

    const summary = await geminiService.summarize(
      textContext,
      prompt,
      selectedMode
    );

    // FIX 2: Check if summary is actually returned
    if (!summary) {
      throw new Error("AI generated an empty response. Please try again.");
    }

    notes.history.push({
  prompt: prompt || `Generated ${selectedMode} summary`,
  answer: summary,
  createdAt: new Date(),
});

notes.summary = summary;  // <-- THIS WAS MISSING

await notes.save();

    res.json({ success: true, summary, notesId: notes._id });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Generate Quiz
// -----------------------------
exports.generateQuiz = async (req, res, next) => {
  try {
    let { notesId, numQuestions = 5 } = req.body;
    const userId = String(req.auth.userId);

    if (numQuestions > 20) numQuestions = 20;
    if (numQuestions < 1) numQuestions = 5;

    const { doc: notes, error } = await validateOwnership(
      Notes,
      notesId,
      userId
    );

    if (error)
      return res
        .status(error === "UNAUTHORIZED" ? 403 : 404)
        .json({ error: "Access denied or Note not found" });

    const questions = await geminiService.generateQuiz(
      notes.extractedText,
      numQuestions
    );

    const quiz = await Quiz.create({
      userId,
      notesId: notes._id,
      questions,
    });

    res.json({ success: true, quizId: quiz._id, questions: quiz.questions });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Submit Quiz Attempt
// -----------------------------
exports.submitQuizAttempt = async (req, res, next) => {
  try {
    const { quizId, userAnswers } = req.body;
    const userId = String(req.auth.userId);

    const { doc: quiz, error } = await validateOwnership(Quiz, quizId, userId);

    if (error)
      return res
        .status(error === "UNAUTHORIZED" ? 403 : 404)
        .json({ error: "Access denied or Quiz not found" });

    let score = 0;
    let weakTopics = [];

    quiz.questions.forEach((q, idx) => {
      const ans = userAnswers.find((a) => a.questionIndex === idx);

      // FIX 3: Robust Answer Comparison
      // We compare strings by trimming whitespace and lowercasing to avoid "False Negatives"
      if (ans && ans.selectedAnswer) {
        const cleanUserAnswer = String(ans.selectedAnswer).trim().toLowerCase();
        const cleanCorrectAnswer = String(q.answer).trim().toLowerCase();

        if (cleanUserAnswer === cleanCorrectAnswer) {
          score++;
        } else {
          if (q.topic) weakTopics.push(q.topic);
        }
      } else {
        // If no answer provided or found, mark wrong
        if (q.topic) weakTopics.push(q.topic);
      }
    });

    const attempt = await QuizAttempt.create({
      userId,
      quizId,
      userAnswers,
      score,
      totalQuestions: quiz.questions.length,
      weakTopics: [...new Set(weakTopics)], // Deduplicate topics
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

// -----------------------------
// Explain Weak Topics
// -----------------------------
exports.explainWeakTopics = async (req, res, next) => {
  try {
    const { notesId, weakTopics } = req.body;
    const userId = String(req.auth.userId);

    if (!weakTopics || !Array.isArray(weakTopics))
      return res.status(400).json({ error: "weakTopics array is required" });

    const { doc: notes, error } = await validateOwnership(
      Notes,
      notesId,
      userId
    );

    if (error)
      return res
        .status(error === "UNAUTHORIZED" ? 403 : 404)
        .json({ error: "Access denied or Note not found" });

    const explanations = await geminiService.explainWeakTopics(
      notes.extractedText,
      weakTopics
    );

    res.json({ success: true, explanations });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Generate Share Link
// -----------------------------
exports.generateShareLink = async (req, res, next) => {
  try {
    const { noteId } = req.body;
    const userId = String(req.auth.userId);

    const { doc: note, error } = await validateOwnership(Notes, noteId, userId);

    if (error) return res.status(403).json({ error: "Unauthorized" });

    // If already shared, return existing token
    if (note.shareToken) {
      return res.json({ success: true, shareToken: note.shareToken });
    }

    // Generate new random token
    const token = crypto.randomBytes(16).toString("hex");
    note.shareToken = token;
    await note.save();

    res.json({ success: true, shareToken: token });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Get Shared Note (PUBLIC)
// -----------------------------
exports.getSharedNote = async (req, res, next) => {
  try {
    const { shareToken } = req.params;

    // Find note by token
    const note = await Notes.findOne({ shareToken });

    if (!note) {
      return res.status(404).json({ error: "Link expired or invalid" });
    }

    // Return only safe data
    res.json({
      success: true,
      note: {
        fileName: note.fileName,
        fileType: note.fileType,
        extractedText: note.extractedText,
        summary: note.summary,
        history: note.history,
        createdAt: note.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Download Extracted Notes PDF (PRIVATE)
// -----------------------------
exports.downloadExtractedNotesPdf = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const userId = String(req.auth.userId);

    const { doc: note, error } = await validateOwnership(Notes, noteId, userId);

    if (error)
      return res
        .status(error === "UNAUTHORIZED" ? 403 : 404)
        .json({ error: "Access denied or Note not found" });

    const { pdfBytes, downloadName } = await buildExtractedNotesPdf(note);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Download Extracted Notes PDF (PUBLIC SHARE)
// -----------------------------
exports.downloadSharedExtractedNotesPdf = async (req, res, next) => {
  try {
    const { shareToken } = req.params;
    const note = await Notes.findOne({ shareToken });

    if (!note) {
      return res.status(404).json({ error: "Link expired or invalid" });
    }

    const { pdfBytes, downloadName } = await buildExtractedNotesPdf(note);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Get User Notes (DASHBOARD LIST)
// -----------------------------
exports.getUserNotes = async (req, res, next) => {
  try {
    const userId = String(req.auth.userId);

    // OPTIMIZATION: Exclude 'extractedText' and 'history'.
    const notes = await Notes.find({ userId })
      .select("fileName fileType createdAt updatedAt summary")
      .sort({ createdAt: -1 })
      .limit(120);

    res.json({ success: true, notes });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Get User Quiz Attempts
// -----------------------------
exports.getUserQuizAttempts = async (req, res, next) => {
  try {
    const userId = String(req.auth.userId);

    const attempts = await QuizAttempt.find({ userId })
      .populate("quizId", "questions")
      .sort({ completedAt: -1 })
      .limit(20);

    res.json({ success: true, attempts });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Get Single Note (FULL VIEW)
// -----------------------------
exports.getSingleNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const userId = String(req.auth.userId);

    const { doc: note, error } = await validateOwnership(Notes, noteId, userId);

    if (error)
      return res
        .status(error === "UNAUTHORIZED" ? 403 : 404)
        .json({ error: "Access denied or Note not found" });

    res.json({ success: true, note });
  } catch (err) {
    next(err);
  }
};
