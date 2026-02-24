import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClaudeAgentSdkService } from './claude-agent-sdk.service';
import { LlmService } from './llm.service';
import { MessageService } from './message.service';
import { MyAgentService } from './my-agent.service';
import { ToolsService } from './tools.service';
import { MemoryStorageService } from './memory-storage.service';
import { AgentLifecycleService } from './agent-lifecycle.service';

@Global()
@Module({
  imports: [DiscoveryModule, ConfigModule, HttpModule, EventEmitterModule],
  providers: [
    MyAgentService,
    ToolsService,
    LlmService,
    MessageService,
    ClaudeAgentSdkService,
    MemoryStorageService,
    AgentLifecycleService,
  ],
  exports: [
    MyAgentService,
    LlmService,
    MessageService,
    ToolsService,
    ClaudeAgentSdkService,
    MemoryStorageService,
    AgentLifecycleService,
  ],
})
export class MyAgentModule {}
