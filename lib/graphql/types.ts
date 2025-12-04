/**
 * GraphQL TypeScript types matching the backend schema
 */

export enum UserRole {
  USER = "user",
  ADMIN = "ADMIN",
}

export interface RegisterInput {
  email: string
  name: string
  organizationName?: string | null
  password: string
  phone?: string | null
  role?: string | null
  roleInOrganization?: string | null
}

export interface UserResponse {
  id: string
  email: string
  name: string
  organizationName?: string | null
  phone?: string | null
  role: UserRole
  roleInOrganization?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RegisterResponse {
  token: string
  user: UserResponse
}

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: UserResponse
}

/**
 * User Management Types
 */

export interface User {
  id: string
  email: string
  name: string
  organizationName?: string | null
  phone?: string | null
  role: UserRole
  roleInOrganization?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ActivateUserResponse {
  id: string
  email: string
  name: string
  organizationName?: string | null
  phone?: string | null
  role: UserRole
  roleInOrganization?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DeactivateUserResponse {
  id: string
  email: string
  name: string
  organizationName?: string | null
  phone?: string | null
  role: UserRole
  roleInOrganization?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Evaluation Form Types
 */

export interface QuestionMedia {
  id: string
  order: number | null
  url: string | null
  questionId: string
}

export interface QuestionOption {
  id: string
  isCorrect: boolean | null
  order: number | null
  questionId: string
  text: string | null
}

export interface QuestionDependency {
  id: string
  dependsOnQuestionId: string | null
  questionId: string
  value: string | string[] | null
  type: string | null
}

export interface Question {
  id: string
  fileType: string | null
  description: string | null
  media: QuestionMedia[]
  maxScore: number | null
  instructions: string | null
  sectionId: string
  text: string | null
  type: string | null
  options: QuestionOption[]
  dependencies: QuestionDependency[]
}

export interface Section {
  createdAt: string
  description: string | null
  evaluationFormId: string
  id: string
  order: number | null
  questions: Question[]
  title: string | null
  updatedAt: string
}

export interface EvaluationForm {
  id: string
  description: string | null
  title: string | null
  sections: Section[]
}

/**
 * Create Evaluation Form Input Types
 */

export interface CreateQuestionMediaInput {
  order: number | null
  url: string | null
}

export interface CreateQuestionOptionInput {
  id: string | null
  isCorrect: boolean | null
  order: number | null
  text: string | null
}

// Internal type for form state (value can be string for input)
export interface CreateQuestionDependencyInputForm {
  dependsOnQuestionId: string | null
  type: string | null
  value: string | string[] | null
}

// Type for GraphQL mutation (matches schema)
export interface CreateQuestionDependencyInput {
  dependsOnQuestionId: string
  type: string
  value: string[]
}

export interface CreateQuestionInput {
  dependencies: CreateQuestionDependencyInput[]
  description: string | null
  fileType: string | null
  id: string | null
  instructions: string | null
  maxScore: number | null
  media: CreateQuestionMediaInput[]
  options: CreateQuestionOptionInput[]
  order: number | null
  text: string | null
  type: string | null
}

export interface CreateSectionInput {
  title: string | null
  description: string | null
  id: string | null
  order: number | null
  questions: CreateQuestionInput[]
}

export interface CreateEvaluationFormInput {
  title: string
  description: string | null
  sections: CreateSectionInput[]
}

export interface CreateEvaluationFormResponse {
  id: string
  description: string | null
  createdAt: string
  title: string | null
  sections: Section[]
}

/**
 * Update Evaluation Form Input Types
 */

export interface UpdateEvaluationFormInput {
  title?: string | null
  description?: string | null
  sections?: CreateSectionInput[] | null
}

/**
 * Answer Types
 */
export enum AnswerStatus {
  PENDING = "PENDING",
  INPROGRESS = "INPROGRESS",
  EVALUATED = "EVALUATED",
  AUTO = "AUTO",
  COMPLETE = "COMPLETE",
}

export enum ReviewStatus {
  AUTO = "AUTO",
  COMPLETE = "COMPLETE",
}

export enum ReviewType {
  AUTO = "AUTO",
  MANUAL = "MANUAL",
}

export enum ManualReviewResult {
  CORRECT = "CORRECT",
  PARTIALLY_CORRECT = "PARTIALLY_CORRECT",
  INCORRECT = "INCORRECT",
  VALID = "VALID",
  INVALID = "INVALID",
}

export interface QuestionAnswer {
  id: string
  answerId: string
  questionId: string
  textAnswer?: string | null
  selectedOptionId?: string | null
  selectedOptionIds?: string[] | null
  fileUploadUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface QuestionReview {
  id: string
  reviewId: string
  questionAnswerId: string
  questionId: string
  reviewType: string
  userScore: number
  maxScore: number
  manualReviewResult?: ManualReviewResult | null
  manualNotes?: string | null
  createdAt: string
  updatedAt: string
}

export interface Review {
  id: string
  answerId: string
  status: ReviewStatus
  notes?: string | null
  unansweredQuestionIds: string[]
  totalScore?: number | null
  questionReviews: QuestionReview[]
  createdAt: string
  updatedAt: string
}

export interface Answer {
  id: string
  userId: string
  evaluationFormId: string
  status: AnswerStatus
  questionAnswers: QuestionAnswer[]
  evaluationForm?: EvaluationForm | null
  review?: Review | null
  createdAt: string
  updatedAt: string
}

export interface QuestionAnswerInput {
  questionId: string
  textAnswer?: string | null
  selectedOptionId?: string | null
  selectedOptionIds?: string[] | null
  fileUploadUrl?: string | null
}

export interface CreateAnswerInput {
  evaluationFormId: string
  questionAnswers: QuestionAnswerInput[]
  status?: AnswerStatus
}

export interface QuestionReviewInput {
  questionAnswerId: string
  questionId: string
  questionReviewId?: string | null
  manualReviewResult?: ManualReviewResult | null
  manualNotes?: string | null
  userScore: number
}

// Input type for question review in the mutation
export interface QuestionReviewMutationInput {
  notes?: string | null
  questionReviewId?: string | null
  result?: ManualReviewResult | null
}

export interface ReviewAnswerInput {
  notes?: string | null
  questionReviews: QuestionReviewMutationInput[]
}

/**
 * Dashboard Statistics Types
 */
export interface UnreviewedSubmission {
  id: string
  updatedAt: string
  createdAt: string
}

export interface IncompleteReview {
  id: string
  createdAt: string
  notes?: string | null
  status: string
}

export interface DashboardStats {
  totalEvaluationCount: number
  totalReviewsCount: number
  totalSubmissionsCount: number
  unreviewedSubmissions: UnreviewedSubmission[]
  incompleteReviews: IncompleteReview[]
}

