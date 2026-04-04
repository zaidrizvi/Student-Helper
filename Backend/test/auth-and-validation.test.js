const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const {
  createAuthToken,
  getAuthTokenFromRequest,
  hashShareToken,
  normalizeEmail,
} = require("../utils/auth");
const { validateRegister } = require("../validators/authValidators");
const { validateGenerateQuizRequest, validateSubmitQuizRequest } = require("../validators/notesValidators");

test("normalizeEmail trims and lowercases email addresses", () => {
  assert.equal(normalizeEmail("  USER@Example.COM "), "user@example.com");
});

test("getAuthTokenFromRequest reads bearer and cookie tokens", () => {
  const bearerToken = getAuthTokenFromRequest({
    headers: { authorization: "Bearer abc123" },
  });
  assert.equal(bearerToken, "abc123");

  const cookieToken = getAuthTokenFromRequest({
    headers: { cookie: "foo=bar; studybot_session=session-token" },
  });
  assert.equal(cookieToken, "session-token");
});

test("createAuthToken signs a jwt containing user identity", () => {
  const token = createAuthToken({ _id: "507f1f77bcf86cd799439011", email: "a@example.com", tokenVersion: 0 });
  assert.equal(typeof token, "string");
  assert.ok(token.length > 20);
});

test("hashShareToken is deterministic and does not return raw token", () => {
  const token = "plain-share-token";
  assert.equal(hashShareToken(token), hashShareToken(token));
  assert.notEqual(hashShareToken(token), token);
});

test("validateRegister normalizes safe auth input", () => {
  const result = validateRegister({
    body: { name: " Jane Doe ", email: " Jane@Example.COM ", password: "password123" },
  });

  assert.deepEqual(result.body, {
    name: "Jane Doe",
    email: "jane@example.com",
    password: "password123",
  });
});

test("quiz validators reject invalid input", () => {
  assert.throws(() =>
    validateGenerateQuizRequest({ body: { notesId: "bad-id", numQuestions: 5 } })
  );

  assert.throws(() =>
    validateSubmitQuizRequest({
      body: {
        quizId: "507f1f77bcf86cd799439011",
        userAnswers: [{ questionIndex: -1, selectedAnswer: "A" }],
      },
    })
  );
});
