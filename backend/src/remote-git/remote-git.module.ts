import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RemoteRepositoryConfig } from './entities/remote-repository.entity';
import { RemoteGitService } from './remote-git.service';
import { RemoteGitResolver } from './remote-git.resolver';
import { GitAdapterFactory } from './adapters/adapter.factory';

@Module({
  imports: [TypeOrmModule.forFeature([RemoteRepositoryConfig])],
  providers: [RemoteGitService, RemoteGitResolver, GitAdapterFactory],
  exports: [RemoteGitService, GitAdapterFactory],
})
export class RemoteGitModule {}
