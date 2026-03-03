import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableUnique,
} from 'typeorm';

export class CreateRemoteRepositoryConfigTable1771905206 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'remote_repository_config',
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
            name: 'type',
            type: 'varchar',
            length: '16',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'varchar',
            length: '512',
            isNullable: false,
          },
          {
            name: 'encryptedToken',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'defaultBranch',
            type: 'varchar',
            length: '64',
            default: "'main'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '16',
            default: "'connected'",
            isNullable: false,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'lastSyncedAt',
            type: 'datetime',
            isNullable: true,
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
      'remote_repository_config',
      new TableUnique({
        name: 'UQ_remote_repository_config_projectId',
        columnNames: ['projectId'],
      }),
    );

    // Add index on projectId
    await queryRunner.createIndex(
      'remote_repository_config',
      new TableIndex({
        name: 'IDX_remote_repository_config_projectId',
        columnNames: ['projectId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('remote_repository_config');
  }
}
