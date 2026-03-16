import { LanguageModelV3 } from '@ai-sdk/provider';
import { MyAgentService, Tool } from '@app/my-agent';
import { LlmService } from '@app/my-agent/llm.service';
import { ModelOptions } from '@app/my-agent/types';
import { Injectable } from '@nestjs/common';
import { ToolExecuteOptions } from '@voltagent/core';
import { streamText } from 'ai';
import { readFileSync } from 'fs';
import { z } from 'zod';
@Injectable()
export class ImageTool {
  constructor(private readonly myAgentService: MyAgentService) {}

  @Tool({
    name: 'image',
    description: `Use this tool to describe the image.`,
    parameters: z.object({
      prompt: z.string().describe('The prompt to describe the image'),
      image: z.string().describe('The path of the image'),
    }),
  })
  async image(
    { prompt, image }: { prompt: string; image: string },
    options: ToolExecuteOptions,
  ) {
    const context = options.context;
    const modelOptions = context?.get('modelOptions') as ModelOptions;
    return await this.myAgentService.generateText(modelOptions, [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image',
            image: readFileSync(image),
          },
        ],
      },
    ]);
  }
}
