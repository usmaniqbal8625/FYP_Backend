const nodemailer = require("nodemailer");
require("dotenv").config();
const twilio = require("twilio");

const sender_name = process.env.MAILER_NAME;
const sender_email = process.env.MAILER_EMAIL;
const sender_password = process.env.MAILER_PASSWORD;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: sender_email,
    pass: sender_password,
  },
});

const sendEmail = async (email, subject, content) => {
  try {
    const mailOptions = {
      from: `${sender_name} <${sender_email}>`,
      to: email,
      subject: subject,
      html: content,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send email: ", error);
  }
};

const sendCustomEmail = async (emails, subject, content) => {
  try {
    // const emailString = emails.join(", ");

    const mailOptions = {
      from: `${sender_name} <${sender_email}>`,
      to: emails,
      subject: subject,
      html: content,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Failed to send email: ", error);
  }
};

module.exports = {
  sendEmail,
  sendCustomEmail,
};
