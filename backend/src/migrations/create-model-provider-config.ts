import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateModelProviderConfig1738995200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'model_provider_config',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'provider',
            type: 'enum',
            enum: ['openai', 'kimi', 'zhipu', 'codex'],
            default: "'openai'",
          },
          {
            name: 'name',
            type: 'text',
          },
          {
            name: 'apiKey',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'refreshToken',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'baseUrl',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
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
            name: 'deletedAt',
            type: 'datetime',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'model_provider_config',
      new TableIndex({
        name: 'IDX_MODEL_PROVIDER_CONFIG_PROVIDER_NAME',
        columnNames: ['provider', 'name'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('model_provider_config');
  }
}
