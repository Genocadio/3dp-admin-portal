"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type SubmissionReviewProps = {
  submissionId: string
  adminId: string
  onBack: () => void
}

export function SubmissionReview({ submissionId, adminId, onBack }: SubmissionReviewProps) {
  const supabase = createClient()
  const [submission, setSubmission] = useState<any>(null)
  const [answers, setAnswers] = useState<any[]>([])
  const [media, setMedia] = useState<any[]>([])
  const [status, setStatus] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSubmissionDetails()
  }, [submissionId])

  const loadSubmissionDetails = async () => {
    // Load submission
    const { data: submissionData } = await supabase
      .from("submissions")
      .select(`
        *,
        application:applications(title),
        user:profiles!submissions_user_id_fkey(full_name, email, organisation_name)
      `)
      .eq("id", submissionId)
      .single()

    if (submissionData) {
      setSubmission(submissionData)
      setStatus(submissionData.status)
      setNotes(submissionData.review_notes || "")
    }

    // Load answers with questions
    const { data: answersData } = await supabase
      .from("submission_answers")
      .select(`
        *,
        question:questions(*)
      `)
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: true })

    if (answersData) {
      setAnswers(answersData)
    }

    // Load media
    const { data: mediaData } = await supabase
      .from("submission_media")
      .select(`
        *,
        question:questions(question_text)
      `)
      .eq("submission_id", submissionId)

    if (mediaData) {
      setMedia(mediaData)
    }
  }

  const handleSaveReview = async () => {
    setIsSaving(true)

    try {
      // If approving, grant full marks to media upload questions
      if (status === "approved") {
        // Get all answers that need points granted (media_only or media uploads)
        const answersToUpdate = answers.filter(
          (answer) =>
            answer.question?.question_type === "media_only" ||
            (answer.question?.media_upload_config?.required && !answer.points_earned),
        )

        // Update points for media upload questions
        for (const answer of answersToUpdate) {
          const maxPoints = answer.question?.points || 0
          if (maxPoints > 0) {
            await supabase
              .from("submission_answers")
              .update({
                points_earned: maxPoints,
              })
              .eq("id", answer.id)
          }
        }

        // Recalculate total score with media uploads granted
        let newTotalScore = 0
        let newMaxScore = 0

        answers.forEach((answer) => {
          newMaxScore += answer.question?.points || 0
          if (answer.question?.question_type === "media_only" || answer.question?.media_upload_config?.required) {
            // Grant full marks to media questions
            newTotalScore += answer.question?.points || 0
          } else {
            // Keep auto-scored marks
            newTotalScore += answer.points_earned || 0
          }
        })

        // Update submission with new score
        const { error } = await supabase
          .from("submissions")
          .update({
            status,
            review_notes: notes,
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            total_score: newTotalScore,
            max_score: newMaxScore,
          })
          .eq("id", submissionId)

        if (!error) {
          onBack()
        } else {
          alert("Failed to save review")
        }
      } else {
        // For reject or other statuses, just update without granting points
        const { error } = await supabase
          .from("submissions")
          .update({
            status,
            review_notes: notes,
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", submissionId)

        if (!error) {
          onBack()
        } else {
          alert("Failed to save review")
        }
      }
    } catch (error) {
      console.error("Error saving review:", error)
      alert("Failed to save review")
    }

    setIsSaving(false)
  }

  if (!submission) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading submission...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Submissions
        </Button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Image src="/loggo.webp" alt="3DP Logo" width={50} height={50} className="h-10 w-auto" />
            <div>
              <h2 className="text-2xl font-bold">{submission.application?.title || "Application"}</h2>
              <p className="text-muted-foreground">
                Submitted by {submission.user?.full_name || submission.user?.email}
                {submission.user?.organisation_name && ` (${submission.user.organisation_name})`} on{" "}
                {new Date(submission.submitted_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Badge variant={status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"}>
            {status === "approved"
              ? "Approved"
              : status === "rejected"
                ? "Rejected"
                : status === "under_review"
                  ? "Under Review"
                  : "Pending"}
          </Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Score</CardDescription>
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
            <p className="text-sm text-muted-foreground">Total responses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Documents Uploaded</CardDescription>
            <CardTitle className="text-3xl">{media.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Media files</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Answers & Responses</CardTitle>
          <CardDescription>Review all submitted answers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {answers.map((answer, idx) => (
            <div key={answer.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">Q{idx + 1}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {answer.points_earned}/{answer.question?.points || 0} pts
                    </span>
                  </div>
                  <p className="font-medium">{answer.question?.question_text}</p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Answer: </span>
                  {answer.answer_text || answer.answer_value || "No answer provided"}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {media.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>Review all submitted media files</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {media.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.question?.question_text?.substring(0, 50)}... • {(file.file_size / 1024).toFixed(1)} KB
                    </p>
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

      <Card>
        <CardHeader>
          <CardTitle>Review & Decision</CardTitle>
          <CardDescription>Update the submission status and add review notes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Review Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this submission..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
            />
          </div>

          <Button onClick={handleSaveReview} disabled={isSaving} className="w-full">
            {isSaving ? "Saving..." : "Save Review"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
