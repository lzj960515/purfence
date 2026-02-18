import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';

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
}
