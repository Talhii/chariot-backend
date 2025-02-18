import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { logger } from './middleware/logger.js';
import workerRoutes from './routes/workerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import commonRoutes from './routes/commonRoutes.js';
import bodyParser from 'body-parser';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticateToken } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

const corsOptions = {
  origin: ['https://main.dcjme3n2fmske.amplifyapp.com/', 'http://localhost:3000', 'http://192.168.100.114:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(logger);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

connectDB().catch((error) => {
  console.error('Error connecting to database:', error);
  process.exit(1);
});

app.use('/api/worker', authenticateToken, workerRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api', commonRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});