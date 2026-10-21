import { createMailTransporter, getMailFromAddress } from "@/lib/smtp";

async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = await createMailTransporter();
  const from = await getMailFromAddress();

  if (!transporter || !from) {
    console.warn("Email not sent: SMTP is not configured");
    return;
  }

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

// VERIFY EMAIL
export async function sendVerificationEmail(
  email: string,
  token: string
) {
  const currentYear = new Date().getFullYear();

  const verificationLink =
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }

          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }

          .header {
            background: linear-gradient(135deg, #1f8dff 0%, #005fe0 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }

          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }

          .content {
            padding: 30px;
          }

          .content h2 {
            color: #005fe0;
            margin-top: 0;
          }

          .content p {
            margin: 15px 0;
            font-size: 16px;
          }

          .button {
            display: inline-block;
            background: linear-gradient(135deg, #1f8dff 0%, #005fe0 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }

          .footer {
            background-color: #f4f4f4;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #eee;
          }

          .security-note {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #856404;
          }
        </style>
      </head>

      <body>
        <div class="container">

          <div class="header">
            <h1>Patient</h1>
            <p style="margin: 5px 0; font-size: 14px;">
              Email Verification
            </p>
          </div>

          <div class="content">
            <h2>Welcome to Patient!</h2>

            <p>
              Thank you for registering with us. To complete your account setup,
              please verify your email address by clicking the button below:
            </p>

            <div style="text-align: center;">
              <a
                href="${verificationLink}"
                class="button"
                style="color: white; text-decoration: none;"
              >
                Verify Email Address
              </a>
            </div>

            <p>Or copy and paste this link in your browser:</p>

            <p
              style="
                word-break: break-all;
                background-color: #f4f4f4;
                padding: 10px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
              "
            >
              ${verificationLink}
            </p>

            <div class="security-note">
              <strong>Security Note:</strong>
              If you did not create this account, you can ignore this email.
              The link will expire in 24 hours.
            </div>
          </div>

          <div class="footer">
            <p>© ${currentYear} Patient Scientific. All rights reserved.</p>
            <p>www.Patientscientific.com</p>
          </div>

        </div>
      </body>
    </html>
  `;

  await sendMail({
    to: email,
    subject: "Verify Your Email - Patient Scientific",
    html: htmlContent,
  });
}

// RESET PASSWORD EMAIL
export async function sendResetPasswordEmail(
  email: string,
  token: string
) {
  const currentYear = new Date().getFullYear();

  const resetLink =
    `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }

          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }

          .header {
            background: linear-gradient(135deg, #ff2b2b 0%, #cc2222 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }

          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }

          .content {
            padding: 30px;
          }

          .content h2 {
            color: #ff2b2b;
            margin-top: 0;
          }

          .content p {
            margin: 15px 0;
            font-size: 16px;
          }

          .button {
            display: inline-block;
            background: linear-gradient(135deg, #ff2b2b 0%, #cc2222 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }

          .footer {
            background-color: #f4f4f4;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #eee;
          }

          .security-note {
            background-color: #f8d7da;
            border-left: 4px solid #f5c6cb;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #721c24;
          }

          .expiry {
            background-color: #d1ecf1;
            border-left: 4px solid #bee5eb;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #0c5460;
          }
        </style>
      </head>

      <body>
        <div class="container">

          <div class="header">
            <h1>Patient</h1>

            <p style="margin: 5px 0; font-size: 14px;">
              Password Reset Request
            </p>
          </div>

          <div class="content">
            <h2>Reset Your Password</h2>

            <p>
              We received a request to reset your password.
              Click the button below to create a new password:
            </p>

            <div style="text-align: center;">
              <a
                href="${resetLink}"
                class="button"
                style="color: white; text-decoration: none;"
              >
                Reset Password
              </a>
            </div>

            <p>Or copy and paste this link in your browser:</p>

            <p
              style="
                word-break: break-all;
                background-color: #f4f4f4;
                padding: 10px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
              "
            >
              ${resetLink}
            </p>

            <div class="expiry">
              <strong>⏰ Link Expires:</strong>
              This reset link will expire in 1 hour for security reasons.
            </div>

            <div class="security-note">
              <strong>⚠️ Security Alert:</strong>
              If you did not request a password reset, please ignore this email.
              Your password will remain unchanged.
              Do not share this link with anyone.
            </div>
          </div>

          <div class="footer">
            <p>© ${currentYear} Patient Scientific. All rights reserved.</p>
            <p>www.Patientscientific.com</p>
          </div>

        </div>
      </body>
    </html>
  `;

  await sendMail({
    to: email,
    subject: "Reset Your Password - Patient Scientific",
    html: htmlContent,
  });
}

// NEW ACCOUNT CREDENTIALS (auto-created from an enquiry)
export async function sendNewAccountCredentialsEmail(options: {
  email: string;
  name: string | null;
  password: string;
}) {
  const currentYear = new Date().getFullYear();
  const displayName = options.name?.trim() || "there";
  const loginLink = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/login`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #1f8dff 0%, #005fe0 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 30px; }
          .content h2 { color: #005fe0; margin-top: 0; }
          .content p { margin: 15px 0; font-size: 16px; }
          .credentials {
            background-color: #f4f7fb;
            border: 1px solid #d6e4ff;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .credentials p { margin: 8px 0; font-size: 15px; }
          .credentials code {
            background-color: #ffffff;
            border: 1px solid #d6e4ff;
            border-radius: 4px;
            padding: 4px 8px;
            font-family: monospace;
            font-size: 15px;
            color: #005fe0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #1f8dff 0%, #005fe0 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .security-note {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #856404;
          }
          .footer {
            background-color: #f4f4f4;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Patient</h1>
            <p style="margin: 5px 0; font-size: 14px;">Your Account Is Ready</p>
          </div>
          <div class="content">
            <h2>Welcome, ${displayName}!</h2>
            <p>
              Thank you for your enquiry with
              <strong>Patient Scientific Catalogue</strong>. We have created an
              account for you so you can track your enquiries and orders.
            </p>

            <div class="credentials">
              <p><strong>Email:</strong> <code>${options.email}</code></p>
              <p><strong>Temporary Password:</strong> <code>${options.password}</code></p>
            </div>

            <div style="text-align: center;">
              <a href="${loginLink}" class="button" style="color: white; text-decoration: none;">
                Log In to Your Account
              </a>
            </div>

            <div class="security-note">
              <strong>Security Note:</strong>
              For your safety, please log in and change this password as soon as
              possible. Do not share these credentials with anyone.
            </div>
          </div>
          <div class="footer">
            <p>© ${currentYear} Patient Scientific. All rights reserved.</p>
            <p>www.Patientscientific.com</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendMail({
    to: options.email,
    subject: "Your Account Details - Patient Scientific",
    html: htmlContent,
  });
}

export async function sendUserAccountUpdateEmail(options: {
  email: string;
  name: string | null;
  role: "admin" | "user";
  changes: {
    emailChanged: boolean;
    roleChanged: boolean;
    previousEmail?: string;
    previousRole?: "admin" | "user";
  };
}) {
  const currentYear = new Date().getFullYear();
  const displayName = options.name?.trim() || "there";
  const roleLabel = options.role === "admin" ? "Admin" : "User";
  const changeLines: string[] = [];

  if (options.changes.emailChanged && options.changes.previousEmail) {
    changeLines.push(
      `<li>Email updated from <strong>${options.changes.previousEmail}</strong> to <strong>${options.email}</strong></li>`
    );
  }

  if (options.changes.roleChanged && options.changes.previousRole) {
    const previousRoleLabel =
      options.changes.previousRole === "admin" ? "Admin" : "User";
    changeLines.push(
      `<li>Role updated from <strong>${previousRoleLabel}</strong> to <strong>${roleLabel}</strong></li>`
    );
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #1f8dff 0%, #005fe0 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 30px;
          }
          .footer {
            background-color: #f4f4f4;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Patient</h1>
            <p style="margin: 5px 0; font-size: 14px;">Account Update</p>
          </div>
          <div class="content">
            <h2>Hello ${displayName},</h2>
            <p>Your account details were updated by an administrator.</p>
            <ul>${changeLines.join("")}</ul>
            <p>Your current role is <strong>${roleLabel}</strong> and your login email is <strong>${options.email}</strong>.</p>
            <p>If you did not expect this change, please contact support.</p>
          </div>
          <div class="footer">
            <p>© ${currentYear} Patient Scientific. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendMail({
    to: options.email,
    subject: "Your Account Has Been Updated - Patient Scientific",
    html: htmlContent,
  });
}
