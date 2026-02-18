import { applyDecorators } from '@nestjs/common';
import { IsAscii, IsNotEmpty, MaxLength } from 'class-validator';

export function IsId(): PropertyDecorator {
  return (target, propertyKey) => {
    applyDecorators(
      IsNotEmpty(),
      MaxLength(36),
      IsAscii(),
    )(target, propertyKey);
  };
}
