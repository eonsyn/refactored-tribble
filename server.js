const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectdb = require("./config/mongodb");

//models import
const Film = require("./Models/Films");

//import routers
const publicRoute = require("./Routes/publicRoutes");

const app = express();
connectdb();
const corsConfig = {
  origin: ["https://moodyfilm.netlify.app"],
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

app.get("/", (req, res) => {
  res.send("Hello from Express!"); // Basic route to test
});
app.get("/home", async (req, res) => {
  try {
    // Fetch films from the database
    // Only select the fields _id, filmTitle, urlOfThumbnail, and imdbRating
    // Sort by createdAt in descending order to show the newest films first
    const films = await Film.find(
      {},
      "_id filmTitle urlOfThumbnail imdbRating"
    ).sort({ createdAt: -1 });

    // If no films are found, send a 404 response
    if (!films || films.length === 0) {
      return res.status(404).json({ error: "No films found." });
    }

    // If films are found, send them in the response
    res.status(200).json(films);
  } catch (error) {
    // Handle server errors
    console.error("Error fetching films:", error);
    res.status(500).json({ error: "An error occurred while fetching films." });
  }
});
const port = 2300;
app.listen(port, () => {
  console.log("Server is listening on port 2300");
});
