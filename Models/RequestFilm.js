const mongoose = require("mongoose");

// Define the schema for requested films
const RequestFilmSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); // Email format validation
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    filmName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  }
);

// Create the model from the schema
const RequestFilm = mongoose.model("RequestFilm", RequestFilmSchema);

module.exports = RequestFilm;
