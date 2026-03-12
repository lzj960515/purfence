import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ProviderType } from '../types/provider-type.enum';

@InputType()
export class ModelProviderCreateInput {
  @Field(() => ProviderType)
  @IsEnum(ProviderType)
  @IsNotEmpty()
  provider: ProviderType;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  baseUrl?: string;

  @Field({ defaultValue: true })
  @IsBoolean()
  @IsOptional()
  isActive: boolean;
}
