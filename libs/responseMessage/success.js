exports.successResponse = (res, message, result, statusCode = 200) => {
  res.status(statusCode).json({
    status: "success",
    message,
    result,
  });
};
