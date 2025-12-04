"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, FileText } from "lucide-react"
import Image from "next/image"
import { downloadPDFReport, type SubmissionReportData } from "@/lib/pdf-generator"

type SubmissionDetailViewProps = {
  submissionId: string
  onBack: () => void
}

export function SubmissionDetailView({ submissionId, onBack }: SubmissionDetailViewProps) {
  const [submission, setSubmission] = useState<any>(null)
  const [answers, setAnswers] = useState<any[]>([])
  const [media, setMedia] = useState<any[]>([])
  const [userOrganisation, setUserOrganisation] = useState<string | undefined>(undefined)

  useEffect(() => {
    loadSubmissionDetails()
  }, [submissionId])

  const loadSubmissionDetails = async () => {
    // Using dummy data instead of Supabase
    const dummySubmission = {
      id: submissionId,
      application_id: "1",
      user_id: "user-1",
      status: "pending",
      total_score: 75,
      max_score: 100,
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
      review_notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      application: { title: "Application Form 2024" },
      user: { full_name: "John Doe", organisation_name: "Example Organisation" },
    }
    setSubmission(dummySubmission)
    setUserOrganisation(dummySubmission.user.organisation_name)

    const dummyAnswers = [
      {
        id: "1",
        submission_id: submissionId,
        question_id: "1",
        answer_text: "Sample answer",
        answer_value: null,
        points_earned: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        question: {
          id: "1",
          question_text: "What is your name?",
          question_type: "text",
        },
      },
    ]
    setAnswers(dummyAnswers)

    const dummyMedia: any[] = []
    setMedia(dummyMedia)
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const handleDownloadReport = () => {
    // Group answers by category for the report
    const answersByCategory = new Map<string, any[]>()
    answers.forEach((answer) => {
      const categoryTitle = answer.question?.category?.title || "Uncategorized"
      if (!answersByCategory.has(categoryTitle)) {
        answersByCategory.set(categoryTitle, [])
      }
      answersByCategory.get(categoryTitle)!.push(answer)
    })

    // Calculate percentages
    const categoryScores = Array.from(answersByCategory.entries()).map(([categoryTitle, categoryAnswers]) => {
      const categoryMax = categoryAnswers.reduce((sum, ans) => sum + (ans.question?.points || 0), 0)
      const categoryScore = categoryAnswers.reduce((sum, ans) => sum + ans.points_earned, 0)
      const categoryPercentage = categoryMax > 0 ? Math.round((categoryScore / categoryMax) * 100) : 0

      return {
        title: categoryTitle,
        percentage: categoryPercentage,
        answers: categoryAnswers.map((answer) => ({
          questionText: answer.question?.question_text || "Question",
          answer: answer.answer_text || answer.answer_value || "No answer provided",
          percentage: answer.question?.points ? Math.round((answer.points_earned / answer.question.points) * 100) : 0,
        })),
      }
    })

    const reportData: SubmissionReportData = {
      applicationTitle: submission.application?.title || "Application",
      applicantName: submission.user?.full_name || "Applicant",
      applicantOrganisation: userOrganisation,
      submittedDate: new Date(submission.submitted_at).toLocaleDateString(),
      reviewedDate: submission.reviewed_at ? new Date(submission.reviewed_at).toLocaleDateString() : undefined,
      status: submission.status,
      percentage: submission.max_score > 0 ? Math.round((submission.total_score / submission.max_score) * 100) : 0,
      categoryScores,
      reviewNotes: submission.review_notes || undefined,
    }

    downloadPDFReport(reportData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Image src="/loggo.webp" alt="3DP Logo" width={50} height={50} className="h-10 w-auto" />
              <div>
                <h1 className="text-2xl font-bold">{submission.application?.title || "Application"}</h1>
                <p className="text-sm text-muted-foreground">
                  Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {submission.status === "approved" && (
                <Button onClick={handleDownloadReport} variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download Report
                </Button>
              )}
              <Badge
                variant={
                  submission.status === "approved"
                    ? "default"
                    : submission.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
              >
                {submission.status === "approved"
                  ? "Approved"
                  : submission.status === "rejected"
                    ? "Rejected"
                    : submission.status === "under_review"
                      ? "Under Review"
                      : "Pending"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Your Score</CardDescription>
              <CardTitle className="text-3xl">
                {submission.total_score}/{submission.max_score}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {submission.max_score > 0 ? Math.round((submission.total_score / submission.max_score) * 100) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Questions Answered</CardDescription>
              <CardTitle className="text-3xl">{answers.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{media.length} documents uploaded</p>
            </CardContent>
          </Card>
        </div>

        {(submission.status === "approved" || submission.status === "rejected") && submission.review_notes && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Review</CardTitle>
              <CardDescription>Reviewed on {new Date(submission.reviewed_at).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{submission.review_notes}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your Answers</CardTitle>
            <CardDescription>Review your submitted responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {answers.map((answer, idx) => {
              // Get media files for this question
              const questionMedia = media.filter((m) => m.question_id === answer.question_id)
              const isMediaOnlyQuestion = answer.question?.question_type === "media_only"

              return (
                <div key={answer.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">Q{idx + 1}</span>
                      </div>
                      <p className="font-medium">{answer.question?.question_text}</p>
                    </div>
                  </div>

                  {!isMediaOnlyQuestion && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm">{answer.answer_text || answer.answer_value || "No answer"}</p>
                    </div>
                  )}

                  {questionMedia.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Uploaded Files:</p>
                      <div className="space-y-2">
                        {questionMedia.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2 flex-1">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-xs truncate">{file.file_name}</p>
                                <p className="text-xs text-muted-foreground">{(file.file_size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild className="ml-2 flex-shrink-0">
                              <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="w-3 h-3" />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {media.some((m) => !answers.find((a) => a.question_id === m.question_id)) && (
          <Card>
            <CardHeader>
              <CardTitle>Unlinked Documents</CardTitle>
              <CardDescription>Files that could not be linked to a question</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {media
                .filter((m) => !answers.find((a) => a.question_id === m.question_id))
                .map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">{(file.file_size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        View
                      </a>
                    </Button>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
