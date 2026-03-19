import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { ScheduledTaskCreateInput } from './scheduled-task-create.input';
import { ScheduledTaskDto } from './scheduled-task.dto';
import { ScheduledTaskService } from './scheduled-task.service';
import { ScheduledTaskUpdateInput } from './scheduled-task-update.input';

@Resolver()
export class ScheduledTaskResolver {
  constructor(
    private readonly scheduledTaskService: ScheduledTaskService,
  ) {}

  @Mutation(() => ScheduledTaskDto)
  async createScheduledTask(
    @Args('input', { type: () => ScheduledTaskCreateInput })
    input: ScheduledTaskCreateInput,
  ) {
    return this.scheduledTaskService.createTask(input);
  }

  @Mutation(() => ScheduledTaskDto)
  async updateScheduledTask(
    @Args('id', { type: () => ID }) id: string,
    @Args('update', { type: () => ScheduledTaskUpdateInput })
    update: ScheduledTaskUpdateInput,
  ) {
    return this.scheduledTaskService.updateTask(id, update);
  }

  @Mutation(() => ID)
  async deleteScheduledTask(
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.scheduledTaskService.deleteTask(id);
  }

  @Mutation(() => ID)
  async runScheduledTask(@Args('id', { type: () => ID }) id: string) {
    const threadId = await this.scheduledTaskService.runTaskNow(id);
    return threadId || '';
  }
}
