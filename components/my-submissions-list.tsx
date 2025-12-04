"use client"

import { useQuery } from "@apollo/client/react"
import { MY_ANSWERS_QUERY } from "@/lib/graphql/evaluations"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowRight, FileText, Calendar, XCircle } from "lucide-react"
import type { Answer } from "@/lib/graphql/types"
import { ReviewStatus, AnswerStatus } from "@/lib/graphql/types"

type MySubmissionsListProps = {
    onViewSubmission: (submission: Answer) => void
}

export function MySubmissionsList({ onViewSubmission }: MySubmissionsListProps) {
    const { data, loading, error } = useQuery<{ myAnswers: Answer[] }>(MY_ANSWERS_QUERY, {
        fetchPolicy: "network-only",
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <XCircle className="w-12 h-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold">Error loading submissions</h3>
                <p className="text-muted-foreground max-w-md mt-2">{error.message}</p>
            </div>
        )
    }

    const submissions = data?.myAnswers || []

    if (submissions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg bg-muted/30">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No submissions yet</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                    You haven't submitted any evaluations yet. Go to the "Available Evaluations" tab to get started.
                </p>
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {submissions.map((submission) => {
                const review = submission.review
                const status = review?.status || submission.status || AnswerStatus.PENDING

                // Helper to check status safely
                const isCompleted = status === ReviewStatus.COMPLETE || status === AnswerStatus.COMPLETE || status === AnswerStatus.EVALUATED
                const isAutoMode = review?.status === ReviewStatus.AUTO

                return (
                    <Card key={submission.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start gap-2">
                                <Badge
                                    variant={
                                        isCompleted
                                            ? "default"
                                            : "secondary"
                                    }
                                    className={
                                        isCompleted
                                            ? "bg-green-600 hover:bg-green-700"
                                            : ""
                                    }
                                >
                                    {status === AnswerStatus.AUTO ? "AUTO EVALUATED" : status}
                                </Badge>
                                {isAutoMode ? (
                                    <span className="text-sm font-medium text-muted-foreground italic">
                                        Waiting for manual evaluation
                                    </span>
                                ) : (
                                    review?.totalScore !== undefined && review?.totalScore !== null && (
                                        <span className="text-sm font-bold text-primary">
                                            Score: {review.totalScore}
                                        </span>
                                    )
                                )}
                            </div>
                            <CardTitle className="mt-2 line-clamp-2" title={submission.evaluationForm?.title || ""}>
                                {submission.evaluationForm?.title || "Untitled Evaluation"}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                                {submission.evaluationForm?.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-end pt-0">
                            <div className="flex items-center text-sm text-muted-foreground mt-4 mb-4">
                                <Calendar className="w-4 h-4 mr-2" />
                                Submitted: {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : "N/A"}
                            </div>

                            <Button onClick={() => onViewSubmission(submission)} className="w-full mt-auto group">
                                View Details
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
