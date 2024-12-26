const express = require("express");
const router = express.Router();
const axios = require("axios");
const jsdom = require("jsdom");
require("dotenv").config();
const authenticateAdmin = require("../Middelware/admin.auth.midddleware");
const RequestFilm = require("../models/RequestFilm");
const { JSDOM } = jsdom;
const Film = require("../Models/Films"); // Replace with the actual path to your Film model

router.get("/test", (req, res) => {
  res.send("This is test .....");
});

module.exports = router;
