import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, '../data');
if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath);

const filePath = path.join(dbPath, 'files.db');
export const db = new sqlite3.Database(filePath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      originalname TEXT,
      path TEXT,
      created_at INTEGER,
      last_downloaded INTEGER
    )
  `);
});
