import 'dotenv/config';
import { SetupPinoLoggerModule } from '@app/shared';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import process from 'node:process';
import { AppModule } from './app.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    SetupPinoLoggerModule.forRoot(),
    AppModule,
  ],
})
export class BootstrapModule {}

process.setMaxListeners(1000); // Increase max listeners to avoid memory leak warnings
