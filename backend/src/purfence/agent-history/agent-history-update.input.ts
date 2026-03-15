import { InputType, PartialType } from '@nestjs/graphql';
import { AgentHistoryCreateInput } from './agent-history-create.input';

@InputType()
export class AgentHistoryUpdateInput extends PartialType(
  AgentHistoryCreateInput,
) {}
