import { BaseDto } from '@app/shared';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('PurfenceConfig')
export class PurfenceConfigDto extends BaseDto {
  @Field({ nullable: true })
  projectsRootPath?: string;

  @Field({ nullable: true })
  proxyUrl?: string;
}
