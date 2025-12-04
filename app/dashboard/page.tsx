import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { decodeToken, isTokenExpired, type UserData } from "@/lib/auth/token"
import { UserDashboard } from "@/components/user-dashboard"
import type { Profile } from "@/lib/types"

export default async function DashboardPage() {
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
    // Token doesn't have role, so redirect to login to get user data saved
    redirect("/")
  }

  // Redirect admins to admin portal - check for "ADMIN" (uppercase)
  const userRole = userData.role?.toUpperCase()
  if (userRole === "ADMIN") {
    redirect("/admin")
  }

  // Map user data to Profile type for compatibility
  const roleInOrg = userData.roleInOrganization || "manager"
  const validUserRole: "manager" | "ceo" | "accountant" | "other" = 
    roleInOrg === "ceo" || roleInOrg === "accountant" || roleInOrg === "other" 
      ? roleInOrg as "manager" | "ceo" | "accountant" | "other"
      : "manager"
  
  const profile: Profile = {
    id: userData.id || "",
    email: userData.email || "",
    full_name: userData.name || null,
    role: userRole === "ADMIN" ? "admin" : "user",
    organisation_name: userData.organizationName || null,
    user_role: validUserRole,
    phone_number: userData.phone || null,
    is_active: userData.isActive !== false,
    created_at: userData.createdAt || new Date().toISOString(),
    updated_at: userData.updatedAt || new Date().toISOString(),
  }

  return <UserDashboard user={profile} />
}
