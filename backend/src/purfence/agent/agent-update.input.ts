import { InputType, PartialType } from '@nestjs/graphql';
import { AgentCreateInput } from './agent-create.input';

@InputType()
export class AgentUpdateInput extends PartialType(AgentCreateInput) {}
