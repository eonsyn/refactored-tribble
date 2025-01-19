const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true, // Username is required
    trim: true, // Remove unnecessary whitespace
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true, // User ID is required
  },
  userProfile: {
    type: String, // URL or identifier for the user's profile photo
    trim: true,
    default: null, // Optional field with a default value
  },
  review: {
    type: String,
    required: true, // Review content is required
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set the creation date
  },
  likedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // List of users who liked the review
    },
  ],
  dislikedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // List of users who disliked the review
    },
  ],
  filmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Film", // Reference to the Film model
    required: true, // Film ID is required
  },
});

module.exports = mongoose.model("Review", ReviewSchema);
