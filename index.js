
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
var http = require("http");
require("dotenv").config();
const app = express();
const url = process.env.DB_URI;
const path = require("path");
const { dbConnection } = require("./src/configs/config");
const frontendUrl = process.env.CLIENT_URL;
const allowedOrigins = [
  frontendUrl,
  "https://usedlaptopbuyingandselling.vercel.app",
  "http://localhost:3000",
];
console.log("Allowed Origins:", allowedOrigins);
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type, Authorization, auth-token",
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.json({ limit: "5000mb" }));
app.use(express.urlencoded({ extended: true, limit: "5000mb" }));

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.urlencoded({ extended: true }));

dbConnection()
  .then(() => console.log("DB connected"))
  .catch((err) => {
    console.log("error in connection", err);
  });

let port = process.env.PORT || 4005;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

require("./routes")(app);

app.get("/", (req, res) => {
  res.status(200).send("Hello! backend is running....");
});

// http.get(baseURL);
// try {
//   con.on("open", () => {
//   });
// } catch (error) {
//   console.log("Error: " + error);
// }

module.exports = app;

