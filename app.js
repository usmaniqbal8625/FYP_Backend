const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
var http = require("http");
require("dotenv").config();
const app = express();
const url = process.env.MONGODB_URI;
const path = require("path");

mongoose.connect(url);
const con = mongoose.connection;
app.use(
  cors({
    allowedHeaders: ["Authorization", "Content-Type", "auth-token"],
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  })
);
app.use(express.json());
app.use(express.json({ limit: "5000mb" })); 
app.use(express.urlencoded({ extended: true, limit: "5000mb" })); 

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.urlencoded({ extended: true }));

http.get(process.env.BASE_URL);
try {
  con.on("open", () => {
  });
} catch (error) {
  console.log("Error: " + error);
}
let port = process.env.PORT;
require("./routes")(app);

app.listen(port, () => {
  console.log("Server started on port " + port);
});
