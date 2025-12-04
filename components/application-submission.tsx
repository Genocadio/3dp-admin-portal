"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import type { Application, Category, Question, QuestionOption } from "@/lib/types"
import { QuickEvaluationReport } from "./quick-evaluation-report"

type ApplicationSubmissionProps = {
  application: Application
  userId: string
  onBack: () => void
}

export function ApplicationSubmission({ application, userId, onBack }: ApplicationSubmissionProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, { value: string; text: string; files: File[] }>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [userName, setUserName] = useState<string>("Applicant")
  const [userOrganisation, setUserOrganisation] = useState<string | undefined>(undefined)
  const [evaluationData, setEvaluationData] = useState<{
    totalScore: number
    maxScore: number
    answers: any[]
  } | null>(null)

  useEffect(() => {
    loadQuestionsWithCategories()
    loadUserName()
  }, [application.id])

  const loadUserName = async () => {
    // Using dummy data instead of Supabase
    setUserName("User Name")
    setUserOrganisation("User Organisation")
  }

  const loadQuestionsWithCategories = async () => {
    // Using dummy data instead of Supabase
    const dummyCategories: Category[] = [
      {
        id: "1",
        application_id: application.id,
        title: "Basic Information",
        description: "Please provide your basic information",
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
    setCategories(dummyCategories)

    const dummyQuestions: Question[] = [
      {
        id: "1",
        category_id: "1",
        question_text: "What is your name?",
        help_text: "Please enter your full name",
        question_type: "text",
        options: null,
        points: 10,
        media_upload_config: { required: false, allowedTypes: [], maxSize: 0 },
        depends_on_question_id: null,
        depends_on_answer: null,
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
    setQuestions(dummyQuestions)
  }

  const visibleQuestions = questions.filter((q) => {
    if (!q.depends_on_question_id) return true
    const dependentAnswer = answers[q.depends_on_question_id]
    return dependentAnswer && dependentAnswer.value === q.depends_on_answer
  })

  const currentQuestion = visibleQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / visibleQuestions.length) * 100

  const handleAnswerChange = (value: string, text: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: {
        value,
        text,
        files: answers[currentQuestion.id]?.files || [],
      },
    })
  }

  const handleFileChange = (files: FileList | null) => {
    if (!files) return
    setAnswers({
      ...answers,
      [currentQuestion.id]: {
        ...answers[currentQuestion.id],
        value: answers[currentQuestion.id]?.value || "",
        text: answers[currentQuestion.id]?.text || "",
        files: Array.from(files),
      },
    })
  }

  const canProceed = () => {
    const answer = answers[currentQuestion.id]
    if (!answer) return false

    // Check if answer is required
    if (currentQuestion.question_type === "multiple_choice" && !answer.value) return false
    if (currentQuestion.question_type === "text" && !answer.text) return false

    // Check media upload requirements
    const config = currentQuestion.media_upload_config
    if (config.required && (!answer.files || answer.files.length === 0)) return false

    // Check if upload is required for selected option
    if (currentQuestion.question_type === "multiple_choice" && currentQuestion.options) {
      const selectedOption = (currentQuestion.options as QuestionOption[]).find((opt) => opt.value === answer.value)
      if (selectedOption?.showUpload && config.required && (!answer.files || answer.files.length === 0)) {
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const isAutoScorable = (question: Question): boolean => {
    // media_only questions are not auto-scoreable
    if (question.question_type === "media_only") return false
    
    // multiple choice questions with points are auto-scoreable
    if (question.question_type === "multiple_choice" && question.points > 0) return true
    
    return false
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Separate auto-scoreable and non-scoreable questions
      const autoScorableQuestions = visibleQuestions.filter(isAutoScorable)
      
      // Calculate auto-scored total (only auto-scoreable questions)
      let totalScore = 0
      let maxScore = 0
      const evaluationAnswers: any[] = []

      autoScorableQuestions.forEach((q) => {
        maxScore += q.points
        const answer = answers[q.id]
        let pointsEarned = 0
        
        if (answer && q.options) {
          const selectedOption = (q.options as QuestionOption[]).find((opt) => opt.value === answer.value)
          if (selectedOption) {
            pointsEarned = selectedOption.points
            totalScore += selectedOption.points
          }
        }
        
        const categoryTitle = categories.find((c) => c.id === q.category_id)?.title || ""
        evaluationAnswers.push({
          id: q.id,
          question_id: q.id,
          question_text: q.question_text,
          answer_text: answer?.text || null,
          answer_value: answer?.value || null,
          points_earned: pointsEarned,
          max_points: q.points,
          category_title: categoryTitle,
        })
      })

      // Using dummy data instead of Supabase
      // In a real implementation, this would call a GraphQL mutation
      const dummySubmission = {
        id: `submission-${Date.now()}`,
        application_id: application.id,
        user_id: userId,
        status: "pending",
        total_score: totalScore,
        max_score: maxScore,
      }

      // Simulate saving answers (dummy data)
      // In a real implementation, this would call GraphQL mutations

      // Set evaluation data to display the report
      setEvaluationData({
        totalScore,
        maxScore,
        answers: evaluationAnswers,
      })
      setIsComplete(true)
    } catch (error) {
      console.error("Submission error:", error)
      alert("Failed to submit. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isComplete && evaluationData) {
    return (
      <QuickEvaluationReport
        categories={categories}
        answers={evaluationData.answers}
        totalScore={evaluationData.totalScore}
        maxScore={evaluationData.maxScore}
        onContinue={onBack}
        applicationTitle={application.title}
        applicantName={userName}
        applicantOrganisation={userOrganisation}
      />
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading questions...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentAnswer = answers[currentQuestion.id]
  const showUpload =
    currentQuestion.question_type === "media_only" ||
    (currentQuestion.question_type === "multiple_choice" &&
      currentAnswer?.value &&
      (currentQuestion.options as QuestionOption[])?.find((opt) => opt.value === currentAnswer.value)?.showUpload)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Image src="/loggo.webp" alt="3DP Logo" width={50} height={50} className="h-10 w-auto" />
            <div>
              <h1 className="text-2xl font-bold">{application.title}</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {visibleQuestions.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground">Q{currentQuestionIndex + 1}</span>
            </div>
            <CardTitle className="text-xl">{currentQuestion.question_text}</CardTitle>
            {currentQuestion.help_text && <CardDescription>{currentQuestion.help_text}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestion.question_type === "multiple_choice" && currentQuestion.options && (
              <RadioGroup
                value={currentAnswer?.value || ""}
                onValueChange={(value) => {
                  const option = (currentQuestion.options as QuestionOption[]).find((opt) => opt.value === value)
                  handleAnswerChange(value, option?.text || "")
                }}
              >
                {(currentQuestion.options as QuestionOption[]).map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value={option.value} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.question_type === "text" && (
              <div>
                <Label htmlFor="text-answer">Your Answer</Label>
                <Textarea
                  id="text-answer"
                  placeholder="Type your answer here..."
                  value={currentAnswer?.text || ""}
                  onChange={(e) => handleAnswerChange("", e.target.value)}
                  rows={5}
                />
              </div>
            )}

            {showUpload && (
              <div>
                <Label htmlFor="file-upload">
                  Upload Documents{" "}
                  {currentQuestion.media_upload_config.required && <span className="text-destructive">*</span>}
                </Label>
                <div className="mt-2">
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    accept={currentQuestion.media_upload_config.allowedTypes.join(",")}
                    onChange={(e) => handleFileChange(e.target.files)}
                  />
                  {currentAnswer?.files && currentAnswer.files.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {currentAnswer.files.map((file, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentQuestionIndex === visibleQuestions.length - 1 ? (
                <Button onClick={handleSubmit} disabled={!canProceed() || isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
