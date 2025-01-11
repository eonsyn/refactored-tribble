// Import required modules
const express = require("express");
const cheerio = require("cheerio");
// const FormData = require("form-data");
// const fs = require("fs");
// const path = require("path");
const axios = require("axios");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
require("dotenv").config();
const fs = require("fs");
const puppeteer = require("puppeteer");

// Initialize Express app
const app = express();
const port = 3000;

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
  // console.log(decodedHtml);
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
const fetchDownloadData = async (downloadData) => {
  const finalUrls = [];

  for (const item of downloadData) {
    const url = item.link;
    console.log(url);
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
        (a) => a.textContent.trim() === "HubCloud(Fast-Server)"
      );

      finalUrls.push({
        title: item.title,
        finalLink: anchor ? anchor.href : null,
        error: anchor ? null : "HubCloud(Fast-Server) link not found.",
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
      // Launch a headless browser instance
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      // Set the user-agent and other necessary headers (optional)
      await page.setUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
      );

      // Navigate to the URL
      await page.goto(finalLink, { waitUntil: "domcontentloaded" });

      // Wait for the page to load and settle
      await page.waitForSelector("body");

      // Get the content after redirection
      const content = await page.content();
      const url = await page.evaluate(() => {
        return window.url || null; // This will access the 'url' variable defined in the script
      });
      if (url) {
        console.log("Extracted URL:", url);
      } else {
        console.log("URL not found on the page.");
      }
      // console.log(content); // Print the actual HTML content of the redirected page

      // Close the browser
      await browser.close();

      // const decodedHtml = content;
      // fs.writeFileSync("decodedPage.html", decodedHtml, "utf8");
      const mkvLink = await fetchMkvLink(url);
      const downloadLink = mkvLink;

      downloadResults.push({
        title,
        finalLink,
        downloadHref: downloadLink ? downloadLink : null,
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

//
const fetchMkvLink = async (url) => {
  try {
    // Fetch the HTML content using axios
    const response = await axios.get(url);
    const htmlContent = response.data;

    // Load the HTML content into cheerio
    const $ = cheerio.load(htmlContent);

    // Find the first anchor tag with href ending in .mkv
    const mkvLink = $('a[href$=".mkv"]').attr("href");

    if (mkvLink) {
      // console.log("Found .mkv link:", mkvLink);
      return mkvLink; // Return the found .mkv link
    } else {
      console.log("No .mkv link found.");
      return null; // Return null if no link is found
    }
  } catch (error) {
    console.error("Error fetching HTML content:", error.message);
    return null; // Return null in case of an error
  }
};

app.get("/getData", async (req, res) => {
  try {
    const { url } = req.query;
    const scrapedData = await scrapeData(url);

    const finalUrls = await fetchDownloadData(scrapedData.downloadData);
    const downloadResults = await fetchDownloadHrefs(finalUrls);

    res.json({
      TempdownloadData: downloadResults,
      TempimageData: scrapedData.imageData,
    });
  } catch (error) {
    console.error("Error in /getData:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
