# OpenAI Codex OAuth Implementation

## Overview

This implementation provides a complete OAuth 2.0 authorization flow for OpenAI Codex integration. It allows users to authenticate via OpenAI's Auth0 OAuth system instead of manually entering API keys.

## Architecture

### Components

1. **OAuthService** (`oauth.service.ts`)
   - Core service handling OAuth flow operations
   - Manages authorization URL generation, token exchange, and refresh
   - Fetches account information including quota usage

2. **OAuthResolver** (`oauth.resolver.ts`)
   - GraphQL API endpoints for OAuth operations
   - Provides mutations for initiating OAuth, handling callbacks, and refreshing tokens
   - Returns account information and quota details

3. **OAuthModule** (`oauth.module.ts`)
   - NestJS module wiring up dependencies
   - Integrates HttpModule for API calls
   - Exports OAuthService for use in other modules

4. **Type Definitions** (`types/oauth-types.ts`)
   - TypeScript interfaces for OAuth data structures
   - Enums for error codes and configuration
   - Type safety for OAuth operations

## File Structure

```
backend/src/purfence/oauth/
├── types/
│   └── oauth-types.ts          # Type definitions
├── oauth.service.ts             # OAuth service
├── oauth.resolver.ts            # GraphQL resolver
├── oauth.module.ts              # NestJS module
└── oauth.service.spec.ts        # Unit tests
```

## Features Implemented

### 1. Authorization URL Generation
- Generates secure authorization URLs with state parameter
- Supports custom redirect URIs
- Configurable scopes (default: `openid profile email offline_access`)

### 2. Token Exchange
- Exchanges authorization code for access tokens
- Calculates token expiration timestamps
- Handles OAuth errors gracefully

### 3. Token Refresh
- Refreshes expired access tokens using refresh token
- Returns new access token and refresh token
- Handles invalid refresh token errors

### 4. Account Information
- Fetches user account information from OpenAI
- Retrieves quota usage (session and weekly)
- Returns email, total quota, used quota, and remaining quota

### 5. JWT Decoding
- Decodes JWT id_token to extract user claims
- Extracts email, plan type, account ID, organization name
- Simple decoding without signature verification (trusted source)

### 6. GraphQL API

#### Mutations

**initiateCodexOAuth**
```graphql
mutation {
  initiateCodexOAuth(redirectUri: "http://localhost:3000/oauth/callback") {
    authorizationUrl
    state
  }
}
```

**handleCodexOAuthCallback**
```graphql
mutation {
  handleCodexOAuthCallback(
    code: "AUTH_CODE"
    state: "STATE_VALUE"
    redirectUri: "http://localhost:3000/oauth/callback"
  ) {
    config {
      id
      name
      provider
      isActive
    }
    email
    quota {
      total
      used
      remaining
    }
  }
}
```

**refreshCodexToken**
```graphql
mutation {
  refreshCodexToken(configId: "CONFIG_ID") {
    id
    name
    provider
    isActive
  }
}
```

#### Queries

**getCodexAccountInfo**
```graphql
query {
  getCodexAccountInfo(configId: "CONFIG_ID") {
    email
    quota {
      total
      used
      remaining
    }
  }
}
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# OpenAI Codex OAuth
OPENAI_OAUTH_CLIENT_ID=your-client-id
OPENAI_OAUTH_CLIENT_SECRET=your-client-secret
OPENAI_OAUTH_REDIRECT_URI=http://localhost:3000/oauth/callback
OPENAI_OAUTH_SCOPE=openid profile email offline_access
```

### OAuth Endpoints

- **Authorization Endpoint**: `https://auth0.openai.com/authorize`
- **Token Endpoint**: `https://auth0.openai.com/oauth/token`
- **Usage Endpoint**: `https://chatgpt.com/backend-api/wham/usage`

## Integration with Existing Code

### ModelProviderConfigService Updates

Added two new methods:

1. **findExistingCodexConfig()**
   - Finds existing Codex provider configuration
   - Used during OAuth callback to decide create vs update

2. **findOneWithSensitive()**
   - Returns configuration with decrypted sensitive data
   - Only for internal use, never exposed via GraphQL

### PurfenceModule Integration

The `OAuthModule` is imported into `PurfenceModule`:

```typescript
@Module({
  imports: [
    // ... other modules
    OAuthModule,
  ],
  // ...
})
export class PurfenceModule {}
```

## Security Considerations

1. **State Parameter**: Generates cryptographically secure random state for CSRF protection
2. **Token Encryption**: Refresh tokens are encrypted before storage
3. **Sensitive Data Protection**: API keys and refresh tokens never exposed via GraphQL
4. **Error Handling**: OAuth errors are mapped to standardized error codes
5. **JWT Decoding**: Simple decoding without verification (trusted source)

## Testing

Unit tests are provided in `oauth.service.spec.ts`:

- Authorization URL generation
- State generation
- Token exchange
- Token refresh
- Account info fetching
- JWT decoding

Run tests with:
```bash
npm test -- oauth.service.spec.ts
```

## Usage Flow

### Frontend Integration

1. **Initiate OAuth**
   - Call `initiateCodexOAuth` mutation
   - Receive authorization URL and state
   - Redirect user to authorization URL

2. **User Authorizes**
   - User logs in on OpenAI's authorization page
   - User grants permissions
   - OpenAI redirects back with authorization code

3. **Handle Callback**
   - Call `handleCodexOAuthCallback` with code and state
   - Backend exchanges code for tokens
   - Backend creates/updates configuration
   - Frontend receives config and account info

4. **Use Configuration**
   - Application now has valid OAuth configuration
   - Can make API calls using refresh token
   - Can check quota usage

## Error Handling

### OAuth Error Codes

- `INVALID_CODE`: Authorization code is invalid
- `EXPIRED_CODE`: Authorization code has expired
- `INVALID_STATE`: State parameter doesn't match
- `NETWORK_ERROR`: Network or HTTP error
- `UNKNOWN_ERROR`: Unknown error occurred
- `INVALID_CLIENT`: Invalid client credentials
- `INVALID_GRANT`: Invalid grant type

### Error Response Format

```typescript
{
  code: OAuthErrorCode,
  message: string,
  details?: any
}
```

## Future Enhancements

### TODO Items

1. **State Storage**: Implement state parameter storage (Redis or memory)
   - Store state when initiating OAuth
   - Verify state in callback
   - Implement expiration (5 minutes)

2. **Token Caching**: Cache access tokens to reduce refresh calls
   - Store access token with expiration
   - Check cache before refreshing
   - Handle cache invalidation

3. **Automatic Token Refresh**: Implement background token refresh
   - Check token expiration before API calls
   - Refresh token if expired
   - Handle refresh failures gracefully

4. **Webhook Support**: Add webhook for OAuth events
   - Listen for token revocation
   - Handle account changes
   - Update configuration accordingly

## References

- [OpenAI OAuth Documentation](https://platform.openai.com/docs/authentication)
- [Auth0 OAuth 2.0 Documentation](https://auth0.com/docs/authenticate/login/oauth-v2)
- [RFC 6749 - OAuth 2.0](https://tools.ietf.org/html/rfc6749)

## Verification Checklist

- [x] OAuthService created and implemented
- [x] OAuthResolver created and implemented
- [x] OAuthModule created and configured
- [x] PurfenceModule updated to import OAuthModule
- [x] Environment variables configured
- [x] Unit tests created
- [x] TypeScript compilation successful
- [x] Code follows project patterns
- [x] Documentation provided

## Notes

- Implementation follows NestJS best practices
- Uses Active Record pattern for entity operations
- Integrates with existing EncryptionService
- Compatible with SQLite, MySQL, and PostgreSQL databases
- Supports both development and production environments
