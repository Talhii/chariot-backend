import Joi from 'joi';

export const updatePieceHistoryValidationSchema = Joi.object({
    stage: Joi.string().required(),
    flagged: Joi.string().required(),
    notes: Joi.string().required(),
    workerId: Joi.string().required(),
});


export const createStageValidationSchema = Joi.object({
    name: Joi.string().required(),
    stage: Joi.number().required(),
    checklist: Joi.array().items(Joi.object({
        taskId: Joi.string().required(),
        description: Joi.string().required(),
        isMandatory: Joi.boolean().required()
    })).required()
});

export const updateStageValidationSchema = Joi.object({
    name: Joi.string(),
    stage: Joi.number(),
    checklist: Joi.array().items(Joi.object({
        taskId: Joi.string().required(),
        description: Joi.string().required(),
        isMandatory: Joi.boolean().required()
    }))
});


