import { gql } from "@apollo/client"

/**
 * GraphQL query to fetch all evaluation forms
 */
export const EVALUATION_FORMS_QUERY = gql`
  query EvaluationForms {
    evaluationForms {
      id
      title
      description
      createdAt
      updatedAt
      createdById
      sections {
        id
        title
        description
        order
        evaluationFormId
        createdAt
        updatedAt
        questions {
          id
          text
          type
          description
          instructions
          maxScore
          fileType
          order
          sectionId
          createdAt
          updatedAt
          media {
            id
            order
            url
            questionId
          }
          options {
            id
            text
            isCorrect
            order
            questionId
          }
          dependencies {
            id
            questionId
            dependsOnQuestionId
            type
            value
          }
        }
      }
    }
  }
`

/**
 * GraphQL mutation to create a new evaluation form
 */
export const CREATE_EVALUATION_FORM_MUTATION = gql`
  mutation CreateEvaluationForm($input: CreateEvaluationFormInput!) {
    createEvaluationForm(input: $input) {
      id
      title
      description
      createdAt
      updatedAt
      sections {
        id
        title
        description
        order
        evaluationFormId
        createdAt
        updatedAt
        questions {
          id
          text
          type
          description
          instructions
          maxScore
          fileType
          order
          sectionId
          createdAt
          updatedAt
          options {
            id
            text
            isCorrect
            order
            questionId
          }
          dependencies {
            id
            dependsOnQuestionId
            questionId
            type
            value
          }
          media {
            id
            url
            order
            questionId
          }
        }
      }
    }
  }
`

/**
 * GraphQL mutation to update an existing evaluation form
 */
export const UPDATE_EVALUATION_FORM_MUTATION = gql`
  mutation UpdateEvaluationForm($updateEvaluationFormId: ID!, $input: UpdateEvaluationFormInput!) {
    updateEvaluationForm(id: $updateEvaluationFormId, input: $input) {
      id
      title
      description
      createdAt
      updatedAt
      createdById
      sections {
        id
        title
        description
        order
        evaluationFormId
        createdAt
        updatedAt
        questions {
          id
          text
          type
          description
          instructions
          maxScore
          fileType
          order
          sectionId
          createdAt
          updatedAt
          options {
            id
            text
            isCorrect
            order
            questionId
          }
          dependencies {
            id
            dependsOnQuestionId
            questionId
            type
            value
          }
          media {
            id
            url
            order
            questionId
          }
        }
      }
    }
  }
`

/**
 * GraphQL query to get user's answer for an evaluation form
 */
export const ANSWER_BY_EVALUATION_FORM_QUERY = gql`
  query AnswerByEvaluationForm($evaluationFormId: ID!) {
    answerByEvaluationForm(evaluationFormId: $evaluationFormId) {
      id
      userId
      evaluationFormId
      status
      createdAt
      updatedAt
      questionAnswers {
        id
        answerId
        questionId
        textAnswer
        selectedOptionId
        selectedOptionIds
        fileUploadUrl
        createdAt
        updatedAt
      }
    }
  }
`

/**
 * GraphQL mutation to create an answer for an evaluation form
 */
export const CREATE_ANSWER_MUTATION = gql`
  mutation CreateAnswer($input: CreateAnswerInput!) {
    createAnswer(input: $input) {
      id
      userId
      evaluationFormId
      status
      createdAt
      updatedAt
      questionAnswers {
        id
        answerId
        questionId
        textAnswer
        selectedOptionId
        selectedOptionIds
        fileUploadUrl
        createdAt
        updatedAt
      }
    }
  }
`

/**
 * GraphQL query to get all answers with reviews
 */
export const ALL_ANSWERS_QUERY = gql`
  query AllAnswers {
    allAnswers {
      id
      status
      createdAt
      updatedAt
      evaluationForm {
        id
        title
        description
        __typename
      }
      review {
        id
        status
        notes
        unansweredQuestionIds
        totalScore
        createdAt
        updatedAt
        __typename
        questionReviews {
          createdAt
          id
          manualNotes
          manualReviewResult
          maxScore
          questionAnswerId
          questionId
          reviewId
          reviewType
          updatedAt
          userScore
        }
      }
      __typename
    }
  }
`

/**
 * GraphQL query to get detailed answer with evaluation form
 */
export const ANSWER_QUERY = gql`
  query Answer($answerId: ID!) {
    answer(id: $answerId) {
      id
      userId
      evaluationFormId
      status
      createdAt
      updatedAt
      questionAnswers {
        id
        answerId
        questionId
        textAnswer
        selectedOptionId
        selectedOptionIds
        fileUploadUrl
        createdAt
        updatedAt
      }
      evaluationForm {
        id
        title
        description
        createdAt
        updatedAt
        createdById
        sections {
          id
          title
          description
          order
          evaluationFormId
          createdAt
          updatedAt
          questions {
            id
            text
            type
            description
            maxScore
            fileType
            order
            sectionId
            createdAt
            updatedAt
            options {
              id
              text
              isCorrect
              order
              questionId
            }
            dependencies {
              id
              questionId
              dependsOnQuestionId
              type
              value
            }
          }
        }
      }
      review {
        id
        answerId
        status
        notes
        totalScore
        unansweredQuestionIds
        createdAt
        updatedAt
        questionReviews {
          id
          reviewId
          questionAnswerId
          questionId
          reviewType
          userScore
          maxScore
          manualReviewResult
          manualNotes
          createdAt
          updatedAt
        }
      }
    }
  }
`

/**
 * GraphQL mutation to review an answer
 */
export const REVIEW_ANSWER_MUTATION = gql`
  mutation ReviewAnswer($answerId: ID!, $input: ReviewAnswerInput!) {
    reviewAnswer(answerId: $answerId, input: $input) {
      id
      answerId
      status
      notes
      totalScore
      unansweredQuestionIds
      createdAt
      updatedAt
      questionReviews {
        id
        reviewId
        questionAnswerId
        questionId
        reviewType
        userScore
        maxScore
        manualReviewResult
        manualNotes
        createdAt
        updatedAt
      }
    }
  }
`

/**
 * GraphQL query to get dashboard statistics
 */
export const DASHBOARD_STATS_QUERY = gql`
  query DashboardStats {
    dashboardStats {
      totalEvaluationCount
      totalReviewsCount
      totalSubmissionsCount
      unreviewedSubmissions {
        id
        updatedAt
        createdAt
      }
      incompleteReviews {
        id
        createdAt
        notes
        status
      }
    }
  }
`

/**
 * GraphQL mutation to delete an answer
 */
export const DELETE_ANSWER_MUTATION = gql`
  mutation DeleteAnswer($deleteAnswerId: ID!) {
    deleteAnswer(id: $deleteAnswerId)
  }
`

/**
 * GraphQL mutation to delete an evaluation form
 */
export const DELETE_EVALUATION_FORM_MUTATION = gql`
  mutation DeleteEvaluationForm($deleteEvaluationFormId: ID!) {
    deleteEvaluationForm(id: $deleteEvaluationFormId) {
      answerIds
      message
      success
    }
  }
`

/**
 * GraphQL query to get current user's answers
 */
export const MY_ANSWERS_QUERY = gql`
  query MyAnswers {
    myAnswers {
      id
      createdAt
      updatedAt
      status
      review {
        id
        status
        totalScore
        notes
        createdAt
        updatedAt
        questionReviews {
          manualNotes
          manualReviewResult
          maxScore
          reviewType
          userScore
          id
          createdAt
          updatedAt
        }
      }
      evaluationForm {
        id
        description
        title
        createdAt
        updatedAt
        sections {
          description
          evaluationFormId
          id
          order
          createdAt
          updatedAt
          questions {
            createdAt
            description
            fileType
            id
            instructions
            maxScore
            options {
              id
              isCorrect
              order
              questionId
              text
            }
            order
            sectionId
            text
            type
            updatedAt
            dependencies {
              dependsOnQuestionId
              id
              questionId
              type
              value
            }
          }
        }
      }
      questionAnswers {
        answerId
        createdAt
        fileUploadUrl
        id
        questionId
        selectedOptionId
        selectedOptionIds
        textAnswer
        updatedAt
      }
    }
  }
`
