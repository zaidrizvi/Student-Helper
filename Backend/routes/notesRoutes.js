const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } });
const {
  generateShareLink,
  getSharedNote,
  downloadExtractedNotesPdf,
  downloadSharedExtractedNotesPdf
} = require('../controllers/notesController');
const jwtAuth = require('../middlewares/jwtAuth');

const {
  uploadNotes,
  summarizeNotes,
  generateQuiz,
  submitQuizAttempt,
  getUserNotes,
  getUserQuizAttempts,
  getSingleNote,
  explainWeakTopics // <--- Added import here
} = require('../controllers/notesController');

// ALL routes require JWT authentication
router.post('/upload', jwtAuth, upload.single('file'), uploadNotes);
router.post('/summarize', jwtAuth, summarizeNotes);
router.post('/generate-quiz', jwtAuth, generateQuiz);
router.post('/submit-quiz', jwtAuth, submitQuizAttempt);
router.post('/explain-weak-topics', jwtAuth, explainWeakTopics); // <--- Added route here
router.post('/share', jwtAuth, generateShareLink);
router.get('/history', jwtAuth, getUserNotes);
router.get('/quiz-attempts', jwtAuth, getUserQuizAttempts);
router.get('/shared/:shareToken/download-pdf', downloadSharedExtractedNotesPdf);
router.get('/:noteId/download-pdf', jwtAuth, downloadExtractedNotesPdf);
router.get('/shared/:shareToken', getSharedNote);
router.get('/:noteId', jwtAuth, getSingleNote);

module.exports = router;
