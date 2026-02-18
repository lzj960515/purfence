import { InputType, PartialType } from '@nestjs/graphql';
import { PurfenceAppConfigCreateInput } from './purfence-app-config-create.input';

@InputType()
export class PurfenceAppConfigUpdateInput extends PartialType(
  PurfenceAppConfigCreateInput,
) {}
