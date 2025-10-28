import { NextResponse } from "next/server"
import crypto from "crypto"
import { emailTemplates } from "@/lib/email-templates"
import { resetCodes } from "../reset-codes-storage"
import { Resend } from "resend"

/**
 * Helper: Send email
 */
async function sendEmail(to: string, subject: string, html: string, text: string) {
  try {
    // For development, log everything
    if (process.env.NODE_ENV === "development") {
      console.log("\n" + "=".repeat(60))
      console.log("📧 EMAIL NOTIFICATION - PASSWORD RESET")
      console.log("=".repeat(60))
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log("-".repeat(60))
      console.log("TEXT VERSION:")
      console.log(text)
      console.log("-".repeat(60))
      console.log("HTML VERSION:")
      console.log(html.substring(0, 200) + "...[HTML truncated]")
      console.log("=".repeat(60) + "\n")
    }

    // Send email with Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
          to,
          subject,
          html
        })
        console.log(`✅ Email sent successfully to ${to}`)
      } catch (resendError: unknown) {
        console.error("❌ Resend error:", resendError instanceof Error ? resendError.message : String(resendError))
        console.log("⚠️ Email service failed but reset code stored")
      }
    } else {
      // Development mode - just log (no email service)
      console.log(`✅ [DEV MODE] No RESEND_API_KEY - Email logged to console (not sent): ${to}`)
    }

    return true
  } catch (error) {
    console.error("❌ Email sending failed:", error)
    return true
  }
}

/**
 * POST /api/auth/password/send-reset-code
 * Send password reset code to email
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString()
    const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes

    // Store code
    resetCodes.set(email, {
      code,
      email,
      expiresAt,
      attempts: 0,
    })

    // Send email
    const emailContent = emailTemplates.passwordReset(code, email.split("@")[0])
    await sendEmail(email, emailContent.subject, emailContent.html, emailContent.text)

    return NextResponse.json({
      message: "Reset code sent to email",
      // Remove in production - only for testing
      testCode: process.env.NODE_ENV === "development" ? code : undefined,
    })
  } catch (error) {
    console.error("Error sending reset code:", error)
    return NextResponse.json({ error: "Failed to send reset code" }, { status: 500 })
  }
}
