import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';

const router = Router();
const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const id = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, id + ext);
  }
});

const upload = multer({ storage });

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не найден' });
  }
  const id = path.parse(req.file.filename).name;
  const filePath = req.file.path;
  const now = Date.now();
  db.run(
    'INSERT INTO files (id, originalname, path, created_at, last_downloaded) VALUES (?, ?, ?, ?, ?)',
    [id, req.file.originalname, filePath, now, now],
    err => {
      if (err) {
        console.error('DB insert error:', err);
        return res.status(500).json({ error: 'Ошибка базы данных' });
      }
      res.json({
        link: `http://localhost:4000/api/download/${id}`
      });
    }
  );
});

router.get('/download/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM files WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
    if (!row) return res.status(404).json({ error: 'Файл не найден' });
    db.run('UPDATE files SET last_downloaded = ? WHERE id = ?', [Date.now(), id]);
    res.download(row.path, row.originalname, downloadErr => {
      if (downloadErr) console.error('Ошибка скачивания:', downloadErr);
    });
  });
});

router.get('/stats', (req, res) => {
  db.all(
    `SELECT 
      id, 
      originalname, 
      created_at, 
      last_downloaded 
     FROM files 
     ORDER BY created_at DESC`,
    (err, rows) => {
      if (err) {
        console.error('DB select error:', err);
        return res.status(500).json({ error: 'Ошибка базы данных' });
      }
      const files = rows.map(row => ({
        id: row.id,
        name: row.originalname,
        createdAt: row.created_at,
        lastDownloaded: row.last_downloaded,
        downloadLink: `http://localhost:4000/api/download/${row.id}`
      }));
      res.json(files);
    }
  );
});

export default router;