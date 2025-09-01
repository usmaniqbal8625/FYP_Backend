"use strict";

module.exports = (app) => {
  app.use("/v1/auth", require("./api/auth"));
  app.use("/v1/users", require("./api/user"));
  app.use("/v1/laptop", require("./api/laptop"));
  app.use("/v1/review", require("./api/review"));
  app.use("/v1/cart", require("./api/cart"));
  app.use("/v1/complaint", require("./api/complaint"));
};
