import { Log } from '@nest-mods/log';
import { Logger, Type } from '@nestjs/common';
import DataLoader, { Options } from 'dataloader';
import _ from 'lodash';
import { BaseEntity } from 'typeorm';
import { MyUtil } from './my-util';

/**
 * 实体装载器
 * 使用BaseEntity.findByIds进行查询
 * @param Entity 实体类
 * @param options2 dataloader参数
 * @constructor
 * @see BaseEntity.findByIds
 */
export function EntityLoader<T extends BaseEntity>(
  Entity: Type<T> & typeof BaseEntity,
  options2?: Options<string, T>,
) {
  class EntityLoaderImpl extends DataLoader<string, T> {
    @Log('shared') private logger: Logger;

    constructor() {
      super(async (ids: string[]) => {
        const list: T[] = [];
        const list0 = await Entity.findByIds(ids);
        for (const id of ids) {
          list.push(_.find(list0, { id }) as T);
        }
        return list;
      }, options2);

      this.logger.debug(`创建实体装载器: ${Entity.name}`);
    }
  }

  MyUtil.modifyFnName(EntityLoaderImpl, `_${Entity.name}EntityLoader`);

  return EntityLoaderImpl as any as new () => DataLoader<string, T>;
}

/**
 * 创建实体装载器
 * @see EntityLoader
 */
export function createEntityLoader<T extends BaseEntity>(
  Entity: Type<T> & typeof BaseEntity,
  options2?: Options<string, T>,
) {
  return new (EntityLoader(Entity, options2))();
}
