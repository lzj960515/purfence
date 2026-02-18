import type { MyAgentModuleOptions } from '@app/my-agent';
import { registerAs } from '@nestjs/config';
import _ from 'lodash';

function isJsonString(str: string) {
  try {
    JSON.parse(str);
  } catch {
    return false;
  }
  return true;
}

function getMcpServersFromEnv() {
  const MCP_ENV_PREFIX = 'MY_AGENT_MCP_SERVERS_';
  return _.chain(process.env)
    .entries()
    .filter(([k, v]) => k.startsWith(MCP_ENV_PREFIX) && isJsonString(v))
    .map(([k, v]) => [k.replace(MCP_ENV_PREFIX, ''), JSON.parse(v)])
    .fromPairs()
    .value();
}

export default registerAs('my-agent', () => {
  return {
    // 开启这个header，可以在输出中实时看到 tool input， 无须等待tool input全部完成： https://ai-sdk.dev/providers/ai-sdk-providers/anthropic#for-tool-input-streaming-with-streamtext
    // headers: {
    //   'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14',
    // },
    // 开启web search 试了一下，开了对openai的模型调用不影响
    headers: { 'anthropic-beta': 'web-search-2025-03-05' },
    models: {
      openai: {
        reasoningSummary: 'auto',
      },
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 3200 },
      },
    },
    toolKits: [
      {
        name: 'shopify-dev',
        description: 'Shopify GraphQL docs and validator',
      },
    ],
    mcpServers: {
      ...getMcpServersFromEnv(),
      // 'shopify-dev': {
      //   type: 'stdio',
      //   command: 'npx',
      //   args: ['-y', '@shopify/dev-mcp@latest'],
      // },
      // 'chrome-devtools': {
      //   type: 'stdio',
      //   command: 'npx',
      //   args: [
      //     '-y',
      //     'chrome-devtools-mcp@latest',
      //     '--headless',
      //     '--isolated',
      //     '--no-sandbox',
      //     '--disable-setuid-sandbox',
      //   ],
      // },
      // playwright: {
      //   type: 'stdio',
      //   command: 'npx',
      //   args: [
      //     '-y',
      //     '@playwright/mcp@latest',
      //     '--headless',
      //     '--isolated',
      //     '--no-sandbox',
      //     '--browser=chromium',
      //   ],
      // },
    },
  } satisfies MyAgentModuleOptions;
});
