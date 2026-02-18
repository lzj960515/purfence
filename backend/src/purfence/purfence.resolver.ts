import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PurfenceExecutionService } from './purfence-execution.service';
import { PurfenceIssueService } from './purfence-issue.service';
import { DeleteOnePurfenceIssueInput } from './purfence-issue-delete.input';

@Resolver()
export class PurfenceResolver {
  constructor(
    private readonly executionService: PurfenceExecutionService,
    private readonly issueService: PurfenceIssueService,
  ) {}

  @Query(() => [String])
  async purfenceListIssueArtifactFiles(
    @Args('issueId', { type: () => ID }) issueId: string,
  ) {
    return this.executionService.listIssueArtifactFiles(issueId);
  }

  @Query(() => String)
  async purfenceReadIssueArtifactFile(
    @Args('issueId', { type: () => ID }) issueId: string,
    @Args('path') filePath: string,
  ) {
    return this.executionService.readIssueArtifactFile(issueId, filePath);
  }

  @Mutation(() => ID)
  async deleteOnePurfenceIssue(
    @Args('input', { type: () => DeleteOnePurfenceIssueInput }) input: DeleteOnePurfenceIssueInput,
  ): Promise<string> {
    return this.issueService.deleteIssue(input.id);
  }

  @Mutation(() => ID)
  async startIssue(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<string> {
    const execution = await this.issueService.startIssue(id);
    return execution.id;
  }
}
