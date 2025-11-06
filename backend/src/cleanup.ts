import fs from 'fs';
import path from 'path';
import { db } from './db';

const UPLOAD_DIR = path.join(__dirname, '../uploads');
const MAX_DAYS = 7;

export function cleanupOnce() {
  const cutoff = Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000;

  db.all('SELECT * FROM files WHERE last_downloaded < ?', [cutoff], (err, rows) => {
    if (err) return console.error(err);
    for (const row of rows) {
      try {
        fs.unlinkSync(row.path);
        db.run('DELETE FROM files WHERE id = ?', [row.id]);
        console.log(`Удалён старый файл: ${row.originalname}`);
      } catch (e) {
        console.error(`Ошибка удаления ${row.path}:`, e);
      }
    }
  });
}

export function startCleanupJob() {
  cleanupOnce();
  setInterval(cleanupOnce, 24 * 60 * 60 * 1000);
}
