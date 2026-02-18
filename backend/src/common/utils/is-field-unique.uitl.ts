import { BaseEntity } from '@app/shared';
import _ from 'lodash';
import { BaseEntity as TypeORMBaseEntity } from 'typeorm';

export async function isFieldUnique(
  Entity: typeof BaseEntity,
  field: string,
  value: any,
  excludeIds?: string[],
  fieldScope?: string,
  valueScope?: any,
) {
  if (_.isEmpty(excludeIds)) {
    excludeIds = ['0'];
  }
  const q = (Entity as any as typeof TypeORMBaseEntity)
    .createQueryBuilder('O')
    .andWhere(`O.${field} = :value`, { value })
    .andWhere('O.id NOT IN (:...excludeIds)', { excludeIds })
    .select('O.id');
  if (fieldScope) {
    if (valueScope) {
      q.andWhere(`O.${fieldScope} = :valueScope`, { valueScope });
    } else {
      q.andWhere(`O.${fieldScope} IS NULL`);
    }
  }
  const found = await q.getOne();
  return !found;
}
