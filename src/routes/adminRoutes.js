import express from 'express';
import { getOrder, getAllOrders, createOrder, getAllUsers, createUser, getUser, updateUser, deleteUser, getAllStages, createStage, updateStage, getStage, deleteStage, assignStageToWorker, getFlaggedPieces, resolveFlaggedPiece, getPiecesGroupbyStage, getAllPieces, deletePiece, deleteOrder, updateOrder } from '../controllers/adminController.js';
import { validate } from '../middleware/validator.js';
import { createUserValidationSchema, updateUserValidationSchema, createStageValidationSchema, updateStageValidationSchema } from '../utils/validators/adminValidations.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/order', getAllOrders);
router.post('/order', createOrder);
router.put('/order/:id', updateOrder);
router.get('/order/:id', getOrder);
router.delete('/order/:id', deleteOrder);

router.get('/user', getAllUsers);
router.post('/user', [upload, validate(createUserValidationSchema)], createUser);
router.put('/user/:id', [upload, validate(updateUserValidationSchema)], updateUser);
router.get('/user/:id', getUser);
router.delete('/user/:id', deleteUser);

router.get('/stage', getAllStages);
router.post('/stage', validate(createStageValidationSchema), createStage);
router.put('/stage/:id', validate(updateStageValidationSchema), updateStage);
router.get('/stage/:id', getStage);
router.delete('/stage/:id', deleteStage);

router.put('/user/:id/assign-stage/:stageId', assignStageToWorker);

router.get('/piece', getAllPieces);
router.get('/piece/flagged', getFlaggedPieces);
router.put('/piece/flagged/:id/resolved', resolveFlaggedPiece);
router.get('/piece/count', getPiecesGroupbyStage);
router.delete('/piece/:id', deletePiece);

export default router;
