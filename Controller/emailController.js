const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Function to send email with HTML template
const sendEmail = async (movielink, filmName, email) => {
  try {
    // Create a transporter for Gmail service
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true, // True for 465, false for other ports
      port: 465,
      auth: {
        user: process.env.MAIL_USER_ARYAN,
        pass: process.env.MAIL_PASS_ARYAN,
      },
    });

    // Read the email template
    const emailTemplatePath = path.join(__dirname, "emailTemplate.html");
    let emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");

    // Replace placeholders with actual data
    emailTemplate = emailTemplate
      .replace("{{movieTitle}}", filmName)
      .replace("{{movieLink}}", movielink);

    // Email content configuration
    const mailOptions = {
      from: `Moody Film <${process.env.MAIL_USER_ARYAN}>`,
      to: email,
      subject: `Moody Film Uploaded: Check Out Your Movie`,
      html: emailTemplate, // Use the populated email template
    };

    // Sending the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    // Log any errors during the sending process
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = { sendEmail };
