const jwt = require("jsonwebtoken");

// Middleware to verify superadmin access
const authenticateUser = (req, res, next) => {
  const token = req.cookies.user_auth_token; // Expecting 'Bearer <token>'
  console.log(token);
  if (!token) {
    return res.status(401).json({ error: "Authentication token is missing." });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the user is a superadmin
    if (decoded.role !== "User") {
      return res.status(403).json({ error: "Access denied. Not a Admin." });
    }

    // Attach the superadmin info to the request
    req.User = decoded;

    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

module.exports = authenticateUser;
