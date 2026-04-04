require("dotenv").config();
const mongoose = require("mongoose");
const Notes = require("./models/Notes");
const NoteHistory = require("./models/NoteHistory");

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const notes = await Notes.find({ "history.0": { $exists: true } });
  let migratedCount = 0;

  for (const note of notes) {
    const historyEntries = (note.history || [])
      .filter((entry) => entry?.answer)
      .map((entry) => ({
        noteId: note._id,
        userId: note.userId,
        prompt: entry.prompt || "",
        answer: entry.answer,
        mode: "normal",
        createdAt: entry.createdAt || note.updatedAt || note.createdAt,
        updatedAt: entry.createdAt || note.updatedAt || note.createdAt,
      }));

    for (const entry of historyEntries) {
      await NoteHistory.updateOne(
        {
          noteId: entry.noteId,
          userId: entry.userId,
          prompt: entry.prompt,
          answer: entry.answer,
          createdAt: entry.createdAt,
        },
        {
          $setOnInsert: entry,
        },
        { upsert: true }
      );
    }

    note.latestHistoryAt =
      historyEntries[historyEntries.length - 1]?.createdAt || note.latestHistoryAt || null;
    note.history = [];
    await note.save();

    migratedCount += 1;
    console.log(`Migrated ${note._id} (${note.fileName})`);
  }

  console.log(`Done. Migrated ${migratedCount} notes.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed", err);
  process.exit(1);
});
