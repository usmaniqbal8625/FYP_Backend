const userdata = require("../../models/userdata");
const LAPTOP = require("../../models/laptop");
const PURCHASED = require("../../models/purchase");
const { successResponse } = require("../../libs/responseMessage/success");
const { errorResponse } = require("../../libs/responseMessage/error");
const { validate } = require("class-validator");
const { plainToInstance } = require("class-transformer");
const { EUserRole, EstatusOptions, DB_Tables } = require("../../utils/enum");
const purchaseData = require("../../models/purchase");
const bcrypt = require("bcryptjs");
const isValidPassword = (password) => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};
const moment = require("moment");

const { createUserSchemaValicator } = require("../../libs/dtos/validator");
const { sendEmail } = require("../../utils/sendEmail");
const { sendCustomEmail } = require("../../utils/sendEmail");
const { verifyAccount } = require("../../utils/emailTemplate/verifyAccount");
const { reverifyAccount } = require("../../utils/emailTemplate/reverify");
const { userQueryTemplate } = require("../../utils/emailTemplate/customEmail");
const jwt = require("jsonwebtoken");

const generateActivationToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.TOKEN_SECRET, {
    expiresIn: "1d", // Token expires in 1 hour
  });
};
const verifyToken = (token) => {
  return jwt.verify(token, process.env.TOKEN_SECRET);
};
const createUser = async (req, res) => {
  try {
    const { error, value } = createUserSchemaValicator.validate(req.body);
    if (error) {
      return errorResponse(res, error);
    }

    const {
      firstName,
      lastName,
      userName,
      age,
      email,
      phoneNo,
      address,
      country,
      city,
      state,
      poBoxNumber,
      isActive,
      password,
      status,
      profile,
    } = value;

    // Check for unique email
    const findUserEmail = await userdata.findOne({ email });
    const findUserphone = await userdata.findOne({ phoneNo });
    const findUserName = await userdata.findOne({ userName });
    if (findUserEmail) {
      return errorResponse(res, "user email already exists", 404);
    }
    if (findUserphone) {
      return errorResponse(res, "user phoneNo already exists", 404);
    }
    if (findUserName) {
      return errorResponse(res, "userName already exists", 404);
    }
    let pass;
    if (password) {
      if (!isValidPassword(password)) {
        return errorResponse(
          res,
          "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character.",
          400
        );
      }
      const salt = await bcrypt.genSalt(10);
      pass = await bcrypt.hash(password, salt);
    }
    const profilePath = req.file ? req.file.path : "";

    // Create a new user
    const newUser = new userdata({
      firstName,
      userName,
      lastName,
      age,
      email,
      phoneNo,
      address,
      country,
      city,
      state,
      poBoxNumber,
      isActive,
      password: pass,
      status,
      profile: profilePath,
    });

    await newUser.save();
    console.log(newUser);
    const token = generateActivationToken(newUser._id);
    const link = `${process.env.CLIENT_URL}/verify/email?token=${token}`;
    await sendEmail(
      email,
      "Account Created",
      verifyAccount(`${firstName} ${lastName}`, password, link)
    );
    return successResponse(res, "user created successfully", newUser);
  } catch (error) {
    return errorResponse(res, error);
  }
};
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: "Token is missing" });
    }

    const decoded = verifyToken(token);
    const { id } = decoded;
    console.log(id);
    const user = await userdata.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.status = EstatusOptions.ACCEPTED;
    user.isActive = true;
    user.emailVerified = true;
    await user.save();
    return res.status(200).json({
      title: "verified",
      description: "Email verified successfully",
    });
    // res.redirect(`${process.env.CLIENT_URL}/login`);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to activate account", error });
  }
};
const getUsers = async (req, res) => {
  try {
    const users = await userdata.find({ role: "user" });
    successResponse(res, "users fetched successfully", users);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userdata.findById(id);

    if (!user) {
      return errorResponse(res, "user not found", 404);
    }
    if (userdata.profile) {
      laptop.images.forEach((image) => {
        const filePath = path.join(__dirname, "../../", image);
        fs.unlink(filePath, (err) => {
          if (err)
            return errorResponse(res, `Error deleting file: ${filePath}`, err);
        });
      });
    }
    await userdata.findByIdAndDelete(id);
    return successResponse(res, "user deleted successfully");
  } catch (error) {
    return errorResponse(res, error);
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }

    const user = await userdata.findOne({ email });
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    if (user.emailVerified) {
      return errorResponse(
        res,
        "Email is already verified. No further action required.",
        400
      );
    }

    const MAX_RESEND_ATTEMPTS = 3;
    const COOLDOWN_PERIOD = 5 * 60 * 1000;
    const now = Date.now();

    if (user.resendCount >= MAX_RESEND_ATTEMPTS) {
      const timeSinceLastAttempt = now - user.lastResendAttempt;

      if (timeSinceLastAttempt < COOLDOWN_PERIOD) {
        const timeLeft = Math.ceil(
          (COOLDOWN_PERIOD - timeSinceLastAttempt) / 1000
        );
        return errorResponse(
          res,
          `Too many attempts. Please wait ${timeLeft} seconds before trying again.`,
          429
        );
      } else {
        user.resendCount = 0;
      }
    }

    user.resendCount = (user.resendCount || 0) + 1;
    user.lastResendAttempt = now;

    await user.save();
    console.log("user is", user);

    const token = generateActivationToken(user._id);
    console.log("token generated is", token);

    const link = `${process.env.CLIENT_URL}/verify/email?token=${token}`;

    await sendEmail(
      email,
      "Resend Email Verification",
      reverifyAccount(`${user.firstName} ${user.lastName}`, link)
    );

    return successResponse(
      res,
      "Verification email has been resent successfully. Please check your inbox."
    );
  } catch (error) {
    console.error("Error resending verification email:", error);
    return errorResponse(
      res,
      "An error occurred. Please try again later.",
      500
    );
  }
};

const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching user with ID: ${id}`);

    const user = await userdata.findById(id);

    if (!user) {
      return errorResponse(res, "user not found", 404);
    }

    return successResponse(res, "user found", user);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const currentUser = await userdata.findById(id);

    if (!currentUser) {
      return errorResponse(res, "User not found", 404);
    }
    if (updateData.userName && updateData.userName !== currentUser.userName) {
      const findUserName = await userdata.findOne({
        userName: updateData.userName,
      });
      if (findUserName) {
        return errorResponse(res, "userName already exists", 404);
      }
    }
    if (updateData.email && updateData.email !== currentUser.email) {
      const findUserEmail = await userdata.findOne({
        email: updateData.email,
      });
      if (findUserEmail) {
        return errorResponse(res, "Email already exists", 404);
      }
    }
    if (updateData.phoneNo && updateData.phoneNo !== currentUser.phoneNo) {
      const findUserPhone = await userdata.findOne({
        phoneNo: updateData.phoneNo,
      });
      if (findUserPhone) {
        return errorResponse(res, "Phone number already exists", 404);
      }
    }

    // if (updateData.password) {
    //   if (!isValidPassword(updateData.password)) {
    //     return errorResponse(
    //       res,
    //       "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character.",
    //       400
    //     );
    //   }
    //   const salt = await bcrypt.genSalt(10);
    //   updateData.password = await bcrypt.hash(updateData.password, salt);
    // }

    const user = await userdata.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    return successResponse(res, "User updated successfully", user);
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Update Profile Image
const updateProfileImage = async (req, res) => {
  console.log("HIIIIIIIIIIIII");
  try {
    const id = req.user._id;
    console.log("HELOOOOOOOOOO", req.file);
    console.log("REQ BODY:", req.body);

    const user = await userdata.findById(id);
    if (!user) {
      return errorResponse(res, "User not found HI", 404);
    }

    if (!req.file) {
      return errorResponse(res, "No file uploaded", 400);
    }
    const filePath = `uploads/profiles/${req.file.filename}`;

    user.profile = filePath;
    await user.save();

    return successResponse(res, "Profile image updated successfully", user);
  } catch (error) {
    return errorResponse(res, error);
  }
};
const updateProfileImages = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("HELOOOOOOOOOO", req.file);
    console.log("REQ BODY:", req.body);

    const user = await userdata.findById(id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    if (!req.file) {
      return errorResponse(res, "No file uploaded", 400);
    }

    const filePath = `uploads/profiles/${req.file.filename}`;

    user.profile = filePath;
    await user.save();

    return successResponse(res, "Profile image updated successfully", user);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "accepted", "rejected"];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, "Invalid status value", 400);
    }

    const user = await userdata.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    return successResponse(res, "User status updated successfully", user);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const blocking = async (req, res) => {
  try {
    const { id } = req.params;
    const { isblock } = req.body;

    const validStatuses = [true, false];
    if (!validStatuses.includes(isblock)) {
      return errorResponse(res, "Invalid block status value", 400);
    }

    const user = await userdata.findByIdAndUpdate(
      id,
      { isblock },
      { new: true }
    );
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }
    if (isblock === true)
      return successResponse(res, "User blocked successfully", user);
    else return successResponse(res, "User un-blocked successfully", user);
  } catch (error) {
    return errorResponse(res, error);
  }
};
const count = async (req, res) => {
  try {
    const users = await userdata.find({ isActive: true });
    const now = new Date();
    const fiveYearsAgo = moment(now).subtract(5, "years").toDate();
    const startOfDay = moment(now).startOf("day").toDate();
    const startOfWeek = moment(now).startOf("week").toDate();
    const startOfMonth = moment(now).startOf("month").toDate();
    const salesData = await purchaseData.aggregate([
      {
        $match: {
          status: "COMPLETED", // Filter only completed purchases
          createdAt: { $gte: fiveYearsAgo }, // Consider records from the last 5 years
        },
      },
      {
        $facet: {
          dailySales: [
            { $match: { createdAt: { $gte: startOfDay } } },
            {
              $group: {
                _id: null,
                totalSales: { $sum: { $toDouble: "$price" } },
              },
            },
          ],
          weeklySales: [
            { $match: { createdAt: { $gte: startOfWeek } } },
            {
              $group: {
                _id: null,
                totalSales: { $sum: { $toDouble: "$price" } },
              },
            },
          ],
          monthlySales: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            {
              $group: {
                _id: null,
                totalSales: { $sum: { $toDouble: "$price" } },
              },
            },
          ],
          fiveYearSales: [
            {
              $group: {
                _id: null,
                totalSales: { $sum: { $toDouble: "$price" } },
              },
            },
          ],
        },
      },
    ]);

    successResponse(res, "users fetched successfully", {
      activeUser: users.length,
      dailySales: salesData[0]?.dailySales[0]?.totalSales || 0,
      weeklySales: salesData[0]?.weeklySales[0]?.totalSales || 0,
      monthlySales: salesData[0]?.monthlySales[0]?.totalSales || 0,
      fiveYearSales: salesData[0]?.fiveYearSales[0]?.totalSales || 0,
    });
  } catch (error) {
    return errorResponse(res, error);
  }
};
const sendCustomEmails = async (req, res) => {
  try {
    const { name, email, subject, body } = req.body;
    await sendCustomEmail(
      email,
      subject,
      userQueryTemplate(name, email, subject, body)
    );
    successResponse(res, "users fetched successfully");
  } catch (error) {
    return errorResponse(res, error);
  }
};

const adminDashboard = async (req, res) => {
  try {
    const totalUsers = await userdata.countDocuments();
    const pendingUsers = await userdata.countDocuments({ status: "pending" });
    const acceptedUsers = await userdata.countDocuments({ status: "accepted" });

    const pendingProduct = await LAPTOP.countDocuments({ status: "pending" });
    const acceptedProducts = await LAPTOP.countDocuments({
      status: "accepted",
    });

    // Count laptops sold in completed purchases
    const soldProducts = await PURCHASED.aggregate([
      { $match: { status: "completed" } },
      { $unwind: "$laptops" },
      { $group: { _id: null, totalSold: { $sum: "$laptops.quantity" } } },
    ]);

    const totalSoldProducts = soldProducts[0]?.totalSold || 0;

    const laptops = await LAPTOP.aggregate([
      {
        $group: {
          _id: null,
          totalLaptops: { $sum: 1 },
          totalQuantity: { $sum: "$count" },
        },
      },
    ]);

    const totalLaptops = laptops[0]?.totalLaptops || 0;
    const totalQuantity = laptops[0]?.totalQuantity || 0;

    const moment = require("moment");

    const startOfDay = moment().startOf("day").toDate();
    const startOfWeek = moment().startOf("week").toDate();
    const startOfMonth = moment().startOf("month").toDate();
    const startOfYear = moment().startOf("year").toDate();

    // Revenue breakdown based on finalPrice from PURCHASED
    const revenue = await PURCHASED.aggregate([
      { $match: { status: "completed" } },
      {
        $facet: {
          today: [
            { $match: { createdAt: { $gte: startOfDay } } },
            { $group: { _id: null, total: { $sum: "$finalPrice" } } },
          ],
          week: [
            { $match: { createdAt: { $gte: startOfWeek } } },
            { $group: { _id: null, total: { $sum: "$finalPrice" } } },
          ],
          month: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: "$finalPrice" } } },
          ],
          year: [
            { $match: { createdAt: { $gte: startOfYear } } },
            { $group: { _id: null, total: { $sum: "$finalPrice" } } },
          ],
        },
      },
    ]);

    const todayRevenue = revenue[0]?.today[0]?.total || 0;
    const weeklyRevenue = revenue[0]?.week[0]?.total || 0;
    const monthlyRevenue = revenue[0]?.month[0]?.total || 0;
    const yearlyRevenue = revenue[0]?.year[0]?.total || 0;

    // Get latest 5 purchases
    const latestPurchase = await PURCHASED.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "firstName lastName email")
      .populate("laptops.laptop", "title price quantity status");

    return successResponse(res, "data fetched", {
      totalUsers,
      pendingUsers,
      acceptedUsers,
      totalProduct: { totalLaptops, totalQuantity },
      pendingProduct,
      acceptedProducts,
      soldProducts: totalSoldProducts,
      latestPurchase,
      revenue: {
        today: todayRevenue,
        thisWeek: weeklyRevenue,
        thisMonth: monthlyRevenue,
        thisYear: yearlyRevenue,
      },
    });
  } catch (error) {
    return errorResponse(res, error);
  }
};

const laptopSale = async (req, res) => {
  try {
    const { filter } = req.params;
    const now = new Date();
    let startDate;

    switch (filter) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "weekly":
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "last5Years":
        startDate = new Date(now.getFullYear() - 5, 0, 1);
        break;
      default:
        startDate = new Date(0); // all-time
    }

    const brandSales = await PURCHASED.aggregate([
      {
        $match: {
          status: "completed",
          updatedAt: { $gte: startDate },
        },
      },
      {
        $unwind: "$laptops",
      },
      {
        $lookup: {
          from: "laptops",
          localField: "laptops.laptop",
          foreignField: "_id",
          as: "laptopDetails",
        },
      },
      {
        $unwind: "$laptopDetails",
      },
      {
        $project: {
          brand: "$laptopDetails.brand",
          quantity: "$laptops.quantity",
          total: "$laptops.totalPrice",
        },
      },
      {
        $group: {
          _id: "$brand",
          totalSales: { $sum: "$total" },
        },
      },
      {
        $sort: { totalSales: -1 },
      },
    ]);

    return successResponse(res, "laptopSale data fetched", brandSales);
  } catch (error) {
    return errorResponse(res, error);
  }
};
const monthlyRevinum = async (req, res) => {
  try {
    const revenue = await PURCHASED.aggregate([
      {
        $match: { status: "completed" },
      },
      {
        $unwind: "$laptops",
      },
      {
        $lookup: {
          from: "laptops",
          localField: "laptops.laptop",
          foreignField: "_id",
          as: "laptopData",
        },
      },
      {
        $unwind: "$laptopData",
      },
      {
        $project: {
          createdAt: 1,
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          totalPrice: "$laptops.totalPrice",
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          total: { $sum: "$totalPrice" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const monthlyRevenue = monthNames.map((month, index) => {
      const found = revenue.find((item) => item._id.month === index + 1);
      return {
        month,
        total: found ? found.total : 0,
      };
    });

    return successResponse(res, "Monthly revenue", { monthlyRevenue });
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = {
  createUser,
  verifyEmail,
  resendVerificationEmail,
  getUsers,
  deleteUser,
  getSingleUser,
  updateUser,
  updateProfileImage,
  updateProfileImages,
  updateStatus,
  blocking,
  count,
  sendCustomEmails,
  adminDashboard,
  laptopSale,
  monthlyRevinum,
};
