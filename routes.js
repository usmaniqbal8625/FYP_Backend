"use strict";

module.exports = (app) => {
  app.use("/auth", require("./src/auth"));
  app.use("/users", require("./src/user"));
  app.use("/laptop", require("./src/laptop"));
  app.use("/review", require("./src/review"));
  app.use("/cart", require("./src/cart"));
  app.use("/complaint", require("./src/complaint"));
};
