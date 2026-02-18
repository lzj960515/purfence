import { Logger } from '@nestjs/common';
import process from 'node:process';

beforeAll(() => {
  if (process.env.APP_ENV === 'test-ci') {
    Logger.overrideLogger(['fatal', 'error', 'warn']);
  }
});
