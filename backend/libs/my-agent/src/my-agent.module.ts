import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core';
import { Memory } from '@voltagent/core';
import { LlmService } from './llm.service';
import { MessageService } from './message.service';
import { MyAgentHooks } from './my-agent-hooks';
import { MyAgentService } from './my-agent.service';
import { ToolsService } from './tools.service';
import { TypeOrmMemoryStorageAdapter } from './typeorm-memory-storage.adapter';

async function createMemoryAdapter(config: ConfigService) {
  return new TypeOrmMemoryStorageAdapter();
}

@Global()
@Module({
  imports: [DiscoveryModule, ConfigModule, HttpModule],
  providers: [
    MyAgentService,
    ToolsService,
    MyAgentHooks,
    LlmService,
    MessageService,
    {
      provide: Memory,
      inject: [ConfigService],
      useFactory: async (config) => {
        return new Memory({
          storage: await createMemoryAdapter(config),
        });
      },
    },
  ],
  exports: [MyAgentService, LlmService, MessageService, ToolsService],
})
export class MyAgentModule {}
