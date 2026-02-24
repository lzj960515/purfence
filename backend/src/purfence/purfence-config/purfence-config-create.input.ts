import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class PurfenceConfigCreateInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  projectsRootPath?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  proxyUrl?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  maxIssueConcurrency?: number;
}
