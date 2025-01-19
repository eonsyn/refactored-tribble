const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true, // Email is required
    unique: true, // Ensure unique emails
    trim: true, // Remove whitespace from email
    lowercase: true, // Store email in lowercase
  },
  userName: {
    type: String,
    required: true, // Username is required
    trim: true, // Remove whitespace from username
  },
  name: {
    type: String,
    required: true, // Name is required
    trim: true, // Remove whitespace from name
  },
  review: {
    type: String, // User can provide a review as a string
    trim: true,
  },
  accountCreatedAt: {
    type: Date,
    default: Date.now, // Automatically set the creation date
  },
  profilePhotoInitial: {
    type: String, // Store the first letter of the name
    trim: true,
    default: function () {
      return this.name ? this.name[0].toUpperCase() : ""; // Extract the first letter of the name
    },
  },
  password: {
    type: String,
    required: true, // Password is required
    minlength: 6, // Minimum password length
  },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
