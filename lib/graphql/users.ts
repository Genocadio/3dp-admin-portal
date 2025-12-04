import { gql } from "@apollo/client"

/**
 * GraphQL query to fetch current user (me)
 */
export const ME_QUERY = gql`
  query Me {
    me {
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
 * GraphQL query to fetch all users
 */
export const USERS_QUERY = gql`
  query Users {
    users {
      name
      isActive
      id
      email
      createdAt
      phone
      organizationName
      role
      roleInOrganization
      updatedAt
    }
  }
`

/**
 * GraphQL mutation to activate a user
 */
export const ACTIVATE_USER_MUTATION = gql`
  mutation ActivateUser($userId: String!) {
    activateUser(userId: $userId) {
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
 * GraphQL mutation to deactivate a user
 */
export const DEACTIVATE_USER_MUTATION = gql`
  mutation DeactivateUser($userId: String!) {
    deactivateUser(userId: $userId) {
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
 * GraphQL mutation to delete a user
 */
export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($userId: ID!) {
    deleteUser(userId: $userId)
  }
`






