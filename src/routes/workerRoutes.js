import express from 'express';
import { getOrders, getPieceById, upsertPieceDetail } from '../controllers/workerController.js';
import { upload } from '../middleware/upload.js';
import { upsertPieceDetailValidationSchema } from '../utils/validators/workerValidations.js';
import { validate } from '../middleware/validator.js';
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router();


router.get('/order', getOrders);
router.get('/piece', getPieceById);
router.post('/piece', [authenticateToken, upload, validate(upsertPieceDetailValidationSchema)], upsertPieceDetail);
router.get('/piece/:id', getPieceById);

export default router;
