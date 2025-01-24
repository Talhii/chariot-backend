import Joi from 'joi';

export const updatePieceHistoryValidationSchema = Joi.object({
    stageNumber: Joi.string().required(),
    flagged: Joi.string().required(),
    notes: Joi.string().required(),
});