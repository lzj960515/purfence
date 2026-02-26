import { gql } from '@apollo/client'

// ==================== Types ====================

export type WorkflowMode = 'STANDALONE' | 'COLLABORATIVE'

export interface WorkflowConfig {
  id?: string
  mode: WorkflowMode
  autoCreateIssue: boolean
  autoMerge: boolean
  autoPush: boolean
  requireManualApproval: boolean
}

export interface WorkflowConfigInput {
  mode: WorkflowMode
  autoCreateIssue?: boolean | null
  autoMerge?: boolean | null
  autoPush?: boolean | null
  requireManualApproval?: boolean | null
}

export interface UpdateWorkflowConfigInput {
  mode?: WorkflowMode | null
  autoCreateIssue?: boolean | null
  autoMerge?: boolean | null
  autoPush?: boolean | null
  requireManualApproval?: boolean | null
}

export interface ConfigureWorkflowArgs {
  projectId: string
  config: WorkflowConfigInput
}

// ==================== Queries ====================

export const GET_WORKFLOW_CONFIG = gql`
  query GetWorkflowConfig($projectId: String!) {
    workflowConfig(projectId: $projectId) {
      id
      mode
      autoCreateIssue
      autoMerge
      autoPush
      requireManualApproval
    }
  }
`

export const GET_WORKFLOW_CONFIG_OR_DEFAULT = gql`
  query GetWorkflowConfigOrDefault($projectId: String!) {
    workflowConfigOrDefault(projectId: $projectId) {
      id
      mode
      autoCreateIssue
      autoMerge
      autoPush
      requireManualApproval
    }
  }
`

export const CAN_COMPLETE_ISSUE = gql`
  query CanCompleteIssue($issueId: ID!) {
    canCompleteIssue(issueId: $issueId)
  }
`

export const GET_AVAILABLE_ISSUE_TRANSITIONS = gql`
  query GetAvailableIssueTransitions($issueId: ID!) {
    getAvailableIssueTransitions(issueId: $issueId)
  }
`

// ==================== Mutations ====================

export const CONFIGURE_WORKFLOW = gql`
  mutation ConfigureWorkflow($input: ConfigureWorkflowArgs!) {
    configureWorkflow(input: $input) {
      mode
      autoCreateIssue
      autoMerge
      autoPush
      requireManualApproval
    }
  }
`

export const UPDATE_WORKFLOW_CONFIG = gql`
  mutation UpdateWorkflowConfig($projectId: String!, $input: UpdateWorkflowConfigInput!) {
    updateWorkflowConfig(projectId: $projectId, input: $input) {
      mode
      autoCreateIssue
      autoMerge
      autoPush
      requireManualApproval
    }
  }
`

export const DELETE_WORKFLOW_CONFIG = gql`
  mutation DeleteWorkflowConfig($projectId: String!) {
    deleteWorkflowConfig(projectId: $projectId)
  }
`

export const COMPLETE_ISSUE = gql`
  mutation CompleteIssue($issueId: ID!) {
    completeIssue(issueId: $issueId) {
      id
      projectId
      title
      description
      status
      latestExecutionId
      workdir
      createdAt
      updatedAt
    }
  }
`

export const MANUAL_MERGE_ISSUE = gql`
  mutation ManualMergeIssue($issueId: ID!) {
    manualMergeIssue(issueId: $issueId) {
      id
      projectId
      title
      description
      status
      latestExecutionId
      workdir
      createdAt
      updatedAt
    }
  }
`

export const MANUAL_PUSH_ISSUE = gql`
  mutation ManualPushIssue($issueId: ID!) {
    manualPushIssue(issueId: $issueId) {
      id
      projectId
      title
      description
      status
      latestExecutionId
      workdir
      createdAt
      updatedAt
    }
  }
`

// ==================== Default Values ====================

export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  mode: 'STANDALONE',
  autoCreateIssue: true,
  autoMerge: true,
  autoPush: true,
  requireManualApproval: false,
}
