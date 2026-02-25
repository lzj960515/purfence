import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Drop legacy tbl_issue_queue table
 *
 * Background:
 * - The queue system has been migrated from TypeORM to liteque
 * - liteque uses the 'tasks' table for job management
 * - The old tbl_issue_queue table is no longer used by any code
 * - This migration removes the deprecated table to keep the database clean
 *
 * Data Assessment:
 * - 9 records total (2 pending, 7 failed) in the old table
 * - All pending jobs are likely stale due to the migration
 * - Failed jobs have no value for migration
 * - No code references the old table
 *
 * Decision: Direct deletion without data migration
 * Rationale:
 *   1. Code has fully migrated to liteque's tasks table
 *   2. Only 2 pending records with low value
 *   3. 7 failed records have no migration value
 *   4. No TypeORM entity exists for this table
 *   5. Keeping deprecated tables causes database clutter
 */
export class DropLegacyIssueQueueTable1710000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the table exists before dropping
    const tableExists = await queryRunner.hasTable('tbl_issue_queue');

    if (tableExists) {
      // Log the data being removed for audit purposes
      const count = await queryRunner.query(
        'SELECT COUNT(*) as count FROM tbl_issue_queue',
      );
      console.log(
        `Dropping tbl_issue_queue table with ${count[0]?.count || 0} records`,
      );

      // Drop the table
      await queryRunner.dropTable('tbl_issue_queue', true, true, true);
      console.log('Successfully dropped tbl_issue_queue table');
    } else {
      console.log('tbl_issue_queue table does not exist, skipping migration');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the table (without data) for rollback purposes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tbl_issue_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issueId VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        priority INTEGER DEFAULT 0,
        attempts INTEGER DEFAULT 0,
        maxAttempts INTEGER DEFAULT 3,
        error TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        availableAt DATETIME,
        lockedAt DATETIME,
        lockedBy VARCHAR(255)
      )
    `);
    console.log('Recreated tbl_issue_queue table (empty)');
  }
}
