const express = require("express");
const router = express.Router();
const Users = require("./controller");
const multer = require("multer");
const checkRole = require("../../libs/middleware/checkRole");
const fs = require("fs");
const path = require("path");

// Ensure upload directory exists
const uploadPath = path.join(__dirname, "../../uploads/profiles");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// File filter and size limit
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  // limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.post(
  "/updateProfileImage",
  checkRole(["admin", "user"]),
  upload.single("profile"),
  Users.updateProfileImage
);

router.post(
  "/updateProfileImages/:id",
  checkRole(["admin", "user"]),
  upload.single("profile"),
  Users.updateProfileImages
);
router.get("/getAll", checkRole(["admin"]), Users.getUsers);
router.get("/count", checkRole(["admin"]), Users.count);

router.get("/getSingle/:id", Users.getSingleUser);
router.post("/create", upload.single("profile"), Users.createUser);
router.delete("/delete/:id", checkRole(["admin", "user"]), Users.deleteUser);
router.put(
  "/updateStatus/:id",
  checkRole(["admin", "user"]),
  Users.updateStatus
);
router.put("/block/:id", checkRole(["admin"]), Users.blocking);
router.get("/verify/email", Users.verifyEmail);
router.post("/resendVerificationEmail", Users.resendVerificationEmail);
router.post("/sendCustomEmail", Users.sendCustomEmails);
router.get("/adminDashboard", Users.adminDashboard);
router.get("/laptopSale/:filter", checkRole(["admin"]), Users.laptopSale);
router.get("/monthlyRevinum", checkRole(["admin"]), Users.monthlyRevinum);
router.put("/update/:id", upload.single("profile"), Users.updateUser);

module.exports = router;
