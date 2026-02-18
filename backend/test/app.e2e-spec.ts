import { INestApplication, Logger } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import _ from 'lodash';
import ms from 'ms';
import supertest from 'supertest';
import { quickSetupTest } from './utils/quick-setup-test';

jest.setTimeout(ms('1 minute'));

const logger = new Logger();

describe('AppController (e2e)', () => {
  let $: ReturnType<typeof supertest>;
  let app: INestApplication;
  beforeAll(async () => {
    [app] = await quickSetupTest();
    $ = supertest(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('/__health (GET)', async () => {
    // 1st time will fail
    await $.get('/__health');
    await $.get('/__health').expect(200);
  });

  describe('check db', () => {
    it('main', async () => {
      const ds = app.get(getDataSourceToken());

      for (const { target } of ds.entityMetadatas) {
        logger.log(`checking ${_.isFunction(target) ? target.name : target}`);
        const resp = ds.getRepository(target);
        await resp.findOneBy({});
      }
    });
  });
});
