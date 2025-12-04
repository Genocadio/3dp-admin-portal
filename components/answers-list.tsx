"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import { ALL_ANSWERS_QUERY, DELETE_ANSWER_MUTATION } from "@/lib/graphql/evaluations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, CheckCircle2, Clock, Trash2 } from "lucide-react"
import type { Answer, ReviewStatus } from "@/lib/graphql/types"
import { ReviewStatus as ReviewStatusEnum } from "@/lib/graphql/types"
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

type AnswersListProps = {
  onReview: (answerId: string) => void
}

export function AnswersList({ onReview }: AnswersListProps) {
  const { data, loading, error, refetch } = useQuery<{ allAnswers: Answer[] }>(ALL_ANSWERS_QUERY)
  const [deleteAnswer, { loading: deleting }] = useMutation(DELETE_ANSWER_MUTATION, {
    refetchQueries: [{ query: ALL_ANSWERS_QUERY }],
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [answerToDelete, setAnswerToDelete] = useState<Answer | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive mb-4">Error loading answers: {error.message}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  const answers = data?.allAnswers || []

  const getReviewStatusBadge = (review: Answer["review"]) => {
    if (!review) {
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <Clock className="w-3 h-3 mr-1" />
          No Review
        </Badge>
      )
    }

    if (review.status === ReviewStatusEnum.COMPLETE) {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Complete
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="text-blue-600 border-blue-600">
        <Clock className="w-3 h-3 mr-1" />
        Auto
      </Badge>
    )
  }

  const canReview = (review: Answer["review"]) => {
    return !review || review.status !== ReviewStatusEnum.COMPLETE
  }

  const handleDeleteClick = (answer: Answer) => {
    setAnswerToDelete(answer)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!answerToDelete) return
    
    try {
      await deleteAnswer({
        variables: { deleteAnswerId: answerToDelete.id },
      })
      setDeleteDialogOpen(false)
      setAnswerToDelete(null)
    } catch (error) {
      console.error("Error deleting answer:", error)
      alert("Failed to delete answer")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Answer Evaluations</h2>
        <p className="text-muted-foreground">Review and evaluate submitted answers</p>
      </div>

      {answers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No answers submitted yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {answers.map((answer) => (
            <Card key={answer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{answer.evaluationForm?.title || "Untitled Evaluation"}</CardTitle>
                    <CardDescription>
                      Submitted on {answer.createdAt ? new Date(answer.createdAt).toLocaleDateString() : "N/A"}
                    </CardDescription>
                  </div>
                  {getReviewStatusBadge(answer.review)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Answer ID: {answer.id}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status: {answer.status}
                    </p>
                    {answer.review && (
                      <p className="text-sm text-muted-foreground">
                        Review Status: {answer.review.status}
                        {answer.review.totalScore !== null && answer.review.totalScore !== undefined && (
                          <span className="ml-2">• Score: {answer.review.totalScore}</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {canReview(answer.review) && (
                      <Button onClick={() => onReview(answer.id)}>
                        {answer.review ? "Continue Review" : "Review Answer"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(answer)}
                      disabled={deleting}
                      title="Delete Answer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Answer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this answer submission? 
              This action cannot be undone and will also delete the associated review.
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
    </div>
  )
}






