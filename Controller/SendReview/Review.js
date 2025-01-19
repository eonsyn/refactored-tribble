const Film = require("../../Models/Films");
const User = require("../../Models/User");
const Review = require("../../Models/Review");

const sendReview = async (req, res) => {
  try {
    const { filmId, review } = req.body;
    const { userName, userId } = req.User;

    // Validate required fields
    if (!userId || !filmId || !review) {
      return res
        .status(400)
        .json({ error: "User ID, Film ID, and review are required." });
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if the film exists
    const film = await Film.findById(filmId);
    if (!film) {
      return res.status(404).json({ error: "Film not found." });
    }

    // Create a new review
    const newReview = new Review({
      userId,
      userName: userName || user.userName, // Use the provided username or fallback to the user's stored username
      userProfile: user.profilePhotoInitial, // Default to empty if not provided
      review,
      filmId,
    });

    // Save the review to the database
    await newReview.save();

    res.status(201).json({
      message: "Comment send successfully!",
      review: newReview,
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
const likeReview = async (req, res) => {
  try {
    const { reviewId } = req.body;
    const { userId } = req.User;
    // Validate inputs
    if (!userId || !reviewId) {
      return res
        .status(400)
        .json({ error: "User ID and Review ID are required." });
    }

    // Find the review by ID
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found." });
    }

    // Check if user already liked the review
    const userLikedIndex = review.likedBy.indexOf(userId);
    const userDislikedIndex = review.dislikedBy.indexOf(userId);

    if (userLikedIndex > -1) {
      // Undo like
      review.likedBy.splice(userLikedIndex, 1);
    } else {
      // Remove dislike if present
      if (userDislikedIndex > -1) {
        review.dislikedBy.splice(userDislikedIndex, 1);
      }
      // Add like
      review.likedBy.push(userId);
    }

    // Save the updated review
    await review.save();

    res.status(200).json({
      message: "Like interaction updated successfully!",
      review: {
        id: review._id,
        likes: review.likedBy.length,
        dislikes: review.dislikedBy.length,
        likedBy: review.likedBy,
        dislikedBy: review.dislikedBy,
      },
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const dislikeReview = async (req, res) => {
  try {
    const { reviewId } = req.body;
    const { userId } = req.User;
    // Validate inputs
    if (!userId || !reviewId) {
      return res
        .status(400)
        .json({ error: "User ID and Review ID are required." });
    }

    // Find the review by ID
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found." });
    }

    // Check if user already disliked the review
    const userLikedIndex = review.likedBy.indexOf(userId);
    const userDislikedIndex = review.dislikedBy.indexOf(userId);

    if (userDislikedIndex > -1) {
      // Undo dislike
      review.dislikedBy.splice(userDislikedIndex, 1);
    } else {
      // Remove like if present
      if (userLikedIndex > -1) {
        review.likedBy.splice(userLikedIndex, 1);
      }
      // Add dislike
      review.dislikedBy.push(userId);
    }

    // Save the updated review
    await review.save();

    res.status(200).json({
      message: "Dislike interaction updated successfully!",
      review: {
        id: review._id,
        likes: review.likedBy.length,
        dislikes: review.dislikedBy.length,
        likedBy: review.likedBy,
        dislikedBy: review.dislikedBy,
      },
    });
  } catch (error) {
    console.error("Error toggling dislike:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const allReviews = async (req, res) => {
  try {
    const { filmId } = req.params;

    // Validate the filmId
    if (!filmId) {
      return res.status(400).json({ error: "Film ID is required." });
    }

    // Check if the film exists
    const film = await Film.findById(filmId);
    if (!film) {
      return res.status(404).json({ error: "Film not found." });
    }

    // Fetch all reviews for the given film ID
    const reviews = await Review.find({ filmId }).sort({ createdAt: -1 }); // Sort reviews by most recent

    // If no reviews found, return an empty list
    if (reviews.length === 0) {
      return res
        .status(200)
        .json({ message: "No reviews found.", reviews: [] });
    }

    // Return the reviews
    res.status(200).json({
      message: "Reviews fetched successfully!",
      reviews: reviews.map((review) => ({
        id: review._id,
        userId: review.userId,
        userName: review.userName,
        userProfile: review.userProfile,
        review: review.review,
        likes: review.likedBy.length,
        likedBy: review.likedBy,
        dislikes: review.dislikedBy.length,
        dislikedBy: review.dislikedBy,
        createdAt: review.createdAt,
        likedBy: review.likedBy,
        dislikedBy: review.dislikedBy,
      })),
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
const deleteReview = async (req, res) => {
  try {
    // Extract reviewId from the request parameters
    const { reviewId } = req.params;

    // Extract userId from the request user (assumes middleware has added req.User)
    const { userId } = req.User;

    // Find the review by its ID
    const review = await Review.findById(reviewId);

    // Check if the review exists
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Compare user IDs after converting both to strings
    if (review.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    // Return success response
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

module.exports = {
  deleteReview,
  sendReview,
  likeReview,
  dislikeReview,
  allReviews,
};
