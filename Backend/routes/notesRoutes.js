const path = require("path");
const express = require("express");
const multer = require("multer");

const router = express.Router();
const jwtAuth = require("../middlewares/jwtAuth");
const validateRequest = require("../middlewares/validateRequest");
const { createMemoryRateLimiter } = require("../middlewares/rateLimit");
const {
  downloadExtractedNotesPdf,
  downloadSharedExtractedNotesPdf,
  explainWeakTopics,
  generateQuiz,
  generateShareLink,
  getSharedNote,
  getSingleNote,
  getUserNotes,
  getUserQuizAttempts,
  revokeShareLink,
  submitQuizAttempt,
  summarizeNotes,
  uploadNotes,
} = require("../controllers/notesController");
const {
  validateGenerateQuizRequest,
  validateNoteIdParam,
  validateRevokeShareRequest,
  validateShareRequest,
  validateShareTokenParam,
  validateSubmitQuizRequest,
  validateSummaryRequest,
  validateWeakTopicsRequest,
} = require("../validators/notesValidators");
const HttpError = require("../utils/httpError");

const MAX_UPLOAD_SIZE = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".txt", ".jpg", ".jpeg", ".png", ".webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const isAllowedMime = ALLOWED_MIME_TYPES.has(file.mimetype);
    const isAllowedExtension = ALLOWED_EXTENSIONS.has(extension);

    if (!isAllowedMime || !isAllowedExtension) {
      return cb(
        new HttpError(
          400,
          "Unsupported file type. Please upload PDF, DOCX, TXT, JPG, PNG, or WEBP."
        )
      );
    }

    return cb(null, true);
  },
});

const aiRateLimit = createMemoryRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 25,
  keyGenerator: (req) => `${req.ip}:${req.auth?.userId || "anon"}:${req.path}`,
  message: "Too many AI requests. Please wait and try again.",
});

router.post("/upload", jwtAuth, upload.single("file"), uploadNotes);
router.post("/summarize", jwtAuth, aiRateLimit, validateRequest(validateSummaryRequest), summarizeNotes);
router.post("/generate-quiz", jwtAuth, aiRateLimit, validateRequest(validateGenerateQuizRequest), generateQuiz);
router.post("/submit-quiz", jwtAuth, validateRequest(validateSubmitQuizRequest), submitQuizAttempt);
router.post("/explain-weak-topics", jwtAuth, aiRateLimit, validateRequest(validateWeakTopicsRequest), explainWeakTopics);
router.post("/share", jwtAuth, validateRequest(validateShareRequest), generateShareLink);
router.post("/share/revoke", jwtAuth, validateRequest(validateRevokeShareRequest), revokeShareLink);
router.get("/history", jwtAuth, getUserNotes);
router.get("/quiz-attempts", jwtAuth, getUserQuizAttempts);
router.get("/shared/:shareToken/download-pdf", validateRequest(validateShareTokenParam), downloadSharedExtractedNotesPdf);
router.get("/shared/:shareToken", validateRequest(validateShareTokenParam), getSharedNote);
router.get("/:noteId/download-pdf", jwtAuth, validateRequest(validateNoteIdParam), downloadExtractedNotesPdf);
router.get("/:noteId", jwtAuth, validateRequest(validateNoteIdParam), getSingleNote);

module.exports = router;
