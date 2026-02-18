import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { ClaudeCodeConfigCreateInput } from './claude-code-config-create.input';
import { ClaudeCodeConfigDto } from './claude-code-config.dto';
import { ClaudeCodeConfig } from './claude-code-config.entity';
import { ClaudeCodeConfigUpdateInput } from './claude-code-config-update.input';
import { ClaudeCodeConfigService } from './claude-code-config.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ClaudeCodeConfig]),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([ClaudeCodeConfig])],
      resolvers: [
        {
          EntityClass: ClaudeCodeConfig,
          DTOClass: ClaudeCodeConfigDto,
          CreateDTOClass: ClaudeCodeConfigCreateInput,
          UpdateDTOClass: ClaudeCodeConfigUpdateInput,
          read: { pagingStrategy: PagingStrategies.OFFSET },
          create: { many: { disabled: true } },
          update: { many: { disabled: true } },
          delete: { many: { disabled: true } },
          enableTotalCount: true,
        },
      ],
    }),
  ],
  providers: [ClaudeCodeConfigService],
  exports: [ClaudeCodeConfigService],
})
export class ClaudeCodeConfigModule {}
