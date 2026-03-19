import { InputType, PartialType } from '@nestjs/graphql';
import { ScheduledTaskCreateInput } from './scheduled-task-create.input';

@InputType()
export class ScheduledTaskUpdateInput extends PartialType(
  ScheduledTaskCreateInput,
) {}
