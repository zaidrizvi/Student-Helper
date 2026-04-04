const crypto = require("crypto");
const mongoose = require("mongoose");
const Notes = require("../models/Notes");
const NoteHistory = require("../models/NoteHistory");
const HttpError = require("../utils/httpError");
const { hashShareToken } = require("../utils/auth");

function assertOwnership(doc, userId, missingMessage) {
  if (!doc) {
    throw new HttpError(404, missingMessage);
  }

  if (String(doc.userId) !== String(userId)) {
    throw new HttpError(403, "Access denied");
  }

  return doc;
}

async function findOwnedDocument(Model, id, userId, missingMessage) {
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(400, "Resource id is invalid");
  }

  const doc = await Model.findById(id);
  return assertOwnership(doc, userId, missingMessage);
}

function sanitizeQuizForClient(quiz) {
  return {
    quizId: quiz._id,
    notesId: quiz.notesId,
    createdAt: quiz.createdAt,
    questions: (quiz.questions || []).map((question, index) => ({
      id: `${quiz._id}:${index}`,
      question: question.question,
      options: question.options,
      topic: question.topic,
    })),
  };
}

async function createNoteHistoryEntry({ note, userId, prompt, answer, mode }) {
  const entry = await NoteHistory.create({
    noteId: note._id,
    userId,
    prompt: prompt || "",
    answer,
    mode,
  });

  note.summary = answer;
  note.latestHistoryAt = entry.createdAt;
  await note.save();

  return entry;
}

function normalizeHistoryEntry(entry) {
  return {
    _id: entry._id,
    prompt: entry.prompt || "",
    answer: entry.answer,
    mode: entry.mode || "normal",
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

async function getNoteHistory(noteId, limit = 20) {
  const historyDocs = await NoteHistory.find({ noteId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  if (historyDocs.length > 0) {
    return historyDocs.reverse().map(normalizeHistoryEntry);
  }

  const note = await Notes.findById(noteId).select("history").lean();
  return Array.isArray(note?.history)
    ? note.history.slice(-limit).map((entry) => ({
        prompt: entry.prompt || "",
        answer: entry.answer,
        createdAt: entry.createdAt,
      }))
    : [];
}

function createShareToken() {
  return crypto.randomBytes(24).toString("hex");
}

async function setShareState(note, expiresInDays) {
  const token = createShareToken();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  note.share = {
    tokenHash: hashShareToken(token),
    expiresAt,
    revokedAt: null,
    lastGeneratedAt: new Date(),
  };
  note.shareToken = undefined;
  await note.save();

  return {
    shareToken: token,
    expiresAt,
  };
}

function isShareActive(note) {
  if (!note?.share?.tokenHash) {
    return false;
  }

  if (note.share.revokedAt) {
    return false;
  }

  if (note.share.expiresAt && note.share.expiresAt.getTime() < Date.now()) {
    return false;
  }

  return true;
}

async function findSharedNoteByToken(rawToken) {
  const tokenHash = hashShareToken(rawToken);
  const note = await Notes.findOne({ "share.tokenHash": tokenHash });

  if (!note || !isShareActive(note)) {
    throw new HttpError(404, "Link expired or invalid");
  }

  return note;
}

async function buildPrivateNotePayload(note) {
  const history = await getNoteHistory(note._id, 30);
  const plain = note.toObject();

  delete plain.shareToken;
  delete plain.__v;

  return {
    ...plain,
    history,
    share: note.share
      ? {
          expiresAt: note.share.expiresAt,
          revokedAt: note.share.revokedAt,
          isActive: isShareActive(note),
        }
      : null,
  };
}

async function buildSharedNotePayload(note) {
  const history = await getNoteHistory(note._id, 1);
  const latestHistory = history[history.length - 1] || null;

  return {
    fileName: note.fileName,
    fileType: note.fileType,
    summary: note.summary || latestHistory?.answer || "",
    createdAt: note.createdAt,
    share: {
      expiresAt: note.share?.expiresAt || null,
    },
  };
}

module.exports = {
  buildPrivateNotePayload,
  buildSharedNotePayload,
  createNoteHistoryEntry,
  findOwnedDocument,
  findSharedNoteByToken,
  getNoteHistory,
  sanitizeQuizForClient,
  setShareState,
};
