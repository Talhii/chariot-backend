export const validate = (validator) => {
    return (req, res, next) => {
        const { error } = validator.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        next();
    };
};
