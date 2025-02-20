const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectdb = require("./config/mongodb");

//models import
const Film = require("./Models/Films");
const RequestFilm = require("./Models/RequestFilm");
//import routers
const publicRoute = require("./Routes/publicRoutes");
const adminRoute = require("./Routes/adminRoute.js");
const userRoute = require("./Routes/userRoutes.js");

const app = express();
connectdb();
// const corsConfig = {
//   origin: [
//     "https://moodyfilm.netlify.app",
//     "http://localhost:5173",
//     "https://preeminent-centaur-8c6c49.netlify.app",
//     "https://preeminent-centaur-8c6c49.netlify.app/",
//   ],
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE"],
// };
const corsConfig = {
  origin: true, // Allow requests from any origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};
// app.options("",cors(corsConfig));
app.use(cors(corsConfig));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//Routes
app.use("/api", publicRoute);
app.use("/admin", adminRoute);
app.use("/user", userRoute);

app.get("/", (req, res) => {
  res.send("surprise this is robot check!"); // Basic route to test
});
app.get("/home", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    const searchTerm = req.query.search || "";

    // Build a dynamic search filter for both title and genre
    const searchFilter = searchTerm
      ? {
          $or: [
            { filmTitle: { $regex: searchTerm, $options: "i" } },
            { genre: { $regex: searchTerm, $options: "i" } },
          ],
        }
      : {};

    // If searchTerm is provided, fetch all films matching the search term
    let filmsQuery = Film.find(
      searchFilter,
      "_id filmTitle urlOfThumbnail imdbRating genre"
    );

    // If searchTerm is provided, don't apply pagination to the search query
    if (!searchTerm) {
      // Apply pagination only if no searchTerm
      filmsQuery = filmsQuery.skip(skip).limit(limit);
    }

    // Fetch filtered films with pagination only when needed
    const films = await filmsQuery.sort({ createdAt: -1 });

    // Calculate total films and total pages based on the filter (search or not)
    const totalFilms = await Film.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalFilms / limit);

    if (!films || films.length === 0) {
      return res.status(404).json({ error: "No films found." });
    }

    res.status(200).json({
      currentPage: page,
      totalPages,
      totalFilms,
      films,
    });
  } catch (error) {
    console.error("Error fetching films:", error);
    res.status(500).json({ error: "An error occurred while fetching films." });
  }
});

app.post("/request-film", async (req, res) => {
  const { email, filmName } = req.body;

  // Input validation
  if (!email || !filmName) {
    return res
      .status(400)
      .json({ message: "Email and Film Name are required" });
  }

  try {
    const newRequest = new RequestFilm({ email, filmName });
    await newRequest.save();
    res.status(201).json({ message: "Film request submitted successfully!" });
  } catch (error) {
    console.error("Error saving film request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.get("/get-temp-id", async (req, res) => {
  try {
    // Fetch only the `_id` field of the latest 15 films, sorted by `createdAt` in descending order
    const filmsId = await Film.find({}, "_id")
      .sort({ createdAt: -1 })
      .limit(15);

    // Send a success response with the data
    res.status(200).json({
      success: true,
      message: "Successfully retrieved the latest 15 film IDs",
      data: filmsId,
    });
  } catch (error) {
    // Handle any errors that occur
    console.error("Error fetching film IDs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve film IDs",
      error: error.message,
    });
  }
});
app.get("/get-all-id", async (req, res) => {
  try {
    const films = await Film.find({}, "_id filmTitle").sort({ createdAt: -1 });

    // Format the response to match the required filmUrl structure
    const formattedFilms = films.map(({ _id, filmTitle }) => ({
      filmUrl: `${_id}/${filmTitle.replace(/\s+/g, "-")}`,
    }));

    res.status(200).json({
      success: true,
      message: "Successfully get the  film IDs with names",
      data: formattedFilms,
    });
  } catch (error) {
    console.error("Error fetching film IDs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve film IDs",
      error: error.message,
    });
  }
});

const port = 2300;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
