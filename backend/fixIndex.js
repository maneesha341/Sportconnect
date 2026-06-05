// Run this file ONCE to drop the bad geo index
// Command: node fixIndex.js

const mongoose = require('mongoose');
require('dotenv').config();

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  const db = mongoose.connection.db;
  const collection = db.collection('trainers');

  // List all indexes
  const indexes = await collection.indexes();
  console.log('Current indexes:', indexes.map(i => i.name));

  // Drop any geo index on location
  for (const idx of indexes) {
    if (idx.name !== '_id_') {
      try {
        await collection.dropIndex(idx.name);
        console.log(`Dropped index: ${idx.name}`);
      } catch (e) {
        console.log(`Could not drop ${idx.name}:`, e.message);
      }
    }
  }

  console.log('Done! All non-_id indexes dropped.');
  process.exit(0);
}

fix().catch(err => { console.error(err); process.exit(1); });