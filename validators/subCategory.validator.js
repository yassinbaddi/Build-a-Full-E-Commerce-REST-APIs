const { body, param } = require('express-validator');

const validateSubCategoryId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid subCategory ID')
];

const validateSubCategory = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('SubCategory name is required')
        .bail()
        .isLength({ min: 3, max: 30 })
        .withMessage('SubCategory name must be between 3 and 30 characters'),

    body('category')
        .notEmpty()
        .withMessage('Category ID is required')
        .bail()
        .isMongoId()
        .withMessage('Invalid category ID')
];

const validateUpdateSubCategory = [
    ...validateSubCategoryId,
    ...validateSubCategory
];

module.exports = {
    validateSubCategoryId,
    validateSubCategory,
    validateUpdateSubCategory
};
