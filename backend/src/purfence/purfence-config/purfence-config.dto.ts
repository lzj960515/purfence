import { BaseDto } from '@app/shared';
import { Field, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { ConfigKey } from './purfence-config.entity';

export { ConfigKey };

@ObjectType('PurfenceConfig')
export class PurfenceConfigDto extends BaseDto {
  @Field()
  key: ConfigKey | string;

  @Field(() => GraphQLJSON, { nullable: true })
  value?: unknown;
}
