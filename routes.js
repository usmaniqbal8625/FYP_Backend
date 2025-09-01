"use strict";

module.exports = (app) => {
  app.use("/auth", require("./api/auth"));
  app.use("/users", require("./api/user"));
  app.use("/laptop", require("./api/laptop"));
  app.use("/review", require("./api/review"));
  app.use("/cart", require("./api/cart"));
  app.use("/complaint", require("./api/complaint"));
};
