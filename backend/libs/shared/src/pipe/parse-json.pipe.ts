/*
 * Copyright under the Parsec Tech Co., Ltd. Version 1.0;
 * you may not use this file except in compliance with the permit.
 * Copyright (c) 2019 ChongQing Parsec Technology Corporation. All Rights Reserved.
 * Version 1.0
 */
import { Log } from '@nest-mods/log';
import {
  ArgumentMetadata,
  Injectable,
  LoggerService,
  PipeTransform,
} from '@nestjs/common';
import * as _ from 'lodash';
import { ParameterJsonParseException } from '../error';

@Injectable()
export class ParseJsonPipe implements PipeTransform {
  @Log({ context: 'shared' }) private logger: LoggerService;

  transform(value: any, metadata: ArgumentMetadata): any {
    // this.logger.log({ value, metadata, level: 'silly' });
    if (_.isString(value)) {
      try {
        return JSON.parse(value);
      } catch (e) {
        throw new ParameterJsonParseException(metadata);
      }
    }
    return value;
  }
}
