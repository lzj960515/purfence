import { INestApplication, Logger } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import ms from 'ms';
import gql from 'graphql-tag';
import { quickSetupTest } from './utils/quick-setup-test';
import { PurfenceIssue } from '../src/purfence/purfence-issue.entity';
import { PurfenceExecution } from '../src/purfence/purfence-execution.entity';
import { PurfenceProject } from '../src/purfence/purfence-project.entity';
import { PurfenceStatus } from '../src/purfence/purfence-status.enum';

jest.setTimeout(ms('1 minute'));

const logger = new Logger('PurfenceIssueDeleteE2E');

describe('PurfenceIssue Delete (e2e)', () => {
  let app: INestApplication;
  let client: ReturnType<
    typeof import('./utils/create-test-graphql-client').createTestGraphqlClient
  >;
  let dataSource: DataSource;

  beforeAll(async () => {
    [app, client] = await quickSetupTest();
    dataSource = app.get(getDataSourceToken());
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Clean up test data
    await dataSource.getRepository(PurfenceExecution).delete({});
    await dataSource.getRepository(PurfenceIssue).delete({});
    await dataSource.getRepository(PurfenceProject).delete({});
  });

  async function createTestProject() {
    const project = PurfenceProject.create({
      name: 'Test Project',
      slug: 'test-project',
      description: 'Test project for delete issue e2e',
    });
    await project.save();
    return project;
  }

  async function createTestIssue(projectId: string, status: PurfenceStatus) {
    const issue = PurfenceIssue.create({
      projectId,
      title: 'Test Issue',
      slug: `test-issue-${Date.now()}`,
      description: 'Test issue for delete e2e',
      status,
    });
    await issue.save();
    return issue;
  }

  async function createTestExecution(
    issueId: string,
    projectId: string,
    sessionId?: string,
  ) {
    const execution = PurfenceExecution.create({
      issueId,
      projectId,
      goal: 'Test goal',
      sessionId,
      status: PurfenceStatus.done,
    });
    await execution.save();
    return execution;
  }

  describe('deleteOnePurfenceIssue', () => {
    it('should successfully delete an open issue', async () => {
      // Arrange
      const project = await createTestProject();
      const issue = await createTestIssue(project.id, PurfenceStatus.open);

      const mutation = gql`
        mutation DeleteIssue($id: ID!) {
          deleteOnePurfenceIssue(input: { id: $id })
        }
      `;

      // Act
      const response = await client(mutation, { id: issue.id });

      // Assert
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.deleteOnePurfenceIssue).toBe(issue.id);

      // Verify issue is deleted
      const deletedIssue = await PurfenceIssue.findOne({
        where: { id: issue.id },
      });
      expect(deletedIssue).toBeNull();
    });

    it('should successfully delete a failed issue', async () => {
      // Arrange
      const project = await createTestProject();
      const issue = await createTestIssue(project.id, PurfenceStatus.failed);

      const mutation = gql`
        mutation DeleteIssue($id: ID!) {
          deleteOnePurfenceIssue(input: { id: $id })
        }
      `;

      // Act
      const response = await client(mutation, { id: issue.id });

      // Assert
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.deleteOnePurfenceIssue).toBe(issue.id);
    });

    it('should successfully delete a done issue', async () => {
      // Arrange
      const project = await createTestProject();
      const issue = await createTestIssue(project.id, PurfenceStatus.done);

      const mutation = gql`
        mutation DeleteIssue($id: ID!) {
          deleteOnePurfenceIssue(input: { id: $id })
        }
      `;

      // Act
      const response = await client(mutation, { id: issue.id });

      // Assert
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.deleteOnePurfenceIssue).toBe(issue.id);
    });

    it('should return error when deleting running issue', async () => {
      // Arrange
      const project = await createTestProject();
      const issue = await createTestIssue(project.id, PurfenceStatus.running);

      const mutation = gql`
        mutation DeleteIssue($id: ID!) {
          deleteOnePurfenceIssue(input: { id: $id })
        }
      `;

      // Act
      const response = await client(mutation, { id: issue.id });

      // Assert
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].extensions.code).toBe(
        'ISSUE_CANNOT_DELETE_RUNNING',
      );
    });

    it('should return error when deleting needs_user issue', async () => {
      // Arrange
      const project = await createTestProject();
      const issue = await createTestIssue(
        project.id,
        PurfenceStatus.needs_user,
      );

      const mutation = gql`
        mutation DeleteIssue($id: ID!) {
          deleteOnePurfenceIssue(input: { id: $id })
        }
      `;

      // Act
      const response = await client(mutation, { id: issue.id });

      // Assert
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].extensions.code).toBe(
        'ISSUE_CANNOT_DELETE_NEEDS_USER',
      );
    });

    it('should return error when deleting needs_approval issue', async () => {
      // Arrange
      const project = await createTestProject();
      const issue = await createTestIssue(
        project.id,
        PurfenceStatus.needs_approval,
      );

      const mutation = gql`
        mutation DeleteIssue($id: ID!) {
          deleteOnePurfenceIssue(input: { id: $id })
        }
      `;

      // Act
      const response = await client(mutation, { id: issue.id });

      // Assert
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].extensions.code).toBe(
        'ISSUE_CANNOT_DELETE_NEEDS_APPROVAL',
      );
    });

    it('should return error when issue not found', async () => {
      // Arrange
      const mutation = gql`
        mutation DeleteIssue($id: ID!) {
          deleteOnePurfenceIssue(input: { id: $id })
        }
      `;

      // Act
      const response = await client(mutation, { id: 'non-existent-id' });

      // Assert
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].extensions.code).toBe('ISSUE_NOT_FOUND');
    });

    it('should cascade delete associated executions', async () => {
      // Arrange
      const project = await createTestProject();
      const issue = await createTestIssue(project.id, PurfenceStatus.open);
      await createTestExecution(issue.id, project.id);
      await createTestExecution(issue.id, project.id);

      const mutation = gql`
        mutation DeleteIssue($id: ID!) {
          deleteOnePurfenceIssue(input: { id: $id })
        }
      `;

      // Act
      await client(mutation, { id: issue.id });

      // Assert
      const remainingExecutions = await PurfenceExecution.find({
        where: { issueId: issue.id },
      });
      expect(remainingExecutions).toHaveLength(0);
    });

    it('should handle issue with sessionIds in executions', async () => {
      // Arrange
      const project = await createTestProject();
      const issue = await createTestIssue(project.id, PurfenceStatus.open);
      await createTestExecution(issue.id, project.id, 'sess-1');
      await createTestExecution(issue.id, project.id, 'sess-2');

      const mutation = gql`
        mutation DeleteIssue($id: ID!) {
          deleteOnePurfenceIssue(input: { id: $id })
        }
      `;

      // Act - should not throw even if conversation cleanup fails
      const response = await client(mutation, { id: issue.id });

      // Assert
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.deleteOnePurfenceIssue).toBe(issue.id);
    });
  });
});
