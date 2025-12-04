"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import { USERS_QUERY, ACTIVATE_USER_MUTATION, DEACTIVATE_USER_MUTATION, DELETE_USER_MUTATION } from "@/lib/graphql/users"
import { REGISTER_MUTATION } from "@/lib/graphql/mutations"
import { getToken, decodeToken } from "@/lib/auth/token"
import type { User } from "@/lib/graphql/types"
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
import { Plus, Trash2, AlertCircle, Loader2, Users, UserPlus, CheckCircle2, XCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type UserManagementProps = {
  currentUserId?: string
}

const USER_MANAGEMENT_TAB_STORAGE_KEY = "user-management-selected-tab"

export function UserManagement({ currentUserId }: UserManagementProps) {
  const { data, loading, error: queryError, refetch } = useQuery<{ users: User[] }>(USERS_QUERY)
  const [activateUser, { loading: activating }] = useMutation(ACTIVATE_USER_MUTATION, {
    refetchQueries: [{ query: USERS_QUERY }],
  })
  const [deactivateUser, { loading: deactivating }] = useMutation(DEACTIVATE_USER_MUTATION, {
    refetchQueries: [{ query: USERS_QUERY }],
  })
  const [deleteUser, { loading: deleting }] = useMutation(DELETE_USER_MUTATION, {
    refetchQueries: [{ query: USERS_QUERY }],
  })
  const [registerMutation, { loading: isCreating }] = useMutation(REGISTER_MUTATION, {
    refetchQueries: [{ query: USERS_QUERY }],
  })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("company")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; email: string } | null>(null)

  // Form states
  const [newAdminName, setNewAdminName] = useState("")
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [newAdminPassword, setNewAdminPassword] = useState("")
  const [newAdminPhone, setNewAdminPhone] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [userToDeactivate, setUserToDeactivate] = useState<{ id: string; name: string; isActive: boolean } | null>(null)

  // Load persisted tab from localStorage on mount
  useEffect(() => {
    const savedTab = localStorage.getItem(USER_MANAGEMENT_TAB_STORAGE_KEY)
    if (savedTab === "company" || savedTab === "admins") {
      setActiveTab(savedTab)
    }
  }, [])

  // Save tab to localStorage when it changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    localStorage.setItem(USER_MANAGEMENT_TAB_STORAGE_KEY, value)
  }

  // Get current user ID from token if not provided
  useEffect(() => {
    if (!currentUserId) {
      const token = getToken()
      if (token) {
        const decoded = decodeToken(token)
        if (decoded?.id) {
          // Store in a way we can use it
        }
      }
    }
  }, [currentUserId])

  // Get current user ID
  const getCurrentUserId = (): string | null => {
    if (currentUserId) return currentUserId
    const token = getToken()
    if (token) {
      const decoded = decodeToken(token)
      return decoded?.id || decoded?.userId || null
    }
    return null
  }

  // Filter users by role
  const allUsers = data?.users || []
  const companyUsers = allUsers.filter((user) => {
    const role = String(user.role || "").toUpperCase()
    return role === "USER"
  })
  const adminUsers = allUsers.filter((user) => {
    const role = String(user.role || "").toUpperCase()
    return role === "ADMIN"
  })

  const isLoading = loading

  const handleCreateAdmin = async () => {
    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
      setError("Name, email, and password are required")
      return
    }

    try {
      setError(null)
      setSuccess(null)

      // Create admin user using REGISTER_MUTATION
      // Omit organizationName and roleInOrganization (set to null)
      // Set role to "ADMIN" explicitly
      await registerMutation({
        variables: {
          input: {
            email: newAdminEmail.trim(),
            name: newAdminName.trim(),
            password: newAdminPassword,
            organizationName: null,
            role: "ADMIN",
            roleInOrganization: null,
            phone: newAdminPhone.trim() || null,
          },
        },
      })

      setSuccess(`Admin user created successfully!`)
      setNewAdminName("")
      setNewAdminEmail("")
      setNewAdminPassword("")
      setNewAdminPhone("")
      setShowCreateDialog(false)
    } catch (err: any) {
      console.error("Error creating admin:", err)
      setError(err?.message || "Failed to create admin user")
    }
  }

  const handleActivateUser = async (userId: string) => {
    try {
      setError(null)
      setSuccess(null)

      await activateUser({
        variables: { userId },
      })

      setSuccess("User activated successfully")
      setUserToDeactivate(null)
    } catch (err: any) {
      console.error("Error activating user:", err)
      setError(err?.message || "Failed to activate user")
    }
  }

  const handleDeactivateUser = async (userId: string) => {
    // Prevent self-deactivation
    const currentUserId = getCurrentUserId()
    if (currentUserId && userId === currentUserId) {
      setError("You cannot deactivate your own account")
      setUserToDeactivate(null)
      return
    }

    try {
      setError(null)
      setSuccess(null)

      await deactivateUser({
        variables: { userId },
      })

      setSuccess("User deactivated successfully")
      setUserToDeactivate(null)
    } catch (err: any) {
      console.error("Error deactivating user:", err)
      setError(err?.message || "Failed to deactivate user")
    }
  }

  const handleDeleteClick = (user: User) => {
    const currentUserId = getCurrentUserId()
    if (currentUserId && user.id === currentUserId) {
      setError("You cannot delete your own account")
      return
    }
    setUserToDelete({ id: user.id, name: user.name || "User", email: user.email })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      setError(null)
      setSuccess(null)
      await deleteUser({
        variables: { userId: userToDelete.id },
      })
      setSuccess(`User ${userToDelete.name} has been deleted`)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (err: any) {
      console.error("Error deleting user:", err)
      setError(err?.message || "Failed to delete user")
      setDeleteDialogOpen(false)
    }
  }

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (queryError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">Error loading users: {queryError.message}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex justify-center mb-6">
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
        </div>

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
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead className="w-[250px]">Email</TableHead>
                        <TableHead className="w-[200px]">Organisation</TableHead>
                        <TableHead className="w-[200px]">Role in Organisation</TableHead>
                        <TableHead className="w-[150px]">Status</TableHead>
                        <TableHead className="w-[150px]">Joined</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyUsers.map((user) => {
                        const currentUserId = getCurrentUserId()
                        const isCurrentUser = currentUserId === user.id
                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.organizationName || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {user.roleInOrganization || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.isActive ? (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-600 border-red-600">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {user.isActive ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setUserToDeactivate({ id: user.id, name: user.name || user.email, isActive: true })
                                    }
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    disabled={isCurrentUser || deactivating}
                                    title={isCurrentUser ? "You cannot deactivate your own account" : "Deactivate user"}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleActivateUser(user.id)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    disabled={activating}
                                    title="Activate user"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(user)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={isCurrentUser || deleting}
                                  title={isCurrentUser ? "You cannot delete your own account" : "Delete user"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
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
                    <div className="grid gap-2">
                      <Label htmlFor="admin-password">Password</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder="Enter password"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="admin-phone">Phone (Optional)</Label>
                      <Input
                        id="admin-phone"
                        type="tel"
                        placeholder="+1234567890"
                        value={newAdminPhone}
                        onChange={(e) => setNewAdminPhone(e.target.value)}
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
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead className="w-[250px]">Email</TableHead>
                        <TableHead className="w-[150px]">Phone</TableHead>
                        <TableHead className="w-[150px]">Status</TableHead>
                        <TableHead className="w-[150px]">Created</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminUsers.map((admin) => {
                        const currentUserId = getCurrentUserId()
                        const isCurrentUser = currentUserId === admin.id
                        return (
                          <TableRow key={admin.id}>
                            <TableCell className="font-medium">{admin.name}</TableCell>
                            <TableCell>{admin.email}</TableCell>
                            <TableCell>{admin.phone || "N/A"}</TableCell>
                            <TableCell>
                              {admin.isActive ? (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-600 border-red-600">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {admin.isActive ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setUserToDeactivate({ id: admin.id, name: admin.name || admin.email, isActive: true })
                                    }
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    disabled={isCurrentUser || deactivating}
                                    title={isCurrentUser ? "You cannot deactivate your own account" : "Deactivate user"}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleActivateUser(admin.id)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    disabled={activating}
                                    title="Activate user"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(admin)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={isCurrentUser || deleting}
                                  title={isCurrentUser ? "You cannot delete your own account" : "Delete user"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user <span className="font-semibold">{userToDelete?.name}</span> ({userToDelete?.email})? 
              This action cannot be undone and will permanently remove the user account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={!!userToDeactivate} onOpenChange={() => setUserToDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{userToDeactivate?.isActive ? "Deactivate User" : "Activate User"}</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDeactivate?.isActive ? (
                <>
                  Are you sure you want to deactivate{" "}
                  <span className="font-semibold">{userToDeactivate?.name}</span>
                  ? This will prevent them from logging in. You can reactivate them later.
                </>
              ) : (
                <>
                  Are you sure you want to activate{" "}
                  <span className="font-semibold">{userToDeactivate?.name}</span>
                  ? This will allow them to log in again.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDeactivate) {
                  if (userToDeactivate.isActive) {
                    handleDeactivateUser(userToDeactivate.id)
                  } else {
                    handleActivateUser(userToDeactivate.id)
                  }
                }
              }}
              className={userToDeactivate?.isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              disabled={deactivating || activating}
            >
              {deactivating || activating
                ? "Processing..."
                : userToDeactivate?.isActive
                  ? "Deactivate"
                  : "Activate"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

