const productModel = require("../models/productMolel.js");
const slugify = require("slugify");
const mongoose = require("mongoose");

// Escape special characters in regular expressions
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Allowed fields for filtering
const allowedFilterFields = ["price", "ratings"];

// Allowed fields for sorting and selection
const allowedSortFields = ["title", "price", "ratings", "createdAt"];

const allowedSelectFields = [
  "title",
  "description",
  "price",
  "ratings",
  "category",
  "slug",
  "createdAt",
];


const getProducts = async (req, res) => {
  console.log(typeof req.query["sold[gte]"]);
  console.log(typeof req.query.price);
  try {
    // 1. Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }

    const skip = (page - 1) * limit;

    // 2. Build filter
    const filter = {};

    // Search by title
    if (req.query.keyword) {
      if (typeof req.query.keyword !== "string") {
        return res.status(400).json({
          message: "Keyword must be a string",
        });
      }

      filter.title = {
        $regex: req.query.keyword,
        $options: "i",
      };
    }

    // Filter by category
    if (req.query.category) {
      if (!mongoose.isValidObjectId(req.query.category)) {
        return res.status(400).json({
          message: "Invalid category ID",
        });
      }

      filter.category = req.query.category;
    }

    // 3. Filter by price and ratings
    for (const field of allowedFilterFields) {
      if (req.query[field] !== undefined) {
        const operators = ["gte", "gt", "lte", "lt"];
        const fieldFilter = {};

        for (const operator of operators) {
          const value = req.query[field][operator];

          if (value !== undefined) {
            const number = Number(value);

            if (!Number.isFinite(number)) {
              return res.status(400).json({
                message: `Invalid ${field} ${operator} value`,
              });
            }

            fieldFilter[`$${operator}`] = number;
          }
        }

        if (Object.keys(fieldFilter).length > 0) {
          filter[field] = fieldFilter;
        }
      }
    }

    // 4. Sorting
    let sort = {};

    if (req.query.sort) {
      const sortFields = req.query.sort.split(",");

      for (const field of sortFields) {
        const sortField = field.startsWith("-") ? field.substring(1) : field;

        if (!allowedSortFields.includes(sortField)) {
          return res.status(400).json({
            message: `Cannot sort by ${sortField}`,
          });
        }

        sort[sortField] = field.startsWith("-") ? -1 : 1;
      }
    } else {
      sort = { createdAt: -1 };
    }

    // 5. Select specific fields
    let select = "";

    if (req.query.fields) {
      const fields = req.query.fields.split(",");

      for (const field of fields) {
        if (!allowedSelectFields.includes(field)) {
          return res.status(400).json({
            message: `Cannot select field ${field}`,
          });
        }
      }

      select = fields.join(" ");
    }

    // 6. Execute query
    const products = await productModel
      .find(filter)
      .sort(sort)
      .select(select)
      .skip(skip)
      .limit(limit)
      .populate({
        path: "category",
        select: "title",
      });

    // 7. Count matching products
    const totalProducts = await productModel.countDocuments(filter);

    return res.status(200).json({
      results: products.length,
      totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      data: products,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to retrieve products",
      error: err.message,
    });
  }
};

// ==========================================
// GET SINGLE PRODUCT
// ==========================================

const getProduct = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await productModel.findById(id).populate({
      path: "category",
      select: "title",
    });

    if (!product) {
      return res.status(404).json({
        message: `No product found with ID ${id}`,
      });
    }

    return res.status(200).json(product);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to retrieve product",
      error: err.message,
    });
  }
};

// ==========================================
// CREATE PRODUCT
// ==========================================

const createProduct = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "Product title is required",
      });
    }

    // Check duplicate title
    // const existing = await productModel.findOne({
    //   title: {
    //     $regex: `^${escapeRegex(title.trim())}$`,
    //     $options: "i",
    //   },
    // });

    // if (existing) {
    //   return res.status(409).json({
    //     message: "Product title title already exists",
    //   });
    // }

    // Generate slug
    req.body.title = title.trim();
    req.body.slug = slugify(title.trim(), {
      lower: true,
      strict: true,
    });

    const product = await productModel.create(req.body);

    return res.status(201).json({
      message: "Product created successfully",
      data: product,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: err.message,
      });
    }

    if (err.code === 11000) {
      return res.status(409).json({
        message: "Product already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to create product",
      error: err.message,
    });
  }
};

// ==========================================
// UPDATE PRODUCT
// ==========================================

const updateProduct = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    // Generate slug only when title is provided
    if (req.body.title !== undefined) {
      if (typeof req.body.title !== "string" || !req.body.title.trim()) {
        return res.status(400).json({
          message: "Product title cannot be empty",
        });
      }

      req.body.title = req.body.title.trim();

      req.body.slug = slugify(req.body.title, {
        lower: true,
        strict: true,
      });

      // Check duplicate title, excluding current product
      const existing = await productModel.findOne({
        title: {
          $regex: `^${escapeRegex(req.body.title)}$`,
          $options: "i",
        },
        _id: { $ne: id },
      });

      if (existing) {
        return res.status(409).json({
          message: "Product title already exists",
        });
      }
    }

    const product = await productModel.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        message: `No product found with ID ${id}`,
      });
    }

    return res.status(200).json({
      message: "Product updated successfully",
      data: product,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: err.message,
      });
    }

    if (err.code === 11000) {
      return res.status(409).json({
        message: "Product already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to update product",
      error: err.message,
    });
  }
};

// ==========================================
// DELETE PRODUCT
// ==========================================

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await productModel.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        message: `No product found with ID ${id}`,
      });
    }

    return res.status(200).json({
      message: "Product deleted successfully",
      data: product,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to delete product",
      error: err.message,
    });
  }
};

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const  {v4} = require('uuid')
const sharp = require('sharp')

const uploadImages = upload.fields([
  {
    name: "imageCover",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 5,
  },
]);


const resizeImages = async (req, res, next) => {
  try {
    req.body.images = [];

    if (req.files.images) {
      for (const file of req.files.images) {
        const filename = `category-${v4()}-${Date.now()}.jpeg`;

        await sharp(file.buffer)
          .resize({ width: 320, height: 240 })
          .jpeg({ quality: 90 })
          .toFile(`uploads/categories/${filename}`);

        req.body.images.push(filename);
      }
    }

    if (req.files.imageCover) {
      const file = req.files.imageCover[0];
      const filename = `category-${v4()}-${Date.now()}.jpeg`;

      await sharp(file.buffer)
        .resize({ width: 320, height: 240 })
        .jpeg({ quality: 90 })
        .toFile(`uploads/categories/${filename}`);

      req.body.imageCover = filename;
    }
    console.log('req.body =', req.body);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImages,
  resizeImages
};
