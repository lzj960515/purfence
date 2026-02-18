import { Type } from '@nestjs/common';
import { Filter, FilterFieldComparison } from '@ptc-org/nestjs-query-core';
import {
  EntityComparisonField,
  FilterQueryBuilder,
  WhereBuilder,
} from '@ptc-org/nestjs-query-typeorm/src/query';
import { Brackets, Repository, WhereExpressionBuilder } from 'typeorm';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export class MyWhereBuilder<Entity = any> extends WhereBuilder<Entity> {
  protected withFilterComparison<
    T extends keyof Entity,
    Where extends WhereExpressionBuilder,
  >(
    where: Where,
    field: T,
    cmp: FilterFieldComparison<Entity[T]>,
    relationNames: string[],
    alias?: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return super.withFilterComparison(where, field, cmp, relationNames, alias);
  }

  protected withRelationFilter<T extends keyof Entity>(
    where: WhereExpressionBuilder,
    field: T,
    cmp: Filter<Entity[T]>,
  ) {
    return where.andWhere(
      new Brackets((qb) => {
        const WB = this.chooseWhereBuilder(field as string);
        const relationWhere = new WB();
        // for now ignore relations of relations.
        return relationWhere.build(qb, cmp, [], field as string);
      }),
    );
  }

  protected chooseWhereBuilder(field: string): Type {
    return WhereBuilder;
  }
}

/**
 * 自定义查询
 * @param repo 数据库仓库
 * @param wb WhereBuilder
 * @see WhereBuilder
 */
export function createFilterQueryBuilder<Entity = any>(
  repo: Repository<Entity>,
  wb: WhereBuilder<Entity> | MyWhereBuilder<Entity>,
) {
  class CustomFilterQueryBuilder extends FilterQueryBuilder<Entity> {
    constructor(repo) {
      super(repo, wb as any);
    }
  }

  return new CustomFilterQueryBuilder(repo) as FilterQueryBuilder<Entity>;
}

// 将json字段的in查询翻译成like
export function withFilterComparisonJSONFieldInAsLike<
  Entity,
  T extends keyof Entity = keyof Entity,
>(...fields: T[]) {
  return function (
    where: WhereExpressionBuilder,
    field: T,
    cmp: FilterFieldComparison<Entity[T]>,
    relationNames?: string[],
    alias?: string,
  ) {
    if (fields.includes(field)) {
      if (relationNames?.includes(field as string)) {
        return this.withRelationFilter(where, field, cmp as Filter<Entity[T]>);
      }
      return where.andWhere(
        new Brackets((qb) => {
          const opts = Object.keys(cmp) as (keyof FilterFieldComparison<any>)[];
          const sqlComparisons = opts.flatMap((cmpType) => {
            const list = [];
            switch (cmpType) {
              case 'in':
                for (const o of cmp[cmpType] as string[]) {
                  list.push(
                    this.sqlComparisonBuilder.build(
                      field,
                      'like' as any,
                      `%${JSON.stringify(o[0])}%` as any,
                      alias,
                    ),
                  );
                }
                break;
              default:
                list.push(
                  this.sqlComparisonBuilder.build(
                    field,
                    cmpType,
                    cmp[cmpType] as EntityComparisonField<any, any>,
                    alias,
                  ),
                );
            }
            return list;
          });
          sqlComparisons.map(({ sql, params }) => qb.orWhere(sql, params));
        }),
      );
    }
  };
}
