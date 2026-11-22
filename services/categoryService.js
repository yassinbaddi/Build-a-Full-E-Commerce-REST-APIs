const { categoryModel } = require("../models/categoryModel.js");
const slugify = require("slugify");

const getCategories = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (page - 1) * limit;
  try {
    const categories = await categoryModel.find().limit(limit).skip(skip);
    if (categories.length === 0) {
      return res.status(404).json({
        message: `Page ${page} not found`,
      });
    }
    return res
      .status(200)
      .json({ length: categories.length, data: categories });
  } catch (err) {
    res.status(400).send(err);
  }
};

const getCategory = async (req, res) => {
  const id = req.params.id;
  try {
    const category = await categoryModel.findById(id);
    if (!category) {
      res.status(404).send(`No category id with ${id}`);
      return;
    }
    res.status(200).json(category);
  } catch (err) {
    res.status(400).send(err);
  }
};

const createCategory = async (req, res) => {
  const name = req.body.name;
  req.body.slug =  slugify(name)
  console.log(req.body);
  try {
    const data = await categoryModel.create(req.body);
    res.status(201).json({ data: data });
  } catch (err) {
    res.status(400).send(err);
  }
};

const updateCategory = async (req, res) => {
  const id = req.params.id;
  const name = req.body.name;
  try {
    const existingCategory = await categoryModel.findOne({
      name,
      _id: { $ne: id },
    });
    if (existingCategory) {

      return res.status(409).json({
        message: "Category name already exists",
      });
    }
    const category = await categoryModel.findByIdAndUpdate(
      id,
      {
        name,
        slug: slugify(name),
      },
      { new: true, runValidators: true },
    );
    if (!category) {
      return res.status(404).send(`no category found with id ${id}`);
    }
    res.status(200).json(category);
  } catch (err) {
    res.status(400).json(err);
  }
};

const deleteCategory = async (req, res) => {
  const id = req.params.id;
  try {
    const category = await categoryModel.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).send(`no category found with id ${id}`);
    }
    res.status(201).json({ message: "delete successfully", category });
  } catch (err) {
    res.status(400).json(err);
  }
};

const multer = require("multer");
const { v4 } = require("uuid");
const ApiError = require("../utils/apiError.js");
const sharp = require("sharp");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: Math.floor(1 * 1024 * 1024)
  },
});

const resizeImage = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const filename = `category-${v4()}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
      .resize({ width: 320, height: 240 })
      .jpeg({ quality: 90 })
      .toFile(`uploads/categories/${filename}`);

    req.body.image = filename;

    next();
  } catch (error) {
    next(error);
  }
};

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/categories');
//   },
//   filename: function (req, file, cb) {
//     const ext = file.mimetype.split("/").at(-1);
//     const filename = "category-" + v4() + Date.now() + '.' + ext;
//     cb(null, filename);
//   },
// });

// const fileFilter = function (req, file, cb) {
//     if (file.mimetype.startsWith('image/')) {
//         cb(null, true);
//     } else {
//         cb(new ApiError('Only images are allowed', 400), false);
//     }
// };

// const upload = multer({
// storage: storage,
// fileFilter: fileFilter
// });

const uploadCategoryImage = upload.single("image");


module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  resizeImage,
};
