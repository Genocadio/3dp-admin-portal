"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, FolderTree, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Category, Question, QuestionOption } from "@/lib/types"

type CategoryQuestionManagerProps = {
  applicationId: string
  applicationTitle: string
}

export function CategoryQuestionManager({ applicationId, applicationTitle }: CategoryQuestionManagerProps) {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false)
  const [newCategory, setNewCategory] = useState({ title: "", description: "" })
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    help_text: "",
    question_type: "multiple_choice" as "multiple_choice" | "text" | "media_only",
    points: 10,
    options: [{ text: "Yes", value: "yes", points: 10, showUpload: false }] as QuestionOption[],
    media_required: false,
    depends_on_question_id: null as string | null,
    depends_on_answer: "",
  })

  useEffect(() => {
    loadCategories()
  }, [applicationId])

  useEffect(() => {
    if (selectedCategory) {
      loadQuestions(selectedCategory)
    }
  }, [selectedCategory])

  const loadCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("application_id", applicationId)
      .order("order_index", { ascending: true })

    if (data) {
      setCategories(data)
      if (data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0].id)
      }
    }
  }

  const loadQuestions = async (categoryId: string) => {
    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("category_id", categoryId)
      .order("order_index", { ascending: true })

    if (data) {
      setQuestions(data)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategory.title) return

    const { error } = await supabase.from("categories").insert({
      application_id: applicationId,
      title: newCategory.title,
      description: newCategory.description,
      order_index: categories.length,
    })

    if (!error) {
      setNewCategory({ title: "", description: "" })
      setIsCategoryDialogOpen(false)
      loadCategories()
    }
  }

  const handleCreateQuestion = async () => {
    if (!newQuestion.question_text || !selectedCategory) return

    const { error } = await supabase.from("questions").insert({
      category_id: selectedCategory,
      question_text: newQuestion.question_text,
      help_text: newQuestion.help_text,
      question_type: newQuestion.question_type,
      options: newQuestion.question_type === "multiple_choice" ? newQuestion.options : null,
      points: newQuestion.points,
      media_upload_config: {
        required: newQuestion.media_required,
        allowedTypes: ["application/pdf", "image/*"],
        maxSize: 5242880,
      },
      depends_on_question_id: newQuestion.depends_on_question_id,
      depends_on_answer: newQuestion.depends_on_answer || null,
      order_index: questions.length,
    })

    if (!error) {
      setNewQuestion({
        question_text: "",
        help_text: "",
        question_type: "multiple_choice",
        points: 10,
        options: [{ text: "Yes", value: "yes", points: 10, showUpload: false }],
        media_required: false,
        depends_on_question_id: null,
        depends_on_answer: "",
      })
      setIsQuestionDialogOpen(false)
      loadQuestions(selectedCategory)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category and all its questions?")) return

    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (!error) {
      loadCategories()
      if (selectedCategory === id) {
        setSelectedCategory(null)
      }
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return

    const { error } = await supabase.from("questions").delete().eq("id", id)

    if (!error && selectedCategory) {
      loadQuestions(selectedCategory)
    }
  }

  const addOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, { text: "", value: "", points: 0, showUpload: false }],
    })
  }

  const updateOption = (index: number, field: keyof QuestionOption, value: any) => {
    const updated = [...newQuestion.options]
    updated[index] = { ...updated[index], [field]: value }
    setNewQuestion({ ...newQuestion, options: updated })
  }

  const removeOption = (index: number) => {
    setNewQuestion({
      ...newQuestion,
      options: newQuestion.options.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{applicationTitle}</h2>
        <p className="text-muted-foreground">Manage categories and questions</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Categories Sidebar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Categories</CardTitle>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Category</DialogTitle>
                    <DialogDescription>Add a category to organize questions</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cat-title">Title</Label>
                      <Input
                        id="cat-title"
                        placeholder="e.g., Tax Documentation"
                        value={newCategory.title}
                        onChange={(e) => setNewCategory({ ...newCategory, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cat-desc">Description</Label>
                      <Textarea
                        id="cat-desc"
                        placeholder="Optional description..."
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleCreateCategory} className="w-full">
                      Create Category
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedCategory === cat.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4" />
                    <span className="font-medium text-sm">{cat.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCategory(cat.id)
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No categories yet</p>
            )}
          </CardContent>
        </Card>

        {/* Questions Panel */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Questions</CardTitle>
              {selectedCategory && (
                <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>New Question</DialogTitle>
                      <DialogDescription>Create a new question for this category</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="q-text">Question Text</Label>
                        <Textarea
                          id="q-text"
                          placeholder="Enter your question..."
                          value={newQuestion.question_text}
                          onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="q-help">Help Text (Optional)</Label>
                        <Input
                          id="q-help"
                          placeholder="Additional context or instructions..."
                          value={newQuestion.help_text}
                          onChange={(e) => setNewQuestion({ ...newQuestion, help_text: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="q-type">Question Type</Label>
                          <Select
                            value={newQuestion.question_type}
                            onValueChange={(value: any) => setNewQuestion({ ...newQuestion, question_type: value })}
                          >
                            <SelectTrigger id="q-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="text">Text Answer</SelectItem>
                              <SelectItem value="media_only">Media Upload Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="q-points">Points</Label>
                          <Input
                            id="q-points"
                            type="number"
                            value={newQuestion.points}
                            onChange={(e) =>
                              setNewQuestion({ ...newQuestion, points: Number.parseInt(e.target.value) || 0 })
                            }
                          />
                        </div>
                      </div>

                      {newQuestion.question_type === "multiple_choice" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Answer Options</Label>
                            <Button type="button" size="sm" variant="outline" onClick={addOption}>
                              <Plus className="w-3 h-3 mr-1" />
                              Add Option
                            </Button>
                          </div>
                          {newQuestion.options.map((opt, idx) => (
                            <div key={idx} className="flex gap-2 items-start p-3 border rounded-lg">
                              <div className="flex-1 space-y-2">
                                <Input
                                  placeholder="Option text"
                                  value={opt.text}
                                  onChange={(e) => updateOption(idx, "text", e.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Value"
                                    value={opt.value}
                                    onChange={(e) => updateOption(idx, "value", e.target.value)}
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Points"
                                    value={opt.points}
                                    onChange={(e) => updateOption(idx, "points", Number.parseInt(e.target.value) || 0)}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`show-upload-${idx}`}
                                    checked={opt.showUpload}
                                    onCheckedChange={(checked) => updateOption(idx, "showUpload", checked)}
                                  />
                                  <Label htmlFor={`show-upload-${idx}`} className="text-sm">
                                    Show upload button for this answer
                                  </Label>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOption(idx)}
                                disabled={newQuestion.options.length === 1}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="media-req"
                          checked={newQuestion.media_required}
                          onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, media_required: !!checked })}
                        />
                        <Label htmlFor="media-req">Require media upload</Label>
                      </div>

                      <div className="space-y-2">
                        <Label>Conditional Logic (Optional)</Label>
                        <Select
                          value={newQuestion.depends_on_question_id || "none"}
                          onValueChange={(value) =>
                            setNewQuestion({
                              ...newQuestion,
                              depends_on_question_id: value === "none" ? null : value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Depends on question..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No dependency</SelectItem>
                            {questions.map((q) => (
                              <SelectItem key={q.id} value={q.id}>
                                {q.question_text.substring(0, 50)}...
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {newQuestion.depends_on_question_id && (
                          <Input
                            placeholder="Required answer value"
                            value={newQuestion.depends_on_answer}
                            onChange={(e) => setNewQuestion({ ...newQuestion, depends_on_answer: e.target.value })}
                          />
                        )}
                      </div>

                      <Button onClick={handleCreateQuestion} className="w-full">
                        Create Question
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedCategory ? (
              <p className="text-sm text-muted-foreground text-center py-8">Select a category to view questions</p>
            ) : questions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No questions in this category yet</p>
            ) : (
              questions.map((q, idx) => (
                <Card key={q.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">Q{idx + 1}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {q.question_type.replace("_", " ")}
                          </span>
                          <span className="text-xs text-muted-foreground">{q.points} pts</span>
                        </div>
                        <CardTitle className="text-base">{q.question_text}</CardTitle>
                        {q.help_text && <CardDescription className="text-sm mt-1">{q.help_text}</CardDescription>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  {q.options && (
                    <CardContent className="pt-0">
                      <div className="space-y-1">
                        {(q.options as QuestionOption[]).map((opt, i) => (
                          <div key={i} className="text-sm flex items-center justify-between py-1">
                            <span>
                              • {opt.text} ({opt.points} pts)
                            </span>
                            {opt.showUpload && <span className="text-xs text-muted-foreground">Shows upload</span>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
