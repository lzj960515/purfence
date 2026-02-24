import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableColumn,
} from 'typeorm';

export class CreateIssueQueueTable1771919297 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建 issue_queue 表
    await queryRunner.createTable(
      new Table({
        name: 'issue_queue',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            comment: 'ID',
          },
          {
            name: 'issueId',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '32',
            default: "'pending'",
          },
          {
            name: 'priority',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'startedAt',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'payload',
            type: 'json',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // 创建复合索引用于 dequeue 查询
    await queryRunner.createIndex(
      'issue_queue',
      new TableIndex({
        name: 'IDX_ISSUE_QUEUE_STATUS_PRIORITY_CREATED',
        columnNames: ['status', 'priority', 'createdAt'],
      }),
    );

    // 创建状态索引用于统计查询
    await queryRunner.createIndex(
      'issue_queue',
      new TableIndex({
        name: 'IDX_ISSUE_QUEUE_STATUS',
        columnNames: ['status'],
      }),
    );

    // 创建唯一索引
    await queryRunner.createIndex(
      'issue_queue',
      new TableIndex({
        name: 'IDX_ISSUE_QUEUE_ISSUE_ID',
        columnNames: ['issueId'],
        isUnique: true,
      }),
    );

    // 添加 maxIssueConcurrency 列到 purfence_config 表
    await queryRunner.addColumn(
      'purfence_config',
      new TableColumn({
        name: 'maxIssueConcurrency',
        type: 'int',
        default: 2,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.dropIndex('issue_queue', 'IDX_ISSUE_QUEUE_ISSUE_ID');
    await queryRunner.dropIndex('issue_queue', 'IDX_ISSUE_QUEUE_STATUS');
    await queryRunner.dropIndex(
      'issue_queue',
      'IDX_ISSUE_QUEUE_STATUS_PRIORITY_CREATED',
    );

    // 删除表
    await queryRunner.dropTable('issue_queue');

    // 删除 maxIssueConcurrency 列
    await queryRunner.dropColumn('purfence_config', 'maxIssueConcurrency');
  }
}
