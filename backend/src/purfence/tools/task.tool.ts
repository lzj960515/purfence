import { MyAgentService, Tool } from '@app/my-agent';
import { SocketService } from '@app/my-agent/socket.service';
import { MyUtil } from '@app/shared';
import { Injectable } from '@nestjs/common';
import { ToolExecuteOptions } from '@voltagent/core';
import { filter, lastValueFrom, map, reduce, tap } from 'rxjs';
import { z } from 'zod';
import { Agent } from '../agent/agent.entity';
import { ProviderModelService } from '../provider-model.service';

const parameters = z.object({
  description: z
    .string()
    .describe('A short (3-5 word) description of the task'),
  prompt: z.string().describe('The task for the agent to perform'),
  subagent_type: z.string().describe('The type of specialized agent'),
  sessionId: z
    .string()
    .optional()
    .describe(
      'Optional session ID to resume from. If provided, the agent will continue from the previous conversation.',
    ),
});

@Injectable()
export class TaskTool {
  constructor(
    private myAgentService: MyAgentService,
    private providerModelService: ProviderModelService,
  ) {}

  @Tool({
    name: 'task',
    description: `Launch a new agent to handle complex, multi-step tasks autonomously.

The Task tool launches specialized agents (subprocesses) that autonomously handle complex tasks. Each agent type has specific capabilities and tools available to it.

When using the Task tool, you MUST specify a subagent_type parameter to select which agent type to use.

Usage notes:
- Always include a short description (3-5 words) summarizing what the agent will do
- Launch multiple agents concurrently whenever possible, to maximize performance
- Agents can be resumed using the "sessionId" parameter. However, by default, each invocation starts fresh.
- If the agent is done, it will return a single message back to you. The result returned by the agent is NOT visible to the user directly. You need to send a text message back to the user with a concise summary of the result.
- If an agent mentions that they can be resumed, you MUST use the \`sessionId\` parameter to resume the agent instead of starting a new one.
- If the agent description mentions that it should be used proactively, follow that guidance.

IMPORTANT: When using the Task tool:
1. Always include a \`subagent_type\` parameter to specify the agent type
2. NEVER include a \`prompt\` parameter that asks the user questions - the agent should figure out the task from the context
3. NEVER use the Task tool for trivial tasks that can be handled with a single tool call
4. When spawning multiple agents in parallel, MUST send a single message with multiple tool calls`,
    parameters,
    tags: ['general'],
  })
  async task(params: z.output<typeof parameters>, options: ToolExecuteOptions) {
    const { prompt, subagent_type, sessionId } = params;
    const context = options.context;
    const agentConfig = await Agent.findOneOrFail({
      where: { name: subagent_type },
    });

    const agentModelOptions =
      await this.providerModelService.findAgentModelOptions(
        agentConfig.modelConfig,
      );

    const agent = this.myAgentService.createAgent({
      tools: agentConfig.tools,
      name: agentConfig.name,
      prompt: agentConfig.instructions,
    });

    let conversationId = sessionId;
    if (!conversationId) {
      conversationId = MyUtil.uuid();
    }

    const stream$ = await agent.stream({
      message: [
        {
          id: MyUtil.uuid(),
          role: 'user',
          parts: [
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      conversationId,
      userId: options.userId,
      agentModelOptions,
      context,
    });

    const result = await lastValueFrom(
      stream$.pipe(
        tap((event) => {
          if (event.data.type === 'thinking' || event.data.type === 'text') {
            console.log(event.data);
          }
        }),
        filter((event) => event.data.type === 'text'),
        map((event) => event.data.content ?? ''),
        reduce((acc, content) => `${acc}${content}`, ''),
      ),
    );

    return {
      result,
      sessionId: conversationId,
    };
  }
}
