import '@app/hotfix';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import process from 'node:process';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';
import { PurfenceModule } from './purfence/purfence.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'static'),
      // path-to-regexp v6: do not use regexp groups like ":path(.*)".
      // Use named wildcards for subpaths.
      exclude: ['/api', '/api/*path', '/graphql', '/graphql/*path'],
      serveStaticOptions: {
        fallthrough: true,
      },
    }),
    CommonModule,
    PurfenceModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
