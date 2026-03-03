/**
 * OAuth Callback Handler Server
 *
 * This is a lightweight Express server that runs on port 1455
 * to handle OAuth callbacks from OpenAI.
 *
 * It receives the callback, extracts code/state, calls the main backend,
 * and redirects the user to the frontend completion page.
 */

import express from 'express';

const PORT = 1455;
const MAIN_BACKEND = 'http://localhost:1016';
const FRONTEND_URL = 'http://localhost:5173';

const app = express();

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Handle OAuth callback from OpenAI
 * GET /auth/callback?code=xxx&state=xxx
 */
app.get('/auth/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  // Type cast query parameters to string
  const codeStr = String(Array.isArray(code) ? code[0] : code || '');
  const stateStr = String(Array.isArray(state) ? state[0] : state || '');
  const errorStr = error
    ? String(Array.isArray(error) ? error[0] : error)
    : undefined;
  const errorDescStr = error_description
    ? String(
        Array.isArray(error_description)
          ? error_description[0]
          : error_description,
      )
    : undefined;

  console.log('[OAuth Callback] Received:', {
    code: codeStr ? `${codeStr.substring(0, 10)}...` : null,
    state: stateStr,
    error: errorStr,
    timestamp: new Date().toISOString(),
  });

  // Handle OAuth errors
  if (errorStr) {
    console.error('[OAuth Callback] Error:', errorStr, errorDescStr);
    return res.redirect(
      `${FRONTEND_URL}/settings/providers?error=${encodeURIComponent(errorDescStr || errorStr)}`,
    );
  }

  // Validate required parameters
  if (!codeStr || !stateStr) {
    console.error('[OAuth Callback] Missing parameters');
    return res.redirect(
      `${FRONTEND_URL}/settings/providers?error=${encodeURIComponent('Missing required parameters')}`,
    );
  }

  try {
    // Log the GraphQL request for debugging
    const graphqlRequest = {
      query: `
        mutation HandleCodexOAuthCallback($code: String!, $state: String!, $redirectUri: String!) {
          handleCodexOAuthCallback(code: $code, state: $state, redirectUri: $redirectUri) {
            config {
              id
              name
            }
            email
            quota {
              total
              used
              remaining
            }
          }
        }
      `,
      variables: {
        code: codeStr,
        state: stateStr,
        redirectUri: `http://localhost:1455/auth/callback`,
      },
    };
    console.log(
      '[OAuth Callback] Sending GraphQL request to:',
      `${MAIN_BACKEND}/graphql`,
    );
    console.log('[OAuth Callback] Request variables:', {
      code: codeStr ? `${codeStr.substring(0, 10)}...` : null,
      state: stateStr,
      redirectUri: graphqlRequest.variables.redirectUri,
    });

    // Call main backend to complete OAuth flow
    const response = await fetch(`${MAIN_BACKEND}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphqlRequest),
    });

    console.log(
      '[OAuth Callback] Response status:',
      response.status,
      response.statusText,
    );
    const result = await response.json();
    console.log(
      '[OAuth Callback] Full response:',
      JSON.stringify(result, null, 2),
    );

    if (result.errors) {
      console.error(
        '[OAuth Callback] Backend error:',
        JSON.stringify(result.errors, null, 2),
      );
      // Try to get more detailed error info
      const errorDetail = result.errors[0];
      console.error('[OAuth Callback] Error detail:', {
        message: errorDetail.message,
        extensions: errorDetail.extensions,
        path: errorDetail.path,
      });
      throw new Error(result.errors[0].message);
    }

    const data = result.data?.handleCodexOAuthCallback;
    if (!data) {
      throw new Error('No data returned from backend');
    }

    console.log('[OAuth Callback] Success:', {
      email: data.email,
      quota: data.quota,
      timestamp: new Date().toISOString(),
    });

    // Redirect to frontend with success
    res.redirect(
      `${FRONTEND_URL}/settings/providers?success=true&email=${encodeURIComponent(data.email)}`,
    );
  } catch (err) {
    console.error('[OAuth Callback] Failed:', err);
    res.redirect(
      `${FRONTEND_URL}/settings/providers?error=${encodeURIComponent(`OAuth failed: ${err}`)}`,
    );
  }
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'oauth-callback-handler', port: PORT });
});

// Start server
app.listen(PORT, () => {
  console.log(`[OAuth Callback Handler] Listening on port ${PORT}`);
  console.log(`[OAuth Callback Handler] Main backend: ${MAIN_BACKEND}`);
  console.log(`[OAuth Callback Handler] Frontend: ${FRONTEND_URL}`);
  console.log(
    `[OAuth Callback Handler] OAuth endpoint: http://localhost:${PORT}/auth/callback`,
  );
});
