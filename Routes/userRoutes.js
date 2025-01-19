const express = require("express");
const router = express.Router();
require("dotenv").config();
const {
  sendReview,
  likeReview,
  dislikeReview,
  allReviews,
  deleteReview,
} = require("../Controller/SendReview/Review");
const {
  userLogin,
  userSignup,
} = require("../Controller/UserController/Userauth");
const authenticateUser = require("../Middelware/user.auth.middleware");
//auth routes
router.post("/login", userLogin);
router.post("/signup", userSignup);
//review routes
router.post("/sendReview", authenticateUser, sendReview);
router.get("/allReviews/:filmId", allReviews);
router.post("/likeReview", authenticateUser, likeReview);
router.post("/dislikeReview", authenticateUser, dislikeReview);
router.delete("/deleteReview/:reviewId", authenticateUser, deleteReview);
module.exports = router;
