import { InputType, PartialType } from '@nestjs/graphql';
import { MyQueueJobCreateInput } from './my-queue-job-create.input';

@InputType()
export class MyQueueJobUpdateInput extends PartialType(MyQueueJobCreateInput) {}
