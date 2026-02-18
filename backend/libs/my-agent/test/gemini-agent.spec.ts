import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import myAgentConfig from '@src/common/configs/my-agent.config';
import typeormBiConfig from '@src/common/configs/typeorm-ai.config';

import { MyAgentModule, MyAgentService } from '../src';
import { GoogleGenAI } from '@google/genai';
import { HttpsProxyAgent } from 'hpagent';

const logger = new Logger();

describe('gemini agent', () => {
  let module: TestingModule;
  let service: MyAgentService;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ConfigModule.forFeature(typeormBiConfig),
        ConfigModule.forFeature(myAgentConfig),
        MyAgentModule,
      ],
    })
      .setLogger(logger)
      .compile();

    await module.init();

    service = module.get<MyAgentService>(MyAgentService);
  });

  it('generateText', async () => {
    const agent = service.createAgent({
      name: 'gemini-agent-test',
      prompt: '现在是调试模式',
      tools: [],
      model: 'gemini',
    });

    const resp = await agent.generateText(
      '帮我写一首关于春天的诗歌，要求押韵',
      {
        providerOptions: {
          google: {
            thinkingConfig: {
              includeThoughts: true,
            },
          },
        },
      },
    );

    logger.debug(JSON.stringify(resp));
  });

  it('streamText', async () => {
    const agent = service.createAgent({
      name: 'gemini-agent-test',
      prompt: '现在是调试模式',
      tools: [],
      model: 'gemini',
    });

    const resp = await agent.streamText('帮我写一首关于秋天的诗歌，要求押韵', {
      providerOptions: {
        google: {
          thinkingConfig: {
            includeThoughts: true,
          },
        },
      },
    });

    for await (const it of resp.fullStream) {
      logger.debug(JSON.stringify(it));
    }
  });

  it('generateVideo', async () => {
    const agent = service.createAgent({
      name: 'video-analysis-agent',
      prompt: '',
      tools: [],
      model: 'gemini',
    });

    const prompt = `Act as an Ecommerce Content Analyst. Analyze the substance and subject matter of the attached video. Focus on what is being communicated rather than just the editing style.

Please provide a concise report covering:

Core Concept: A one-sentence summary of the video's main topic or storyline.

Product Breakdown: List the specific product features, ingredients, or benefits explicitly mentioned or shown.

Pain Points & Solutions: What specific customer problem does the video identify, and how does the product solve it?

Target Audience: Based on the tone and visual cues, who is the intended demographic?

Execution Brief: Briefly note the Hook (0-3s) and the final CTA used to deliver this message.

Constraint: Keep the total analysis under 500 tokens. Use bullet points for clarity.`;

    const resp = await agent.generateText(
      [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              data: 'https://static.pietrastudio.com/public/file_uploads/9d1f54552fbdb7fa27a84c81d3ea9baa.mp4',
              mediaType: 'video/mp4',
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      {
        providerOptions: {
          google: {
            thinkingConfig: {
              includeThoughts: true,
            },
          },
        },
      },
    );

    logger.debug(JSON.stringify(resp.text));
  });

  it('generateVideo gen ai', async () => {
    function getProxyGoogleAuthOptions() {
      const proxy = process.env.GOOGLE_AUTH_HTTPS_PROXY;
      if (proxy) {
        const agent = new HttpsProxyAgent({ proxy });
        return {
          scopes: 'https://www.googleapis.com/auth/cloud-platform',
          clientOptions: {
            transporterOptions: { agent },
          },
        };
      }
    }

    function buildGoogleGenAIBaseUrl() {
      const baseUrl = process.env.GOOGLE_GENAI_API_BASE_URL;
      if (baseUrl) {
        return baseUrl;
      }
    }

    const genAi = new GoogleGenAI({
      vertexai: true,
      project: 'pietra-ai',
      location: 'global',
      googleAuthOptions: getProxyGoogleAuthOptions(),
      httpOptions: {
        baseUrl: buildGoogleGenAIBaseUrl(),
      },
    });

    const prompt = `Act as an Ecommerce Content Analyst. Analyze the substance and subject matter of the attached video. Focus on what is being communicated rather than just the editing style.

Please provide a concise report covering:

Core Concept: A one-sentence summary of the video's main topic or storyline.

Product Breakdown: List the specific product features, ingredients, or benefits explicitly mentioned or shown.

Pain Points & Solutions: What specific customer problem does the video identify, and how does the product solve it?

Target Audience: Based on the tone and visual cues, who is the intended demographic?

Execution Brief: Briefly note the Hook (0-3s) and the final CTA used to deliver this message.

Constraint: Keep the total analysis under 500 tokens. Use bullet points for clarity.`;
    const contents = [
      {
        role: 'user',
        parts: [
          {
            fileData: {
              fileUri:
                'https://static.pietrastudio.com/public/file_uploads/9d1f54552fbdb7fa27a84c81d3ea9baa.mp4',
              mimeType: 'video/*',
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ];

    const resp = await genAi.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents,
    });
    logger.debug(JSON.stringify(resp.text));
  });
});
