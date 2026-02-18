import { Log } from '@nest-mods/log';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  @Log() private logger: Logger;

  constructor(private config: ConfigService) {}

  @Get()
  async index() {
    const name = this.config.get('server.name');
    const version = this.config.get('server.version');
    const profile = this.config.get('server.APP_ENV');
    const commitHash = this.config.get('server.commitHash');
    return `${name}@${version} | ${commitHash} [${profile}] is <span style='color:green'>ONLINE</span> pid: ${process.pid}`;
  }

  @Get('version')
  async version() {
    this.logger.verbose('version');
    const name = this.config.get('server.name');
    const version = this.config.get('server.version');
    const profile = this.config.get('server.APP_ENV');
    const commitHash = this.config.get('server.commitHash');
    return { name, version, profile, commitHash, pid: process.pid };
  }

  @Get('time')
  async time() {
    return new Date().toString();
  }

  @Get('__health')
  health() {
    return 'OK';
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Get('favicon.ico')
  async faviconico() {}

  @Get('hello')
  hello() {
    const service = this.config.get('server.name');
    return {
      message: 'Hello World!',
      timestamp: new Date().toISOString(),
      service,
    };
  }

  @Get('__echo')
  echo(@Query() qs: any, @Body() body: any) {
    return { qs, body };
  }
}
