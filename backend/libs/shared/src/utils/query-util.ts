import { SelectQueryBuilder } from 'typeorm';

// 查询是否有结果
export async function isFound(qb: SelectQueryBuilder<any>) {
  const found = await qb.select('1').limit(1).getRawOne();
  return !!found;
}
