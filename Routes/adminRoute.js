const express = require("express");
const router = express.Router();
const Admin = require("../Models/Admin");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const authenticateAdmin = require("../Middelware/admin.auth.midddleware");
const Film = require("../Models/Films");
const axios = require("axios");
router.post("/login", async (req, res) => {
  try {
    const { userId, password } = req.body;

    // Validate input
    if (!userId || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Check if the admin exists
    const admin = await Admin.findOne({ userId }); // Renamed variable
    if (!admin) {
      return res.status(404).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { role: "Admin", userId: admin.userId }, // Payload
      process.env.JWT_SECRET, // Secret key
      { expiresIn: "1h" } // Token expiry
    );

    // Send token in a cookie
    res
      .cookie("auth_token", token, {
        httpOnly: true, // Prevent access from client-side JavaScript
        secure: true, // Use secure cookies in production
        sameSite: "None", // Required for cross-origin cookies
        maxAge: 3600000, // 1 hour
      })
      .status(200)
      .json({ message: "Login successful", token: token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// router.post("/signup", async (req, res) => {

//   try {
//     const { userId, password } = req.body;

//     // Validate input
//     if (!userId || !password) {
//       return res
//         .status(400)
//         .json({ message: "Email and password are required" });
//     }

//     const saltRounds = 10;
//     const hashedPassword = await bcrypt.hash(password, saltRounds);
//     const newAdmin = new Admin({
//       password: hashedPassword,
//       userId,
//     });
//     await newAdmin.save();
//     res.status(201).json({ message: "Admin registered successfully!" });
//   } catch (error) {
//     console.error("Error during login:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// POST /sendFormData it take form data to update the data in db

// POST it take id and update the save the which is in the  database

router.post("/sendFormData", authenticateAdmin, async (req, res) => {
  try {
    const {
      filmTitle,
      downloadData,
      imageData,
      description,
      imdbRating,
      directedBy,
      releaseDate,
      genre,
      urlOfThumbnail,
      urlOfPost, // Added urlOfPost here
    } = req.body;

    // Validation: Check if all required fields are provided
    if (
      !filmTitle ||
      // !downloadData ||
      // !imageData ||
      // !description ||
      // !urlOfThumbnail ||
      // imdbRating == null || // imdbRating could be 0
      // !directedBy ||
      // !releaseDate ||
      // !genre ||
      !urlOfPost // Added validation for urlOfPost
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Create a new film document
    const newFilm = new Film({
      filmTitle,
      // downloadData,
      // imageData,
      // description,
      // imdbRating,
      // directedBy,
      // releaseDate,
      // genre,
      urlOfThumbnail,
      urlOfPost, // Added urlOfPost here
    });

    // Save the film document to the database
    await newFilm.save();
    const finalResponse = await axios.post(
      `${process.env.BACKENED_URL}/api/updateData`,
      { id: newFilm._id.toString() } // Ensure the ID is being passed correctly
    );

    res
      .status(201)
      .json({ message: "Film saved successfully!", film: newFilm });
  } catch (error) {
    console.error("Error saving film:", error);
    res.status(500).json({ error: "An error occurred while saving the film." });
  }
});
// PUT /updateFilm/:id to update the data
router.put("/updateFilm/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params; // Extract the film ID from the URL parameter
    const {
      filmTitle,
      imageData,
      genre,
      urlOfPost,
      urlOfThumbnail,
      downloadData,
    } = req.body; // Extract the data to update from the request body

    // Validate the request body
    if (!filmTitle || !urlOfPost || !urlOfThumbnail || !downloadData) {
      return res.status(400).json({
        error:
          "Missing required fields: filmTitle, urlOfPost, urlOfThumbnail, or downloadData.",
      });
    }

    // Find the film by ID in the database
    const film = await Film.findById(id);

    if (!film) {
      return res.status(404).json({ error: "Film not found." });
    }

    // Update the film fields with the new data
    film.filmTitle = filmTitle;
    film.imageData = imageData || film.imageData; // Optional update
    film.genre = genre || film.genre; // Optional update
    film.urlOfPost = urlOfPost;
    film.urlOfThumbnail = urlOfThumbnail;
    film.downloadData = downloadData;

    // Save the updated film to the database
    await film.save();

    // Respond with the updated film
    res.status(200).json({
      message: "Film updated successfully!",
      updatedFilm: film,
    });
  } catch (error) {
    console.error("Error updating film:", error);
    res.status(500).json({
      error: "An error occurred while updating the film.",
    });
  }
});

router.delete("/delete/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params; // Get the ID from the route parameters

    // Attempt to find and delete the film by its _id
    const deletedFilm = await Film.findByIdAndDelete(id);

    if (!deletedFilm) {
      return res.status(404).json({ error: "Film not found." });
    }

    // Respond with a success message and the deleted film data
    res.status(200).json({
      message: "Film deleted successfully.",
      deletedFilm,
    });
  } catch (error) {
    console.error("Error deleting film:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the film." });
  }
});

module.exports = router;
