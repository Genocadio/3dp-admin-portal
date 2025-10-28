export type Profile = {
  id: string
  email: string
  full_name: string | null
  role: "user" | "admin"
  organisation_name: string | null
  user_role: "manager" | "ceo" | "accountant" | "other"
  phone_number: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type AdminUser = {
  id: string
  email: string
  full_name: string
  created_at: string
  updated_at: string
}

export type Application = {
  id: string
  title: string
  description: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  application_id: string
  title: string
  description: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export type QuestionOption = {
  text: string
  value: string
  points: number
  showUpload?: boolean
}

export type MediaUploadConfig = {
  required: boolean
  allowedTypes: string[]
  maxSize: number
}

export type Question = {
  id: string
  category_id: string
  question_text: string
  help_text: string | null
  question_type: "multiple_choice" | "text" | "media_only"
  options: QuestionOption[] | null
  points: number
  media_upload_config: MediaUploadConfig
  depends_on_question_id: string | null
  depends_on_answer: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export type Submission = {
  id: string
  application_id: string
  user_id: string
  status: "pending" | "under_review" | "approved" | "rejected"
  total_score: number
  max_score: number
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  review_notes: string | null
  created_at: string
  updated_at: string
}

export type SubmissionAnswer = {
  id: string
  submission_id: string
  question_id: string
  answer_text: string | null
  answer_value: string | null
  points_earned: number
  created_at: string
  updated_at: string
}

export type SubmissionMedia = {
  id: string
  submission_id: string
  question_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  uploaded_at: string
}

// Extended types with joined data
export type QuestionWithCategory = Question & {
  category: Category
}

export type SubmissionWithDetails = Submission & {
  application: Application
  user: Profile
  answers: (SubmissionAnswer & { question: Question })[]
  media: SubmissionMedia[]
  reviewer?: Profile
}

export type ApplicationWithStats = Application & {
  categories_count: number
  questions_count: number
  submissions_count: number
}
