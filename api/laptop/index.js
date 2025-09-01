const express = require("express");
const router = express.Router();
const laptopController = require("./controller");
const checkRole = require("../../libs/middleware/checkRole");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/laptops");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

//create laptop
router.post(
  "/add",
  checkRole(["user", "admin"]),
  upload.array("images", 5),
  laptopController.addLaptop
);

// View all available laptops (Public access)
router.get(
  "/getAll",
  checkRole(["user", "admin"]),
  laptopController.getLaptops
);
router.get("/getDetails/:id", laptopController.getSingleUser);
router.get(
  "/getPurchaseHistory",
  checkRole(["user"]),
  laptopController.getPurchaseHistory
);
router.get(
  "/admin/getAll",
  checkRole(["admin"]),
  laptopController.getAdminLaptops
);
router.get(
  "/admin/getPurchasedLaptop",
  checkRole(["admin"]),
  laptopController.getPurchasedLaptop
);
// Edit a laptop (Requires authentication, restricted to laptop owner)
router.put(
  "/edit/:id",
  checkRole(["admin", "user"]),
  upload.array("images", 5),
  laptopController.editLaptop
);
router.get(
  "/getuserLaptop",
  checkRole(["user", "admin"]),
  laptopController.getuserLAptop
);

// Delete a laptop (Requires authentication, restricted to laptop owner)
router.delete(
  "/delete/:productId",
  checkRole(["admin", "user"]),
  laptopController.deleteLaptop
);

// Admin: Accept/Hide laptop (Requires admin privileges)
router.put(
  "/status",
  checkRole(["admin"]),
  laptopController.updateLaptopStatus
);
router.put("/block", checkRole(["admin"]), laptopController.updateBlockStatus);
// Buy a laptop (Requires authentication)

//the below route is used to verify that the laptop is purchased or not
router.patch(
  "/admin/updatePurchaseStatus/:id",
  checkRole(["admin"]),
  laptopController.updatePurchaseStatus
);

router.post(
  "/buy/:id",
  checkRole(["user", "admin"]),
  laptopController.buyLaptop
);

router.get(
  "/getPurchasedLaptop",
  checkRole(["user", "admin"]),
  laptopController.getPurchasedLaptop
);

//getOrdersReceivedByUser
router.get(
  "/getOrdersReceivedByUser",
  checkRole(["user", "admin"]),
  laptopController.getOrdersReceivedByUser
);

router.put(
  "/updateOrderStatus/:orderId",
  checkRole(["user", "admin"]),
  laptopController.updateOrderStatus
);
router.get("/allProducts", checkRole(["admin"]), laptopController.allProducts);

module.exports = router;
