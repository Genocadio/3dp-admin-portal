"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Plus, Eye, FolderOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { Profile, Application, Submission } from "@/lib/types"
import { ApplicationSubmission } from "./application-submission"
import { SubmissionDetailView } from "./submission-detail-view"
import { ProfileAvatarMenu } from "./profile-avatar-menu"

type UserDashboardProps = {
  user: Profile
}

export function UserDashboard({ user }: UserDashboardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState("applications")
  const [applications, setApplications] = useState<Application[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)

  useEffect(() => {
    loadApplications()
    loadSubmissions()
  }, [])

  const loadApplications = async () => {
    const { data } = await supabase
      .from("applications")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (data) {
      setApplications(data)
    }
  }

  const loadSubmissions = async () => {
    const { data } = await supabase
      .from("submissions")
      .select(`
        *,
        application:applications(title)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (data) {
      setSubmissions(data)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default"
      case "under_review":
        return "secondary"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Approved"
      case "under_review":
        return "Under Review"
      case "rejected":
        return "Rejected"
      default:
        return "Pending"
    }
  }

  if (selectedApp) {
    return (
      <ApplicationSubmission
        application={selectedApp}
        userId={user.id}
        onBack={() => {
          setSelectedApp(null)
          loadSubmissions()
        }}
      />
    )
  }

  if (selectedSubmission) {
    return <SubmissionDetailView submissionId={selectedSubmission} onBack={() => setSelectedSubmission(null)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/loggo.webp" alt="3DP Logo" width={50} height={50} className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user.full_name || user.email}</h1>
              <p className="text-sm text-muted-foreground">Complete applications and track your submissions</p>
            </div>
          </div>
          <ProfileAvatarMenu />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="applications">Available Applications</TabsTrigger>
            <TabsTrigger value="submissions">My Submissions</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-4">
            {applications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No applications available at the moment</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {applications.map((app) => (
                  <Card key={app.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <FolderOpen className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>{app.title}</CardTitle>
                      <CardDescription>{app.description || "Complete this application form"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => setSelectedApp(app)} className="w-full">
                        Start Application
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="submissions" className="space-y-4">
            {submissions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No submissions yet</p>
                  <Button onClick={() => setActiveTab("applications")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Browse Applications
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {submissions.map((submission: any) => (
                  <Card key={submission.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{submission.application?.title || "Application"}</CardTitle>
                          <CardDescription>
                            Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge variant={getStatusColor(submission.status)}>{getStatusLabel(submission.status)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Your Score</p>
                          <p className="text-xl font-bold">
                            {submission.max_score > 0
                              ? Math.round((submission.total_score / submission.max_score) * 100)
                              : 0}
                            %
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="text-lg font-semibold text-primary">
                            {submission.status === "pending" ? "Evaluating..." : getStatusLabel(submission.status)}
                          </p>
                        </div>
                      </div>

                      {submission.status === "rejected" && submission.review_notes && (
                        <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 mb-4">
                          <p className="text-sm font-medium mb-2 text-destructive">Rejection Notes:</p>
                          <p className="text-sm text-muted-foreground">{submission.review_notes}</p>
                          {submission.reviewed_at && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Reviewed on {new Date(submission.reviewed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {submission.status === "approved" && submission.review_notes && (
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                          <p className="text-sm font-medium mb-2">Admin Notes:</p>
                          <p className="text-sm text-muted-foreground">{submission.review_notes}</p>
                          {submission.reviewed_at && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Reviewed on {new Date(submission.reviewed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      <Button onClick={() => setSelectedSubmission(submission.id)} className="w-full" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
