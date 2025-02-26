const User = require("../../Models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Invalid username or password" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { role: "User", userName: user.userName, userId: user._id }, // Payload
      process.env.JWT_SECRET, // Secret key
      { expiresIn: "3d" } // Token expiry
    );

    // Set secure and cross-origin cookie settings
    res
      .cookie("user_auth_token", token, {
        httpOnly: true, // Prevents client-side JS from accessing the cookie
        secure: process.env.NODE_ENV === "production", // Only secure in production
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // "None" for cross-origin, "Lax" for local
        maxAge: 259200000, // 3 days
      })
      .status(200)
      .json({
        message: "Login successful",
        token,
        profile: user.profilePhotoInitial,
        username: user.userName,
        name: user.name,
        userId: user._id,
      });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const userSignup = async (req, res) => {
  try {
    const { userName, password, name, email } = req.body;

    // Validate input
    if (!userName || !password || !name || !email) {
      return res.status(400).json({
        message: "All fields (username, password, name, email) are required",
      });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ userName }, { email }],
    });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Username or email already taken" });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      userName,
      password: hashedPassword,
      name,
      email,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { userLogin, userSignup };
