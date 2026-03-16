import { InputType, PartialType } from '@nestjs/graphql';
import { AgentConversationSessionCreateInput } from './agent-conversation-create.input';

@InputType()
export class AgentConversationSessionUpdateInput extends PartialType(
  AgentConversationSessionCreateInput,
) {}
