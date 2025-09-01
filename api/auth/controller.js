const { successResponse } = require("../../libs/responseMessage/success");
const { errorResponse } = require("../../libs/responseMessage/error");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../../models/userdata");
const { userLoginSchemaValidator } = require("../../libs/dtos/validator");
const { forgetPassword } = require("../../utils/emailTemplate/forgetPAssword");

exports.login = async (req, res) => {
  try {
    const { error, value } = userLoginSchemaValidator.validate(req.body);
    if (error) return errorResponse(res, error.message);

    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) return errorResponse(res, "User not found", 404);

    if (!user.emailVerified)
      return errorResponse(res, "Please verify your email first to login.");
    if (user.isblock)
      return errorResponse(res, "Your account is blocked by Admin");

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return errorResponse(res, "Invalid credentials", 401);

    let data = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profile: user?.profile,
    };
    const token = jwt.sign(data, process.env.TOKEN_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    return successResponse(res, "login successsful", { token, data });
  } catch (error) {
    return errorResponse(res, error);
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const token = req.params.token;
    const user_password = req.body.password;
    if (user_password) {
      if (!isValidPassword(user_password)) {
        return errorResponse(
          res,
          "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character.",
          400
        );
      }
    }
    if (!token) {
      return errorResponse(res, "token must be required");
    }
    if (!user_password) {
      return errorResponse(res, "password must be required", 404);
    }
    const verify = await jwt.verify(token, process.env.TOKEN_SECRET);

    if (!verify) {
      return errorResponse(res, "Token is not valid");
    }
    const userObj = await User.findOne({ _id: verify.id });
    if (!userObj) return errorResponse(res, "User not found!", 404);

    const salt = await bcrypt.genSalt(10);
    userObj.password = await bcrypt.hash(user_password, salt);
    await userObj.save();

    return successResponse(
      res,
      "User password has been reset successfully",
      200
    );
  } catch (err) {
    return errorResponse(res, err);
  }
};

exports.forgotPassword = async (req, res) => {
  const user_email = req.body.email;

  try {
    if (!user_email) {
      return errorResponse(res, "User email must be provided", 404);
    }

    const user = await User.findOne({ email: user_email });
    if (!user) {
      return errorResponse(res, `User with email ${user_email} not found`, 404);
    }

    const token = jwt.sign({ id: user._id }, process.env.TOKEN_SECRET, {
      expiresIn: "1d", 
    });
    const url = `${process.env.CLIENT_URL}/forget-password/${token}`;

    await sendEmail(
      user.email,
      "Password Reset Request",
      forgetPassword(`${user.firstName} ${user.lastName} `, url)
    );

    return successResponse(
      res,
      "Password reset instructions have been sent to your email. Please check your inbox and follow the instructions to reset your password.",
      200
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};
