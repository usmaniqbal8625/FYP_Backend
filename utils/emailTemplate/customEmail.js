require("dotenv").config();
const logo = "/uploads/user/alasamLogo.png";

const userQueryTemplate = (name, email, subject, query) => {
  return `
    <body style="width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
      <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <tr>
          <td style="text-align: center; padding-bottom: 20px;">
            <img src="${logo}" alt="BigByte Logo" width="200" style="margin: 20px 0;" />
          </td>
        </tr>
        <tr>
          <td>
            <h2 style="color: #333; text-align: center; margin-bottom: 24px;">New Query Received</h2>

            <p style="font-size: 16px; color: #333; margin-bottom: 8px;"><strong>Name:</strong> ${name}</p>
            <p style="font-size: 16px; color: #333; margin-bottom: 8px;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #007BFF; text-decoration: none;">${email}</a></p>
            <p style="font-size: 16px; color: #333; margin-bottom: 16px;"><strong>Subject:</strong> ${subject}</p>

            <p style="font-size: 16px; color: #555; line-height: 1.6; background-color: #f1f1f1; padding: 15px; border-radius: 6px;">
              ${query}
            </p>

            <p style="font-size: 16px; color: #333; line-height: 1.6; margin-top: 24px;">
              Please respond to the user at the provided email address.
            </p>

            <p style="font-size: 16px; font-weight: 600; color: #333; margin-top: 20px;">
              BigByte Support Team
            </p>
          </td>
        </tr>
      </table>
    </body>
  `;
};

module.exports = {
  userQueryTemplate,
};
