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
import formidable from 'express-formidable';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// Define a more restrictive CORS policy if needed (example)
const corsOptions = {
  origin: ['http://localhost:3000', 'http://192.168.100.110:3000'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(logger);
app.use(express.json()); // Parse JSON request bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(formidable()); // Parse form data

// Connect to the database
connectDB().catch((error) => {
  console.error('Error connecting to database:', error);
  process.exit(1); 
}); 

app.use('/api/worker', workerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', commonRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});