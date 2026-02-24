import { Injectable } from '@nestjs/common';
import { WorkflowMode } from '../entities/workflow-config.entity';
import { CompletionStrategy } from './completion-strategy.interface';
import { StandaloneCompletionStrategy } from './standalone-completion.strategy';
import { CollaborativeCompletionStrategy } from './collaborative-completion.strategy';

@Injectable()
export class CompletionStrategyFactory {
  constructor(
    private readonly standaloneStrategy: StandaloneCompletionStrategy,
    private readonly collaborativeStrategy: CollaborativeCompletionStrategy,
  ) {}

  getStrategy(mode: WorkflowMode): CompletionStrategy {
    switch (mode) {
      case WorkflowMode.STANDALONE:
        return this.standaloneStrategy;
      case WorkflowMode.COLLABORATIVE:
        return this.collaborativeStrategy;
      default:
        throw new Error(`Unknown workflow mode: ${mode}`);
    }
  }
}
