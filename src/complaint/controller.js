const Complaint = require("../../models/complaints");
const User = require("../../models/userdata");
const Laptop = require("../../models/laptop");
const { ComplaintSchema } = require("../../libs/dtos/validator");
const { successResponse } = require("../../libs/responseMessage/success");
const { errorResponse } = require("../../libs/responseMessage/error");
const { EUserRole, EstatusOptions, DB_Tables } = require("../../utils/enum");
const userdata = require("../../models/userdata");

// Create a new complaint
exports.createComplaint = async (req, res) => {
  try {
    const { error, value } = ComplaintSchema.validate(req.body);

    const { laptopId, description, status } = req.body;
    const findUser = await Laptop.findById(laptopId);
    if (!findUser) {
      return errorResponse(res, "User not found", 404);
    }
    const complaint = new Complaint({
      userId: req.user._id,
      description: description,
      laptopId: laptopId,
    });
    await complaint.save();
    return successResponse(res, "Complaint created successfully", complaint);
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Get all complaints
exports.getAllComplaints = async (req, res) => {
  try {
    const myLaptops = await Laptop.find({ ownerId: req.user._id }, "_id");
    const myLaptopIds = myLaptops.map((laptop) => laptop._id);

    // Step 2: Find complaints against those laptops
    const complaints = await Complaint.find({ laptopId: { $in: myLaptopIds } })
      .populate("userId", "name email") // Complainer details
      .populate("laptopId", "title brand model images"); // Laptop info

    return successResponse(res, "Complaint fetched successfully", complaints);
  } catch (error) {
    return errorResponse(res, error);
  }
};
exports.getAllComplaintsAdmin = async (req, res) => {
  try {
    const complaint = await Complaint.find()
      .populate("userId")
      .populate({
        path: "laptopId",
        populate: {
          path: "ownerId", // assuming ownerId is inside laptop schema
        },
      });
    return successResponse(res, "Complaint fetched successfully", complaint);
  } catch (error) {
    return errorResponse(res, error);
  }
};
// Get all complaints
exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user.id })
      .populate("userId", "name email") // Complainer details
      .populate("laptopId", "title brand model images"); // Laptop info

    return successResponse(res, "Complaint fetched successfully", complaints);
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Get a specific complaint by ID
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate(
      "userId"
    );
    if (!complaint) return errorResponse(res, "Complaint not found", 404);
    return successResponse(res, "Complaint fetched successfully", complaint);
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Update a complaint
exports.updateComplaint = async (req, res) => {
  try {
    const { description, status } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { description, status },
      { new: true }
    );
    if (!complaint) return errorResponse(res, "Complaint not found", 404);

    return successResponse(res, "Complaint updated successfully", complaint);
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Delete a complaint
exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) return errorResponse(res, "Complaint not found", 404);
    return successResponse(res, "Complaint deleted successfully", complaint);
  } catch (error) {
    return errorResponse(res, error);
  }
};

//update a complaint status
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const findUser = userdata.findById(id);
    if (!EstatusOptions.includes(status)) {
      return errorResponse(res, "Invalid status value", 400);
    }
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return errorResponse(res, "Complaint not found", 404);
    }
    complaint.status = status;
    await complaint.save();
    if (status === "accepted") {
      const user = await userdata.findById(complaint.userId);
      if (!user) {
        return errorResponse(res, "User not found", 404);
      }

      user.warningCount = (user.warningCount || 0) + 1;

      if (user.warningCount > 3) {
        user.isblock = true;
        status = EstatusOptions.BLOCKED;
      }

      await user.save();
    }
    return successResponse(
      res,
      `Complaint status updated to ${status}`,
      complaint
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};
