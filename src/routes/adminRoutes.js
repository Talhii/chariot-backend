import express from 'express';
import { getOrder, getAllOrders, createOrder, getAllUsers, createUser, getUser, updateUser, deleteUser, getAllSections, createSection, updateSection, getSection, deleteSection, assignSectionToWorker, getFlaggedPieces, resolveFlaggedPiece, getPiecesGroupbySection, getAllPieces, deletePiece, deleteOrder, updateOrder, getDashboardData, createPiece, updatePiece, getPiece, getPieceProgress, generateOptions, verifyResponse } from '../controllers/adminController.js';
import { validate } from '../middleware/validator.js';
import { createUserValidationSchema, updateUserValidationSchema, createSectionValidationSchema, updateSectionValidationSchema } from '../utils/validators/adminValidations.js';
import { upload, uploadMultiple } from '../middleware/upload.js';
const router = express.Router();

router.get('/dashboard', getDashboardData)

router.get('/order', getAllOrders);
router.post('/order', uploadMultiple, createOrder);
router.put('/order/:id', uploadMultiple, updateOrder);
router.get('/order/:id', getOrder);
router.delete('/order/:id', deleteOrder);

router.get('/user', getAllUsers);
router.post('/user', [upload, validate(createUserValidationSchema)], createUser);
router.put('/user/:id/assign/:sectionId', assignSectionToWorker);
router.put('/user/:id', [upload, validate(updateUserValidationSchema)], updateUser);
router.get('/user/:id', getUser);
router.delete('/user/:id', deleteUser);

router.post('/user/webauthn/options', generateOptions);
router.post('/user/webauthn/verify', verifyResponse);

router.get('/section', getAllSections);
router.post('/section', validate(createSectionValidationSchema), createSection);
router.put('/section/:id', validate(updateSectionValidationSchema), updateSection);
router.get('/section/:id', getSection);
router.delete('/section/:id', deleteSection);

router.post('/piece', createPiece);
router.get('/piece', getAllPieces);
router.get('/piece/progress', getPieceProgress);
router.get('/piece/flagged', getFlaggedPieces);
router.put('/piece/:id/resolve', resolveFlaggedPiece);
router.get('/piece/count', getPiecesGroupbySection);
router.get('/piece/:id', getPiece);
router.put('/piece/:id', updatePiece);
router.delete('/piece/:id', deletePiece);

export default router;
