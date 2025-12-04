"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import { ANSWER_QUERY, REVIEW_ANSWER_MUTATION } from "@/lib/graphql/evaluations"
import type { Answer, QuestionReviewInput, QuestionReviewMutationInput, ManualReviewResult, ReviewStatus } from "@/lib/graphql/types"
import { ManualReviewResult as ManualReviewResultEnum, ReviewStatus as ReviewStatusEnum } from "@/lib/graphql/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

type AnswerReviewProps = {
  answerId: string
  onBack: () => void
}

export function AnswerReview({ answerId, onBack }: AnswerReviewProps) {
  const { data, loading, error, refetch } = useQuery<{ answer: Answer }>(ANSWER_QUERY, {
    variables: { answerId },
  })

  const [reviewAnswer, { loading: isSubmitting }] = useMutation(REVIEW_ANSWER_MUTATION, {
    refetchQueries: [{ query: ANSWER_QUERY, variables: { answerId } }],
  })

  const [questionReviews, setQuestionReviews] = useState<Record<string, QuestionReviewInput>>({})
  const [notes, setNotes] = useState("")
  const [unansweredQuestionIds, setUnansweredQuestionIds] = useState<string[]>([])

  const answer = data?.answer
  const existingReview = answer?.review

  useEffect(() => {
    if (existingReview) {
      setNotes(existingReview.notes || "")
      setUnansweredQuestionIds(existingReview.unansweredQuestionIds || [])
      
      // Pre-fill existing question reviews
      const reviews: Record<string, QuestionReviewInput> = {}
      existingReview.questionReviews.forEach((qr) => {
        reviews[qr.questionId] = {
          questionAnswerId: qr.questionAnswerId,
          questionId: qr.questionId,
          questionReviewId: qr.id,
          manualReviewResult: qr.manualReviewResult,
          manualNotes: qr.manualNotes,
          userScore: qr.userScore,
        }
      })
      setQuestionReviews(reviews)
    } else if (answer) {
      // Initialize reviews for questions that need manual evaluation
      const reviews: Record<string, QuestionReviewInput> = {}
      const unanswered: string[] = []

      // Check for existing questionReviews in the review (if review exists but wasn't fully loaded)
      const existingQuestionReviews = answer.review?.questionReviews || []

      answer.evaluationForm?.sections?.forEach((section) => {
        section.questions?.forEach((question) => {
          const questionAnswer = answer.questionAnswers.find((qa) => qa.questionId === question.id)
          
          if (!questionAnswer) {
            // Check if question should be marked as unanswered
            const hasDependencies = question.dependencies && question.dependencies.length > 0
            if (!hasDependencies) {
              unanswered.push(question.id)
            }
            return
          }

          // Only create review input for text and file upload questions
          if (question.type === "SINGLE_LINE" || question.type === "PARAGRAPH" || question.type === "FILE_UPLOAD") {
            if (!reviews[question.id]) {
              // Check if there's an existing questionReview for this question
              const existingQuestionReview = existingQuestionReviews.find((qr) => qr.questionId === question.id)
              
              reviews[question.id] = {
                questionAnswerId: questionAnswer.id,
                questionId: question.id,
                questionReviewId: existingQuestionReview?.id || null,
                manualReviewResult: existingQuestionReview?.manualReviewResult || null,
                manualNotes: existingQuestionReview?.manualNotes || null,
                userScore: existingQuestionReview?.userScore || 0,
              }
            }
          }
        })
      })

      setQuestionReviews(reviews)
      setUnansweredQuestionIds(unanswered)
    }
  }, [answer, existingReview])

  const handleReviewChange = (
    questionId: string,
    result: ManualReviewResult | null,
    score: number
  ) => {
    setQuestionReviews((prev) => {
      const updated = { ...prev }
      if (!updated[questionId]) {
        const questionAnswer = answer?.questionAnswers.find((qa) => qa.questionId === questionId)
        // Check for existing questionReview
        const existingQuestionReview = answer?.review?.questionReviews?.find((qr) => qr.questionId === questionId)
        
        if (questionAnswer) {
          updated[questionId] = {
            questionAnswerId: questionAnswer.id,
            questionId: questionId,
            questionReviewId: existingQuestionReview?.id || null,
            manualReviewResult: result,
            manualNotes: existingQuestionReview?.manualNotes || null,
            userScore: score,
          }
        }
      } else {
        updated[questionId] = {
          ...updated[questionId],
          manualReviewResult: result,
          userScore: score,
        }
      }
      return updated
    })
  }

  const handleNotesChange = (questionId: string, notes: string) => {
    setQuestionReviews((prev) => {
      const updated = { ...prev }
      if (updated[questionId]) {
        updated[questionId] = {
          ...updated[questionId],
          manualNotes: notes,
        }
      }
      return updated
    })
  }

  const handleSubmit = async () => {
    try {
      // Map to the expected mutation input format
      // Only include questionReviews that have a result (have been reviewed)
      const questionReviewsArray: QuestionReviewMutationInput[] = Object.values(questionReviews)
        .filter((qr) => qr.manualReviewResult !== null && qr.manualReviewResult !== undefined)
        .map((qr) => ({
          notes: qr.manualNotes || null,
          questionReviewId: qr.questionReviewId || null,
          result: qr.manualReviewResult || null,
        }))

      await reviewAnswer({
        variables: {
          answerId: answerId,
          input: {
            notes: notes || null,
            questionReviews: questionReviewsArray,
          },
        },
      })

      onBack()
    } catch (error: any) {
      console.error("Error reviewing answer:", error)
      alert(error?.message || "Failed to submit review")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !answer) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive mb-4">
            {error?.message || "Answer not found"}
          </p>
          <Button onClick={onBack}>Go Back</Button>
        </CardContent>
      </Card>
    )
  }

  const evaluationForm = answer.evaluationForm

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Answers
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{evaluationForm?.title || "Evaluation Form"}</CardTitle>
          <CardDescription>
            Review answer submitted on {answer.createdAt ? new Date(answer.createdAt).toLocaleDateString() : "N/A"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {existingReview && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <p className="font-medium text-blue-900">Existing Review</p>
              </div>
              <p className="text-sm text-blue-800">
                Status: {existingReview.status} • Last updated: {existingReview.updatedAt ? new Date(existingReview.updatedAt).toLocaleDateString() : "N/A"}
              </p>
              {existingReview.totalScore !== null && existingReview.totalScore !== undefined && (
                <p className="text-sm text-blue-800">Total Score: {existingReview.totalScore}</p>
              )}
            </div>
          )}

          {evaluationForm?.sections?.map((section, sectionIdx) => (
            <div key={section.id} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{section.title || `Section ${sectionIdx + 1}`}</h3>
                {section.description && (
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                )}
              </div>

              {section.questions?.map((question, qIdx) => {
                const questionAnswer = answer.questionAnswers.find((qa) => qa.questionId === question.id)
                const existingQuestionReview = existingReview?.questionReviews.find(
                  (qr) => qr.questionId === question.id
                )
                const currentReview = questionReviews[question.id] || existingQuestionReview

                // Get max score from question
                const maxScore = question.maxScore || 0

                return (
                  <Card key={question.id} className="p-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">
                          Q{qIdx + 1}: {question.text}
                        </Label>
                        {question.description && (
                          <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
                        )}
                      </div>

                      {/* Show user's answer */}
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">User's Answer:</p>
                        {questionAnswer ? (
                          <div>
                            {questionAnswer.textAnswer && (
                              <p className="text-sm">{questionAnswer.textAnswer}</p>
                            )}
                            {questionAnswer.selectedOptionId && (
                              <p className="text-sm">
                                Selected: {question.options?.find((opt) => opt.id === questionAnswer.selectedOptionId)?.text || questionAnswer.selectedOptionId}
                              </p>
                            )}
                            {questionAnswer.selectedOptionIds && questionAnswer.selectedOptionIds.length > 0 && (
                              <div className="text-sm">
                                <p>Selected:</p>
                                <ul className="list-disc list-inside ml-2">
                                  {questionAnswer.selectedOptionIds.map((optId) => (
                                    <li key={optId}>
                                      {question.options?.find((opt) => opt.id === optId)?.text || optId}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {questionAnswer.fileUploadUrl && (
                              <a
                                href={questionAnswer.fileUploadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View uploaded file
                              </a>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No answer provided</p>
                        )}
                      </div>

                      {/* Show existing review result if any */}
                      {existingQuestionReview && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <p className="text-sm font-medium text-green-900">Previous Review</p>
                          </div>
                          <p className="text-sm text-green-800">
                            Result: {existingQuestionReview.manualReviewResult || "Auto-evaluated"} • Score: {existingQuestionReview.userScore}/{existingQuestionReview.maxScore}
                          </p>
                          {existingQuestionReview.manualNotes && (
                            <p className="text-sm text-green-800 mt-1">Notes: {existingQuestionReview.manualNotes}</p>
                          )}
                        </div>
                      )}

                      {/* Review interface for text questions */}
                      {(question.type === "SINGLE_LINE" || question.type === "PARAGRAPH") && questionAnswer && (
                        <div className="space-y-3">
                          <Label>Evaluation</Label>
                          <RadioGroup
                            value={
                              currentReview?.manualReviewResult || ""
                            }
                            onValueChange={(value) => {
                              let score = 0
                              if (value === ManualReviewResultEnum.CORRECT) {
                                score = maxScore
                              } else if (value === ManualReviewResultEnum.PARTIALLY_CORRECT) {
                                score = maxScore * 0.5
                              } else if (value === ManualReviewResultEnum.INCORRECT) {
                                score = 0
                              }
                              handleReviewChange(question.id, value as ManualReviewResult, score)
                            }}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={ManualReviewResultEnum.CORRECT} id={`correct-${question.id}`} />
                              <Label htmlFor={`correct-${question.id}`} className="font-normal cursor-pointer">
                                Correct ({maxScore} points)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value={ManualReviewResultEnum.PARTIALLY_CORRECT}
                                id={`partial-${question.id}`}
                              />
                              <Label htmlFor={`partial-${question.id}`} className="font-normal cursor-pointer">
                                Partially Correct ({maxScore * 0.5} points)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value={ManualReviewResultEnum.INCORRECT}
                                id={`incorrect-${question.id}`}
                              />
                              <Label htmlFor={`incorrect-${question.id}`} className="font-normal cursor-pointer">
                                Incorrect (0 points)
                              </Label>
                            </div>
                          </RadioGroup>
                          <div>
                            <Label htmlFor={`notes-${question.id}`}>Notes (Optional)</Label>
                            <Textarea
                              id={`notes-${question.id}`}
                              value={currentReview?.manualNotes || ""}
                              onChange={(e) => handleNotesChange(question.id, e.target.value)}
                              placeholder="Add evaluation notes..."
                              rows={2}
                            />
                          </div>
                        </div>
                      )}

                      {/* Review interface for file upload questions */}
                      {question.type === "FILE_UPLOAD" && questionAnswer && (
                        <div className="space-y-3">
                          <Label>Evaluation</Label>
                          <RadioGroup
                            value={currentReview?.manualReviewResult || ""}
                            onValueChange={(value) => {
                              const score = value === ManualReviewResultEnum.VALID ? maxScore : 0
                              handleReviewChange(question.id, value as ManualReviewResult, score)
                            }}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={ManualReviewResultEnum.VALID} id={`valid-${question.id}`} />
                              <Label htmlFor={`valid-${question.id}`} className="font-normal cursor-pointer">
                                Valid ({maxScore} points)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={ManualReviewResultEnum.INVALID} id={`invalid-${question.id}`} />
                              <Label htmlFor={`invalid-${question.id}`} className="font-normal cursor-pointer">
                                Invalid (0 points)
                              </Label>
                            </div>
                          </RadioGroup>
                          <div>
                            <Label htmlFor={`notes-${question.id}`}>Notes (Optional)</Label>
                            <Textarea
                              id={`notes-${question.id}`}
                              value={currentReview?.manualNotes || ""}
                              onChange={(e) => handleNotesChange(question.id, e.target.value)}
                              placeholder="Add evaluation notes..."
                              rows={2}
                            />
                          </div>
                        </div>
                      )}

                      {/* Show auto-evaluated score for multiple choice questions */}
                      {(question.type === "MCQ_SINGLE" || question.type === "MCQ_MULTIPLE") && existingQuestionReview && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-medium text-blue-900">
                            Auto-evaluated: {existingQuestionReview.userScore}/{existingQuestionReview.maxScore} points
                          </p>
                          {existingQuestionReview.reviewType === "AUTO" && (
                            <Badge variant="outline" className="mt-2 text-blue-600 border-blue-600">
                              Auto
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          ))}

          {/* Unanswered questions */}
          {unansweredQuestionIds.length > 0 && (
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  Unanswered Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {unansweredQuestionIds.map((questionId) => {
                    const question = evaluationForm?.sections
                      ?.flatMap((s) => s.questions || [])
                      .find((q) => q.id === questionId)
                    return (
                      <li key={questionId} className="text-sm text-muted-foreground">
                        {question?.text || questionId}
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Overall notes */}
          <div>
            <Label htmlFor="overall-notes">Overall Review Notes (Optional)</Label>
            <Textarea
              id="overall-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add overall evaluation notes..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




