const express = require("express");
const router = express.Router();
const reviewController = require("./controller");
const checkRole = require("../../libs/middleware/checkRole");

// Add review
router.post("/add", checkRole(["user", "admin"]), reviewController.addReview);

// Get all reviews
router.get("/getAll", reviewController.getAllReviews);

// Get reviews for a laptop
router.get("/laptop/:id", reviewController.getLaptopReviews);

// Get reviews for a user
router.get("/reviewer/:id", reviewController.getReviewerReviews);

// Get reviews for a user
router.get("/seller/:id", reviewController.getSellerReviews);

// Get reviews that i give
router.get(
  "/myreview",
  checkRole(["user", "admin"]),
  reviewController.getMyReviews
); // Get reviews that i got
router.get(
  "/reviewIGot",
  checkRole(["user", "admin"]),
  reviewController.getReviewsIGot
);

// Update review
router.put(
  "/update/:id",
  checkRole(["user", "admin"]),
  reviewController.updateReview
);

// Delete review
router.delete(
  "/delete/:id",
  checkRole(["user", "admin"]),
  reviewController.deleteReview
);
router.get("/laptop-reviews", reviewController.getLaptopReviewss); // Route for laptop reviews
router.get("/seller-reviews", reviewController.getSellerReviewss);

module.exports = router;
