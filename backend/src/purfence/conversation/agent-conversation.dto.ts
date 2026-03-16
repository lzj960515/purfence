import { BaseDto } from '@app/shared';
import { ObjectType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';

@ObjectType('AgentConversationSession')
export class AgentConversationSessionDto extends BaseDto {
  @FilterableField({ nullable: true })
  userId?: string;

  @FilterableField({ nullable: true })
  title?: string;
}
