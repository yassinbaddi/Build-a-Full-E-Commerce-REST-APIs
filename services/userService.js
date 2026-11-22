const { userModel } = require("../models/userModel.js");
const slugify = require("slugify");

const getUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    try {
        const users = await userModel.find({ active: true }, { password: 0 }).limit(limit).skip(skip);
        if (users.length === 0) {
            return res.status(404).json({
                message: `Page ${page} not found`,
            });
        }
        return res
            .status(200)
            .json({ length: users.length, data: users });
    } catch (err) {
        res.status(400).send(err);
    }
};

const getUser = async (req, res) => {
    const id = req.params.id;
    try {
        const user = await userModel.findOne({
            _id: id,
            active: true,
        });
        if (!user) {
            res.status(404).send(`No user id with ${id}`);
            return;
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(400).send(err);
    }
};
const bcrypt = require('bcrypt');

const createUser = async (req, res) => {
    try {
        const { user } = req.body;
        if (!user) {
            return res.status(400).json({
                message: "Username is required"
            });
        }

        req.body.slug = slugify(user);
        req.body.password = await bcrypt.hash(req.body.password, 12);

        const data = await userModel.create(req.body);

        return res.status(201).json({ data });

    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const { user } = req.body;

    try {

        const existing = await userModel.findOne({
            user,
            _id: { $ne: id },
        });

        if (existing) {
            return res.status(409).json({
                message: "Username already exists",
            });
        }
        const updatedUser = await userModel.findOneAndUpdate(
            { _id: id, active: true },
            {
                user,
                slug: slugify(user)
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedUser) {
            return res.status(404).json({
                message: `No user found with id ${id}`,
            }); { password: 0 }
        }

        return res.status(200).json(updatedUser);
    } catch (err) {
        return res.status(400).json({
            message: err.message,
        });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await userModel.findOneAndUpdate(
            { _id: id, active: true },
            { active: false },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                message: `No active user found with id ${id}`
            });
        }

        return res.status(200).json({
            message: "User deactivated successfully",
            data: user
        });

    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
};

const multer = require("multer");
const { v4 } = require("uuid");
const sharp = require("sharp");

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: Math.floor(5 * 1024 * 1024)
    },
});

const resizeImage = async (req, res, next) => {
    try {
        if (!req.file) return next();

        const filename = `user-${v4()}-${Date.now()}.jpeg`;

        await sharp(req.file.buffer)
            .resize({ width: 320, height: 320 })
            .jpeg({ quality: 90 })
            .toFile(`uploads/users/${filename}`);

        req.body.profileImg = filename;

        next();
    } catch (error) {
        next(error);
    }
};


const uploadUserImage = upload.single("profileImg");


const updatePasswordUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 12);

        const updatedUser = await userModel.findOneAndUpdate(
            { _id: id, active: true },
            { password: hashedPassword, passwordChangedAt: Date.now() },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedUser) {
            return res.status(404).json({
                message: `No user found with id ${id}`
            });
        }

        return res.status(200).json({
            message: "Password updated successfully"
        });

    } catch (err) {
        next(err);
    }
};


module.exports = {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    uploadUserImage,
    resizeImage,
    updatePasswordUser
};
