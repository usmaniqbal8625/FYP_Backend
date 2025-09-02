const express = require("express");
const router = express.Router();
const cartController = require("./controller");
const checkRole = require("../../libs/middleware/checkRole");

router.post("/add", checkRole(["user", "admin"]), cartController.addToCart);
router.get("/getAll", checkRole(["user", "admin"]), cartController.getCart);
router.put("/update", checkRole(["user", "admin"]), cartController.updateCart);
router.post("/checkout", checkRole(["user", "admin"]), cartController.checkout);
router.post(
  "/buyAllItems",
  checkRole(["user", "admin"]),
  cartController.buyAllItems
);
router.post(
  "/buySelectedItem",
  checkRole(["user", "admin"]),
  cartController.buySelectedItem
);

router.delete(
  "/delete/:laptopId",
  checkRole(["user", "admin"]),
  cartController.deleteCartItem
);

module.exports = router;
