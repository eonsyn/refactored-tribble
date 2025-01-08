const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
require("dotenv").config(); // Ensure dotenv is loaded

// Function to send email with HTML template
const sendEmail = async (movielink, filmName, email) => {
  try {
    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      port: 465,
      auth: {
        user: process.env.MAIL_USER_ARYAN,
        pass: process.env.MAIL_PASS_ARYAN,
      },
    });

    // Read and populate the HTML template
    const emailTemplatePath = path.join(__dirname, "emailTemplate.html");
    let emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");

    emailTemplate = emailTemplate
      .replace("{{movieTitle}}", filmName)
      .replace("{{movieLink}}", movielink);

    // Email options
    const mailOptions = {
      from: `Moody Films <${process.env.MAIL_USER_ARYAN}>`,
      to: email,
      subject: `Your Movie is Ready: ${filmName}`,
      html: emailTemplate, // HTML body
      text: `Hi there!\n\nWe’re excited to let you know that the movie "${filmName}" is now available on Moody Films!\n\nWatch here: ${movielink}\n\nThank you for being part of the Moody Films community!`, // Plain-text fallback
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = { sendEmail };
