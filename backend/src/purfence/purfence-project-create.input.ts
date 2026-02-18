import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

@InputType('PurfenceProjectCreateInput')
export class PurfenceProjectCreateInput {
  @IsOptional()
  @MaxLength(128)
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  externalPath?: string;

  @Field({ nullable: true })
  defaultBranch?: string;

  @IsNotEmpty()
  @MaxLength(64)
  @Field()
  slug: string;
}
