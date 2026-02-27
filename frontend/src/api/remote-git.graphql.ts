import { gql } from '@apollo/client'

// ==================== Types ====================

export type RemoteRepositoryType = 'GITLAB' | 'GITHUB'
export type RemoteRepositoryStatus = 'connected' | 'error' | 'expired'

export interface RemoteRepositoryConfig {
  type: RemoteRepositoryType
  url: string
  defaultBranch: string
  lastSyncedAt?: string | null
  status: RemoteRepositoryStatus
  errorMessage?: string | null
}

export interface RemoteRepositoryConfigInput {
  type: RemoteRepositoryType
  url: string
  token: string
  defaultBranch?: string | null
}

export interface UpdateRemoteRepositoryInput {
  type?: RemoteRepositoryType | null
  url?: string | null
  token?: string | null
  defaultBranch?: string | null
}

export interface ConnectionTestResult {
  success: boolean
  error?: string | null
  permissions?: string[] | null
}

export interface RemoteIssue {
  remoteIssueId: string
  remoteIssueNumber: number
  title: string
  description?: string | null
  state: string
  labels: string[]
  assignees: string[]
  remoteUrl: string
  createdAt: string
  updatedAt: string
}

export interface ImportRemoteIssueInput {
  projectId: string
  remoteIssueId: string
}

// ==================== Queries ====================

export const GET_REMOTE_REPOSITORY_CONFIG = gql`
  query GetRemoteRepositoryConfig($projectId: String!) {
    remoteRepositoryConfig(projectId: $projectId) {
      type
      url
      defaultBranch
      lastSyncedAt
      status
      errorMessage
    }
  }
`

export const GET_REMOTE_ISSUES = gql`
  query GetRemoteIssues($projectId: String!) {
    remoteIssues(projectId: $projectId) {
      remoteIssueId
      remoteIssueNumber
      title
      description
      state
      labels
      assignees
      remoteUrl
      createdAt
      updatedAt
    }
  }
`

export const GET_IMPORTED_REMOTE_ISSUES = gql`
  query GetImportedRemoteIssues($projectId: String!) {
    importedRemoteIssues(projectId: $projectId) {
      id
      projectId
      title
      description
      status
      origin
      branchSuffix
      remoteIssueData
      createdAt
      updatedAt
    }
  }
`

// ==================== Mutations ====================

export const CONFIGURE_REMOTE_REPOSITORY = gql`
  mutation ConfigureRemoteRepository($input: ConfigureRemoteRepositoryArgs!) {
    configureRemoteRepository(input: $input) {
      type
      url
      defaultBranch
      lastSyncedAt
      status
      errorMessage
    }
  }
`

export const UPDATE_REMOTE_REPOSITORY = gql`
  mutation UpdateRemoteRepository($projectId: String!, $input: UpdateRemoteRepositoryInput!) {
    updateRemoteRepository(projectId: $projectId, input: $input) {
      type
      url
      defaultBranch
      lastSyncedAt
      status
      errorMessage
    }
  }
`

export const DELETE_REMOTE_REPOSITORY = gql`
  mutation DeleteRemoteRepository($projectId: String!) {
    deleteRemoteRepository(projectId: $projectId)
  }
`

export const TEST_REMOTE_REPOSITORY_CONNECTION = gql`
  mutation TestRemoteRepositoryConnection($input: TestRemoteRepositoryConnectionArgs!) {
    testRemoteRepositoryConnection(input: $input) {
      success
      error
      permissions
    }
  }
`

export const IMPORT_REMOTE_ISSUE = gql`
  mutation ImportRemoteIssue($input: ImportRemoteIssueInput!) {
    importRemoteIssue(input: $input) {
      id
      projectId
      title
      description
      status
      origin
      branchSuffix
      remoteIssueData
      createdAt
      updatedAt
    }
  }
`

// ==================== Input Types for GraphQL ====================

export interface ConfigureRemoteRepositoryArgs {
  projectId: string
  config: RemoteRepositoryConfigInput
}

export interface TestRemoteRepositoryConnectionArgs {
  type: RemoteRepositoryType
  url: string
  token: string
}
