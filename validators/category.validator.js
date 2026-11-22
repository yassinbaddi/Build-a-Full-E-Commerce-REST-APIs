
const { body, param } = require('express-validator');

const validateCategoryId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid category ID')
];

const validateCreateCategory = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required')
        .bail()
        .isLength({ min: 3, max: 32 })
        .withMessage('Category name must be between 3 and 32 characters')
];

const validateUpdateCategory = [
    ...validateCategoryId,
    ...validateCreateCategory
];

module.exports = {
    validateCategoryId,
    validateCreateCategory,
    validateUpdateCategory
};
