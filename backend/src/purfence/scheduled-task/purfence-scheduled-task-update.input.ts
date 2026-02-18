import { InputType, PartialType } from '@nestjs/graphql';
import { PurfenceScheduledTaskCreateInput } from './purfence-scheduled-task-create.input';

@InputType()
export class PurfenceScheduledTaskUpdateInput extends PartialType(
  PurfenceScheduledTaskCreateInput,
) {}
