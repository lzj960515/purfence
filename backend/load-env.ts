/// <reference types="jest-extended" />

/*
 * Copyright under the Parsec Tech Co., Ltd. Version 1.0;
 * you may not use this file except in compliance with the permit.
 * Copyright (c) 2020 ChongQing Parsec Technology Corporation. All Rights Reserved.
 * Version 1.0
 */

/*
 * Created by Diluka on 2020/1/20.
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

import { Logger } from '@nestjs/common';
import ms from 'ms';

if (!process.env.APP_ENV) {
  process.env.APP_ENV = 'test';
}

Logger.log(`*** Current APP_ENV for test is ${process.env.APP_ENV} ***`);

jest.setTimeout(ms('1 minute'));
