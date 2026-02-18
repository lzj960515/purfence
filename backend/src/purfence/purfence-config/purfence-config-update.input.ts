import { InputType, PartialType } from '@nestjs/graphql';
import { PurfenceConfigCreateInput } from './purfence-config-create.input';

@InputType()
export class PurfenceConfigUpdateInput extends PartialType(
  PurfenceConfigCreateInput,
) {}
