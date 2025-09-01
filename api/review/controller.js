const Review = require("../../models/review");
const User = require("../../models/userdata");
const Laptop = require("../../models/laptop");
const PURCHASE = require("../../models/purchase");

const { successResponse } = require("../../libs/responseMessage/success");
const { errorResponse } = require("../../libs/responseMessage/error");

exports.addReview = async (req, res) => {
  try {
    const { laptopId, rating, comment, sellerId } = req.body;

    if (rating === undefined || rating === null || comment.trim() === "") {
      return errorResponse(res, "Rating and comment are required", 400);
    }

    if (rating < 1 || rating > 5) {
      return errorResponse(res, "Rating must be between 1 and 5", 400);
    }

    if (!laptopId && !sellerId) {
      return errorResponse(res, "Laptop ID or Seller ID is required", 400);
    }

    let review;

    const laptopReviewsCount = await Review.countDocuments({
      reviewer: req.user._id,
      laptop: { $exists: true },
    });

    const sellerReviewsCount = await Review.countDocuments({
      reviewer: req.user._id,
      seller: { $exists: true },
    });

    if (laptopId && laptopReviewsCount >= 3) {
      return errorResponse(
        res,
        `You have given ${laptopReviewsCount} laptop reviews. You can only give 3 laptop reviews`,
        400
      );
    }

    if (sellerId && sellerReviewsCount >= 3) {
      return errorResponse(
        res,
        `You have given ${sellerReviewsCount} seller reviews. You can only give 3 seller reviews`,
        400
      );
    }

    // Handle laptop review
    if (laptopId) {
      const findLaptop = await Laptop.findById(laptopId);
      if (!findLaptop) {
        return errorResponse(res, "Laptop not found", 404);
      }

      // Updated check for purchased laptop inside the array of laptops
      const findPurchase = await PURCHASE.findOne({
        user: req.user._id,
        status: "completed",
        "laptops.laptop": laptopId,
      });

      if (!findPurchase) {
        return errorResponse(
          res,
          "You can only review a laptop you have purchased.",
          403
        );
      }

      review = new Review({
        laptop: laptopId,
        rating,
        comment,
        reviewer: req.user._id,
      });

      await review.save();
    }

    // Handle seller review
    if (sellerId) {
      review = new Review({
        seller: sellerId,
        rating,
        comment,
        reviewer: req.user._id,
      });

      await review.save();
    }

    return successResponse(res, "Review added successfully", review);
  } catch (error) {
    console.error("Error in addReview:", error);
    return errorResponse(res, "Something went wrong", 500);
  }
};

// View reviews for a laptop
exports.getLaptopReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ laptop: req.params.id })
      .populate("laptop")
      .populate("reviewer");
    return successResponse(res, "Review fetched successfully", reviews);
  } catch (error) {
    return errorResponse(res, error);
  }
};

//get all review of a reviewer
exports.getReviewerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewer: req.params.id }).populate(
      "reviewer"
    );
    return successResponse(res, "Review fetched successfully", reviews);
  } catch (error) {
    return errorResponse(res, error);
  }
};
exports.getReviewsIGot = async (req, res) => {
  try {
    // Step 1: Get all laptops that belong to the logged-in user
    const myLaptops = await Laptop.find({ ownerId: req.user._id }).select(
      "_id"
    );

    // Extract their IDs
    const laptopIds = myLaptops.map((l) => l._id);

    // Step 2: Fetch all reviews written about those laptops
    const reviewsOnMyLaptops = await Review.find({ laptop: { $in: laptopIds } })
      .populate("reviewer", "name email firstName lastName profile") // who reviewed my laptops
      .populate("laptop", "title brand model images"); // laptop details

    // Step 3: Fetch all reviews where I was reviewed as a seller
    const reviewsAboutMe = await Review.find({ seller: req.user._id })
      .populate("reviewer", "name email firstName lastName")
      .populate("seller", "name email profile phone ");

    return successResponse(res, "Review fetched successfully", {
      reviewsAboutMe, // Review about me as a seller
      reviewsOnMyLaptops, // Review on my laptops
    });
  } catch (error) {
    return errorResponse(res, error);
  }
};
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewer: req.user._id })
      .populate("laptop")
      .populate("seller");
    console.log("reviews", reviews);
    if (reviews.length <= 0) {
      return errorResponse(res, "no reviews found", 400);
    }
    return successResponse(res, "Review fetched successfully", reviews);
  } catch (error) {
    return errorResponse(res, error);
  }
};
//get all review of a seller
exports.getSellerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ seller: req.params.id }).populate(
      "seller"
    );
    return successResponse(res, "seller Review fetched successfully", reviews);
  } catch (error) {
    return errorResponse(res, error);
  }
};

// to get all review
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("reviewer")
      .populate("seller")
      .populate("laptop");

    return successResponse(res, "Review fetched successfully", reviews);
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating && !comment) {
      return errorResponse(res, "No updates provided", 400);
    }

    const review = await Review.findById(id);
    if (!review) {
      return errorResponse(res, "Review not found", 404);
    }

    // Check if the authenticated user is the original reviewer
    if (review.reviewer.toString() !== req.user._id) {
      return errorResponse(
        res,
        "You are not authorized to update this review",
        403
      );
    }

    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    await review.save();

    return successResponse(res, "Review updated successfully", review);
  } catch (error) {
    return errorResponse(res, error || "An error occurred");
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return errorResponse(res, "Review not found", 404);
    }
    console.log(req.user.id);
    if (review.reviewer.toString() !== req.user.id) {
      return errorResponse(
        res,
        "You are not authorized to delete this review",
        403
      );
    }

    await Review.findByIdAndDelete(id);

    return successResponse(res, "Review deleted successfully", 200);
  } catch (error) {
    return errorResponse(res, error);
  }
};
// Separate controller for fetching laptop reviews
exports.getLaptopReviewss = async (req, res) => {
  try {
    const reviews = await Review.find({ laptop: { $ne: null } }) // Filter reviews that are associated with laptops
      .populate("reviewer")
      .populate("laptop");

    return successResponse(res, "Laptop reviews fetched successfully", reviews);
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Separate controller for fetching seller reviews
exports.getSellerReviewss = async (req, res) => {
  try {
    const reviews = await Review.find({ seller: { $ne: null } }) // Filter reviews that are associated with sellers
      .populate("reviewer")
      .populate("seller");

    return successResponse(res, "Seller reviews fetched successfully", reviews);
  } catch (error) {
    return errorResponse(res, error);
  }
};
