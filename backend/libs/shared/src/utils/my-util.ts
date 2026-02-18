/*
 * Copyright under the Parsec Tech Co., Ltd. Version 1.0;
 * you may not use this file except in compliance with the permit.
 * Copyright (c) 2019 ChongQing Parsec Technology Corporation. All Rights Reserved.
 * Version 1.0
 */

import { randomUUID } from 'crypto';
import { Response } from 'express';
import * as _ from 'lodash';
import * as mime from 'mime-types';
import moment, { MomentInput, unitOfTime } from 'moment';
import ms from 'ms';
import * as qs from 'qs';

export namespace MyUtil {
  export function uuid() {
    return randomUUID();
  }

  /**
   * sleep async
   * @param time milliseconds or human-readable time string
   */
  export async function sleep(time: number | ms.StringValue) {
    return new Promise<void>((resolve) =>
      setTimeout(() => resolve(), _.isString(time) ? ms(time) : time),
    );
  }

  /**
   * check if inp is expired.
   * if inp is null then it's never expired
   * @param inp
   * @param granularity
   */
  export function isExpired(
    inp: MomentInput,
    granularity?: unitOfTime.StartOf,
  ) {
    return inp && moment().isAfter(inp, granularity);
  }

  /**
   * copy all metadata from source to target
   * @param source
   * @param target
   */
  export function copyMetadata(source: any, target: any) {
    const metadataKeys = Reflect.getMetadataKeys(source);
    for (const metadataKey of metadataKeys) {
      Reflect.defineMetadata(
        metadataKey,
        Reflect.getMetadata(metadataKey, source),
        target,
      );
    }
  }

  export function setFileDownloadHeaders(res: Response, filename: string) {
    // 设置 header 使浏览器下载文件
    res.setHeader('Content-Description', 'File Transfer');
    res.setHeader('Content-Type', `${mime.lookup(filename)}; charset=utf-8`);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${encodeURIComponent(
        filename,
      )};filename*=utf-8''${encodeURIComponent(filename)}`,
    );
    res.setHeader('Expires', '0');
    res.setHeader('Cache-Control', 'must-revalidate');

    return res;
  }

  export function appendQueryParamsToUrl(
    url: string,
    queryParams: { [key: string]: any },
    isOverwrite?: boolean,
  ) {
    const urlArray = url.split('#');
    const [baseStr, qsStr] = urlArray[0].split('?');
    const qsObj: any = qsStr ? qs.parse(qsStr) : {};

    _.each(queryParams, (v, k) => {
      if (!isOverwrite && qsObj[k]) return;

      qsObj[k] = v;
    });

    const queryString = qs.stringify(qsObj);
    let returnUrl = baseStr + (queryString ? '?' + queryString : '');

    if (urlArray[1]) returnUrl += '#' + urlArray[1];

    return returnUrl;
  }

  // 修改function或者class的名称
  export function modifyFnName(fn: any, name: string) {
    if (_.isFunction(fn)) {
      const p = Object.getOwnPropertyDescriptor(fn, 'name');
      if (p) {
        p.value = name;
        Object.defineProperty(fn, 'name', p);
      }
    }
  }

  export function ensureStrInSafeLength(
    str: string,
    safeLen: number,
    suffix: string = '',
  ) {
    if (!_.isString(str) || !_.isNumber(safeLen) || str.length <= safeLen) {
      return str;
    }

    if (safeLen <= suffix.length) suffix = '';
    return str.substring(0, safeLen - suffix.length) + suffix;
  }

  export function delObjectKey<T>(
    obj: T,
    predicate?: (v: any, k: string | symbol) => boolean,
  ): T {
    if (_.isPlainObject(obj)) {
      for (const k of [
        ...Object.keys(obj),
        ...Object.getOwnPropertySymbols(obj),
      ]) {
        if (predicate && predicate(obj[k], k)) delete obj[k];
      }
    }

    return obj;
  }

  // delete key that the value is 'undefined'
  export function delUndefinedKey<T>(obj: T): T {
    return delObjectKey(obj, (v) => _.isUndefined(v));
  }

  // delete key that the value is 'null'
  export function delNullKey<T>(obj: T): T {
    return delObjectKey(obj, (v) => _.isNull(v));
  }

  // delete key that the value is 'null' or 'undefined'
  export function delNilKey<T>(obj: T): T {
    return delObjectKey(obj, (v) => _.isNil(v));
  }

  export type WeightUnit =
    | 'GRAMS'
    | 'G'
    | 'KILOGRAMS'
    | 'KG'
    | 'OUNCES'
    | 'OZ'
    | 'POUNDS'
    | 'LB'
    | 'grams'
    | 'g'
    | 'kilograms'
    | 'kg'
    | 'ounces'
    | 'oz'
    | 'pounds'
    | 'lb'
    | string;

  export function convertWeightToGram(
    weight: number,
    unit: WeightUnit,
    precision = 0,
  ) {
    weight = weight || 0;

    if (['GRAMS', 'G'].includes(unit.toLocaleUpperCase()))
      return +weight.toFixed(precision);

    if (['KILOGRAMS', 'KG'].includes(unit.toLocaleUpperCase()))
      return +(weight * 1000).toFixed(precision);

    if (['OUNCES', 'OZ'].includes(unit.toLocaleUpperCase()))
      return +(weight * 28.349523).toFixed(precision);

    if (['POUNDS', 'LB'].includes(unit.toLocaleUpperCase()))
      return +(weight * 453.59237).toFixed(precision);

    return +weight.toFixed(precision);
  }

  export function convertWeightToPounds(
    weight: number,
    unit: WeightUnit,
    precision = 2,
  ) {
    return +(convertWeightToGram(weight, unit, 6) / 453.59237).toFixed(
      precision,
    );
  }

  export namespace Sets {
    export function equals(
      a: ArrayLike<unknown> | Iterable<unknown>,
      b: ArrayLike<unknown> | Iterable<unknown>,
    ) {
      const as = _.isSet(a) ? a : new Set(Array.from(a));
      const bs = _.isSet(b) ? b : new Set(Array.from(b));
      return _.isEqual(as, bs);
    }
  }

  /**
   * boundary the value in [min,max]
   * @param value
   * @param min
   * @param max
   */
  export function boundary(value: number, min: number, max: number) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  export function equalIgnoreCase(a?: string, b?: string) {
    return _.toLower(a) === _.toLower(b);
  }

  /**
   * aop decorator
   * @param fn if return `undefined`, then use original result
   */
  export function aop<T>(fn: (result: T) => any) {
    return function (
      target: any,
      propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<T>>,
    ) {
      const originalMethod = descriptor.value;
      descriptor.value = async function (...args: any[]) {
        const result = await originalMethod.apply(this, args);
        const modifiedResult = await fn(result);
        return modifiedResult === undefined ? result : modifiedResult;
      };
      copyMetadata(originalMethod, descriptor.value);
      return descriptor;
    };
  }
}
