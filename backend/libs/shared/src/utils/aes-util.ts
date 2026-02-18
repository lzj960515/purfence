/*
 * Copyright under the Parsec Tech Co., Ltd. Version 1.0;
 * you may not use this file except in compliance with the permit.
 * Copyright (c) 2018-2019 ChongQing Parsec Technology Corporation. All Rights Reserved.
 * Version 1.0
 */

import { createCipheriv, createDecipheriv } from 'crypto';

export namespace AESUtil {
  const encryptEncoding = 'hex';
  const secretSource = process.env.AES_SECRET || 'secret_template';
  const ivSource = process.env.AES_IV || 'vector_template';
  const secret = Buffer.from(secretSource).toString('hex').substring(0, 16);
  const iv = Buffer.from(ivSource).toString('hex').substring(0, 16);

  export function encrypt(data: string) {
    const cipher = createCipheriv('aes-128-cbc', secret, iv);
    let encrypted = cipher.update(data, 'utf8', encryptEncoding);
    encrypted += cipher.final(encryptEncoding);
    return encrypted;
  }

  export function decrypt(encrypted: string) {
    const decipher = createDecipheriv('aes-128-cbc', secret, iv);
    let data = decipher.update(encrypted, encryptEncoding, 'utf8');
    data += decipher.final('utf8');
    return data;
  }
}
