const jwt = require("jsonwebtoken");

// Middleware to verify superadmin access
const authenticateAdmin = (req, res, next) => {
  const token = req.cookies.auth_token; // Expecting 'Bearer <token>'

  if (!token) {
    return res.status(401).json({ error: "Authentication token is missing." });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the user is a superadmin
    if (decoded.role !== "Admin") {
      return res.status(403).json({ error: "Access denied. Not a Admin." });
    }

    // Attach the superadmin info to the request
    req.Admin = decoded;
    console.log(req.Admin);
    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

module.exports = authenticateAdmin;
