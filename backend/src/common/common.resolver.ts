import { Log } from '@nest-mods/log';
import { Logger } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { RequestContext } from 'nestjs-request-context';
import { CommonService } from './common.service';
import { EmitEvent } from './utils/emit-event.decorator';
import { UseCache } from '@app/cache';

@Resolver()
export class CommonResolver {
  constructor(private service: CommonService) {}

  @Log() private logger: Logger;

  @EmitEvent('test.hello')
  @Query(() => GraphQLJSON, {
    nullable: true,
    description: 'ping test',
    complexity: 1000,
  })
  @UseCache({ getId: () => '' })
  async hello() {
    return `hello ${RequestContext.currentContext.req.user?.sub}`;
  }
}
