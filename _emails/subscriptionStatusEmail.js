import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const subscriptionStatusEmail = async (email, companyName) => {
  const mailOptions = {
    from: `"JobSphere Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your JobSphere subscription has expired",
    html: `
      <div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" 
               style="max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#001f3f; padding:20px; text-align:center;">
              <h1 style="color:#FFD700; margin:0; font-size:24px;">JobSphere</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:30px; color:#333333;">
              <h2 style="color:#001f3f; margin-top:0;">Hello ${companyName},</h2>
              <p style="font-size:16px; line-height:1.6;">
                This is to inform you that your subscription to JobSphere has expired. We hope you found the right job for you.  
              </p>

               <div style="text-align:center; margin:30px 0;">
                <a href="#" 
                   style="background-color:#FFD700; color:#001f3f; padding:12px 24px; 
                          text-decoration:none; font-weight:bold; border-radius:6px; 
                          display:inline-block;">
                 Renew Subscription
                </a>
              </div>
              <p style="font-size:16px; line-height:1.6;">
              Thank you for choosing JobSphere to power your hiring!  
              </p>

              
              <p style="font-size:14px; color:#555;">
                Best regards,<br>
                The JobSphere Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#001f3f; padding:15px; text-align:center;">
              <p style="color:#FFD700; margin:0; font-size:12px;">
                © ${new Date().getFullYear()} JobSphere. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    //console.error("Error sending email:", error);
  }
};

export default subscriptionStatusEmail;
