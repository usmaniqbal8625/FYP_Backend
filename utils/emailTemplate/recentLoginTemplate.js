require("dotenv").config();
const logo = "/uploads/user/alasamLogo.png";
const email = process.env.MAILER_EMAIL;

const recentLoginTemplate = (name) => {
  return `
    <body style="width: 600px; margin: 0px auto; font-size: 16px;">
      <img src="${logo}" alt="BigByte Logo" width="200" style="margin: 10px 0px;" />
      <p>Dear ${name},</p>
      <p style="margin-top: 16px;">We have detected a recent login on your account. If this was you, no further action is needed. However, if you did not initiate this login, please take the following steps:</p>
      <ul>
        <li>Reset Your Password: To ensure your account's security, update your password immediately.</li>
        <li>Review Account Activity: Check for any unfamiliar activity in your account.</li>
      </ul>
      <p>For assistance or concerns, please contact our support team at <a href="mailto:${email}">support Team</a></p>
      <p>Thank you for your attention.</p>
      <p>Best regards,</p>
      <p style="margin-top: 10px; font-weight: 600;">BigByte Team</p>
    </body>
  `;
};

module.exports = {
  recentLoginTemplate,
};
