const express = require("express");
const router = express.Router();

const {
  getAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
} = require("../services/addressService.js");

const { protect } = require("../services/authService.js");
const validate = require("../middleware/validateMiddleware.js");

const {
  addressIdValidator,
  createAddressValidator,
  updateAddressValidator,
  deleteAddressValidator,
} = require("../validators/addressValidator.js");

router.get("/", protect, getAddresses);

router.post(
  "/",
  protect,
  createAddressValidator,
  validate,
  createAddress,
);

router.get(
  "/:id",
  protect,
  addressIdValidator,
  validate,
  getAddress,
);

router.put(
  "/:id",
  protect,
  updateAddressValidator,
  validate,
  updateAddress,
);

router.delete(
  "/:id",
  protect,
  deleteAddressValidator,
  validate,
  deleteAddress,
);

module.exports = { router };
