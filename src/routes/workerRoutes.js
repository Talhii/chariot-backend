import express from 'express';
import { getPieceById, updatePieceHistory } from '../controllers/workerController.js';
import upload from '../middleware/upload.js';
import { updatePieceHistoryValidationSchema } from '../utils/validators/workerValidations.js';
import { validate } from '../middleware/validator.js';
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router();

router.get('/piece/:id', getPieceById);
router.put('/piece/:id', [authenticateToken, upload, validate(updatePieceHistoryValidationSchema)], updatePieceHistory);

export default router;
