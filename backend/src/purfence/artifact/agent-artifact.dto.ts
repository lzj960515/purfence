import { BaseDto } from '@app/shared';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';
import {
  AgentArtifactContent,
  AgentArtifactContentDto,
  AgentArtifactType,
} from './agent-artifact-content.dto';

@ObjectType('AgentArtifact')
export class AgentArtifactDto extends BaseDto {
  @FilterableField(() => ID, { nullable: true })
  conversationId?: string;
  @FilterableField()
  toolName: string;
  @Field(() => AgentArtifactContentDto, { nullable: true })
  content: AgentArtifactContent;
  @Field(() => AgentArtifactType, { nullable: true })
  type: AgentArtifactType;
}
