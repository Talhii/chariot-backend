import Joi from 'joi';

const roles = ['Admin', 'Manager', 'Worker'];

export const loginUserValidationSchema = Joi.object({
    role: Joi.string().valid(...roles).required(),
    username: Joi.string().when('role', { is: Joi.string().valid('Admin', 'Manager'), then: Joi.required() }),
    password: Joi.string().when('role', { is: Joi.string().valid('Admin', 'Manager'), then: Joi.required() }),
    accessCode: Joi.string().when('role', { is: 'Worker', then: Joi.required() }),
});
