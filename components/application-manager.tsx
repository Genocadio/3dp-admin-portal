"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, FolderOpen, Settings, Trash2 } from "lucide-react"
import type { Application } from "@/lib/types"
import { CategoryQuestionManager } from "@/components/category-question-manager"

type ApplicationManagerProps = {
  userId: string
}

export function ApplicationManager({ userId }: ApplicationManagerProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newApp, setNewApp] = useState({ title: "", description: "" })

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    // Using dummy data instead of Supabase
    const dummyApplications: Application[] = [
      {
        id: "1",
        title: "Sample Application 1",
        description: "This is a sample application for testing",
        is_active: true,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        title: "Sample Application 2",
        description: "Another sample application",
        is_active: false,
        created_by: userId,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]
    setApplications(dummyApplications)
  }

  const handleCreateApplication = async () => {
    if (!newApp.title) return

    // Using dummy data instead of Supabase
    // In a real implementation, this would call a GraphQL mutation
    const newApplication: Application = {
      id: Date.now().toString(),
      title: newApp.title,
      description: newApp.description,
      created_by: userId,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setApplications([newApplication, ...applications])
    setNewApp({ title: "", description: "" })
    setIsCreateOpen(false)
    console.log("Application created (dummy data - GraphQL mutation needed):", newApplication)
  }

  const handleDeleteApplication = async (id: string) => {
    if (!confirm("Are you sure? This will delete all categories, questions, and submissions.")) return

    // Using dummy data instead of Supabase
    setApplications(applications.filter((app) => app.id !== id))
    if (selectedApp?.id === id) {
      setSelectedApp(null)
    }
    console.log("Application deleted (dummy data - GraphQL mutation needed):", id)
  }

  const handleToggleActive = async (app: Application) => {
    // Using dummy data instead of Supabase
    setApplications(
      applications.map((a) => (a.id === app.id ? { ...a, is_active: !a.is_active, updated_at: new Date().toISOString() } : a)),
    )
    console.log("Application toggled (dummy data - GraphQL mutation needed):", app.id, !app.is_active)
  }

  if (selectedApp) {
    return (
      <div>
        <Button variant="outline" onClick={() => setSelectedApp(null)} className="mb-4">
          ← Back to Applications
        </Button>
        <CategoryQuestionManager applicationId={selectedApp.id} applicationTitle={selectedApp.title} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Applications</h2>
          <p className="text-muted-foreground">Manage your application forms</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Application</DialogTitle>
              <DialogDescription>Add a new application form for users to complete</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Tax Compliance Evaluation"
                  value={newApp.title}
                  onChange={(e) => setNewApp({ ...newApp, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this application is for..."
                  value={newApp.description}
                  onChange={(e) => setNewApp({ ...newApp, description: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateApplication} className="w-full">
                Create Application
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {applications.map((app) => (
          <Card key={app.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <FolderOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(app)}
                    title={app.is_active ? "Deactivate" : "Activate"}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteApplication(app.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <CardTitle>{app.title}</CardTitle>
              <CardDescription>{app.description || "No description"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${app.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                >
                  {app.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <Button onClick={() => setSelectedApp(app)} className="w-full">
                Manage Content
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {applications.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No applications yet</p>
            <Button onClick={() => setIsCreateOpen(true)}>Create Your First Application</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
