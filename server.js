const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Set up multer to save uploaded images into "uploads/" folder
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Middleware to allow JSON data
app.use(express.json());

// POST route to receive image + text data
app.post('/generate', upload.single('image'), async (req, res) => {
  try {
    const { district, location, rooms, price } = req.body;
    const imagePath = req.file.path;

    const outputFileName = 'output/' + Date.now() + '-final.jpg';

    // Start image editing with Sharp
    const image = sharp(imagePath);

    const width = 1080;
    const height = 1350;

    // Create black overlay buffer
    const overlay = Buffer.from(
      `<svg width="${width}" height="${height}">
        <rect x="0" y="0" width="100%" height="100%" fill="black" fill-opacity="0.4"/>
      </svg>`
    );

    // Text overlay as SVG
    const textOverlay = Buffer.from(
      `<svg width="${width}" height="${height}">
        <style>
          .title { fill: white; font-size: 70px; font-family: Times New Roman; }
          .subtitle { fill: white; font-size: 30px; font-family: Montserrat; }
          .price { fill: white; font-size: 130px; font-family: Garamond; }
        </style>
        <text x="50%" y="300" text-anchor="middle" class="title">${district}</text>
        <text x="50%" y="400" text-anchor="middle" class="subtitle">${location}</text>
        <text x="50%" y="900" text-anchor="middle" class="subtitle">${rooms}</text>
        <text x="50%" y="1000" text-anchor="middle" class="price">${price}</text>
      </svg>`
    );

    await image
      .resize(width, height)
      .composite([
        { input: overlay, blend: 'over' },
        { input: textOverlay, blend: 'over' }
      ])
      .toFile(outputFileName);

    // Send the final image file as response
    res.sendFile(path.resolve(outputFileName));

    // Optional: Clean up after sending
    setTimeout(() => {
      fs.unlinkSync(imagePath);       // delete original uploaded photo
      fs.unlinkSync(outputFileName);  // delete final image
    }, 5000);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
