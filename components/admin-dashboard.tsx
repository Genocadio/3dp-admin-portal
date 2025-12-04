"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "@/components/user-management"
import { EvaluationsList } from "@/components/evaluations-list"
import { EvaluationFormBuilder } from "@/components/evaluation-form-builder"
import { AnswersList } from "@/components/answers-list"
import { AnswerReview } from "@/components/answer-review"
import { LayoutDashboard, Users, ClipboardList, CheckSquare } from "lucide-react"
import type { EvaluationForm, DashboardStats } from "@/lib/graphql/types"
import { DASHBOARD_STATS_QUERY } from "@/lib/graphql/evaluations"
import { useQuery } from "@apollo/client/react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ProfileAvatarMenu } from "@/components/profile-avatar-menu"
import Link from "next/link"
import { Loader2 } from "lucide-react"

type AdminDashboardProps = {
  adminName: string
  userId: string
}

const ADMIN_DASHBOARD_TAB_STORAGE_KEY = "admin-dashboard-selected-tab"

export function AdminDashboard({ adminName, userId }: AdminDashboardProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingForm, setEditingForm] = useState<EvaluationForm | null>(null)
  const [reviewingAnswerId, setReviewingAnswerId] = useState<string | null>(null)

  const { data, loading, error } = useQuery<{ dashboardStats: DashboardStats }>(DASHBOARD_STATS_QUERY)

  useEffect(() => {
    // Check if there's a hash in the URL to navigate to a specific tab
    if (typeof window !== "undefined") {
      const hash = window.location.hash
      if (hash === "#users") {
        setActiveTab("users")
        localStorage.setItem(ADMIN_DASHBOARD_TAB_STORAGE_KEY, "users")
        return
      }
      
      // Load persisted tab from localStorage
      const savedTab = localStorage.getItem(ADMIN_DASHBOARD_TAB_STORAGE_KEY)
      if (savedTab === "overview" || savedTab === "evaluations" || savedTab === "submissions" || savedTab === "users") {
        setActiveTab(savedTab)
      }
    }
  }, [])

  // Save tab to localStorage when it changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    localStorage.setItem(ADMIN_DASHBOARD_TAB_STORAGE_KEY, value)
  }

  const stats = data?.dashboardStats
  const pendingReviews = stats?.unreviewedSubmissions?.length || 0
  const recentActivity = [
    ...(stats?.unreviewedSubmissions?.slice(0, 5).map((submission) => ({
      id: submission.id,
      type: "submission",
      status: "pending",
      created_at: submission.createdAt,
    })) || []),
    ...(stats?.incompleteReviews?.slice(0, 5).map((review) => ({
      id: review.id,
      type: "review",
      status: review.status,
      created_at: review.createdAt,
    })) || []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)

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
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-4xl grid-cols-4">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="evaluations" className="gap-2">
                <ClipboardList className="w-4 h-4" />
                Evaluations
              </TabsTrigger>
              <TabsTrigger value="submissions" className="gap-2">
                <CheckSquare className="w-4 h-4" />
                Submissions
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-destructive mb-4">Error loading dashboard stats: {error.message}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Total Evaluations</CardDescription>
                      <CardTitle className="text-4xl">{stats?.totalEvaluationCount || 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Active evaluation forms</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Total Submissions</CardDescription>
                      <CardTitle className="text-4xl">{stats?.totalSubmissionsCount || 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">All submitted answers</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Pending Reviews</CardDescription>
                      <CardTitle className="text-4xl text-accent">{pendingReviews}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Submissions awaiting review</p>
                    </CardContent>
                  </Card>
                </div>

                {stats && (stats.incompleteReviews?.length > 0 || stats.unreviewedSubmissions?.length > 0) && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {stats.incompleteReviews?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Incomplete Reviews</CardTitle>
                          <CardDescription>Reviews that need attention</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {stats.incompleteReviews.slice(0, 5).map((review) => (
                              <div key={review.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div>
                                  <p className="text-sm font-medium">Review {review.id.slice(0, 8)}</p>
                                  <p className="text-xs text-muted-foreground">Status: {review.status}</p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "N/A"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {stats.unreviewedSubmissions?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Unreviewed Submissions</CardTitle>
                          <CardDescription>Submissions that need review</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {stats.unreviewedSubmissions.slice(0, 5).map((submission) => (
                              <div key={submission.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div>
                                  <p className="text-sm font-medium">Submission {submission.id.slice(0, 8)}</p>
                                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : "N/A"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </>
            )}

            {!loading && !error && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest submissions and reviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                    ) : (
                      recentActivity.map((activity: any) => (
                        <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-0">
                          <div>
                            <p className="font-medium">
                              {activity.type === "submission" ? "New Submission" : "Review Update"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {activity.type === "submission" ? "Awaiting review" : `Status: ${activity.status}`}
                            </p>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {activity.created_at ? new Date(activity.created_at).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="evaluations">
            {showCreateForm || editingForm ? (
              <EvaluationFormBuilder
                evaluationForm={editingForm}
                onBack={() => {
                  setShowCreateForm(false)
                  setEditingForm(null)
                }}
                onSuccess={() => {
                  setShowCreateForm(false)
                  setEditingForm(null)
                }}
              />
            ) : (
              <EvaluationsList
                onCreateNew={() => setShowCreateForm(true)}
                onEdit={(form) => setEditingForm(form)}
              />
            )}
          </TabsContent>

          <TabsContent value="submissions">
            {reviewingAnswerId ? (
              <AnswerReview
                answerId={reviewingAnswerId}
                onBack={() => setReviewingAnswerId(null)}
              />
            ) : (
              <AnswersList onReview={(answerId) => setReviewingAnswerId(answerId)} />
            )}
          </TabsContent>

          <TabsContent value="users">
            <UserManagement currentUserId={userId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
