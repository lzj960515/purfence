import { InputType, PartialType } from '@nestjs/graphql';
import { ClaudeCodeConfigCreateInput } from './claude-code-config-create.input';

@InputType()
export class ClaudeCodeConfigUpdateInput extends PartialType(
  ClaudeCodeConfigCreateInput,
) {}
