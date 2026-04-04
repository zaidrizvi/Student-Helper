const test = require("node:test");
const assert = require("node:assert/strict");

const { sanitizeQuizForClient } = require("../services/notesService");

test("sanitizeQuizForClient strips correct answers from quiz payloads", () => {
  const result = sanitizeQuizForClient({
    _id: "quiz123",
    notesId: "note123",
    createdAt: new Date("2026-04-04T10:00:00.000Z"),
    questions: [
      {
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        answer: "4",
        topic: "Arithmetic",
      },
    ],
  });

  assert.equal(result.questions[0].question, "What is 2 + 2?");
  assert.deepEqual(result.questions[0].options, ["3", "4", "5", "6"]);
  assert.equal(result.questions[0].topic, "Arithmetic");
  assert.equal(Object.prototype.hasOwnProperty.call(result.questions[0], "answer"), false);
});
