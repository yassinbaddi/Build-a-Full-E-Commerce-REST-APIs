const { default: mongoose } = require("mongoose")

const subCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        unique: true,
        minlength: 3,
        maxlength: 30
    }
    ,
    slug: {
        type: String,
        lowercase: true  
    },
    category:
    {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: true
    }
}, {timestamps: true}) 

const subCategoryModel = mongoose.model('SubCategory', subCategorySchema)

module.exports = { subCategoryModel}