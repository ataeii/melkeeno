// Dumps every collection of the production MongoDB to gzipped Extended-JSON lines
// (one document per line, types preserved: ObjectId, Date...). No mongodump on the server,
// so this uses the project's own driver. Usage: MONGODB_URI=... node scripts/backup_mongo.js OUT_DIR
// Restore one collection: zcat OUT_DIR/<name>.jsonl.gz | node -e (EJSON.parse each line -> insertMany)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { MongoClient } = require('mongodb');
const { EJSON } = require('bson');

const out = process.argv[2];
if (!out || !process.env.MONGODB_URI) {
  console.error('usage: MONGODB_URI=... node backup_mongo.js OUT_DIR');
  process.exit(1);
}

(async () => {
  fs.mkdirSync(out, { recursive: true, mode: 0o700 });
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const cols = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name).filter((n) => !n.startsWith('system.'));
  const summary = { db: db.databaseName, at: new Date().toISOString(), collections: {} };
  for (const name of cols) {
    const gz = zlib.createGzip();
    const ws = fs.createWriteStream(path.join(out, `${name}.jsonl.gz`), { mode: 0o600 });
    gz.pipe(ws);
    let n = 0;
    for await (const doc of db.collection(name).find({})) {
      if (!gz.write(EJSON.stringify(doc, { relaxed: false }) + '\n')) await new Promise((r) => gz.once('drain', r));
      n++;
    }
    gz.end();
    await new Promise((r) => ws.on('finish', r));
    let indexes = [];
    try { indexes = await db.collection(name).indexes(); } catch {}
    summary.collections[name] = { docs: n, indexes: indexes.length };
    console.log(`${name}: ${n}`);
  }
  fs.writeFileSync(path.join(out, 'SUMMARY.json'), JSON.stringify(summary, null, 2), { mode: 0o600 });
  await client.close();
})().catch((e) => { console.error('BACKUP FAILED:', e.message); process.exit(1); });
