import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { PurfenceScheduledTaskCreateInput } from './purfence-scheduled-task-create.input';
import { PurfenceScheduledTaskDto } from './purfence-scheduled-task.dto';
import { PurfenceScheduledTaskService } from './purfence-scheduled-task.service';
import { PurfenceScheduledTaskUpdateInput } from './purfence-scheduled-task-update.input';

@Resolver()
export class PurfenceScheduledTaskResolver {
  constructor(
    private readonly scheduledTaskService: PurfenceScheduledTaskService,
  ) {}

  @Mutation(() => PurfenceScheduledTaskDto)
  async createPurfenceScheduledTask(
    @Args('input', { type: () => PurfenceScheduledTaskCreateInput })
    input: PurfenceScheduledTaskCreateInput,
  ) {
    return this.scheduledTaskService.createTask(input);
  }

  @Mutation(() => PurfenceScheduledTaskDto)
  async updatePurfenceScheduledTask(
    @Args('id', { type: () => ID }) id: string,
    @Args('update', { type: () => PurfenceScheduledTaskUpdateInput })
    update: PurfenceScheduledTaskUpdateInput,
  ) {
    return this.scheduledTaskService.updateTask(id, update);
  }

  @Mutation(() => ID)
  async deletePurfenceScheduledTask(
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.scheduledTaskService.deleteTask(id);
  }

  @Mutation(() => ID)
  async runPurfenceScheduledTask(@Args('id', { type: () => ID }) id: string) {
    const threadId = await this.scheduledTaskService.runTaskNow(id);
    return threadId || '';
  }
}
