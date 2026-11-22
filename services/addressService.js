const { addressModel } = require("../models/addressModel.js");

const getAddresses = async (req, res, next) => {
  try {
    const addresses = await addressModel
      .find({ user: req.user._id })
      .sort({ isDefault: -1, createdAt: -1 });

    return res.status(200).json({
      results: addresses.length,
      data: addresses,
    });
  } catch (err) {
    next(err);
  }
};

const getAddress = async (req, res, next) => {
  try {
    const address = await addressModel.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        message: `No address found with id ${req.params.id}`,
      });
    }

    return res.status(200).json(address);
  } catch (err) {
    next(err);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const address = await addressModel.create({
      ...req.body,
      user: req.user._id,
    });

    if (address.isDefault) {
      await addressModel.updateMany(
        { user: req.user._id, _id: { $ne: address._id } },
        { isDefault: false },
      );
    }

    return res.status(201).json({
      message: "Address created successfully",
      data: address,
    });
  } catch (err) {
    next(err);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const address = await addressModel.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        message: `No address found with id ${req.params.id}`,
      });
    }

    const allowedFields = [
      "alias",
      "details",
      "phone",
      "city",
      "postalCode",
      "isDefault",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        address[field] = req.body[field];
      }
    }

    await address.save();

    if (address.isDefault) {
      await addressModel.updateMany(
        { user: req.user._id, _id: { $ne: address._id } },
        { isDefault: false },
      );
    }

    return res.status(200).json({
      message: "Address updated successfully",
      data: address,
    });
  } catch (err) {
    next(err);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const address = await addressModel.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        message: `No address found with id ${req.params.id}`,
      });
    }

    return res.status(200).json({
      message: "Address deleted successfully",
      data: address,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
};
