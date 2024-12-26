const express = require("express");
const router = express.Router();
const axios = require("axios");
const jsdom = require("jsdom");
require("dotenv").config();
// const authenticateAdmin = require("../middleware/admin.auth.middleware");
// const RequestFilm = require("../models/RequestFilm");
const { JSDOM } = jsdom;
// const Film = require("../Models/Films"); // Replace with the actual path to your Film model

const scrapeData = async (url) => {
  try {
    // Fallback URL if no URL is provided
    url =
      url ||
      "https://dudefilms.my/lal-salaam-2024-hindi-dubbed-movie-hdtv-esub-480p-720p-1080p/";

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

    // Extract h4 titles
    const buttonText = Array.from(doc.querySelectorAll("h4")).map((title) =>
      title.textContent.trim()
    );

    // Extract download links
    const hrefs = Array.from(
      doc.querySelectorAll(".maxbutton-download-link")
    ).map((link) => link.getAttribute("href"));

    // Extract image sources
    const imgSrcs = Array.from(doc.querySelectorAll("p img")).map(
      (img) => img.src
    );

    // Combine extracted data
    const downloadInfo = buttonText.map((text, index) => ({
      title: text,
      link: hrefs[index] || null,
    }));
    downloadInfo.push({ imgSrcs });

    // Convert data into structured format
    const convertData = (info) => {
      const downloadData = [];
      const imageData = [];

      info.forEach((item) => {
        if (item.title && item.link) {
          downloadData.push({
            title: item.title,
            link: item.link,
          });
        }
        if (item.imgSrcs) {
          item.imgSrcs.forEach((imgSrc) => {
            if (
              imgSrc.startsWith("https") &&
              !imgSrc.includes("imgur") &&
              !imgSrc.includes("ibb")
            ) {
              imageData.push(imgSrc);
            }
          });
        }
      });

      return { downloadData, imageData };
    };

    return convertData(downloadInfo);
  } catch (error) {
    console.error("Error scraping data:", error.message);
    throw new Error("Failed to scrape data.");
  }
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

module.exports = router;
