import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsAscii, IsNotEmpty, MaxLength } from 'class-validator';

@ArgsType()
export class IdArgs {
  @IsNotEmpty()
  @MaxLength(36)
  @IsAscii()
  @Field(() => ID, { description: 'ID' })
  id: string;
}
