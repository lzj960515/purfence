/*
 * Copyright under the Parsec Tech Co., Ltd. Version 1.0;
 * you may not use this file except in compliance with the permit.
 * Copyright (c) 2019 ChongQing Parsec Technology Corporation. All Rights Reserved.
 * Version 1.0
 */

import { ArgumentMetadata, BadRequestException } from '@nestjs/common';

export class ParameterJsonParseException extends BadRequestException {
  constructor(metadata: ArgumentMetadata) {
    super(
      {
        message: 'Parsing JSON parameter error',
        detail: `The parameter[${metadata.data}] JSON parsing error in request(${metadata.type}).`,
      },
      'ParameterJsonParseException',
    );
  }
}
