import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function AdminPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", data.user.id).single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  return <AdminDashboard adminName={profile.full_name || "Admin"} userId={data.user.id} />
}
