import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { startCleanupJob } from './cleanup';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

startCleanupJob();
