import { BaseDto } from '@app/shared';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';
import {
  RemoteRepositoryType,
  RemoteRepositoryStatus,
} from '../entities/remote-repository.entity';

registerEnumType(RemoteRepositoryType, {
  name: 'RemoteRepositoryType',
  description: 'Remote repository type: gitlab or github',
});

registerEnumType(RemoteRepositoryStatus, {
  name: 'RemoteRepositoryStatus',
  description: 'Remote repository connection status',
});

@ObjectType('RemoteRepositoryConfig')
export class RemoteRepositoryConfigDto extends BaseDto {
  @FilterableField()
  projectId: string;

  @FilterableField(() => RemoteRepositoryType)
  type: RemoteRepositoryType;

  @Field()
  url: string;

  @Field()
  defaultBranch: string;

  @Field(() => RemoteRepositoryStatus)
  status: RemoteRepositoryStatus;

  @Field({ nullable: true })
  errorMessage?: string;

  @Field({ nullable: true })
  lastSyncedAt?: Date;
}

@ObjectType('RemoteRepositoryConnectionTestResult')
export class RemoteRepositoryConnectionTestResultDto {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  error?: string;

  @Field(() => [String], { nullable: true })
  permissions?: string[];
}
