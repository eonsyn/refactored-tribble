const mongoose = require("mongoose");

const filmSchema = new mongoose.Schema({
  filmTitle: {
    type: String,
    required: true, // Film title is required
    trim: true,
  },
  downloadData: [
    {
      title: {
        type: String,
      },
      finalLink: {
        type: String,
      },
      downloadHref: {
        type: String,
        default: null,
      },
      error: {
        type: String,
        default: null,
      },
    },
  ],
  watchOnline: {
    type: String,
    trim: true,
    default: null,
  },
  imageData: [
    {
      type: String,
    },
  ],
  description: {
    type: String,

    trim: true,
  },
  imdbRating: {
    type: Number,

    min: 0,
    max: 10,
  },
  directedBy: {
    type: String,

    trim: true,
  },
  releaseDate: {
    type: Date,
  },
  genre: [
    {
      type: String,
    },
  ],
  postUrl: {
    type: String,

    trim: true,
  },
  thumbnailUrl: {
    type: String,

    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  reviewIds: [
    {
      default: 0,
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review", // Reference to the Review model
    },
  ],
});

module.exports = mongoose.model("Film", filmSchema);
