import Joi from 'joi';

export const upsertPieceDetailValidationSchema = Joi.object({
    sectionNumber: Joi.string().required(),
});