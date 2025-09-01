const express = require("express");
const router = express.Router();
const complaintController = require("./controller");
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

//create complaint
router.post(
  "/add",
  checkRole(["user", "admin"]),
  complaintController.createComplaint
);

// View all complaints a login user got on its product
router.get(
  "/getAll",
  checkRole(["user", "admin"]),
  complaintController.getAllComplaints
); // View all complaints a login user got on its product
router.get(
  "/getAllComplaintsAdmin",
  checkRole(["user", "admin"]),
  complaintController.getAllComplaintsAdmin
);
router.get(
  "/getMyComplaints",
  checkRole(["user", "admin"]),
  complaintController.getMyComplaints
);

// // View complaints by id
// router.get("/get/:id", complaintController.getComplaintById);

// // Edit a laptop (Requires authentication, restricted to laptop owner)
// router.put(
//   "/edit/:id",
//   checkRole(["user"]),
//   complaintController.updateComplaint
// );

// // Delete a laptop (Requires authentication, restricted to laptop owner)
// router.delete(
//   "/delete/:id",
//   checkRole(["admin"]),
//   complaintController.deleteComplaint
// );

// // // Admin: accept,reject complaints and if complaint>3 block user
// // router.patch(
// //   "/status/:id",
// //   checkRole(["admin"]),
// //   complaintController.updateComplaintStatus
// // );
module.exports = router;
