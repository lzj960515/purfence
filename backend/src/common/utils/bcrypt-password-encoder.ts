import { IPasswordEncoder } from '@nest-mods/auth';
import bcrypt from 'bcryptjs';

export class BcryptPasswordEncoder implements IPasswordEncoder {
  private static instance: BcryptPasswordEncoder;

  static getInstance() {
    if (!this.instance) {
      this.instance = new BcryptPasswordEncoder();
    }
    return this.instance;
  }

  static encode(rawPassword: string): string {
    return this.getInstance().encode(rawPassword);
  }

  encode(rawPassword: string): string {
    return bcrypt.hashSync(rawPassword);
  }

  matches(rawPassword: string, encodedPassword: string): boolean {
    return bcrypt.compareSync(rawPassword, encodedPassword);
  }
}
