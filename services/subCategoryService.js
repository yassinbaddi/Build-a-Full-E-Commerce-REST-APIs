
const { subCategoryModel } = require("../models/subCategoryModel");
const { categoryModel } = require("../models/categoryModel");
const slugify = require("slugify");
const { model } = require("mongoose");
const ApiError = require("../utils/apiError");

const getSubCategories = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (page - 1) * limit;

  try {
    const categories = await subCategoryModel
      .find()
      .limit(limit)
      .skip(skip);

    return res.status(200).json({
      length: categories.length,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};

const getSubCategory = async (req, res, next) => {
  const id = req.params.id;

  try {
    const subCategory = await subCategoryModel.findById(id);

    if (!subCategory) {
      return res.status(404).json({
        message: `No subcategory found with id ${id}`,
      });
    }

    return res.status(200).json(subCategory);
  } catch (err) {
    next(err);
  }
};

const createSubCategory = async (req, res, next) => {
  const { name, category } = req.body;

  try {
    // Check if the parent category exists
    const categoryExists = await categoryModel.exists({
      _id: category,
    });

    if (!categoryExists) {
      return res.status(404).json({
        message: "Parent category not found",
      });
    }

    const data = await subCategoryModel.create({
      name,
      category,
      slug: slugify(name),

    });

    return res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
};

const updateSubCategory = async (req, res, next) => {
  const { id } = req.params;
  const { name, category } = req.body;

  try {
    // Check if another subcategory has the same name
    const existingSubCategory = await subCategoryModel.findOne({
      name,
      _id: { $ne: id },
    });

    if (existingSubCategory) {
      return res.status(409).json({
        message: "Subcategory name already exists",
      });
    }

    // Check if the new parent category exists
    const categoryExists = await categoryModel.exists({
      _id: category,
    });

    if (!categoryExists) {
      return res.status(404).json({
        message: "Parent category not found",
      });
    }

    const subCategory = await subCategoryModel.findByIdAndUpdate(
      id,
      {
        name,
        slug: slugify(name),
        category,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!subCategory) {
      return res.status(404).json({
        message: `No subcategory found with id ${id}`,
      });
    }

    return res.status(200).json(subCategory);
  } catch (err) {
    next(err);
  }
};

const deleteSubCategory = async (req, res, next) => {
  const { id } = req.params;

  try {
    const subCategory = await subCategoryModel.findByIdAndDelete(id);

    if (!subCategory) {
      return res.status(404).json({
        message: `No subcategory found with id ${id}`,
      });
    }

    return res.status(200).json({
      message: "Deleted successfully",
      data: subCategory,
    });
  } catch (err) {
    next(err);
  }
};

const getSubCategoryByCategory = async (req, res, next) => {
  const { categoryId } = req.params;

  try {
    const categoryExists = await categoryModel.exists({
      _id: categoryId,
    });

    if (!categoryExists) {
      throw new ApiError("Category not found", 404);
    }

    const subCategories = await subCategoryModel.find({
      category: categoryId,
    });

    return res.status(200).json({
      success: true,
      results: subCategories.length,
      data: subCategories,
    });
  } catch (err) {
    next(err);
  }
};

const createSubCategoryByCategory = async (req, res, next) => {
  const { categoryId } = req.params;
  const { name } = req.body;

  try {
    const categoryExists = await categoryModel.exists({
      _id: categoryId,
    });

    if (!categoryExists) {
      throw new ApiError("Category not found", 404);
    }

    const subCategory = await subCategoryModel.create({
      name,
      slug: slugify(name),
      category: categoryId,
    });

    return res.status(201).json({
      success: true,
      data: subCategory,
    });
  } catch (err) {
    next(err);
  }
};


module.exports = {
  getSubCategories,
  getSubCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getSubCategoryByCategory,
  createSubCategoryByCategory
};
