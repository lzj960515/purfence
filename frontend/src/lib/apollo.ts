import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  from,
} from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { getBackendBaseUrl } from './backend'

const httpLink = new HttpLink({
  uri: () => {
    const backendBaseUrl = getBackendBaseUrl()
    return backendBaseUrl ? `${backendBaseUrl}/graphql` : '/graphql'
  },
  // Avoid CORS issues in Tauri (tauri:// origin) unless we truly need cookies.
  credentials: 'same-origin',
})

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      // eslint-disable-next-line no-console
      console.error('[graphql error]', err)
    }
  }
  if (networkError) {
    // eslint-disable-next-line no-console
    console.error('[network error]', networkError)
  }
})

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: from([errorLink, httpLink]),
})
