const mongoose = require('mongoose');
const Notes = require('./models/Notes');
require('dotenv').config();

async function migrateOldSummaries() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all notes that have a summary but empty or missing history
    const notes = await Notes.find({
      summary: { $exists: true, $ne: null, $ne: "" },
    });

    console.log(`📋 Found ${notes.length} notes with summaries`);

    let migratedCount = 0;

    for (const note of notes) {
      // Only migrate if history is empty or doesn't exist
      if (!note.history || note.history.length === 0) {
        note.history = [{
          prompt: "(Original answer - no custom prompt recorded)",
          answer: note.summary,
          createdAt: note.createdAt || new Date()
        }];
        await note.save();
        console.log(`✅ Migrated: ${note.fileName}`);
        migratedCount++;
      } else {
        console.log(`⏭️  Skipped (already has history): ${note.fileName}`);
      }
    }

    console.log(`\n🎉 Migration complete! ${migratedCount} notes migrated.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  }
}

migrateOldSummaries();
