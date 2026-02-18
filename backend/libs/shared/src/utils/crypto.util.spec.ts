import { CryptoUtil } from './crypto.util';

describe('加密工具测试', () => {
  describe('基本测试', () => {
    const raw = '123456789';
    const encrypted = 'nv2B9Z9PYsv7mFq9HDJVbQ==';
    const cryptoUtil = new CryptoUtil(
      'aes-256-ecb',
      'UxMfGXByBCho7OSEH3gPBBCEnjosGi2s',
    );

    it('加密测试', () => {
      expect(cryptoUtil.encrypt(raw)).toEqual(encrypted);
    });

    it('解密测试', () => {
      expect(cryptoUtil.decrypt(encrypted)).toEqual(raw);
    });
  });

  describe('源启接口', () => {
    const raw = JSON.stringify([
      {
        grantType: 'auth_code',
        authCode: '90065414299761570779556945897640',
        refreshToken: null,
        sysTraceCode: null,
      },
    ]);
    const encrypted =
      'epwteXjo6OuV5tXWpja9m6Z+9ZjucT8cszAS14ZCcJjph8+I+gzo7CiNuG+tZwf7b92Ra74mIBcJyLvZcO0rbzjbLSes7JiRtC7yvYKfJlBtyLznZ4k7Zx7b+rbGgx/4ue6UAhINfrW8N00tZr9RCr/greG3SexxgB1wGDPY9Nc=';
    const key = Buffer.from('/LxY52qv48sPLV24PPIRQg==', 'base64');
    const cryptoUtil = new CryptoUtil('aes-128-cbc', key, key, false);

    it('加密测试', () => {
      let buf: Buffer = Buffer.from(raw);
      if (raw.length % 16) {
        buf = Buffer.alloc(raw.length + (16 - (raw.length % 16)), 0, null);
        Buffer.from(raw).copy(buf, 0, 0, raw.length);
      }
      expect(cryptoUtil.encrypt(buf.toString())).toEqual(encrypted);
    });

    it('解密测试', () => {
      const result = cryptoUtil.decrypt(encrypted);
      const data = result.replace(/\u0000*$/, '');
      expect(data).toEqual(raw);
    });
  });
});
