import { InputType, PartialType } from '@nestjs/graphql';
import { AgentConversationCreateInput } from './agent-conversation-create.input';

@InputType()
export class AgentConversationUpdateInput extends PartialType(
  AgentConversationCreateInput,
) {}
