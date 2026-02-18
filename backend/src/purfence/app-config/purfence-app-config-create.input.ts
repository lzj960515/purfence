import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';
import { AppConfigType } from '../types/app-config-type.enum';

@InputType()
export class PurfenceAppConfigCreateInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => AppConfigType)
  @IsString()
  @IsNotEmpty()
  type: AppConfigType;

  @Field({ defaultValue: false })
  enabled: boolean;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsObject()
  @IsOptional()
  config?: Record<string, unknown>;
}
