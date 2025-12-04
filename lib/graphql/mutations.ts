import { gql } from "@apollo/client"

/**
 * GraphQL mutation for user registration
 */
export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        name
        organizationName
        phone
        role
        roleInOrganization
        isActive
        createdAt
        updatedAt
      }
    }
  }
`

/**
 * GraphQL mutation for user login
 */
export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        name
        organizationName
        phone
        role
        roleInOrganization
        isActive
        createdAt
        updatedAt
      }
    }
  }
`

/**
 * GraphQL mutation for changing user password
 */
export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`

/**
 * GraphQL mutation for updating user profile
 */
export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateUserProfileInput!) {
    updateProfile(input: $input) {
      id
      email
      name
      organizationName
      phone
      role
      roleInOrganization
      isActive
      createdAt
      updatedAt
    }
  }
`

/**
 * GraphQL mutation for requesting password reset code
 */
export const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
    requestPasswordReset(input: $input)
  }
`

/**
 * GraphQL mutation for resetting password with code
 */
export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input)
  }
`

