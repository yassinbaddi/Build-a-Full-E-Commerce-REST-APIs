const { userModel } = require("../models/userModel")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const ApiError = require("../utils/apiError")
const slugify = require("slugify")
const crypto = require("node:crypto");

const signup = async (req, res, next) => {

    try {
        req.body.slug = slugify(req.body.user, {
            lower: true,
            strict: true,
            trim: true
        });

        const hashPassword = await bcrypt.hash(req.body.password, 12)
        req.body.password = hashPassword
        const user = await userModel.create(req.body)

        const token = jwt.sign({ userId: user._id },
            process.env.JWT_SECRET,
            {
                algorithm: "HS256",
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            })

        res.status(201).json({ date: user, token })
    }
    catch (err) {
        return next(err);
    }
}



const login = async (req, res, next) => {
    try {
        const user = await userModel.findOne({
            email: req.body.email,
            active: true,
        });

        if (!user) {
            return next(
                new ApiError("Incorrect email or password", 401)
            );
        }

        const isPasswordCorrect = await bcrypt.compare(
            req.body.password,
            user.password
        );

        if (!isPasswordCorrect) {
            return next(
                new ApiError("Incorrect email or password", 401)
            );
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            {
                algorithm: "HS256",
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                _id: user._id,
                email: user.email,
                user: user.user
            },
            token
        });

    } catch (err) {
        return next(err);
    }
};


const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next(new ApiError("You are not logged in", 401));
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        const user = await userModel.findOne({
            _id: decoded.userId,
            active: true
        }).select("-password");

        if (!user) {
            return next(new ApiError("User no longer exists", 401));
        }

        req.user = user;

        if (user.passwordChangedAt) {
            const passwordChangedAt = Math.trunc(
                new Date(user.passwordChangedAt).getTime() / 1000
            );

            if (decoded.iat < passwordChangedAt) {
                throw new ApiError("User recently change his password", 401)
            }
        }

        next();

    } catch (error) {
        return next(error);
    }
};

const allowTo = (...roles) => async (req, res, next) => {
    try {
        if (!roles.includes(req.user.role)) {
            throw new ApiError("Access denied", 403);
        }
        next()
    } catch (err) {
        next(err)
    }
}

const sendEmail = require("../utils/sendEmail.js")
const res = require("express/lib/response.js")

const forgotPassword = async (req, res, next) => {
    console.log("sendEmail type:", typeof sendEmail);
    try {
        const { email } = req.body;

        const user = await userModel.findOne({
            email,
            active: true
        });

        if (!user) {
            throw new ApiError("There is no user with this email", 404);
        }
        const otp = crypto.randomInt(100000, 1000000).toString();

        const hashedOTP = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        user.passwordResetCode = hashedOTP;
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
        user.passwordResetVerified = false;

        await user.save();

        console.log("OTP:", otp);

        if (await sendEmail(otp)) {
            return res.status(200).json({
                success: true,
                message: "OTP sent successfully"
            });
        }
        else {
            user.passwordResetCode = undefined;
            user.passwordResetExpires = undefined;
            user.passwordResetVerified = undefined;
            await user.save();
            throw new ApiError("there is ana Error to send email", 500)
        }

    } catch (err) {
        return next(err);
    }
};


const verifyResetCode = async (req, res, next) => {
    try {
        const { resetCode } = req.body;

        if (!resetCode) {
            throw new ApiError("Reset code is required");
        }

        const hashedOTP = crypto
            .createHash("sha256")
            .update(String(resetCode))
            .digest("hex");

        const user = await userModel.findOne({
            passwordResetCode: hashedOTP,
            passwordResetExpires: {$gt: Date.now()}
        });

        if (!user) {
            throw new ApiError("OTP code is incorrect");
        }

        console.log("OTP code is correct");
        user.passwordResetVerified = true;

        return res.status(200).json({status: "The Otp is correct"})

    } catch (error) {
        next(error);
    }
};


const resetPassword = async (req, res, next) => {
    try {
        const { email, password, confirmPassword } = req.body;

        if (!email || !password || !confirmPassword) {
            throw new ApiError("All fields are required");
        }

        if (password !== confirmPassword) {
            throw new ApiError(
                "Password and confirmPassword do not match"
            );
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            throw new ApiError("No user found");
        }

        user.password = password;
        user.passwordResetCode = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    allowTo,
    signup,
    login,
    protect,
    forgotPassword,
    verifyResetCode,
    resetPassword
}
