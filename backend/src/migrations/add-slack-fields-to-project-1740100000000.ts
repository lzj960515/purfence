import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSlackFieldsToProject1740100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add slackAppConfigId column to purfence_project table
    await queryRunner.addColumn(
      'purfence_project',
      new TableColumn({
        name: 'slackAppConfigId',
        type: 'varchar',
        length: '64',
        isNullable: true,
      }),
    );

    // Add slackChannelId column to purfence_project table
    await queryRunner.addColumn(
      'purfence_project',
      new TableColumn({
        name: 'slackChannelId',
        type: 'varchar',
        length: '128',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('purfence_project', 'slackChannelId');
    await queryRunner.dropColumn('purfence_project', 'slackAppConfigId');
  }
}
