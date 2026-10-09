import nodemailer from "nodemailer";

/**
 * Creates and returns a Nodemailer transporter.
 * Supports Gmail, custom SMTP, or development fallback.
 */
const getTransporter = () => {
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

    if (!user || !pass) {
        return null;
    }

    // If host is explicitly specified, use custom SMTP
    if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
            auth: { user, pass }
        });
    }

    // Default to Gmail service (popular and easiest with App Passwords)
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || "gmail",
        auth: { user, pass }
    });
};

/**
 * Sends a notification email on successful Sign-In.
 */
export const sendSignInEmail = async ({ to, name, role = "Customer" }) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
    const formattedTime = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });

    const displayName = name ? name.trim() : "Valued Customer";
    const sender = process.env.EMAIL_FROM || process.env.EMAIL_USER || '"Tomato Food Delivery" <noreply@tomato.com>';

    const subject = "Thank you! You are successfully signed in - Tomato";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Successful Sign In</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d3748;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f7f9fa; padding: 35px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #edf2f7;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #ff5722 0%, #ff6347 100%); padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 30px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Tomato.</h1>
              <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.92); font-size: 14px; font-weight: 500;">Fresh & Delicious Food Delivered</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <div style="display: inline-block; padding: 6px 14px; background: #ecfdf5; border-radius: 20px; border: 1px solid #a7f3d0; margin-bottom: 16px;">
                <span style="color: #059669; font-weight: 700; font-size: 13px;">✓ Sign In Successful</span>
              </div>

              <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #1a202c; line-height: 1.3;">
                Thank you! You are successfully signed in.
              </h2>
              
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #4a5568;">
                Hello <strong>${displayName}</strong>,<br/>
                We are writing to confirm that you have successfully signed in to your <strong>Tomato</strong> account.
              </p>

              <!-- Session Details Card -->
              <table role="presentation" width="100%" style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px; padding: 16px;">
                <tr>
                  <td style="padding: 6px 10px; font-size: 13px; color: #718096; width: 35%;">Account Email:</td>
                  <td style="padding: 6px 10px; font-size: 14px; font-weight: 600; color: #1a202c;">${to}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; font-size: 13px; color: #718096;">Account Type:</td>
                  <td style="padding: 6px 10px; font-size: 14px; font-weight: 600; color: #ff5722;">${role}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; font-size: 13px; color: #718096;">Sign-In Date:</td>
                  <td style="padding: 6px 10px; font-size: 14px; color: #2d3748;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; font-size: 13px; color: #718096;">Sign-In Time:</td>
                  <td style="padding: 6px 10px; font-size: 14px; color: #2d3748;">${formattedTime} IST</td>
                </tr>
              </table>

              <!-- Call to Action -->
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #4a5568;">
                You're all set to order from your favourite restaurants, apply promo codes, and enjoy fast doorstep delivery!
              </p>

              <!-- Security Notice -->
              <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 14px; border-radius: 4px; margin-bottom: 12px;">
                <p style="margin: 0; font-size: 12.5px; color: #92400e; line-height: 1.5;">
                  <strong>Security Note:</strong> If this was you, you can safely ignore this email. If you did not sign in to this account, please reset your password immediately or contact our support team.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; border-top: 1px solid #edf2f7; padding: 22px 30px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #a0aec0;">
                © ${now.getFullYear()} Tomato Food Delivery. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                This is an automated notification sent to ${to}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
Hello ${displayName},

Thank you! You have successfully signed in to your Tomato account.

Sign-In Details:
- Email: ${to}
- Role: ${role}
- Date: ${formattedDate}
- Time: ${formattedTime} IST

If this wasn't you, please change your password immediately.

Happy Ordering!
Tomato Food Delivery Team
    `;

    const transporter = getTransporter();

    if (!transporter) {
        console.log(`\n========================================================`);
        console.log(`[Email Service Simulation] 📧 Sign-In Email generated!`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`User: ${displayName} (${role})`);
        console.log(`Time: ${formattedDate} at ${formattedTime}`);
        console.log(`Tip: To send live emails, configure EMAIL_USER and EMAIL_PASS in backend/.env`);
        console.log(`========================================================\n`);
        return { success: true, simulated: true };
    }

    try {
        const info = await transporter.sendMail({
            from: sender,
            to,
            subject,
            text: textContent,
            html: htmlContent
        });
        console.log(`[Email Service] ✅ Sign-In email delivered to ${to} (MessageId: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[Email Service] ⚠️ Failed to deliver email to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Sends a notification email on successful Registration/Sign-Up.
 */
export const sendSignUpEmail = async ({ to, name, role = "Customer" }) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const displayName = name ? name.trim() : "Valued Customer";
    const sender = process.env.EMAIL_FROM || process.env.EMAIL_USER || '"Tomato Food Delivery" <noreply@tomato.com>';

    const subject = "Welcome to Tomato! Thank you for signing up";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Tomato</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d3748;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f7f9fa; padding: 35px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #edf2f7;">
          
          <tr>
            <td style="background: linear-gradient(135deg, #ff5722 0%, #ff6347 100%); padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 30px; font-weight: 800; color: #ffffff;">Tomato.</h1>
              <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.92); font-size: 14px;">Welcome to the family!</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 30px;">
              <div style="display: inline-block; padding: 6px 14px; background: #ecfdf5; border-radius: 20px; border: 1px solid #a7f3d0; margin-bottom: 16px;">
                <span style="color: #059669; font-weight: 700; font-size: 13px;">🎉 Account Created & Signed In</span>
              </div>

              <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #1a202c;">
                Thank you! You are successfully registered.
              </h2>
              
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #4a5568;">
                Hello <strong>${displayName}</strong>,<br/>
                Thank you for joining <strong>Tomato</strong>! Your account has been successfully created and you are now signed in.
              </p>

              <table role="presentation" width="100%" style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px; padding: 16px;">
                <tr>
                  <td style="padding: 6px 10px; font-size: 13px; color: #718096; width: 35%;">Registered Email:</td>
                  <td style="padding: 6px 10px; font-size: 14px; font-weight: 600; color: #1a202c;">${to}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; font-size: 13px; color: #718096;">Account Type:</td>
                  <td style="padding: 6px 10px; font-size: 14px; font-weight: 600; color: #ff5722;">${role}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; font-size: 13px; color: #718096;">Created On:</td>
                  <td style="padding: 6px 10px; font-size: 14px; color: #2d3748;">${formattedDate}</td>
                </tr>
              </table>

              <div style="background: #fff4f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; border: 1px solid rgba(255, 87, 34, 0.2);">
                <p style="margin: 0; font-size: 13.5px; color: #c2410c; font-weight: 600;">
                  🎁 Tip: Use promo code <strong>OFF50%</strong> at checkout to get a 50% discount on your order!
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background: #f8fafc; border-top: 1px solid #edf2f7; padding: 22px 30px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                © ${now.getFullYear()} Tomato Food Delivery. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const transporter = getTransporter();

    if (!transporter) {
        console.log(`\n========================================================`);
        console.log(`[Email Service Simulation] 📧 Welcome / Sign-Up Email generated!`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`User: ${displayName} (${role})`);
        console.log(`Tip: To send live emails, configure EMAIL_USER and EMAIL_PASS in backend/.env`);
        console.log(`========================================================\n`);
        return { success: true, simulated: true };
    }

    try {
        const info = await transporter.sendMail({
            from: sender,
            to,
            subject,
            html: htmlContent
        });
        console.log(`[Email Service] ✅ Sign-Up email delivered to ${to} (MessageId: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[Email Service] ⚠️ Failed to deliver email to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};
