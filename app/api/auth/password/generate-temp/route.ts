import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import crypto from "crypto"

/**
 * POST /api/auth/password/generate-temp
 * Generate temporary password for new admin
 * Requires: Admin authentication
 */
export async function POST() {
  try {
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

    // Generate temporary password
    const length = 12
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let tempPassword = ""
    for (let i = 0; i < length; i++) {
      tempPassword += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    return NextResponse.json({
      tempPassword,
      message: `Temporary password generated. User must change on first login.`,
    })
  } catch (error) {
    console.error("Error generating temp password:", error)
    return NextResponse.json({ error: "Failed to generate password" }, { status: 500 })
  }
}
