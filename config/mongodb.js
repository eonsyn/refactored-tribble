const mongodb = require("mongoose");
require("dotenv").config();

const mongourl = process.env.MONGOURL;

const connectdb = async () => {
  mongodb
    .connect(mongourl)
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("Error connecting to MongoDB:", error));
};

module.exports = connectdb;
