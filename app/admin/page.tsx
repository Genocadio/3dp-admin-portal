import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { decodeToken, isTokenExpired, type UserData } from "@/lib/auth/token"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function AdminPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token || isTokenExpired(token)) {
    redirect("/")
  }

  // Get user data from cookie (preferred) or decode token
  let userData: UserData | null = null
  const userDataCookie = cookieStore.get("user_data")?.value
  if (userDataCookie) {
    try {
      userData = JSON.parse(decodeURIComponent(userDataCookie)) as UserData
    } catch {
      // Fallback to token decoding
    }
  }

  // If no user data in cookie, try to decode token
  if (!userData) {
    const decoded = decodeToken(token)
    if (!decoded) {
      redirect("/")
    }
    // Token doesn't have role, so we can't verify admin status
    // Redirect to dashboard - user should login again to get user data saved
    redirect("/dashboard")
  }

  // Check if user is admin - check for "ADMIN" (uppercase)
  const userRole = userData.role?.toUpperCase()
  if (userRole !== "ADMIN") {
    redirect("/dashboard")
  }

  const adminName = userData.name || "Admin"
  const userId = userData.id || ""

  return <AdminDashboard adminName={adminName} userId={userId} />
}
