const mongoose = require("mongoose");

const filmSchema = new mongoose.Schema({
  filmTitle: {
    type: String,
    // required: true,
    trim: true,
  },
  downloadData: [
    {
      title: {
        type: String,
        // required: true,
      },
      finalLink: {
        type: String,
        // required: true,
      },
      downloadHref: {
        type: String,
        // default: null,
      },
      error: {
        type: String,
        // default: null,
      },
    },
  ],
  imageData: [
    {
      type: String,
      // required: true,
    },
  ],
  description: {
    type: String,
    // required: true,
    trim: true,
  },
  imdbRating: {
    type: Number,
    // required: true,
    min: 0,
    max: 10,
  },
  directedBy: {
    type: String,
    // required: true,
    trim: true,
  },
  releaseDate: {
    type: Date,
    // required: true,
  },
  genre: [
    {
      type: String,
      // required: true,
    },
  ],
  urlOfPost: {
    type: String,
    // required: true,
    trim: true,
  },
  urlOfThumbnail: {
    type: String,
    // required: true,
    trim: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const Film = mongoose.model("Film", filmSchema);

module.exports = Film;
