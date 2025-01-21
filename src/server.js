import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { logger } from './middleware/logger.js';
import workerRoutes from './routes/workerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import commonRoutes from './routes/commonRoutes.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

app.use(cors());

app.use(logger);
app.use(express.json());

connectDB();

app.use('/api/worker', workerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', commonRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
