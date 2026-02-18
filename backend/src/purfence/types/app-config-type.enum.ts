import { registerEnumType } from '@nestjs/graphql';

export enum AppConfigType {
  SLACK = 'slack',
}

registerEnumType(AppConfigType, {
  name: 'AppConfigType',
  description: 'Third-party app integration type',
});
