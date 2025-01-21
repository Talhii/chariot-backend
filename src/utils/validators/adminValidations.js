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
