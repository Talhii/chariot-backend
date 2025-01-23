import Joi from 'joi';

export const updatePieceHistoryValidationSchema = Joi.object({
    stage: Joi.string().required(),
    flagged: Joi.string().required(),
    notes: Joi.string().required(),
});