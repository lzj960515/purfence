import Anthropic from '@anthropic-ai/sdk';
import { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import AnthropicVertex from '@anthropic-ai/vertex-sdk';
import { Logger } from '@nestjs/common';
import { GoogleAuth } from 'google-auth-library';
import { HttpsProxyAgent } from 'hpagent';

const logger = new Logger();

const anthropic = new Anthropic();

function getProxyGoogleAuth() {
  const proxy = process.env.GOOGLE_AUTH_HTTPS_PROXY;
  if (proxy) {
    const agent = new HttpsProxyAgent({ proxy });
    return new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
      clientOptions: { transporterOptions: { agent } },
    });
  }
}
const vertexClient = new AnthropicVertex({
  projectId: 'pietra-ai',
  region: 'global',
  googleAuth: getProxyGoogleAuth() as any,
  defaultHeaders: { 'anthropic-beta': 'web-search-2025-03-05' },
});

describe('Web Search', () => {
  it('test anthropic web search', async () => {
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'New York weather?',
          },
        ],
      },
    ] as MessageParam[];

    const msg1 = await ask(messages);
    console.log(msg1);

    messages.push({
      role: 'assistant',
      content: msg1.content,
    });

    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'What about San Francisco?',
        },
      ],
    });
    const msg2 = await ask(messages);

    console.log(msg2);
  });

  async function ask(messages: MessageParam[]) {
    return await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      messages,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 3,
        },
      ],
      tool_choice: {
        type: 'auto',
      },
    });
  }

  it('test vertex anthropic web search', async () => {
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'New York weather?',
          },
        ],
      },
    ] as MessageParam[];

    const msg1 = await askVertex(messages);
    console.log(msg1);

    messages.push({
      role: 'assistant',
      content: msg1.content,
    });

    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'What about San Francisco?',
        },
      ],
    });
    const msg2 = await askVertex(messages);

    console.log(msg2);
  });

  async function askVertex(messages: MessageParam[]) {
    return await vertexClient.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      messages,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 3,
        },
      ],
      tool_choice: {
        type: 'auto',
      },
    });
  }
});
