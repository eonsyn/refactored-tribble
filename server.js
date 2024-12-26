const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectdb = require("./config/mongodb");

const app = express();
connectdb();
const corsConfig = {
  origin: ["https://moodyfilm.netlify.app"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};
// app.options("",cors(corsConfig));
app.use(cors(corsConfig));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello from Express!"); // Basic route to test
});
app.get("/home", async (req, res) => {
  res.send("you are at home page .");
});
const port = 2300;
app.listen(port, () => {
  console.log("Server is listening on port 2300");
});
