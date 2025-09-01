const Laptop = require("../../models/laptop");
const User = require("../../models/userdata");
const PUECHASE = require("../../models/purchase");
const Review = require("../../models/review");
const Complaint = require("../../models/complaints");
const Cart = require("../../models/cart");

const fs = require("fs");
const path = require("path");
const { successResponse } = require("../../libs/responseMessage/success");
const { errorResponse } = require("../../libs/responseMessage/error");
const { laptopSchema } = require("../../libs/dtos/validator");

const { EUserRole, EstatusOptions, DB_Tables } = require("../../utils/enum");
const multer = require("multer");
const upload = multer();

// Add a new laptop
exports.addLaptop = async (req, res) => {
  try {
    const { error, value } = laptopSchema.validate(req.body);
    if (error) {
      return errorResponse(res, error.message);
    }
    const images = req.files.map((file) => file.path);

    const findUser = await User.findById(req.user._id);
    if (!findUser) {
      return errorResponse(res, "User not found", 404);
    }
    const laptop = new Laptop({
      ...req.body,
      ownerId: req.user._id,
      images: images,
    });
    await laptop.save();
    return successResponse(res, "Laptop added successfully", laptop);
  } catch (err) {
    return errorResponse(res, err);
  }
};

// View all laptops which are allowed by admin
exports.getLaptops = async (req, res) => {
  try {
    const { price, brand, model, condition, page = 1, limit = 10 } = req.query;
    const userId = req.user._id; // Assuming user ID is available from authentication middleware
    const filter = {};

    // if (price) {
    //   const [minPrice, maxPrice] = price.split(",").map(Number);
    //   filter.price = { $gte: minPrice, $lte: maxPrice };
    // }
    // if (brand) filter.brand = brand;
    // if (model) filter.model = model;
    // if (condition) filter.condition = condition;
    // filter.isAvailable = true;
    // filter.isblock = false;
    // filter.status = "accepted";
    // filter.ownerId = { $ne: userId }; // Exclude laptops uploaded by the current user

    const laptops = await Laptop.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate({
        path: "ownerId",
        match: { isblock: false, status: EstatusOptions.ACCEPTED },
        select:
          "firstname lastName email phoneNo userName address city state country profile",
      });
    const totalLaptop = await Laptop.countDocuments(filter);
    const totalPages = Math.ceil(totalLaptop / limit);
    return successResponse(
      res,
      "Laptop fetched successfully",
      //    {
      //   Laptop: laptops,
      //   totalLaptop,
      //   totalPages,
      //   currentPage: Number(page),
      // }
      laptops
    );
  } catch (err) {
    return errorResponse(res, err);
  }
};




exports.getSingleUser = async (Req, res) => {
  try {
    console.log(Req.params.id);
    const user = await Laptop.findOne({ _id: Req.params.id }).populate(
      "ownerId"
    );
    if (!user) {
      return errorResponse(res, "Laptop not found", 404);
    }
    return successResponse(res, "Laptop found", user);
  } catch (error) {
    return errorResponse(res, error);
  }
};
exports.getuserLAptop = async (req, res) => {
  try {
    const user = await Laptop.find({ ownerId: req.user._id }).populate(
      "ownerId"
    );
    if (!user) {
      return errorResponse(res, "Laptop not found", 404);
    }
    return successResponse(res, "Laptop found", user);
  } catch (error) {
    return errorResponse(res, error);
  }
};
exports.getPurchasedLaptop = async (req, res) => {
  try {
    // const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id; // assuming user is authenticated and user object is available in req
    const laptops = await PUECHASE.find({ user: userId })
      .populate({
        path: "user",
        select:
          "firstname lastName email phoneNo userName address city state country profile",
      })
      .populate({
        path: "laptops.laptop",
        select: "title brand model price condition status images ownerId",
        populate: {
          path: "ownerId",
          select: "firstName lastName email",
        },
      });
    console.log(laptops);
    return successResponse(res, "Laptop fetched successfully", {
      Laptop: laptops,
    });
  } catch (err) {
    return errorResponse(res, err);
  }
};
// View all laptops fir admin
exports.getAdminLaptops = async (req, res) => {
  try {
    let laptops;
    if (req.user.role === "admin") {
      laptops = await Laptop.find().populate(
        "ownerId",
        "firstname lastName email phoneNo userName address city state country profile"
      );
    } else {
      laptops = await Laptop.find({ ownerId: req.user._id }).populate(
        "ownerId"
      );
      if (!laptops) {
        return errorResponse(res, "Laptop not found", 404);
      }
    }

    return successResponse(res, "Laptop fetched successfully", laptops);
  } catch (err) {
    return errorResponse(res, err);
  }
};

// Edit laptop

// Configure Multer for file uploads

exports.editLaptop = async (req, res) => {
  try {
    // Use Multer to parse the request and handle file uploads
    // upload.single("image")(req, res, async (err) => {
    // s
    const images = req.files.map((file) => file.path);
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;
    console.log("images body", images, req.files);

    // Find the laptop to be updated
    const laptop = await Laptop.findById(id);
    if (!laptop) return errorResponse(res, "Laptop not found", 404);

    if (laptop.isblock) {
      return errorResponse(res, "Cannot edit a blocked laptop", 403);
    }

    // Check if the user has permission to edit the laptop
    if (
      laptop.ownerId.toString() !== userId.toString() &&
      userRole !== "admin"
    ) {
      return errorResponse(
        res,
        "You do not have permission to edit this laptop",
        403
      );
    }

    console.log(
      req.files.length > 0,
      images,
      laptop.images,
      [...laptop.images, ...images],
      "CHECK"
    );

    const updatedData = {
      ...req.body,
      isAvailable: req.body.count > 0 ? true : false,
      images:
        req.files.length > 0 ? [...laptop.images, ...images] : laptop.images,
    };

    // Update the laptop with the new data
    const updatedLaptop = await Laptop.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    return successResponse(res, "Laptop updated successfully", updatedLaptop);
    // });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

exports.deleteLaptop = async (req, res) => {
  try {
    const { productId } = req.params;
    // Find the laptop to delete
    const laptop = await Laptop.findOne({ _id: productId });
    if (!laptop) return errorResponse(res, "Laptop not found", 404);

    // Check permissions
    if (
      req.user._id.toString() !== laptop.ownerId.toString() &&
      req.user.role !== EUserRole.ADMIN
    ) {
      return errorResponse(
        res,
        "You are not the owner of this laptop. Only the owner or an admin can delete it",
        403
      );
    }

    // Prevent deletion of blocked laptops
    if (laptop.isblock) {
      return errorResponse(res, "You cannot delete a blocked laptop", 403);
    }

    // Delete associated images
    if (laptop.images && laptop.images.length > 0) {
      for (const image of laptop.images) {
        const filePath = path.join(__dirname, "../../", image);

        // Check if the file exists before attempting to delete
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting file: ${filePath}`, err.message);
            }
          });
        } else {
          console.warn(`File not found, skipping deletion: ${filePath}`);
        }
      }
    }

    // Delete the laptop from the database
    await Laptop.findOneAndDelete({ _id: productId });

    return successResponse(
      res,
      "Laptop and associated images deleted successfully",
      200
    );
  } catch (err) {
    console.error("Error in deleteLaptop:", err);
    return errorResponse(
      res,
      "An error occurred while deleting the laptop",
      500
    );
  }
};

// Buy a laptop
exports.buyLaptop = async (req, res) => {
  try {
    const { quantity } = req.body;
    const laptop = await Laptop.findById(req.params.id);

    if (!laptop || !laptop.isAvailable)
      return errorResponse(res, "Laptop not available", 404);

    if (laptop.isblock)
      return errorResponse(res, "Laptop is blocked for buying", 403);

    // Uncomment if you want to restrict user from buying their own listing
    // if (laptop.ownerId.toString() === req.user._id.toString()) {
    //   return errorResponse(res, "You cannot buy your own laptop", 403);
    // }

    const updatedCount = laptop.count - Number(quantity);
    if (updatedCount < 0)
      return errorResponse(res, "Not enough stock available", 400);

    laptop.count = updatedCount;
    if (laptop.count < 1) {
      laptop.isAvailable = false;
    }

    await laptop.save();

    const unitPrice = laptop.price;
    const totalPrice = unitPrice * quantity;

    const newOrder = new PUECHASE({
      user: req.user._id,
      laptops: [
        {
          laptop: laptop._id,
          quantity,
          unitPrice,
          totalPrice,
        },
      ],
      finalPrice: totalPrice,
      status: "pending", // or EstatusOptions.PENDING if imported
    });

    await newOrder.save();

    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { items: { laptop: laptop._id } } }
    );

    return successResponse(res, "Laptop purchased successfully", newOrder);
  } catch (err) {
    return errorResponse(res, err.message || "Internal Server Error", 500);
  }
};

// Admin: Accept/Hide laptop
exports.updateLaptopStatus = async (req, res) => {
  try {
    const { status, productId } = req.body;
    let availability = false;
    if (status === "accepted") {
      availability = true;
    }
    if (status === "rejected") {
      availability = false;
    }
    const laptop = await Laptop.findById({ _id: productId });
    if (!laptop) {
      return errorResponse(res, "Laptop not found", 404);
    }

    // Check if the laptop is blocked
    if (laptop.isblock) {
      return errorResponse(res, "Cannot update a blocked laptop", 403);
    }
    const updatedLaptop = await Laptop.findByIdAndUpdate(
      productId,
      { isAvailable: availability, status: status },
      { new: true }
    );
    return successResponse(res, "Status updated successfully", updatedLaptop);
  } catch (err) {
    return errorResponse(res, err);
  }
};

// get purchase history of a user
exports.getPurchaseHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const { page = 1, limit = 10 } = req.query;

    const purchases = await PUECHASE.find({ user: userId })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate({
        path: "laptop",
        select: "title brand model price condition",
        populate: {
          path: "ownerId",
          select: "firstName lastName email",
        },
      })
      .sort({ createdAt: -1 });

    const totalPurchases = await PUECHASE.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalPurchases / limit);

    if (!purchases.length) {
      return errorResponse(res, "No purchase history found", 404);
    }
    return successResponse(res, "Purchase history retrieved successfully", {
      purchases,
      totalPurchases,
      totalPages,
      currentPage: Number(page),
    });
  } catch (err) {
    return errorResponse(res, err);
  }
};

// update status of laptop
exports.updateBlockStatus = async (req, res) => {
  try {
    const { isblock, productId } = req.body;

    const laptop = await Laptop.findById({ _id: productId });
    if (!laptop) {
      return errorResponse(res, "Laptop not found", 404);
    }
    const updatedLaptop = await Laptop.findByIdAndUpdate(
      productId,
      { isblock: isblock },
      { new: true }
    );
    return successResponse(res, "Status updated successfully", updatedLaptop);
  } catch (err) {
    return errorResponse(res, err);
  }
};

// get all aorders a user got
exports.getOrdersReceivedByUser = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const sellerId = req.user._id;

    const purchases = await PUECHASE.find()
      .populate({
        path: "user",
        select:
          "firstname lastName email phoneNo userName address city state country profile",
      })
      .populate({
        path: "laptops.laptop",
        select: "title brand model price condition ownerId status images",
        populate: {
          path: "ownerId",
          select: "firstName lastName email",
        },
      });

    // Filter purchases where at least one laptop is owned by the current user
    const sellerOrders = purchases.filter((purchase) =>
      purchase.laptops.some(
        (item) =>
          item.laptop &&
          item.laptop.ownerId &&
          item.laptop.ownerId._id.toString() === sellerId.toString()
      )
    );

    const totalOrders = sellerOrders.length;
    const totalPages = Math.ceil(totalOrders / limit);
    const paginatedOrders = sellerOrders.slice(
      (page - 1) * limit,
      page * limit
    );

    return successResponse(res, "Orders received successfully", {
      Laptop: paginatedOrders,
      totalLaptop: totalOrders,
      totalPages,
      currentPage: Number(page),
    });
  } catch (err) {
    return errorResponse(res, err);
  }
};

// update status of a purchased product
exports.updateOrderStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;
    const { status } = req.body;

    if (!["pending", "completed", "rejected"].includes(status)) {
      return errorResponse(res, "Invalid status provided.");
    }

    // Fetch the order with laptop populated
    const order = await PUECHASE.findOne({ _id: orderId });
    console.log("order", order);
    if (!order) {
      return errorResponse(res, "Order not found or laptop not available.");
    }

    // Check ownership
    // if (order.laptop.ownerId.toString() !== userId.toString()) {
    //   return errorResponse(res, "You are not authorized to update this order.");
    // }

    // If rejecting, increase the quantity of the laptop
    if (status === "rejected") {
      await Laptop.findByIdAndUpdate(order.laptop._id, {
        $inc: { quantity: order.quantity },
      });
    }

    order.status = status;
    await order.save();

    return successResponse(res, "Order status updated successfully", order);
  } catch (err) {
    return errorResponse(res, err);
  }
};
// above and below code do same thing
// update status of a purchased product
exports.updatePurchaseStatus = async (req, res) => {
  try {
    const laptopId = req.params.id;
    const status = req.body.status;

    // Find the purchase record
    const findLaptop = await PUECHASE.findOne({ _id: laptopId });
    console.log("findLaptop", findLaptop);
    if (!findLaptop) {
      return errorResponse(res, "Laptop purchase record not found", 404);
    }

    if (status === "accepted") {
      const updatedPurchase = await PUECHASE.findByIdAndUpdate(
        findLaptop._id,
        { status },
        { new: true }
      );
      return successResponse(
        res,
        "Laptop purchase confirmed successfully",
        updatedPurchase
      );
    } else if (status === "rejected") {
      await PUECHASE.findByIdAndUpdate(
        findLaptop._id,
        { status },
        { new: true }
      );

      const updatedLaptop = await Laptop.findByIdAndUpdate(
        findLaptop.laptop,
        { $inc: { count: findLaptop.quantity } },
        { new: true }
      );

      return successResponse(
        res,
        "Laptop purchase rejected successfully",
        updatedLaptop
      );
    } else {
      return errorResponse(res, "Invalid status provided", 400);
    }
  } catch (error) {
    return errorResponse(res, error.message || "An error occurred");
  }
};

// get all purchased products for admin
exports.allProducts = async (req, res) => {
  try {
    // Fetch the order with laptop populated
    const order = await PUECHASE.find()
      .populate("laptops.laptop") // Populate laptop inside laptops array
      .populate("user", "firstName lastName email"); // Populate only user details

    return successResponse(res, "Order status updated successfully", order);
  } catch (err) {
    return errorResponse(res, err);
  }
};
