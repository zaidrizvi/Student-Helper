const mongoose = require("mongoose");
const HttpError = require("../utils/httpError");

const ALLOWED_SUMMARY_MODES = new Set(["short", "normal", "detailed", "ultra"]);

function validateObjectId(value, fieldName) {
  const normalized = String(value || "").trim();
  if (!mongoose.isValidObjectId(normalized)) {
    throw new HttpError(400, `${fieldName} is invalid`);
  }
  return normalized;
}

function validatePrompt(prompt, { required = false, maxLength = 2000 } = {}) {
  const value = String(prompt || "").trim();
  if (required && !value) {
    throw new HttpError(400, "Prompt is required");
  }

  if (value.length > maxLength) {
    throw new HttpError(400, `Prompt must be ${maxLength} characters or less`);
  }

  return value;
}

function validateSummaryRequest(req) {
  const notesId = req.body?.notesId ? validateObjectId(req.body.notesId, "notesId") : null;
  const prompt = validatePrompt(req.body?.prompt);
  const mode = String(req.body?.mode || "normal").trim().toLowerCase();

  if (!ALLOWED_SUMMARY_MODES.has(mode)) {
    throw new HttpError(400, "mode must be one of short, normal, detailed, or ultra");
  }

  return {
    body: {
      notesId,
      prompt,
      mode,
    },
  };
}

function validateGenerateQuizRequest(req) {
  const notesId = validateObjectId(req.body?.notesId, "notesId");
  const numQuestions = Number.parseInt(req.body?.numQuestions, 10);
  const normalized = Number.isFinite(numQuestions) ? numQuestions : 5;

  if (normalized < 1 || normalized > 10) {
    throw new HttpError(400, "numQuestions must be between 1 and 10");
  }

  return {
    body: {
      notesId,
      numQuestions: normalized,
    },
  };
}

function validateSubmitQuizRequest(req) {
  const quizId = validateObjectId(req.body?.quizId, "quizId");
  const userAnswers = req.body?.userAnswers;

  if (!Array.isArray(userAnswers) || userAnswers.length === 0) {
    throw new HttpError(400, "userAnswers must be a non-empty array");
  }

  const normalizedAnswers = userAnswers.map((answer, index) => {
    const questionIndex = Number.parseInt(answer?.questionIndex, 10);
    const selectedAnswer = String(answer?.selectedAnswer || "").trim();

    if (!Number.isInteger(questionIndex) || questionIndex < 0) {
      throw new HttpError(400, `userAnswers[${index}].questionIndex is invalid`);
    }

    if (!selectedAnswer || selectedAnswer.length > 300) {
      throw new HttpError(400, `userAnswers[${index}].selectedAnswer is invalid`);
    }

    return {
      questionIndex,
      selectedAnswer,
    };
  });

  return {
    body: {
      quizId,
      userAnswers: normalizedAnswers,
    },
  };
}

function validateWeakTopicsRequest(req) {
  const notesId = validateObjectId(req.body?.notesId, "notesId");
  const weakTopics = req.body?.weakTopics;

  if (!Array.isArray(weakTopics) || weakTopics.length === 0) {
    throw new HttpError(400, "weakTopics must be a non-empty array");
  }

  const normalizedTopics = weakTopics
    .map((topic) => String(topic || "").trim())
    .filter(Boolean)
    .slice(0, 5);

  if (normalizedTopics.length === 0) {
    throw new HttpError(400, "weakTopics must contain at least one topic");
  }

  return {
    body: {
      notesId,
      weakTopics: [...new Set(normalizedTopics)],
    },
  };
}

function validateShareRequest(req) {
  const noteId = validateObjectId(req.body?.noteId, "noteId");
  const expiresInDays = Number.parseInt(req.body?.expiresInDays, 10);
  const normalizedExpiry = Number.isFinite(expiresInDays) ? expiresInDays : 7;

  if (normalizedExpiry < 1 || normalizedExpiry > 30) {
    throw new HttpError(400, "expiresInDays must be between 1 and 30");
  }

  return {
    body: {
      noteId,
      expiresInDays: normalizedExpiry,
    },
  };
}

function validateRevokeShareRequest(req) {
  return {
    body: {
      noteId: validateObjectId(req.body?.noteId, "noteId"),
    },
  };
}

function validateNoteIdParam(req) {
  return {
    params: {
      noteId: validateObjectId(req.params?.noteId, "noteId"),
    },
  };
}

function validateShareTokenParam(req) {
  const shareToken = String(req.params?.shareToken || "").trim();

  if (!shareToken || shareToken.length < 20 || shareToken.length > 200) {
    throw new HttpError(400, "shareToken is invalid");
  }

  return {
    params: {
      shareToken,
    },
  };
}

module.exports = {
  validateGenerateQuizRequest,
  validateNoteIdParam,
  validateRevokeShareRequest,
  validateShareRequest,
  validateShareTokenParam,
  validateSubmitQuizRequest,
  validateSummaryRequest,
  validateWeakTopicsRequest,
};
