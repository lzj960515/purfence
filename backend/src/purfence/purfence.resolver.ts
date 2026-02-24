import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BadRequestException } from '@nestjs/common';
import { PurfenceExecutionService } from './purfence-execution.service';
import { PurfenceIssueService } from './purfence-issue.service';
import { DeleteOnePurfenceIssueInput } from './purfence-issue-delete.input';
import { PurfenceIssueDto } from './purfence-issue.dto';
import { PurfenceIssue } from './purfence-issue.entity';
import { IssueOrigin, PurfenceStatus } from './purfence-status.enum';

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

  /**
   * Start a remote issue
   * - Validates the issue is a remote issue
   * - Creates worktree with remote issue naming convention
   * - Updates status to running
   * - Creates execution for the issue
   */
  @Mutation(() => PurfenceIssueDto)
  async startRemoteIssue(
    @Args('issueId', { type: () => ID }) issueId: string,
  ): Promise<PurfenceIssueDto> {
    // 1. Get issue
    const issue = await PurfenceIssue.findOneOrFail({ where: { id: issueId } });

    // 2. Check origin is remote
    if (issue.origin !== IssueOrigin.remote) {
      throw new BadRequestException(
        `Issue ${issueId} is not a remote issue (origin: ${issue.origin})`,
      );
    }

    // 3. Check remoteIssueData exists
    if (!issue.remoteIssueData) {
      throw new BadRequestException(
        `Issue ${issueId} is missing remote issue data`,
      );
    }

    // 4. Create worktree for remote issue
    await this.issueService.createWorktreeForRemoteIssue(issueId);

    // 5. Update status to running
    issue.status = PurfenceStatus.running;
    await issue.save();

    // 6. Create execution
    await this.executionService.createExecutionForIssue(issueId);

    return issue as PurfenceIssueDto;
  }
}
