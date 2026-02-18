import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';
import { IsNotEmpty, MaxLength } from 'class-validator';

@ObjectType({ isAbstract: true })
export abstract class BaseDto {
  @FilterableField(() => ID, { description: 'ID' })
  id: string;

  @FilterableField()
  createdAt: Date;

  @FilterableField()
  updatedAt: Date;
}

@ObjectType({ isAbstract: true })
export abstract class BaseListDto extends BaseDto {
  @FilterableField()
  name: string;

  @FilterableField()
  isEnabled: boolean;

  @FilterableField(() => Int)
  sortNo: number;

  @Field({ nullable: true })
  remark: string;
}

@InputType({ isAbstract: true })
export class BaseListInputDto {
  @IsNotEmpty()
  @MaxLength(64)
  @Field()
  name: string;

  @Field({ nullable: true })
  isEnabled: boolean;

  @Field(() => Int, { nullable: true })
  sortNo: number;

  @Field({ nullable: true })
  remark: string;
}
