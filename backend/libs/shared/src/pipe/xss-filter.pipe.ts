/*
 * Copyright under the Parsec Tech Co., Ltd. Version 1.0;
 * you may not use this file except in compliance with the permit.
 * Copyright (c) 2019 ChongQing Parsec Technology Corporation. All Rights Reserved.
 * Version 1.0
 */

/*
 * Created by Diluka on 2019/11/7.
 *
 *
 * ----------- 神 兽 佑 我 -----------
 *        ┏┓      ┏┓+ +
 *       ┏┛┻━━━━━━┛┻┓ + +
 *       ┃          ┃
 *       ┣     ━    ┃ ++ + + +
 *      ████━████   ┃+
 *       ┃          ┃ +
 *       ┃  ┴       ┃
 *       ┃          ┃ + +
 *       ┗━┓      ┏━┛  Code is far away from bug
 *         ┃      ┃       with the animal protecting
 *         ┃      ┃ + + + +
 *         ┃      ┃
 *         ┃      ┃ +
 *         ┃      ┃      +  +
 *         ┃      ┃    +
 *         ┃      ┗━━━┓ + +
 *         ┃          ┣┓
 *         ┃          ┏┛
 *         ┗┓┓┏━━━━┳┓┏┛ + + + +
 *          ┃┫┫    ┃┫┫
 *          ┗┻┛    ┗┻┛+ + + +
 * ----------- 永 无 BUG ------------
 */
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import * as _ from 'lodash';
import { FilterXSS } from 'xss';

@Injectable()
export class XssFilterPipe implements PipeTransform {
  private filter: FilterXSS;

  constructor() {
    this.filter = new FilterXSS({});
  }

  transform(value: any, metadata: ArgumentMetadata): any {
    switch (metadata.type) {
      case 'param':
      case 'query':
        if (_.isString(value)) {
          return this.filter.process(value);
        }
        break;
      case 'body':
        if (_.isObject(value)) {
          this.processObject(value);
          return value;
        }
        break;
    }
    return value;
  }

  private processObject(o: any) {
    if (_.isArray(o)) {
      for (const i of o) {
        this.processObject(i);
      }
    } else if (_.isPlainObject(o)) {
      for (const k of Object.keys(o)) {
        if (_.isString(o[k])) {
          o[k] = this.filter.process(o[k]);
        } else if (_.isObject(o[k])) {
          this.processObject(o[k]);
        }
      }
    }
  }
}
