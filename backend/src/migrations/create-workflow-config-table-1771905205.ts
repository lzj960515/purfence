import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableUnique,
} from 'typeorm';

export class CreateWorkflowConfigTable1771905205 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'workflow_config',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            comment: 'ID',
          },
          {
            name: 'projectId',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'mode',
            type: 'varchar',
            length: '16',
            default: "'standalone'",
            isNullable: false,
          },
          {
            name: 'autoCreateIssue',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'autoMerge',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'autoPush',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'requireManualApproval',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Add unique constraint on projectId
    await queryRunner.createUniqueConstraint(
      'workflow_config',
      new TableUnique({
        name: 'UQ_workflow_config_projectId',
        columnNames: ['projectId'],
      }),
    );

    // Add index on projectId
    await queryRunner.createIndex(
      'workflow_config',
      new TableIndex({
        name: 'IDX_workflow_config_projectId',
        columnNames: ['projectId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('workflow_config');
  }
}
