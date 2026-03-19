import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ExecutionTools } from './execution.tools';
import { GenericToolsService } from './generic-tools.service';
import { GenericTools } from './generic.tools';
import { ImageTool } from './image.tool';
import { PurfenceTools } from './purfence.tools';
import { SessionToolsService } from './session-tools.service';
import { SessionTools } from './session.tools';
import { SkillTools } from './skill.tools';
import { TianfuTools } from './tianfu.tools';

const tools = [
  ImageTool,
  PurfenceTools,
  TianfuTools,
  ExecutionTools,
  GenericTools,
  SessionTools,
  SkillTools,
];

@Global()
@Module({
  imports: [HttpModule],
  providers: [...tools, GenericToolsService, SessionToolsService],
  exports: [...tools],
})
export class ToolsModule {}
