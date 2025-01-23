import Joi from 'joi';

const roles = ['Admin', 'Manager', 'Worker'];

export const createUserValidationSchema = Joi.object({
    fullName: Joi.string().required(),
    role: Joi.string().valid(...roles).required(),
    username: Joi.string().when('role', { is: Joi.string().valid('Admin', 'Manager'), then: Joi.required() }),
    password: Joi.string().when('role', { is: Joi.string().valid('Admin', 'Manager'), then: Joi.required() }),
    accessCode: Joi.string().when('role', { is: 'Worker', then: Joi.required() }),
});

export const updateUserValidationSchema = Joi.object({
    fullName: Joi.string(),
    role: Joi.string(),
    username: Joi.string(),
    password: Joi.string(),
    accessCode: Joi.string()
});


export const createStageValidationSchema = Joi.object({
    number: Joi.number().required(),
    name: Joi.string().required(),
    checklist: Joi.array().items(Joi.object({
        description: Joi.string().required(),
        isMandatory: Joi.boolean().required()
    })).required()
});

export const updateStageValidationSchema = Joi.object({
    number: Joi.number(),
    name: Joi.string(),
    checklist: Joi.array().items(Joi.object({
        description: Joi.string().required(),
        isMandatory: Joi.boolean().required()
    }))
});