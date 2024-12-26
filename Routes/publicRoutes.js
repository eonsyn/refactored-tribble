const express = require("express");
const router = express.Router();
const axios = require("axios");
const jsdom = require("jsdom");
require("dotenv").config();
// const authenticateAdmin = require("../middleware/admin.auth.middleware");
// const RequestFilm = require("../models/RequestFilm");
const { JSDOM } = jsdom;
const Film = require("../Models/Films"); // Replace with the actual path to your Film model

// Function to scrape data and extract download links
const scrapeData = async (url) => {
  if (!url) {
    const url =
      "https://dudefilms.my/lal-salaam-2024-hindi-dubbed-movie-hdtv-esub-480p-720p-1080p/";
  }

  const response = await axios.get(url, {
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6",
      "Cache-Control": "max-age=0",
      Cookie: "_lscache_vary=00e02ac3526ebf42934719326cc549fc",
      DNT: "1",
      Referer: "https://dudefilms.my/",
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

  const decodedHtml = Buffer.from(response.data, "binary").toString("utf8");
  const dom = new JSDOM(decodedHtml);
  const doc = dom.window.document;

  const h4Elements = doc.querySelectorAll("h4");
  const buttonText = Array.from(h4Elements).map((title) =>
    title.textContent.trim()
  );

  const downloadLinkElements = doc.querySelectorAll(".maxbutton-download-link");
  const hrefs = Array.from(downloadLinkElements).map((link) =>
    link.getAttribute("href")
  );

  const imgElements = doc.querySelectorAll("p img");
  const imgSrcs = Array.from(imgElements).map((img) => img.src);

  const downloadInfo = buttonText.map((text, index) => ({
    title: text,
    link: hrefs[index] || null,
  }));
  downloadInfo.push({ imgSrcs });

  const convertData = (downloadInfo) => {
    const downloadData = [];
    const imageData = [];

    downloadInfo.forEach((item) => {
      if (item.title && item.link) {
        downloadData.push({
          title: item.title,
          link: item.link,
        });
      }
      if (item.imgSrcs) {
        item.imgSrcs.forEach((imgSrc) => {
          if (imgSrc.startsWith("https")) {
            if (
              imgSrc.startsWith("https://i.imgur.com/") ||
              imgSrc.startsWith("https://i.ibb.co/")
            ) {
            } else {
              imageData.push(imgSrc);
            }
          }
        });
      }
    });

    return { downloadData, imageData };
  };

  return convertData(downloadInfo);
};

// Function to fetch final download links
const fetchDownloadData = async (downloadData) => {
  const finalUrls = [];

  for (const item of downloadData) {
    const url = item.link;

    try {
      const fetchResponse = await axios.get(url, {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6",
          "Cache-Control": "max-age=0",
          DNT: "1",
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

      const decodedHtml = Buffer.from(fetchResponse.data, "binary").toString(
        "utf8"
      );
      const dom = new JSDOM(decodedHtml);
      const document = dom.window.document;

      const anchor = Array.from(document.querySelectorAll("a")).find(
        (a) => a.textContent.trim() === "✅ Google Drive (Direct)"
      );

      finalUrls.push({
        title: item.title,
        finalLink: anchor ? anchor.href : null,
        error: anchor ? null : "Google Drive (Direct) link not found.",
      });
    } catch (error) {
      finalUrls.push({
        title: item.title,
        finalLink: null,
        error: error.message,
      });
    }
  }

  return finalUrls;
};

// Function to get download Hrefs
const fetchDownloadHrefs = async (finalUrls) => {
  const downloadResults = [];

  for (const item of finalUrls) {
    const { title, finalLink } = item;

    if (!finalLink) {
      downloadResults.push({
        title,
        finalLink,
        downloadHref: null,
        error: "No final link available",
      });
      continue;
    }

    try {
      const response = await axios.get(finalLink, {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6",
          "Cache-Control": "max-age=0",
          Cookie: "_lscache_vary=00e02ac3526ebf42934719326cc549fc",
          DNT: "1",
          Referer: "https://dudefilms.my/",
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

      const decodedHtml = Buffer.from(response.data, "binary").toString("utf8");
      const dom = new JSDOM(decodedHtml);
      const document = dom.window.document;

      const downloadLink = Array.from(document.querySelectorAll("a")).find(
        (a) => a.textContent.includes("Instant DL [10GBPS]")
      );

      downloadResults.push({
        title,
        finalLink,
        downloadHref: downloadLink ? downloadLink.href : null,
        error: downloadLink ? null : "Download link not found",
      });
    } catch (error) {
      downloadResults.push({
        title,
        finalLink,
        downloadHref: null,
        error: error.message,
      });
    }
  }

  return downloadResults;
};

// Test route for scraping
router.get("/test", async (req, res) => {
  try {
    const scrapedData = await scrapeData();
    res.json(scrapedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//combininig alll api and form this api
router.get("/getData", async (req, res) => {
  try {
    const { url } = req.query;
    const scrapedData = await scrapeData(url);
    const finalUrls = await fetchDownloadData(scrapedData.downloadData);
    const downloadResults = await fetchDownloadHrefs(finalUrls);

    res.json({
      downloadData: downloadResults,
      imageData: scrapedData.imageData,
    });
  } catch (error) {
    console.error("Error in /getData:", error);
    res.status(500).json({ error: error.message });
  }
});

//give it last url to get the download link
router.post("/testdownload", async (req, res) => {
  try {
    const { url } = req.body; // Get the URL from the query parameters

    if (!url) {
      return res.status(400).json({ error: "URL parameter is required." });
    }

    // Fetch the data from the provided URL
    const response = await axios.get(url, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6",
        "Cache-Control": "max-age=0",
        Cookie: "_lscache_vary=00e02ac3526ebf42934719326cc549fc",
        DNT: "1",
        Referer: "https://dudefilms.my/",
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

    const decodedHtml = Buffer.from(response.data, "binary").toString("utf8");

    // Use jsdom to parse the HTML
    const dom = new JSDOM(decodedHtml);
    const document = dom.window.document;

    // Find the <a> tag with the inner text 'Instant DL [10GBPS]'
    const downloadLink = [...document.querySelectorAll("a")].find((a) =>
      a.textContent.includes("Instant DL [10GBPS]")
    );

    if (downloadLink) {
      // Extract the href attribute
      const finalLink = downloadLink.href;
      return res.json({ finalLink });
    } else {
      return res.status(404).json({ error: "Download link not found." });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST it take id and update the save the which is in the  database
router.post("/updateData", async (req, res) => {
  try {
    const { id } = req.body; // Get the film ID from the request body

    if (!id) {
      return res.status(400).json({ error: "Film ID is required." });
    }

    // Find the film by ID in the database
    const film = await Film.findById(id);

    if (!film) {
      return res.status(404).json({ error: "Film not found." });
    }

    const { urlOfPost } = film; // Get the URL to call /getData

    // Call /getData with the URL from the database
    const getDataResponse = await axios.get(
      `${process.env.BACKENED_URL}/api/getData`,
      {
        params: { url: urlOfPost },
      }
    );

    const { downloadData, imageData } = getDataResponse.data;

    // Update the film with new downloadData and imageData
    if (downloadData.length == null || imageData.length == null) {
      res.json("error try again");
    }
    film.downloadData = downloadData;
    film.imageData = imageData;

    // Save the updated film document
    await film.save();

    // Respond with success message
    res.status(200).json({
      message: "Film data updated successfully!",
      updatedFilm: film,
    });
  } catch (error) {
    console.error("Error updating film data:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the film data." });
  }
});

module.exports = router;
