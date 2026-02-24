import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowConfig } from './entities/workflow-config.entity';
import { WorkflowService } from './workflow.service';
import { WorkflowResolver } from './workflow.resolver';
import { IssueStateMachine } from './state-machine/issue-state-machine';
import { CompletionStrategyFactory } from './strategies/strategy.factory';
import { StandaloneCompletionStrategy } from './strategies/standalone-completion.strategy';
import { CollaborativeCompletionStrategy } from './strategies/collaborative-completion.strategy';
import { PurfenceModule } from '../purfence/purfence.module';

@Module({
  imports: [TypeOrmModule.forFeature([WorkflowConfig]), PurfenceModule],
  providers: [
    WorkflowService,
    WorkflowResolver,
    IssueStateMachine,
    CompletionStrategyFactory,
    StandaloneCompletionStrategy,
    CollaborativeCompletionStrategy,
  ],
  exports: [WorkflowService],
})
export class WorkflowModule {}
