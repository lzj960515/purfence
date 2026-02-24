import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { RemoteRepositoryType } from '../entities/remote-repository.entity';

@InputType('RemoteRepositoryConfigInput')
export class RemoteRepositoryConfigInput {
  @IsEnum(RemoteRepositoryType)
  @Field(() => RemoteRepositoryType)
  type: RemoteRepositoryType;

  @IsNotEmpty()
  @IsUrl()
  @MaxLength(512)
  @Field()
  url: string;

  @IsNotEmpty()
  @IsString()
  @Field()
  token: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Field({ nullable: true })
  defaultBranch?: string;
}

@InputType('ConfigureRemoteRepositoryArgs')
export class ConfigureRemoteRepositoryArgs {
  @Field(() => ID)
  projectId: string;

  @Field(() => RemoteRepositoryConfigInput)
  config: RemoteRepositoryConfigInput;
}

@InputType('TestRemoteRepositoryConnectionArgs')
export class TestRemoteRepositoryConnectionArgs {
  @IsEnum(RemoteRepositoryType)
  @Field(() => RemoteRepositoryType)
  type: RemoteRepositoryType;

  @IsNotEmpty()
  @IsUrl()
  @MaxLength(512)
  @Field()
  url: string;

  @IsNotEmpty()
  @IsString()
  @Field()
  token: string;
}

@InputType('UpdateRemoteRepositoryInput')
export class UpdateRemoteRepositoryInput {
  @IsOptional()
  @IsEnum(RemoteRepositoryType)
  @Field(() => RemoteRepositoryType, { nullable: true })
  type?: RemoteRepositoryType;

  @IsOptional()
  @IsUrl()
  @MaxLength(512)
  @Field({ nullable: true })
  url?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  token?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Field({ nullable: true })
  defaultBranch?: string;
}
