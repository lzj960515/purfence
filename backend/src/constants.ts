import type { FilterComparisonOperators } from '@ptc-org/nestjs-query-core';
import type { CRUDResolverOpts } from '@ptc-org/nestjs-query-graphql';
import ms from 'ms';

export const defaultJobOptions = {
  removeOnFail: 100,
  removeOnComplete: 100,
  timeout: ms('30 minutes'),
};

// 没有独立接口的配置
export const noIndependentResolversOpts = {
  read: { disabled: true },
  create: { disabled: true },
  update: { disabled: true },
  delete: { disabled: true },
} satisfies CRUDResolverOpts<any>;

export const allowedComparisonsForEnums: FilterComparisonOperators<unknown>[] =
  ['eq', 'neq', 'in', 'notIn', 'is', 'isNot'];
