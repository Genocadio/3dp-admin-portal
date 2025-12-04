"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useQuery, useMutation } from "@apollo/client/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Lock } from "lucide-react"
import { ME_QUERY } from "@/lib/graphql/users"
import { CHANGE_PASSWORD_MUTATION, UPDATE_PROFILE_MUTATION } from "@/lib/graphql/mutations"
import type { User } from "@/lib/graphql/types"
import type { Profile } from "@/lib/types"
import { useRouter } from "next/navigation"
import { ProfileAvatarMenu } from "@/components/profile-avatar-menu"

export default function ProfilePage() {
  const router = useRouter()
  const { data, loading, error: queryError, refetch } = useQuery<{ me: User }>(ME_QUERY, {
    fetchPolicy: "network-only",
  })
  const [changePassword, { loading: changingPassword }] = useMutation(CHANGE_PASSWORD_MUTATION)
  const [updateProfile, { loading: updatingProfile }] = useMutation(UPDATE_PROFILE_MUTATION, {
    refetchQueries: [{ query: ME_QUERY }],
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Editable fields
  const [fullName, setFullName] = useState("")
  const [organisationName, setOrganisationName] = useState("")
  const [userRole, setUserRole] = useState("manager")
  const [phoneNumber, setPhoneNumber] = useState("")

  // Password change fields
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  // Map GraphQL User to Profile type and update form fields
  useEffect(() => {
    if (data?.me) {
      const user = data.me
      const userRoleUpper = user.role?.toUpperCase()
      const roleInOrg = user.roleInOrganization || "manager"
      const validUserRole: "manager" | "ceo" | "accountant" | "other" = 
        roleInOrg === "ceo" || roleInOrg === "accountant" || roleInOrg === "other" 
          ? roleInOrg as "manager" | "ceo" | "accountant" | "other"
          : "manager"

      setFullName(user.name || "")
      setOrganisationName(user.organizationName || "")
      setUserRole(validUserRole)
      setPhoneNumber(user.phone || "")
    }
  }, [data])

  const loadProfile = () => {
    refetch()
  }

  // Map User to Profile for compatibility
  const profile: Profile | null = data?.me ? {
    id: data.me.id,
    email: data.me.email,
    full_name: data.me.name || null,
    role: data.me.role?.toUpperCase() === "ADMIN" ? "admin" : "user",
    organisation_name: data.me.organizationName || null,
    user_role: (data.me.roleInOrganization || "manager") as "manager" | "ceo" | "accountant" | "other",
    phone_number: data.me.phone || null,
    is_active: data.me.isActive,
    created_at: data.me.createdAt || new Date().toISOString(),
    updated_at: data.me.updatedAt || new Date().toISOString(),
  } : null

  const isLoading = loading

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)

      if (!profile) {
        throw new Error("Profile not loaded")
      }

      const isAdmin = profile.role === "admin" || profile.role?.toUpperCase() === "ADMIN"

      // Build update input - only include fields that can be updated
      const updateInput: {
        name?: string | null
        organizationName?: string | null
        phone?: string | null
        roleInOrganization?: string | null
      } = {
        name: fullName || null,
        phone: phoneNumber || null,
      }

      // Only update organization fields if user is not admin
      if (!isAdmin) {
        updateInput.organizationName = organisationName || null
        updateInput.roleInOrganization = userRole || null
      }

      await updateProfile({
        variables: { input: updateInput },
      })

      setSuccess("Profile updated successfully!")
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Error saving profile:", error)
      setError(error?.message || "Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password")
      return
    }

    setIsChangingPassword(true)

    try {
      await changePassword({
        variables: {
          input: {
            currentPassword,
            newPassword,
          },
        },
      })

      setPasswordSuccess("Password changed successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(null), 3000)
    } catch (error: any) {
      setPasswordError(error?.message || "Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (queryError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading profile: {queryError.message}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    )
  }

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const isAdmin = profile.role === "admin" || profile.role?.toUpperCase() === "ADMIN"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/loggo.webp" alt="3DP Logo" width={50} height={50} className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold">Profile Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account information</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ProfileAvatarMenu />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Summary Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {initials}
              </div>
              <div className="text-center">
                <p className="font-semibold">{fullName}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
              {!isAdmin && (
                <>
                  <div className="w-full border-t pt-4">
                    <p className="text-sm font-semibold mb-1">Organisation</p>
                    <p className="text-sm text-muted-foreground">{organisationName || "Not set"}</p>
                  </div>
                  <div className="w-full">
                    <p className="text-sm font-semibold mb-1">Role</p>
                    <p className="text-sm text-muted-foreground capitalize">{userRole}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tabs for Profile & Password */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6 mt-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSaveProfile()
                    }}
                    className="space-y-6"
                  >
                    <div className={`grid gap-4 ${isAdmin ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
                      <div className="grid gap-2">
                        <Label htmlFor="full-name">Full Name</Label>
                        <Input
                          id="full-name"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>

                    {!isAdmin && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="organisation">Organisation Name</Label>
                          <Input
                            id="organisation"
                            type="text"
                            placeholder="Your company name"
                            value={organisationName}
                            onChange={(e) => setOrganisationName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="user-role">Your Role</Label>
                          <Select value={userRole} onValueChange={setUserRole}>
                            <SelectTrigger id="user-role">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="ceo">CEO</SelectItem>
                              <SelectItem value="accountant">Accountant</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-green-600">{success}</p>}

                    <div className="flex gap-4 pt-4">
                      <Button type="submit" disabled={isSaving || updatingProfile}>
                        {isSaving || updatingProfile ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => loadProfile()}>
                        Reset
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                {/* Password Tab */}
                <TabsContent value="password" className="space-y-6 mt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      ℹ️ Enter your current password and set a new one. Your new password must be at least 8 characters long.
                    </p>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        placeholder="Enter your current password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={isChangingPassword}
                      />
                    </div>

                    <div className="border-t pt-4">
                      <div className="grid gap-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Enter new password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={isChangingPassword}
                        />
                      </div>

                      <div className="grid gap-2 mt-4">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm new password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isChangingPassword}
                        />
                      </div>
                    </div>

                    {passwordError && (
                      <p className="text-sm text-red-500">{passwordError}</p>
                    )}
                    {passwordSuccess && (
                      <p className="text-sm text-green-600">{passwordSuccess}</p>
                    )}

                    <Button type="submit" disabled={isChangingPassword || changingPassword} className="w-full">
                      {isChangingPassword || changingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
