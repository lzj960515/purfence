import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { PurfenceIssueService } from '../purfence-issue.service';
import { PurfenceProjectService } from '../purfence-project.service';
import { PurfenceExecutionService } from '../purfence-execution.service';
import { PurfenceScheduledTaskModule } from '../scheduled-task/purfence-scheduled-task.module';
import { PurfenceTools } from './purfence.tools';
import { TianfuTools } from './tianfu.tools';
import { ExecutionTools } from './execution.tools';
import { GenericTools } from './generic.tools';
import { GenericToolsService } from './generic-tools.service';
import { ImageTool } from './image.tool';

const tools = [
  ImageTool,
  PurfenceTools,
  TianfuTools,
  ExecutionTools,
  GenericTools,
];

@Global()
@Module({
  imports: [HttpModule, PurfenceScheduledTaskModule],
  providers: [
    ...tools,
    PurfenceProjectService,
    PurfenceIssueService,
    PurfenceExecutionService,
    GenericToolsService,
  ],
  exports: [
    ...tools,
    PurfenceProjectService,
    PurfenceIssueService,
    PurfenceExecutionService,
    GenericToolsService,
  ],
})
export class ToolsModule {}
