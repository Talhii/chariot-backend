import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { logger } from './middleware/logger.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();

app.use(logger);
app.use(express.json());

connectDB();

app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
