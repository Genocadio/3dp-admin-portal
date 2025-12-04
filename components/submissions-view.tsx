"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, FileEdit } from "lucide-react"
import { SubmissionReview } from "@/components/submission-review"

type SubmissionsViewProps = {
  adminId: string
}

export function SubmissionsView({ adminId }: SubmissionsViewProps) {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<any[]>([])

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    // Using dummy data instead of Supabase
    const dummySubmissions = [
      {
        id: "1",
        status: "pending",
        total_score: 45,
        max_score: 100,
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        review_notes: null,
        application: { title: "Sample Application 1" },
        user: { full_name: "John Doe", email: "john@example.com" },
      },
      {
        id: "2",
        status: "under_review",
        total_score: 78,
        max_score: 100,
        submitted_at: new Date(Date.now() - 86400000).toISOString(),
        reviewed_at: null,
        review_notes: "Initial review in progress",
        application: { title: "Sample Application 2" },
        user: { full_name: "Jane Smith", email: "jane@example.com" },
      },
      {
        id: "3",
        status: "approved",
        total_score: 95,
        max_score: 100,
        submitted_at: new Date(Date.now() - 172800000).toISOString(),
        reviewed_at: new Date(Date.now() - 86400000).toISOString(),
        review_notes: "Excellent submission, all requirements met",
        application: { title: "Sample Application 3" },
        user: { full_name: "Bob Johnson", email: "bob@example.com" },
      },
    ]
    setSubmissions(dummySubmissions)
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

  if (selectedSubmissionId) {
    return (
      <SubmissionReview
        submissionId={selectedSubmissionId}
        adminId={adminId}
        onBack={() => {
          setSelectedSubmissionId(null)
          loadSubmissions()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Submissions</h2>
        <p className="text-muted-foreground">Review and manage application submissions</p>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No submissions yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {submission.user?.full_name || submission.user?.email || "Unknown User"}
                    </CardTitle>
                    <CardDescription>
                      {submission.application?.title || "Application"} • Submitted{" "}
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(submission.status)}>{getStatusLabel(submission.status)}</Badge>
                    {submission.status === "pending" && (
                      <Badge variant="secondary" className="gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Needs Review
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-transparent"
                      onClick={() => setSelectedSubmissionId(submission.id)}
                    >
                      <FileEdit className="w-4 h-4" />
                      Review
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-medium">
                        {submission.total_score}/{submission.max_score}
                      </span>
                    </div>
                    <Progress
                      value={submission.max_score > 0 ? (submission.total_score / submission.max_score) * 100 : 0}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Percentage</span>
                      <span className="font-medium">
                        {submission.max_score > 0
                          ? Math.round((submission.total_score / submission.max_score) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={submission.max_score > 0 ? (submission.total_score / submission.max_score) * 100 : 0}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={getStatusColor(submission.status)}>{getStatusLabel(submission.status)}</Badge>
                    </div>
                  </div>
                </div>

                {submission.review_notes && (
                  <div className="mt-4 p-3 rounded-lg bg-muted">
                    <p className="text-sm font-medium mb-1">Review Notes:</p>
                    <p className="text-sm text-muted-foreground">{submission.review_notes}</p>
                    {submission.reviewed_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Reviewed on {new Date(submission.reviewed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
