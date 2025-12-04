"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { removeToken, getUserData } from "@/lib/auth/token"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, LayoutDashboard } from "lucide-react"
import type { Profile } from "@/lib/types"

export function ProfileAvatarMenu() {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isOnProfilePage = pathname === "/profile"

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      // Get user data from localStorage (includes role)
      const userData = getUserData()
      if (!userData) {
        setIsLoading(false)
        return
      }

      // Map user data to Profile type
      const userRole = userData.role?.toUpperCase()
      const roleInOrg = userData.roleInOrganization || "manager"
      const validUserRole: "manager" | "ceo" | "accountant" | "other" = 
        roleInOrg === "ceo" || roleInOrg === "accountant" || roleInOrg === "other" 
          ? roleInOrg as "manager" | "ceo" | "accountant" | "other"
          : "manager"
      
      const profileData: Profile = {
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
      setProfile(profileData)
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Remove token from localStorage
      removeToken()
      
      // Remove token from cookie
      document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax"
      
      // Redirect to home page
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  if (isLoading || !profile) {
    return null
  }

  const initials = (profile.full_name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
          title={profile.full_name || "Profile"}
        >
          {initials}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <p className="font-semibold">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isOnProfilePage ? (
          <DropdownMenuItem onClick={() => router.push("/dashboard")}>
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <User className="w-4 h-4 mr-2" />
            Manage Profile
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
