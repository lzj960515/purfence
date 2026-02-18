import { gql } from '@apollo/client';

/**
 * Initiate Codex OAuth authorization
 * Returns the authorization URL to open in browser
 */
export const INITIATE_CODEX_OAUTH = gql`
  mutation InitiateCodexOAuth($redirectUri: String!) {
    initiateCodexOAuth(redirectUri: $redirectUri) {
      authorizationUrl
      state
    }
  }
`;

/**
 * Handle OAuth callback from Codex
 * Exchanges authorization code for OAuth payload and account info
 */
export const HANDLE_CODEX_OAUTH_CALLBACK = gql`
  mutation HandleCodexOAuthCallback(
    $code: String!
    $state: String!
    $redirectUri: String!
  ) {
    handleCodexOAuthCallback(
      code: $code
      state: $state
      redirectUri: $redirectUri
    ) {
      email
      quota {
        total
        used
        remaining
      }
      oauthInfo {
        accessToken
        refreshToken
        idToken
        tokenType
        scope
        expiresAt
        accountId
      }
    }
  }
`;

/**
 * Refresh Codex token
 * Uses refresh token to get new access token
 */
export const REFRESH_CODEX_TOKEN = gql`
  mutation RefreshCodexToken($configId: ID!) {
    refreshCodexToken(configId: $configId) {
      id
      name
      provider
      isActive
      createdAt
      updatedAt
    }
  }
`;
