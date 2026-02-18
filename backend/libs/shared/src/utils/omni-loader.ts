import { MyUtil } from '@app/shared';
import { Log } from '@nest-mods/log';
import { Logger } from '@nestjs/common';
import DataLoader, { Options } from 'dataloader';
import _ from 'lodash';

/**
 * 万用装载器
 * @param findAll 加载所有数据的方法
 * @param findOne 从结果中取得对应数据的方法
 * @param options 装载器配置
 * @constructor
 */
export function OmniLoader<T = any, K = string, C = K>(
  findAll: (tokens: K[]) => Promise<T[]> | T[],
  findOne?: ((list: T[], token: K) => T) | string,
  options?: Options<K, T, C>,
) {
  class OmniLoaderImpl extends DataLoader<K, T, C> {
    @Log('shared') private logger: Logger;

    constructor() {
      super(async (tokens) => {
        if (_.isEmpty(tokens)) return [];

        const list: T[] = [];
        const list0 = await findAll(tokens as any);
        if (_.isFunction(findOne)) {
          for (const token of tokens) {
            list.push(findOne(list0, token));
          }
        } else if (_.isString(findOne)) {
          for (const token of tokens) {
            list.push(_.find(list0, (o) => _.get(o, findOne) === token));
          }
        } else {
          list.push(...list0);
        }
        return list;
      }, options);

      this.logger.debug(`创建万用装载器`);
    }
  }

  MyUtil.modifyFnName(OmniLoaderImpl, _.uniqueId('_OmniLoader'));

  return OmniLoaderImpl as any as new () => DataLoader<K, T>;
}

/**
 * 创建万用装载器
 * @see OmniLoader
 */
export function createOmniLoader<T = any, K = string, C = K>(
  findAll: (tokens: K[]) => Promise<T[]> | T[],
  findOne?: ((list: T[], token: K) => T) | string,
  options?: Options<K, T, C>,
) {
  return new (OmniLoader(findAll, findOne, options))();
}
