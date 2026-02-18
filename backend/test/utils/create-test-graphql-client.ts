/*
 * Copyright under the Parsec Tech Co., Ltd. Version 1.0;
 * you may not use this file except in compliance with the permit.
 * Copyright (c) 2020 ChongQing Parsec Technology Corporation. All Rights Reserved.
 * Version 1.0
 */

/*
 * Created by Diluka on 2020/6/12.
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
import { INestApplication } from '@nestjs/common';
import { DocumentNode, print } from 'graphql';
import supertest from 'supertest';

export type GQLClient = (doc: DocumentNode, variables?: any) => supertest.Test;

export function createTestGraphqlClient(app: INestApplication): GQLClient {
  const $ = supertest(app.getHttpServer());
  return (doc: DocumentNode, variables?: any) =>
    $.post('/graphql').send({ variables, query: print(doc) });
}
