"use client"

import { ApolloClient, InMemoryCache, createHttpLink, from } from "@apollo/client"
import { setContext } from "@apollo/client/link/context"
import { onError } from "@apollo/client/link/error"
import { getToken } from "@/lib/auth/token"

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000/graphql",
})

// Auth link to add JWT token to requests
const authLink = setContext((_, { headers }) => {
  const token = getToken()
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  }
})

// Error link for handling GraphQL errors
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`)
    })
  }

  if (networkError) {
    console.error(`Network error: ${networkError}`)
  }
})

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
    },
    query: {
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
})

