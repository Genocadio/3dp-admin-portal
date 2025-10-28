/**
 * Email template generator utilities
 */

export const emailTemplates = {
  /**
   * Generate HTML for password reset verification email
   */
  passwordReset: (code: string, userName: string) => ({
    subject: "Reset Your Password - 3DP Admin Portal",
    text: `
Hi ${userName},

You requested a password reset for your 3DP Admin Portal account.

Your verification code is: ${code}

This code will expire in 30 minutes.

If you didn't request this reset, please ignore this email.

Best regards,
3DP Admin Portal Team
    `.trim(),
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .code-box { background: white; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .code { font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 2px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>You requested a password reset for your 3DP Admin Portal account.</p>
              <div class="code-box">
                <p style="margin-top: 0; color: #6b7280; font-size: 14px;">Your Verification Code</p>
                <div class="code">${code}</div>
                <p style="margin-bottom: 0; color: #6b7280; font-size: 12px;">Valid for 30 minutes</p>
              </div>
              <div class="warning">
                <strong>⏱️ Important:</strong> This code will expire in 30 minutes. If you didn't request this reset, please ignore this email.
              </div>
              <p>Best regards,<br><strong>3DP Admin Portal Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} 3DP Admin Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `.trim(),
  }),

  /**
   * Generate HTML for new admin temporary password email
   */
  adminTemporaryPassword: (email: string, temporaryPassword: string, adminName: string) => ({
    subject: "Your Admin Portal Access - Temporary Password",
    text: `
Hi ${adminName},

Your admin account has been created for the 3DP Admin Portal.

Your temporary login credentials:
Email: ${email}
Temporary Password: ${temporaryPassword}

Please login and change your password immediately for security.

Best regards,
3DP Admin Portal Team
    `.trim(),
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials-box { background: white; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .credential-item { margin: 12px 0; padding: 10px; background: #ecfdf5; border-radius: 4px; border-left: 3px solid #10b981; }
            .label { font-weight: 600; color: #047857; }
            .value { font-family: monospace; color: #065f46; font-size: 14px; word-break: break-all; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; border-radius: 4px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Admin Portal</h1>
              <p>Your account has been created</p>
            </div>
            <div class="content">
              <p>Hi ${adminName},</p>
              <p>Your admin account has been created for the 3DP Admin Portal. Below are your temporary login credentials:</p>
              
              <div class="credentials-box">
                <div class="credential-item">
                  <div class="label">Email Address</div>
                  <div class="value">${email}</div>
                </div>
                <div class="credential-item">
                  <div class="label">Temporary Password</div>
                  <div class="value">${temporaryPassword}</div>
                </div>
              </div>

              <div class="warning">
                <strong>🔒 Security Note:</strong> This is a temporary password. Please login immediately and change it to a secure password of your choice.
              </div>

              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://admin.3dp.local"}/" class="button">Login to Portal</a>
              </center>

              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                If you have any issues logging in or didn't request this account, please contact your administrator.
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} 3DP Admin Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `.trim(),
  }),
}

/**
 * Generate a random verification code
 */
export function generateVerificationCode(): string {
  return Math.random().toString().slice(2, 8).padEnd(6, "0")
}

/**
 * Generate a random temporary password
 */
export function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
