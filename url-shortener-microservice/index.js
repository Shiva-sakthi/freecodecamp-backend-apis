require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("dns");

const app = express();

const port = process.env.PORT || 3000;

app.use(cors());

// Parse form body data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Storage for URLs
const urlDatabase = [];

// POST endpoint to shorten URL
app.post("/api/shorturl", function (req, res) {
  const originalUrl = req.body.url;

  let parsedUrl;
  try {
    parsedUrl = new URL(originalUrl);
  } catch (err) {
    return res.json({ error: "invalid url" });
  }

  // freeCodeCamp checks for http: or https:
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return res.json({ error: "invalid url" });
  }

  dns.lookup(parsedUrl.hostname, (err, address) => {
    if (err || !address) {
      return res.json({ error: "invalid url" });
    }

    let existingIndex = urlDatabase.indexOf(originalUrl);
    let shortUrl;

    if (existingIndex !== -1) {
      shortUrl = existingIndex + 1;
    } else {
      urlDatabase.push(originalUrl);
      shortUrl = urlDatabase.length;
    }

    res.json({
      original_url: originalUrl,
      short_url: shortUrl,
    });
  });
});

// GET endpoint to redirect
app.get("/api/shorturl/:short_url", function (req, res) {
  const shortUrl = parseInt(req.params.short_url);

  if (isNaN(shortUrl) || shortUrl < 1 || shortUrl > urlDatabase.length) {
    return res.json({ error: "No short URL found for the given input" });
  }

  const targetUrl = urlDatabase[shortUrl - 1];
  res.redirect(targetUrl);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
