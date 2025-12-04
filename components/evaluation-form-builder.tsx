"use client"

import { useState, useEffect } from "react"
import { useMutation } from "@apollo/client/react"
import { CREATE_EVALUATION_FORM_MUTATION, UPDATE_EVALUATION_FORM_MUTATION, EVALUATION_FORMS_QUERY } from "@/lib/graphql/evaluations"
import type { CreateEvaluationFormInput, UpdateEvaluationFormInput, CreateSectionInput, CreateQuestionInput, CreateQuestionOptionInput, CreateQuestionDependencyInput, CreateQuestionMediaInput, EvaluationForm } from "@/lib/graphql/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react"
import { getToken, decodeToken } from "@/lib/auth/token"
import { CloudinaryUploadButton } from "@/components/cloudinary-upload-button"

type QuestionType = "SINGLE_LINE" | "PARAGRAPH" | "MCQ_SINGLE" | "MCQ_MULTIPLE" | "FILE_UPLOAD"
type FileType = "DOC" | "IMAGE" | "ZIP" | "ALL"
type DependencyType = "ANSWERED" | "OPTION_SELECTED" | "FILE_UPLOADED"

type EvaluationFormBuilderProps = {
  onBack: () => void
  onSuccess: () => void
  evaluationForm?: EvaluationForm | null // Optional: if provided, we're in edit mode
}

export function EvaluationFormBuilder({ onBack, onSuccess, evaluationForm }: EvaluationFormBuilderProps) {
  const isEditMode = !!evaluationForm
  
  const [createEvaluationForm, { loading: creating, error: createError }] = useMutation(CREATE_EVALUATION_FORM_MUTATION, {
    refetchQueries: [{ query: EVALUATION_FORMS_QUERY }],
  })
  
  const [updateEvaluationForm, { loading: updating, error: updateError }] = useMutation(UPDATE_EVALUATION_FORM_MUTATION, {
    refetchQueries: [{ query: EVALUATION_FORMS_QUERY }],
  })

  const loading = creating || updating
  const error = createError || updateError

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [sections, setSections] = useState<CreateSectionInput[]>([])
  const [formId, setFormId] = useState<string | null>(evaluationForm?.id || null)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Track the last saved state to detect changes
  const [lastSavedState, setLastSavedState] = useState<{
    title: string
    description: string
    sections: CreateSectionInput[]
  } | null>(null)

  // Initialize form data when in edit mode
  useEffect(() => {
    if (evaluationForm) {
      setFormId(evaluationForm.id)
      const initialTitle = evaluationForm.title || ""
      const initialDescription = evaluationForm.description || ""
      setTitle(initialTitle)
      setDescription(initialDescription)
      
      // Convert EvaluationForm sections to CreateSectionInput format
      const convertedSections: CreateSectionInput[] = (evaluationForm.sections || []).map((section) => ({
        id: section.id,
        title: section.title || null,
        description: section.description || null,
        order: section.order || null,
        questions: (section.questions || []).map((question) => ({
          id: question.id,
          text: question.text || null,
          type: question.type || null,
          description: question.description || null,
          instructions: question.instructions || null,
          maxScore: question.maxScore || null,
          fileType: question.fileType || null,
          order: question.order || null,
          options: (question.options || []).map((opt) => ({
            id: opt.id,
            text: opt.text || null,
            isCorrect: opt.isCorrect || false,
            order: opt.order || null,
          })),
          dependencies: (question.dependencies || []).map((dep) => ({
            dependsOnQuestionId: dep.dependsOnQuestionId || null,
            type: dep.type || null,
            // Store value as string for form input (will convert to array on submit)
            value: Array.isArray(dep.value) ? dep.value.join(", ") : (dep.value || null),
          })),
          media: (question.media || []).map((m) => ({
            url: m.url || null,
            order: m.order || null,
          })),
        })),
      }))
      
      const finalSections = convertedSections.length > 0 ? convertedSections : [
        {
          id: null,
          title: null,
          description: null,
          order: 0,
          questions: [
            {
              id: null,
              text: null,
              type: null,
              description: null,
              instructions: null,
              maxScore: null,
              fileType: null,
              order: 0,
              options: [],
              dependencies: [{ dependsOnQuestionId: null, type: null, value: null }],
              media: [{ order: null, url: null }],
            },
          ],
        },
      ]
      setSections(finalSections)
      
      // Store initial state for change tracking
      setLastSavedState({
        title: initialTitle,
        description: initialDescription,
        sections: JSON.parse(JSON.stringify(finalSections)), // Deep clone
      })
    } else {
      // Create mode - initialize with empty section
      setSections([
        {
          id: null,
          title: null,
          description: null,
          order: 0,
          questions: [
            {
              id: null,
              text: null,
              type: null,
              description: null,
              instructions: null,
              maxScore: null,
              fileType: null,
              order: 0,
              options: [],
              dependencies: [{ dependsOnQuestionId: null, type: null, value: null }],
              media: [{ order: null, url: null }],
            },
          ],
        },
      ])
    }
  }, [evaluationForm])

  // Check if a question is complete
  const isQuestionComplete = (question: CreateQuestionInput): boolean => {
    if (!question.text?.trim()) return false
    if (!question.type) return false
    if (question.maxScore === null || question.maxScore === undefined) return false
    
    // Validate MCQ questions have options
    if ((question.type === "MCQ_SINGLE" || question.type === "MCQ_MULTIPLE")) {
      if (!question.options || question.options.length === 0) return false
      // Check all options have text
      if (question.options.some(opt => !opt.text?.trim())) return false
    }
    
    // Validate file_upload questions have fileType
    if (question.type === "FILE_UPLOAD" && !question.fileType) return false
    
    return true
  }

  // Check if a section is complete
  const isSectionComplete = (section: CreateSectionInput): boolean => {
    if (!section.title?.trim()) return false
    if (!section.questions || section.questions.length === 0) return false
    // All questions in section must be complete
    return section.questions.every(q => isQuestionComplete(q))
  }

  // Helper function to process dependencies - filters out dependencies that reference questions without IDs
  const processDependencies = (question: CreateQuestionInput, questionHasId: boolean = false, isNewForm: boolean = false): Array<{ dependsOnQuestionId: string; type: string; value: string[] }> => {
    // When creating a new form, skip all dependencies since all questions are new and don't have IDs yet
    if (isNewForm) {
      return []
    }
    
    // If the question itself doesn't have an ID yet (new question in existing form),
    // skip dependencies that use internal IDs since they can't be resolved yet
    // Only include dependencies that already have real database IDs
    if (!questionHasId) {
      // For new questions, only include dependencies with real database IDs (not internal format)
      if (!question.dependencies || question.dependencies.length === 0) {
        return []
      }
      
      return question.dependencies
        .filter((dep) => {
          // Filter out null/empty dependencies
          if (!dep || !dep.dependsOnQuestionId || !dep.type) return false
          
          // Skip internal IDs - new questions can't have dependencies on other new questions
          const isInternalId = /^s\d+-q\d+$/.test(dep.dependsOnQuestionId)
          if (isInternalId) {
            return false
          }
          
          // Only include dependencies with real database IDs
          return true
        })
        .map((dep) => {
          let valueArray: string[] = []
          if (dep.value) {
            if (Array.isArray(dep.value)) {
              valueArray = dep.value.filter((v) => v && typeof v === "string" && v.trim())
            } else if (typeof dep.value === "string") {
              valueArray = dep.value.split(",").map((v: string) => v.trim()).filter((v) => v.length > 0)
            }
          }
          
          return {
            dependsOnQuestionId: dep.dependsOnQuestionId,
            type: dep.type as any,
            value: valueArray,
          }
        })
        .filter((dep) => dep.dependsOnQuestionId && dep.type) as Array<{ dependsOnQuestionId: string; type: string; value: string[] }>
    }
    
    // For questions with IDs, process dependencies normally
    if (!question.dependencies || question.dependencies.length === 0) {
      return []
    }
    
    return question.dependencies
      .filter((dep) => {
        // Filter out null/empty dependencies
        if (!dep || !dep.dependsOnQuestionId || !dep.type) return false
        
        // Check if it's an internal ID format (s{number}-q{number})
        const isInternalId = /^s\d+-q\d+$/.test(dep.dependsOnQuestionId)
        
        if (isInternalId) {
          // Parse internal ID format: s{sectionIndex}-q{questionIndex}
          const match = dep.dependsOnQuestionId.match(/^s(\d+)-q(\d+)$/)
          if (match) {
            const sectionIdx = parseInt(match[1], 10)
            const questionIdx = parseInt(match[2], 10)
            // Only include if the referenced question has a real database ID
            const referencedQuestion = sections[sectionIdx]?.questions[questionIdx]
            if (!referencedQuestion?.id) {
              // Skip dependencies on questions that don't have IDs yet (new questions)
              return false
            }
          } else {
            return false // Invalid internal ID format
          }
        }
        
        // For non-internal IDs, assume they're valid database IDs
        return true
      })
      .map((dep) => {
        let valueArray: string[] = []
        if (dep.value) {
          if (Array.isArray(dep.value)) {
            valueArray = dep.value.filter((v) => v && typeof v === "string" && v.trim())
          } else if (typeof dep.value === "string") {
            valueArray = dep.value.split(",").map((v: string) => v.trim()).filter((v) => v.length > 0)
          }
        }
        
        // Convert internal ID to real database ID if needed
        let dependsOnId = dep.dependsOnQuestionId || ""
        if (/^s\d+-q\d+$/.test(dependsOnId)) {
          const match = dependsOnId.match(/^s(\d+)-q(\d+)$/)
          if (match) {
            const sectionIdx = parseInt(match[1], 10)
            const questionIdx = parseInt(match[2], 10)
            const referencedQuestion = sections[sectionIdx]?.questions[questionIdx]
            if (referencedQuestion?.id) {
              dependsOnId = referencedQuestion.id
            } else {
              return null // This shouldn't happen due to filter above, but just in case
            }
          } else {
            return null // Invalid format
          }
        }
        
        return {
          dependsOnQuestionId: dependsOnId,
          type: dep.type as any,
          value: valueArray,
        }
      })
      .filter((dep) => dep !== null && dep.dependsOnQuestionId && dep.type) as Array<{ dependsOnQuestionId: string; type: string; value: string[] }>
  }

  // Helper to normalize sections for comparison (remove empty dependencies/media)
  const normalizeSections = (sections: CreateSectionInput[]): any => {
    return sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
      questions: section.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        description: q.description,
        instructions: q.instructions,
        maxScore: q.maxScore,
        fileType: q.fileType,
        order: q.order,
        options: (q.options || []).filter(opt => opt.text?.trim()).map(opt => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
          order: opt.order,
        })),
        dependencies: (q.dependencies || []).filter(dep => dep.dependsOnQuestionId && dep.type),
        media: (q.media || []).filter(m => m.url?.trim()),
      })),
    }))
  }

  // Check if there are any changes since last save
  const hasChanges = (): boolean => {
    if (!lastSavedState) {
      // New form - check if title is set (minimum requirement)
      return title.trim().length > 0
    }
    
    // Compare current state with last saved state
    if (title.trim() !== lastSavedState.title.trim()) return true
    if ((description || "").trim() !== (lastSavedState.description || "").trim()) return true
    
    // Deep compare sections
    const currentNormalized = normalizeSections(sections)
    const savedNormalized = normalizeSections(lastSavedState.sections)
    
    return JSON.stringify(currentNormalized) !== JSON.stringify(savedNormalized)
  }

  // Auto-save function (silent background save)
  const autoSave = async () => {
    // Check if there are any changes
    if (!hasChanges()) {
      return // No changes, skip save
    }
    
    // Only auto-save if we have a form ID (already created) or if we're in edit mode
    if (!formId && !isEditMode) {
      // First time - need to create the form first
      if (!title.trim()) return // Can't create without title
      
      try {
        setAutoSaving(true)
        const input: CreateEvaluationFormInput = {
          title: title.trim(),
          description: description?.trim() || null,
          sections: sections.map((section, sectionIndex) => ({
            title: section.title?.trim() || "",
            description: section.description?.trim() || null,
            id: section.id,
            order: sectionIndex,
            questions: section.questions.map((question, questionIndex) => ({
              text: question.text?.trim() || "",
              type: question.type as any,
              description: question.description?.trim() || null,
              instructions: question.instructions?.trim() || null,
              maxScore: question.maxScore || 0,
              fileType: question.fileType as any || null,
              id: question.id,
              order: questionIndex,
              options: (question.options || []).map((opt, optIndex) => ({
                id: opt.id,
                text: opt.text?.trim() || "",
                isCorrect: opt.isCorrect || false,
                order: optIndex,
              })),
              dependencies: processDependencies(question, !!question.id, !formId && !isEditMode),
              media: (question.media || [])
                .filter((m) => m.url?.trim())
                .map((m, mIndex) => ({
                  url: m.url?.trim() || "",
                  order: mIndex,
                })),
            })),
          })),
        }

        const result = await createEvaluationForm({
          variables: { input },
        })
        
        if (result.data?.createEvaluationForm?.id) {
          setFormId(result.data.createEvaluationForm.id)
          setLastSaved(new Date())
          // Update saved state
          setLastSavedState({
            title: title.trim(),
            description: description?.trim() || "",
            sections: JSON.parse(JSON.stringify(sections)), // Deep clone
          })
        }
      } catch (err) {
        console.error("Auto-save failed:", err)
        // Silent fail - don't show error to user
      } finally {
        setAutoSaving(false)
      }
    } else if (formId) {
      // Update existing form
      try {
        setAutoSaving(true)
        const updateInput: UpdateEvaluationFormInput = {
          title: title.trim() || undefined,
          description: description?.trim() || null,
          sections: sections.map((section, sectionIndex) => ({
            title: section.title?.trim() || "",
            description: section.description?.trim() || null,
            id: section.id,
            order: sectionIndex,
            questions: section.questions.map((question, questionIndex) => ({
              text: question.text?.trim() || "",
              type: question.type as any,
              description: question.description?.trim() || null,
              instructions: question.instructions?.trim() || null,
              maxScore: question.maxScore || 0,
              fileType: question.fileType as any || null,
              id: question.id,
              order: questionIndex,
              options: (question.options || []).map((opt, optIndex) => ({
                id: opt.id,
                text: opt.text?.trim() || "",
                isCorrect: opt.isCorrect || false,
                order: optIndex,
              })),
              dependencies: processDependencies(question, !!question.id, !formId && !isEditMode),
              media: (question.media || [])
                .filter((m) => m.url?.trim())
                .map((m, mIndex) => ({
                  url: m.url?.trim() || "",
                  order: mIndex,
                })),
            })),
          })),
        }

        await updateEvaluationForm({
          variables: {
            updateEvaluationFormId: formId,
            input: updateInput,
          },
        })
        
        setLastSaved(new Date())
        // Update saved state
        setLastSavedState({
          title: title.trim(),
          description: description?.trim() || "",
          sections: JSON.parse(JSON.stringify(sections)), // Deep clone
        })
      } catch (err) {
        console.error("Auto-save failed:", err)
        // Silent fail - don't show error to user
      } finally {
        setAutoSaving(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!title.trim()) {
      alert("Title is required")
      return
    }

    // Validate sections have titles and questions
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]
      if (!section.title?.trim()) {
        alert(`Section ${i + 1} must have a title`)
        return
      }
      if (!section.questions || section.questions.length === 0) {
        alert(`Section ${i + 1} must have at least one question`)
        return
      }
      // Validate questions
      for (let j = 0; j < section.questions.length; j++) {
        const question = section.questions[j]
        if (!question.text?.trim()) {
          alert(`Section ${i + 1}, Question ${j + 1} must have text`)
          return
        }
        if (!question.type) {
          alert(`Section ${i + 1}, Question ${j + 1} must have a type`)
          return
        }
        if (question.maxScore === null || question.maxScore === undefined) {
          alert(`Section ${i + 1}, Question ${j + 1} must have a max score`)
          return
        }
        // Validate MCQ questions have options
        if ((question.type === "MCQ_SINGLE" || question.type === "MCQ_MULTIPLE") && (!question.options || question.options.length === 0)) {
          alert(`Section ${i + 1}, Question ${j + 1} (MCQ) must have at least one option`)
          return
        }
        // Validate file_upload questions have fileType
        if (question.type === "FILE_UPLOAD" && !question.fileType) {
          alert(`Section ${i + 1}, Question ${j + 1} (File Upload) must have a file type`)
          return
        }
      }
    }

    // Build the input according to the GraphQL schema
    // Authentication is handled via JWT token in the Authorization header
    const input: CreateEvaluationFormInput = {
      title: title.trim(),
      description: description?.trim() || null,
      sections: sections.map((section, sectionIndex) => ({
        title: section.title?.trim() || "",
        description: section.description?.trim() || null,
        id: section.id,
        order: sectionIndex,
        questions: section.questions.map((question, questionIndex) => ({
          text: question.text?.trim() || "",
          type: question.type as any,
          description: question.description?.trim() || null,
          instructions: question.instructions?.trim() || null,
          maxScore: question.maxScore || 0,
          fileType: question.fileType as any || null,
          id: question.id,
          order: questionIndex,
          options: (question.options || []).map((opt, optIndex) => ({
            id: opt.id,
            text: opt.text?.trim() || "",
            isCorrect: opt.isCorrect || false,
            order: optIndex,
          })),
          dependencies: (question.dependencies || [])
            .filter((dep) => dep.dependsOnQuestionId && dep.type)
            .map((dep) => {
              // Handle dependency value - it should be an array of strings per schema
              let valueArray: string[] = []
              if (dep.value) {
                if (Array.isArray(dep.value)) {
                  valueArray = dep.value.filter((v) => v && typeof v === "string" && v.trim())
                } else if (typeof dep.value === "string") {
                  // Split comma-separated values and filter empty strings
                  valueArray = dep.value.split(",").map((v: string) => v.trim()).filter((v) => v.length > 0)
                }
              }
              return {
                dependsOnQuestionId: dep.dependsOnQuestionId || "",
                type: dep.type as any,
                value: valueArray,
              }
            }),
          media: (question.media || [])
            .filter((m) => m.url?.trim())
            .map((m, mIndex) => ({
              url: m.url?.trim() || "",
              order: mIndex,
            })),
        })),
      })),
    }

    try {
      // Use update if formId exists (either from edit mode or auto-save)
      if (formId) {
        const updateInput: UpdateEvaluationFormInput = {
          title: title.trim(),
          description: description?.trim() || null,
          sections: sections.map((section, sectionIndex) => ({
            title: section.title?.trim() || "",
            description: section.description?.trim() || null,
            id: section.id,
            order: sectionIndex,
            questions: section.questions.map((question, questionIndex) => ({
              text: question.text?.trim() || "",
              type: question.type as any,
              description: question.description?.trim() || null,
              instructions: question.instructions?.trim() || null,
              maxScore: question.maxScore || 0,
              fileType: question.fileType as any || null,
              id: question.id,
              order: questionIndex,
              options: (question.options || []).map((opt, optIndex) => ({
                id: opt.id,
                text: opt.text?.trim() || "",
                isCorrect: opt.isCorrect || false,
                order: optIndex,
              })),
              dependencies: processDependencies(question, !!question.id, false),
              media: (question.media || [])
                .filter((m) => m.url?.trim())
                .map((m, mIndex) => ({
                  url: m.url?.trim() || "",
                  order: mIndex,
                })),
            })),
          })),
        }
        
        await updateEvaluationForm({
          variables: {
            updateEvaluationFormId: formId,
            input: updateInput,
          },
        })
      } else {
        // Create new form
        const result = await createEvaluationForm({
          variables: { input },
        })
        
        if (result.data?.createEvaluationForm?.id) {
          setFormId(result.data.createEvaluationForm.id)
        }
      }
      onSuccess()
    } catch (err) {
      console.error(`Error ${formId ? "updating" : "creating"} evaluation form:`, err)
    }
  }

  const addSection = async () => {
    // Auto-save current sections if the last section is complete
    if (sections.length > 0) {
      const lastSection = sections[sections.length - 1]
      if (isSectionComplete(lastSection)) {
        await autoSave()
      }
    }
    
    setSections([
      ...sections,
      {
        id: null,
        title: null,
        description: null,
        order: sections.length,
        questions: [
          {
            id: null,
            text: null,
            type: null,
            description: null,
            instructions: null,
            maxScore: null,
            fileType: null,
            order: 0,
            options: [],
            dependencies: [{ dependsOnQuestionId: null, type: null, value: null }],
            media: [{ order: null, url: null }],
          },
        ],
      },
    ])
  }

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index))
  }

  const updateSection = (index: number, field: keyof CreateSectionInput, value: any) => {
    const updated = [...sections]
    updated[index] = { ...updated[index], [field]: value }
    setSections(updated)
  }

  const addQuestion = async (sectionIndex: number) => {
    // Auto-save current question if it's complete
    const currentQuestions = sections[sectionIndex]?.questions || []
    if (currentQuestions.length > 0) {
      const lastQuestion = currentQuestions[currentQuestions.length - 1]
      if (isQuestionComplete(lastQuestion)) {
        // Auto-save silently if form hasn't been created yet, or update if it exists
        if (!formId) {
          // Create form silently if title is valid
          if (title.trim()) {
            try {
              setAutoSaving(true)
              const input: CreateEvaluationFormInput = {
                title: title.trim(),
                description: description?.trim() || null,
                sections: sections.map((section, sIdx) => ({
                  title: section.title?.trim() || "",
                  description: section.description?.trim() || null,
                  id: section.id,
                  order: sIdx,
                  questions: section.questions.map((question, qIdx) => ({
                    text: question.text?.trim() || "",
                    type: question.type as any,
                    description: question.description?.trim() || null,
                    instructions: question.instructions?.trim() || null,
                    maxScore: question.maxScore || 0,
                    fileType: question.fileType as any || null,
                    id: question.id,
                    order: qIdx,
                    options: (question.options || []).map((opt, optIndex) => ({
                      id: opt.id,
                      text: opt.text?.trim() || "",
                      isCorrect: opt.isCorrect || false,
                      order: optIndex,
                    })),
                    dependencies: processDependencies(question, !!question.id, true),
                    media: (question.media || [])
                      .filter((m) => m.url?.trim())
                      .map((m, mIndex) => ({
                        url: m.url?.trim() || "",
                        order: mIndex,
                      })),
                  })),
                })),
              }

              const result = await createEvaluationForm({
                variables: { input },
              })
              
              if (result.data?.createEvaluationForm?.id) {
                setFormId(result.data.createEvaluationForm.id)
                setLastSaved(new Date())
                setLastSavedState({
                  title: title.trim(),
                  description: description?.trim() || "",
                  sections: JSON.parse(JSON.stringify(sections)),
                })
              }
            } catch (err) {
              console.error("Auto-save failed:", err)
            } finally {
              setAutoSaving(false)
            }
          }
        } else {
          // Update existing form
          await autoSave()
        }
      }
    }
    
    const updated = [...sections]
    updated[sectionIndex].questions.push({
      id: null,
      text: null,
      type: null,
      description: null,
      instructions: null,
      maxScore: null,
      fileType: null,
      order: updated[sectionIndex].questions.length,
      options: [],
      dependencies: [{ dependsOnQuestionId: null, type: null, value: null }],
      media: [{ order: null, url: null }],
    })
    setSections(updated)
  }

  const removeQuestion = (sectionIndex: number, questionIndex: number) => {
    const updated = [...sections]
    updated[sectionIndex].questions = updated[sectionIndex].questions.filter((_, i) => i !== questionIndex)
    setSections(updated)
  }

  const updateQuestion = (
    sectionIndex: number,
    questionIndex: number,
    field: keyof CreateQuestionInput,
    value: any
  ) => {
    const updated = [...sections]
    const question = { ...updated[sectionIndex].questions[questionIndex] }
    
    // If question type changes, reset options for non-MCQ types
    if (field === "type") {
      if (value !== "mcq_single" && value !== "mcq_multiple") {
        question.options = []
      }
      if (value !== "file_upload") {
        question.fileType = null
      }
    }
    
    question[field] = value
    updated[sectionIndex].questions[questionIndex] = question
    setSections(updated)
  }

  const addOption = (sectionIndex: number, questionIndex: number) => {
    const updated = [...sections]
    const question = updated[sectionIndex].questions[questionIndex]
    question.options = [
      ...(question.options || []),
      {
        id: null,
        text: null,
        isCorrect: false,
        order: question.options?.length || 0,
      },
    ]
    setSections(updated)
  }

  const removeOption = (sectionIndex: number, questionIndex: number, optionIndex: number) => {
    const updated = [...sections]
    const question = updated[sectionIndex].questions[questionIndex]
    question.options = question.options?.filter((_, i) => i !== optionIndex) || []
    setSections(updated)
  }

  const updateOption = (
    sectionIndex: number,
    questionIndex: number,
    optionIndex: number,
    field: keyof CreateQuestionOptionInput,
    value: any
  ) => {
    const updated = [...sections]
    const question = updated[sectionIndex].questions[questionIndex]
    const options = [...(question.options || [])]
    options[optionIndex] = { ...options[optionIndex], [field]: value }
    question.options = options
    setSections(updated)
  }

  const addDependency = (sectionIndex: number, questionIndex: number) => {
    const updated = [...sections]
    const question = updated[sectionIndex].questions[questionIndex]
    question.dependencies = [
      ...(question.dependencies || []),
      {
        dependsOnQuestionId: null,
        type: null,
        value: null,
      },
    ]
    setSections(updated)
  }

  const removeDependency = (sectionIndex: number, questionIndex: number, dependencyIndex: number) => {
    const updated = [...sections]
    const question = updated[sectionIndex].questions[questionIndex]
    question.dependencies = question.dependencies?.filter((_, i) => i !== dependencyIndex) || []
    setSections(updated)
  }

  const updateDependency = (
    sectionIndex: number,
    questionIndex: number,
    dependencyIndex: number,
    field: keyof CreateQuestionDependencyInput,
    value: any
  ) => {
    const updated = [...sections]
    const question = updated[sectionIndex].questions[questionIndex]
    const dependencies = [...(question.dependencies || [])]
    dependencies[dependencyIndex] = { ...dependencies[dependencyIndex], [field]: value }
    question.dependencies = dependencies
    setSections(updated)
  }

  const addMedia = (sectionIndex: number, questionIndex: number) => {
    const updated = [...sections]
    const question = updated[sectionIndex].questions[questionIndex]
    question.media = [
      ...(question.media || []),
      {
        order: question.media?.length || 0,
        url: null,
      },
    ]
    setSections(updated)
  }

  const removeMedia = (sectionIndex: number, questionIndex: number, mediaIndex: number) => {
    const updated = [...sections]
    const question = updated[sectionIndex].questions[questionIndex]
    question.media = question.media?.filter((_, i) => i !== mediaIndex) || []
    setSections(updated)
  }

  const updateMedia = (
    sectionIndex: number,
    questionIndex: number,
    mediaIndex: number,
    field: keyof CreateQuestionMediaInput,
    value: any
  ) => {
    const updated = [...sections]
    const question = updated[sectionIndex].questions[questionIndex]
    const media = [...(question.media || [])]
    media[mediaIndex] = { ...media[mediaIndex], [field]: value }
    question.media = media
    setSections(updated)
  }

  // Get all question IDs for dependency selection (all questions before current one)
  const getAvailableQuestionsForDependency = (sectionIndex: number, questionIndex: number) => {
    const questions: Array<{ id: string; text: string; sectionIndex: number; questionIndex: number; question: CreateQuestionInput }> = []
    
    // Add questions from current section (before current question)
    for (let i = 0; i < questionIndex; i++) {
      const q = sections[sectionIndex].questions[i]
      if (q.text) {
        questions.push({
          id: `s${sectionIndex}-q${i}`,
          text: q.text,
          sectionIndex,
          questionIndex: i,
          question: q,
        })
      }
    }
    
    // Add questions from previous sections
    for (let s = 0; s < sectionIndex; s++) {
      sections[s].questions.forEach((q, qIdx) => {
        if (q.text) {
          questions.push({
            id: `s${s}-q${qIdx}`,
            text: q.text,
            sectionIndex: s,
            questionIndex: qIdx,
            question: q,
          })
        }
      })
    }
    
    return questions
  }

  // Get the parent question based on dependency question ID
  const getParentQuestion = (dependsOnQuestionId: string | null): CreateQuestionInput | null => {
    if (!dependsOnQuestionId) return null
    
    // Parse the question ID format: s{sectionIndex}-q{questionIndex}
    const match = dependsOnQuestionId.match(/^s(\d+)-q(\d+)$/)
    if (!match) return null
    
    const sectionIdx = parseInt(match[1], 10)
    const questionIdx = parseInt(match[2], 10)
    
    if (sections[sectionIdx] && sections[sectionIdx].questions[questionIdx]) {
      return sections[sectionIdx].questions[questionIdx]
    }
    
    return null
  }

  // Get available dependency types based on parent question type
  const getAvailableDependencyTypes = (dependsOnQuestionId: string | null): DependencyType[] => {
    const parentQuestion = getParentQuestion(dependsOnQuestionId)
    if (!parentQuestion || !parentQuestion.type) {
      return ["ANSWERED"]
    }
    
    const parentType = parentQuestion.type as QuestionType
    
    if (parentType === "MCQ_SINGLE" || parentType === "MCQ_MULTIPLE") {
      return ["ANSWERED", "OPTION_SELECTED"]
    } else if (parentType === "FILE_UPLOAD") {
      // For file upload questions, only show FILE_UPLOADED (not ANSWERED)
      return ["FILE_UPLOADED"]
    } else {
      return ["ANSWERED"]
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-2xl font-bold">{isEditMode ? "Edit Evaluation Form" : "Create New Evaluation Form"}</h2>
              <p className="text-muted-foreground">
                {isEditMode ? "Update the evaluation form with sections and questions" : "Build a new evaluation form with sections and questions"}
              </p>
            </div>
            {autoSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            {lastSaved && !autoSaving && (
              <div className="text-sm text-green-600">
                Saved {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the title and description for your evaluation form</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Evaluation Form Title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this evaluation form is for"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {sections.map((section, sectionIndex) => {
          const sectionComplete = isSectionComplete(section)
          return (
          <Card key={sectionIndex} className={sectionComplete ? "" : "border-yellow-500 border-2"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Section {sectionIndex + 1}
                    {!sectionComplete && (
                      <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                        Incomplete
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>Add questions to this section</CardDescription>
                </div>
                {sections.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeSection(sectionIndex)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Section
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor={`section-title-${sectionIndex}`}>Section Title *</Label>
                <Input
                  id={`section-title-${sectionIndex}`}
                  value={section.title || ""}
                  onChange={(e) => updateSection(sectionIndex, "title", e.target.value)}
                  placeholder="Section Title"
                  required
                  className={!section.title?.trim() ? "border-yellow-500" : ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`section-description-${sectionIndex}`}>Section Description</Label>
                <Textarea
                  id={`section-description-${sectionIndex}`}
                  value={section.description || ""}
                  onChange={(e) => updateSection(sectionIndex, "description", e.target.value)}
                  placeholder="Section Description"
                  rows={2}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Questions</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => addQuestion(sectionIndex)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                {section.questions.map((question, questionIndex) => {
                  const questionType = question.type as QuestionType
                  const isMCQ = questionType === "MCQ_SINGLE" || questionType === "MCQ_MULTIPLE"
                  const isFileUpload = questionType === "FILE_UPLOAD"
                  const availableQuestions = getAvailableQuestionsForDependency(sectionIndex, questionIndex)
                  
                  // Calculate total questions across all sections
                  const totalQuestions = sections.reduce((total, sec) => total + (sec.questions?.length || 0), 0)
                  const hasMultipleQuestions = totalQuestions > 1
                  
                  const questionComplete = isQuestionComplete(question)
                  return (
                    <Card key={questionIndex} className={`bg-muted/50 ${questionComplete ? "" : "border-yellow-400 border-2"}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            Question {questionIndex + 1}
                            {!questionComplete && (
                              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">
                                Incomplete
                              </span>
                            )}
                          </CardTitle>
                          {section.questions.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(sectionIndex, questionIndex)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor={`question-text-${sectionIndex}-${questionIndex}`}>
                            Question Text *
                          </Label>
                          <Input
                            id={`question-text-${sectionIndex}-${questionIndex}`}
                            value={question.text || ""}
                            onChange={(e) => updateQuestion(sectionIndex, questionIndex, "text", e.target.value)}
                            placeholder="Enter your question"
                            required
                            className={!question.text?.trim() ? "border-yellow-500" : ""}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor={`question-type-${sectionIndex}-${questionIndex}`}>
                            Question Type *
                          </Label>
                          <Select
                            value={questionType || ""}
                            onValueChange={(value) => updateQuestion(sectionIndex, questionIndex, "type", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select question type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SINGLE_LINE">Single Line Text</SelectItem>
                              <SelectItem value="PARAGRAPH">Paragraph Text</SelectItem>
                              <SelectItem value="MCQ_SINGLE">Multiple Choice (Single)</SelectItem>
                              <SelectItem value="MCQ_MULTIPLE">Multiple Choice (Multiple)</SelectItem>
                              <SelectItem value="FILE_UPLOAD">File Upload</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor={`question-description-${sectionIndex}-${questionIndex}`}>
                            Description
                          </Label>
                          <Textarea
                            id={`question-description-${sectionIndex}-${questionIndex}`}
                            value={question.description || ""}
                            onChange={(e) => updateQuestion(sectionIndex, questionIndex, "description", e.target.value)}
                            placeholder="Optional description for the question"
                            rows={2}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor={`question-maxScore-${sectionIndex}-${questionIndex}`}>
                            Max Score *
                          </Label>
                          <Input
                            id={`question-maxScore-${sectionIndex}-${questionIndex}`}
                            type="number"
                            min="0"
                            value={question.maxScore ?? ""}
                            onChange={(e) => updateQuestion(sectionIndex, questionIndex, "maxScore", e.target.value ? Number(e.target.value) : null)}
                            placeholder="Maximum score for this question"
                            required
                            className={(question.maxScore === null || question.maxScore === undefined) ? "border-yellow-500" : ""}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor={`question-instructions-${sectionIndex}-${questionIndex}`}>
                            Instructions
                          </Label>
                          <Textarea
                            id={`question-instructions-${sectionIndex}-${questionIndex}`}
                            value={question.instructions || ""}
                            onChange={(e) => updateQuestion(sectionIndex, questionIndex, "instructions", e.target.value)}
                            placeholder="Optional instructions or hints"
                            rows={2}
                          />
                        </div>

                        {isFileUpload && (
                          <div className="grid gap-2">
                            <Label htmlFor={`question-fileType-${sectionIndex}-${questionIndex}`}>
                              File Type *
                            </Label>
                            <Select
                              value={question.fileType || ""}
                              onValueChange={(value) => updateQuestion(sectionIndex, questionIndex, "fileType", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select allowed file type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DOC">Document (doc, pdf, etc.)</SelectItem>
                                <SelectItem value="IMAGE">Image (jpg, png, etc.)</SelectItem>
                                <SelectItem value="ZIP">Archive (zip, rar, etc.)</SelectItem>
                                <SelectItem value="ALL">All File Types</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {isMCQ && (
                          <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <Label>Options</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(sectionIndex, questionIndex)}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Option
                              </Button>
                            </div>
                            {question.options && question.options.length > 0 ? (
                              <div className="space-y-2">
                                {question.options.map((option, optionIndex) => (
                                  <Card key={optionIndex} className="bg-background">
                                    <CardContent className="pt-4">
                                      <div className="flex items-start gap-3">
                                        <div className="flex-1 space-y-2">
                                          <Input
                                            value={option.text || ""}
                                            onChange={(e) => updateOption(sectionIndex, questionIndex, optionIndex, "text", e.target.value)}
                                            placeholder="Option text"
                                          />
                                          <div className="flex items-center gap-2">
                                            <Checkbox
                                              id={`option-correct-${sectionIndex}-${questionIndex}-${optionIndex}`}
                                              checked={option.isCorrect || false}
                                              onCheckedChange={(checked) => updateOption(sectionIndex, questionIndex, optionIndex, "isCorrect", checked)}
                                            />
                                            <Label
                                              htmlFor={`option-correct-${sectionIndex}-${questionIndex}-${optionIndex}`}
                                              className="text-sm font-normal cursor-pointer"
                                            >
                                              Mark as correct answer
                                            </Label>
                                          </div>
                                        </div>
                                        {question.options && question.options.length > 1 && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeOption(sectionIndex, questionIndex, optionIndex)}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No options added yet</p>
                            )}
                          </div>
                        )}

                        {hasMultipleQuestions && (
                          <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <Label>Dependencies (Optional)</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addDependency(sectionIndex, questionIndex)}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Dependency
                              </Button>
                            </div>
                            {question.dependencies && question.dependencies.length > 0 && (
                            <div className="space-y-2">
                              {question.dependencies.map((dependency, depIndex) => (
                                <Card key={depIndex} className="bg-background">
                                  <CardContent className="pt-4">
                                    <div className="space-y-2">
                                      <div className="grid gap-2">
                                        <Label>Depends On Question</Label>
                                        <Select
                                          value={dependency.dependsOnQuestionId || ""}
                                          onValueChange={(value) => {
                                            updateDependency(sectionIndex, questionIndex, depIndex, "dependsOnQuestionId", value)
                                            // Check if current dependency type is still valid for the new question
                                            const newParentQuestion = getParentQuestion(value)
                                            if (newParentQuestion) {
                                              const availableTypes = getAvailableDependencyTypes(value)
                                              if (dependency.type && !availableTypes.includes(dependency.type as DependencyType)) {
                                                // Reset to first available type
                                                updateDependency(sectionIndex, questionIndex, depIndex, "type", availableTypes[0])
                                                updateDependency(sectionIndex, questionIndex, depIndex, "value", null)
                                              }
                                            }
                                          }}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a question" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {availableQuestions.length > 0 ? (
                                              availableQuestions.map((q) => (
                                                <SelectItem key={q.id} value={q.id}>
                                                  {q.text}
                                                </SelectItem>
                                              ))
                                            ) : (
                                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                No previous questions available
                                              </div>
                                            )}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="grid gap-2">
                                        <Label>Dependency Type</Label>
                                        <Select
                                          value={dependency.type || ""}
                                          onValueChange={(value) => {
                                            // Reset value when type changes
                                            updateDependency(sectionIndex, questionIndex, depIndex, "type", value)
                                            if (value !== "OPTION_SELECTED") {
                                              updateDependency(sectionIndex, questionIndex, depIndex, "value", null)
                                            }
                                          }}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select dependency type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {getAvailableDependencyTypes(dependency.dependsOnQuestionId).map((depType) => (
                                              <SelectItem key={depType} value={depType}>
                                                {depType === "ANSWERED" && "Question Answered"}
                                                {depType === "OPTION_SELECTED" && "Option Selected"}
                                                {depType === "FILE_UPLOADED" && "File Uploaded"}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      {dependency.type === "OPTION_SELECTED" && (() => {
                                        const parentQuestion = getParentQuestion(dependency.dependsOnQuestionId)
                                        const parentOptions = parentQuestion?.options || []
                                        
                                        if (parentOptions.length === 0) {
                                          return (
                                            <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                                              The selected question does not have any options. Please select a multiple choice question.
                                            </div>
                                          )
                                        }
                                        
                                        // Get current selected values
                                        const currentValues = Array.isArray(dependency.value) 
                                          ? dependency.value 
                                          : (dependency.value ? dependency.value.split(",").map(v => v.trim()).filter(v => v) : [])
                                        
                                        return (
                                          <div className="grid gap-2">
                                            <Label>Select Options</Label>
                                            <div className="space-y-2 border rounded-lg p-3">
                                              {parentOptions.map((option, optIdx) => {
                                                const optionId = option.id || `opt-${optIdx}`
                                                const isSelected = currentValues.includes(optionId)
                                                
                                                return (
                                                  <div key={optIdx} className="flex items-center gap-2">
                                                    <Checkbox
                                                      id={`dep-option-${sectionIndex}-${questionIndex}-${depIndex}-${optIdx}`}
                                                      checked={isSelected}
                                                      onCheckedChange={(checked) => {
                                                        let newValues: string[]
                                                        if (checked) {
                                                          newValues = [...currentValues, optionId]
                                                        } else {
                                                          newValues = currentValues.filter(v => v !== optionId)
                                                        }
                                                        updateDependency(sectionIndex, questionIndex, depIndex, "value", newValues)
                                                      }}
                                                    />
                                                    <Label
                                                      htmlFor={`dep-option-${sectionIndex}-${questionIndex}-${depIndex}-${optIdx}`}
                                                      className="text-sm font-normal cursor-pointer flex-1"
                                                    >
                                                      {option.text || `Option ${optIdx + 1}`}
                                                    </Label>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          </div>
                                        )
                                      })()}
                                      {question.dependencies && question.dependencies.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeDependency(sectionIndex, questionIndex, depIndex)}
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Remove Dependency
                                        </Button>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-3 pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <Label>Media Attachments (Optional)</Label>
                            <CloudinaryUploadButton
                              fileType={question.fileType as "DOC" | "IMAGE" | "ZIP" | "ALL" | null}
                              onUploadComplete={(url) => {
                                // Add the uploaded URL directly
                                const updated = [...sections]
                                const question = updated[sectionIndex].questions[questionIndex]
                                question.media = [
                                  ...(question.media || []),
                                  {
                                    order: question.media?.length || 0,
                                    url: url,
                                  },
                                ]
                                setSections(updated)
                              }}
                            />
                          </div>
                          {question.media && question.media.length > 0 && (
                            <div className="space-y-2">
                              {question.media.map((media, mediaIndex) => (
                                <div key={mediaIndex} className="flex gap-2 items-center">
                                  <Input
                                    value={media.url || ""}
                                    onChange={(e) => updateMedia(sectionIndex, questionIndex, mediaIndex, "url", e.target.value)}
                                    placeholder="Media URL"
                                    className="flex-1"
                                    readOnly
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMedia(sectionIndex, questionIndex, mediaIndex)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
          )
        })}

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={addSection}>
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">Error: {error.message}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !title}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {formId ? "Updating..." : "Creating..."}
              </>
            ) : (
              formId ? "Update Evaluation Form" : "Create Evaluation Form"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

