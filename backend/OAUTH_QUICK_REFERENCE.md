# OAuth Service - Quick Reference Guide

## File Locations

All OAuth-related files are in:
```
backend/src/purfence/oauth/
├── types/oauth-types.ts          # Type definitions (167 lines)
├── oauth.service.ts              # Core service (429 lines)
├── oauth.resolver.ts             # GraphQL API (341 lines)
├── oauth.module.ts               # NestJS module (39 lines)
└── oauth.service.spec.ts         # Unit tests (301 lines)
```

## Key Types

### TokenResponse
```typescript
{
  access_token: string;
  refresh_token: string;
  expires_at: number;  // Unix timestamp
  token_type: 'Bearer';
  id_token?: string;
}
```

### AccountInfo
```typescript
{
  email: string;
  quota: {
    total: number;
    used: number;
    remaining: number;
  };
}
```

### CodexJWTClaims
```typescript
{
  email: string;
  email_verified: boolean;
  plan_type?: string;
  account_id?: string;
  user_id?: string;
  organization_name?: string;
}
```

## Service Methods

### OAuthService

#### `getAuthorizationUrl(params)`
Generate OAuth authorization URL
- **Input**: `{ state: string, redirectUri?: string }`
- **Returns**: `string` (authorization URL)

#### `handleCallback(params)`
Exchange authorization code for tokens
- **Input**: `{ code: string, state: string, redirectUri?: string }`
- **Returns**: `TokenResponse`

#### `refreshToken(params)`
Refresh access token
- **Input**: `{ refreshToken: string }`
- **Returns**: `TokenResponse`

#### `getAccountInfo(accessToken)`
Get account quota information
- **Input**: `string` (access token)
- **Returns**: `AccountInfo`

#### `decodeJWT(token)`
Decode JWT id_token
- **Input**: `string` (JWT token)
- **Returns**: `CodexJWTClaims`

#### `generateState()`
Generate random state parameter
- **Returns**: `string` (32-character hex string)

## GraphQL API

### Mutations

#### initiateCodexOAuth
```graphql
mutation InitiateOAuth($redirectUri: String!) {
  initiateCodexOAuth(redirectUri: $redirectUri) {
    authorizationUrl
    state
  }
}
```

#### handleCodexOAuthCallback
```graphql
mutation HandleCallback($code: String!, $state: String!, $redirectUri: String!) {
  handleCodexOAuthCallback(code: $code, state: $state, redirectUri: $redirectUri) {
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

#### refreshCodexToken
```graphql
mutation RefreshToken($configId: ID!) {
  refreshCodexToken(configId: $configId) {
    id
    name
    provider
    isActive
  }
}
```

### Queries

#### getCodexAccountInfo
```graphql
query GetAccountInfo($configId: ID!) {
  getCodexAccountInfo(configId: $configId) {
    email
    quota {
      total
      used
      remaining
    }
  }
}
```

## Environment Variables

Required in `.env`:
```bash
OPENAI_OAUTH_CLIENT_ID=your-client-id
OPENAI_OAUTH_CLIENT_SECRET=your-client-secret
OPENAI_OAUTH_REDIRECT_URI=http://localhost:3000/oauth/callback
OPENAI_OAUTH_SCOPE=openid profile email offline_access
```

## OAuth Endpoints

- **Authorization**: `https://auth0.openai.com/authorize`
- **Token**: `https://auth0.openai.com/oauth/token`
- **Usage**: `https://chatgpt.com/backend-api/wham/usage`

## Integration Points

### ModelProviderConfigService

Added methods:
```typescript
// Find existing Codex config
findExistingCodexConfig(): Promise<ModelProviderConfig | null>

// Get config with decrypted data (internal only)
findOneWithSensitive(id: string): Promise<ModelProviderConfig>
```

### PurfenceModule

Updated to import:
```typescript
import { OAuthModule } from './oauth/oauth.module';

@Module({
  imports: [
    // ...
    OAuthModule,
  ],
})
```

## Usage Example

### Frontend Flow

1. **Start OAuth**
```typescript
const { data } = await apolloClient.mutate({
  mutation: INITIATE_OAUTH_MUTATION,
  variables: { redirectUri: 'http://localhost:3000/oauth/callback' }
});

const { authorizationUrl, state } = data.initiateCodexOAuth;
window.location.href = authorizationUrl;
```

2. **Handle Callback**
```typescript
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

const { data } = await apolloClient.mutate({
  mutation: HANDLE_CALLBACK_MUTATION,
  variables: {
    code,
    state,
    redirectUri: 'http://localhost:3000/oauth/callback'
  }
});

console.log('Config created:', data.handleCodexOAuthCallback.config);
console.log('Email:', data.handleCodexOAuthCallback.email);
console.log('Quota:', data.handleCodexOAuthCallback.quota);
```

3. **Get Account Info**
```typescript
const { data } = await apolloClient.query({
  query: GET_ACCOUNT_INFO_QUERY,
  variables: { configId: 'config-id' }
});

console.log('Account:', data.getCodexAccountInfo);
```

## Error Handling

### OAuth Error Codes

```typescript
enum OAuthErrorCode {
  INVALID_CODE = 'invalid_code',
  EXPIRED_CODE = 'expired_code',
  INVALID_STATE = 'invalid_state',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error',
  INVALID_CLIENT = 'invalid_client',
  INVALID_GRANT = 'invalid_grant',
}
```

### Error Response

```typescript
{
  code: OAuthErrorCode,
  message: string,
  details?: any
}
```

## Testing

Run unit tests:
```bash
npm test -- oauth.service.spec.ts
```

Run with coverage:
```bash
npm test -- --coverage oauth.service.spec.ts
```

## Security Notes

1. **State Parameter**: Always generate and verify state parameter
2. **Token Encryption**: Refresh tokens encrypted before storage
3. **Sensitive Data**: Never expose tokens via GraphQL
4. **HTTPS Required**: Use HTTPS in production for redirect URIs
5. **Token Storage**: Store state temporarily with expiration (TODO)

## Troubleshooting

### Common Issues

**Issue**: Invalid state error
- **Solution**: Ensure state is stored and verified in callback

**Issue**: Token refresh fails
- **Solution**: Check if refresh token is still valid

**Issue**: Quota info not available
- **Solution**: Check if access token is valid and not expired

**Issue**: Authorization URL not working
- **Solution**: Verify client ID and redirect URI configuration

## Build Verification

```bash
cd backend
npm run build
```

Expected output: No errors, successful build.

## Next Steps

- Implement state parameter storage (Redis/memory)
- Add access token caching
- Implement automatic token refresh
- Add webhook support for OAuth events
- Create frontend integration examples
