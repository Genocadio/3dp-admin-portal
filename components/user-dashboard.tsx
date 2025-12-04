"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { getUserData } from "@/lib/auth/token"
import type { Profile } from "@/lib/types"
import { ProfileAvatarMenu } from "./profile-avatar-menu"
import { EvaluationsList } from "./evaluations-list"
import { EvaluationFormAnswer } from "./evaluation-form-answer"
import { MySubmissionsList } from "./my-submissions-list"
import { UserSubmissionView } from "./user-submission-view"
import type { EvaluationForm, Answer } from "@/lib/graphql/types"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users } from "lucide-react"

type UserDashboardProps = {
  user: Profile
}

const DASHBOARD_TAB_STORAGE_KEY = "dashboard-selected-tab"

export function UserDashboard({ user }: UserDashboardProps) {
  const [evaluatingForm, setEvaluatingForm] = useState<EvaluationForm | null>(null)
  const [viewingSubmission, setViewingSubmission] = useState<Answer | null>(null)
  const [activeTab, setActiveTab] = useState<string>("available")

  // Load persisted tab from localStorage on mount
  useEffect(() => {
    const savedTab = localStorage.getItem(DASHBOARD_TAB_STORAGE_KEY)
    if (savedTab === "available" || savedTab === "submissions") {
      setActiveTab(savedTab)
    }
  }, [])

  // Save tab to localStorage when it changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    localStorage.setItem(DASHBOARD_TAB_STORAGE_KEY, value)
  }

  // Check if user is admin
  const isAdmin = () => {
    const userData = getUserData()
    if (userData) {
      const userRole = userData.role?.toUpperCase()
      return userRole === "ADMIN"
    }
    return false
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/loggo.webp" alt="3DP Logo" width={50} height={50} className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user.full_name || user.email}</h1>
              <p className="text-sm text-muted-foreground">View and evaluate forms</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin() && (
              <Link href="/admin#users">
                <Button variant="outline" className="gap-2">
                  <Users className="w-4 h-4" />
                  User Management
                </Button>
              </Link>
            )}
            <ProfileAvatarMenu />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 w-full">
        {evaluatingForm ? (
          <EvaluationFormAnswer
            evaluationForm={evaluatingForm}
            onBack={() => setEvaluatingForm(null)}
          />
        ) : viewingSubmission ? (
          <UserSubmissionView
            submission={viewingSubmission}
            onBack={() => setViewingSubmission(null)}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="available">Available Evaluations</TabsTrigger>
                <TabsTrigger value="submissions">My Submissions</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="available" className="mt-0">
              <EvaluationsList onEvaluate={(form) => setEvaluatingForm(form)} />
            </TabsContent>

            <TabsContent value="submissions" className="mt-0">
              <MySubmissionsList onViewSubmission={(submission) => setViewingSubmission(submission)} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
