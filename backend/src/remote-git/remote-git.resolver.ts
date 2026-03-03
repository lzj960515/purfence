import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  RemoteRepositoryConfigDto,
  RemoteRepositoryConnectionTestResultDto,
} from './dto/remote-repository.dto';
import {
  ConfigureRemoteRepositoryArgs,
  TestRemoteRepositoryConnectionArgs,
  UpdateRemoteRepositoryInput,
} from './dto/remote-repository.input';
import { RemoteGitService } from './remote-git.service';
import { RemoteIssueDto } from './dto/remote-issue.dto';
import { ImportRemoteIssueInput } from './dto/import-remote-issue.input';
import { PurfenceIssueDto } from '../purfence/purfence-issue.dto';
import { PurfenceIssue } from '../purfence/purfence-issue.entity';

@Resolver(() => RemoteRepositoryConfigDto)
export class RemoteGitResolver {
  constructor(private readonly remoteGitService: RemoteGitService) {}

  @Query(() => RemoteRepositoryConfigDto, { nullable: true })
  async remoteRepositoryConfig(
    @Args('projectId') projectId: string,
  ): Promise<RemoteRepositoryConfigDto | null> {
    const config = await this.remoteGitService.findByProjectId(projectId);
    return config as RemoteRepositoryConfigDto | null;
  }

  @Mutation(() => RemoteRepositoryConfigDto)
  async configureRemoteRepository(
    @Args('input') args: ConfigureRemoteRepositoryArgs,
  ): Promise<RemoteRepositoryConfigDto> {
    const config = await this.remoteGitService.configure(
      args.projectId,
      args.config,
    );
    return config as RemoteRepositoryConfigDto;
  }

  @Mutation(() => RemoteRepositoryConfigDto)
  async updateRemoteRepository(
    @Args('projectId') projectId: string,
    @Args('input') input: UpdateRemoteRepositoryInput,
  ): Promise<RemoteRepositoryConfigDto> {
    const config = await this.remoteGitService.update(projectId, input);
    return config as RemoteRepositoryConfigDto;
  }

  @Mutation(() => Boolean)
  async deleteRemoteRepository(
    @Args('projectId') projectId: string,
  ): Promise<boolean> {
    return this.remoteGitService.delete(projectId);
  }

  @Mutation(() => RemoteRepositoryConnectionTestResultDto)
  async testRemoteRepositoryConnection(
    @Args('input') args: TestRemoteRepositoryConnectionArgs,
  ): Promise<RemoteRepositoryConnectionTestResultDto> {
    const result = await this.remoteGitService.testConnection(
      args.type,
      args.url,
      args.token,
    );
    return result as RemoteRepositoryConnectionTestResultDto;
  }

  @Query(() => [RemoteIssueDto])
  async remoteIssues(
    @Args('projectId') projectId: string,
  ): Promise<RemoteIssueDto[]> {
    return this.remoteGitService.syncRemoteIssues(projectId);
  }

  @Mutation(() => PurfenceIssueDto)
  async importRemoteIssue(
    @Args('input') input: ImportRemoteIssueInput,
  ): Promise<PurfenceIssueDto> {
    const issue = await this.remoteGitService.importRemoteIssue(
      input.projectId,
      input.remoteIssueId,
    );
    return issue as PurfenceIssueDto;
  }

  @Query(() => [PurfenceIssueDto])
  async importedRemoteIssues(
    @Args('projectId') projectId: string,
  ): Promise<PurfenceIssueDto[]> {
    const issues =
      await this.remoteGitService.getImportedRemoteIssues(projectId);
    return issues as PurfenceIssueDto[];
  }
}
