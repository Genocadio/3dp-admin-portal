"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import { EVALUATION_FORMS_QUERY, ANSWER_BY_EVALUATION_FORM_QUERY, DELETE_EVALUATION_FORM_MUTATION } from "@/lib/graphql/evaluations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Plus, Loader2, Edit, ClipboardCheck, Trash2 } from "lucide-react"
import type { EvaluationForm } from "@/lib/graphql/types"
import { AnswerStatus } from "@/lib/graphql/types"
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

type EvaluationButtonProps = {
  evaluationFormId: string
  onEvaluate: () => void
}

function EvaluationButton({ evaluationFormId, onEvaluate }: EvaluationButtonProps) {
  const { data, loading } = useQuery<{ answerByEvaluationForm?: { id: string; status: AnswerStatus } | null }>(
    ANSWER_BY_EVALUATION_FORM_QUERY,
    {
      variables: { evaluationFormId },
      skip: !evaluationFormId,
    }
  )

  const answer = data?.answerByEvaluationForm
  const canEvaluate = !answer || answer.status === AnswerStatus.EVALUATED

  if (loading) {
    return (
      <Button variant="outline" className="flex-1" disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    )
  }

  if (!canEvaluate) {
    return (
      <Button variant="outline" className="flex-1" disabled>
        <ClipboardCheck className="w-4 h-4 mr-2" />
        {answer?.status === AnswerStatus.INPROGRESS ? "In Progress" : "Pending"}
      </Button>
    )
  }

  return (
    <Button variant="default" className="flex-1" onClick={onEvaluate}>
      <ClipboardCheck className="w-4 h-4 mr-2" />
      {answer ? "Re-evaluate" : "Evaluate"}
    </Button>
  )
}

type EvaluationsListProps = {
  onCreateNew?: () => void
  onEdit?: (form: EvaluationForm) => void
  onEvaluate?: (form: EvaluationForm) => void
}

export function EvaluationsList({ onCreateNew, onEdit, onEvaluate }: EvaluationsListProps) {
  const { data, loading, error, refetch } = useQuery<{ evaluationForms: EvaluationForm[] }>(EVALUATION_FORMS_QUERY)
  const [deleteEvaluationForm, { loading: deleting }] = useMutation(DELETE_EVALUATION_FORM_MUTATION, {
    refetchQueries: [{ query: EVALUATION_FORMS_QUERY }],
  })
  const [isMinimized, setIsMinimized] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [formToDelete, setFormToDelete] = useState<EvaluationForm | null>(null)

  useEffect(() => {
    if (!onCreateNew) return

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Minimize when scrolling up, expand when scrolling down or at top
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsMinimized(true)
      } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
        setIsMinimized(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY, onCreateNew])

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
          <p className="text-destructive mb-4">Error loading evaluations: {error.message}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  const evaluationForms = data?.evaluationForms || []

  const handleDeleteClick = (form: EvaluationForm) => {
    setFormToDelete(form)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!formToDelete) return
    
    try {
      const result = await deleteEvaluationForm({
        variables: { deleteEvaluationFormId: formToDelete.id },
      })
      
      if (result.data && 'deleteEvaluationForm' in result.data) {
        const deleteResult = (result.data as any).deleteEvaluationForm
        if (deleteResult?.success) {
          const deletedAnswerIds = deleteResult.answerIds || []
          const message = deleteResult.message || "Evaluation form deleted successfully"
          
          if (deletedAnswerIds.length > 0) {
            alert(`${message}\n\nDeleted ${deletedAnswerIds.length} associated answer(s).`)
          } else {
            alert(message)
          }
        } else {
          alert(deleteResult?.message || "Failed to delete evaluation form")
        }
      }
      
      setDeleteDialogOpen(false)
      setFormToDelete(null)
    } catch (error: any) {
      console.error("Error deleting evaluation form:", error)
      alert(error?.message || "Failed to delete evaluation form")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Evaluation Forms</h2>
        <p className="text-muted-foreground">
          {onCreateNew ? "Manage and create evaluation forms" : "View available evaluation forms"}
        </p>
      </div>

      {evaluationForms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No evaluation forms yet</p>
            {onCreateNew && (
              <Button onClick={onCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Evaluation
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evaluationForms.map((form) => (
            <Card key={form.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>{form.title || "Untitled Evaluation"}</CardTitle>
                <CardDescription>
                  {form.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">{form.sections?.length || 0}</span> section
                      {form.sections?.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">
                        {form.sections?.reduce((total, section) => total + (section.questions?.length || 0), 0) || 0}
                      </span>{" "}
                      question{form.sections?.reduce((total, section) => total + (section.questions?.length || 0), 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {onEdit && (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => onEdit(form)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(form)}
                          disabled={deleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {onEvaluate && (
                      <EvaluationButton
                        evaluationFormId={form.id}
                        onEvaluate={() => onEvaluate(form)}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Floating Create Button */}
      {onCreateNew && (
        <Button
          onClick={onCreateNew}
          size="default"
          className={`
            fixed bottom-6 right-6 z-50
            shadow-lg hover:shadow-xl
            transition-all duration-300 ease-in-out
            ${isMinimized ? "h-14 w-14 rounded-full px-0" : "h-14 px-6 rounded-full"}
          `}
          title="Create New Evaluation"
        >
          <Plus className="w-5 h-5" />
          {!isMinimized && <span className="ml-2">Create New Evaluation</span>}
        </Button>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evaluation Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{formToDelete?.title || "this evaluation form"}"? 
              This action cannot be undone and will also delete all associated answers and reviews.
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

