"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Download } from "lucide-react"
import type { Category } from "@/lib/types"
import Image from "next/image"
import { downloadPDFReport, type SubmissionReportData } from "@/lib/pdf-generator"

type EvaluationAnswer = {
  id: string
  question_id: string
  question_text: string
  answer_text: string | null
  answer_value: string | null
  points_earned: number
  max_points: number
  category_title: string
}

type QuickEvaluationReportProps = {
  categories: Category[]
  answers: EvaluationAnswer[]
  totalScore: number
  maxScore: number
  onContinue: () => void
  applicationTitle?: string
  applicantName?: string
  applicantOrganisation?: string
}

export function QuickEvaluationReport({
  categories,
  answers,
  totalScore,
  maxScore,
  onContinue,
  applicationTitle = "Application",
  applicantName = "Applicant",
  applicantOrganisation,
}: QuickEvaluationReportProps) {
  // Group answers by category
  const answersByCategory = categories.map((cat) => ({
    category: cat,
    answers: answers.filter((ans) => ans.category_title === cat.title),
  }))

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

  const handleDownloadReport = () => {
    const categoryScores = answersByCategory.map(({ category, answers: categoryAnswers }) => {
      const categoryMax = categoryAnswers.reduce((sum, ans) => sum + ans.max_points, 0)
      const categoryScore = categoryAnswers.reduce((sum, ans) => sum + ans.points_earned, 0)
      const categoryPercentage = categoryMax > 0 ? Math.round((categoryScore / categoryMax) * 100) : 0

      return {
        title: category.title,
        percentage: categoryPercentage,
        answers: categoryAnswers.map((answer) => ({
          questionText: answer.question_text,
          answer: answer.answer_text || answer.answer_value || "No answer provided",
          percentage: answer.max_points > 0 ? Math.round((answer.points_earned / answer.max_points) * 100) : 0,
        })),
      }
    })

    const reportData: SubmissionReportData = {
      applicationTitle,
      applicantName,
      applicantOrganisation,
      submittedDate: new Date().toLocaleDateString(),
      status: "pending",
      percentage,
      categoryScores,
    }

    downloadPDFReport(reportData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header with Logo */}
        <div className="flex items-center gap-4 mb-4">
          <Image src="/loggo.webp" alt="3DP Logo" width={80} height={80} className="h-16 w-auto" />
          <div>
            <h1 className="text-3xl font-bold text-primary">Submission Report</h1>
            <p className="text-muted-foreground">{applicationTitle}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Quick Evaluation Summary</CardTitle>
              <CardDescription>Auto-scored answers only (uploads under manual review)</CardDescription>
            </div>
            <Button onClick={handleDownloadReport} variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                <p className="text-3xl font-bold">{percentage}%</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <p className="text-sm text-muted-foreground mb-1">Performance Level</p>
                <p className="text-lg font-semibold">
                  {percentage >= 80 ? "Excellent" : percentage >= 60 ? "Good" : percentage >= 40 ? "Fair" : "Needs Work"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {answersByCategory.map(({ category, answers: categoryAnswers }) => {
            if (categoryAnswers.length === 0) return null

            const categoryScore = categoryAnswers.reduce((sum, ans) => sum + ans.points_earned, 0)
            const categoryMax = categoryAnswers.reduce((sum, ans) => sum + ans.max_points, 0)
            const categoryPercentage = categoryMax > 0 ? Math.round((categoryScore / categoryMax) * 100) : 0

            return (
              <Card key={category.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                      {category.description && <CardDescription>{category.description}</CardDescription>}
                    </div>
                    <Badge variant="outline">
                      {categoryPercentage}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categoryAnswers.map((answer, idx) => (
                    <div key={answer.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-muted-foreground">Q{idx + 1}</span>
                            <Badge variant="secondary" className="text-xs">
                              {answer.max_points > 0 ? Math.round((answer.points_earned / answer.max_points) * 100) : 0}%
                            </Badge>
                          </div>
                          <p className="font-medium text-sm">{answer.question_text}</p>
                        </div>
                      </div>
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <p className="text-muted-foreground">{answer.answer_text || answer.answer_value || "No answer"}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-amber-900 mb-1">Uploads Under Manual Review</p>
                <p className="text-sm text-amber-800">
                  Any documents you uploaded will be reviewed by our team and your final decision will be updated in your
                  dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={onContinue} className="w-full" size="lg">
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
