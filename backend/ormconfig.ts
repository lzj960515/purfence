/*
 * Copyright under the Parsec Tech Co., Ltd. Version 1.0;
 * you may not use this file except in compliance with the permit.
 * Copyright (c) 2019 ChongQing Parsec Technology Corporation. All Rights Reserved.
 * Version 1.0
 */

/*
 * Created by Diluka on 2019-02-02.
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
import { ConfigType } from '@nestjs/config';
import * as _ from 'lodash';
import * as path from 'path';
import { DataSource } from 'typeorm';
import typeormConfig from './src/common/configs/typeorm.config';

const config: ConfigType<typeof typeormConfig> = typeormConfig();

const mode = process.env.TYPEORM_SEED ? 'seed' : 'migration';

const options = _.chain(config)
  .omit(['synchronize', 'dropSchema', 'cache', 'entities', 'autoLoadEntities'])
  .assign({
    entities: [
      path.join(__dirname, './src/**/*.entity.ts'),
      path.join(__dirname, './src/**/*.view.ts'),
    ],
    migrationsTableName: `${config.entityPrefix}${mode}s`,
    metadataTableName: `${config.entityPrefix}typeorm_metadata`,
    migrations: [`${mode}/*.ts`],
  })
  .value();

Logger.verbose(options, `typeorm cli config`);

export default new DataSource(options as any);
