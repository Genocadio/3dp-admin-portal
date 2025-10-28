"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, AlertCircle, Loader2, Users, UserPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Profile, AdminUser } from "@/lib/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function UserManagement() {
  const supabase = createClient()
  const [companyUsers, setCompanyUsers] = useState<Profile[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form states
  const [newAdminName, setNewAdminName] = useState("")
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; type: "company" | "admin" } | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load company users (role = 'user')
      const { data: companyData, error: companyError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "user")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (companyError) throw companyError

      setCompanyUsers(companyData || [])

      // Load admin users
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false })

      if (adminError) throw adminError

      setAdminUsers(adminData || [])
    } catch (err) {
      console.error("Error loading users:", err)
      setError("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAdmin = async () => {
    if (!newAdminName.trim() || !newAdminEmail.trim()) {
      setError("Name and email are required")
      return
    }

    try {
      setIsCreating(true)
      setError(null)

      // Generate temporary password
      const tempPasswordResponse = await fetch("/api/auth/password/generate-temp", {
        method: "POST",
      })

      if (!tempPasswordResponse.ok) {
        throw new Error("Failed to generate temporary password")
      }

      const { tempPassword } = await tempPasswordResponse.json()

      // Create record in admin_users table
      const { error: createError } = await supabase.from("admin_users").insert({
        email: newAdminEmail,
        full_name: newAdminName,
      })

      if (createError) throw createError

      // Send credentials email
      const emailResponse = await fetch("/api/auth/password/send-admin-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newAdminEmail,
          fullName: newAdminName,
          temporaryPassword: tempPassword,
        }),
      })

      if (!emailResponse.ok) {
        console.error("Failed to send credentials email")
        // Still show success since admin was created
      }

      setSuccess(`Admin user created! Temporary password sent to ${newAdminEmail}`)
      setNewAdminName("")
      setNewAdminEmail("")
      setShowCreateDialog(false)
      loadUsers()
    } catch (err) {
      console.error("Error creating admin:", err)
      setError(err instanceof Error ? err.message : "Failed to create admin user")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteCompanyUser = async (userId: string) => {
    try {
      setIsDeletingUser(userId)
      setError(null)

      // Soft delete by marking as inactive
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (updateError) throw updateError

      setSuccess("User deactivated successfully")
      setUserToDelete(null)
      loadUsers()
    } catch (err) {
      console.error("Error deleting user:", err)
      setError(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setIsDeletingUser(null)
    }
  }

  const handleDeleteAdminUser = async (adminId: string) => {
    try {
      setIsDeletingUser(adminId)
      setError(null)

      const { error: deleteError } = await supabase
        .from("admin_users")
        .delete()
        .eq("id", adminId)

      if (deleteError) throw deleteError

      setSuccess("Admin user deleted successfully")
      setUserToDelete(null)
      loadUsers()
    } catch (err) {
      console.error("Error deleting admin:", err)
      setError(err instanceof Error ? err.message : "Failed to delete admin user")
    } finally {
      setIsDeletingUser(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="company" className="w-full">
        <TabsList>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Company Users ({companyUsers.length})
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Admin Users ({adminUsers.length})
          </TabsTrigger>
        </TabsList>

        {/* Company Users Tab */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Users</CardTitle>
              <CardDescription>Manage user accounts from organizations</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}

              {companyUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No company users yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Organisation</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.organisation_name || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {user.user_role}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setUserToDelete({ id: user.id, name: user.full_name || user.email, type: "company" })
                              }
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Users Tab */}
        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Admin Users</CardTitle>
                <CardDescription>Create and manage admin portal accounts</CardDescription>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Admin User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Admin User</DialogTitle>
                    <DialogDescription>
                      Create a new admin account for portal access. The admin will receive their login credentials via email.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="admin-name">Full Name</Label>
                      <Input
                        id="admin-name"
                        type="text"
                        placeholder="John Doe"
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="admin-email">Email Address</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="admin@example.com"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                      />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAdmin} disabled={isCreating}>
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Admin"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}

              {adminUsers.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No admin users created yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminUsers.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">{admin.full_name}</TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>{new Date(admin.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setUserToDelete({ id: admin.id, name: admin.full_name, type: "admin" })
                              }
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={isDeletingUser === admin.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{userToDelete?.name}</span>
              {userToDelete?.type === "company"
                ? "? This will deactivate their account and they won't be able to login."
                : "? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete) {
                  if (userToDelete.type === "company") {
                    handleDeleteCompanyUser(userToDelete.id)
                  } else {
                    handleDeleteAdminUser(userToDelete.id)
                  }
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingUser !== null}
            >
              {isDeletingUser ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
