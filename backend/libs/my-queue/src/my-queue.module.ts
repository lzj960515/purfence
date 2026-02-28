import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MyQueueJob } from './my-queue-job.entity';
import { MyQueue } from './my-queue.entity';
import { MyQueueService } from './my-queue.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([MyQueue, MyQueueJob])],
  providers: [MyQueueService],
  exports: [MyQueueService],
})
export class MyQueueModule {}
