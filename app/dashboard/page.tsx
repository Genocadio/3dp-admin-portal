import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { UserDashboard } from "@/components/user-dashboard"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  if (!profile) {
    redirect("/")
  }

  // Redirect admins to admin portal
  if (profile.role === "admin") {
    redirect("/admin")
  }

  return <UserDashboard user={profile} />
}
