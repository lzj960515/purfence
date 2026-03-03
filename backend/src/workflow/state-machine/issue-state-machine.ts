import { Injectable, Logger } from '@nestjs/common';
import { PurfenceIssue } from '../../purfence/purfence-issue.entity';
import { PurfenceStatus } from '../../purfence/purfence-status.enum';
import {
  WorkflowConfig,
  WorkflowMode,
} from '../entities/workflow-config.entity';

export interface TransitionContext {
  issue: PurfenceIssue;
  workflowConfig: WorkflowConfig;
}

export interface StateTransition {
  from: PurfenceStatus;
  to: PurfenceStatus;
  condition: (context: TransitionContext) => boolean | Promise<boolean>;
  action?: (context: TransitionContext) => Promise<void>;
}

@Injectable()
export class IssueStateMachine {
  private readonly logger = new Logger(IssueStateMachine.name);
  private transitions: StateTransition[] = [];

  constructor() {
    this.registerDefaultTransitions();
  }

  private registerDefaultTransitions() {
    // running -> needs_approval（协作模式）
    this.registerTransition({
      from: PurfenceStatus.running,
      to: PurfenceStatus.needs_approval,
      condition: (ctx) =>
        ctx.workflowConfig.mode === WorkflowMode.COLLABORATIVE,
    });

    // running -> done（单机模式）
    this.registerTransition({
      from: PurfenceStatus.running,
      to: PurfenceStatus.done,
      condition: (ctx) => ctx.workflowConfig.mode === WorkflowMode.STANDALONE,
    });

    // needs_approval -> done（手动合并后）
    this.registerTransition({
      from: PurfenceStatus.needs_approval,
      to: PurfenceStatus.done,
      condition: () => true, // 总是允许
    });

    // needs_user -> running（用户确认后）
    this.registerTransition({
      from: PurfenceStatus.needs_user,
      to: PurfenceStatus.running,
      condition: () => true, // 总是允许
    });

    // open -> running（启动 issue）
    this.registerTransition({
      from: PurfenceStatus.open,
      to: PurfenceStatus.running,
      condition: () => true, // 总是允许
    });

    // running -> failed（执行失败）
    this.registerTransition({
      from: PurfenceStatus.running,
      to: PurfenceStatus.failed,
      condition: () => true, // 总是允许
    });

    // failed -> running（重试）
    this.registerTransition({
      from: PurfenceStatus.failed,
      to: PurfenceStatus.running,
      condition: () => true, // 总是允许
    });

    // running -> budget_exhausted（预算耗尽）
    this.registerTransition({
      from: PurfenceStatus.running,
      to: PurfenceStatus.budget_exhausted,
      condition: () => true, // 总是允许
    });

    // budget_exhausted -> running（恢复执行）
    this.registerTransition({
      from: PurfenceStatus.budget_exhausted,
      to: PurfenceStatus.running,
      condition: () => true, // 总是允许
    });
  }

  registerTransition(transition: StateTransition): void {
    this.transitions.push(transition);
    this.logger.debug(
      `Registered transition: ${transition.from} -> ${transition.to}`,
    );
  }

  async canTransition(
    from: PurfenceStatus,
    to: PurfenceStatus,
    context: TransitionContext,
  ): Promise<boolean> {
    const transition = this.transitions.find(
      (t) => t.from === from && t.to === to,
    );
    if (!transition) {
      this.logger.debug(`No transition found from ${from} to ${to}`);
      return false;
    }
    const result = await transition.condition(context);
    this.logger.debug(
      `Transition ${from} -> ${to} condition result: ${result}`,
    );
    return result;
  }

  async transition(
    issue: PurfenceIssue,
    toState: PurfenceStatus,
    context: TransitionContext,
  ): Promise<void> {
    const fromState = issue.status;

    const canTransition = await this.canTransition(fromState, toState, context);
    if (!canTransition) {
      const message = `Cannot transition from ${fromState} to ${toState}`;
      this.logger.warn(message);
      throw new Error(message);
    }

    const transition = this.transitions.find(
      (t) => t.from === fromState && t.to === toState,
    );

    // 执行动作
    if (transition?.action) {
      this.logger.log(
        `Executing action for transition ${fromState} -> ${toState}`,
      );
      await transition.action(context);
    }

    // 更新状态
    issue.status = toState;
    this.logger.log(
      `Issue ${issue.id} transitioned from ${fromState} to ${toState}`,
    );
  }

  /**
   * 获取从指定状态可以转移到的所有状态
   */
  async getAvailableTransitions(
    from: PurfenceStatus,
    context: TransitionContext,
  ): Promise<PurfenceStatus[]> {
    const available: PurfenceStatus[] = [];

    for (const transition of this.transitions) {
      if (transition.from === from) {
        const canTransition = await transition.condition(context);
        if (canTransition) {
          available.push(transition.to);
        }
      }
    }

    return available;
  }
}
