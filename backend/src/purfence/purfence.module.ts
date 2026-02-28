import { Module } from '@nestjs/common';
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurfenceIssueCreateInput } from './purfence-issue-create.input';
import { PurfenceIssueUpdateInput } from './purfence-issue-update.input';
import { PurfenceIssueDto } from './purfence-issue.dto';
import { PurfenceIssue } from './purfence-issue.entity';
import { PurfenceProjectCreateInput } from './purfence-project-create.input';
import { PurfenceProjectUpdateInput } from './purfence-project-update.input';
import { PurfenceProjectDto } from './purfence-project.dto';
import { PurfenceProject } from './purfence-project.entity';
import { PurfenceExecutionCreateInput } from './purfence-execution-create.input';
import { PurfenceExecutionUpdateInput } from './purfence-execution-update.input';
import { PurfenceExecutionDto } from './purfence-execution.dto';
import { PurfenceExecution } from './purfence-execution.entity';
import { PurfenceExecutionService } from './purfence-execution.service';
import { PurfenceProjectService } from './purfence-project.service';
import { PurfenceIssueService } from './purfence-issue.service';
import { PurfenceResolver } from './purfence.resolver';
import { PurfenceEventListenerService } from './purfence-event-listener.service';
import { AgentGateway } from './agent.gateway';
import { AgentController } from './agent.controller';
import { PurfenceIssueSubscriber } from './purfence-issue.subscriber';
import { PurfenceProjectSubscriber } from './purfence-project.subscriber';
import { PurfenceExecutionSubscriber } from './purfence-execution.subscriber';
import { ToolsModule } from './tools/tools.module';
import { ModelProviderConfigModule } from './model-provider-config/model-provider-config.module';
import { OAuthModule } from './oauth/oauth.module';
import { PurfenceConfigModule } from './purfence-config/purfence-config.module';
import { ClaudeCodeConfigModule } from './claude-code-config/claude-code-config.module';
import { ProviderModelService } from './provider-model.service';
import { AgentArtifact } from './artifact/agent-artifact.ai.entity';
import { AgentArtifactDto } from './artifact/agent-artifact.dto';
import { AgentArtifactUpdateInput } from './artifact/agent-artifact-update.input';
import { PurfenceScheduledTaskModule } from './scheduled-task/purfence-scheduled-task.module';
import { PurfenceAgentService } from './agent.service';
import { PurfenceAppConfigModule } from './app-config/purfence-app-config.module';
import { MyQueue, MyQueueJob, MyQueueModule } from '@app/my-queue';
import { MyQueueDto } from './my-queue/my-queue.dto';
import { MyQueueCreateInput } from './my-queue/my-queue-create.input';
import { MyQueueUpdateInput } from './my-queue/my-queue-update.input';
import { MyQueueJobDto } from './my-queue/my-queue-job.dto';
import { MyQueueJobCreateInput } from './my-queue/my-queue-job-create.input';
import { MyQueueJobUpdateInput } from './my-queue/my-queue-job-update.input';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurfenceProject,
      PurfenceIssue,
      PurfenceExecution,
      AgentArtifact,
      MyQueue,
      MyQueueJob,
    ]),
    ToolsModule,
    ModelProviderConfigModule,
    PurfenceConfigModule,
    ClaudeCodeConfigModule,
    PurfenceScheduledTaskModule,
    PurfenceAppConfigModule,
    MyQueueModule,
    OAuthModule,
    NestjsQueryGraphQLModule.forFeature({
      imports: [
        NestjsQueryTypeOrmModule.forFeature([
          PurfenceProject,
          PurfenceIssue,
          PurfenceExecution,
          AgentArtifact,
          MyQueue,
          MyQueueJob,
        ]),
      ],
      resolvers: [
        {
          EntityClass: AgentArtifact,
          DTOClass: AgentArtifactDto,
          UpdateDTOClass: AgentArtifactUpdateInput,
          read: {},
          create: { disabled: true },
          update: { many: { disabled: true } },
          delete: { disabled: true },
          enableTotalCount: true,
          pagingStrategy: PagingStrategies.OFFSET,
        },
        {
          EntityClass: PurfenceProject,
          DTOClass: PurfenceProjectDto,
          CreateDTOClass: PurfenceProjectCreateInput,
          UpdateDTOClass: PurfenceProjectUpdateInput,
          read: {},
          create: { many: { disabled: true } },
          update: {},
          delete: {},
          enableTotalCount: true,
          pagingStrategy: PagingStrategies.OFFSET,
        },
        {
          EntityClass: PurfenceIssue,
          DTOClass: PurfenceIssueDto,
          CreateDTOClass: PurfenceIssueCreateInput,
          UpdateDTOClass: PurfenceIssueUpdateInput,
          read: {},
          create: {},
          update: {},
          delete: { disabled: true },
          enableTotalCount: true,
          pagingStrategy: PagingStrategies.OFFSET,
        },
        {
          EntityClass: PurfenceExecution,
          DTOClass: PurfenceExecutionDto,
          CreateDTOClass: PurfenceExecutionCreateInput,
          UpdateDTOClass: PurfenceExecutionUpdateInput,
          read: {},
          create: { disabled: true },
          update: {},
          delete: {},
          enableTotalCount: true,
          pagingStrategy: PagingStrategies.OFFSET,
        },
        {
          EntityClass: MyQueue,
          DTOClass: MyQueueDto,
          CreateDTOClass: MyQueueCreateInput,
          UpdateDTOClass: MyQueueUpdateInput,
          read: {},
          create: { many: { disabled: true } },
          update: { many: { disabled: true } },
          delete: { many: { disabled: true } },
          enableTotalCount: true,
          pagingStrategy: PagingStrategies.OFFSET,
        },
        {
          EntityClass: MyQueueJob,
          DTOClass: MyQueueJobDto,
          CreateDTOClass: MyQueueJobCreateInput,
          UpdateDTOClass: MyQueueJobUpdateInput,
          read: {},
          create: { many: { disabled: true } },
          update: { many: { disabled: true } },
          delete: { many: { disabled: true } },
          enableTotalCount: true,
          pagingStrategy: PagingStrategies.OFFSET,
        },
      ],
    }),
  ],
  controllers: [AgentController],
  providers: [
    AgentGateway,
    PurfenceExecutionService,
    PurfenceProjectService,
    PurfenceIssueService,
    PurfenceResolver,
    PurfenceEventListenerService,
    PurfenceIssueSubscriber,
    PurfenceProjectSubscriber,
    PurfenceExecutionSubscriber,
    ProviderModelService,
    PurfenceAgentService,
  ],
  exports: [
    PurfenceIssueService,
    PurfenceExecutionService,
    PurfenceProjectService,
  ],
})
export class PurfenceModule {}
