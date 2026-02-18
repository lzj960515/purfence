import { TypeORMLogger } from '@app/shared';
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { LogLevel } from 'typeorm';
import yn from 'yn';

export default registerAs('typeorm', () => {
  const logging =
    yn(process.env.TYPEORM_LOGGING) ??
    (process.env.TYPEORM_LOGGING?.split(',') as LogLevel[]);
  const database = process.env.TYPEORM_DATABASE || './data/database.sqlite';

  return {
    type: 'sqlite',
    database,
    synchronize: yn(process.env.TYPEORM_SYNCHRONIZE) ?? true,
    autoLoadEntities: true,
    entityPrefix: 'tbl_',
    logging,
    logger: new TypeORMLogger(logging as any),
  } satisfies TypeOrmModuleOptions;
});
