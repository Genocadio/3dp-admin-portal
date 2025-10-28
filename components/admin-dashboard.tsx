"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApplicationManager } from "@/components/application-manager"
import { SubmissionsView } from "@/components/submissions-view"
import { UserManagement } from "@/components/user-management"
import { LayoutDashboard, FolderOpen, FileText, Users } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ProfileAvatarMenu } from "@/components/profile-avatar-menu"

type AdminDashboardProps = {
  adminName: string
  userId: string
}

export function AdminDashboard({ adminName, userId }: AdminDashboardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [stats, setStats] = useState({
    applications: 0,
    totalQuestions: 0,
    pendingReviews: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    loadStats()
    loadRecentActivity()
  }, [])

  const loadStats = async () => {
    // Get applications count
    const { count: appsCount } = await supabase.from("applications").select("*", { count: "exact", head: true })

    // Get total questions count
    const { count: questionsCount } = await supabase.from("questions").select("*", { count: "exact", head: true })

    // Get pending reviews count
    const { count: pendingCount } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    setStats({
      applications: appsCount || 0,
      totalQuestions: questionsCount || 0,
      pendingReviews: pendingCount || 0,
    })
  }

  const loadRecentActivity = async () => {
    const { data: submissions } = await supabase
      .from("submissions")
      .select(`
        *,
        application:applications(title),
        user:profiles(full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(5)

    if (submissions) {
      setRecentActivity(submissions)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/loggo.webp" alt="3DP Logo" width={50} height={50} className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold">Admin Portal</h1>
              <p className="text-sm text-muted-foreground">Welcome, {adminName}</p>
            </div>
          </div>
          <ProfileAvatarMenu />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 w-full">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-4xl grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-2">
              <FileText className="w-4 h-4" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Applications</CardDescription>
                  <CardTitle className="text-4xl">{stats.applications}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Active application forms</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Questions</CardDescription>
                  <CardTitle className="text-4xl">{stats.totalQuestions}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Across all applications</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Pending Reviews</CardDescription>
                  <CardTitle className="text-4xl text-accent">{stats.pendingReviews}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Submissions awaiting review</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest submissions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                  ) : (
                    recentActivity.map((activity: any) => (
                      <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div>
                          <p className="font-medium">{activity.user?.full_name || "Unknown User"}</p>
                          <p className="text-sm text-muted-foreground">
                            Submitted {activity.application?.title || "application"} • Status: {activity.status}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationManager userId={userId} />
          </TabsContent>

          <TabsContent value="submissions">
            <SubmissionsView adminId={userId} />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
