import Joi from 'joi';

export const updatePieceHistoryValidationSchema = Joi.object({
    sectionNumber: Joi.string().required(),
    flagged: Joi.string().required(),
    notes: Joi.string().required(),
});