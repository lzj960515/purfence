// modified based on [node.js AES/ECB/PKCS5Padding 与其他语言的加密解密通用](http://yijiebuyi.com/blog/13e2ae33082ac12ba4946b033be04bb5.html)
import crypto, { BinaryLike, Encoding } from 'crypto';
import _ from 'lodash';

export class CryptoUtil {
  /**
   * 加解密必须使用同一套 key 和 iv
   * @param  {String} algorithm 算法名称，比如 `aes-128-ecb`
   * @param  {String} key       秘钥
   * @param  {String} iv        initialization vector，默认空字符串
   * @param autoPadding
   */
  constructor(
    private readonly algorithm: string,
    private readonly key: BinaryLike,
    private readonly iv: BinaryLike = '',
    private autoPadding = true,
  ) {}

  /**
   * 加密算法
   *
   * @param  {String} message         明文
   * @param  {String} messageEncoding 明文编码
   * @param  {String} cipherEncoding  密文编码
   *
   * @return {String} encrypted       密文
   */
  encrypt(
    message: string,
    messageEncoding: Encoding = 'utf8',
    cipherEncoding: Encoding = 'base64',
  ) {
    if (_.isNil(message)) return message;
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    cipher.setAutoPadding(this.autoPadding);

    let encrypted = cipher.update(message, messageEncoding, cipherEncoding);
    encrypted += cipher.final(cipherEncoding);

    return encrypted;
  }

  /**
   * 解密算法
   *
   * @param  {String} encrypted       密文
   * @param  {String} cipherEncoding  密文编码
   * @param  {String} messageEncoding 明文编码
   *
   * @return {String} decrypted       明文
   */
  decrypt(
    encrypted: string,
    cipherEncoding: Encoding = 'base64',
    messageEncoding: Encoding = 'utf8',
  ) {
    if (_.isNil(encrypted)) return encrypted;
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
    decipher.setAutoPadding(this.autoPadding);

    let decrypted = decipher.update(encrypted, cipherEncoding, messageEncoding);
    decrypted += decipher.final(messageEncoding);

    return decrypted;
  }
}
