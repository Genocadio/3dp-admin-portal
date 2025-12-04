"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, CheckCircle2, AlertCircle, FileText } from "lucide-react"
import type { Answer } from "@/lib/graphql/types"
import { ReviewStatus, AnswerStatus } from "@/lib/graphql/types"
import { downloadPDFReport, type SubmissionReportData } from "@/lib/pdf-generator"
import { getUserData } from "@/lib/auth/token"

type UserSubmissionViewProps = {
    submission: Answer
    onBack: () => void
}

export function UserSubmissionView({ submission, onBack }: UserSubmissionViewProps) {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
    const evaluationForm = submission.evaluationForm
    const review = submission.review
    const userData = getUserData()

    const handleDownloadReport = () => {
        setIsGeneratingPdf(true)
        try {
            // Map submission data to report format
            const categoryScores: SubmissionReportData["categoryScores"] = []

            // Group questions by section (treating sections as categories)
            evaluationForm?.sections?.forEach(section => {
                const sectionAnswers = section.questions?.map(question => {
                    const answer = submission.questionAnswers.find(qa => qa.questionId === question.id)
                    const questionReview = review?.questionReviews?.find(qr => qr.questionId === question.id)

                    // Calculate percentage for this answer
                    let percentage = 0
                    const maxScore = question.maxScore || 0
                    if (maxScore > 0) {
                        const userScore = questionReview?.userScore || 0
                        percentage = Math.round((userScore / maxScore) * 100)
                    }

                    // Format answer text
                    let answerText = "No answer provided"
                    if (answer) {
                        if (answer.textAnswer) answerText = answer.textAnswer
                        else if (answer.selectedOptionId) {
                            const option = question.options?.find(o => o.id === answer.selectedOptionId)
                            answerText = option?.text || "Selected option"
                        }
                        else if (answer.selectedOptionIds && answer.selectedOptionIds.length > 0) {
                            const options = question.options?.filter(o => answer.selectedOptionIds?.includes(o.id))
                            answerText = options?.map(o => o.text).join(", ") || "Selected options"
                        }
                        else if (answer.fileUploadUrl) answerText = "File uploaded"
                    }

                    return {
                        questionText: question.text || "Question",
                        answer: answerText,
                        percentage
                    }
                }) || []

                // Calculate section percentage
                // This is an approximation as we don't have section-level scores directly
                // We'll average the question percentages for now, or 0 if no questions
                const sectionPercentage = sectionAnswers.length > 0
                    ? Math.round(sectionAnswers.reduce((acc, curr) => acc + curr.percentage, 0) / sectionAnswers.length)
                    : 0

                categoryScores.push({
                    title: section.title || "Section",
                    percentage: sectionPercentage,
                    answers: sectionAnswers
                })
            })

            const reportData: SubmissionReportData = {
                applicationTitle: evaluationForm?.title || "Evaluation",
                applicantName: userData?.name || "User",
                applicantOrganisation: userData?.organizationName || undefined,
                submittedDate: submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : "N/A",
                reviewedDate: review?.updatedAt ? new Date(review.updatedAt).toLocaleDateString() : undefined,
                status: (review?.status?.toLowerCase() as any) || "pending",
                percentage: 0, // Overall percentage
                categoryScores,
                reviewNotes: review?.notes || undefined
            }

            // Calculate overall percentage based on total score if available
            // We need max score of the form to calculate true percentage
            // For now, if we have totalScore, we might need to sum up max scores of all questions
            if (review?.totalScore !== undefined && review?.totalScore !== null) {
                const totalMaxScore = evaluationForm?.sections?.reduce((acc, section) => {
                    return acc + (section.questions?.reduce((qAcc, q) => qAcc + (q.maxScore || 0), 0) || 0)
                }, 0) || 0

                if (totalMaxScore > 0) {
                    reportData.percentage = Math.round((review.totalScore / totalMaxScore) * 100)
                }
            }

            downloadPDFReport(reportData)
        } catch (error) {
            console.error("Error generating PDF:", error)
            alert("Failed to generate PDF report")
        } finally {
            setIsGeneratingPdf(false)
        }
    }

    // Check if manual review is done (needed for PDF download)
    // The prompt says "cant download until manual review is done"
    const isReviewComplete = review?.status === ReviewStatus.COMPLETE

    // Helper for display status
    const displayStatus = review?.status || submission.status || AnswerStatus.PENDING
    const isCompleted = displayStatus === ReviewStatus.COMPLETE || displayStatus === AnswerStatus.COMPLETE || displayStatus === AnswerStatus.EVALUATED
    const isAutoMode = review?.status === ReviewStatus.AUTO

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to My Submissions
                </Button>

                {isReviewComplete && (
                    <Button onClick={handleDownloadReport} disabled={isGeneratingPdf} variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        {isGeneratingPdf ? "Generating..." : "Download Report"}
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{evaluationForm?.title || "Evaluation Form"}</CardTitle>
                            <CardDescription>
                                Submitted on {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : "N/A"}
                            </CardDescription>
                        </div>
                        <div className="text-right">
                            <Badge
                                variant={
                                    isCompleted
                                        ? "default"
                                        : "secondary"
                                }
                                className="mb-2"
                            >
                                {displayStatus === AnswerStatus.AUTO ? "AUTO EVALUATED" : displayStatus}
                            </Badge>
                            {isAutoMode ? (
                                <p className="font-medium text-muted-foreground italic mt-2">
                                    Waiting for manual evaluation
                                </p>
                            ) : (
                                review?.totalScore !== undefined && review?.totalScore !== null && (
                                    <p className="font-bold text-lg">Score: {review.totalScore}</p>
                                )
                            )}
                        </div>
                    </div>
                    {evaluationForm?.description && (
                        <p className="text-sm text-muted-foreground mt-2">{evaluationForm.description}</p>
                    )}
                </CardHeader>
                <CardContent className="space-y-8">
                    {review?.notes && (
                        <div className="p-4 bg-muted rounded-lg border">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Reviewer Notes
                            </h4>
                            <p className="text-sm">{review.notes}</p>
                        </div>
                    )}

                    {evaluationForm?.sections?.map((section, sectionIdx) => (
                        <div key={section.id} className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold">{section.title || `Section ${sectionIdx + 1}`}</h3>
                                {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}
                            </div>

                            {section.questions?.map((question, qIdx) => {
                                const questionAnswer = submission.questionAnswers.find((qa) => qa.questionId === question.id)
                                const questionReview = review?.questionReviews?.find((qr) => qr.questionId === question.id)

                                return (
                                    <Card key={question.id} className="p-4">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <Label className="text-base font-medium">
                                                        Q{qIdx + 1}: {question.text}
                                                    </Label>
                                                    {question.description && (
                                                        <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
                                                    )}
                                                </div>
                                                {questionReview && (
                                                    <div className="flex flex-col items-end gap-1 min-w-[100px]">
                                                        {/* Hide scores when review is in AUTO mode (waiting for manual evaluation) */}
                                                        {isAutoMode ? (
                                                            <Badge variant="outline" className="border-orange-500 text-orange-600">
                                                                Waiting for manual evaluation
                                                            </Badge>
                                                        ) : (
                                                            /* Check if this is a manual question (not multiple/single choice) and review is not complete */
                                                            (question.type !== "MCQ_SINGLE" && question.type !== "MCQ_MULTIPLE") &&
                                                            displayStatus !== ReviewStatus.COMPLETE &&
                                                            displayStatus !== AnswerStatus.COMPLETE &&
                                                            displayStatus !== AnswerStatus.EVALUATED ? (
                                                                <Badge variant="outline" className="border-orange-500 text-orange-600">
                                                                    Pending Review
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className={
                                                                    questionReview.manualReviewResult === "CORRECT" || questionReview.manualReviewResult === "VALID"
                                                                        ? "border-green-500 text-green-600"
                                                                        : questionReview.manualReviewResult === "INCORRECT" || questionReview.manualReviewResult === "INVALID"
                                                                            ? "border-red-500 text-red-600"
                                                                            : "border-yellow-500 text-yellow-600"
                                                                }>
                                                                    {questionReview.userScore}/{questionReview.maxScore} pts
                                                                </Badge>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* User's Answer */}
                                            <div className="p-3 bg-muted/50 rounded-lg">
                                                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Your Answer</p>
                                                {questionAnswer ? (
                                                    <div className="text-sm">
                                                        {questionAnswer.textAnswer && <p>{questionAnswer.textAnswer}</p>}

                                                        {questionAnswer.selectedOptionId && (
                                                            <p>
                                                                {question.options?.find((opt) => opt.id === questionAnswer.selectedOptionId)?.text ||
                                                                    "Option selected"}
                                                            </p>
                                                        )}

                                                        {questionAnswer.selectedOptionIds && questionAnswer.selectedOptionIds.length > 0 && (
                                                            <ul className="list-disc list-inside">
                                                                {questionAnswer.selectedOptionIds.map((optId) => (
                                                                    <li key={optId}>
                                                                        {question.options?.find((opt) => opt.id === optId)?.text || "Option selected"}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}

                                                        {questionAnswer.fileUploadUrl && (
                                                            <a
                                                                href={questionAnswer.fileUploadUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline flex items-center gap-1"
                                                            >
                                                                <Download className="w-3 h-3" />
                                                                View Uploaded File
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground italic">No answer provided</p>
                                                )}
                                            </div>

                                            {/* Review Feedback */}
                                            {questionReview && (questionReview.manualNotes || questionReview.manualReviewResult) && (
                                                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                                                    <p className="text-xs font-semibold uppercase text-blue-800 mb-2 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Feedback
                                                    </p>
                                                    {questionReview.manualReviewResult && (
                                                        <p className="text-sm font-medium text-blue-900 mb-1">
                                                            Result: {questionReview.manualReviewResult.replace(/_/g, " ")}
                                                        </p>
                                                    )}
                                                    {questionReview.manualNotes && (
                                                        <p className="text-sm text-blue-800">{questionReview.manualNotes}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div >
    )
}
