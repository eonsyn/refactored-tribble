const express = require("express");
const router = express.Router();
const Admin = require("../Models/Admin");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const bcrypt = require("bcrypt");
const authenticateAdmin = require("../Middelware/admin.auth.midddleware");
const Film = require("../Models/Films");
const axios = require("axios");

const extractTitleId = (url) => {
  const match = url.match(/\/title\/(tt\d+)\//);
  return match ? match[1] : null;
};

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

router.post("/getImdbData", async (req, res) => {
  const { url } = req.body; // Access URL from the request body

  if (!url) {
    return res
      .status(400)
      .send({ error: "URL is required in the request body." });
  }
  const titleId = extractTitleId(url);
  const storyUrl = `https://caching.graphql.imdb.com/?operationName=TMD_Storyline&variables=${encodeURIComponent(
    JSON.stringify({ locale: "en-US", titleId })
  )}&extensions=${encodeURIComponent(
    JSON.stringify({
      persistedQuery: {
        sha256Hash:
          "78f137c28457417c10cf92a79976e54a65f8707bfc4fd1ad035da881ee5eaac6",
        version: 1,
      },
    })
  )}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6",
        "Cache-Control": "max-age=0",
        Cookie: "_lscache_vary=00e02ac3526ebf42934719326cc549fc",
        DNT: "1",
        Referer: "https://www.imdb.com/", // Referer updated to match the target URL
        "Sec-CH-UA":
          '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "Sec-CH-UA-Mobile": "?0",
        "Sec-CH-UA-Platform": '"Android"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.109 Safari/537.36 CrKey/1.54.248666",
      },
      responseType: "arraybuffer",
    });

    // Decode the HTML response
    const decodedHtml = Buffer.from(response.data, "binary").toString("utf8");

    // Write the HTML content to 'index.html'
    // const filePath = path.join(__dirname, "index.html");
    // fs.writeFileSync(filePath, decodedHtml, "utf8");

    // console.log(`HTML content written to ${filePath}`);

    // Parse the HTML with JSDOM
    const dom = new JSDOM(decodedHtml);
    const doc = dom.window.document;
    //finding the rating of the film
    const ratingElement = doc.querySelector(".imUuxf");
    const rating = ratingElement ? ratingElement.textContent : null;

    //find director
    const directorElement = doc.querySelector(
      ".ipc-metadata-list-item__list-content-item"
    );
    const director = directorElement ? directorElement.textContent : null;

    //find film name
    const filmnameElement = doc.querySelector(".hero__primary-text");
    const filmname = filmnameElement ? filmnameElement.textContent : null;

    // Find the image with class "ipc-image" and get its src attribute
    const imageElement = doc.querySelector(".ipc-image");
    const imageSrc = imageElement ? imageElement.src : null;

    if (imageSrc) {
      // Retain the '@._V1' part of the URL
      const cleanedImageSrc = imageSrc.includes("@")
        ? imageSrc.split("@")[0] + "@._V1.jpg"
        : imageSrc;
      var storySummary = "";
      const genres = [];
      try {
        // Make the API request
        const response = await axios.get(storyUrl, {
          headers: {
            Accept: "application/graphql+json, application/json",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language":
              "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6",
            "Content-Type": "application/json",
            Cookie:
              "uu=eyJpZCI6InV1MjRhNTM4ZDM5NGE3NGY2Mjg5ZDciLCJwcmVmZXJlbmNlcyI6eyJmaW5kX2luY2x1ZGVfYWR1bHQiOmZhbHNlfX0=; session-id=146-3613307-4397922; session-id-time=2082787201l; ubid-main=132-2409063-9532842; ad-oo=0; session-token=twUthgcheQIkMTir4V52DVdtwcFyBIy4vdbaOm9QUKL4X5xX41Lep9ji4K2OSBM91odGPY4OX6TjY3EGHWjj3jHe7RCldxNKF4ZnYvwJ/5xFupbWIrukbRTn0Tz2J49s7xsKq2P0Xa008jAaK3ZfREVUj6P49OuKs3URhoJyCALk5b2BWecNRWW/tlktuy6byVx0C+m6OJobD1a3ljXGTo/2PYpPgjgNIjFeo0QzRS5cJVdT3k0doj2tTsNCbn8+GFF2LJ6NY8tmSGllOJt61ZI6Sfv5y5JTlvgmqLhuQIqCQgKdYUTyqepT420ilVHDxxvZ1WKbWd8ASryClWx7GbnpSiQ2rwMY; ci=e30",
            DNT: "1",
            Origin: "https://m.imdb.com",
            Referer: "https://m.imdb.com/",
            "Sec-CH-UA":
              '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            "Sec-CH-UA-Mobile": "?1",
            "Sec-CH-UA-Platform": '"Android"',
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
            "X-Amzn-Sessionid": "146-3613307-4397922",
            "X-IMDB-Client-Name": "imdb-web-next-localized",
            "X-IMDB-Client-Rid": "FFYVFXMSCTBS6MK651T2",
            "X-IMDB-User-Country": "US",
            "X-IMDB-User-Language": "en-US",
            "X-IMDB-Weblab-Treatment-Overrides": "{}",
          },
          responseType: "arraybuffer",
        });

        // Decode the response buffer into a string
        const decodedResponse = Buffer.from(response.data).toString("utf-8");

        // Parse the string into JSON (if the API returns JSON data)
        const parsedResponse = JSON.parse(decodedResponse);

        // Log the parsed response to the console

        storySummary =
          parsedResponse.data.title.summaries.edges[0].node.plotText.plaidHtml;
        const genress = parsedResponse.data.title.genres.genres;

        genress.forEach((element) => {
          genres.push(element.id);
        });
      } catch (error) {
        console.log(error);
      }

      res.send({
        titleId,
        posterImg: cleanedImageSrc,
        rating,
        genres,
        filmname,
        director,
        storySummary,
      });
    } else {
      res.status(404).send({
        error: "Image not found.",
      });
    }
  } catch (error) {
    console.error("Error fetching or processing the webpage:", error.message);
    res
      .status(500)
      .send({ error: "An error occurred while processing the request." });
  }
});

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
      urlOfPost,
    } = req.body;

    // Validation: Check if all required fields are provided
    if (
      !filmTitle ||
      !urlOfThumbnail ||
      !urlOfPost // Added validation for urlOfPost
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Send the ID of the new film to update other data if needed
    let updatedDownloadData = downloadData; // Keep original downloadData
    let updatedImageData = imageData; // Keep original imageData

    try {
      const finalResponse = await axios.get(
        `${process.env.BACKEND_URL}/api/getData`,
        {
          params: {
            url: urlOfPost,
          },
        }
      );

      // Log the data from the final response
      const { TempdownloadData, TempimageData } = finalResponse.data;

      // Update downloadData and imageData with fetched data
      updatedDownloadData = TempdownloadData || updatedDownloadData;
      updatedImageData = TempimageData || updatedImageData;
    } catch (error) {
      console.error("Error during API call:", error.message);
      return res.status(500).json({ error: error.message });
    }

    // Create a new film document
    const newFilm = new Film({
      filmTitle,
      downloadData: updatedDownloadData, // Use updated data
      imageData: updatedImageData, // Use updated data
      description,
      imdbRating,
      directedBy,
      releaseDate,
      genre,
      urlOfThumbnail,
      urlOfPost,
    });

    // Save the film document to the database
    await newFilm.save();

    // Respond with success message and the saved film data
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
