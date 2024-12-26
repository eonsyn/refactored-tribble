const mongoose = require("mongoose");

// Define the Admin schema
const AdminSchema = new mongoose.Schema({
  password: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
    unique: true,
  },
});

// Export the Admin model
const Admin = mongoose.model("Admin", AdminSchema);
module.exports = Admin;
