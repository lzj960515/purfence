import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRemoteGitFieldsToIssue1771905207 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add branchSuffix column to purfence_issue table
    await queryRunner.addColumn(
      'purfence_issue',
      new TableColumn({
        name: 'branchSuffix',
        type: 'varchar',
        length: '8',
        isNullable: true,
      }),
    );

    // Add remoteIssueData column to purfence_issue table
    await queryRunner.addColumn(
      'purfence_issue',
      new TableColumn({
        name: 'remoteIssueData',
        type: 'json',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('purfence_issue', 'remoteIssueData');
    await queryRunner.dropColumn('purfence_issue', 'branchSuffix');
  }
}
