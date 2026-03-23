import { Log } from '@nest-mods/log';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Transactional } from 'typeorm-transactional';
import { AgentHistory } from './agent-history.entity';
import { AgentDto } from '../agent/agent.dto';
import { Agent } from '../agent/agent.entity';

@Injectable()
export class AgentHistoryService {
  @Log() logger: Logger;

  @Transactional()
  async rollbackToHistory(
    agentId: string,
    historyId: string,
    changeDescription?: string | null,
  ): Promise<AgentDto> {
    const history = await AgentHistory.findOne({
      where: { id: historyId, agentId },
    });

    if (!history) {
      throw new NotFoundException(`Agent history not found: ${historyId}`);
    }

    const agent = await Agent.findOne({ where: { id: agentId } });
    if (!agent) {
      throw new NotFoundException(`Agent not found: ${agentId}`);
    }

    agent.name = history.name;
    agent.instructions = history.instructions ?? null;
    agent.description = history.description ?? null;
    agent.changeDescription =
      changeDescription?.trim() || `回滚到 v${history.version}`;
    agent.parentId = history.parentId ?? null;
    agent.global = history.global;
    agent.tools = history.tools ?? null;
    agent.skills = history.skills ?? null;
    agent.modelConfig = history.modelConfig ?? null;

    await agent.save();
    return agent as AgentDto;
  }

  @OnEvent('agent.created')
  async handleAgentCreated(payload: { agentId: string }) {
    await this.createSnapshotFromEvent(payload.agentId);
  }

  @OnEvent('agent.updated')
  async handleAgentUpdated(payload: { agentId: string }) {
    await this.createSnapshotFromEvent(payload.agentId);
  }

  private async createSnapshotFromEvent(agentId: string) {
    try {
      const agent = await Agent.findOne({ where: { id: agentId } });
      if (!agent) {
        throw new NotFoundException(`Agent not found: ${agentId}`);
      }

      const latestHistory = await AgentHistory.findOne({
        where: { agentId },
        order: { version: 'DESC' },
      });

      const history = AgentHistory.create({
        agentId,
        version: (latestHistory?.version ?? 0) + 1,
        name: agent.name,
        instructions: agent.instructions,
        description: agent.description,
        changeDescription: agent.changeDescription,
        parentId: agent.parentId,
        global: agent.global,
        tools: agent.tools,
        skills: agent.skills,
        modelConfig: agent.modelConfig,
      });

      await history.save();
    } catch (error) {
      this.logger.error(
        `Failed to create agent history for ${agentId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
