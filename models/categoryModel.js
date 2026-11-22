const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category is required"],
      unique: true,
      maxlength: [32, "Too long category name"],
      minlength: [3, "Too short category name"],
    },
    slug: {
      type: String,
      lowercase: true, 
    },
    image: { type: String },
  },
  { timestamps: true },
);

categorySchema.post("save", function (doc) {
  if (doc.image) {
    const url = process.env.BASE_URL + "categories/" + doc.image;
    doc.image = url
  }
});

const categoryModel = mongoose.model("Category", categorySchema);

module.exports = {
  categoryModel,
};
