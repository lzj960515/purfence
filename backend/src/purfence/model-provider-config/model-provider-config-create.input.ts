import { Field, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ProviderType } from '../types/provider-type.enum';

@InputType()
export class ModelProviderConfigCreateInput {
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
  email?: string;

  @Field({ nullable: true })
  @IsString()
  @ValidateIf((o) => o.provider !== ProviderType.CODEX, {
    message: 'API Key is required when provider is not Codex',
  })
  apiKey?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  refreshToken?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  baseUrl?: string;

  @Field({ defaultValue: true })
  @IsBoolean()
  isActive: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  isDefault: boolean;
}
