import { Logger } from '@nestjs/common';
import {
  BinaryLike,
  BinaryToTextEncoding,
  createHash,
  createHmac,
} from 'crypto';
import fs from 'fs';
import _ from 'lodash';

const logger = new Logger('hash');

function normalize(data: any) {
  return _.isPlainObject(data) || _.isArray(data) ? JSON.stringify(data) : data;
}

function hash(
  algorithm: string,
  data: any,
  encoding: BinaryToTextEncoding = 'hex',
) {
  return createHash(algorithm).update(normalize(data)).digest(encoding);
}

function hmac(
  algorithm: string,
  key: BinaryLike,
  data: any,
  encoding: BinaryToTextEncoding = 'hex',
  expected?: string,
) {
  const computed = createHmac(algorithm, key)
    .update(normalize(data))
    .digest(encoding);
  if (expected && expected !== computed) {
    logger.log(
      `HMAC(${algorithm}) not matched, expect ${expected}, received ${computed}, data=${normalize(
        data,
      )}`,
    );
    throw new Error(`HMAC Not Matched`);
  }
  return computed;
}

export function md5(data: any, encoding?: BinaryToTextEncoding) {
  return hash('md5', data, encoding);
}

export async function md5File(
  path: string,
  encoding: BinaryToTextEncoding = 'hex',
): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = createHash('md5');
    const input = fs.createReadStream(path);

    input.on('error', (err) => {
      reject(err);
    });

    output.once('readable', () => {
      resolve(output.digest(encoding));
    });

    input.pipe(output);
  });
}

export function md5Hmac(
  key: BinaryLike,
  data: any,
  encoding?: BinaryToTextEncoding,
) {
  return hmac('md5', key, data, encoding);
}

export function sha1Hmac(
  key: BinaryLike,
  data: any,
  encoding?: BinaryToTextEncoding,
  expected?: string,
) {
  return hmac('sha1', key, data, encoding, expected);
}

export function sha256Hmac(
  key: BinaryLike,
  data: any,
  encoding?: BinaryToTextEncoding,
  expected?: string,
) {
  return hmac('sha256', key, data, encoding, expected);
}

export function sha256(data: any, encoding?: BinaryToTextEncoding) {
  if (!data) return undefined;
  return hash('sha256', data, encoding);
}
