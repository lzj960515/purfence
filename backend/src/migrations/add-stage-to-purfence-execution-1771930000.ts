import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * 添加 stage 字段到 purfence_execution 表
 *
 * stage 字段用于标识当前 Execution 所处的阶段：
 * - tianji: 天机阶段（调度、分配任务）
 * - tianfu: 天府阶段（评估、规划下一步）
 */
export class AddStageToPurfenceExecution1771930000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加 stage 列，默认值为 'tianji'
    await queryRunner.addColumn(
      'purfence_execution',
      new TableColumn({
        name: 'stage',
        type: 'varchar',
        length: '32',
        default: "'tianji'",
        isNullable: false,
        comment: 'Execution 执行阶段：tianji=天机（调度）；tianfu=天府（评估）',
      }),
    );

    // 更新所有现有记录的 stage 为 'tianji'（确保旧数据正确迁移）
    await queryRunner.query(
      "UPDATE purfence_execution SET stage = 'tianji' WHERE stage IS NULL OR stage = ''",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除 stage 列
    await queryRunner.dropColumn('purfence_execution', 'stage');
  }
}
