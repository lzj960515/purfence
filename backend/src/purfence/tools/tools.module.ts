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
import { SessionTools } from './session.tools';
import { SessionToolsService } from './session-tools.service';

const tools = [
  ImageTool,
  PurfenceTools,
  TianfuTools,
  ExecutionTools,
  GenericTools,
  SessionTools,
];

@Global()
@Module({
  imports: [HttpModule],
  providers: [...tools, GenericToolsService, SessionToolsService],
  exports: [...tools],
})
export class ToolsModule {}
