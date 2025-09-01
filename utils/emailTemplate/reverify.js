require("dotenv").config();
const logo = `${process.env.API_URL}/uploads/user/alasamLogo.png`;
const email = process.env.MAILER_EMAIL;

const reverifyAccount = (name, link) => {
  return `
    <body style="width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #eaeaea;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img crossorigin="anonymous" src="${logo}" alt="BigByte Logo" width="200" style="margin: 10px 0; border-radius: 8px;" />
      </div>
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <p style="font-size: 18px; font-weight: bold; color: #333;">Dear ${name},</p>
        <p style="font-size: 16px; color: #555;">Below is your link to re-verify the account</p>
        <p style="margin-top: 16px; font-size: 16px; color: #555;">Please <a href="${link}" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">Click Here</a> to activate your account.</p>
        <p style="margin-top: 16px; font-size: 16px; color: #555;">For assistance or concerns, please contact our support team at <a href="mailto:${email}" style="color: #007bff;">support Team.</p>
        <p style="margin-top: 20px; font-size: 16px; color: #555;">Thank you for your attention.</p>
        <p style="font-size: 16px; font-weight: bold; color: #333;">Best regards,</p>
        <p style="margin-top: 10px; font-size: 16px; font-weight: 600; color: #333;">BigByte Team</p>
      </div>
    </body>
  `;
};

module.exports = {
  reverifyAccount,
};
