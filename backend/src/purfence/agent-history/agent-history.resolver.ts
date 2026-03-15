import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { AgentDto } from '../agent/agent.dto';
import { AgentHistoryService } from './agent-history.service';

@Resolver()
export class AgentHistoryResolver {
  constructor(private readonly agentHistoryService: AgentHistoryService) {}

  @Mutation(() => AgentDto)
  async rollbackAgentHistory(
    @Args('agentId', { type: () => ID }) agentId: string,
    @Args('historyId', { type: () => ID }) historyId: string,
    @Args('changeDescription', { nullable: true }) changeDescription?: string,
  ) {
    return this.agentHistoryService.rollbackToHistory(
      agentId,
      historyId,
      changeDescription,
    );
  }
}
