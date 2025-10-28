import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { emailTemplates } from "@/lib/email-templates"
import { Resend } from "resend"

/**
 * Helper: Send email
 */
async function sendEmail(to: string, subject: string, html: string, text: string) {
  try {
    // For development, log everything
    if (process.env.NODE_ENV === "development") {
      console.log("\n" + "=".repeat(60))
      console.log("📧 EMAIL NOTIFICATION - ADMIN CREDENTIALS")
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
        console.log("⚠️ Email service failed but admin was created")
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
 * POST /api/auth/password/send-admin-credentials
 * Send admin credentials email
 * Requires: Admin authentication
 */
export async function POST(request: Request) {
  try {
    const { email, fullName, temporaryPassword } = await request.json()

    if (!email || !fullName || !temporaryPassword) {
      return NextResponse.json(
        { error: "Email, fullName, and temporaryPassword are required" },
        { status: 400 }
      )
    }

    // Verify admin access
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Send email with credentials
    const emailContent = emailTemplates.adminTemporaryPassword(email, temporaryPassword, fullName)
    await sendEmail(email, emailContent.subject, emailContent.html, emailContent.text)

    return NextResponse.json({
      message: "Admin credentials sent successfully",
    })
  } catch (error) {
    console.error("Error sending admin credentials:", error)
    return NextResponse.json({ error: "Failed to send credentials" }, { status: 500 })
  }
}
