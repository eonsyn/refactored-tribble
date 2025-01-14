const express = require("express");
const cheerio = require("cheerio");
const axios = require("axios");
require("dotenv").config();

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const app = express();
const port = 3000;

// Function to fetch MKV link
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
      Referer: "https://dudefilms.diy/",
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
// Function to fetch final download links
const fetchDownloadData = async (downloadData) => {
  const finalUrls = [];

  for (const item of downloadData) {
    const url = item.link;
    //here i have to call external api
    console.log("tdhis is api call url", url);
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
      // Use await to fetch the download link
      const data = await getlink(finalLink);
      console.log("API getlink Response:", data.finalLink);

      downloadResults.push({
        title,
        finalLink,
        downloadHref: data.finalLink || null,
        error: data.finalLink ? null : "Download link not found",
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

const getlink = async (url) => {
  try {
    const apiUrl = "https://getlink-1.onrender.com/test";

    // Sending GET request with the `finalLink` parameter
    const response = await axios.get(apiUrl, {
      params: { finalLink: url },
    });

    // Returning the API response data
    return response.data;
  } catch (error) {
    console.error("Error fetching API data:", error.message);
    throw error;
  }
};

//combininig alll api and form this api
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
