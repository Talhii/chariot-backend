import express from 'express';
import { login } from '../controllers/commonController.js';
import { validate } from '../middleware/validator.js';
import { loginUserValidationSchema } from '../utils/validators/commonValidations.js';

const router = express.Router();

router.post('/login', validate(loginUserValidationSchema), login);

export default router;