"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import { ANSWER_BY_EVALUATION_FORM_QUERY, CREATE_ANSWER_MUTATION } from "@/lib/graphql/evaluations"
import { getToken, decodeToken, getUserData } from "@/lib/auth/token"
import type { EvaluationForm, QuestionAnswerInput, AnswerStatus } from "@/lib/graphql/types"
import { AnswerStatus as AnswerStatusEnum } from "@/lib/graphql/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { CloudinaryUploadButton } from "./cloudinary-upload-button"

type EvaluationFormAnswerProps = {
  evaluationForm: EvaluationForm
  onBack: () => void
}

export function EvaluationFormAnswer({ evaluationForm, onBack }: EvaluationFormAnswerProps) {
  const [answers, setAnswers] = useState<Record<string, QuestionAnswerInput>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [visibleQuestions, setVisibleQuestions] = useState<string[]>([])
  const [userAnswer, setUserAnswer] = useState<any>(null)

  const userId = getUserData()?.id || decodeToken(getToken() || "")?.id || decodeToken(getToken() || "")?.userId || ""

  const { data: answerData, loading: loadingAnswer } = useQuery<{ answerByEvaluationForm?: any }>(
    ANSWER_BY_EVALUATION_FORM_QUERY,
    {
      variables: { evaluationFormId: evaluationForm.id },
      skip: !evaluationForm.id,
    }
  )

  useEffect(() => {
    if (answerData?.answerByEvaluationForm) {
      setUserAnswer(answerData.answerByEvaluationForm)
      // Pre-fill answers from existing answer
      const existingAnswers: Record<string, QuestionAnswerInput> = {}
      answerData.answerByEvaluationForm.questionAnswers.forEach((qa: any) => {
        existingAnswers[qa.questionId] = {
          questionId: qa.questionId,
          textAnswer: qa.textAnswer,
          selectedOptionId: qa.selectedOptionId,
          selectedOptionIds: qa.selectedOptionIds,
          fileUploadUrl: qa.fileUploadUrl,
        }
      })
      setAnswers(existingAnswers)
    }
  }, [answerData])

  const [createAnswer] = useMutation(CREATE_ANSWER_MUTATION, {
    refetchQueries: [{ query: ANSWER_BY_EVALUATION_FORM_QUERY, variables: { evaluationFormId: evaluationForm.id } }],
  })

  useEffect(() => {
    initializeVisibleQuestions()
  }, [evaluationForm])

  const initializeVisibleQuestions = () => {
    // Start with questions that have no dependencies
    const allQuestions = evaluationForm.sections?.flatMap((section) => section.questions || []) || []
    const questionsWithoutDeps = allQuestions.filter((q) => !q.dependencies || q.dependencies.length === 0)
    setVisibleQuestions(questionsWithoutDeps.map((q) => q.id))
  }

  const checkDependencies = (questionId: string): boolean => {
    const question = evaluationForm.sections
      ?.flatMap((s) => s.questions || [])
      .find((q) => q.id === questionId)
    if (!question || !question.dependencies || question.dependencies.length === 0) return true

    return question.dependencies.every((dep) => {
      const answer = answers[dep.dependsOnQuestionId || ""]
      if (!answer) return false

      if (dep.type === "ANSWERED") {
        return !!(answer.textAnswer || answer.selectedOptionId || answer.selectedOptionIds?.length)
      } else if (dep.type === "OPTION_SELECTED") {
        const selectedValue = answer.selectedOptionId || answer.selectedOptionIds?.[0] || ""
        const depValue = dep.value
        if (Array.isArray(depValue)) {
          return (depValue as string[]).includes(selectedValue)
        } else if (typeof depValue === "string") {
          return depValue === selectedValue
        }
        return false
      } else if (dep.type === "FILE_UPLOADED") {
        return !!answer.fileUploadUrl
      }
      return false
    })
  }

  const updateVisibleQuestions = () => {
    const allQuestions = evaluationForm.sections?.flatMap((s) => s.questions || []) || []
    const visible: string[] = []

    allQuestions.forEach((q) => {
      if (checkDependencies(q.id)) {
        visible.push(q.id)
      }
    })

    setVisibleQuestions(visible)
  }

  useEffect(() => {
    updateVisibleQuestions()
  }, [answers])

  const handleAnswerChange = (questionId: string, value: any, type: "text" | "single" | "multiple" | "file") => {
    setAnswers((prev) => {
      const updated = { ...prev }
      if (!updated[questionId]) {
        updated[questionId] = { questionId }
      }

      if (type === "text") {
        updated[questionId].textAnswer = value
        updated[questionId].selectedOptionId = null
        updated[questionId].selectedOptionIds = null
      } else if (type === "single") {
        updated[questionId].selectedOptionId = value
        updated[questionId].selectedOptionIds = null
        updated[questionId].textAnswer = null
      } else if (type === "multiple") {
        updated[questionId].selectedOptionIds = value
        updated[questionId].selectedOptionId = null
        updated[questionId].textAnswer = null
      } else if (type === "file") {
        updated[questionId].fileUploadUrl = value
      }

      return updated
    })
  }

  const detectUnansweredQuestions = (): string[] => {
    const allQuestions = evaluationForm.sections?.flatMap((section) => section.questions || []) || []
    const unanswered: string[] = []

    allQuestions.forEach((question) => {
      // Check if question has dependencies
      if (question.dependencies && question.dependencies.length > 0) {
        // Check if all dependencies are fulfilled
        const allDependenciesFulfilled = question.dependencies.every((dep) => {
          const dependentAnswer = answers[dep.dependsOnQuestionId || ""]
          if (!dependentAnswer) return false

          if (dep.type === "OPTION_SELECTED") {
            // Check if user's selected option is in dependency's value array
            const selectedValue = dependentAnswer.selectedOptionId || dependentAnswer.selectedOptionIds?.[0] || ""
            const depValue = dep.value
            if (Array.isArray(depValue)) {
              return (depValue as string[]).includes(selectedValue)
            } else if (typeof depValue === "string") {
              return depValue === selectedValue
            }
            return false
          } else if (dep.type === "ANSWERED") {
            // Check if dependent question has any answer
            return !!(
              dependentAnswer.textAnswer ||
              dependentAnswer.selectedOptionId ||
              dependentAnswer.selectedOptionIds?.length ||
              dependentAnswer.fileUploadUrl
            )
          } else if (dep.type === "FILE_UPLOADED") {
            // Check if dependent question has file upload
            return !!dependentAnswer.fileUploadUrl
          }
          return false
        })

        // If dependencies are fulfilled, check if question is answered
        if (allDependenciesFulfilled) {
          const questionAnswer = answers[question.id]
          if (
            !questionAnswer ||
            (!questionAnswer.textAnswer &&
              !questionAnswer.selectedOptionId &&
              !questionAnswer.selectedOptionIds?.length &&
              !questionAnswer.fileUploadUrl)
          ) {
            unanswered.push(question.id)
          }
        }
        // If dependencies are NOT fulfilled, skip (don't mark as unanswered)
      } else {
        // No dependencies - check if question is answered
        const questionAnswer = answers[question.id]
        if (
          !questionAnswer ||
          (!questionAnswer.textAnswer &&
            !questionAnswer.selectedOptionId &&
            !questionAnswer.selectedOptionIds?.length &&
            !questionAnswer.fileUploadUrl)
        ) {
          unanswered.push(question.id)
        }
      }
    })

    return unanswered
  }

  const calculateAutoScores = (questionAnswers: QuestionAnswerInput[]): QuestionAnswerInput[] => {
    return questionAnswers.map((qa) => {
      const question = evaluationForm.sections
        ?.flatMap((s) => s.questions || [])
        .find((q) => q.id === qa.questionId)

      if (!question) return qa

      // Only auto-evaluate multiple choice questions
      if (question.type === "MCQ_SINGLE" && question.options && qa.selectedOptionId) {
        const selectedOption = question.options.find((opt) => opt.id === qa.selectedOptionId)
        const maxScore = question.maxScore || 0
        // Note: Backend will calculate the actual score based on isCorrect flag
        // We just send the answer, backend handles scoring
        return qa
      } else if (question.type === "MCQ_MULTIPLE" && question.options && qa.selectedOptionIds) {
        const totalCorrectOptions = question.options.filter((opt) => opt.isCorrect).length
        const selectedCorrectOptions = qa.selectedOptionIds.filter((selectedId) => {
          const option = question.options.find((opt) => opt.id === selectedId)
          return option?.isCorrect
        }).length
        const maxScore = question.maxScore || 0
        // Note: Backend will calculate the actual score based on isCorrect flags
        // We just send the answer, backend handles scoring
        return qa
      }

      // Text and file upload questions - no auto-evaluation
      return qa
    })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      let questionAnswers = Object.values(answers).filter((a) => {
        return a.textAnswer || a.selectedOptionId || a.selectedOptionIds?.length || a.fileUploadUrl
      })

      // Calculate auto-scores (backend will actually do the scoring, but we prepare the data)
      questionAnswers = calculateAutoScores(questionAnswers)

      // Detect unanswered questions
      const unansweredQuestionIds = detectUnansweredQuestions()

      const result = await createAnswer({
        variables: {
          input: {
            evaluationFormId: evaluationForm.id,
            questionAnswers: questionAnswers.map((qa) => ({
              questionId: qa.questionId,
              textAnswer: qa.textAnswer ?? null,
              selectedOptionId: qa.selectedOptionId ?? null,
              selectedOptionIds: qa.selectedOptionIds ?? null,
              fileUploadUrl: qa.fileUploadUrl ?? null,
            })),

          },
        },
      })

      // Show success message with evaluation status
      if (result.data && 'createAnswer' in result.data && result.data.createAnswer) {
        const createdAnswer = result.data.createAnswer as any
        const status = createdAnswer.status
        
        if (status === AnswerStatusEnum.AUTO) {
          alert("Evaluation submitted successfully! Your answers have been auto-evaluated. An admin will review your submission.")
        } else {
          alert("Evaluation submitted successfully! Your submission is pending review.")
        }
      }

      // Go back to list
      onBack()
    } catch (error: any) {
      console.error("Error submitting answer:", error)
      alert(error?.message || "Failed to submit evaluation")
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentSection = evaluationForm.sections?.[currentSectionIndex]
  const sectionQuestions = currentSection?.questions?.filter((q) => visibleQuestions.includes(q.id)) || []

  const canEvaluate = !userAnswer || userAnswer.status === AnswerStatusEnum.EVALUATED

  if (loadingAnswer) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canEvaluate) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Evaluations
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You have already submitted an evaluation for this form with status: {userAnswer?.status}
            </p>
            <p className="text-sm text-muted-foreground">
              You can only evaluate a form if you haven't submitted one yet, or if your previous submission has been evaluated.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Evaluations
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{evaluationForm.title || "Evaluation Form"}</CardTitle>
          <CardDescription>{evaluationForm.description || ""}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {evaluationForm.sections?.map((section, sectionIdx) => (
              <div key={section.id} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{section.title || `Section ${sectionIdx + 1}`}</h3>
                  {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}
                </div>

                {section.questions
                  ?.filter((q) => visibleQuestions.includes(q.id))
                  .map((question, qIdx) => (
                    <div key={question.id} className="space-y-3 p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-medium">
                          {qIdx + 1}. {question.text}
                        </Label>
                        {question.description && (
                          <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
                        )}
                        {question.instructions && (
                          <p className="text-sm text-muted-foreground mt-1 italic">{question.instructions}</p>
                        )}
                      </div>

                      {question.type === "SINGLE_LINE" && (
                        <Input
                          value={answers[question.id]?.textAnswer || ""}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value, "text")}
                          placeholder="Enter your answer"
                        />
                      )}

                      {question.type === "PARAGRAPH" && (
                        <Textarea
                          value={answers[question.id]?.textAnswer || ""}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value, "text")}
                          placeholder="Enter your answer"
                          rows={4}
                        />
                      )}

                      {question.type === "MCQ_SINGLE" && question.options && (
                        <RadioGroup
                          value={answers[question.id]?.selectedOptionId || ""}
                          onValueChange={(value) => handleAnswerChange(question.id, value, "single")}
                        >
                          {question.options.map((option) => (
                            <div key={option.id} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                              <Label htmlFor={`option-${option.id}`} className="font-normal cursor-pointer">
                                {option.text}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {question.type === "MCQ_MULTIPLE" && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option) => {
                            const currentSelected = answers[question.id]?.selectedOptionIds || []
                            const isChecked = currentSelected.includes(option.id)
                            return (
                              <div key={option.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`option-${option.id}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    const newSelected = checked
                                      ? [...currentSelected, option.id]
                                      : currentSelected.filter((id) => id !== option.id)
                                    handleAnswerChange(question.id, newSelected, "multiple")
                                  }}
                                />
                                <Label htmlFor={`option-${option.id}`} className="font-normal cursor-pointer">
                                  {option.text}
                                </Label>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {question.type === "FILE_UPLOAD" && (
                        <div className="space-y-2">
                          {answers[question.id]?.fileUploadUrl ? (
                            <div className="flex items-center gap-2 p-2 bg-muted rounded">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <a
                                href={answers[question.id].fileUploadUrl || ""}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                File uploaded
                              </a>
                            </div>
                          ) : (
                            <CloudinaryUploadButton
                              fileType={(question.fileType as "DOC" | "IMAGE" | "ZIP" | "ALL" | null | undefined) || "ALL"}
                              onUploadComplete={(url: string) => handleAnswerChange(question.id, url, "file")}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ))}

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
                  "Submit Evaluation"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

